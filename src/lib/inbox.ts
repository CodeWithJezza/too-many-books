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
  for (const w of works) {
    const ids = w.externalIds
    if (ids?.libby?.includes(r.titleId) || (r.isbn && ids?.isbn?.includes(r.isbn))) return { work: w, kind: 'exact' }
  }
  const k = nameKey(r.title, r.author)
  for (const w of works) {
    if (nameKey(w.title, w.author) === k) return { work: w, kind: 'fuzzy' }
  }
  return undefined
}

/** Groups pending records by Work: by matched Work when there is one, else by normalized title and author. */
export function buildGroups(records: ImportRecord[], works: Work[]): InboxGroup[] {
  const groups = new Map<string, InboxGroup>()
  for (const r of records) {
    const match = matchRecord(works, r)
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
  for (const w of works) {
    const ids = w.externalIds
    if (ids?.goodreads?.includes(r.bookId) || (r.isbn && ids?.isbn?.includes(r.isbn))) return { work: w, kind: 'exact' }
  }
  const k = nameKey(r.seen.title, r.seen.author)
  for (const w of works) if (nameKey(w.title, w.author) === k) return { work: w, kind: 'fuzzy' }
  return undefined
}
