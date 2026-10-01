import type { Reading, Work } from '../types'
import { noFacets, readingFacetsOk, workFacetsOk, type Facets } from './filter'
import type { Key } from './stats'

export interface YearTrend {
  year: number
  finished: number
  /** Mean of the ratings given. Absent when nothing that year was rated: unrated is not a low score. */
  average?: number
  rated: number
  unrated: number
  /** Books that include each Genre this year; a book with several Genres counts in each. */
  genres: Map<Key, number>
}

export interface Trends {
  years: YearTrend[]
  /** Genres seen in any year, most books first. */
  genreKeys: Key[]
  /** Finished Readings with no finish date, in no year. */
  undated: number
}

/** Finished Readings per year, with the average rating and the Genre mix (B5). Same rules as ADR 0008. */
export function computeTrends(allReadings: Reading[], allWorks: Work[], facets: Facets = noFacets): Trends {
  const byId = new Map(allWorks.filter((w) => workFacetsOk(w, facets)).map((w) => [w.id!, w]))
  const finished = allReadings.filter((r) => r.status === 'finished' && byId.has(r.workId) && readingFacetsOk(r, facets))
  const years = [...new Set(finished.map((r) => r.finish?.y).filter((y): y is number => y !== undefined))].sort((a, b) => a - b)
  const total = new Map<Key, number>()
  const out = years.map((year): YearTrend => {
    const rs = finished.filter((r) => r.finish?.y === year)
    const ratings = rs.map((r) => r.rating).filter((x): x is number => x !== undefined)
    const genres = new Map<Key, number>()
    for (const r of rs) for (const g of byId.get(r.workId)!.genres.length ? byId.get(r.workId)!.genres : (['none'] as Key[])) {
      genres.set(g, (genres.get(g) ?? 0) + 1)
      total.set(g, (total.get(g) ?? 0) + 1)
    }
    return {
      year,
      finished: rs.length,
      average: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : undefined,
      rated: ratings.length,
      unrated: rs.length - ratings.length,
      genres,
    }
  })
  return { years: out, genreKeys: [...total].sort((a, b) => b[1] - a[1]).map(([k]) => k), undated: finished.filter((r) => !r.finish).length }
}
