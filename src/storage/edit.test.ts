import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { LibraryDB } from './db'
import { addEntry, deleteWork, saveWorkEdits } from './index'
import { applyGoodreadsUpdate, importGoodreads, resolveGoodreads } from './goodreads'
import csv from '../import/fixtures/goodreads-sample.csv?raw'

let db: LibraryDB
beforeEach(() => {
  db = new LibraryDB(`t-${Math.random()}`)
})

const base = { title: 'Circe', author: 'Madeline Miller', genres: [], tags: [], wantToRead: false }

async function circe() {
  const id = await addEntry({ newWork: { title: 'Circe', author: 'Madeline Miller', genres: ['fantasy'] }, status: 'finished', reading: { format: 'ebook', finish: { y: 2026, m: 3 }, rating: 4.5 } }, db)
  const [r] = await db.readings.where('workId').equals(id).toArray()
  return { id, readingId: r.id! }
}

describe('saveWorkEdits', () => {
  it('updates the Work and its Reading together', async () => {
    const { id, readingId } = await circe()
    await saveWorkEdits(id, { ...base, title: ' Circe (2018) ', genres: ['fantasy', 'historical'], tags: ['myth', ' myth ', ''], pageCount: 393, series: { name: 'Standalone', position: 1 } }, [{ id: readingId, status: 'finished', format: 'print', finish: { y: 2026, m: 3, d: 9 }, rating: 5, review: '  Beautiful ' }], db)
    const w = await db.works.get(id)
    expect(w).toMatchObject({ title: 'Circe (2018)', genres: ['fantasy', 'historical'], tags: ['myth'], pageCount: 393, series: { name: 'Standalone', position: 1 } })
    expect(await db.readings.get(readingId)).toMatchObject({ format: 'print', rating: 5, review: 'Beautiful', finish: { y: 2026, m: 3, d: 9 } })
  })

  it('adds a new reading and removes one that was left out', async () => {
    const { id, readingId } = await circe()
    await saveWorkEdits(id, base, [{ status: 'reading', format: 'audiobook', start: { y: 2026, m: 9, d: 1 }, finish: { y: 2026 } }], db)
    const rs = await db.readings.where('workId').equals(id).toArray()
    expect(rs).toHaveLength(1)
    expect(rs[0].id).not.toBe(readingId)
    expect(rs[0].finish).toBeUndefined() // a reading in progress has no finish date
  })

  it('moves a Work on and off Want to read without disturbing other shelves', async () => {
    const { id } = await circe()
    await db.works.update(id, { shelves: ['favourites'] })
    await saveWorkEdits(id, { ...base, wantToRead: true }, [], db)
    expect((await db.works.get(id))?.shelves).toEqual(['favourites', 'want'])
    await saveWorkEdits(id, { ...base, wantToRead: false }, [], db)
    expect((await db.works.get(id))?.shelves).toEqual(['favourites'])
  })

  it('refuses a blank title and changes nothing', async () => {
    const { id } = await circe()
    await expect(saveWorkEdits(id, { ...base, title: '  ' }, [], db)).rejects.toThrow()
    expect((await db.works.get(id))?.title).toBe('Circe')
    expect(await db.readings.count()).toBe(1)
  })

  it('keeps Loans and leaves unrated as unrated', async () => {
    const { id, readingId } = await circe()
    await db.loans.add({ workId: id, source: 'libby', borrowed: { y: 2026, m: 2 }, library: 'x' })
    await saveWorkEdits(id, base, [{ id: readingId, status: 'finished', format: 'ebook', finish: { y: 2026, m: 3 } }], db)
    expect(await db.loans.count()).toBe(1)
    expect((await db.readings.get(readingId))?.rating).toBeUndefined()
  })
})

describe('deleteWork', () => {
  it('removes the Work, its Readings and Loans, and nothing else', async () => {
    const a = await circe()
    const b = await addEntry({ newWork: { title: 'Dune', author: 'Frank Herbert', genres: [] }, status: 'want' }, db)
    await db.loans.add({ workId: a.id, source: 'libby', borrowed: { y: 2026 }, library: 'x' })
    await deleteWork(a.id, db)
    expect(await db.works.count()).toBe(1)
    expect((await db.works.toArray())[0].id).toBe(b)
    expect(await db.readings.count()).toBe(0)
    expect(await db.loans.count()).toBe(0)
  })
})

describe('edits protect against later Goodreads imports (ADR 0003)', () => {
  it('a rating edited through the editor is not proposed for overwrite', async () => {
    await importGoodreads(csv, 'a.csv', db)
    const gr = (await db.grRecords.where('bookId').equals('1001').first())!
    const { workId, readingId } = await resolveGoodreads({ recordId: gr.id!, as: 'finished', format: 'ebook' }, db)
    await saveWorkEdits(workId, { ...base, title: 'The Martian', author: 'Andy Weir' }, [{ id: readingId, status: 'finished', format: 'ebook', finish: { y: 2026, m: 8, d: 12 }, rating: 3, review: gr.seen.review }], db)
    // Goodreads later changes the rating to 4 and the review text.
    const rows = csv.split('\n')
    const s = await importGoodreads(csv.replace('"Loved it, ""truly"".', '"Now I am not sure.').replace(/,5,4\.11/, ',4,4.11'), 'b.csv', db)
    expect(s.updates + s.keptYours).toBeGreaterThan(0)
    if (s.updates) await applyGoodreadsUpdate((await db.grRecords.where('bookId').equals('1001').first())!.id!, 'ebook', db)
    expect((await db.readings.get(readingId))?.rating).toBe(3)
    void rows
  })
})
