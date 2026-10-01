import { describe, expect, it } from 'vitest'
import { applyQuery, defaultQuery, sortLetter } from './filter'
import type { WorkSummary } from '../types'

const w = (id: number, title: string, author: string, extra: Partial<WorkSummary> = {}): WorkSummary => ({
  id, title, author, genres: ['scifi'], tags: [], shelves: [], readingCount: 0, ...extra,
})

describe('applyQuery', () => {
  const works = [
    w(1, 'The Zed', 'Ann Alpha', { latest: { workId: 1, status: 'finished', format: 'ebook', finish: { y: 2024, m: 3 }, rating: 2 }, readingCount: 1 }),
    w(2, 'A Bee', 'Bob Beta', { latest: { workId: 2, status: 'finished', format: 'ebook', finish: { y: 2025 } }, readingCount: 1 }),
    w(3, 'Cee', 'Cy Gamma', { latest: { workId: 3, status: 'finished', format: 'print' }, readingCount: 1 }),
    w(4, 'Dee', 'Di Delta', { shelves: ['want'] }),
  ]

  it('sorts by most recent finish and puts unknown dates last', () => {
    expect(applyQuery(works, defaultQuery).map((x) => x.id)).toEqual([2, 1, 3, 4])
  })

  it('sorts unrated after a low rating', () => {
    expect(applyQuery(works, { ...defaultQuery, sort: 'rating' }).map((x) => x.id)).toEqual([1, 2, 3, 4])
  })

  it('ignores a leading article when sorting by title', () => {
    expect(applyQuery(works, { ...defaultQuery, sort: 'title' }).map((x) => x.id)).toEqual([2, 3, 4, 1])
  })

  it('filters by shelf and by accent-insensitive text', () => {
    expect(applyQuery(works, { ...defaultQuery, shelf: 'want' }).map((x) => x.id)).toEqual([4])
    expect(applyQuery(works, { ...defaultQuery, text: 'GAMMA' }).map((x) => x.id)).toEqual([3])
  })
})

describe('Reading-level facets (ADR 0008)', () => {
  const rs = (workId: number, ...r: Partial<import('../types').Reading>[]) => r.map((x) => ({ workId, status: 'finished' as const, format: 'ebook' as const, ...x }))
  const works = [
    // An ebook rated 5 and, separately, an unrated audiobook.
    w(1, 'One', 'A', { tags: ['cozy'], readings: rs(1, { rating: 5, finish: { y: 2023, m: 4 } }, { format: 'audiobook', finish: { y: 2025 } }) }),
    w(2, 'Two', 'B', { readings: rs(2, { rating: 5, format: 'audiobook', status: 'dnf', finish: { y: 2025, m: 1 } }) }),
    w(3, 'Three', 'C', { readings: rs(3, {}) }),
    w(4, 'Four', 'D', { shelves: ['want'] }),
  ]
  const ids = (q: Partial<typeof defaultQuery>) => applyQuery(works, { ...defaultQuery, sort: 'title', ...q }).map((x) => x.id)

  it('needs one Reading to satisfy every Reading facet together', () => {
    expect(ids({ format: 'audiobook', rating: 5 })).toEqual([2])
    expect(ids({ format: 'audiobook' })).toEqual([1, 2])
  })
  it('matches an older Reading, not just the latest', () => {
    expect(ids({ year: 2023 })).toEqual([1])
  })
  it('keeps unrated and unknown date as their own choices', () => {
    expect(ids({ rating: 'unrated' })).toEqual([1, 3])
    expect(ids({ year: 'unknown' })).toEqual([3])
  })
  it('filters by status, month and tag, and a Work with no Readings never matches a Reading facet', () => {
    expect(ids({ status: 'dnf' })).toEqual([2])
    expect(ids({ year: 2025, month: 1 })).toEqual([2])
    expect(ids({ tag: 'cozy' })).toEqual([1])
    expect(ids({ format: 'ebook' })).toEqual([1, 3])
  })
})

describe('missing-data filters (A7)', () => {
  const rd = (workId: number, r: Partial<import('../types').Reading>) => ({ workId, status: 'finished' as const, format: 'ebook' as const, ...r })
  const works = [
    w(1, 'Full', 'A', { pageCount: 300, coverUrl: 'x', readings: [rd(1, { finish: { y: 2024 } })] }),
    w(2, 'Bare', 'B', { genres: [], readings: [rd(2, {})] }),
    w(3, 'Reading', 'C', { pageCount: 100, coverUrl: 'x', readings: [rd(3, { status: 'reading' })] }),
  ]
  const ids = (missing: import('./filter').Missing) => applyQuery(works, { ...defaultQuery, sort: 'title', missing }).map((x) => x.id)
  it('lists books missing pages, genre or cover', () => {
    expect(ids('pages')).toEqual([2])
    expect(ids('genre')).toEqual([2])
    expect(ids('cover')).toEqual([2])
  })
  it('only a finished Reading can be missing its finish date', () => {
    expect(ids('date')).toEqual([2])
  })
})

describe('sortLetter', () => {
  it('files a title under its first word after any article, and an author under the last name', () => {
    expect(sortLetter(w(1, 'The Zed', 'Ann Alpha'), 'title')).toBe('Z')
    expect(sortLetter(w(2, 'A Bee', 'Bob Beta'), 'author')).toBe('B')
    expect(sortLetter(w(3, '1984', 'George Orwell'), 'title')).toBe('#')
    expect(sortLetter(w(4, 'Élan', 'x'), 'title')).toBe('E')
  })
  it('has no letters when the sort is not alphabetical', () => {
    expect(sortLetter(w(1, 'Zed', 'A'), 'recent')).toBeUndefined()
  })
})
