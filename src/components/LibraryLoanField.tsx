import { useId } from 'react'
import { DateField } from './FormControls'
import type { Precision } from '../lib/dates'

export interface LoanForm {
  on: boolean
  library: string
  date: { iso: string; precision: Precision }
}

export const blankLoan = (): LoanForm => ({ on: false, library: '', date: { iso: '', precision: 'unknown' } })

/** "Borrowed from a library": which library and when are both optional, and blank stays blank. */
export function LibraryLoanField({ value, onChange, names, readOnlyNote, onDate }: {
  value: LoanForm
  onChange: (v: LoanForm) => void
  names: string[]
  /** Set when imported Loans already cover this Reading. */
  readOnlyNote?: string
  onDate: (p: Precision) => { iso: string; precision: Precision }
}) {
  const id = useId()
  return (
    <div className="field">
      <label className="check">
        <input type="checkbox" checked={value.on} onChange={(e) => onChange({ ...value, on: e.target.checked })} />
        <span>Borrowed from a library</span>
      </label>
      {readOnlyNote && <p className="hint">{readOnlyNote}</p>}
      {value.on && (
        <>
          <label className="label" htmlFor={`${id}-lib`}>Library</label>
          <input id={`${id}-lib`} className="input" list={`${id}-names`} placeholder="Optional" value={value.library} onChange={(e) => onChange({ ...value, library: e.target.value })} />
          <datalist id={`${id}-names`}>{names.map((n) => <option key={n} value={n} />)}</datalist>
          <DateField label="Borrowed" iso={value.date.iso} precision={value.date.precision} onIso={(iso) => onChange({ ...value, date: { ...value.date, iso } })} onPrecision={(p) => onChange({ ...value, date: onDate(p) })} />
        </>
      )}
    </div>
  )
}
