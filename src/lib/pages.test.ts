import { describe, expect, it } from 'vitest'
import { computePageStats } from './pages'
import type { Reading, Work } from '../types'

const work = (id: number, pageCount?: number): Work => ({ id, title: `T${id}`, author: 'A', genres: [], tags: [], shelves: [], pageCount })
const rd = (workId: number, r: Partial<Reading> = {}): Reading => ({ workId, status: 'finished', format: 'print', finish: { y: 2026, m: 2 }, ...r })
const works = [work(1, 300), work(2, 100), work(3)]

describe('computePageStats', () => {
  it('sums pages per year and month, and a re-read counts again', () => {
    const s = computePageStats([rd(1), rd(1, { finish: { y: 2026, m: 5 } }), rd(2, { finish: { y: 2025, m: 1 } })], works, 'all')
    expect(s.total).toBe(700)
    expect(s.perYear).toEqual([{ year: 2025, pages: 100 }, { year: 2026, pages: 600 }])
    expect(s.perMonth[1]).toBe(300)
    expect(s.perMonth[4]).toBe(300)
  })
  it('leaves out audiobooks and books with no page count, and says how many', () => {
    const s = computePageStats([rd(1, { format: 'audiobook' }), rd(3), rd(2)], works, 'all')
    expect(s).toMatchObject({ audiobooks: 1, pagesUnknown: 1, counted: 1, total: 100 })
  })
  it('leaves out DNF and states year-only and undated readings instead of placing them', () => {
    const s = computePageStats([rd(1, { status: 'dnf' }), rd(2, { finish: { y: 2026 } }), rd(2, { finish: undefined })], works, 'all')
    expect(s.counted).toBe(2)
    expect(s.monthUnknown).toBe(1)
    expect(s.undated).toBe(1)
    expect(s.perMonth.every((n) => n === 0)).toBe(true)
  })
  it('follows the year filter', () => {
    expect(computePageStats([rd(1), rd(2, { finish: { y: 2025, m: 1 } })], works, 2025).total).toBe(100)
  })
})
