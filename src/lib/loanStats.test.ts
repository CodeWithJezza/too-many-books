import { describe, expect, it } from 'vitest'
import { computeLoanStats } from './loanStats'
import type { Loan, Reading, Work } from '../types'

const work = (id: number): Work => ({ id, title: `T${id}`, author: 'A', genres: [], tags: [], shelves: [] })
const rd = (id: number, workId: number, r: Partial<Reading> = {}): Reading => ({ id, workId, status: 'finished', format: 'ebook', finish: { y: 2026, m: 3 }, ...r })
const loan = (workId: number, l: Partial<Loan> = {}): Loan => ({ workId, source: 'libby', library: 'Central', borrowed: { y: 2026, m: 2 }, ...l })

const works = [work(1), work(2), work(3), work(4)]
const readings = [rd(10, 1), rd(20, 2), rd(30, 3, { finish: { y: 2025 } })]
const loans = [
  loan(1, { readingId: 10 }),
  loan(1, { borrowed: { y: 2026 } }),
  loan(2), // work has a loan, but none tied to its reading
  loan(4, { library: '', borrowed: undefined, source: 'manual' }), // never finished
]

describe('computeLoanStats', () => {
  it('counts loans by borrow date and states the undated and year-only ones', () => {
    const s = computeLoanStats(loans, readings, works, 'all')
    expect(s.loanCount).toBe(4)
    expect(s.undated).toBe(1)
    expect(s.perYear).toEqual([{ year: 2026, count: 3 }])
    expect(s.perMonth[1]).toBe(2)
    expect(s.monthUnknown).toBe(1)
  })
  it('names libraries and counts the loans that name none', () => {
    const s = computeLoanStats(loans, readings, works, 'all')
    expect(s.libraries).toEqual([{ library: 'Central', count: 3 }])
    expect(s.noLibrary).toBe(1)
  })
  it('calls a Reading borrowed only when a loan is tied to it, and says how many may be unlinked', () => {
    const s = computeLoanStats(loans, readings, works, 'all')
    expect(s.borrowed).toBe(1)
    expect(s.noLoan).toBe(2)
    expect(s.unlinked).toBe(1)
  })
  it('lists loaned Works with no finished Reading, whatever the year filter', () => {
    expect(computeLoanStats(loans, readings, works, 2025).notFinished.map((w) => w.id)).toEqual([4])
  })
  it('a year filter narrows loans and readings to that year', () => {
    const s = computeLoanStats(loans, readings, works, 2025)
    expect(s.loanCount).toBe(0)
    expect(s.borrowed + s.noLoan).toBe(1)
  })
})
