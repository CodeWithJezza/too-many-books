import type { LibraryDB } from '../storage/db'
import { formatDate, dateKey } from '../lib/dates'
import { markBackedUp, untracked } from './changes'
import type { GoodreadsRecord, ImportRecord, ImportRun, Loan, Reading, Work } from '../types'
import type { CachedSearch } from '../storage/db'

export const BACKUP_APP = 'too-many-books'
export const BACKUP_FORMAT = 1

/** Everything, including Import records with their remembered state, so a restore does not refill the Inbox (ADR 0005). */
export interface BackupFile {
  app: typeof BACKUP_APP
  formatVersion: number
  exportedAt: string
  tables: {
    works: Work[]
    readings: Reading[]
    loans: Loan[]
    importRecords: ImportRecord[]
    imports: ImportRun[]
    metadata: CachedSearch[]
    /** Absent in backups made before Goodreads import existed. */
    grRecords?: GoodreadsRecord[]
  }
}

export class BackupFormatError extends Error {}

export async function createBackup(store: LibraryDB, now = new Date()): Promise<BackupFile> {
  const [works, readings, loans, importRecords, imports, metadata, grRecords] = await Promise.all([
    store.works.toArray(), store.readings.toArray(), store.loans.toArray(),
    store.importRecords.toArray(), store.imports.toArray(), store.metadata.toArray(), store.grRecords.toArray(),
  ])
  return { app: BACKUP_APP, formatVersion: BACKUP_FORMAT, exportedAt: now.toISOString(), tables: { works, readings, loans, importRecords, imports, metadata, grRecords } }
}

export function backupFileName(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `too-many-books-backup-${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}.json`
}

export interface BackupSummary {
  exportedAt: string
  works: number
  readings: number
  loans: number
  importRecords: number
}

/** Checks a parsed file before anything is touched. Throws a message the reader can act on. */
export function validateBackup(json: unknown): { file: BackupFile; summary: BackupSummary } {
  const f = json as Partial<BackupFile> | null
  if (!f || f.app !== BACKUP_APP || typeof f.tables !== 'object' || f.tables === null) {
    throw new BackupFormatError('This is not a Too Many Books backup file.')
  }
  if (typeof f.formatVersion !== 'number' || f.formatVersion > BACKUP_FORMAT) {
    throw new BackupFormatError('This backup was made by a newer version of the app. Update the app, then try again.')
  }
  const t = f.tables as Record<string, unknown>
  for (const k of ['works', 'readings', 'loans', 'importRecords', 'imports', 'metadata']) {
    if (!Array.isArray(t[k])) throw new BackupFormatError(`The backup is damaged: its "${k}" list is missing.`)
  }
  const tables = t as unknown as BackupFile['tables']
  const workIds = new Set<number>()
  for (const w of tables.works) {
    if (typeof w?.id !== 'number' || typeof w.title !== 'string') throw new BackupFormatError('The backup is damaged: a book has no id or title.')
    workIds.add(w.id)
  }
  for (const r of [...tables.readings, ...tables.loans]) {
    if (!workIds.has(r.workId)) throw new BackupFormatError('The backup is damaged: a reading or loan points to a book that is not in the file.')
  }
  const readingIds = new Set(tables.readings.map((r) => r.id))
  for (const l of tables.loans) {
    if (l.readingId !== undefined && !readingIds.has(l.readingId)) throw new BackupFormatError('The backup is damaged: a loan points to a reading that is not in the file.')
  }
  if (tables.grRecords !== undefined && !Array.isArray(tables.grRecords)) throw new BackupFormatError('The backup is damaged: its "grRecords" list is not a list.')
  for (const r of tables.grRecords ?? []) {
    if (typeof r?.bookId !== 'string' || typeof r.id !== 'number') throw new BackupFormatError('The backup is damaged: a Goodreads record has no Book Id.')
  }
  for (const r of tables.importRecords) {
    if (typeof r?.key !== 'string' || typeof r.id !== 'number') throw new BackupFormatError('The backup is damaged: an import record has no key.')
  }
  return {
    file: f as BackupFile,
    summary: {
      exportedAt: typeof f.exportedAt === 'string' ? f.exportedAt : '',
      works: tables.works.length, readings: tables.readings.length, loans: tables.loans.length, importRecords: tables.importRecords.length + (tables.grRecords?.length ?? 0),
    },
  }
}

/**
 * Replaces the whole library with the file's contents in one transaction. Nothing is merged
 * (ADR 0005), and if anything fails the transaction rolls back and the current library stays.
 */
export async function restoreBackup(store: LibraryDB, file: BackupFile): Promise<void> {
  const t = file.tables
  await untracked(() =>
    store.transaction('rw', [store.works, store.readings, store.loans, store.importRecords, store.imports, store.metadata, store.grRecords], async () => {
      await Promise.all([store.works.clear(), store.readings.clear(), store.loans.clear(), store.importRecords.clear(), store.imports.clear(), store.metadata.clear(), store.grRecords.clear()])
      await store.works.bulkAdd(t.works)
      await store.readings.bulkAdd(t.readings)
      await store.loans.bulkAdd(t.loans)
      await store.importRecords.bulkAdd(t.importRecords)
      await store.imports.bulkAdd(t.imports)
      await store.metadata.bulkAdd(t.metadata)
      await store.grRecords.bulkAdd(t.grRecords ?? [])
    }),
  )
  markBackedUp()
}

// ---------- one-way CSV of reading history (not importable) ----------

const csvCell = (v: unknown): string => {
  const s = v === undefined || v === null ? '' : String(v)
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

const precisionOf = (d?: { m?: number; d?: number }) => (!d ? 'unknown' : d.m && d.d ? 'day' : d.m ? 'month' : 'year')

export function readingsCsv(works: Work[], readings: Reading[]): string {
  const byId = new Map(works.map((w) => [w.id!, w]))
  const rows = [...readings]
    .sort((a, b) => (dateKey(b.finish) ?? -1) - (dateKey(a.finish) ?? -1))
    .map((r) => {
      const w = byId.get(r.workId)
      return [w?.title, w?.author, r.status, r.format, r.start ? formatDate(r.start) : '', r.finish ? formatDate(r.finish) : '', precisionOf(r.finish), r.rating, r.review]
    })
  const head = ['Title', 'Author', 'Status', 'Format', 'Started', 'Finished', 'Finish precision', 'Rating', 'Review']
  // A leading BOM keeps Excel from mangling accented titles.
  return '﻿' + [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n') + '\r\n'
}

export { markBackedUp }
