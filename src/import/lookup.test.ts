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

describe('bestHit with series volumes', () => {
  const hits = [
    hit('Tale of the Secret Saint (Manga) Vol. 3', 'Touya'),
    hit('Tale of the Secret Saint (Light Novel) Vol. 2', 'Touya'),
    hit('Tale of the Secret Saint (Light Novel) Vol. 3', 'Touya'),
  ]
  it('matches "Volume 3" to "Vol. 3", ignoring the article and a partial author name', () => {
    expect(bestHit(hits, 'A Tale of the Secret Saint (Light Novel), Volume 3', 'Touya, chibi')?.title).toContain('Light Novel) Vol. 3')
  })
  it('never matches another volume or the manga edition of a light novel', () => {
    expect(bestHit([hits[0], hits[1]], 'A Tale of the Secret Saint (Light Novel), Volume 3', 'Touya, chibi')).toBeUndefined()
  })
  it('does not treat a different author as the same', () => {
    expect(bestHit(hits, 'A Tale of the Secret Saint (Light Novel), Volume 3', 'Someone Else')).toBeUndefined()
  })
})

import { bestSeriesHit } from './lookup'
describe('bestSeriesHit', () => {
  const series = (title: string, form: 'novel' | 'manga', alt: string[] = []): MetadataHit => ({ providerId: 'anilist', key: `anilist:${title}${form}`, title, altTitles: alt, author: '', subjects: [], isbns: [], form })
  const hits = [series('Fushi no Kami: Rebuilding Civilization Starts With a Village', 'manga'), series('Fushi no Kami: Rebuilding Civilization Starts With a Village', 'novel', ['Fushi no Kami: Henkyou kara Hajimeru Bunmei Saiseiki'])]
  const t = 'Fushi no Kami: Rebuilding Civilization Starts With a Village, Volume 1'
  it('picks the series of the form the reader chose, ignoring the volume', () => {
    expect(bestSeriesHit(hits, t, 'novel')).toBe(hits[1])
    expect(bestSeriesHit(hits, t, 'manga')).toBe(hits[0])
  })
  it('matches on a romanised title too, and offers nothing for a different series', () => {
    expect(bestSeriesHit(hits, 'Fushi no Kami: Henkyou kara Hajimeru Bunmei Saiseiki, Vol. 2', 'novel')).toBe(hits[1])
    expect(bestSeriesHit(hits, 'Another Series, Volume 1', 'novel')).toBeUndefined()
  })
})
