import { describe, expect, it } from 'vitest'
import { bestHit } from './lookup'
import type { MetadataHit } from '../metadata/types'

const hit = (title: string, author: string): MetadataHit => ({ providerId: 'open-library', key: `/works/${title}`, title, author, subjects: [], isbns: [] })

describe('bestHit', () => {
  const hits = [hit('Summary of The Martian', 'Instaread'), hit('The Martian', 'Andy Weir')]
  it('takes only an exact title and author match, not the first result', () => {
    expect(bestHit(hits, 'The Martian', 'Andy Weir')?.author).toBe('Andy Weir')
  })
  it('ignores articles and a trailing parenthetical like (Unabridged)', () => {
    expect(bestHit(hits, 'Martian (Unabridged)', 'Andy Weir')).toBeDefined()
  })
  it('offers nothing for a near miss rather than risking a wrong suggestion', () => {
    expect(bestHit(hits, 'The Martian Chronicles', 'Ray Bradbury')).toBeUndefined()
  })
})
