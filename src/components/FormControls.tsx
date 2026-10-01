import { useId, useRef } from 'react'
import { toDatePart, type Precision } from '../lib/dates'

export const dateOk = (iso: string, p: Precision) => p === 'unknown' || toDatePart(iso, p) !== undefined

const PRECISIONS: { id: Precision; label: string }[] = [
  { id: 'day', label: 'Day' },
  { id: 'month', label: 'Month' },
  { id: 'year', label: 'Year' },
  { id: 'unknown', label: 'Unknown' },
]

/**
 * A radio group built from pills: one tab stop, arrow keys move the choice. With no
 * choice made yet, the first pill is the tab stop.
 */
export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T | undefined
  options: { id: T; label: string }[]
  onChange: (v: T) => void
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const active = Math.max(0, options.findIndex((o) => o.id === value))
  function onKey(e: React.KeyboardEvent, i: number) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const next = (i + dir + options.length) % options.length
    onChange(options[next].id)
    refs.current[next]?.focus()
  }
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {options.map((o, i) => (
        <button key={o.id} ref={(el) => { refs.current[i] = el }} type="button" role="radio" aria-checked={value === o.id} tabIndex={i === active ? 0 : -1} onKeyDown={(e) => onKey(e, i)} onClick={() => onChange(o.id)}>{o.label}</button>
      ))}
    </div>
  )
}

export function DateField({ label, iso, precision, onIso, onPrecision }: {
  label: string
  iso: string
  precision: Precision
  onIso: (v: string) => void
  onPrecision: (p: Precision) => void
}) {
  const id = useId()
  const bad = !dateOk(iso, precision)
  return (
    <fieldset className="field">
      <legend>{label}</legend>
      <Segmented label={`${label} precision`} value={precision} options={PRECISIONS} onChange={onPrecision} />
      {precision === 'unknown' ? (
        <p className="hint">Saved as unknown. It won't be guessed from anything else.</p>
      ) : (
        <>
          <label className="sr-only" htmlFor={id}>{label}</label>
          {precision === 'day' && <input id={id} className="input" type="date" value={iso} onChange={(e) => onIso(e.target.value)} aria-invalid={bad} aria-describedby={bad ? `${id}-err` : undefined} />}
          {precision === 'month' && <input id={id} className="input" type="month" value={iso.slice(0, 7)} onChange={(e) => onIso(`${e.target.value}-01`)} aria-invalid={bad} aria-describedby={bad ? `${id}-err` : undefined} />}
          {precision === 'year' && (
            <input id={id} className="input" type="number" inputMode="numeric" min="1000" max="2999" value={iso.slice(0, 4)} onChange={(e) => onIso(`${e.target.value}-01-01`)} aria-invalid={bad} aria-describedby={bad ? `${id}-err` : undefined} />
          )}
        </>
      )}
      {bad && <p className="form-error" id={`${id}-err`} role="alert">Enter a date, or choose Unknown.</p>}
    </fieldset>
  )
}

