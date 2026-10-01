import { describe, expect, it } from 'vitest'
import { compareYears } from './compare'
import { noFacets } from './filter'
import type { Reading, Work } from '../types'

const work = (id: number, genres: Work['genres'] = []): Work => ({ id, title: `T${id}`, author: 'A', genres, tags: [], shelves: [] })
const rd = (workId: number, r: Partial<Reading>): Reading => ({ workId, status: 'finished', format: 'ebook', ...r })
const works = [work(1, ['scifi', 'fantasy']), work(2, ['fantasy']), work(3)]
const readings = [
  rd(1, { finish: { y: 2025, m: 1 } }),
  rd(2, { finish: { y: 2025, m: 1 }, format: 'audiobook' }),
  rd(2, { finish: { y: 2025 } }),
  rd(1, { finish: { y: 2026, m: 3 } }),
  rd(3, { finish: { y: 2026, m: 3 }, format: 'print' }),
  rd(3, { status: 'dnf', finish: { y: 2026, m: 4 } }),
]

describe('compareYears', () => {
  const c = compareYears(readings, works, 2025, 2026)
  it('counts finished Readings per month for each year, and states the year-only ones', () => {
    expect(c.a.finished).toBe(3)
    expect(c.a.perMonth[0]).toBe(2)
    expect(c.a.monthUnknown).toBe(1)
    expect(c.b.perMonth[2]).toBe(2)
    expect(c.b.finished).toBe(2)
  })
  it('leaves DNF out of the finished counts', () => {
    expect(c.b.perMonth[3]).toBe(0)
  })
  it('splits genres and formats by year, counting a multi-genre book in each genre', () => {
    expect(c.a.genres.get('fantasy')).toBe(3)
    expect(c.a.genres.get('scifi')).toBe(1)
    expect(c.b.genres.get('none')).toBe(1)
    expect(c.a.formats).toEqual({ ebook: 2, audiobook: 1, print: 0 })
    expect(c.b.formats.print).toBe(1)
  })
  it('lists every genre either year has, busiest first, and follows the facets', () => {
    expect(c.genreKeys[0]).toBe('fantasy')
    expect(compareYears(readings, works, 2025, 2026, { ...noFacets, format: 'print' }).a.finished).toBe(0)
  })
})
