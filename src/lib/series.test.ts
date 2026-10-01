import { describe, expect, it } from 'vitest'
import { buildSeries, parseVolume, seriesNameKey } from './series'
import type { Reading, Work } from '../types'

describe('parseVolume', () => {
  it('reads the series and volume from Libby and Open Library styles', () => {
    expect(parseVolume('Fushi no Kami: Rebuilding Civilization Starts With a Village, Volume 1')).toEqual({ name: 'Fushi no Kami: Rebuilding Civilization Starts With a Village', position: 1 })
    expect(parseVolume('Tale of the Secret Saint (Light Novel) Vol. 3')).toEqual({ name: 'Tale of the Secret Saint (Light Novel)', position: 3 })
    expect(parseVolume('A Tale of the Secret Saint (Light Novel), Volume 2.5: Extra')).toEqual({ name: 'A Tale of the Secret Saint (Light Novel)', position: 2.5 })
  })
  it('gives nothing without a volume number or a series name', () => {
    expect(parseVolume('Snow Crash')).toBeUndefined()
    expect(parseVolume('Volume 3')).toBeUndefined()
  })
})

describe('buildSeries', () => {
  const w = (id: number, name: string | undefined, position = 1): Work => ({ id, title: `T${id}`, author: '', genres: [], tags: [], shelves: [], series: name ? { name, position } : undefined })
  const fin = (workId: number): Reading => ({ workId, status: 'finished', format: 'ebook' })

  it('orders volumes, marks finished ones and shows whole-number gaps up to the highest', () => {
    const [s] = buildSeries([w(1, 'Saint', 1), w(2, 'Saint', 4), w(3, 'Saint', 2.5)], [fin(1)])
    expect(s.entries.map((e) => [e.position, e.gap ?? false, e.read ?? false])).toEqual([[1, false, true], [2, true, false], [2.5, false, false], [3, true, false], [4, false, false]])
    expect(s).toMatchObject({ owned: 3, read: 1, gaps: 2, highest: 4 })
  })
  it('does not invent volumes past the highest, and ignores Works with no series', () => {
    const all = buildSeries([w(1, 'Saint', 1), w(2, undefined)], [])
    expect(all).toHaveLength(1)
    expect(all[0].gaps).toBe(0)
  })
  it('keeps a manga and its light novel as separate series, and joins names that differ by case or article', () => {
    expect(buildSeries([w(1, 'X (Manga)'), w(2, 'X (Light Novel)')], [])).toHaveLength(2)
    expect(seriesNameKey('The Saint')).toBe(seriesNameKey('saint'))
  })
})
