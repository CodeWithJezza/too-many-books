import type { Format, GenreId, Reading, Work } from '../types'

export type Key = GenreId | 'none'
export type YearFilter = number | 'all'

export interface Book {
  reading: Reading
  work: Work
  /** Ink key of the Work's first Genre; used to colour its spine. */
  key: Key
}

export interface Stats {
  years: number[]
  selectedYear: YearFilter
  /** Year the month chart shows: the selected year, else the latest with data. */
  monthYear?: number
  finishedCount: number
  dnfCount: number
  /** Finished Readings with no finish date at all. Left out of every year and month view. */
  unknownDate: number
  perYear: { year: number; books: Key[] }[]
  unknownDateBooks: Key[]
  perMonth: Key[][]
  /** Finished in monthYear but recorded only to the year. */
  monthUnknown: number
  genres: { key: Key; count: number }[]
  ratings: { value: number; count: number }[]
  unrated: number
  formats: { label: string; year?: number; counts: Record<Format, number> }[]
  authors: { author: string; count: number }[]
}

const FORMATS: Format[] = ['ebook', 'audiobook', 'print']

export function computeStats(readings: Reading[], works: Work[], filter: YearFilter): Stats {
  const byId = new Map(works.map((w) => [w.id!, w]))
  const books = (status: Reading['status']): Book[] =>
    readings
      .filter((r) => r.status === status && byId.has(r.workId))
      .map((r) => ({ reading: r, work: byId.get(r.workId)!, key: (byId.get(r.workId)!.genres[0] ?? 'none') as Key }))

  const finished = books('finished')
  const dnf = books('dnf')
  const years = [...new Set(finished.map((b) => b.reading.finish?.y).filter((y): y is number => y !== undefined))].sort((a, b) => b - a)
  const inFilter = (b: Book) => filter === 'all' || b.reading.finish?.y === filter
  const shown = finished.filter(inFilter)
  const unknown = finished.filter((b) => !b.reading.finish)

  const monthYear = filter === 'all' ? years[0] : filter
  const inMonthYear = monthYear === undefined ? [] : finished.filter((b) => b.reading.finish?.y === monthYear)
  const perMonth: Key[][] = Array.from({ length: 12 }, () => [])
  let monthUnknown = 0
  for (const b of inMonthYear) {
    const m = b.reading.finish?.m
    if (m) perMonth[m - 1].push(b.key)
    else monthUnknown++
  }

  const tally = <T,>(items: T[], keyOf: (x: T) => string | undefined) => {
    const m = new Map<string, number>()
    for (const x of items) {
      const k = keyOf(x)
      if (k) m.set(k, (m.get(k) ?? 0) + 1)
    }
    return m
  }

  // A Work with several Genres counts once in each.
  const genreCounts = new Map<Key, number>()
  for (const b of shown) for (const g of b.work.genres.length ? b.work.genres : (['none'] as Key[])) genreCounts.set(g, (genreCounts.get(g) ?? 0) + 1)

  const ratingCounts = tally(shown, (b) => (b.reading.rating !== undefined ? String(b.reading.rating) : undefined))
  const formatRow = (label: string, list: Book[], year?: number) => ({
    label,
    year,
    counts: Object.fromEntries(FORMATS.map((f) => [f, list.filter((b) => b.reading.format === f).length])) as Record<Format, number>,
  })

  return {
    years,
    selectedYear: filter,
    monthYear,
    finishedCount: shown.length,
    dnfCount: dnf.filter((b) => filter === 'all' || b.reading.finish?.y === filter).length,
    unknownDate: unknown.length,
    perYear: [...years].reverse().map((y) => ({ year: y, books: finished.filter((b) => b.reading.finish?.y === y).map((b) => b.key) })),
    unknownDateBooks: unknown.map((b) => b.key),
    perMonth,
    monthUnknown,
    genres: [...genreCounts].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count),
    ratings: Array.from({ length: 10 }, (_, i) => (i + 1) / 2).map((value) => ({ value, count: ratingCounts.get(String(value)) ?? 0 })),
    unrated: shown.filter((b) => b.reading.rating === undefined).length,
    formats: [...[...years].reverse().map((y) => formatRow(String(y), finished.filter((b) => b.reading.finish?.y === y), y)), ...(unknown.length ? [formatRow('Date unknown', unknown)] : [])],
    authors: [...tally(shown, (b) => b.work.author.trim() || undefined)].map(([author, count]) => ({ author, count })).sort((a, b) => b.count - a.count || a.author.localeCompare(b.author)).slice(0, 10),
  }
}
