import { parseGoodreadsExport } from '../import/goodreads'
import { toDatePart } from '../lib/dates'
import type { DatePart, Format, GoodreadsFields, GoodreadsRecord, Reading, Work } from '../types'
import { GOODREADS_FIELD_KEYS } from '../types'
import type { LibraryDB } from './db'

// ---------- what the app currently holds, for telling local edits from source changes ----------

const iso = (d?: DatePart) => (d?.m && d.d ? `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}` : d ? `${d.y}` : undefined)

function appValue(k: keyof GoodreadsFields, work: Work | undefined, reading: Reading | undefined): GoodreadsFields[keyof GoodreadsFields] {
  switch (k) {
    case 'title': return work?.title
    case 'author': return work?.author
    case 'shelf':
      if (reading) return reading.status === 'finished' ? 'read' : reading.status === 'reading' ? 'currently-reading' : reading.status
      return work?.shelves.includes('want') ? 'to-read' : undefined
    case 'rating': return reading?.rating
    case 'dateRead': return iso(reading?.finish)
    case 'review': return reading?.review
  }
}

// ---------- import ----------

export interface GoodreadsSummary {
  found: number
  added: number
  updates: number
  unchanged: number
  /** Changed at Goodreads, but only in fields you have edited here, so nothing is proposed. */
  keptYours: number
  /** Rows still waiting in the Inbox whose values changed at Goodreads; they now show the new values. */
  refreshed: number
  ignored: number
}

/**
 * New rows enter the Inbox as proposals. A row seen before is skipped silently when nothing
 * it tracks changed, and returns as an update showing only the changed fields, minus any
 * you edited in the app (ADR 0003: local edits always win).
 */
export async function importGoodreads(text: string, fileName: string, store: LibraryDB): Promise<GoodreadsSummary> {
  const { records, ignored } = parseGoodreadsExport(text)
  return store.transaction('rw', store.grRecords, store.imports, store.works, store.readings, async () => {
    const importId = (await store.imports.add({ source: 'goodreads', at: Date.now(), fileName, found: records.length, added: 0, alreadySeen: 0, ignored })) as number
    const s: GoodreadsSummary = { found: records.length, added: 0, updates: 0, unchanged: 0, keptYours: 0, refreshed: 0, ignored }
    for (const p of records) {
      const rec = await store.grRecords.where('bookId').equals(p.bookId).first()
      if (!rec) {
        await store.grRecords.add({ bookId: p.bookId, importId, state: 'pending', seen: p.seen, isbn: p.isbn, formatHint: p.formatHint })
        s.added++
        continue
      }
      const moved = GOODREADS_FIELD_KEYS.filter((k) => rec.seen[k] !== p.seen[k])
      if (moved.length === 0) { s.unchanged++; continue }
      const base = { seen: p.seen, isbn: p.isbn ?? rec.isbn, formatHint: p.formatHint ?? rec.formatHint }
      if (rec.state === 'pending' && !rec.applied) { await store.grRecords.update(rec.id!, base); s.refreshed++; continue }
      if (!rec.applied) {
        // Dismissed before it was ever accepted, and now changed: it is worth another look.
        await store.grRecords.update(rec.id!, { ...base, state: 'pending' })
        s.updates++
        continue
      }
      const work = rec.workId ? await store.works.get(rec.workId) : undefined
      const reading = rec.readingId ? await store.readings.get(rec.readingId) : undefined
      const applied = rec.applied
      const changed = GOODREADS_FIELD_KEYS.filter((k) => applied[k] !== p.seen[k] && appValue(k, work, reading) === applied[k])
      if (changed.length === 0) {
        await store.grRecords.update(rec.id!, { ...base, applied: p.seen, state: 'accepted', changed: undefined })
        s.keptYours++
      } else {
        await store.grRecords.update(rec.id!, { ...base, state: 'pending', changed })
        s.updates++
      }
    }
    await store.imports.update(importId, { added: s.added, alreadySeen: s.unchanged })
    return s
  })
}

// ---------- resolving a new row ----------

export type GoodreadsAs = 'finished' | 'reading' | 'want' | 'link'

export interface GoodreadsResolveInput {
  recordId: number
  as: GoodreadsAs
  format: Format
  /** Attach to this Work instead of creating one. */
  workId?: number
  /** Applied only when this resolve creates the Work. */
  details?: { genres?: import('../types').GenreId[]; pageCount?: number; coverUrl?: string; openLibrary?: string; isbn?: string[] }
}

export interface GoodreadsReceipt {
  recordBefore: GoodreadsRecord
  workId: number
  createdWork: boolean
  workBefore?: Work
  readingId?: number
  title: string
}

export async function resolveGoodreads(input: GoodreadsResolveInput, store: LibraryDB): Promise<GoodreadsReceipt> {
  return store.transaction('rw', store.grRecords, store.works, store.readings, async () => {
    const rec = await store.grRecords.get(input.recordId)
    if (!rec || rec.state === 'accepted' || rec.applied) throw new Error('This row was already resolved')
    const f = rec.seen
    const ids = { goodreads: [rec.bookId], isbn: rec.isbn ? [rec.isbn] : [] }
    let workId = input.workId
    let workBefore: Work | undefined
    if (workId === undefined) {
      const d = input.details
      workId = (await store.works.add({
        title: f.title, author: f.author, genres: d?.genres ?? [], tags: [], shelves: input.as === 'want' ? ['want'] : [],
        pageCount: d?.pageCount, coverUrl: d?.coverUrl,
        externalIds: { goodreads: ids.goodreads, isbn: [...new Set([...ids.isbn, ...(d?.isbn ?? [])])], openLibrary: d?.openLibrary ? [d.openLibrary] : undefined },
      })) as number
    } else {
      workBefore = await store.works.get(workId)
      if (!workBefore) throw new Error('That Work no longer exists')
      const cur = workBefore.externalIds ?? {}
      await store.works.update(workId, {
        externalIds: { ...cur, goodreads: [...new Set([...(cur.goodreads ?? []), rec.bookId])], isbn: [...new Set([...(cur.isbn ?? []), ...ids.isbn])] },
        shelves: input.as === 'want' && !workBefore.shelves.includes('want') ? [...workBefore.shelves, 'want'] : workBefore.shelves,
      })
    }
    let readingId: number | undefined
    if (input.as === 'finished') {
      readingId = (await store.readings.add({ workId, status: 'finished', format: input.format, finish: f.dateRead ? toDatePart(f.dateRead, 'day') : undefined, rating: f.rating, review: f.review })) as number
    } else if (input.as === 'reading') {
      readingId = (await store.readings.add({ workId, status: 'reading', format: input.format })) as number
    }
    if (readingId !== undefined) {
      const w = await store.works.get(workId)
      if (w?.shelves.includes('want')) await store.works.update(workId, { shelves: w.shelves.filter((x) => x !== 'want') })
    }
    await store.grRecords.update(rec.id!, { state: 'accepted', workId, readingId, applied: f, changed: undefined })
    return { recordBefore: rec, workId, createdWork: input.workId === undefined, workBefore, readingId, title: f.title }
  })
}

export async function undoResolveGoodreads(r: GoodreadsReceipt, store: LibraryDB): Promise<void> {
  await store.transaction('rw', store.grRecords, store.works, store.readings, async () => {
    if (r.readingId !== undefined) await store.readings.delete(r.readingId)
    if (r.createdWork) await store.works.delete(r.workId)
    else if (r.workBefore) await store.works.put(r.workBefore)
    await store.grRecords.put(r.recordBefore)
  })
}

// ---------- updates ----------

export interface UpdateSnapshot {
  /** Fields actually changed here, and fields left as you set them. */
  applied: (keyof GoodreadsFields)[]
  left: (keyof GoodreadsFields)[]
  record: GoodreadsRecord
  work?: Work
  reading?: Reading
  createdReadingId?: number
  title: string
}

/**
 * Applies a returned update. Each changed field is re-checked at this moment: if you have
 * edited it in the app since, it is left alone. Nothing is ever overwritten silently.
 */
export async function applyGoodreadsUpdate(recordId: number, format: Format, store: LibraryDB): Promise<UpdateSnapshot> {
  return store.transaction('rw', store.grRecords, store.works, store.readings, async () => {
    const rec = await store.grRecords.get(recordId)
    if (!rec?.applied || !rec.changed) throw new Error('There is nothing to apply for this row')
    const work = rec.workId ? await store.works.get(rec.workId) : undefined
    let reading = rec.readingId ? await store.readings.get(rec.readingId) : undefined
    const snap: UpdateSnapshot = { record: rec, work, reading, title: rec.seen.title, applied: [], left: [] }
    const did = new Set<keyof GoodreadsFields>()
    const ok = (k: keyof GoodreadsFields) => rec.changed!.includes(k) && appValue(k, work, reading) === rec.applied![k]
    const s = rec.seen
    let readingId = rec.readingId

    if (work && (ok('title') || ok('author'))) {
      await store.works.update(work.id!, { ...(ok('title') ? { title: s.title } : {}), ...(ok('author') ? { author: s.author } : {}) })
      if (ok('title')) did.add('title')
      if (ok('author')) did.add('author')
    }
    if (work && ok('shelf')) {
      if (s.shelf === 'read' || s.shelf === 'currently-reading') {
        if (reading) {
          if (s.shelf === 'read' && reading.status === 'reading') { await store.readings.update(reading.id!, { status: 'finished' }); did.add('shelf') }
        } else {
          readingId = (await store.readings.add({ workId: work.id!, status: s.shelf === 'read' ? 'finished' : 'reading', format, finish: undefined })) as number
          snap.createdReadingId = readingId
          did.add('shelf')
        }
        if (work.shelves.includes('want')) { await store.works.update(work.id!, { shelves: work.shelves.filter((x) => x !== 'want') }); did.add('shelf') }
      } else if (!reading && !work.shelves.includes('want')) {
        await store.works.update(work.id!, { shelves: [...work.shelves, 'want'] })
        did.add('shelf')
      }
      reading = readingId ? await store.readings.get(readingId) : reading
    }
    if (readingId !== undefined) {
      const created = snap.createdReadingId !== undefined
      const patch: Partial<Reading> = {}
      if (created || ok('rating')) { patch.rating = s.rating; if (ok('rating')) did.add('rating') }
      if (created || ok('dateRead')) { patch.finish = s.dateRead ? toDatePart(s.dateRead, 'day') : undefined; if (ok('dateRead')) did.add('dateRead') }
      if (created || ok('review')) { patch.review = s.review; if (ok('review')) did.add('review') }
      if (s.shelf !== 'read') delete patch.finish
      if (Object.keys(patch).length) await store.readings.update(readingId, patch)
    }
    await store.grRecords.update(rec.id!, { state: 'accepted', applied: s, changed: undefined, readingId })
    snap.applied = rec.changed.filter((k) => did.has(k))
    snap.left = rec.changed.filter((k) => !did.has(k))
    return snap
  })
}

/** "Keep mine": accept the source's values as the new baseline without changing anything here. */
export async function keepMine(recordId: number, store: LibraryDB): Promise<UpdateSnapshot> {
  const rec = await store.grRecords.get(recordId)
  if (!rec) throw new Error('Row not found')
  await store.grRecords.update(recordId, { state: 'accepted', applied: rec.seen, changed: undefined })
  return { record: rec, title: rec.seen.title, applied: [], left: rec.changed ?? [] }
}

export async function undoUpdate(snap: UpdateSnapshot, store: LibraryDB): Promise<void> {
  await store.transaction('rw', store.grRecords, store.works, store.readings, async () => {
    if (snap.createdReadingId !== undefined) await store.readings.delete(snap.createdReadingId)
    if (snap.work) await store.works.put(snap.work)
    if (snap.reading) await store.readings.put(snap.reading)
    await store.grRecords.put(snap.record)
  })
}

export async function setGoodreadsDismissed(recordIds: number[], dismissed: boolean, store: LibraryDB): Promise<void> {
  await store.transaction('rw', store.grRecords, async () => {
    await store.grRecords.where('id').anyOf(recordIds).filter((r) => (dismissed ? r.state === 'pending' && !r.applied : r.state === 'dismissed')).modify({ state: dismissed ? 'dismissed' : 'pending' })
  })
}
