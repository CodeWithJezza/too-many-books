import { Jacket } from '../components/Jacket'
import { Icon } from '../components/Icon'
import { Stars } from '../components/Stars'
import { formatDate, precisionNote } from '../lib/dates'
import { genre, inkOf } from '../lib/genres'
import { useWorkDetail } from '../storage'
import type { Format, ReadingStatus } from '../types'

const FORMAT: Record<Format, string> = { ebook: 'Ebook', audiobook: 'Audiobook', print: 'Print' }
const STATUS: Record<ReadingStatus, string> = { reading: 'Reading now', finished: 'Finished', dnf: 'Did not finish' }

export function WorkPanel({ id, onClose, onEdit }: { id?: number; onClose: () => void; onEdit: (id: number) => void }) {
  const work = useWorkDetail(id)

  return (
    <aside className="panel" aria-label="Work details">
      <button type="button" className="panel-close" onClick={onClose} aria-label="Close details">
        <Icon name="back" />
        <span>Library</span>
      </button>
      {work === undefined || work === null ? (
        <div className="panel-empty">
          <p className="panel-empty-title">Pick a book</p>
          <p>Its readings, loans and tags open here.</p>
        </div>
      ) : (
        <div className="panel-body" key={work.id} style={{ ['--ink-genre' as string]: inkOf(work.genres) }}>
          <header className="work-head">
            <Jacket work={work} size="panel" />
            <div>
              <h2>{work.title}</h2>
              <p className="work-author">{work.author}</p>
              <p className="work-meta">
                {work.series && <>{work.series.name} #{work.series.position}</>}
                {work.series && work.pageCount ? ' · ' : ''}
                {work.pageCount ? `${work.pageCount} pages` : ''}
              </p>
              <button type="button" className="btn-quiet edit-btn" onClick={() => onEdit(work.id)}>Edit</button>
            </div>
          </header>

          <ul className="chips-static" aria-label="Genres and tags">
            {work.genres.map((g) => (
              <li key={g} className="chip-genre" style={{ ['--ink-genre' as string]: genre(g).ink }}>{genre(g).label}</li>
            ))}
            {work.tags.map((t) => <li key={t} className="chip-tag">{t}</li>)}
            {work.synthetic && <li className="chip-tag">Sample book · invented data</li>}
            {work.shelves.includes('want') && <li className="chip-tag">On Want to read</li>}
          </ul>

          <section aria-labelledby="readings-h">
            <h3 id="readings-h" className="section-head">Readings <span>{work.readings.length}</span></h3>
            {work.readings.length === 0 && <p className="none">No readings yet.</p>}
            <ol className="rows">
              {[...work.readings].reverse().map((r) => (
                <li key={r.id} className="row">
                  <div className="row-main">
                    <span className="row-title">{FORMAT[r.format]} · {STATUS[r.status]}</span>
                    {r.status !== 'reading' && r.status !== 'finished' && <span className="row-tag">DNF</span>}
                    <Stars value={r.rating} />
                  </div>
                  <div className="row-sub">
                    {r.status === 'reading'
                      ? <>Started {formatDate(r.start)}</>
                      : <>
                          {r.status === 'dnf' ? 'Stopped ' : ''}{formatDate(r.finish)}
                          {precisionNote(r.finish) && <em> ({precisionNote(r.finish)})</em>}
                          {r.start && <> · started {formatDate(r.start)}</>}
                        </>}
                  </div>
                  {r.review && <p className="row-review">{r.review}</p>}
                </li>
              ))}
            </ol>
          </section>

          {work.loans.length > 0 && (
            <section aria-labelledby="loans-h">
              <h3 id="loans-h" className="section-head">Loans <span>{work.loans.length}</span></h3>
              <ol className="rows">
                {work.loans.map((l) => (
                  <li key={l.id} className="row">
                    <div className="row-main"><span className="row-title">{l.source === 'libby' ? 'Libby' : 'Library'}{l.format ? ` · ${FORMAT[l.format]}` : ""}</span></div>
                    <div className="row-sub">Borrowed {l.borrowed ? formatDate(l.borrowed) : 'date unknown'}{l.library ? ` · ${l.library}` : ''}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      )}
    </aside>
  )
}
