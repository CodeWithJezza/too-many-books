import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import fixture from '../import/fixtures/libby-sample.json'
import { LibraryDB } from './db'
import { addEntry, eraseLibrary, importLibby } from './index'

let db: LibraryDB
beforeEach(() => {
  db = new LibraryDB(`t-${Math.random()}`)
})

describe('eraseLibrary', () => {
  it('empties everything, so the same export proposes every row again', async () => {
    await addEntry({ newWork: { title: 'Circe', author: '', genres: [] }, status: 'finished', reading: { format: 'ebook' }, loan: { library: 'x' } }, db)
    const first = await importLibby(fixture, 'a.json', db)
    await eraseLibrary(db)
    for (const t of [db.works, db.readings, db.loans, db.importRecords, db.imports, db.metadata, db.grRecords]) expect(await t.count()).toBe(0)
    const again = await importLibby(fixture, 'a.json', db)
    expect(again.added).toBe(first.added)
    expect(again.alreadySeen).toBe(0)
  })
})
