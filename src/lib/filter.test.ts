import { describe, expect, it } from 'vitest'
import { applyQuery, defaultQuery } from './filter'
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
