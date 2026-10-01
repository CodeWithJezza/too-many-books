import { useMemo, useState } from 'react'
import { GENRES, NO_GENRE_INK, genre } from '../lib/genres'
import { defaultQuery, noFacets, workFacetsOk, type Facets, type LibraryQuery } from '../lib/filter'
import { buildSeries } from '../lib/series'
import { StatsCompare } from './StatsCompare'
import { computeLoanStats } from '../lib/loanStats'
import { computeAuthors } from '../lib/authors'
import { computePageStats } from '../lib/pages'
import { computeTrends } from '../lib/trends'
import { Icon } from '../components/Icon'
import { setChart, useChart } from '../settings'
import { computeStats, type Key, type YearFilter } from '../lib/stats'
import { useReadingData } from '../storage'
import type { Format, GenreId } from '../types'

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

/** What a tap on a chart selected: shown in a fixed strip, with the way into the books behind it. */
interface Selection { id: string; label: string; count: number; patch: Partial<LibraryQuery> }

const RATING_CHOICES = Array.from({ length: 10 }, (_, i) => 5 - i / 2)

export function Stats({ onOpenLibrary }: { onOpenLibrary: (q: LibraryQuery) => void }) {
  const data = useReadingData()
  const [year, setYear] = useState<YearFilter>('all')
  const [facets, setFacets] = useState<Facets>(noFacets)
  const [sel, setSel] = useState<Selection | undefined>()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const s = useMemo(() => (data ? computeStats(data.readings, data.works, year, facets) : undefined), [data, year, facets])
  const ls = useMemo(() => (data ? computeLoanStats(data.loans, data.readings, data.works, year, facets) : undefined), [data, year, facets])
  const showPages = useChart('pages')
  const showTrends = useChart('trends')
  const showAuthors = useChart('authors')
  const ps = useMemo(() => (data && showPages ? computePageStats(data.readings, data.works, year, facets) : undefined), [data, showPages, year, facets])
  const seriesList = useMemo(() => buildSeries(data?.works ?? [], data?.readings ?? []), [data])
  // Series progress counts volumes (Works), narrowed by genre, tag and series only.
  const seriesShown = useMemo(() => buildSeries((data?.works ?? []).filter((w) => workFacetsOk(w, facets)), data?.readings ?? []).filter((s) => s.owned > 1 || s.gaps > 0), [data, facets])
  const [allSeries, setAllSeries] = useState(false)
  const trends = useMemo(() => (data && showTrends ? computeTrends(data.readings, data.works, facets) : undefined), [data, showTrends, facets])
  const authorStats = useMemo(() => (data && showAuthors ? computeAuthors(data.readings, data.works, year, facets) : undefined), [data, showAuthors, year, facets])
  const [allAuthors, setAllAuthors] = useState(false)
  const tags = useMemo(() => [...new Set((data?.works ?? []).flatMap((w) => w.tags))].sort(), [data])
  const facetsOn = JSON.stringify(facets) !== JSON.stringify(noFacets)
  const setFacet = <K extends keyof Facets>(k: K, v: Facets[K]) => { setFacets((f) => ({ ...f, [k]: v })); setSel(undefined) }

  if (!s || !ls) return <main className="library stats"><div className="lib-head"><h1>Stats</h1></div><p className="state" role="status">Counting your books…</p></main>
  if (!facetsOn && s.years.length === 0 && s.unknownDate === 0 && s.dnfCount === 0) {
    return (
      <main className="library stats">
        <div className="lib-head"><h1>Stats</h1></div>
        <div className="state"><p className="state-title">Nothing to count yet</p><p>Finish a book, or clear your Inbox, and your reading history shows up here.</p></div>
      </main>
    )
  }

  /** The Library query that lists the books behind a bar: this screen's facets and year, then the bar's own. */
  const open = (patch: Partial<LibraryQuery>) => onOpenLibrary({ ...defaultQuery, ...facets, status: 'finished', year: year === 'all' ? 'any' : year, ...patch })
  const pick = (x: Selection) => { setSel(sel?.id === x.id ? undefined : x) }
  const on = (id: string) => sel?.id === id ? true : undefined

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
  const nothing = s.finishedCount === 0 && s.dnfCount === 0 && s.unknownDate === 0

  const chips: { key: string; label: string; clear: Partial<Facets> }[] = []
  if (facets.genre !== 'any') chips.push({ key: 'genre', label: genre(facets.genre).label, clear: { genre: 'any' } })
  if (facets.tag !== 'any') chips.push({ key: 'tag', label: `Tag: ${facets.tag}`, clear: { tag: 'any' } })
  if (facets.series !== 'any') chips.push({ key: 'series', label: `Series: ${facets.series}`, clear: { series: 'any' } })
  if (facets.rating !== 'any') chips.push({ key: 'rating', label: facets.rating === 'unrated' ? 'Unrated' : `Rated ${facets.rating}`, clear: { rating: 'any' } })
  if (facets.format !== 'any') chips.push({ key: 'format', label: FORMAT_LABEL[facets.format], clear: { format: 'any' } })

  return (
    <main className="library stats">
      <div className="lib-head"><h1>Stats</h1></div>

      <div className="shelf-tabs" role="group" aria-label="Year">
        <button type="button" className="shelf-tab" aria-pressed={year === 'all'} onClick={() => { setYear('all'); setSel(undefined) }}>All years</button>
        {s.years.map((y) => (
          <button key={y} type="button" className="shelf-tab" aria-pressed={year === y} onClick={() => { setYear(y); setSel(undefined) }}>{y}</button>
        ))}
      </div>

      <div className="tools">
        <button type="button" className="btn-quiet" aria-expanded={filtersOpen || chips.length > 0} onClick={() => setFiltersOpen(!filtersOpen)}>Filters{chips.length > 0 && ` · ${chips.length}`}</button>
      </div>

      {(filtersOpen || chips.length > 0) && (
        <div className="tools st-filters">
          <label className="select">
            <span className="sr-only">Genre</span>
            <select value={facets.genre} onChange={(e) => setFacet('genre', e.target.value as GenreId | 'any')}>
              <option value="any">All genres</option>
              {GENRES.map((g) => <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Tag</span>
            <select value={facets.tag} onChange={(e) => setFacet('tag', e.target.value)}>
              <option value="any">All tags</option>
              {tags.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          {seriesList.length > 0 && (
            <label className="select">
              <span className="sr-only">Series</span>
              <select value={facets.series} onChange={(e) => setFacet('series', e.target.value)}>
                <option value="any">All series</option>
                {seriesList.map((s) => <option key={s.key} value={s.name}>{s.name}</option>)}
              </select>
            </label>
          )}
          <label className="select">
            <span className="sr-only">Rating</span>
            <select value={String(facets.rating)} onChange={(e) => setFacet('rating', e.target.value === 'any' || e.target.value === 'unrated' ? e.target.value : Number(e.target.value))}>
              <option value="any">Any rating</option>
              {RATING_CHOICES.map((r) => <option key={r} value={r}>{r} {r === 1 ? 'star' : 'stars'}</option>)}
              <option value="unrated">Unrated</option>
            </select>
          </label>
          <label className="select">
            <span className="sr-only">Format</span>
            <select value={facets.format} onChange={(e) => setFacet('format', e.target.value as Format | 'any')}>
              <option value="any">All formats</option>
              {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => <option key={f} value={f}>{FORMAT_LABEL[f]}</option>)}
            </select>
          </label>
        </div>
      )}
      {chips.length > 0 && (
        <ul className="chip-filters" aria-label="Active filters">
          {chips.map((c) => (
            <li key={c.key}>{c.label}<button type="button" aria-label={`Remove filter ${c.label}`} onClick={() => setFacet(c.key as keyof Facets, noFacets[c.key as keyof Facets])}><Icon name="close" size={16} /></button></li>
          ))}
          {chips.length > 1 && <li className="chip-clear"><button type="button" className="btn-link inline" onClick={() => { setFacets(noFacets); setSel(undefined) }}>Clear all</button></li>}
        </ul>
      )}

      <p className="st-summary">
        {s.finishedCount} {s.finishedCount === 1 ? 'book' : 'books'} finished {scope}
        {s.dnfCount > 0 && <> · <button type="button" className="btn-link inline" onClick={() => open({ status: 'dnf' })}>{s.dnfCount} did not finish</button></>}
      </p>
      {excluded && <p className="hint">{s.unknownDate} finished {s.unknownDate === 1 ? 'reading has' : 'readings have'} no date and {s.unknownDate === 1 ? 'is' : 'are'} left out of this year. <button type="button" className="btn-link inline" onClick={() => open({ year: 'unknown' })}>Show {s.unknownDate === 1 ? 'it' : 'them'}</button></p>}

      <div className="st-strip" role="status" aria-live="polite">
        {sel ? (
          <>
            <span><strong>{sel.label}</strong> · {sel.count} {sel.count === 1 ? 'reading' : 'readings'}</span>
            <button type="button" className="btn-quiet" onClick={() => open(sel.patch)}>Open in Library</button>
          </>
        ) : <span className="hint">Tap a bar to see its books.</span>}
      </div>

      {nothing ? (
        <div className="state"><p className="state-title">Nothing matches these filters</p><p>Try a different genre, tag, rating or format.</p></div>
      ) : (
      <div className="st-grid">
        <section className="st-card st-wide" aria-labelledby="st-years">
          <h2 id="st-years" className="set-title">Books per year</h2>
          <div className="st-cols">
            {s.perYear.map((y) => (
              <button key={y.year} type="button" className="st-col" aria-pressed={on(`y${y.year}`) ?? false} aria-label={`${y.year}: ${y.books.length} ${y.books.length === 1 ? 'book' : 'books'}`} onClick={() => pick({ id: `y${y.year}`, label: `Finished in ${y.year}`, count: y.books.length, patch: { year: y.year } })}>
                <span className="st-n">{y.books.length}</span>
                <Spines books={y.books} cell={yearCell} />
                <span className="st-l">{y.year}</span>
              </button>
            ))}
            {s.unknownDateBooks.length > 0 && (
              <button type="button" className="st-col unknown" aria-pressed={on('yu') ?? false} aria-label={`Date unknown: ${s.unknownDateBooks.length} ${s.unknownDateBooks.length === 1 ? 'book' : 'books'}`} onClick={() => pick({ id: 'yu', label: 'Finished, date unknown', count: s.unknownDateBooks.length, patch: { year: 'unknown' } })}>
                <span className="st-n">{s.unknownDateBooks.length}</span>
                <Spines books={s.unknownDateBooks} cell={yearCell} />
                <span className="st-l">Date unknown</span>
              </button>
            )}
          </div>
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
            <div className="st-cols months">
              {s.perMonth.map((m, i) => m.length === 0 ? (
                <div key={i} className="st-col" aria-label={`${MONTHS[i]}: none`}>
                  <span className="st-n" />
                  <Spines books={m} cell={monthCell} />
                  <span className="st-l">{MONTHS[i]}</span>
                </div>
              ) : (
                <button key={i} type="button" className="st-col" aria-pressed={on(`m${i}`) ?? false} aria-label={`${MONTHS[i]} ${s.monthYear}: ${m.length} ${m.length === 1 ? 'book' : 'books'}`} onClick={() => pick({ id: `m${i}`, label: `Finished ${MONTHS[i]} ${s.monthYear}`, count: m.length, patch: { year: s.monthYear, month: i + 1 } })}>
                  <span className="st-n">{m.length}</span>
                  <Spines books={m} cell={monthCell} />
                  <span className="st-l">{MONTHS[i]}</span>
                </button>
              ))}
            </div>
            <p className="hint">Spines are coloured by each book's first genre, as in the yearly chart.</p>
            {s.monthUnknown > 0 && <p className="hint">{s.monthUnknown} finished in {s.monthYear} {s.monthUnknown === 1 ? 'is' : 'are'} recorded only to the year, so {s.monthUnknown === 1 ? 'it is' : 'they are'} not in a month.</p>}
          </section>
        )}

        <section className="st-card" aria-labelledby="st-genres">
          <h2 id="st-genres" className="set-title">Genres</h2>
          <ul className="st-bars">
            {s.genres.map((g) => {
              const row = (
                <>
                  <span className="st-bl">{labelOf(g.key)}</span>
                  <span className="st-track"><span className="st-fill" style={{ width: `${(g.count / maxGenre) * 100}%`, background: inkOf(g.key) }} /></span>
                  <span className="st-bn">{g.count}</span>
                </>
              )
              return (
                <li key={g.key} className={on(`g${g.key}`) ? 'on' : ''}>
                  {g.key === 'none' ? row : (
                    <button type="button" className="st-row" aria-pressed={on(`g${g.key}`) ?? false} onClick={() => pick({ id: `g${g.key}`, label: labelOf(g.key), count: g.count, patch: { genre: g.key as GenreId } })}>{row}</button>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="hint">A book with several genres counts once in each.</p>
        </section>

        <section className="st-card" aria-labelledby="st-ratings">
          <h2 id="st-ratings" className="set-title">Ratings</h2>
          <div className="st-cols ratings">
            {s.ratings.map((r) => r.count === 0 ? (
              <div key={r.value} className="st-col" aria-label={`${r.value} stars: none`}>
                <span className="st-n" />
                <span className="st-rbar" style={{ height: '2px' }} />
                <span className="st-l">{halfLabel(r.value)}</span>
              </div>
            ) : (
              <button key={r.value} type="button" className="st-col" aria-pressed={on(`r${r.value}`) ?? false} aria-label={`${r.value} stars: ${r.count} ${r.count === 1 ? 'reading' : 'readings'}`} onClick={() => pick({ id: `r${r.value}`, label: `Rated ${r.value}`, count: r.count, patch: { rating: r.value } })}>
                <span className="st-n">{r.count}</span>
                <span className="st-rbar" style={{ height: `${(r.count / maxRating) * 120}px` }} />
                <span className="st-l">{halfLabel(r.value)}</span>
              </button>
            ))}
          </div>
          <p className="hint">
            {s.unrated} unrated {s.unrated === 1 ? 'reading is' : 'readings are'} not counted above. Unrated is not a low score.
            {s.unrated > 0 && <> <button type="button" className="btn-link inline" onClick={() => open({ rating: 'unrated' })}>Show {s.unrated === 1 ? 'it' : 'them'}</button></>}
          </p>
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
                        <button key={k} type="button" className={`st-seg fmt-${k}`} style={{ flexGrow: f.counts[k] }} aria-pressed={on(`f${f.label}${k}`) ?? false} aria-label={`${f.label}, ${FORMAT_LABEL[k]}: ${f.counts[k]}`} onClick={() => pick({ id: `f${f.label}${k}`, label: `${FORMAT_LABEL[k]}, ${f.year ?? 'date unknown'}`, count: f.counts[k], patch: { format: k, year: f.year ?? 'unknown' } })}>{f.counts[k]}</button>
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
              {s.authors.map((a, i) => (
                <li key={a.author} className={on(`a${a.author}`) ? 'on' : ''}>
                  <button type="button" className="st-row" aria-pressed={on(`a${a.author}`) ?? false} onClick={() => pick({ id: `a${a.author}`, label: a.author, count: a.count, patch: { text: a.author } })}>
                    <span className="st-pos">{i + 1}</span><span className="st-bl">{a.author}</span><span className="st-bn">{a.count}</span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </section>

        <details className="st-fold st-wide">
          <summary>More: compare years{seriesShown.length > 0 && ', series progress'}</summary>
          <div className="st-grid">
        <StatsCompare readings={data!.readings} works={data!.works} years={s.years} facets={facets} pick={pick} isOn={on} />

        {seriesShown.length > 0 && (
          <section className="st-card st-wide" aria-labelledby="st-series">
            <h2 id="st-series" className="set-title">Series progress</h2>
            <ul className="st-series">
              {(allSeries ? seriesShown : seriesShown.slice(0, 8)).map((s) => (
                <li key={s.key}>
                  <button type="button" className="st-row series-line" onClick={() => onOpenLibrary({ ...defaultQuery, series: s.name })} aria-label={`${s.name}: ${s.read} of ${s.owned + s.gaps} volumes read. Open in Library`}>
                    <span className="st-bl">{s.name}</span>
                    <span className="series-dots" aria-hidden="true">
                      {s.entries.map((e, i) => <span key={i} className={`dot${e.gap ? ' gap' : e.read ? ' read' : ''}`} />)}
                    </span>
                    <span className="st-bn">{s.read}/{s.owned + s.gaps}</span>
                  </button>
                </li>
              ))}
            </ul>
            {seriesShown.length > 8 && <button type="button" className="btn-link" onClick={() => setAllSeries(!allSeries)}>{allSeries ? 'Show fewer' : `Show all ${seriesShown.length} series`}</button>}
            <ul className="st-legend" aria-label="Series key">
              <li><span className="dot read" />Read</li><li><span className="dot" />In library, not read</li><li><span className="dot gap" />Not in library</li>
            </ul>
            <p className="hint">Counts volumes, not readings. Only series with more than one volume or a gap are shown, and gaps are whole-number volumes below your highest. The real length of a series is not known.</p>
          </section>
        )}
          </div>
        </details>
      </div>
      )}

      {ps && (
        <>
          <h2 className="set-title st-section">Pages</h2>
          <p className="st-summary">{ps.total.toLocaleString()} pages in {ps.counted} {ps.counted === 1 ? 'book' : 'books'} {scope}</p>
          <p className="hint">Pages come from each book's page count, so they are an estimate. {ps.audiobooks > 0 && <>{ps.audiobooks} {ps.audiobooks === 1 ? 'audiobook is' : 'audiobooks are'} left out. </>}{ps.pagesUnknown > 0 && <>{ps.pagesUnknown} {ps.pagesUnknown === 1 ? 'book has' : 'books have'} no page count. <button type="button" className="btn-link inline" onClick={() => open({ missing: 'pages', format: facets.format === 'any' ? 'any' : facets.format })}>Show {ps.pagesUnknown === 1 ? 'it' : 'them'}</button></>}</p>
          <div className="st-grid">
            <section className="st-card st-wide" aria-labelledby="st-pyears">
              <h2 id="st-pyears" className="set-title">Pages per year</h2>
              <ul className="st-bars">
                {ps.perYear.map((y) => (
                  <li key={y.year}>
                    <span className="st-bl">{y.year}</span>
                    <span className="st-track"><span className="st-fill" style={{ width: `${(y.pages / Math.max(1, ...ps.perYear.map((p) => p.pages))) * 100}%` }} /></span>
                    <span className="st-bn">{y.pages.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
              {ps.undated > 0 && <p className="hint">{ps.undated} counted {ps.undated === 1 ? 'book has' : 'books have'} no finish date and {ps.undated === 1 ? 'is' : 'are'} in no year.</p>}
            </section>
            {ps.monthYear !== undefined && (
              <section className="st-card st-wide" aria-labelledby="st-pmonths">
                <h2 id="st-pmonths" className="set-title">Pages per month, {ps.monthYear}</h2>
                <div className="st-cols months">
                  {ps.perMonth.map((n, i) => (
                    <div key={i} className="st-col" role="img" aria-label={`${MONTHS[i]}: ${n} pages`}>
                      <span className="st-n">{n || ''}</span>
                      <span className="st-rbar" style={{ height: `${(n / Math.max(1, ...ps.perMonth)) * 120}px` }} />
                      <span className="st-l">{MONTHS[i]}</span>
                    </div>
                  ))}
                </div>
                {ps.monthUnknown > 0 && <p className="hint">{ps.monthUnknown} finished in {ps.monthYear} {ps.monthUnknown === 1 ? 'is' : 'are'} recorded only to the year, so {ps.monthUnknown === 1 ? 'it is' : 'they are'} not in a month.</p>}
              </section>
            )}
          </div>
        </>
      )}

      {trends && trends.years.length > 0 && (
        <>
          <h2 className="set-title st-section">Over the years</h2>
          <p className="hint">Each year counts finished readings. Unrated readings are left out of the average, not counted as low. Ignores the year buttons and follows the filters.{trends.undated > 0 && <> {trends.undated} finished {trends.undated === 1 ? 'reading has' : 'readings have'} no finish date and {trends.undated === 1 ? 'is' : 'are'} in no year.</>}</p>
          <div className="st-grid">
            <section className="st-card" aria-labelledby="st-avg">
              <h2 id="st-avg" className="set-title">Average rating</h2>
              <ul className="st-bars">
                {trends.years.map((y) => (
                  <li key={y.year} className={on(`t${y.year}`) ? 'on' : ''}>
                    <button type="button" className="st-row" aria-pressed={on(`t${y.year}`) ?? false} aria-label={`${y.year}: ${y.average === undefined ? 'nothing rated' : `average ${y.average.toFixed(1)}`}, ${y.rated} rated and ${y.unrated} unrated`} onClick={() => pick({ id: `t${y.year}`, label: `Finished in ${y.year}`, count: y.finished, patch: { year: y.year } })}>
                      <span className="st-bl">{y.year}</span>
                      <span className="st-track">{y.average !== undefined && <span className="st-fill" style={{ width: `${(y.average / 5) * 100}%` }} />}</span>
                      <span className="st-bn">{y.average === undefined ? '–' : y.average.toFixed(1)}</span>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="hint">Out of 5. {trends.years.some((y) => y.unrated > 0) ? 'Rated and unrated: ' + trends.years.map((y) => `${y.year} ${y.rated}/${y.unrated}`).join(', ') + '.' : 'Every reading is rated.'}</p>
            </section>

            <section className="st-card" aria-labelledby="st-mix">
              <h2 id="st-mix" className="set-title">Genre mix</h2>
              <div className="mix-scroll">
                <table className="mix">
                  <caption className="sr-only">Share of each year's books that include each genre</caption>
                  <thead><tr><th scope="col"><span className="sr-only">Genre</span></th>{trends.years.map((y) => <th scope="col" key={y.year}>{y.year}</th>)}</tr></thead>
                  <tbody>
                    {trends.genreKeys.map((k) => (
                      <tr key={k}>
                        <th scope="row">{labelOf(k)}</th>
                        {trends.years.map((y) => {
                          const n = y.genres.get(k) ?? 0
                          const share = y.finished ? n / y.finished : 0
                          return (
                            <td key={y.year}>
                              {n === 0 || k === 'none' ? <span className="mix-cell" style={{ ['--share' as string]: share }}>{n === 0 ? '' : `${Math.round(share * 100)}%`}</span> : (
                                <button type="button" className="mix-cell" style={{ ['--share' as string]: share, ['--ink-genre' as string]: inkOf(k) }} aria-pressed={on(`m${y.year}${k}`) ?? false} aria-label={`${labelOf(k)} ${y.year}: ${n} of ${y.finished} books`} onClick={() => pick({ id: `m${y.year}${k}`, label: `${labelOf(k)}, ${y.year}`, count: n, patch: { year: y.year, genre: k as GenreId } })}>{Math.round(share * 100)}%</button>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="hint">Share of each year's books that include the genre. A book with several genres counts in each, so a column can add up to more than 100%.</p>
            </section>
          </div>
        </>
      )}

      {authorStats && authorStats.ranking.length > 0 && (
        <>
          <h2 className="set-title st-section">Authors</h2>
          <div className="st-grid">
            <section className="st-card" aria-labelledby="st-allauth">
              <h2 id="st-allauth" className="set-title">All authors {scope}</h2>
              <ol className="st-rank">
                {(allAuthors ? authorStats.ranking : authorStats.ranking.slice(0, 15)).map((a, i) => (
                  <li key={a.author} className={on(`x${a.author}`) ? 'on' : ''}>
                    <button type="button" className="st-row auth-row" aria-pressed={on(`x${a.author}`) ?? false} onClick={() => pick({ id: `x${a.author}`, label: a.author, count: a.count, patch: { text: a.author } })}>
                      <span className="st-pos">{i + 1}</span>
                      <span className="st-bl">{a.author}</span>
                      <span className="auth-avg">{a.average === undefined ? 'unrated' : `${a.average.toFixed(1)} avg`}</span>
                      <span className="st-bn">{a.count}</span>
                    </button>
                  </li>
                ))}
              </ol>
              {authorStats.ranking.length > 15 && <button type="button" className="btn-link" onClick={() => setAllAuthors(!allAuthors)}>{allAuthors ? 'Show fewer' : `Show all ${authorStats.ranking.length} authors`}</button>}
              <p className="hint">Authors are matched on the same name only, so different spellings count as different authors. {authorStats.noAuthor > 0 && <>{authorStats.noAuthor} finished {authorStats.noAuthor === 1 ? 'reading has' : 'readings have'} no author and {authorStats.noAuthor === 1 ? 'is' : 'are'} left out. </>}The average uses rated readings only.</p>
            </section>

            <section className="st-card" aria-labelledby="st-newauth">
              <h2 id="st-newauth" className="set-title">New authors per year</h2>
              <ul className="st-bars">
                {authorStats.newPerYear.map((y) => (
                  <li key={y.year}>
                    <span className="st-bl">{y.year}</span>
                    <span className="st-track"><span className="st-fill" style={{ width: `${(y.count / Math.max(1, ...authorStats.newPerYear.map((p) => p.count))) * 100}%` }} /></span>
                    <span className="st-bn">{y.count}</span>
                  </li>
                ))}
              </ul>
              <p className="hint">An author is new in the year of their first finished book, counting every year. {authorStats.undatedOnly > 0 && <>{authorStats.undatedOnly} {authorStats.undatedOnly === 1 ? 'author has' : 'authors have'} only undated readings and {authorStats.undatedOnly === 1 ? 'is' : 'are'} in no year.</>}</p>
            </section>
          </div>
        </>
      )}

      {(ls.loanCount > 0 || ls.undated > 0 || ls.notFinished.length > 0 || ls.borrowed > 0) && (
        <>
          <h2 className="set-title st-section">Library loans</h2>
          <p className="st-summary">{ls.loanCount} {ls.loanCount === 1 ? 'loan' : 'loans'} {scope}</p>
          {(facets.rating !== 'any' || facets.format !== 'any') && <p className="hint">Loans are narrowed by genre and tag only. Rating and format apply to the borrowed readings count.</p>}
          {ls.undated > 0 && <p className="hint">{ls.undated} {ls.undated === 1 ? 'loan has' : 'loans have'} no borrow date and {ls.undated === 1 ? 'is' : 'are'} left out of the year and month views.</p>}
          <div className="st-grid">
            <section className="st-card st-wide" aria-labelledby="st-loans">
              <h2 id="st-loans" className="set-title">Loans {year === 'all' ? 'per year' : `per month, ${year}`}</h2>
              {year === 'all' ? (
                <>
                  <ul className="st-bars">
                    {ls.perYear.map((y) => (
                      <li key={y.year}>
                        <span className="st-bl">{y.year}</span>
                        <span className="st-track"><span className="st-fill" style={{ width: `${(y.count / Math.max(1, ...ls.perYear.map((p) => p.count))) * 100}%` }} /></span>
                        <span className="st-bn">{y.count}</span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <>
                  <div className="st-cols months" aria-hidden="true">
                    {ls.perMonth.map((n, i) => (
                      <div key={i} className="st-col">
                        <span className="st-n">{n || ''}</span>
                        <span className="st-rbar" style={{ height: `${(n / Math.max(1, ...ls.perMonth)) * 120}px` }} />
                        <span className="st-l">{MONTHS[i]}</span>
                      </div>
                    ))}
                  </div>
                  <table className="sr-only">
                    <caption>Loans per month in {year}</caption>
                    <tbody>{ls.perMonth.map((n, i) => <tr key={i}><th>{MONTHS[i]}</th><td>{n}</td></tr>)}</tbody>
                  </table>
                  {ls.monthUnknown > 0 && <p className="hint">{ls.monthUnknown} borrowed in {year} {ls.monthUnknown === 1 ? 'is' : 'are'} recorded only to the year, so {ls.monthUnknown === 1 ? 'it is' : 'they are'} not in a month.</p>}
                </>
              )}
            </section>

            <section className="st-card" aria-labelledby="st-libs">
              <h2 id="st-libs" className="set-title">Libraries</h2>
              {ls.libraries.length === 0 ? <p className="hint">No library names to rank {scope}.</p> : (
                <ol className="st-rank">
                  {ls.libraries.map((l, i) => <li key={l.library}><span className="st-pos">{i + 1}</span><span className="st-bl">{l.library}</span><span className="st-bn">{l.count}</span></li>)}
                </ol>
              )}
              {ls.noLibrary > 0 && <p className="hint">{ls.noLibrary} {ls.noLibrary === 1 ? 'loan names' : 'loans name'} no library.</p>}
            </section>

            <section className="st-card" aria-labelledby="st-bor">
              <h2 id="st-bor" className="set-title">Borrowed readings</h2>
              <p className="st-big">{ls.borrowed} <span>of {ls.borrowed + ls.noLoan} finished {scope}</span></p>
              <p className="hint">A reading counts as borrowed when a loan is tied to it. The other {ls.noLoan} have no loan recorded, which does not mean you own them.</p>
              {ls.unlinked > 0 && <p className="hint">{ls.unlinked} of those {ls.unlinked === 1 ? 'is a reading' : 'are readings'} of books you have loans for, but no loan is tied to {ls.unlinked === 1 ? 'it' : 'them'}. Edit a reading to tie one.</p>}
            </section>

            <section className="st-card" aria-labelledby="st-nf">
              <h2 id="st-nf" className="set-title">Borrowed, not finished</h2>
              <p className="st-big">{ls.notFinished.length} <span>{ls.notFinished.length === 1 ? 'book' : 'books'}, across all years</span></p>
              {ls.notFinished.length > 0 && (
                <details className="st-more">
                  <summary>Show the books</summary>
                  <ul className="st-list">{ls.notFinished.map((w) => <li key={w.id}>{w.title}{w.author && <span> · {w.author}</span>}</li>)}</ul>
                </details>
              )}
              <p className="hint">Books with a loan and no finished reading. Borrowing is not reading, and this is not a backlog to clear.</p>
            </section>
          </div>
        </>
      )}

      <section className="st-more-charts" aria-labelledby="st-optional">
        <h2 id="st-optional" className="set-title">More charts</h2>
        {([['pages', 'Show pages read', showPages], ['trends', 'Show rating and genre over the years', showTrends], ['authors', 'Show all authors and new authors', showAuthors]] as const).map(([c, label, checked]) => (
          <label key={c} className="check">
            <input type="checkbox" checked={checked} onChange={(e) => setChart(c, e.target.checked)} />
            <span>{label}</span>
          </label>
        ))}
      </section>
    </main>
  )
}
