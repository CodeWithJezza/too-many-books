import { useState } from 'react'
import { Jacket } from '../components/Jacket'
import { formatDate } from '../lib/dates'
import { GENRES } from '../lib/genres'
import { matchGoodreads } from '../lib/inbox'
import { useLookup } from '../import/lookup'
import { suggestGenres } from '../metadata/suggest'
import { db } from '../storage'
import { applyGoodreadsUpdate, keepMine, resolveGoodreads, setGoodreadsDismissed, undoResolveGoodreads, undoUpdate, type GoodreadsAs, type UpdateSnapshot } from '../storage/goodreads'
import { toDatePart } from '../lib/dates'
import type { Format, GenreId, GoodreadsFields, GoodreadsRecord, Work, WorkSummary } from '../types'

const FORMATS: { id: Format; label: string }[] = [
  { id: 'print', label: 'Print' },
  { id: 'ebook', label: 'Ebook' },
  { id: 'audiobook', label: 'Audiobook' },
]
const SHELF_LABEL: Record<string, string> = { read: 'Read', 'to-read': 'Want to read', 'currently-reading': 'Reading now' }
const AS: { id: GoodreadsAs; label: string }[] = [
  { id: 'finished', label: 'Finished' },
  { id: 'reading', label: 'Reading now' },
  { id: 'want', label: 'Want to read' },
]
const defaultAs = (s: GoodreadsFields['shelf']): GoodreadsAs => (s === 'read' ? 'finished' : s === 'currently-reading' ? 'reading' : 'want')

const showDate = (iso?: string) => (iso ? formatDate(toDatePart(iso, 'day')) : 'unknown')
const showRating = (r?: number) => (r ? `${r} ${r === 1 ? 'star' : 'stars'}` : 'unrated')
const preview = (t?: string) => (t ? (t.length > 90 ? `${t.slice(0, 90)}…` : t) : 'none')

const FIELD_NAME: Record<string, string> = { shelf: 'shelf', rating: 'rating', dateRead: 'date read', review: 'review', title: 'title', author: 'author' }
const names = (ks: string[]) => ks.map((k) => FIELD_NAME[k]).join(', ')

/** Says what actually happened, including when nothing did. */
function applyMessage(s: UpdateSnapshot): string {
  if (s.applied.length === 0) return `Nothing changed for “${s.title}”: you had edited those fields here.`
  return `Updated ${names(s.applied)} for “${s.title}”.${s.left.length ? ` Left as you set them: ${names(s.left)}.` : ''}`
}

function fieldLine(k: keyof GoodreadsFields, from: GoodreadsFields, to: GoodreadsFields): string {
  switch (k) {
    case 'shelf': return `Shelf: ${SHELF_LABEL[from.shelf]} → ${SHELF_LABEL[to.shelf]}`
    case 'rating': return `Rating: ${showRating(from.rating)} → ${showRating(to.rating)}`
    case 'dateRead': return `Date read: ${showDate(from.dateRead)} → ${showDate(to.dateRead)}`
    case 'review': return `Review: “${preview(from.review)}” → “${preview(to.review)}”`
    case 'title': return `Title: ${from.title} → ${to.title}`
    case 'author': return `Author: ${from.author} → ${to.author}`
  }
}

export function GoodreadsRow({ rec, works, dismissed, onDone }: {
  rec: GoodreadsRecord
  works: Work[]
  dismissed: boolean
  onDone: (text: string, undo: () => Promise<void>) => void
}) {
  const f = rec.seen
  const isUpdate = !!rec.applied && !!rec.changed
  const match = isUpdate || dismissed ? undefined : matchGoodreads(works, rec)
  const ownWork = rec.workId ? works.find((w) => w.id === rec.workId) : undefined
  const [as, setAs] = useState<GoodreadsAs>(defaultAs(f.shelf))
  const [format, setFormat] = useState<Format>(rec.formatHint ?? 'print')
  const [same, setSame] = useState<boolean | undefined>(match?.kind === 'fuzzy' ? undefined : true)
  const [genres, setGenres] = useState<GenreId[]>([])
  const [showGenres, setShowGenres] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const workId = match && same ? match.work.id : undefined
  const undecided = match?.kind === 'fuzzy' && same === undefined
  const makesNewWork = !isUpdate && workId === undefined
  const { ref, lookup } = useLookup(f.title, f.author, !dismissed && makesNewWork)
  const hit = lookup.hit
  const suggested = hit ? suggestGenres(hit.subjects) : []
  const details = makesNewWork ? { genres, pageCount: hit?.pageCount, coverUrl: hit?.coverUrl, openLibrary: hit?.key, isbn: hit?.isbns } : undefined
  const needsFormat = isUpdate ? !!rec.changed?.includes('shelf') && !rec.readingId && f.shelf !== 'to-read' : as !== 'want' && as !== 'link'

  async function run(fn: () => Promise<void>) {
    setBusy(true)
    setError(undefined)
    try {
      await fn()
    } catch (e) {
      setBusy(false)
      setError(e instanceof Error ? e.message : 'That did not save. Nothing changed.')
    }
  }

  const asWork: WorkSummary = { id: 0, title: f.title, author: f.author, genres: ownWork?.genres ?? genres, tags: [], shelves: [], readingCount: 0, coverUrl: ownWork?.coverUrl ?? hit?.coverUrl }

  return (
    <li className="ib-row" ref={ref}>
      <Jacket work={asWork} size="mini" />
      <div className="ib-main">
        <h2 className="ib-title">{f.title}</h2>
        <p className="ib-author">{f.author || 'Author unknown'}</p>

        {isUpdate ? (
          <>
            <p className="ib-loans">Changed at Goodreads since you last took its values:</p>
            <ul className="ib-changes" aria-label="What changed at Goodreads">
              {rec.changed!.map((k) => <li key={k}>{fieldLine(k, rec.applied!, f)}</li>)}
            </ul>
            <p className="ib-note">Anything you have edited here since is left as you set it.</p>
          </>
        ) : (
          <p className="ib-loans">
            Goodreads · {SHELF_LABEL[f.shelf]}{f.rating ? ` · ${showRating(f.rating)}` : ''}{f.shelf === 'read' ? (f.dateRead ? ` · finished ${showDate(f.dateRead)}` : ' · finished, date unknown') : ''}
          </p>
        )}
        {!isUpdate && f.review && <p className="ib-review">“{preview(f.review)}”</p>}

        {match?.kind === 'exact' && <p className="ib-match">Already in your library as <strong>{match.work.title}</strong>.</p>}
        {match?.kind === 'fuzzy' && (
          <div className="ib-match">
            <p>Is this the same as <strong>{match.work.title}</strong>{match.work.author ? ` by ${match.work.author}` : ''}?</p>
            <div className="segmented" role="radiogroup" aria-label={`Same book as ${match.work.title}`}>
              <button type="button" role="radio" aria-checked={same === true} onClick={() => setSame(true)}>Same book</button>
              <button type="button" role="radio" aria-checked={same === false} onClick={() => setSame(false)}>Different book</button>
            </div>
          </div>
        )}

        {!dismissed && !isUpdate && (
          <div className="ib-genres">
            <div className="segmented" role="radiogroup" aria-label={`Add ${f.title} as`}>
              {AS.map((o) => <button key={o.id} type="button" role="radio" aria-checked={as === o.id} onClick={() => setAs(o.id)}>{o.label}</button>)}
            </div>
            {makesNewWork && (
              <>
                <p className="ib-lookup" role={lookup.state === 'failed' ? 'status' : undefined}>
                  {lookup.state === 'loading' && 'Checking Open Library…'}
                  {lookup.state === 'done' && hit && !undecided && 'Found on Open Library. Its page count and cover are added when you save.'}
                  {lookup.state === 'done' && hit && undecided && 'Found on Open Library. Answer the question above to use it.'}
                  {lookup.state === 'done' && !hit && 'No sure match on Open Library, so nothing is suggested.'}
                  {lookup.state === 'failed' && 'Could not reach Open Library. You can set genres later.'}
                </p>
                <button type="button" className="btn-link" aria-expanded={showGenres} onClick={() => setShowGenres(!showGenres)}>
                  {genres.length ? `Genres: ${genres.map((g) => GENRES.find((x) => x.id === g)?.label).join(', ')}` : suggested.length ? `Set genres (${suggested.length} suggested)` : 'Set genres'}
                </button>
                {showGenres && (
                  <div className="genre-picks" role="group" aria-label={`Genres for ${f.title}`}>
                    {GENRES.map((g) => {
                      const on = genres.includes(g.id)
                      return (
                        <button key={g.id} type="button" className="genre-pick sm" aria-pressed={on} style={{ ['--ink-genre' as string]: g.ink }} onClick={() => setGenres(on ? genres.filter((x) => x !== g.id) : [...genres, g.id])}>
                          {g.label}{suggested.includes(g.id) && <span className="sug"> · suggested</span>}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        <div className="ib-actions">
          {dismissed ? (
            <button type="button" className="btn-quiet" disabled={busy} onClick={() => run(() => setGoodreadsDismissed([rec.id!], false, db))}>Restore to Inbox</button>
          ) : isUpdate ? (
            <>
              {needsFormat && (
                <label className="ib-format"><span className="sr-only">Format</span>
                  <select value={format} onChange={(e) => setFormat(e.target.value as Format)}>{FORMATS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
                </label>
              )}
              <button type="button" className="btn-primary sm" disabled={busy} onClick={() => run(async () => { const s = await applyGoodreadsUpdate(rec.id!, format, db); onDone(applyMessage(s), () => undoUpdate(s, db)) })}>Apply changes</button>
              <button type="button" className="btn-quiet" disabled={busy} onClick={() => run(async () => { const s = await keepMine(rec.id!, db); onDone(`Kept yours for “${s.title}”.`, () => undoUpdate(s, db)) })}>Keep mine</button>
            </>
          ) : (
            <>
              {needsFormat && (
                <label className="ib-format"><span className="sr-only">Format</span>
                  <select value={format} onChange={(e) => setFormat(e.target.value as Format)}>{FORMATS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}</select>
                </label>
              )}
              <button type="button" className="btn-primary sm" disabled={busy || undecided} onClick={() => run(async () => { const r = await resolveGoodreads({ recordId: rec.id!, as, format, workId, details }, db); onDone(`Added “${r.title}”.`, () => undoResolveGoodreads(r, db)) })}>Add</button>
              {match && (
                <button type="button" className="btn-quiet" disabled={busy || undecided || same === false} onClick={() => run(async () => { const r = await resolveGoodreads({ recordId: rec.id!, as: 'link', format, workId }, db); onDone(`Linked “${r.title}” to your copy.`, () => undoResolveGoodreads(r, db)) })}>Just link</button>
              )}
              <button type="button" className="btn-link" disabled={busy} onClick={() => run(() => setGoodreadsDismissed([rec.id!], true, db))}>Dismiss</button>
            </>
          )}
        </div>
        {!dismissed && !isUpdate && undecided && <p className="ib-note">Say whether it is the same book first.</p>}
        {error && <p className="form-error" role="alert">{error}</p>}
      </div>
    </li>
  )
}
