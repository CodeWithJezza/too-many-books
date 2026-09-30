import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { LibraryDB } from '../storage/db'
import { applyGoodreadsUpdate, importGoodreads, keepMine, resolveGoodreads, setGoodreadsDismissed, undoResolveGoodreads, undoUpdate } from '../storage/goodreads'
import { GoodreadsFormatError, parseGoodreadsExport, parseGoodreadsDate, formatFromBinding } from './goodreads'
import { parseCsv } from './csv'
import csv from './fixtures/goodreads-sample.csv?raw'

describe('parseCsv', () => {
  it('handles quotes, commas and line breaks inside fields, and a BOM', () => {
    expect(parseCsv('﻿a,b\n"x,1","he said ""hi""\nnext"\n')).toEqual([['a', 'b'], ['x,1', 'he said "hi"\nnext']])
  })
  it('handles CRLF and a missing final newline', () => {
    expect(parseCsv('a,b\r\nc,d')).toEqual([['a', 'b'], ['c', 'd']])
  })
})

describe('parseGoodreadsExport', () => {
  const { records, ignored } = parseGoodreadsExport(csv)
  it('reads every row keyed by Book Id, with unrated as absent and unknown dates as absent', () => {
    expect(records).toHaveLength(5)
    expect(ignored).toBe(0)
    const m = records.find((r) => r.bookId === '1001')!
    expect(m.seen).toMatchObject({ title: 'The Martian', shelf: 'read', rating: 5, dateRead: '2026-08-12' })
    expect(m.seen.review).toBe('Loved it, "truly".\nSecond line of the review.')
    expect(records.find((r) => r.bookId === '1003')!.seen.rating).toBeUndefined()
    expect(records.find((r) => r.bookId === '1005')!.seen.dateRead).toBeUndefined()
  })
  it('unwraps the ="..." ISBN form and prefers ISBN13', () => {
    expect(records.find((r) => r.bookId === '1001')!.isbn).toBe('9780553418026')
    expect(records.find((r) => r.bookId === '1002')!.isbn).toBe('9780441172719')
  })
  it('suggests a format from the binding but leaves it undefined when unclear', () => {
    expect(formatFromBinding('Kindle Edition')).toBe('ebook')
    expect(formatFromBinding('Audible Audio')).toBe('audiobook')
    expect(formatFromBinding('Hardcover')).toBe('print')
    expect(formatFromBinding('')).toBeUndefined()
  })
  it('turns 2026/9/2 into an ISO date and treats anything else as unknown', () => {
    expect(parseGoodreadsDate('2026/9/2')).toBe('2026-09-02')
    expect(parseGoodreadsDate('September 2026')).toBeUndefined()
  })
  it('rejects a file that is not a Goodreads export, saying why', () => {
    expect(() => parseGoodreadsExport('a,b\n1,2')).toThrow(GoodreadsFormatError)
  })
})

let db: LibraryDB
beforeEach(() => {
  db = new LibraryDB(`t-${Math.random()}`)
})
const rec = (bookId: string) => db.grRecords.where('bookId').equals(bookId).first()
/** The fixture with one row's field changed, as a later export would have it. */
const withChange = (bookId: string, col: string, value: string) => {
  const rows = parseCsv(csv)
  const i = rows[0].indexOf(col)
  const r = rows.find((x) => x[0] === bookId)!
  r[i] = value
  return rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n')
}

describe('importGoodreads', () => {
  it('adds new rows as pending and skips unchanged rows silently on re-import', async () => {
    expect(await importGoodreads(csv, 'a.csv', db)).toMatchObject({ found: 5, added: 5 })
    expect(await importGoodreads(csv, 'a.csv', db)).toMatchObject({ added: 0, unchanged: 5, updates: 0 })
    expect(await db.grRecords.count()).toBe(5)
  })

  it('ignores columns it does not track, such as Average Rating', async () => {
    await importGoodreads(csv, 'a.csv', db)
    expect(await importGoodreads(withChange('1001', 'Average Rating', '3.01'), 'b.csv', db)).toMatchObject({ unchanged: 5, updates: 0 })
  })

  it('resolves a Read row into a Work with a finished Reading carrying rating, date and review', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const r = (await rec('1001'))!
    const { workId, readingId } = await resolveGoodreads({ recordId: r.id!, as: 'finished', format: 'ebook' }, db)
    const reading = await db.readings.get(readingId!)
    expect(reading).toMatchObject({ status: 'finished', format: 'ebook', rating: 5, finish: { y: 2026, m: 8, d: 12 } })
    expect((await db.works.get(workId))?.externalIds?.goodreads).toEqual(['1001'])
  })

  it('a Want to read row shelves the Work with no Reading', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const { workId } = await resolveGoodreads({ recordId: (await rec('1003'))!.id!, as: 'want', format: 'print' }, db)
    expect((await db.works.get(workId))?.shelves).toEqual(['want'])
    expect(await db.readings.count()).toBe(0)
  })

  it('undo removes what was created and returns the row to the Inbox', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const receipt = await resolveGoodreads({ recordId: (await rec('1001'))!.id!, as: 'finished', format: 'ebook' }, db)
    await undoResolveGoodreads(receipt, db)
    expect(await db.works.count()).toBe(0)
    const back = (await rec('1001'))!
    expect(back.state).toBe('pending')
    expect(back.applied).toBeUndefined()
  })

  it('a changed row returns as an update naming only the fields that changed', async () => {
    await importGoodreads(csv, 'a.csv', db)
    await resolveGoodreads({ recordId: (await rec('1003'))!.id!, as: 'want', format: 'print' }, db)
    const later = withChange('1003', 'Exclusive Shelf', 'read')
    const s = await importGoodreads(later, 'b.csv', db)
    expect(s.updates).toBe(1)
    expect(await rec('1003')).toMatchObject({ state: 'pending', changed: ['shelf'] })
  })

  it('applying a to-read to read update creates the Reading and takes the Work off Want to read', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const first = await resolveGoodreads({ recordId: (await rec('1003'))!.id!, as: 'want', format: 'print' }, db)
    let later = withChange('1003', 'Exclusive Shelf', 'read')
    later = (() => { const rows = parseCsv(later); const h = rows[0]; const r = rows.find((x) => x[0] === '1003')!; r[h.indexOf('My Rating')] = '4'; r[h.indexOf('Date Read')] = '2026/09/20'; return rows.map((row) => row.map((c) => `"${c}"`).join(',')).join('\n') })()
    await importGoodreads(later, 'b.csv', db)
    await applyGoodreadsUpdate((await rec('1003'))!.id!, 'print', db)
    const readings = await db.readings.where('workId').equals(first.workId).toArray()
    expect(readings).toHaveLength(1)
    expect(readings[0]).toMatchObject({ status: 'finished', rating: 4, finish: { y: 2026, m: 9, d: 20 } })
    expect((await db.works.get(first.workId))?.shelves).toEqual([])
    const done = (await rec('1003'))!
    expect(done.state).toBe('accepted')
    expect(done.changed).toBeUndefined()
  })

  it('local edits win: a field you changed in the app is never proposed for overwrite', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const { readingId } = await resolveGoodreads({ recordId: (await rec('1001'))!.id!, as: 'finished', format: 'ebook' }, db)
    await db.readings.update(readingId!, { rating: 2 }) // edited here
    const s = await importGoodreads(withChange('1001', 'My Rating', '3'), 'b.csv', db)
    expect(s).toMatchObject({ updates: 0, keptYours: 1 })
    expect((await db.readings.get(readingId!))?.rating).toBe(2)
    expect(await rec('1001')).toMatchObject({ state: 'accepted' })
  })

  it('a source change is applied only for untouched fields when both kinds changed', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const { readingId } = await resolveGoodreads({ recordId: (await rec('1001'))!.id!, as: 'finished', format: 'ebook' }, db)
    await db.readings.update(readingId!, { rating: 2 })
    const rows = parseCsv(csv); const h = rows[0]; const r = rows.find((x) => x[0] === '1001')!
    r[h.indexOf('My Rating')] = '3'; r[h.indexOf('My Review')] = 'Rewritten at Goodreads'
    await importGoodreads(rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n'), 'b.csv', db)
    expect((await rec('1001'))?.changed).toEqual(['review'])
    await applyGoodreadsUpdate((await rec('1001'))!.id!, 'ebook', db)
    expect(await db.readings.get(readingId!)).toMatchObject({ rating: 2, review: 'Rewritten at Goodreads' })
  })

  it('an update can be undone, and Keep mine changes nothing here', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const { workId } = await resolveGoodreads({ recordId: (await rec('1003'))!.id!, as: 'want', format: 'print' }, db)
    await importGoodreads(withChange('1003', 'Exclusive Shelf', 'read'), 'b.csv', db)
    const snap = await applyGoodreadsUpdate((await rec('1003'))!.id!, 'print', db)
    await undoUpdate(snap, db)
    expect((await db.works.get(workId))?.shelves).toEqual(['want'])
    expect(await db.readings.count()).toBe(0)
    expect(await rec('1003')).toMatchObject({ state: 'pending', changed: ['shelf'] })
    await keepMine((await rec('1003'))!.id!, db)
    expect(await db.readings.count()).toBe(0)
    expect((await rec('1003'))?.state).toBe('accepted')
  })

  it('a dismissed row that later changes returns for another look', async () => {
    await importGoodreads(csv, 'a.csv', db)
    await setGoodreadsDismissed([(await rec('1004'))!.id!], true, db)
    await importGoodreads(withChange('1004', 'Exclusive Shelf', 'read'), 'b.csv', db)
    expect((await rec('1004'))?.state).toBe('pending')
  })

  it('a dismissed row that does not change stays dismissed', async () => {
    await importGoodreads(csv, 'a.csv', db)
    await setGoodreadsDismissed([(await rec('1004'))!.id!], true, db)
    await importGoodreads(csv, 'b.csv', db)
    expect((await rec('1004'))?.state).toBe('dismissed')
  })
})

describe('pending rows and review text', () => {
  it('counts a still-pending row whose source changed as refreshed, not unchanged, and stores the new values', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const s = await importGoodreads(withChange('1003', 'Exclusive Shelf', 'read'), 'b.csv', db)
    expect(s).toMatchObject({ refreshed: 1, updates: 0 })
    expect((await rec('1003'))?.seen.shelf).toBe('read')
  })
  it('reports which fields were applied and which were left because you edited them', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const { readingId } = await resolveGoodreads({ recordId: (await rec('1001'))!.id!, as: 'finished', format: 'ebook' }, db)
    await db.readings.update(readingId!, { rating: 2 })
    const rows = parseCsv(csv); const h = rows[0]; const r = rows.find((x) => x[0] === '1001')!
    r[h.indexOf('My Review')] = 'New words'; r[h.indexOf('My Rating')] = '3'
    await importGoodreads(rows.map((row) => row.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n'), 'b.csv', db)
    const snap = await applyGoodreadsUpdate((await rec('1001'))!.id!, 'ebook', db)
    expect(snap.applied).toEqual(['review'])
    expect(snap.left).toEqual([])
  })
  it('turns Goodreads HTML in reviews into plain text', async () => {
    const { plainText } = await import('./goodreads')
    expect(plainText('Great<br/>book &amp; fun<br />Twice &quot;yes&quot;')).toBe('Great\nbook & fun\nTwice "yes"')
  })
})

describe('cover persistence', () => {
  it('a Work created from a Goodreads row keeps the Open Library cover and page count it was given', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const { workId } = await resolveGoodreads({ recordId: (await rec('1001'))!.id!, as: 'finished', format: 'ebook', details: { coverUrl: 'https://covers.example/1.jpg', pageCount: 407, openLibrary: '/works/OL1W' } }, db)
    expect(await db.works.get(workId)).toMatchObject({ coverUrl: 'https://covers.example/1.jpg', pageCount: 407, externalIds: { openLibrary: ['/works/OL1W'], goodreads: ['1001'] } })
  })
})
