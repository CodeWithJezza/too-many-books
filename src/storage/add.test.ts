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
  it('refuses a blank title and leaves nothing behind', async () => {
    await expect(addEntry({ newWork: { title: '  ', author: '', genres: [] }, status: 'want' }, db)).rejects.toThrow()
    expect(await db.works.count()).toBe(0)
  })
})
