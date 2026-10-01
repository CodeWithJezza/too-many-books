import type { Reading, Work } from '../types'
import { noFacets, readingFacetsOk, workFacetsOk, type Facets } from './filter'
import type { YearFilter } from './stats'

export interface PageStats {
  /** Finished Readings counted, with their pages summed. */
  counted: number
  total: number
  perYear: { year: number; pages: number }[]
  monthYear?: number
  perMonth: number[]
  /** Finished Readings left out, each stated on the chart (ADR 0008). */
  audiobooks: number
  pagesUnknown: number
  /** Counted Readings with no finish date, so in no year or month. */
  undated: number
  /** Counted Readings in monthYear recorded only to the year. */
  monthUnknown: number
}

/**
 * Pages come from the Work's page count, so they are an estimate: one figure per book, not per
 * edition. Audiobooks have no pages and are left out, not guessed; so are books with no page count.
 * Each finished Reading counts in the period it finished, so a re-read counts again.
 */
export function computePageStats(allReadings: Reading[], allWorks: Work[], filter: YearFilter, facets: Facets = noFacets): PageStats {
  const byId = new Map(allWorks.filter((w) => workFacetsOk(w, facets)).map((w) => [w.id!, w]))
  const finished = allReadings.filter((r) => r.status === 'finished' && byId.has(r.workId) && readingFacetsOk(r, facets))
  const inScope = finished.filter((r) => filter === 'all' || r.finish?.y === filter)

  const audiobooks = inScope.filter((r) => r.format === 'audiobook')
  const noPages = inScope.filter((r) => r.format !== 'audiobook' && !byId.get(r.workId)!.pageCount)
  const counted = inScope.filter((r) => r.format !== 'audiobook' && byId.get(r.workId)!.pageCount)
  const pagesOf = (r: Reading) => byId.get(r.workId)!.pageCount ?? 0
  const usable = finished.filter((r) => r.format !== 'audiobook' && byId.get(r.workId)!.pageCount)

  const years = [...new Set(usable.map((r) => r.finish?.y).filter((y): y is number => y !== undefined))].sort((a, b) => a - b)
  const monthYear = filter === 'all' ? years.at(-1) : filter
  const perMonth = Array.from({ length: 12 }, () => 0)
  let monthUnknown = 0
  for (const r of usable.filter((r) => monthYear !== undefined && r.finish?.y === monthYear)) {
    if (r.finish?.m) perMonth[r.finish.m - 1] += pagesOf(r)
    else monthUnknown++
  }

  return {
    counted: counted.length,
    total: counted.reduce((n, r) => n + pagesOf(r), 0),
    perYear: years.map((year) => ({ year, pages: usable.filter((r) => r.finish?.y === year).reduce((n, r) => n + pagesOf(r), 0) })),
    monthYear,
    perMonth,
    audiobooks: audiobooks.length,
    pagesUnknown: noPages.length,
    undated: counted.filter((r) => !r.finish).length,
    monthUnknown,
  }
}
