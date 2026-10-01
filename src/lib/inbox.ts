import type { ImportRecord, Work } from '../types'
import { norm, titleKey } from './match'

export type GroupMatch = { work: Work; kind: 'exact' | 'fuzzy' }

export interface InboxGroup {
  key: string
  /** Newest borrow first. */
  records: ImportRecord[]
  title: string
  author: string
  coverUrl?: string
  match?: GroupMatch
}

/** Edition labels such as "(Unabridged)" and "Vol." versus "Volume" do not split a Work; see titleKey. */
export const nameKey = (title: string, author: string) => `${titleKey(title)}|${norm(author)}`

/**
 * Resolves an import record to a Work in three tiers (BUILD_BRIEF): exact on a
 * stored Libby titleId or ISBN, fuzzy on normalized title and author, else none.
 * Fuzzy is only ever a suggestion.
 */
export function matchRecord(works: Work[], r: ImportRecord): GroupMatch | undefined {
  return matchIn(indexOf(works), r)
}

/**
 * Lookup tables over the library, built once per pass. Matching every record against every Work by
 * recomputing keys is quadratic and made the app stall with a few hundred of each. The first Work
 * in library order wins, as it did when the Works were scanned one by one.
 */
interface WorkIndex {
  byLibby: Map<string, { work: Work; at: number }>
  byIsbn: Map<string, { work: Work; at: number }>
  byGoodreads: Map<string, { work: Work; at: number }>
  byName: Map<string, Work>
}

const cache = new WeakMap<Work[], WorkIndex>()
/** One index per library snapshot: the same array is reused until the library changes. */
function indexOf(works: Work[]): WorkIndex {
  let idx = cache.get(works)
  if (!idx) cache.set(works, (idx = indexWorks(works)))
  return idx
}

function indexWorks(works: Work[]): WorkIndex {
  const idx: WorkIndex = { byLibby: new Map(), byIsbn: new Map(), byGoodreads: new Map(), byName: new Map() }
  works.forEach((w, at) => {
    for (const id of w.externalIds?.libby ?? []) if (!idx.byLibby.has(id)) idx.byLibby.set(id, { work: w, at })
    for (const id of w.externalIds?.goodreads ?? []) if (!idx.byGoodreads.has(id)) idx.byGoodreads.set(id, { work: w, at })
    for (const id of w.externalIds?.isbn ?? []) if (!idx.byIsbn.has(id)) idx.byIsbn.set(id, { work: w, at })
    const k = nameKey(w.title, w.author)
    if (!idx.byName.has(k)) idx.byName.set(k, w)
  })
  return idx
}

function matchIn(idx: WorkIndex, r: ImportRecord): GroupMatch | undefined {
  const a = idx.byLibby.get(r.titleId)
  const b = r.isbn ? idx.byIsbn.get(r.isbn) : undefined
  const exact = a && b ? (a.at <= b.at ? a : b) : (a ?? b)
  if (exact) return { work: exact.work, kind: 'exact' }
  const fuzzy = idx.byName.get(nameKey(r.title, r.author))
  return fuzzy ? { work: fuzzy, kind: 'fuzzy' } : undefined
}

/** Groups pending records by Work: by matched Work when there is one, else by normalized title and author. */
export function buildGroups(records: ImportRecord[], works: Work[]): InboxGroup[] {
  const groups = new Map<string, InboxGroup>()
  const index = indexOf(works)
  for (const r of records) {
    const match = matchIn(index, r)
    let key = match ? `w${match.work.id}` : `t:${nameKey(r.title, r.author)}`
    // Libby gives a manga and its light novel the same title. Two different title IDs in the same
    // format are therefore two books until the reader says otherwise; an ebook and an audiobook of
    // one title are still treated as one.
    if (!match) {
      for (let n = 1; groups.get(key)?.records.some((o) => o.titleId !== r.titleId && o.format !== undefined && o.format === r.format); n++) {
        key = `t:${nameKey(r.title, r.author)}#${n}`
      }
    }
    const g = groups.get(key)
    if (g) {
      g.records.push(r)
      if (match?.kind === 'exact') g.match = match
    } else {
      groups.set(key, { key, records: [r], title: r.title, author: r.author, coverUrl: r.coverUrl, match })
    }
  }
  for (const g of groups.values()) {
    g.records.sort((a, b) => b.borrowedAt - a.borrowedAt)
    g.coverUrl = g.records.find((r) => r.coverUrl)?.coverUrl
  }
  return [...groups.values()].sort((a, b) => b.records[0].borrowedAt - a.records[0].borrowedAt)
}

/** "Clean" means recognised exactly, so the Loans can simply be linked to a Work you already have. */
export const isClean = (g: InboxGroup) => g.match?.kind === 'exact'

/** Same three tiers for a Goodreads row: exact on a stored Book Id or ISBN, fuzzy on title and author, else none. */
export function matchGoodreads(works: Work[], r: { bookId: string; isbn?: string; seen: { title: string; author: string } }): GroupMatch | undefined {
  const idx = indexOf(works)
  const a = idx.byGoodreads.get(r.bookId)
  const b = r.isbn ? idx.byIsbn.get(r.isbn) : undefined
  const exact = a && b ? (a.at <= b.at ? a : b) : (a ?? b)
  if (exact) return { work: exact.work, kind: 'exact' }
  const fuzzy = idx.byName.get(nameKey(r.seen.title, r.seen.author))
  return fuzzy ? { work: fuzzy, kind: 'fuzzy' } : undefined
}
