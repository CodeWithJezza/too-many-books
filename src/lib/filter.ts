import type { GenreId, WorkSummary } from '../types'
import { dateKey } from './dates'

export type ShelfFilter = 'all' | 'reading' | 'read' | 'want' | 'dnf'
export type SortKey = 'recent' | 'title' | 'author' | 'rating'

export interface LibraryQuery {
  text: string
  shelf: ShelfFilter
  genre: GenreId | 'any'
  sort: SortKey
}

export const defaultQuery: LibraryQuery = { text: '', shelf: 'all', genre: 'any', sort: 'recent' }

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

export function applyQuery(works: WorkSummary[], q: LibraryQuery): WorkSummary[] {
  const needle = norm(q.text.trim())
  const out = works.filter(
    (w) =>
      onShelf(w, q.shelf) &&
      (q.genre === 'any' || w.genres.includes(q.genre)) &&
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
