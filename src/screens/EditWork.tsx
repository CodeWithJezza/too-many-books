import { useEffect, useMemo, useRef, useState } from 'react'
import { DateField, Segmented, dateOk } from '../components/FormControls'
import { Icon } from '../components/Icon'
import { Jacket } from '../components/Jacket'
import { StarsInput } from '../components/StarsInput'
import { fromDatePart, todayIso, toDatePart, withPrecision, type Precision } from '../lib/dates'
import { GENRES } from '../lib/genres'
import { deleteWork, saveWorkEdits, useWorkDetail, useWorksRaw, type ReadingEdit } from '../storage'
import type { Format, GenreId, ReadingStatus, WorkSummary } from '../types'

const STATUSES: { id: ReadingStatus; label: string }[] = [
  { id: 'reading', label: 'Reading now' },
  { id: 'finished', label: 'Finished' },
  { id: 'dnf', label: 'DNF' },
]
const FORMATS: { id: Format; label: string }[] = [
  { id: 'print', label: 'Print' },
  { id: 'ebook', label: 'Ebook' },
  { id: 'audiobook', label: 'Audiobook' },
]

interface DateState { iso: string; precision: Precision }
interface ReadingForm {
  key: number
  id?: number
  status: ReadingStatus
  format: Format
  start: DateState
  finish: DateState
  rating?: number
  review: string
}

let nextKey = 1
const blank = (): ReadingForm => ({ key: nextKey++, status: 'finished', format: 'print', start: fromDatePart(), finish: { iso: todayIso(), precision: 'day' }, review: '' })

export function EditWork({ id, onClose, onDeleted, onDirty, leaveRequested, onLeaveAnswer }: {
  id: number
  onClose: () => void
  onDeleted: () => void
  onDirty: (dirty: boolean) => void
  /** The reader tried to navigate away; ask before discarding. */
  leaveRequested: boolean
  onLeaveAnswer: (discard: boolean) => void
}) {
  const detail = useWorkDetail(id)
  const allWorks = useWorksRaw()
  const [ready, setReady] = useState(false)
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [genres, setGenres] = useState<GenreId[]>([])
  const [tags, setTags] = useState<string[]>([])
  const [tagText, setTagText] = useState('')
  const [seriesName, setSeriesName] = useState('')
  const [seriesPos, setSeriesPos] = useState('')
  const [pages, setPages] = useState('')
  const [want, setWant] = useState(false)
  const [readings, setReadings] = useState<ReadingForm[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [initial, setInitial] = useState('')
  const [askDiscard, setAskDiscard] = useState(false)

  useEffect(() => {
    if (ready || !detail) return
    setTitle(detail.title)
    setAuthor(detail.author)
    setGenres(detail.genres)
    setTags(detail.tags)
    setSeriesName(detail.series?.name ?? '')
    setSeriesPos(detail.series ? String(detail.series.position) : '')
    setPages(detail.pageCount ? String(detail.pageCount) : '')
    setWant(detail.shelves.includes('want'))
    setReadings(detail.readings.map((r) => ({
      key: nextKey++, id: r.id, status: r.status, format: r.format,
      start: fromDatePart(r.start), finish: fromDatePart(r.finish), rating: r.rating, review: r.review ?? '',
    })))
    setReady(true)
  }, [detail, ready])

  const snapshot = JSON.stringify({ title, author, genres, tags, tagText, seriesName, seriesPos, pages, want, readings })
  useEffect(() => { if (ready && initial === '') setInitial(snapshot) }, [ready, initial, snapshot])
  const dirty = ready && initial !== '' && snapshot !== initial
  useEffect(() => { onDirty(dirty) }, [dirty, onDirty])
  useEffect(() => () => onDirty(false), [onDirty])
  const discardOpen = askDiscard || (leaveRequested && dirty)
  // Nothing to lose: let a navigation request through immediately.
  useEffect(() => { if (leaveRequested && !dirty) onLeaveAnswer(true) }, [leaveRequested, dirty, onLeaveAnswer])
  const keepRef = useRef<HTMLButtonElement>(null)
  const busy = useRef(false)
  // When the question opens, put it and its safe answer where the reader is looking.
  useEffect(() => { if (discardOpen) keepRef.current?.focus() }, [discardOpen])
  const cancel = () => (dirty ? setAskDiscard(true) : onClose())

  const knownTags = useMemo(() => [...new Set(allWorks.flatMap((w) => w.tags))].sort(), [allWorks])

  if (detail === null) return <main className="library"><div className="state"><p className="state-title">That book is gone</p><button type="button" className="btn-quiet" onClick={onClose}>Back to Library</button></div></main>
  if (!ready) return <main className="library"><p className="state" role="status">Opening the editor…</p></main>

  const patch = (key: number, p: Partial<ReadingForm>) => setReadings((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)))
  const addTag = () => {
    const t = tagText.trim()
    if (t && !tags.includes(t)) setTags([...tags, t])
    setTagText('')
  }
  const posOk = seriesPos === '' ? seriesName.trim() === '' : Number.isFinite(Number(seriesPos))
  const pagesOk = pages === '' || (Number.isInteger(Number(pages)) && Number(pages) > 0)
  const datesBad = readings.some((r) => (r.status !== 'reading' && !dateOk(r.finish.iso, r.finish.precision)) || !dateOk(r.start.iso, r.start.precision))
  const canSave = title.trim() !== '' && posOk && pagesOk && !datesBad && !saving
  const preview: WorkSummary = { id, title: title || 'Untitled', author, genres, tags: [], shelves: [], readingCount: 0, coverUrl: detail?.coverUrl, series: seriesName.trim() && seriesPos !== '' ? { name: seriesName.trim(), position: Number(seriesPos) } : undefined }

  async function save() {
    if (!canSave || busy.current) return
    busy.current = true
    setSaving(true)
    setError(undefined)
    try {
      const edits: ReadingEdit[] = readings.map((r) => ({
        id: r.id, status: r.status, format: r.format,
        start: toDatePart(r.start.iso, r.start.precision),
        finish: r.status === 'reading' ? undefined : toDatePart(r.finish.iso, r.finish.precision),
        rating: r.rating, review: r.review,
      }))
      await saveWorkEdits(id, {
        title, author, genres, tags: tagText.trim() ? [...tags, tagText.trim()] : tags,
        series: seriesName.trim() ? { name: seriesName, position: Number(seriesPos) } : undefined,
        pageCount: pages ? Number(pages) : undefined, wantToRead: want,
      }, edits)
      onClose()
    } catch (e) {
      busy.current = false
      setSaving(false)
      setError(e instanceof Error ? e.message : 'Could not save. Nothing was changed.')
    }
  }

  async function remove() {
    try {
      await deleteWork(id)
      onDeleted()
    } catch {
      setError('Could not delete the book. Nothing was changed.')
    }
  }

  return (
    <main className="library add-screen">
      <div className="lib-head"><h1>Edit book</h1></div>
      <div className="add-body">
        <form className="form" onSubmit={(e) => { e.preventDefault(); void save() }}>
          <div className="field">
            <label className="label" htmlFor="e-title">Title</label>
            <input id="e-title" className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="field">
            <label className="label" htmlFor="e-author">Author</label>
            <input id="e-author" className="input" value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>

          <fieldset className="field">
            <legend>Genres</legend>
            <div className="genre-picks">
              {GENRES.map((g) => {
                const on = genres.includes(g.id)
                return <button key={g.id} type="button" className="genre-pick" aria-pressed={on} style={{ ['--ink-genre' as string]: g.ink }} onClick={() => setGenres(on ? genres.filter((x) => x !== g.id) : [...genres, g.id])}>{g.label}</button>
              })}
            </div>
          </fieldset>

          <div className="field">
            <label className="label" htmlFor="e-tag">Tags</label>
            {tags.length > 0 && (
              <ul className="tag-list" aria-label="Tags">
                {tags.map((t) => <li key={t}>{t}<button type="button" aria-label={`Remove tag ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}><Icon name="close" size={16} /></button></li>)}
              </ul>
            )}
            <input id="e-tag" className="input" list="e-tags" placeholder="Type a tag, then press Enter" value={tagText} onChange={(e) => setTagText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag() } }} onBlur={addTag} />
            <datalist id="e-tags">{knownTags.filter((t) => !tags.includes(t)).map((t) => <option key={t} value={t} />)}</datalist>
          </div>

          <div className="field two">
            <div className="field">
              <label className="label" htmlFor="e-series">Series</label>
              <input id="e-series" className="input" placeholder="Optional" value={seriesName} onChange={(e) => setSeriesName(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="e-pos">Position</label>
              <input id="e-pos" className="input" inputMode="decimal" placeholder="1, 2.5…" value={seriesPos} onChange={(e) => setSeriesPos(e.target.value)} aria-invalid={!posOk} />
            </div>
            <div className="field">
              <label className="label" htmlFor="e-pages">Pages</label>
              <input id="e-pages" className="input" inputMode="numeric" placeholder="Optional" value={pages} onChange={(e) => setPages(e.target.value)} aria-invalid={!pagesOk} />
            </div>
          </div>
          {(!posOk || !pagesOk) && <p className="form-error" role="alert">{!posOk ? (seriesPos === '' ? 'Enter the book’s position in the series, such as 2 or 2.5, or clear the series name.' : 'Series position must be a number, such as 2 or 2.5.') : 'Pages must be a whole number.'}</p>}

          <label className="check">
            <input type="checkbox" checked={want} onChange={(e) => setWant(e.target.checked)} />
            <span>On my Want to read shelf</span>
          </label>

          <section className="edit-readings" aria-labelledby="e-readings">
            <h2 id="e-readings" className="set-title">Readings</h2>
            {readings.length === 0 && <p className="hint">No readings. Add one if you have read or started this book.</p>}
            {readings.map((r, i) => (
              <fieldset key={r.key} className="edit-reading">
                <legend>Reading {i + 1}</legend>
                <Segmented label="Status" value={r.status} options={STATUSES} onChange={(status) => patch(r.key, { status })} />
                <Segmented label="Format" value={r.format} options={FORMATS} onChange={(format) => patch(r.key, { format })} />
                <DateField label="Started" iso={r.start.iso} precision={r.start.precision} onIso={(iso) => patch(r.key, { start: { ...r.start, iso } })} onPrecision={(p) => patch(r.key, { start: withPrecision(r.start, p) })} />
                {r.status !== 'reading' && (
                  <DateField label={r.status === 'dnf' ? 'Stopped' : 'Finished'} iso={r.finish.iso} precision={r.finish.precision} onIso={(iso) => patch(r.key, { finish: { ...r.finish, iso } })} onPrecision={(p) => patch(r.key, { finish: withPrecision(r.finish, p) })} />
                )}
                <div className="field">
                  <span className="label">Rating</span>
                  <StarsInput value={r.rating} onChange={(rating) => patch(r.key, { rating })} />
                </div>
                <div className="field">
                  <label className="label" htmlFor={`e-rev-${r.key}`}>Review</label>
                  <textarea id={`e-rev-${r.key}`} className="input" rows={3} value={r.review} onChange={(e) => patch(r.key, { review: e.target.value })} />
                </div>
                <button type="button" className="btn-link" onClick={() => setReadings(readings.filter((x) => x.key !== r.key))}>Remove this reading</button>
              </fieldset>
            ))}
            <button type="button" className="btn-quiet" onClick={() => setReadings([...readings, blank()])}><Icon name="plus" size={18} /> Add a reading</button>
          </section>

          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="sticky-bar">
            {discardOpen && (
              <div className="confirm" role="alertdialog" aria-labelledby="e-disc">
                <p id="e-disc" className="confirm-title">Discard your changes?</p>
                <p>You have edits that are not saved. They will be lost.</p>
                <div className="form-actions">
                  <button type="button" className="btn-danger" onClick={() => { setAskDiscard(false); if (leaveRequested) onLeaveAnswer(true); else onClose() }}>Discard changes</button>
                  <button type="button" ref={keepRef} className="btn-quiet" onClick={() => { setAskDiscard(false); if (leaveRequested) onLeaveAnswer(false) }}>Keep editing</button>
                </div>
              </div>
            )}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={!canSave}>Save changes</button>
              <button type="button" className="btn-quiet" onClick={cancel}>Cancel</button>
            </div>
          </div>

          <section className="danger-zone" aria-labelledby="e-del">
            <h2 id="e-del" className="set-title">Delete this book</h2>
            <p>Removes the book with its readings and loans from your library. Import records are kept, so a later import will not bring it back.</p>
            {confirmDelete ? (
              <div className="confirm" role="alertdialog" aria-labelledby="e-del-c">
                <p id="e-del-c" className="confirm-title">Delete “{detail?.title}”, its {detail?.readings.length ?? 0} {detail?.readings.length === 1 ? 'reading' : 'readings'} and {detail?.loans.length ?? 0} {detail?.loans.length === 1 ? 'loan' : 'loans'}?</p>
                <div className="form-actions">
                  <button type="button" className="btn-danger" onClick={() => void remove()}>Delete book</button>
                  <button type="button" className="btn-quiet" onClick={() => setConfirmDelete(false)}>Keep it</button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn-quiet" onClick={() => setConfirmDelete(true)}>Delete book…</button>
            )}
          </section>
        </form>
        <div className="add-preview" aria-hidden="true"><Jacket work={preview} size="preview" /></div>
      </div>
    </main>
  )
}
