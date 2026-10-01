import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { LibraryDB } from '../storage/db'
import { importLibby, resolveGroup, setDismissed } from '../storage'
import { buildGroups, isClean } from '../lib/inbox'
import { ImportFormatError, parseLibbyExport } from './libby'
import fixture from './fixtures/libby-sample.json'

describe('parseLibbyExport', () => {
  it('reads only Borrowed rows and identifies each by library, titleId and timestamp', () => {
    const { records, ignored } = parseLibbyExport(fixture)
    expect(records).toHaveLength(6)
    expect(ignored).toBe(1)
    expect(records[0].key).toBe('sample:1001:1786000000000')
  })
  it('leaves format unknown when the export does not say', () => {
    const r = parseLibbyExport(fixture).records.find((x) => x.titleId === '3003')!
    expect(r.format).toBeUndefined()
  })
  it('rejects a file that is not a Libby timeline, saying why', () => {
    expect(() => parseLibbyExport({ nope: 1 })).toThrow(ImportFormatError)
    expect(() => parseLibbyExport(null)).toThrow(/timeline/)
  })
  it('skips rows missing identity fields instead of guessing', () => {
    const res = parseLibbyExport({ timeline: [{ activity: 'Borrowed', title: { text: 'X' }, timestamp: 1 }] })
    expect(res.records).toHaveLength(0)
    expect(res.ignored).toBe(1)
  })
})

let db: LibraryDB
beforeEach(() => {
  db = new LibraryDB(`t-${Math.random()}`)
})

describe('importLibby', () => {
  it('stores records as pending and does not propose seen records again on re-import', async () => {
    expect(await importLibby(fixture, 'a.json', db)).toMatchObject({ found: 6, added: 6, alreadySeen: 0 })
    expect(await importLibby(fixture, 'a.json', db)).toMatchObject({ found: 6, added: 0, alreadySeen: 6 })
    expect(await db.importRecords.count()).toBe(6)
  })
  it('keeps dismissed records dismissed across a later import', async () => {
    await importLibby(fixture, 'a.json', db)
    const ids = (await db.importRecords.toArray()).map((r) => r.id!)
    await setDismissed(ids, true, db)
    await importLibby(fixture, 'b.json', db)
    expect(await db.importRecords.where('state').equals('pending').count()).toBe(0)
  })
  it('lets a dismissed record be restored', async () => {
    await importLibby(fixture, 'a.json', db)
    const id = (await db.importRecords.toArray())[0].id!
    await setDismissed([id], true, db)
    await setDismissed([id], false, db)
    expect((await db.importRecords.get(id))?.state).toBe('pending')
  })
})

describe('grouping and resolving', () => {
  it('groups repeat loans of the same title into one Work group, newest first', async () => {
    await importLibby(fixture, 'a.json', db)
    const groups = buildGroups(await db.importRecords.toArray(), [])
    const piranesi = groups.find((g) => g.title === 'Piranesi')!
    expect(piranesi.records).toHaveLength(3)
    expect(piranesi.records[0].borrowedAt).toBeGreaterThan(piranesi.records[1].borrowedAt)
    expect(piranesi.records.map((r) => r.titleId).sort()).toEqual(['1001', '1001', '2002'].slice(0, 3).sort())
    expect(groups).toHaveLength(4)
  })

  it('suggests a fuzzy match on title and author but does not call it clean', async () => {
    await db.works.add({ title: 'The Goblin Emperor', author: 'Katherine Addison', genres: [], tags: [], shelves: [] })
    await importLibby(fixture, 'a.json', db)
    const g = buildGroups(await db.importRecords.toArray(), await db.works.toArray()).find((x) => x.title === 'Goblin Emperor')!
    expect(g.match?.kind).toBe('fuzzy')
    expect(isClean(g)).toBe(false)
  })

  it('finishing creates a Work, a month-precision Reading from the newest borrow, and keeps the Loans', async () => {
    await importLibby(fixture, 'a.json', db)
    const recs = (await db.importRecords.toArray()).filter((r) => r.titleId === '1001')
    const workId = await resolveGroup({ recordIds: recs.map((r) => r.id!), resolution: { kind: 'finished', format: 'ebook' } }, db)
    const readings = await db.readings.where('workId').equals(workId).toArray()
    expect(readings).toHaveLength(1)
    expect(readings[0].finish).toEqual({ y: new Date(1786000000000).getFullYear(), m: new Date(1786000000000).getMonth() + 1 })
    expect(await db.loans.where('workId').equals(workId).count()).toBe(2)
    expect((await db.loans.toArray()).every((l) => l.readingId === readings[0].id)).toBe(true)
    expect((await db.works.get(workId))?.externalIds?.libby).toEqual(['1001'])
  })

  it('once a Work knows a titleId, a later import of that title is an exact, clean match', async () => {
    await importLibby(fixture, 'a.json', db)
    const first = (await db.importRecords.toArray()).find((r) => r.titleId === '1001')!
    const workId = await resolveGroup({ recordIds: [first.id!], resolution: { kind: 'finished', format: 'ebook' } }, db)
    const later = { ...first, id: 999, key: 'sample:1001:1', state: 'pending' as const }
    const g = buildGroups([later], await db.works.toArray())[0]
    expect(g.match).toMatchObject({ kind: 'exact', work: { id: workId } })
    expect(isClean(g)).toBe(true)
  })

  it('linking to an existing Work records Loans without making a Reading', async () => {
    const workId = (await db.works.add({ title: 'Project Hail Mary', author: 'Andy Weir', genres: [], tags: [], shelves: [] })) as number
    await importLibby(fixture, 'a.json', db)
    const rec = (await db.importRecords.toArray()).find((r) => r.titleId === '6006')!
    await resolveGroup({ recordIds: [rec.id!], resolution: { kind: 'link' }, workId }, db)
    expect(await db.readings.count()).toBe(0)
    expect(await db.loans.count()).toBe(1)
    expect((await db.loans.toArray())[0].readingId).toBeUndefined() // a borrow is not proof of a read
    expect((await db.importRecords.get(rec.id!))?.state).toBe('accepted')
  })

  it('want to read shelves the Work with no Reading', async () => {
    await importLibby(fixture, 'a.json', db)
    const rec = (await db.importRecords.toArray()).find((r) => r.titleId === '3003')!
    const workId = await resolveGroup({ recordIds: [rec.id!], resolution: { kind: 'want' } }, db)
    expect((await db.works.get(workId))?.shelves).toEqual(['want'])
    expect(await db.readings.count()).toBe(0)
  })

  it('refuses to resolve records twice', async () => {
    await importLibby(fixture, 'a.json', db)
    const rec = (await db.importRecords.toArray())[0]
    await resolveGroup({ recordIds: [rec.id!], resolution: { kind: 'want' } }, db)
    await expect(resolveGroup({ recordIds: [rec.id!], resolution: { kind: 'want' } }, db)).rejects.toThrow()
  })
})

import { resolveGroupWithReceipt, undoResolve } from '../storage'
describe('undoResolve', () => {
  it('removes a created Work, its Reading and Loans, and returns the records to the Inbox', async () => {
    await importLibby(fixture, 'a.json', db)
    const rec = (await db.importRecords.toArray()).find((r) => r.titleId === '1001')!
    const receipt = await resolveGroupWithReceipt({ recordIds: [rec.id!], resolution: { kind: 'finished', format: 'ebook' } }, db)
    await undoResolve(receipt, db)
    expect(await db.works.count()).toBe(0)
    expect(await db.readings.count()).toBe(0)
    expect(await db.loans.count()).toBe(0)
    expect((await db.importRecords.get(rec.id!))?.state).toBe('pending')
  })
  it('restores an existing Work exactly as it was', async () => {
    const workId = (await db.works.add({ title: 'Circe', author: 'Madeline Miller', genres: [], tags: [], shelves: ['want'] })) as number
    await importLibby(fixture, 'a.json', db)
    const rec = (await db.importRecords.toArray()).find((r) => r.titleId === '1001')!
    const receipt = await resolveGroupWithReceipt({ recordIds: [rec.id!], resolution: { kind: 'finished', format: 'ebook' }, workId }, db)
    expect((await db.works.get(workId))?.shelves).toEqual([])
    await undoResolve(receipt, db)
    const w = await db.works.get(workId)
    expect(w?.shelves).toEqual(['want'])
    expect(w?.externalIds?.libby ?? []).toEqual([])
    expect(await db.readings.count()).toBe(0)
  })
})

describe('new Work details from a lookup', () => {
  it('applies confirmed genres and Open Library details when the resolve creates the Work', async () => {
    await importLibby(fixture, 'a.json', db)
    const rec = (await db.importRecords.toArray()).find((r) => r.titleId === '3003')!
    const id = await resolveGroup({ recordIds: [rec.id!], resolution: { kind: 'finished', format: 'ebook' }, details: { genres: ['scifi'], pageCount: 300, openLibrary: '/works/OL1W', isbn: ['999'] } }, db)
    const w = await db.works.get(id)
    expect(w).toMatchObject({ genres: ['scifi'], pageCount: 300, externalIds: { openLibrary: ['/works/OL1W'], isbn: ['999'], libby: ['3003'] } })
  })
})
