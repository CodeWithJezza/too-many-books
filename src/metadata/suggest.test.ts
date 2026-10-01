import { describe, expect, it } from 'vitest'
import { suggestTags } from './suggest'

describe('suggestTags', () => {
  it('suggests light novel and manga from the title or Open Library subjects', () => {
    expect(suggestTags('A Tale of the Secret Saint (Light Novel), Volume 3')).toEqual(['light novel'])
    expect(suggestTags('Berserk, Vol. 1 (Manga)')).toEqual(['manga'])
    expect(suggestTags('Spice and Wolf', ['form:light novel', 'Fantasy'])).toEqual(['light novel'])
  })
  it('suggests nothing for an ordinary book', () => {
    expect(suggestTags('Snow Crash', ['Science fiction'])).toEqual([])
  })
})
