import { useLiveQuery } from 'dexie-react-hooks'
import type { LibraryDB } from './db'
import { db } from './instance'
export { db }
import { buildSeed } from './seed'
import { untracked } from '../backup/changes'
import { openLibrary } from '../metadata/openLibrary'
import type { MetadataHit } from '../metadata/types'
import { parseLibbyExport } from '../import/libby'
import type { DatePart, Format, GenreId, GoodreadsRecord, ImportRecord, Reading, ReadingStatus, RecordState, Work, WorkDetail, WorkSummary } from '../types'

/**
 * The only module screens talk to for data. Dexie stays behind this seam so a
 * synced backend could replace it (ADR 0001, ADR 0006).
 */

/** Latest reading is the last one recorded for the Work. */
const latestOf = (readings: Reading[]) => readings.at(-1)

export async function seedIfEmpty(store: LibraryDB = db): Promise<void> {
  if ((await store.works.count()) > 0) return
  await untracked(() => store.transaction('rw', store.works, store.readings, store.loans, async () => {
    for (const s of buildSeed()) {
      const workId = (await store.works.add(s.work)) as number
      for (const r of s.readings) await store.readings.add({ ...r, workId })
      if (s.loan) await store.loans.add({ ...s.loan, workId })
    }
  }))
}

export async function requestPersistence(): Promise<void> {
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* best effort; backups are the safety net (ADR 0005) */
  }
}

export async function clearSampleData(store: LibraryDB = db): Promise<void> {
  const ids = (await store.works.filter((w) => !!w.synthetic).primaryKeys()) as number[]
  await untracked(() =>
    store.transaction('rw', store.works, store.readings, store.loans, async () => {
      await store.readings.where('workId').anyOf(ids).delete()
      await store.loans.where('workId').anyOf(ids).delete()
      await store.works.bulkDelete(ids)
    }),
  )
}

/** undefined while loading. */
export function useWorks(): WorkSummary[] | undefined {
  return useLiveQuery(async () => {
    const [works, readings] = await Promise.all([db.works.toArray(), db.readings.orderBy('id').toArray()])
    const by = new Map<number, Reading[]>()
    for (const r of readings) by.set(r.workId, [...(by.get(r.workId) ?? []), r])
    return works.map((w) => {
      const rs = by.get(w.id!) ?? []
      return { ...w, id: w.id!, latest: latestOf(rs), readingCount: rs.length }
    })
  }, [])
}

export function useWorkDetail(id: number | undefined): WorkDetail | undefined | null {
  return useLiveQuery(
    async () => {
      if (id === undefined) return null
      const work = await db.works.get(id)
      if (!work) return null
      const [readings, loans] = await Promise.all([
        db.readings.where('workId').equals(id).sortBy('id'),
        db.loans.where('workId').equals(id).toArray(),
      ])
      return { ...work, id, readings, loans, latest: latestOf(readings), readingCount: readings.length }
    },
    [id],
  )
}

// ---------- Add (ADR 0007) ----------

export type AddStatus = ReadingStatus | 'want'

export interface AddInput {
  /** Attach to an existing Work, or create one from these fields. Never both. */
  workId?: number
  newWork?: Pick<Work, 'title' | 'author' | 'genres' | 'pageCount' | 'coverUrl' | 'externalIds'>
  status: AddStatus
  reading?: Pick<Reading, 'format' | 'start' | 'finish' | 'rating' | 'review'>
}

/**
 * One transaction: the Work (when new) and its first Reading or Shelf placement
 * are created together, so a bare empty Work can never exist.
 */
export async function addEntry(input: AddInput, store: LibraryDB = db): Promise<number> {
  return store.transaction('rw', store.works, store.readings, async () => {
    let workId = input.workId
    if (workId === undefined) {
      if (!input.newWork?.title.trim()) throw new Error('A title is required')
      workId = (await store.works.add({
        ...input.newWork,
        title: input.newWork.title.trim(),
        author: input.newWork.author.trim(),
        tags: [],
        shelves: input.status === 'want' ? ['want'] : [],
      })) as number
    } else if (input.status === 'want') {
      const w = await store.works.get(workId)
      if (w && !w.shelves.includes('want')) await store.works.update(workId, { shelves: [...w.shelves, 'want'] })
    }
    if (input.status !== 'want') {
      if (!input.reading) throw new Error('A reading needs a format')
      await store.readings.add({ ...input.reading, workId, status: input.status })
      // A Reading means it is no longer just wanted.
      const w = await store.works.get(workId)
      if (w?.shelves.includes('want')) await store.works.update(workId, { shelves: w.shelves.filter((s) => s !== 'want') })
    }
    return workId
  })
}

/** Cached metadata search: suggestions only, and usable offline for queries already seen. */
export async function searchMetadata(query: string, signal?: AbortSignal, store: LibraryDB = db): Promise<MetadataHit[]> {
  const key = query.trim().toLowerCase()
  const cached = await store.metadata.get(key)
  if (cached && Date.now() - cached.at < 7 * 864e5) return cached.hits
  try {
    const hits = await openLibrary.search(query, signal)
    await store.metadata.put({ query: key, hits, at: Date.now() })
    return hits
  } catch (e) {
    if (cached) return cached.hits
    throw e
  }
}

export function useWorksRaw(): Work[] {
  return useLiveQuery(() => db.works.toArray(), [], [] as Work[])
}

// ---------- Libby import and Inbox (ADR 0002, 0003, 0005) ----------

export interface ImportSummary {
  found: number
  added: number
  alreadySeen: number
  ignored: number
}

/**
 * Stores every Borrowed row as a pending Import record. Records seen in any earlier
 * Import, including dismissed ones, are never proposed again.
 */
export async function importLibby(json: unknown, fileName: string, store: LibraryDB = db): Promise<ImportSummary> {
  const { records, ignored } = parseLibbyExport(json)
  return store.transaction('rw', store.importRecords, store.imports, async () => {
    const existing = new Set((await store.importRecords.where('key').anyOf(records.map((r) => r.key)).toArray()).map((r) => r.key))
    const fresh = records.filter((r) => !existing.has(r.key))
    const importId = (await store.imports.add({ source: 'libby', at: Date.now(), fileName, found: records.length, added: fresh.length, alreadySeen: records.length - fresh.length, ignored })) as number
    await store.importRecords.bulkAdd(fresh.map((r) => ({ ...r, importId, state: 'pending' as const })))
    return { found: records.length, added: fresh.length, alreadySeen: records.length - fresh.length, ignored }
  })
}

export function useRecords(state: RecordState): ImportRecord[] | undefined {
  return useLiveQuery(() => db.importRecords.where('state').equals(state).toArray(), [state])
}

export type Resolution =
  | { kind: 'finished'; format: Format }
  | { kind: 'want' }
  | { kind: 'link' }

/** Reader-confirmed or cache-derived details, applied only when this resolve creates the Work. */
export interface NewWorkDetails {
  genres?: GenreId[]
  pageCount?: number
  coverUrl?: string
  openLibrary?: string
  isbn?: string[]
}

export interface ResolveInput {
  recordIds: number[]
  resolution: Resolution
  details?: NewWorkDetails
  /** Attach to this Work, or create one from the group's own fields. */
  workId?: number
}

const monthOf = (ms: number): DatePart => {
  const d = new Date(ms)
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

/**
 * Resolves a group of pending records in one transaction. Loans are always kept as
 * evidence of borrowing; a Reading is only made when the reader says Finished, and its
 * Finish date is the newest borrow month (ADR 0002's Finish date rule), never guessed
 * from anything else.
 */
export interface ResolveReceipt {
  workId: number
  createdWork: boolean
  readingId?: number
  loanIds: number[]
  recordIds: number[]
  /** The Work's fields before the resolve, so Undo can put them back. */
  before?: Pick<Work, 'externalIds' | 'coverUrl' | 'shelves'>
  title: string
}

export async function resolveGroup(input: ResolveInput, store: LibraryDB = db): Promise<number> {
  return (await resolveGroupWithReceipt(input, store)).workId
}

export async function resolveGroupWithReceipt(input: ResolveInput, store: LibraryDB = db): Promise<ResolveReceipt> {
  return store.transaction('rw', store.works, store.readings, store.loans, store.importRecords, async () => {
    const records = (await store.importRecords.bulkGet(input.recordIds)).filter((r): r is ImportRecord => !!r && r.state !== 'accepted')
    if (records.length === 0) throw new Error('These records were already resolved')
    records.sort((a, b) => b.borrowedAt - a.borrowedAt)
    const newest = records[0]
    const libbyIds = [...new Set(records.map((r) => r.titleId))]
    const isbns = [...new Set(records.map((r) => r.isbn).filter((x): x is string => !!x))]

    let workId = input.workId
    let before: ResolveReceipt['before']
    if (workId === undefined) {
      workId = (await store.works.add({
        title: newest.title,
        author: newest.author,
        genres: input.details?.genres ?? [],
        tags: [],
        shelves: input.resolution.kind === 'want' ? ['want'] : [],
        coverUrl: newest.coverUrl ?? input.details?.coverUrl,
        pageCount: input.details?.pageCount,
        externalIds: {
          libby: libbyIds,
          isbn: [...new Set([...isbns, ...(input.details?.isbn ?? [])])],
          openLibrary: input.details?.openLibrary ? [input.details.openLibrary] : undefined,
        },
      })) as number
    } else {
      const w = await store.works.get(workId)
      if (!w) throw new Error('That Work no longer exists')
      before = { externalIds: w.externalIds, coverUrl: w.coverUrl, shelves: w.shelves }
      const ids = w.externalIds ?? {}
      await store.works.update(workId, {
        externalIds: { ...ids, libby: [...new Set([...(ids.libby ?? []), ...libbyIds])], isbn: [...new Set([...(ids.isbn ?? []), ...isbns])] },
        coverUrl: w.coverUrl ?? newest.coverUrl,
        shelves: input.resolution.kind === 'want' && !w.shelves.includes('want') ? [...w.shelves, 'want'] : w.shelves,
      })
    }

    let readingId: number | undefined
    if (input.resolution.kind === 'finished') {
      readingId = (await store.readings.add({ workId, status: 'finished', format: input.resolution.format, finish: monthOf(newest.borrowedAt) })) as number
      const w = await store.works.get(workId)
      if (w?.shelves.includes('want')) await store.works.update(workId, { shelves: w.shelves.filter((s) => s !== 'want') })
    }

    const loanIds: number[] = []
    for (const r of records) {
      loanIds.push((await store.loans.add({ workId, source: 'libby', borrowed: monthOf(r.borrowedAt), library: r.libraryName, format: r.format, recordKey: r.key })) as number)
      await store.importRecords.update(r.id!, { state: 'accepted', workId })
    }
    return { workId, createdWork: input.workId === undefined, readingId, loanIds, recordIds: records.map((r) => r.id!), before, title: newest.title }
  })
}

/** Reverses one resolve: removes what it created, restores the Work, and returns the records to the Inbox. */
export async function undoResolve(receipt: ResolveReceipt, store: LibraryDB = db): Promise<void> {
  await store.transaction('rw', store.works, store.readings, store.loans, store.importRecords, async () => {
    await store.loans.bulkDelete(receipt.loanIds)
    if (receipt.readingId !== undefined) await store.readings.delete(receipt.readingId)
    if (receipt.createdWork) await store.works.delete(receipt.workId)
    else if (receipt.before) await store.works.update(receipt.workId, receipt.before)
    for (const id of receipt.recordIds) await store.importRecords.update(id, { state: 'pending', workId: undefined })
  })
}

export async function setDismissed(recordIds: number[], dismissed: boolean, store: LibraryDB = db): Promise<void> {
  const want: RecordState = dismissed ? 'dismissed' : 'pending'
  const from: RecordState = dismissed ? 'pending' : 'dismissed'
  await store.transaction('rw', store.importRecords, async () => {
    await store.importRecords.where('id').anyOf(recordIds).filter((r) => r.state === from).modify({ state: want })
  })
}

/** Everything Stats needs; undefined while loading. */
export function useReadingData(): { readings: Reading[]; works: Work[] } | undefined {
  return useLiveQuery(async () => ({ readings: await db.readings.toArray(), works: await db.works.toArray() }), [])
}

export function useGoodreads(state: RecordState): GoodreadsRecord[] | undefined {
  return useLiveQuery(() => db.grRecords.where('state').equals(state).toArray(), [state])
}

// ---------- Editing ----------

export interface ReadingEdit {
  id?: number
  status: ReadingStatus
  format: Format
  start?: DatePart
  finish?: DatePart
  rating?: number
  review?: string
}

export interface WorkEdit {
  title: string
  author: string
  genres: GenreId[]
  tags: string[]
  series?: { name: string; position: number }
  pageCount?: number
  wantToRead: boolean
}

/**
 * Saves a Work and all its Readings in one transaction: readings missing from the list are
 * removed, ones with an id are updated, ones without are added. Loans are never touched.
 * These are the local edits that later imports must not overwrite (ADR 0003).
 */
export async function saveWorkEdits(workId: number, edit: WorkEdit, readings: ReadingEdit[], store: LibraryDB = db): Promise<void> {
  if (!edit.title.trim()) throw new Error('A title is required')
  await store.transaction('rw', store.works, store.readings, async () => {
    const work = await store.works.get(workId)
    if (!work) throw new Error('That book no longer exists')
    const others = work.shelves.filter((s) => s !== 'want')
    const next: Work = {
      ...work,
      title: edit.title.trim(),
      author: edit.author.trim(),
      genres: edit.genres,
      tags: [...new Set(edit.tags.map((t) => t.trim()).filter(Boolean))],
      series: edit.series?.name.trim() ? { name: edit.series.name.trim(), position: edit.series.position } : undefined,
      pageCount: edit.pageCount,
      shelves: edit.wantToRead ? [...others, 'want'] : others,
    }
    await store.works.put(next)
    const keep = new Set(readings.map((r) => r.id).filter((x): x is number => x !== undefined))
    const existing = await store.readings.where('workId').equals(workId).toArray()
    await store.readings.bulkDelete(existing.filter((r) => !keep.has(r.id!)).map((r) => r.id!))
    for (const r of readings) {
      const row: Reading = {
        workId,
        status: r.status,
        format: r.format,
        start: r.start,
        finish: r.status === 'reading' ? undefined : r.finish,
        rating: r.rating,
        review: r.review?.trim() || undefined,
      }
      if (r.id !== undefined) await store.readings.put({ ...row, id: r.id })
      else await store.readings.add(row)
    }
  })
}

/** Removes a Work with its Readings and Loans. Import records are kept, so a later import does not re-propose it. */
export async function deleteWork(workId: number, store: LibraryDB = db): Promise<void> {
  await store.transaction('rw', store.works, store.readings, store.loans, async () => {
    await store.readings.where('workId').equals(workId).delete()
    await store.loans.where('workId').equals(workId).delete()
    await store.works.delete(workId)
  })
}
