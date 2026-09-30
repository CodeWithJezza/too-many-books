import type { DatePart } from '../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** Formats a date at exactly the precision it was recorded. Unknown stays unknown. */
export function formatDate(d?: DatePart): string {
  if (!d) return 'Date unknown'
  if (d.m && d.d) return `${d.d} ${MONTHS[d.m - 1]} ${d.y}`
  if (d.m) return `${MONTHS[d.m - 1]} ${d.y}`
  return String(d.y)
}

export function precisionNote(d?: DatePart): string | undefined {
  if (!d) return undefined
  if (d.m && d.d) return undefined
  return d.m ? 'month only' : 'year only'
}

/** Sortable number; later dates larger. Unknown returns undefined so callers place it last. */
export function dateKey(d?: DatePart): number | undefined {
  if (!d) return undefined
  return d.y * 10000 + (d.m ?? 6) * 100 + (d.d ?? 15)
}

export type Precision = 'day' | 'month' | 'year' | 'unknown'

/** Local-time YYYY-MM-DD, so "today" is the reader's today, not UTC's. */
export function todayIso(now = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

/** Turns a YYYY-MM-DD string plus a precision into a DatePart. Unknown is undefined, never guessed. */
export function toDatePart(iso: string, precision: Precision): DatePart | undefined {
  if (precision === 'unknown') return undefined
  const [y, m, d] = iso.split('-').map(Number)
  if (!y) return undefined
  if (precision === 'year') return { y }
  if (precision === 'month') return m ? { y, m } : { y }
  return m && d ? { y, m, d } : m ? { y, m } : { y }
}
