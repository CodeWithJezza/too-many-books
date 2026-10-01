import type { Reading, Work } from '../types'
import { noFacets, readingFacetsOk, workFacetsOk, type Facets } from './filter'
import type { YearFilter } from './stats'

export interface AuthorRow {
  author: string
  count: number
  /** Mean rating over rated readings; absent when none are rated. */
  average?: number
  rated: number
}

export interface AuthorStats {
  /** Every author with a finished Reading in scope, most books first. */
  ranking: AuthorRow[]
  /** Authors whose first finished, dated Reading fell in each year. */
  newPerYear: { year: number; count: number }[]
  /** Finished Readings with no author, left out of the ranking. */
  noAuthor: number
  /** Authors seen only on undated Readings, so in no year of newPerYear. */
  undatedOnly: number
}

/** Same name, ignoring case and spacing only. Nothing else is merged: "Touya" and "Touya, chibi" stay two authors. */
const authorKey = (a: string) => a.trim().replace(/\s+/g, ' ').toLowerCase()

/** Beyond the top 10: the full ranking, average rating per author, and new authors per year (B6). */
export function computeAuthors(allReadings: Reading[], allWorks: Work[], filter: YearFilter, facets: Facets = noFacets): AuthorStats {
  const byId = new Map(allWorks.filter((w) => workFacetsOk(w, facets)).map((w) => [w.id!, w]))
  const finished = allReadings.filter((r) => r.status === 'finished' && byId.has(r.workId) && readingFacetsOk(r, facets))
  const inScope = finished.filter((r) => filter === 'all' || r.finish?.y === filter)

  const rows = new Map<string, { author: string; count: number; sum: number; rated: number }>()
  let noAuthor = 0
  for (const r of inScope) {
    const name = byId.get(r.workId)!.author.trim()
    if (!name) { noAuthor++; continue }
    const row = rows.get(authorKey(name)) ?? { author: name, count: 0, sum: 0, rated: 0 }
    row.count++
    if (r.rating !== undefined) { row.sum += r.rating; row.rated++ }
    rows.set(authorKey(name), row)
  }

  // An author is new in the year of their earliest dated finished Reading, across all years.
  const first = new Map<string, number>()
  const seenUndated = new Set<string>()
  for (const r of finished) {
    const name = byId.get(r.workId)!.author.trim()
    if (!name) continue
    const k = authorKey(name)
    if (r.finish) first.set(k, Math.min(first.get(k) ?? Infinity, r.finish.y))
    else seenUndated.add(k)
  }
  const perYear = new Map<number, number>()
  for (const y of first.values()) perYear.set(y, (perYear.get(y) ?? 0) + 1)

  return {
    ranking: [...rows.values()]
      .map((r) => ({ author: r.author, count: r.count, average: r.rated ? r.sum / r.rated : undefined, rated: r.rated }))
      .sort((a, b) => b.count - a.count || a.author.localeCompare(b.author)),
    newPerYear: [...perYear].sort((a, b) => a[0] - b[0]).map(([year, count]) => ({ year, count })),
    noAuthor,
    undatedOnly: [...seenUndated].filter((k) => !first.has(k)).length,
  }
}
