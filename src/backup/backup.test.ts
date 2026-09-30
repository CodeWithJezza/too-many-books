import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { LibraryDB } from '../storage/db'
import { addEntry, importLibby } from '../storage'
import fixture from '../import/fixtures/libby-sample.json'
import { BackupFormatError, createBackup, readingsCsv, restoreBackup, validateBackup } from './backup'

let db: LibraryDB
beforeEach(() => {
  db = new LibraryDB(`t-${Math.random()}`)
})

async function seed() {
  await addEntry({ newWork: { title: 'Circe', author: 'Madeline Miller', genres: ['fantasy'] }, status: 'finished', reading: { format: 'ebook', finish: { y: 2026, m: 3 }, rating: 4.5, review: 'Loved it, "truly"' } }, db)
  await importLibby(fixture, 'a.json', db)
  const dismissed = (await db.importRecords.toArray())[0]
  await db.importRecords.update(dismissed.id!, { state: 'dismissed' })
}

describe('backup and restore', () => {
  it('round-trips everything, including dismissed Import records, and preserves ids', async () => {
    await seed()
    const backup = JSON.parse(JSON.stringify(await createBackup(db)))
    await db.works.clear(); await db.readings.clear(); await db.importRecords.clear()
    await addEntry({ newWork: { title: 'Something else', author: '', genres: [] }, status: 'want' }, db)

    const { file, summary } = validateBackup(backup)
    expect(summary.works).toBe(1)
    await restoreBackup(db, file)

    expect((await db.works.toArray()).map((w) => w.title)).toEqual(['Circe'])
    expect(await db.readings.count()).toBe(1)
    expect(await db.importRecords.count()).toBe(6)
    expect(await db.importRecords.where('state').equals('dismissed').count()).toBe(1)
  })

  it('does not refill the Inbox after a restore: a re-import proposes nothing already seen', async () => {
    await seed()
    const file = validateBackup(JSON.parse(JSON.stringify(await createBackup(db)))).file
    await restoreBackup(db, file)
    expect(await importLibby(fixture, 'again.json', db)).toMatchObject({ added: 0, alreadySeen: 6 })
  })

  it('replaces rather than merges', async () => {
    await seed()
    const file = validateBackup(JSON.parse(JSON.stringify(await createBackup(db)))).file
    await addEntry({ newWork: { title: 'Added later', author: '', genres: [] }, status: 'want' }, db)
    await restoreBackup(db, file)
    expect((await db.works.toArray()).map((w) => w.title)).toEqual(['Circe'])
  })

  it('rejects damaged or foreign files before touching the library', async () => {
    await seed()
    expect(() => validateBackup({ hello: 1 })).toThrow(BackupFormatError)
    const good = JSON.parse(JSON.stringify(await createBackup(db)))
    expect(() => validateBackup({ ...good, formatVersion: 99 })).toThrow(/newer version/)
    expect(() => validateBackup({ ...good, tables: { ...good.tables, readings: [{ workId: 999 }] } })).toThrow(/points to a book/)
    expect(await db.works.count()).toBe(1)
  })

  it('rolls back and keeps the current library if the restore fails midway', async () => {
    await seed()
    const good = validateBackup(JSON.parse(JSON.stringify(await createBackup(db)))).file
    const bad = { ...good, tables: { ...good.tables, importRecords: [...good.tables.importRecords, good.tables.importRecords[0]] } }
    await expect(restoreBackup(db, bad)).rejects.toThrow()
    expect(await db.works.count()).toBe(1)
    expect(await db.importRecords.count()).toBe(6)
  })
})

describe('readingsCsv', () => {
  it('quotes commas and quotes, states precision, and leaves unknown blank', async () => {
    await seed()
    const csv = readingsCsv(await db.works.toArray(), await db.readings.toArray())
    expect(csv).toContain('"Loved it, ""truly"""')
    expect(csv).toContain('Mar 2026,month,4.5')
  })
})

import csvSample from '../import/fixtures/goodreads-sample.csv?raw'
import { importGoodreads } from '../storage/goodreads'
describe('backup with Goodreads records', () => {
  it('round-trips Goodreads records so a restore does not refill the Inbox', async () => {
    await importGoodreads(csvSample, 'g.csv', db)
    const file = validateBackup(JSON.parse(JSON.stringify(await createBackup(db)))).file
    await db.grRecords.clear()
    await restoreBackup(db, file)
    expect(await db.grRecords.count()).toBe(5)
    expect(await importGoodreads(csvSample, 'g2.csv', db)).toMatchObject({ added: 0, unchanged: 5 })
  })
  it('accepts an older backup that has no Goodreads table', async () => {
    const old = JSON.parse(JSON.stringify(await createBackup(db)))
    delete old.tables.grRecords
    await restoreBackup(db, validateBackup(old).file)
    expect(await db.grRecords.count()).toBe(0)
  })
})
