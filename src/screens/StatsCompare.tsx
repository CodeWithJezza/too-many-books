import { useMemo, useState } from 'react'
import { compareYears, type YearSide } from '../lib/compare'
import type { Facets, LibraryQuery } from '../lib/filter'
import { NO_GENRE_INK, genre } from '../lib/genres'
import type { Key } from '../lib/stats'
import type { Format, GenreId, Reading, Work } from '../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const FORMAT_LABEL: Record<Format, string> = { ebook: 'Ebook', audiobook: 'Audiobook', print: 'Print' }
const labelOf = (k: Key) => (k === 'none' ? 'No genre' : genre(k).label)
const inkOf = (k: Key) => (k === 'none' ? NO_GENRE_INK : genre(k).ink)

interface Selection { id: string; label: string; count: number; patch: Partial<LibraryQuery> }

/**
 * Two years side by side: books per month, genres and formats (A3). Each year keeps its own bar,
 * side by side rather than overlaid, so every count can be read and tapped. Which year is which
 * is shown by position and by a legend, never by colour alone.
 */
export function StatsCompare({ readings, works, years, facets, pick, isOn }: {
  readings: Reading[]
  works: Work[]
  /** Years that have finished Readings, newest first. */
  years: number[]
  facets: Facets
  pick: (s: Selection) => void
  isOn: (id: string) => true | undefined
}) {
  const [ya, setYa] = useState<number | undefined>()
  const [yb, setYb] = useState<number | undefined>()
  // Default to the two latest years: the older on the left, the newer on the right.
  const a = ya ?? years[1] ?? years[0]
  const b = yb ?? years[0]
  const c = useMemo(() => (a !== undefined && b !== undefined ? compareYears(readings, works, a, b, facets) : undefined), [readings, works, a, b, facets])
  if (!c || a === undefined || b === undefined || years.length < 2) return null

  const side = (s: YearSide, who: 'a' | 'b') => ({ s, who })
  const sides = [side(c.a, 'a'), side(c.b, 'b')]
  const maxMonth = Math.max(1, ...c.a.perMonth, ...c.b.perMonth)
  const maxGenre = Math.max(1, ...c.genreKeys.flatMap((k) => [c.a.genres.get(k) ?? 0, c.b.genres.get(k) ?? 0]))
  const maxFormat = Math.max(1, ...(Object.keys(FORMAT_LABEL) as Format[]).flatMap((f) => [c.a.formats[f], c.b.formats[f]]))
  const diff = c.b.finished - c.a.finished

  const Select = ({ label, value, onChange }: { label: string; value: number; onChange: (y: number) => void }) => (
    <label className="select">
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(Number(e.target.value))}>
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
    </label>
  )

  return (
    <section className="st-card st-wide" aria-labelledby="st-compare">
      <h2 id="st-compare" className="set-title">Compare years</h2>
      <div className="tools cmp-pick">
        <Select label="First year" value={a} onChange={setYa} />
        <span aria-hidden="true">with</span>
        <Select label="Second year" value={b} onChange={setYb} />
        <ul className="st-legend" aria-label="Which bar is which year">
          <li><span className="cmp-key a" />{a}</li>
          <li><span className="cmp-key b" />{b}</li>
        </ul>
      </div>
      <p className="st-summary">
        {c.a.finished} books in {a}, {c.b.finished} in {b}
        {a !== b && <> · {diff === 0 ? 'the same' : `${Math.abs(diff)} ${diff > 0 ? 'more' : 'fewer'} in ${b}`}</>}
      </p>
      <p className="hint">Compare ignores the year buttons above and follows the filters. Each count is finished readings, so a re-read counts again. In the genre and format bars the second year is hatched.</p>

      <h3 className="cmp-sub">Books per month</h3>
      <div className="st-cols months cmp-months">
        {MONTHS.map((m, i) => (
          <div key={m} className="cmp-month">
            <div className="cmp-pair">
              {sides.map(({ s, who }) => s.perMonth[i] === 0 ? (
                <span key={who} className={`cmp-bar ${who} none`} role="img" aria-label={`${m} ${s.year}: none`} />
              ) : (
                <button key={who} type="button" className={`cmp-bar ${who}`} style={{ height: `${(s.perMonth[i] / maxMonth) * 120}px` }} aria-pressed={isOn(`c${who}m${i}`) ?? false} aria-label={`${m} ${s.year}: ${s.perMonth[i]} ${s.perMonth[i] === 1 ? 'book' : 'books'}`} onClick={() => pick({ id: `c${who}m${i}`, label: `Finished ${m} ${s.year}`, count: s.perMonth[i], patch: { year: s.year, month: i + 1 } })}>
                  <span className="cmp-n">{s.perMonth[i]}</span>
                </button>
              ))}
            </div>
            <span className="st-l">{m}</span>
          </div>
        ))}
      </div>
      {sides.map(({ s }) => s.monthUnknown > 0 && (
        <p key={s.year} className="hint">{s.monthUnknown} finished in {s.year} {s.monthUnknown === 1 ? 'is' : 'are'} recorded only to the year, so {s.monthUnknown === 1 ? 'it is' : 'they are'} not in a month.</p>
      ))}

      <h3 className="cmp-sub">Genres</h3>
      <ul className="cmp-rows">
        {c.genreKeys.map((k) => (
          <li key={k} className="cmp-row">
            <span className="st-bl">{labelOf(k)}</span>
            <span className="cmp-tracks">
              {sides.map(({ s, who }) => {
                const n = s.genres.get(k) ?? 0
                const bar = <span className={`cmp-line ${who}`} style={{ width: `${(n / maxGenre) * 100}%`, ['--ink-genre' as string]: inkOf(k) }} />
                return n === 0 || k === 'none' ? (
                  <span key={who} className="cmp-track">{bar}<span className="st-bn">{n}</span></span>
                ) : (
                  <button key={who} type="button" className="cmp-track" aria-pressed={isOn(`c${who}g${k}`) ?? false} aria-label={`${labelOf(k)} ${s.year}: ${n}`} onClick={() => pick({ id: `c${who}g${k}`, label: `${labelOf(k)}, ${s.year}`, count: n, patch: { year: s.year, genre: k as GenreId } })}>{bar}<span className="st-bn">{n}</span></button>
                )
              })}
            </span>
          </li>
        ))}
      </ul>

      <h3 className="cmp-sub">Formats</h3>
      <ul className="cmp-rows">
        {(Object.keys(FORMAT_LABEL) as Format[]).map((f) => (
          <li key={f} className="cmp-row">
            <span className="st-bl">{FORMAT_LABEL[f]}</span>
            <span className="cmp-tracks">
              {sides.map(({ s, who }) => {
                const n = s.formats[f]
                const bar = <span className={`cmp-line ${who}`} style={{ width: `${(n / maxFormat) * 100}%` }} />
                return n === 0 ? (
                  <span key={who} className="cmp-track">{bar}<span className="st-bn">{n}</span></span>
                ) : (
                  <button key={who} type="button" className="cmp-track" aria-pressed={isOn(`c${who}f${f}`) ?? false} aria-label={`${FORMAT_LABEL[f]} ${s.year}: ${n}`} onClick={() => pick({ id: `c${who}f${f}`, label: `${FORMAT_LABEL[f]}, ${s.year}`, count: n, patch: { year: s.year, format: f } })}>{bar}<span className="st-bn">{n}</span></button>
                )
              })}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
