import type { Format, GenreId, Reading, ReadingStatus, Work, WorkSummary } from '../types'
import { dateKey } from './dates'
import { seriesNameKey } from './series'

export type ShelfFilter = 'all' | 'reading' | 'read' | 'want' | 'dnf'
export type SortKey = 'recent' | 'title' | 'author' | 'rating'

/**
 * Facets shared by Library and Stats (ADR 0008). Genre and Tag describe the Work; Rating
 * and Format describe a Reading. 'unrated' is its own choice, never a low score.
 */
export interface Facets {
  genre: GenreId | 'any'
  tag: string | 'any'
  rating: number | 'unrated' | 'any'
  format: Format | 'any'
  /** A Series name; matches any Work whose series has the same name key. */
  series: string | 'any'
}

export const noFacets: Facets = { genre: 'any', tag: 'any', rating: 'any', format: 'any', series: 'any' }

export const workFacetsOk = (w: Pick<Work, 'genres' | 'tags' | 'series'>, f: Facets): boolean =>
  (f.genre === 'any' || w.genres.includes(f.genre)) &&
  (f.tag === 'any' || w.tags.includes(f.tag)) &&
  (f.series === 'any' || (!!w.series && seriesNameKey(w.series.name) === seriesNameKey(f.series)))

export const readingFacetsOk = (r: Pick<Reading, 'rating' | 'format'>, f: Facets): boolean =>
  (f.rating === 'any' || (f.rating === 'unrated' ? r.rating === undefined : r.rating === f.rating)) && (f.format === 'any' || r.format === f.format)

/** What a Work can be missing. Filtering on these lists the gaps to fill; it never fills them. */
export type Missing = 'pages' | 'genre' | 'cover' | 'date'

export const MISSING_LABEL: Record<Missing, string> = { pages: 'page count', genre: 'genre', cover: 'cover', date: 'finish date' }

/** 'date' means a finished Reading with no Finish date; a book still being read or DNF is not missing one. */
export function isMissing(w: WorkSummary, what: Missing): boolean {
  switch (what) {
    case 'pages': return !w.pageCount
    case 'genre': return w.genres.length === 0
    case 'cover': return !w.coverUrl
    case 'date': return (w.readings ?? (w.latest ? [w.latest] : [])).some((r) => r.status === 'finished' && !r.finish)
  }
}

/** Library-only Reading facets: which read-through, and when it ended. 'unknown' year means no Finish date. */
export interface LibraryQuery extends Facets {
  text: string
  shelf: ShelfFilter
  sort: SortKey
  status: ReadingStatus | 'any'
  year: number | 'unknown' | 'any'
  month: number | 'any'
  missing: Missing | 'any'
}

export const defaultQuery: LibraryQuery = { ...noFacets, text: '', shelf: 'all', sort: 'recent', status: 'any', year: 'any', month: 'any', missing: 'any' }

const readingOk = (r: Reading, q: LibraryQuery): boolean =>
  readingFacetsOk(r, q) &&
  (q.status === 'any' || r.status === q.status) &&
  (q.year === 'any' || (q.year === 'unknown' ? !r.finish : r.finish?.y === q.year)) &&
  (q.month === 'any' || r.finish?.m === q.month)

/** True when any Reading-level facet is set, so a Work needs a Reading that satisfies them all together. */
export const readingFiltered = (q: LibraryQuery): boolean =>
  q.rating !== 'any' || q.format !== 'any' || q.status !== 'any' || q.year !== 'any' || q.month !== 'any'

/** True when anything differs from the unfiltered Library. */
export const isFiltered = (q: LibraryQuery): boolean =>
  q.text !== '' || q.shelf !== 'all' || q.genre !== 'any' || q.tag !== 'any' || q.series !== 'any' || q.missing !== 'any' || readingFiltered(q)

export function onShelf(w: WorkSummary, shelf: ShelfFilter): boolean {
  switch (shelf) {
    case 'all':
      return true
    case 'reading':
      return w.latest?.status === 'reading'
    case 'read':
      return w.latest?.status === 'finished'
    case 'dnf':
      return w.latest?.status === 'dnf'
    case 'want':
      return w.shelves.includes('want')
  }
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const lastName = (a: string) => norm(a.trim().split(/\s+/).at(-1) ?? a)
const sortTitle = (t: string) => norm(t).replace(/^(the|a|an)\s+/, '')

/** The letter a book files under for the current sort: title ignores a leading article, author uses the last name. Anything else is '#'. */
export function sortLetter(w: WorkSummary, sort: SortKey): string | undefined {
  if (sort !== 'title' && sort !== 'author') return undefined
  const c = (sort === 'title' ? sortTitle(w.title) : lastName(w.author)).trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(c) ? c : '#'
}

export function applyQuery(works: WorkSummary[], q: LibraryQuery): WorkSummary[] {
  const needle = norm(q.text.trim())
  const out = works.filter(
    (w) =>
      onShelf(w, q.shelf) &&
      workFacetsOk(w, q) &&
      (q.missing === 'any' || isMissing(w, q.missing)) &&
      (!readingFiltered(q) || (w.readings ?? (w.latest ? [w.latest] : [])).some((r) => readingOk(r, q))) &&
      (!needle || norm(w.title).includes(needle) || norm(w.author).includes(needle)),
  )
  const cmp: Record<SortKey, (a: WorkSummary, b: WorkSummary) => number> = {
    title: (a, b) => sortTitle(a.title).localeCompare(sortTitle(b.title)),
    author: (a, b) => lastName(a.author).localeCompare(lastName(b.author)) || sortTitle(a.title).localeCompare(sortTitle(b.title)),
    // Unrated sorts after every rating; it is not a low score.
    rating: (a, b) => (b.latest?.rating ?? -1) - (a.latest?.rating ?? -1) || sortTitle(a.title).localeCompare(sortTitle(b.title)),
    recent: (a, b) => {
      const ka = dateKey(a.latest?.finish) ?? -1
      const kb = dateKey(b.latest?.finish) ?? -1
      return kb - ka || sortTitle(a.title).localeCompare(sortTitle(b.title))
    },
  }
  return out.sort(cmp[q.sort])
}
