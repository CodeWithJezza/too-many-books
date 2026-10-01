import { describe, expect, it } from 'vitest'
import { computeAuthors } from './authors'
import { computeTrends } from './trends'
import type { Reading, Work } from '../types'

const work = (id: number, author: string, genres: Work['genres'] = []): Work => ({ id, title: `T${id}`, author, genres, tags: [], shelves: [] })
const rd = (workId: number, r: Partial<Reading>): Reading => ({ workId, status: 'finished', format: 'ebook', ...r })
const works = [work(1, 'Ann', ['scifi', 'fantasy']), work(2, 'Ann', ['fantasy']), work(3, 'Bob'), work(4, '')]
const readings = [
  rd(1, { finish: { y: 2024, m: 1 }, rating: 4 }),
  rd(2, { finish: { y: 2025 }, rating: 5 }),
  rd(2, { finish: { y: 2025 } }),
  rd(3, { finish: { y: 2025, m: 3 } }),
  rd(3, {}),
  rd(4, { finish: { y: 2025 } }),
  rd(1, { status: 'dnf', finish: { y: 2025 }, rating: 1 }),
]

describe('computeTrends', () => {
  const t = computeTrends(readings, works)
  it('averages only rated readings and counts unrated apart', () => {
    const y25 = t.years.find((y) => y.year === 2025)!
    expect(y25).toMatchObject({ finished: 4, rated: 1, unrated: 3, average: 5 })
    expect(t.years.find((y) => y.year === 2024)!.average).toBe(4)
  })
  it('leaves DNF out, counts a multi-genre book in each genre, and states undated readings', () => {
    expect(t.years.find((y) => y.year === 2024)!.genres.get('scifi')).toBe(1)
    expect(t.years.find((y) => y.year === 2025)!.finished).toBe(4)
    expect(t.undated).toBe(1)
  })
  it('has no average for a year with nothing rated', () => {
    expect(computeTrends([rd(3, { finish: { y: 2025 } })], works).years[0].average).toBeUndefined()
  })
})

describe('computeAuthors', () => {
  it('ranks every author with average rating, and leaves out books with no author', () => {
    const a = computeAuthors(readings, works, 'all')
    expect(a.ranking[0]).toMatchObject({ author: 'Ann', count: 3, average: 4.5, rated: 2 })
    expect(a.ranking.map((r) => r.author)).toEqual(['Ann', 'Bob'])
    expect(a.noAuthor).toBe(1)
  })
  it('counts new authors in the year of their first dated finish, across all years', () => {
    const a = computeAuthors(readings, works, 2025)
    expect(a.newPerYear).toEqual([{ year: 2024, count: 1 }, { year: 2025, count: 1 }])
    expect(a.ranking.find((r) => r.author === 'Ann')!.count).toBe(2) // only the two in 2025
  })
  it('does not merge different spellings of a name', () => {
    const w = [work(1, 'Touya'), work(2, 'Touya, chibi')]
    expect(computeAuthors([rd(1, { finish: { y: 2025 } }), rd(2, { finish: { y: 2025 } })], w, 'all').ranking).toHaveLength(2)
  })
})
