import { useMemo, useState } from 'react'
import { GENRES, NO_GENRE_INK, genre } from '../lib/genres'
import { computeStats, type Key, type YearFilter } from '../lib/stats'
import { useReadingData } from '../storage'
import type { Format } from '../types'

const inkOf = (k: Key) => (k === 'none' ? NO_GENRE_INK : genre(k).ink)
const labelOf = (k: Key) => (k === 'none' ? 'No genre' : genre(k).label)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FORMAT_LABEL: Record<Format, string> = { ebook: 'Ebook', audiobook: 'Audiobook', print: 'Print' }
const halfLabel = (v: number) => (Number.isInteger(v) ? String(v) : v < 1 ? '½' : `${Math.floor(v)}½`)

/** One block per book, coloured by its Genre, so a column's height is its count. */
function Spines({ books, cell }: { books: Key[]; cell: number }) {
  return (
    <div className="spines" style={{ ['--cell' as string]: `${cell}px` }}>
      {books.map((k, i) => <span key={i} className="spine" style={{ background: inkOf(k) }} />)}
    </div>
  )
}

export function Stats() {
  const data = useReadingData()
  const [year, setYear] = useState<YearFilter>('all')
  const s = useMemo(() => (data ? computeStats(data.readings, data.works, year) : undefined), [data, year])

  if (!s) return <main className="library stats"><div className="lib-head"><h1>Stats</h1></div><p className="state" role="status">Counting your books…</p></main>
  if (s.years.length === 0 && s.unknownDate === 0 && s.dnfCount === 0) {
    return (
      <main className="library stats">
        <div className="lib-head"><h1>Stats</h1></div>
        <div className="state"><p className="state-title">Nothing to count yet</p><p>Finish a book, or clear your Inbox, and your reading history shows up here.</p></div>
      </main>
    )
  }

  const maxYear = Math.max(1, ...s.perYear.map((y) => y.books.length), s.unknownDateBooks.length)
  const yearCell = Math.max(4, Math.min(16, Math.floor(200 / maxYear)))
  const maxMonth = Math.max(1, ...s.perMonth.map((m) => m.length))
  const monthCell = Math.max(4, Math.min(16, Math.floor(200 / maxMonth)))
  const maxFormat = Math.max(1, ...s.formats.map((f) => f.counts.ebook + f.counts.audiobook + f.counts.print))
  const maxGenre = Math.max(1, ...s.genres.map((g) => g.count))
  const maxRating = Math.max(1, ...s.ratings.map((r) => r.count))
  const usedGenres = GENRES.filter((g) => s.perYear.some((y) => y.books.includes(g.id)) || s.unknownDateBooks.includes(g.id))
  const hasNone = s.perYear.some((y) => y.books.includes('none')) || s.unknownDateBooks.includes('none')
  const scope = year === 'all' ? 'across all years' : `in ${year}`
  const excluded = year !== 'all' && s.unknownDate > 0

  return (
    <main className="library stats">
      <div className="lib-head"><h1>Stats</h1></div>

      <div className="shelf-tabs" role="tablist" aria-label="Year">
        <button type="button" role="tab" className="shelf-tab" aria-selected={year === 'all'} onClick={() => setYear('all')}>All years</button>
        {s.years.map((y) => (
          <button key={y} type="button" role="tab" className="shelf-tab" aria-selected={year === y} onClick={() => setYear(y)}>{y}</button>
        ))}
      </div>

      <p className="st-summary">
        {s.finishedCount} {s.finishedCount === 1 ? 'book' : 'books'} finished {scope}
        {s.dnfCount > 0 && <> · {s.dnfCount} did not finish</>}
      </p>
      {excluded && <p className="hint">{s.unknownDate} finished {s.unknownDate === 1 ? 'reading has' : 'readings have'} no date and {s.unknownDate === 1 ? 'is' : 'are'} left out of this year.</p>}

      <div className="st-grid">
        <section className="st-card st-wide" aria-labelledby="st-years">
          <h2 id="st-years" className="set-title">Books per year</h2>
          <div className="st-cols" aria-hidden="true">
            {s.perYear.map((y) => (
              <button key={y.year} type="button" className="st-col" aria-pressed={year === y.year} tabIndex={-1} onClick={() => setYear(year === y.year ? 'all' : y.year)}>
                <span className="st-n">{y.books.length}</span>
                <Spines books={y.books} cell={yearCell} />
                <span className="st-l">{y.year}</span>
              </button>
            ))}
            {s.unknownDateBooks.length > 0 && (
              <div className="st-col unknown">
                <span className="st-n">{s.unknownDateBooks.length}</span>
                <Spines books={s.unknownDateBooks} cell={yearCell} />
                <span className="st-l">Date unknown</span>
              </div>
            )}
          </div>
          <table className="sr-only">
            <caption>Books finished per year</caption>
            <tbody>
              {s.perYear.map((y) => <tr key={y.year}><th>{y.year}</th><td>{y.books.length}</td></tr>)}
              {s.unknownDateBooks.length > 0 && <tr><th>Date unknown</th><td>{s.unknownDateBooks.length}</td></tr>}
            </tbody>
          </table>
          <ul className="st-legend" aria-label="Genre colours">
            {[...usedGenres.map((g) => ({ k: g.id as Key })), ...(hasNone ? [{ k: 'none' as Key }] : [])].map(({ k }) => (
              <li key={k}><span className="spine" style={{ background: inkOf(k) }} />{labelOf(k)}</li>
            ))}
          </ul>
          <p className="hint">Each spine takes its book's first genre. The Genres chart below counts every genre.</p>
        </section>

        {s.monthYear !== undefined && (
          <section className="st-card st-wide" aria-labelledby="st-months">
            <h2 id="st-months" className="set-title">Books per month, {s.monthYear}</h2>
            <div className="st-cols months" aria-hidden="true">
              {s.perMonth.map((m, i) => (
                <div key={i} className="st-col">
                  <span className="st-n">{m.length || ''}</span>
                  <Spines books={m} cell={monthCell} />
                  <span className="st-l">{MONTHS[i]}</span>
                </div>
              ))}
            </div>
            <table className="sr-only">
              <caption>Books finished per month in {s.monthYear}</caption>
              <tbody>{s.perMonth.map((m, i) => <tr key={i}><th>{MONTHS[i]}</th><td>{m.length}</td></tr>)}</tbody>
            </table>
            <p className="hint">Spines are coloured by each book's first genre, as in the yearly chart.</p>
            {s.monthUnknown > 0 && <p className="hint">{s.monthUnknown} finished in {s.monthYear} {s.monthUnknown === 1 ? 'is' : 'are'} recorded only to the year, so {s.monthUnknown === 1 ? 'it is' : 'they are'} not in a month.</p>}
          </section>
        )}

        <section className="st-card" aria-labelledby="st-genres">
          <h2 id="st-genres" className="set-title">Genres</h2>
          <ul className="st-bars">
            {s.genres.map((g) => (
              <li key={g.key}>
                <span className="st-bl">{labelOf(g.key)}</span>
                <span className="st-track"><span className="st-fill" style={{ width: `${(g.count / maxGenre) * 100}%`, background: inkOf(g.key) }} /></span>
                <span className="st-bn">{g.count}</span>
              </li>
            ))}
          </ul>
          <p className="hint">A book with several genres counts once in each.</p>
        </section>

        <section className="st-card" aria-labelledby="st-ratings">
          <h2 id="st-ratings" className="set-title">Ratings</h2>
          <div className="st-cols ratings" aria-hidden="true">
            {s.ratings.map((r) => (
              <div key={r.value} className="st-col">
                <span className="st-n">{r.count || ''}</span>
                <span className="st-rbar" style={{ height: `${(r.count / maxRating) * 120}px` }} />
                <span className="st-l">{halfLabel(r.value)}</span>
              </div>
            ))}
          </div>
          <table className="sr-only">
            <caption>Ratings, in half-star steps</caption>
            <tbody>{s.ratings.map((r) => <tr key={r.value}><th>{r.value} stars</th><td>{r.count}</td></tr>)}</tbody>
          </table>
          <p className="hint">{s.unrated} unrated {s.unrated === 1 ? 'reading is' : 'readings are'} not counted above. Unrated is not a low score.</p>
        </section>

        <section className="st-card" aria-labelledby="st-formats">
          <h2 id="st-formats" className="set-title">Formats by year</h2>
          <ul className="st-bars stacked">
            {s.formats.map((f) => {
              const total = f.counts.ebook + f.counts.audiobook + f.counts.print
              return (
                <li key={f.label} className={year === f.year ? 'on' : ''}>
                  <span className="st-bl">{f.label}</span>
                  <span className="st-track">
                    <span className="st-len" style={{ width: `${(total / maxFormat) * 100}%` }}>
                      {(Object.keys(FORMAT_LABEL) as Format[]).map((k) => f.counts[k] > 0 && (
                        <span key={k} className={`st-seg fmt-${k}`} style={{ flexGrow: f.counts[k] }} title={`${FORMAT_LABEL[k]} ${f.counts[k]}`}>{f.counts[k]}</span>
                      ))}
                    </span>
                  </span>
                  <span className="st-bn">{total}</span>
                </li>
              )
            })}
          </ul>
          <ul className="st-legend" aria-label="Format colours">
            {(Object.keys(FORMAT_LABEL) as Format[]).map((k) => <li key={k}><span className={`spine fmt-${k}`} />{FORMAT_LABEL[k]}</li>)}
          </ul>
        </section>

        <section className="st-card" aria-labelledby="st-authors">
          <h2 id="st-authors" className="set-title">Top authors</h2>
          {s.authors.length === 0 ? <p className="hint">No authors to rank {scope}.</p> : (
            <ol className="st-rank">
              {s.authors.map((a, i) => <li key={a.author}><span className="st-pos">{i + 1}</span><span className="st-bl">{a.author}</span><span className="st-bn">{a.count}</span></li>)}
            </ol>
          )}
        </section>
      </div>
    </main>
  )
}
