import { describe, expect, it } from 'vitest'
import { matchHit, searchLibrary } from './match'
import type { MetadataHit } from '../metadata/types'
import type { Work } from '../types'

const work = (id: number, title: string, author: string, extra: Partial<Work> = {}): Work => ({ id, title, author, genres: [], tags: [], shelves: [], ...extra })
const hit = (over: Partial<MetadataHit>): MetadataHit => ({ providerId: 'open-library', key: '/works/X', title: 'T', author: 'A', subjects: [], isbns: [], ...over })

describe('matchHit', () => {
  const works = [work(1, 'Project Hail Mary', 'Andy Weir', { externalIds: { openLibrary: ['/works/OL1W'] } }), work(2, 'The Goblin Emperor', 'Katherine Addison')]

  it('matches exactly on a stored Open Library key even when the title differs', () => {
    expect(matchHit(works, hit({ key: '/works/OL1W', title: 'PHM (audio)' }))).toMatchObject({ kind: 'exact', work: { id: 1 } })
  })
  it('matches exactly on a shared ISBN', () => {
    const w = [work(3, 'X', 'Y', { externalIds: { isbn: ['123'] } })]
    expect(matchHit(w, hit({ isbns: ['999', '123'] }))?.kind).toBe('exact')
  })
  it('suggests a fuzzy match on normalized title and author, ignoring articles and punctuation', () => {
    expect(matchHit(works, hit({ title: 'Goblin Emperor', author: 'Katherine Addison' }))).toMatchObject({ kind: 'fuzzy', work: { id: 2 } })
  })
  it('does not match a different author', () => {
    expect(matchHit(works, hit({ title: 'The Goblin Emperor', author: 'Someone Else' }))).toBeUndefined()
  })
})

describe('searchLibrary', () => {
  it('needs two characters and matches title or author', () => {
    const works = [work(1, 'Circe', 'Madeline Miller')]
    expect(searchLibrary(works, 'c')).toEqual([])
    expect(searchLibrary(works, 'MILLER')).toHaveLength(1)
  })
})

import { toDatePart, todayIso } from './dates'
describe('dates', () => {
  it('keeps the precision it was given and never guesses an unknown date', () => {
    expect(toDatePart('2026-09-12', 'day')).toEqual({ y: 2026, m: 9, d: 12 })
    expect(toDatePart('2026-09-12', 'month')).toEqual({ y: 2026, m: 9 })
    expect(toDatePart('2026-09-12', 'year')).toEqual({ y: 2026 })
    expect(toDatePart('2026-09-12', 'unknown')).toBeUndefined()
  })
  it('formats local today as ISO', () => {
    expect(todayIso(new Date(2026, 0, 5))).toBe('2026-01-05')
  })
})
