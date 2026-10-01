import type { Format, Reading, Work } from '../types'
import { noFacets, type Facets } from './filter'
import { computeStats, type Key } from './stats'

export interface YearSide {
  year: number
  finished: number
  perMonth: number[]
  /** Finished that year but recorded only to the year, so in no month. */
  monthUnknown: number
  genres: Map<Key, number>
  formats: Record<Format, number>
}

export interface Comparison {
  a: YearSide
  b: YearSide
  /** Every Genre either year has, most books first. */
  genreKeys: Key[]
}

const FORMATS: Format[] = ['ebook', 'audiobook', 'print']

/**
 * Two years side by side, from the same counts the main charts use (ADR 0008): finished Readings
 * in the year, a re-read counts again, and a Reading dated only to the year is stated, not placed.
 */
export function compareYears(readings: Reading[], works: Work[], a: number, b: number, facets: Facets = noFacets): Comparison {
  const side = (year: number): YearSide => {
    const s = computeStats(readings, works, year, facets)
    const row = s.formats.find((f) => f.year === year)
    return {
      year,
      finished: s.finishedCount,
      perMonth: s.perMonth.map((m) => m.length),
      monthUnknown: s.monthUnknown,
      genres: new Map(s.genres.map((g) => [g.key, g.count])),
      formats: Object.fromEntries(FORMATS.map((f) => [f, row?.counts[f] ?? 0])) as Record<Format, number>,
    }
  }
  const sa = side(a)
  const sb = side(b)
  const keys = [...new Set<Key>([...sa.genres.keys(), ...sb.genres.keys()])]
  keys.sort((x, y) => (sb.genres.get(y) ?? 0) + (sa.genres.get(y) ?? 0) - (sb.genres.get(x) ?? 0) - (sa.genres.get(x) ?? 0))
  return { a: sa, b: sb, genreKeys: keys }
}
