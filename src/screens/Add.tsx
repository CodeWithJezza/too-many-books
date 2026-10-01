import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Icon } from '../components/Icon'
import { Jacket } from '../components/Jacket'
import { StarsInput } from '../components/StarsInput'
import { DateField, Segmented, dateOk } from '../components/FormControls'
import { LibraryLoanField, blankLoan } from '../components/LibraryLoanField'
import { toDatePart, todayIso, withPrecision, type Precision } from '../lib/dates'

import { GENRES } from '../lib/genres'
import { matchHit, searchLibrary } from '../lib/match'
import { suggestGenres } from '../metadata/suggest'
import type { MetadataHit } from '../metadata/types'
import { useLookupMode } from '../settings'
import { addEntry, searchMetadata, useLibraryNames, useWorksRaw, type AddStatus } from '../storage'
import type { Format, GenreId, Work, WorkSummary } from '../types'

type Pick =
  | { kind: 'existing'; work: Work }
  | { kind: 'hit'; hit: MetadataHit }
  | { kind: 'manual'; title: string }

const STATUSES: { id: AddStatus; label: string }[] = [
  { id: 'reading', label: 'Reading now' },
  { id: 'finished', label: 'Finished' },
  { id: 'dnf', label: 'DNF' },
  { id: 'want', label: 'Want to read' },
]
const FORMATS: { id: Format; label: string }[] = [
  { id: 'print', label: 'Print' },
  { id: 'ebook', label: 'Ebook' },
  { id: 'audiobook', label: 'Audiobook' },
]

const previewWork = (title: string, author: string, genres: GenreId[], coverUrl?: string): WorkSummary => ({
  id: 0, title, author, genres, tags: [], shelves: [], readingCount: 0, coverUrl,
})

export function Add({ onSaved }: { onSaved: (workId: number) => void }) {
  const works = useWorksRaw()
  const [text, setText] = useState('')
  const [picked, setPicked] = useState<Pick | undefined>()
  const [author, setAuthor] = useState('')
  const [genres, setGenres] = useState<GenreId[]>([])
  const [status, setStatus] = useState<AddStatus>('finished')
  const [format, setFormat] = useState<Format>('print')
  const [start, setStart] = useState({ iso: todayIso(), precision: 'day' as Precision })
  const [finish, setFinish] = useState({ iso: todayIso(), precision: 'day' as Precision })
  const [hasStart, setHasStart] = useState(false)
  const [rating, setRating] = useState<number | undefined>()
  const [review, setReview] = useState('')
  const [loan, setLoan] = useState(blankLoan())
  const libraryNames = useLibraryNames()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()

  // ----- title lookup: own library first, then Open Library -----
  const [hits, setHits] = useState<MetadataHit[]>([])
  const lookupMode = useLookupMode()
  const [lookup, setLookup] = useState<'idle' | 'loading' | 'error'>('idle')
  const [open, setOpen] = useState(false)
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const q = text.trim()
    if (picked || q.length < 3 || lookupMode === 'off') {
      setHits([])
      setLookup('idle')
      return
    }
    const ctrl = new AbortController()
    setLookup('loading')
    const t = setTimeout(() => {
      searchMetadata(q, ctrl.signal)
        .then((h) => { setHits(h); setLookup('idle') })
        .catch((e) => { if (!ctrl.signal.aborted) { setHits([]); setLookup('error'); console.debug(e) } })
    }, 350)
    return () => { clearTimeout(t); ctrl.abort() }
  }, [text, picked, lookupMode])

  const own = useMemo(() => (picked ? [] : searchLibrary(works, text)), [works, text, picked])
  // A hit already in the library is shown once, as the library's own Work.
  // Study guides, summaries and criticism sort after the books themselves.
  const secondary = /summary|study guide|analysis|criticism|critical|guide to|conversation starters|companion/i
  const remote = useMemo(() => {
    const fresh = hits.filter((h) => !matchHit(works, h))
    return [...fresh.filter((h) => !secondary.test(h.title)), ...fresh.filter((h) => secondary.test(h.title))].slice(0, 6)
  }, [hits, works])
  const rows: Pick[] = [
    ...own.map((work) => ({ kind: 'existing', work }) as Pick),
    ...remote.map((hit) => ({ kind: 'hit', hit }) as Pick),
    ...(text.trim() ? [{ kind: 'manual', title: text.trim() } as Pick] : []),
  ]
  const [active, setActive] = useState(0)
  useEffect(() => setActive(0), [text])

  function choose(p: Pick) {
    setPicked(p)
    setOpen(false)
    if (p.kind === 'hit') {
      setText(p.hit.title)
      setAuthor(p.hit.author)
      setGenres([]) // suggestions are marked, never pre-selected
    } else if (p.kind === 'existing') {
      setText(p.work.title)
      setAuthor(p.work.author)
      setGenres(p.work.genres)
    } else {
      setText(p.title)
      setAuthor('')
      setGenres([])
    }
  }
  function change() {
    setPicked(undefined)
    setText('')
    setAuthor('')
    setGenres([])
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const suggested = picked?.kind === 'hit' ? suggestGenres(picked.hit.subjects) : []
  const readingFields = status !== 'want'
  const startShown = status === 'reading' || hasStart
  const finishShown = status === 'finished' || status === 'dnf'
  const startBad = readingFields && startShown && !dateOk(start.iso, start.precision)
  const finishBad = readingFields && finishShown && !dateOk(finish.iso, finish.precision)
  const loanBad = readingFields && loan.on && !dateOk(loan.date.iso, loan.date.precision)
  const canSave = !!picked && !saving && !startBad && !finishBad && !loanBad

  const busy = useRef(false)
  async function save() {
    // Enter in a field submits the form even when the Save button is disabled, and a fast
    // double Enter would otherwise save twice before state updates.
    if (!picked || !canSave || busy.current) return
    busy.current = true
    setSaving(true)
    setError(undefined)
    try {
      const reading = readingFields
        ? {
            format,
            start: status === 'reading' || hasStart ? toDatePart(start.iso, start.precision) : undefined,
            finish: status === 'finished' || status === 'dnf' ? toDatePart(finish.iso, finish.precision) : undefined,
            rating,
            review: review.trim() || undefined,
          }
        : undefined
      const loanInput = readingFields && loan.on ? { library: loan.library, borrowed: toDatePart(loan.date.iso, loan.date.precision) } : undefined
      const id = await addEntry(
        picked.kind === 'existing'
          ? { workId: picked.work.id, status, reading, loan: loanInput }
          : {
              status,
              reading,
              loan: loanInput,
              newWork: {
                title: text,
                author,
                genres,
                pageCount: picked.kind === 'hit' ? picked.hit.pageCount : undefined,
                coverUrl: picked.kind === 'hit' ? picked.hit.coverUrl : undefined,
                externalIds: picked.kind === 'hit' ? { openLibrary: [picked.hit.key], isbn: picked.hit.isbns } : undefined,
              },
            },
      )
      onSaved(id)
    } catch (e) {
      busy.current = false
      setSaving(false)
      setError(e instanceof Error ? e.message : 'Could not save. Nothing was added.')
    }
  }

  function onKey(e: React.KeyboardEvent) {
    if (!open || rows.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, rows.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); choose(rows[active]) }
    else if (e.key === 'Escape') setOpen(false)
  }

  const previewGenres = genres
  const preview = picked
    ? previewWork(text, author, previewGenres, picked.kind === 'hit' ? picked.hit.coverUrl : picked.kind === 'existing' ? picked.work.coverUrl : undefined)
    : undefined

  return (
    <main className="library add-screen">
      <div className="lib-head"><h1>Add a book</h1></div>

      <div className="add-body">
      <form className="form" onSubmit={(e) => { e.preventDefault(); void save() }}>
        <div className="field">
          <label className="label" htmlFor="title">Title</label>
          {picked && preview ? (
            <div className="picked">
              <Jacket work={preview} size="mini" />
              <div className="picked-text">
                <p className="picked-title">{text}</p>
                {picked.kind === 'manual' ? (
                  <label className="inline-field">
                    <span className="sr-only">Author</span>
                    <input className="input" placeholder="Author (optional)" value={author} onChange={(e) => setAuthor(e.target.value)} />
                  </label>
                ) : (
                  <p className="picked-sub">{author || 'Author unknown'}</p>
                )}
                <p className="picked-note">
                  {picked.kind === 'existing' && 'Already in your library. This adds another reading.'}
                  {picked.kind === 'hit' && 'From Open Library'}
                  {picked.kind === 'manual' && 'Entered by hand'}
                </p>
              </div>
              <button type="button" className="btn-link" onClick={change}>Change</button>
            </div>
          ) : (
            <div className="combo">
              <div className="search big">
                <Icon name="search" size={18} />
                <input
                  ref={inputRef}
                  id="title"
                  role="combobox"
                  aria-expanded={open && rows.length > 0}
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={open && rows.length ? `${listId}-${active}` : undefined}
                  autoComplete="off"
                  placeholder="Search your library and Open Library"
                  value={text}
                  onChange={(e) => { setText(e.target.value); setOpen(true) }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={onKey}
                />
              </div>
              {open && text.trim() && (
                <ul className="results" id={listId} role="listbox" aria-label="Matches">
                  {rows.map((r, i) => (
                    <li key={i} id={`${listId}-${i}`} role="option" aria-selected={i === active} className={r.kind === 'manual' ? 'result manual' : 'result'} onMouseDown={(e) => { e.preventDefault(); choose(r) }} onMouseEnter={() => setActive(i)}>
                      {r.kind === 'existing' && <><span className="result-title">{r.work.title}</span><span className="result-sub">{r.work.author}<span className="result-tag">In your library</span></span></>}
                      {r.kind === 'hit' && <><span className="result-title">{r.hit.title}</span><span className="result-sub">{r.hit.author}{r.hit.year ? ` · ${r.hit.year}` : ''}</span></>}
                      {r.kind === 'manual' && <span className="result-title">Enter “{r.title}” by hand</span>}
                    </li>
                  ))}
                  {lookupMode === 'off' && <li className="result-note">Online lookup is off in Settings. Showing your own library; you can still enter it by hand.</li>}
                  {lookup === 'loading' && <li className="result-note" role="status">Searching Open Library…</li>}
                  {lookup === 'error' && <li className="result-note" role="status">Couldn't reach Open Library. You can still enter it by hand.</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="field">
          <span className="label" id="status-l">Status</span>
          <Segmented label="Status" value={status} options={STATUSES} onChange={setStatus} />
        </div>

        {readingFields && (
          <>
            <div className="field">
              <span className="label">Format</span>
              <Segmented label="Format" value={format} options={FORMATS} onChange={setFormat} />
            </div>

            {status === 'reading' || hasStart ? (
              <DateField label="Started" iso={start.iso} precision={start.precision} onIso={(iso) => setStart({ ...start, iso })} onPrecision={(p) => setStart(withPrecision(start, p))} />
            ) : (
              <button type="button" className="btn-link" onClick={() => setHasStart(true)}>Add a start date</button>
            )}

            {(status === 'finished' || status === 'dnf') && (
              <DateField label={status === 'dnf' ? 'Stopped' : 'Finished'} iso={finish.iso} precision={finish.precision} onIso={(iso) => setFinish({ ...finish, iso })} onPrecision={(p) => setFinish(withPrecision(finish, p))} />
            )}

            <LibraryLoanField value={loan} onChange={setLoan} names={libraryNames} onDate={(p) => withPrecision(loan.date, p)} />

            <div className="field">
              <span className="label">Rating</span>
              <StarsInput value={rating} onChange={setRating} />
            </div>

            <div className="field">
              <label className="label" htmlFor="review">Review</label>
              <textarea id="review" className="input" rows={3} placeholder="A line or two, optional" value={review} onChange={(e) => setReview(e.target.value)} />
            </div>
          </>
        )}

        {picked && picked.kind !== 'existing' && (
          <fieldset className="field">
            <legend>Genres <span className="hint-inline">optional{suggested.length > 0 && ', suggested ones are marked'}</span></legend>
            <div className="genre-picks">
              {GENRES.map((g) => {
                const on = genres.includes(g.id)
                return (
                  <button key={g.id} type="button" className="genre-pick" aria-pressed={on} style={{ ['--ink-genre' as string]: g.ink }} onClick={() => setGenres(on ? genres.filter((x) => x !== g.id) : [...genres, g.id])}>
                    {g.label}{suggested.includes(g.id) && <span className="sug"> · suggested</span>}
                  </button>
                )
              })}
            </div>
          </fieldset>
        )}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions sticky">
          <button type="submit" className="btn-primary" disabled={!canSave}>{status === 'want' ? 'Add to Want to read' : 'Save'}</button>
          {!picked && <span className="hint">Pick or type a title to continue.</span>}
        </div>
      </form>
      <div className="add-preview" aria-hidden="true">
        <Jacket work={preview ?? previewWork(text.trim() || 'Your book', author, genres)} size="preview" />
      </div>
      </div>
    </main>
  )
}
