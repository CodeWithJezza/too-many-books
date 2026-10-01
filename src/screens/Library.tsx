import { useMemo, useState, useSyncExternalStore } from 'react'
import { changesSinceBackup, lastBackupAt, shouldPromptBackup, subscribeChanges } from '../backup/changes'
import { Icon } from '../components/Icon'
import { Jacket } from '../components/Jacket'
import { Stars } from '../components/Stars'
import { formatDate } from '../lib/dates'
import { applyQuery, defaultQuery, isFiltered, isMissing, MISSING_LABEL, onShelf, type LibraryQuery, type Missing, type ShelfFilter, type SortKey } from '../lib/filter'
import { GENRES, labelOf } from '../lib/genres'
import { clearSampleData } from '../storage'
import type { Format, GenreId, WorkSummary } from '../types'

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

const FORMAT_LABEL: Record<Format, string> = { ebook: 'Ebook', audiobook: 'Audiobook', print: 'Print' }
const RATING_CHOICES = Array.from({ length: 10 }, (_, i) => 5 - i / 2)
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const STATUS_LABEL = { reading: 'Reading now', finished: 'Finished', dnf: 'Did not finish' } as const

/** The active filters beyond the shelf tabs and sort, as removable chips, so a filter is never hidden. */
function activeChips(q: LibraryQuery): { key: string; label: string; clear: Partial<LibraryQuery> }[] {
  const out: { key: string; label: string; clear: Partial<LibraryQuery> }[] = []
  if (q.status !== 'any') out.push({ key: 'status', label: STATUS_LABEL[q.status], clear: { status: 'any' } })
  if (q.year !== 'any') out.push({ key: 'year', label: q.year === 'unknown' ? 'Date unknown' : q.month !== 'any' ? `${MONTH_NAMES[q.month - 1]} ${q.year}` : String(q.year), clear: { year: 'any', month: 'any' } })
  if (q.rating !== 'any') out.push({ key: 'rating', label: q.rating === 'unrated' ? 'Unrated' : `Rated ${q.rating}`, clear: { rating: 'any' } })
  if (q.format !== 'any') out.push({ key: 'format', label: FORMAT_LABEL[q.format], clear: { format: 'any' } })
  if (q.missing !== 'any') out.push({ key: 'missing', label: `Missing ${MISSING_LABEL[q.missing]}`, clear: { missing: 'any' } })
  if (q.tag !== 'any') out.push({ key: 'tag', label: `Tag: ${q.tag}`, clear: { tag: 'any' } })
  return out
}

export function Library({ works, query: q, onQuery: setQ, selectedId, onSelect, sample, onOpenSettings }: {
  works: WorkSummary[] | undefined
  query: LibraryQuery
  onQuery: (q: LibraryQuery) => void
  selectedId?: number
  onSelect: (id: number) => void
  sample: boolean
  onOpenSettings: () => void
}) {
  useSyncExternalStore(subscribeChanges, changesSinceBackup)
  useSyncExternalStore(subscribeChanges, () => lastBackupAt() ?? 0)
  const nudge = works !== undefined && shouldPromptBackup(works.some((w) => !w.synthetic))
  const [confirmClear, setConfirmClear] = useState(false)
  const set = <K extends keyof LibraryQuery>(k: K, v: LibraryQuery[K]) => setQ({ ...q, [k]: v })

  const shown = useMemo(() => (works ? applyQuery(works, q) : []), [works, q])
  const filtered = isFiltered(q)
  const chips = activeChips(q)
  const tags = useMemo(() => [...new Set((works ?? []).flatMap((w) => w.tags))].sort(), [works])
  const years = useMemo(() => [...new Set((works ?? []).flatMap((w) => (w.readings ?? []).map((r) => r.finish?.y)).filter((y): y is number => y !== undefined))].sort((a, b) => b - a), [works])
  const [moreOpen, setMoreOpen] = useState(false)
  const gaps = useMemo(() => Object.fromEntries((Object.keys(MISSING_LABEL) as Missing[]).map((m) => [m, (works ?? []).filter((w) => isMissing(w, m)).length])) as Record<Missing, number>, [works])
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
        <button type="button" className="btn-quiet" aria-expanded={moreOpen || chips.length > 0} onClick={() => setMoreOpen(!moreOpen)}>Filters{chips.length > 0 && ` · ${chips.length}`}</button>
        <label className="select">
          <span className="sr-only">Sort by</span>
          <select value={q.sort} onChange={(e) => set('sort', e.target.value as SortKey)}>
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>

      {(moreOpen || chips.length > 0) && (
        <div className="tools lib-more">
          <label className="select">
            <span className="sr-only">Tag</span>
            <select value={q.tag} onChange={(e) => set('tag', e.target.value)}>
              <option value="any">All tags</option>
              {tags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Rating</span>
            <select value={String(q.rating)} onChange={(e) => set('rating', e.target.value === 'any' || e.target.value === 'unrated' ? e.target.value : Number(e.target.value))}>
              <option value="any">Any rating</option>
              {RATING_CHOICES.map((r) => <option key={r} value={r}>{r} {r === 1 ? 'star' : 'stars'}</option>)}
              <option value="unrated">Unrated</option>
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Format</span>
            <select value={q.format} onChange={(e) => set('format', e.target.value as Format | 'any')}>
              <option value="any">All formats</option>
              {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Missing</span>
            <select value={q.missing} onChange={(e) => set('missing', e.target.value as Missing | 'any')}>
              <option value="any">Any completeness</option>
              {(Object.keys(MISSING_LABEL) as Missing[]).map((m) => <option key={m} value={m}>Missing {MISSING_LABEL[m]} ({gaps[m]})</option>)}
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Finished in</span>
            <select value={String(q.year)} onChange={(e) => setQ({ ...q, month: 'any', year: e.target.value === 'any' || e.target.value === 'unknown' ? e.target.value : Number(e.target.value) })}>
              <option value="any">Any year</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
              <option value="unknown">Date unknown</option>
            </select>
          </label>
        </div>
      )}
      {chips.length > 0 && (
        <ul className="chip-filters" aria-label="Active filters">
          {chips.map((c) => (
            <li key={c.key}>{c.label}<button type="button" aria-label={`Remove filter ${c.label}`} onClick={() => setQ({ ...q, ...c.clear })}><Icon name="close" size={16} /></button></li>
          ))}
        </ul>
      )}

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
          <p>{works.length === 0 ? 'Add a book or import your Libby history to fill the shelves.' : 'Try a different shelf, genre, filter or search.'}</p>
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
