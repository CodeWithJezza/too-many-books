import { useMemo, useRef, useState } from 'react'
import { Jacket } from '../components/Jacket'
import { Segmented } from '../components/FormControls'
import { formatDate } from '../lib/dates'
import { GENRES } from '../lib/genres'
import { useLookup } from '../import/lookup'
import { suggestGenres } from '../metadata/suggest'
import { buildGroups, isClean, type InboxGroup } from '../lib/inbox'
import { ImportFormatError } from '../import/libby'
import { importGoodreads } from '../storage/goodreads'
import { GoodreadsFormatError } from '../import/goodreads'
import { GoodreadsRow } from './GoodreadsRow'
import { db, importLibby, resolveGroupWithReceipt, setDismissed, undoResolve, useGoodreads, useRecords, useWorksRaw, type ImportSummary, type ResolveReceipt, type ResolveInput } from '../storage'
import type { Format, GenreId, WorkSummary } from '../types'

const monthOf = (ms: number) => {
  const d = new Date(ms)
  return { y: d.getFullYear(), m: d.getMonth() + 1 }
}

const FORMATS: { id: Format; label: string }[] = [
  { id: 'ebook', label: 'Ebook' },
  { id: 'audiobook', label: 'Audiobook' },
  { id: 'print', label: 'Print' },
]

const asWork = (g: InboxGroup, coverUrl?: string): WorkSummary => ({
  id: 0, title: g.title, author: g.author, genres: [], tags: [], shelves: [], readingCount: 0, coverUrl: g.coverUrl ?? coverUrl,
})

function GroupRow({ group, dismissed, onResolved }: { group: InboxGroup; dismissed: boolean; onResolved: (r: ResolveReceipt, what: string) => void }) {
  const newest = group.records[0]
  const [format, setFormat] = useState<Format>(newest.format ?? 'ebook')
  const [same, setSame] = useState<boolean | undefined>(group.match?.kind === 'fuzzy' ? undefined : true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [genres, setGenres] = useState<GenreId[]>([])
  const [showGenres, setShowGenres] = useState(false)

  const ids = group.records.map((r) => r.id!)
  const match = group.match
  const workId = match && same ? match.work.id : undefined
  const undecided = match?.kind === 'fuzzy' && same === undefined
  // A new Work will be created unless the reader says this is the same book as an existing one.
  const makesNewWork = workId === undefined
  const { ref, lookup } = useLookup(group.title, group.author, !dismissed && match?.kind !== 'exact')
  const hit = lookup.hit
  const suggested = hit ? suggestGenres(hit.subjects) : []
  const details = makesNewWork
    ? { genres, pageCount: hit?.pageCount, coverUrl: hit?.coverUrl, openLibrary: hit?.key, isbn: hit?.isbns }
    : undefined

  async function resolve(input: ResolveInput, what: string) {
    await run(async () => onResolved(await resolveGroupWithReceipt(input), what))
  }

  async function run(fn: () => Promise<unknown>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
    } catch (e) {
      setBusy(false)
      setError(e instanceof Error ? e.message : 'That did not save. Nothing changed.')
    }
  }

  const finish = monthOf(newest.borrowedAt)

  return (
    <li className="ib-row" ref={ref}>
      <Jacket work={{ ...asWork(group, hit?.coverUrl), genres }} size="mini" />
      <div className="ib-main">
        <h2 className="ib-title">{group.title}</h2>
        <p className="ib-author">{group.author || 'Author unknown'}</p>
        <p className="ib-loans">
          {group.records.length === 1
            ? <>Borrowed {formatDate(monthOf(newest.borrowedAt))} · {newest.libraryName}</>
            : <>{group.records.length} loans, latest {formatDate(monthOf(newest.borrowedAt))} · {newest.libraryName}</>}
        </p>

        {!dismissed && match?.kind === 'exact' && <p className="ib-match">Already in your library as <strong>{match.work.title}</strong>.</p>}
        {!dismissed && match?.kind === 'fuzzy' && (
          <div className="ib-match">
            <p>Is this the same as <strong>{match.work.title}</strong>{match.work.author ? ` by ${match.work.author}` : ''}?</p>
            <Segmented label={`Same book as ${match.work.title}`} value={same === undefined ? undefined : same ? 'same' : 'different'} options={[{ id: 'same', label: 'Same book' }, { id: 'different', label: 'Different book' }]} onChange={(v) => setSame(v === 'same')} />
          </div>
        )}

        {!dismissed && makesNewWork && (
          <div className="ib-genres">
            <p className="ib-lookup" role={lookup.state === 'failed' ? 'status' : undefined}>
              {lookup.state === 'loading' && 'Checking Open Library…'}
              {lookup.state === 'done' && hit && !undecided && `Found on Open Library. ${[hit.pageCount && 'page count', hit.coverUrl && 'cover'].filter(Boolean).join(' and ') ? `Its ${[hit.pageCount && 'page count', hit.coverUrl && 'cover'].filter(Boolean).join(' and ')} ${[hit.pageCount, hit.coverUrl].filter(Boolean).length > 1 ? 'are' : 'is'} added when you save.` : ''}`}
              {lookup.state === 'done' && hit && undecided && 'Found on Open Library. Answer the question above to use it.'}
              {lookup.state === 'done' && !hit && 'No sure match on Open Library, so nothing is suggested.'}
              {lookup.state === 'failed' && 'Could not reach Open Library. You can set genres later.'}
            </p>
            <button type="button" className="btn-link" aria-expanded={showGenres} onClick={() => setShowGenres(!showGenres)}>
              {genres.length ? `Genres: ${genres.map((g) => GENRES.find((x) => x.id === g)?.label).join(', ')}` : suggested.length ? `Set genres (${suggested.length} suggested)` : 'Set genres'}
            </button>
            {showGenres && <div className="genre-picks" role="group" aria-label={`Genres for ${group.title}`}>
              {GENRES.map((g) => {
                const on = genres.includes(g.id)
                return (
                  <button key={g.id} type="button" className="genre-pick sm" aria-pressed={on} style={{ ['--ink-genre' as string]: g.ink }} onClick={() => setGenres(on ? genres.filter((x) => x !== g.id) : [...genres, g.id])}>
                    {g.label}{suggested.includes(g.id) && <span className="sug"> · suggested</span>}
                  </button>
                )
              })}
            </div>}
          </div>
        )}

        {dismissed ? (
          <div className="ib-actions">
            <button type="button" className="btn-quiet" disabled={busy} onClick={() => run(() => setDismissed(ids, false))}>Restore to Inbox</button>
          </div>
        ) : (
          <>
            <div className="ib-actions">
              <label className="ib-format">
                <span className="sr-only">Format for {group.title}</span>
                <select value={format} onChange={(e) => setFormat(e.target.value as Format)}>
                  {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
                </select>
              </label>
              <button type="button" className="btn-primary sm" disabled={busy || undecided} onClick={() => resolve({ recordIds: ids, resolution: { kind: 'finished', format }, workId, details }, 'finished')}>Finished</button>
              <button type="button" className="btn-quiet" disabled={busy || undecided} onClick={() => resolve({ recordIds: ids, resolution: { kind: 'want' }, workId, details }, 'on Want to read')}>Want to read</button>
              {match && (
                <button type="button" className="btn-quiet" disabled={busy || undecided || same === false} onClick={() => resolve({ recordIds: ids, resolution: { kind: 'link' }, workId }, 'linked')}>Just link loans</button>
              )}
              <button type="button" className="btn-link" disabled={busy} onClick={() => run(() => setDismissed(ids, true))}>Dismiss</button>
            </div>
            <p className="ib-note">
              {undecided
                ? 'Say whether it is the same book first.'
                : `Finished is dated ${formatDate(finish)}, the borrow month.`}
            </p>
          </>
        )}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </li>
  )
}

export function Inbox() {
  const pending = useRecords('pending')
  const dismissed = useRecords('dismissed')
  const works = useWorksRaw()
  const grPending = useGoodreads('pending')
  const grDismissed = useGoodreads('dismissed')
  const [grSummary, setGrSummary] = useState<string | undefined>()
  const [view, setView] = useState<'pending' | 'dismissed'>('pending')
  const [summary, setSummary] = useState<ImportSummary | undefined>()
  const [error, setError] = useState<string | undefined>()
  const [note, setNote] = useState<string | undefined>()
  const [importing, setImporting] = useState(false)
  const [undo, setUndo] = useState<{ text: string; run: () => Promise<void> } | undefined>()
  const fileRef = useRef<HTMLInputElement>(null)
  const grFileRef = useRef<HTMLInputElement>(null)

  const pendingGroups = useMemo(() => buildGroups(pending ?? [], works), [pending, works])
  const dismissedGroups = useMemo(() => buildGroups(dismissed ?? [], works), [dismissed, works])
  const clean = pendingGroups.filter(isClean)
  const groups = view === 'pending' ? pendingGroups : dismissedGroups

  async function onFile(file: File | undefined) {
    if (!file) return
    setImporting(true)
    setError(undefined)
    setSummary(undefined)
    setGrSummary(undefined)
    setNote(undefined)
    try {
      const json = JSON.parse(await file.text()) as unknown
      setSummary(await importLibby(json, file.name))
      setView('pending')
    } catch (e) {
      setError(
        e instanceof ImportFormatError
          ? e.message
          : e instanceof SyntaxError
            ? 'That file is not valid JSON. Libby exports the timeline as a .json file.'
            : 'The import failed and nothing was added.',
      )
    } finally {
      setImporting(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function acceptClean() {
    const receipts: ResolveReceipt[] = []
    for (const g of clean) {
      receipts.push(await resolveGroupWithReceipt({ recordIds: g.records.map((r) => r.id!), resolution: { kind: 'link' }, workId: g.match!.work.id }))
    }
    setUndo({
      text: `Linked the loans for ${receipts.length} ${receipts.length === 1 ? 'book' : 'books'} you already had. Nothing was marked finished.`,
      run: async () => { for (const r of [...receipts].reverse()) await undoResolve(r) },
    })
  }

  async function doUndo() {
    if (!undo) return
    await undo.run()
    setUndo(undefined)
    setNote('Undone. Those rows are back in your Inbox.')
  }

  async function onGoodreads(file: File | undefined) {
    if (!file) return
    setImporting(true)
    setError(undefined)
    setSummary(undefined)
    setGrSummary(undefined)
    setNote(undefined)
    try {
      const s = await importGoodreads(await file.text(), file.name, db)
      const parts = [`${s.added} new`, s.updates ? `${s.updates} changed` : '', s.refreshed ? `${s.refreshed} waiting rows updated` : '', s.unchanged ? `${s.unchanged} unchanged` : '', s.keptYours ? `${s.keptYours} changed at Goodreads but left as you edited them` : ''].filter(Boolean)
      setGrSummary(`Found ${s.found} Goodreads books: ${parts.join(', ')}.${s.ignored ? ` ${s.ignored} rows were skipped.` : ''}`)
      setView('pending')
    } catch (e) {
      setError(e instanceof GoodreadsFormatError ? e.message : 'The import failed and nothing was added.')
    } finally {
      setImporting(false)
      if (grFileRef.current) grFileRef.current.value = ''
    }
  }

  return (
    <main className="library inbox">
      <div className="lib-head">
        <h1>Inbox</h1>
        <span className="sample-note">{pendingGroups.length + (grPending?.length ?? 0)} to review</span>
      </div>

      <div className="ib-bar">
        <label className="btn-primary file-btn">
          {importing ? 'Reading file…' : 'Import Libby export'}
          <input ref={fileRef} type="file" accept=".json,application/json" className="sr-only" disabled={importing} onChange={(e) => void onFile(e.target.files?.[0])} />
        </label>
        <label className="btn-quiet file-btn">
          Import Goodreads export
          <input ref={grFileRef} type="file" accept=".csv,text/csv" className="sr-only" disabled={importing} onChange={(e) => void onGoodreads(e.target.files?.[0])} />
        </label>
        {clean.length > 0 && view === 'pending' && (
          <button type="button" className="btn-quiet" onClick={() => void acceptClean()}>Link {clean.length} clean {clean.length === 1 ? 'match' : 'matches'}</button>
        )}
      </div>
      <p className="hint ib-help">Libby: open Timeline, then Actions, then Export timeline, and choose JSON. Only borrows are read. Goodreads: on goodreads.com choose My Books, then Import and export, then Export Library, and pick the .csv file.</p>

      {summary && (
        <p className="ib-summary" role="status">
          Found {summary.found} borrows: {summary.added} new{summary.alreadySeen > 0 ? `, ${summary.alreadySeen} already seen` : ''}
          {summary.ignored > 0 ? `. ${summary.ignored} other ${summary.ignored === 1 ? 'row was' : 'rows were'} skipped.` : '.'}
        </p>
      )}
      {grSummary && <p className="ib-summary" role="status">{grSummary}</p>}
      {undo && (
        <p className="ib-summary undo" role="status">
          {undo.text}
          <button type="button" className="btn-link inline" onClick={() => void doUndo()}>Undo</button>
        </p>
      )}
      {note && <p className="ib-summary" role="status">{note}</p>}
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="shelf-tabs" role="group" aria-label="Inbox view">
        <button type="button" className="shelf-tab" aria-pressed={view === 'pending'} onClick={() => setView('pending')}>To review <span>{pendingGroups.length + (grPending?.length ?? 0)}</span></button>
        <button type="button" className="shelf-tab" aria-pressed={view === 'dismissed'} onClick={() => setView('dismissed')}>Dismissed <span>{dismissedGroups.length + (grDismissed?.length ?? 0)}</span></button>
      </div>

      {pending === undefined ? (
        <p className="state" role="status">Opening your inbox…</p>
      ) : groups.length === 0 && (view === 'pending' ? grPending : grDismissed)?.length === 0 ? (
        <div className="state">
          <p className="state-title">{view === 'pending' ? 'Inbox is clear' : 'Nothing dismissed'}</p>
          <p>{view === 'pending' ? 'Import a Libby or Goodreads export and its books will wait here for you to review.' : 'Dismissed borrows show up here so you can bring them back.'}</p>
        </div>
      ) : (
        <ul className="ib-list" aria-label={view === 'pending' ? 'Books to review' : 'Dismissed books'}>
          {(view === 'pending' ? grPending : grDismissed)?.map((r) => (
            <GoodreadsRow key={`gr${r.id}-${JSON.stringify(r.seen)}`} rec={r} works={works} dismissed={view === 'dismissed'} onDone={(text, run) => { setNote(undefined); setUndo({ text, run }) }} />
          ))}
          {groups.map((g) => <GroupRow key={g.key} group={g} dismissed={view === 'dismissed'} onResolved={(r, what) => { setNote(undefined); setUndo({ text: `Marked “${r.title}” ${what}.`, run: () => undoResolve(r) }) }} />)}
        </ul>
      )}
    </main>
  )
}
