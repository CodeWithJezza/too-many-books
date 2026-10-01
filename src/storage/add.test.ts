import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { LibraryDB } from './db'
import { addEntry } from './index'

let db: LibraryDB
beforeEach(async () => {
  db = new LibraryDB(`t-${Math.random()}`)
})

describe('addEntry', () => {
  it('creates the Work and its first Reading together', async () => {
    const id = await addEntry({ newWork: { title: ' Circe ', author: 'Madeline Miller', genres: ['fantasy'] }, status: 'finished', reading: { format: 'ebook', finish: { y: 2026, m: 3 }, rating: 4.5 } }, db)
    expect((await db.works.get(id))?.title).toBe('Circe')
    expect(await db.readings.where('workId').equals(id).count()).toBe(1)
  })
  it('puts a Want to read Work on the shelf with no Reading', async () => {
    const id = await addEntry({ newWork: { title: 'Rebecca', author: '', genres: [] }, status: 'want' }, db)
    expect((await db.works.get(id))?.shelves).toEqual(['want'])
    expect(await db.readings.count()).toBe(0)
  })
  it('attaches a re-read to the existing Work and takes it off Want to read', async () => {
    const id = await addEntry({ newWork: { title: 'Dune', author: 'Frank Herbert', genres: [] }, status: 'want' }, db)
    await addEntry({ workId: id, status: 'reading', reading: { format: 'print', start: { y: 2026, m: 9, d: 1 } } }, db)
    expect(await db.works.count()).toBe(1)
    expect((await db.works.get(id))?.shelves).toEqual([])
  })
  it('records a library borrow tied to the new Reading, with the date left blank', async () => {
    const id = await addEntry({ newWork: { title: 'Piranesi', author: '', genres: [] }, status: 'finished', reading: { format: 'ebook', finish: { y: 2026, m: 3 } }, loan: { library: ' Sample County ' } }, db)
    const [r] = await db.readings.where('workId').equals(id).toArray()
    const [l] = await db.loans.toArray()
    expect(l).toMatchObject({ workId: id, readingId: r.id, source: 'manual', format: 'ebook', library: 'Sample County' })
    expect(l.borrowed).toBeUndefined()
  })
  it('stores a confirmed series and position on the new Work', async () => {
    const id = await addEntry({ newWork: { title: 'Saint, Vol. 4', author: '', genres: [], series: { name: 'Saint', position: 4 } }, status: 'want' }, db)
    expect((await db.works.get(id))?.series).toEqual({ name: 'Saint', position: 4 })
  })
  it('makes no loan for Want to read', async () => {
    await addEntry({ newWork: { title: 'Rebecca', author: '', genres: [] }, status: 'want', loan: { library: 'x' } }, db)
    expect(await db.loans.count()).toBe(0)
  })
  it('refuses a blank title and leaves nothing behind', async () => {
    await expect(addEntry({ newWork: { title: '  ', author: '', genres: [] }, status: 'want' }, db)).rejects.toThrow()
    expect(await db.works.count()).toBe(0)
  })
})
