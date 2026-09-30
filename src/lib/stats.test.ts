import { describe, expect, it } from 'vitest'
import { computeStats } from './stats'
import type { Reading, Work } from '../types'

const work = (id: number, author: string, genres: Work['genres'] = []): Work => ({ id, title: `T${id}`, author, genres, tags: [], shelves: [] })
const rd = (workId: number, r: Partial<Reading>): Reading => ({ workId, status: 'finished', format: 'ebook', ...r })

const works = [work(1, 'Ann', ['scifi', 'literary']), work(2, 'Ann', ['fantasy']), work(3, 'Bob')]
const readings = [
  rd(1, { finish: { y: 2025, m: 3 }, rating: 4.5 }),
  rd(2, { finish: { y: 2026, m: 1 }, rating: 2, format: 'audiobook' }),
  rd(2, { finish: { y: 2026 } }),
  rd(3, {}),
  rd(3, { status: 'dnf', finish: { y: 2026, m: 2 } }),
]

describe('computeStats', () => {
  it('counts finished readings per year and keeps unknown-date ones in their own bar', () => {
    const s = computeStats(readings, works, 'all')
    expect(s.perYear.map((y) => [y.year, y.books.length])).toEqual([[2025, 1], [2026, 2]])
    expect(s.unknownDateBooks).toHaveLength(1)
    expect(s.finishedCount).toBe(4)
  })
  it('excludes DNF from finished and counts it separately', () => {
    const s = computeStats(readings, works, 'all')
    expect(s.dnfCount).toBe(1)
    expect(computeStats(readings, works, 2025).dnfCount).toBe(0)
  })
  it('a year filter leaves out unknown-date readings and reports how many', () => {
    const s = computeStats(readings, works, 2026)
    expect(s.finishedCount).toBe(2)
    expect(s.unknownDate).toBe(1)
  })
  it('month view uses the selected year, else the latest, and reports readings with no month', () => {
    const s = computeStats(readings, works, 'all')
    expect(s.monthYear).toBe(2026)
    expect(s.perMonth[0]).toHaveLength(1)
    expect(s.monthUnknown).toBe(1)
  })
  it('a Work with several genres counts once in each; no genre is its own bucket', () => {
    const g = Object.fromEntries(computeStats(readings, works, 'all').genres.map((x) => [x.key, x.count]))
    expect(g).toMatchObject({ scifi: 1, literary: 1, fantasy: 2, none: 1 })
  })
  it('keeps unrated apart from every rating bucket', () => {
    const s = computeStats(readings, works, 'all')
    expect(s.unrated).toBe(2)
    expect(s.ratings.find((r) => r.value === 4.5)?.count).toBe(1)
    expect(s.ratings.find((r) => r.value === 0.5)?.count).toBe(0)
  })
  it('ranks authors by finished readings', () => {
    expect(computeStats(readings, works, 'all').authors[0]).toEqual({ author: 'Ann', count: 3 })
  })
  it('splits formats by year', () => {
    const f = computeStats(readings, works, 'all').formats.find((x) => x.year === 2026)!
    expect(f.counts).toMatchObject({ audiobook: 1, ebook: 1, print: 0 })
  })
})
