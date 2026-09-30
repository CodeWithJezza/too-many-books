import { describe, expect, it } from 'vitest'
import { fromDatePart, withPrecision } from './dates'

describe('withPrecision', () => {
  it('keeps known parts when going coarser', () => {
    expect(withPrecision({ iso: '2026-03-09', precision: 'day' }, 'month')).toEqual({ iso: '2026-03-09', precision: 'month' })
    expect(withPrecision({ iso: '2026-03-09', precision: 'day' }, 'year').precision).toBe('year')
  })
  it('empties the value rather than inventing Jan 1 when going finer', () => {
    expect(withPrecision({ iso: '2022-01-01', precision: 'year' }, 'day').iso).toBe('')
    expect(withPrecision({ iso: '2022-01-01', precision: 'year' }, 'month').iso).toBe('')
  })
  it('does not seed a date when leaving Unknown', () => {
    expect(withPrecision({ iso: '', precision: 'unknown' }, 'day').iso).toBe('')
  })
  it('an unknown date opens empty, not as today', () => {
    expect(fromDatePart(undefined)).toEqual({ iso: '', precision: 'unknown' })
  })
})
