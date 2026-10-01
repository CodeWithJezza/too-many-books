import { useMemo, useState, useSyncExternalStore } from 'react'
import { changesSinceBackup, lastBackupAt, shouldPromptBackup, subscribeChanges } from '../backup/changes'
import { Icon } from '../components/Icon'
import { Jacket } from '../components/Jacket'
import { Stars } from '../components/Stars'
import { formatDate } from '../lib/dates'
import { applyQuery, defaultQuery, onShelf, type LibraryQuery, type ShelfFilter, type SortKey } from '../lib/filter'
import { GENRES, labelOf } from '../lib/genres'
import { clearSampleData } from '../storage'
import type { GenreId, WorkSummary } from '../types'

const SHELVES: { id: ShelfFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'reading', label: 'Reading' },
  { id: 'read', label: 'Read' },
  { id: 'want', label: 'Want to read' },
  { id: 'dnf', label: 'DNF' },
]
const SORTS: { id: SortKey; label: string }[] = [
  { id: 'recent', label: 'Recently finished' },
  { id: 'title', label: 'Title' },
  { id: 'author', label: 'Author' },
  { id: 'rating', label: 'Rating' },
]

function caption(w: WorkSummary): string {
  const g = labelOf(w.genres)
  const l = w.latest
  if (!l) return w.shelves.includes('want') ? `${g} · Want to read` : g
  if (l.status === 'reading') return `${g} · Reading now`
  if (l.status === 'dnf') return `${g} · DNF`
  return `${g} · ${formatDate(l.finish)}`
}

export function Library({ works, selectedId, onSelect, sample, onOpenSettings }: {
  works: WorkSummary[] | undefined
  selectedId?: number
  onSelect: (id: number) => void
  sample: boolean
  onOpenSettings: () => void
}) {
  useSyncExternalStore(subscribeChanges, changesSinceBackup)
  useSyncExternalStore(subscribeChanges, () => lastBackupAt() ?? 0)
  const nudge = works !== undefined && shouldPromptBackup(works.some((w) => !w.synthetic))
  const [q, setQ] = useState<LibraryQuery>(defaultQuery)
  const [confirmClear, setConfirmClear] = useState(false)
  const set = <K extends keyof LibraryQuery>(k: K, v: LibraryQuery[K]) => setQ((p) => ({ ...p, [k]: v }))

  const shown = useMemo(() => (works ? applyQuery(works, q) : []), [works, q])
  const filtered = q.text !== '' || q.shelf !== 'all' || q.genre !== 'any'
  const counts = useMemo(() => {
    const c = {} as Record<ShelfFilter, number>
    for (const s of SHELVES) c[s.id] = works?.filter((w) => onShelf(w, s.id)).length ?? 0
    return c
  }, [works])

  return (
    <main className="library">
      <div className="lib-head">
        <h1>Library</h1>
        {sample && (
          <span className="sample-note">
            Sample books · not your real library{' '}
            {confirmClear ? (
              <>
                <button type="button" className="btn-link inline" onClick={() => { void clearSampleData(); onSelect(-1); setConfirmClear(false) }}>Remove them now</button>
                <button type="button" className="btn-link inline" onClick={() => setConfirmClear(false)}>Keep</button>
              </>
            ) : (
              <button type="button" className="btn-link inline" onClick={() => setConfirmClear(true)}>Remove sample books</button>
            )}
          </span>
        )}
      </div>

      {nudge && (
        <p className="nudge" role="status">
          Your library exists only on this device. <button type="button" className="btn-link inline" onClick={onOpenSettings}>Back it up</button>
        </p>
      )}

      <div className="tools">
        <label className="search">
          <Icon name="search" size={18} />
          <span className="sr-only">Search title or author</span>
          <input type="search" placeholder="Search title or author" value={q.text} onChange={(e) => set('text', e.target.value)} />
        </label>
        <label className="select">
          <span className="sr-only">Genre</span>
          <select value={q.genre} onChange={(e) => set('genre', e.target.value as GenreId | 'any')}>
            <option value="any">All genres</option>
            {GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
          </select>
        </label>
        <label className="select">
          <span className="sr-only">Sort by</span>
          <select value={q.sort} onChange={(e) => set('sort', e.target.value as SortKey)}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      <div className="shelf-tabs" role="group" aria-label="Shelf">
        {SHELVES.map((s) => (
          <button key={s.id} type="button" aria-pressed={q.shelf === s.id} className="shelf-tab" onClick={() => set('shelf', s.id)}>
            {s.label} <span>{counts[s.id]}</span>
          </button>
        ))}
      </div>

      {works === undefined ? (
        <p className="state" role="status">Opening your library…</p>
      ) : shown.length === 0 ? (
        <div className="state">
          <p className="state-title">{works.length === 0 ? 'No books yet' : 'Nothing matches'}</p>
          <p>{works.length === 0 ? 'Add a book or import your Libby history to fill the shelves.' : 'Try a different shelf, genre or search.'}</p>
          {filtered && <button type="button" className="btn-quiet" onClick={() => setQ(defaultQuery)}>Clear filters</button>}
        </div>
      ) : (
        <ul className="wall" aria-label={`${shown.length} books`}>
          {shown.map((w) => (
            <li key={w.id} className="wall-item">
              <Jacket work={w} selected={w.id === selectedId} onClick={() => onSelect(w.id)} />
              <p className="cap">{caption(w)}</p>
              {w.latest && w.latest.status !== 'reading' && <Stars value={w.latest.rating} size={14} />}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
