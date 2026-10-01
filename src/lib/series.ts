import type { Reading, Work } from '../types'
import { titleKey } from './match'

export interface SeriesRef { name: string; position: number }

/** Two names are the same Series when their keys match: case, articles and edition labels aside, but (Manga) and (Light Novel) stay different. */
export const seriesNameKey = (name: string): string => titleKey(name)

/**
 * A Series and position read from a title like "Name, Volume 3" or "Name (Light Novel) Vol. 2: Subtitle".
 * Only a suggestion; the reader confirms it. A title with no volume number gives nothing.
 */
export function parseVolume(title: string): SeriesRef | undefined {
  const m = title.match(/^(.*?)[\s,:–-]*\b(?:volume|vol\.?)\s*(\d+(?:\.\d+)?)\b/i)
  const name = m?.[1].replace(/[\s,:–-]+$/, '').trim()
  if (!m || !name || name.length < 2) return undefined
  return { name, position: Number(m[2]) }
}

export interface SeriesEntry {
  position: number
  /** Absent for a gap: a whole-number volume below the highest one that is not in the library. */
  work?: Work
  /** The Work has a finished Reading. */
  read?: boolean
  gap?: boolean
}

export interface SeriesInfo {
  key: string
  name: string
  entries: SeriesEntry[]
  /** Volumes in the library, and how many of them are finished. */
  owned: number
  read: number
  gaps: number
  /** Highest position in the library. Completion is counted up to here: the app never invents a volume past it. */
  highest: number
}

/**
 * Groups Works that name a Series, in position order, marking which are finished and showing
 * gaps between volume 1 and the highest one held. The series' real length is not known, so
 * nothing past the highest volume is counted.
 */
export function buildSeries(works: Work[], readings: Reading[]): SeriesInfo[] {
  const finished = new Set(readings.filter((r) => r.status === 'finished').map((r) => r.workId))
  const groups = new Map<string, Work[]>()
  for (const w of works) {
    if (!w.series?.name.trim()) continue
    const k = seriesNameKey(w.series.name)
    groups.set(k, [...(groups.get(k) ?? []), w])
  }
  return [...groups].map(([key, ws]) => {
    ws.sort((a, b) => a.series!.position - b.series!.position || a.title.localeCompare(b.title))
    const highest = Math.max(...ws.map((w) => w.series!.position))
    const have = new Set(ws.filter((w) => Number.isInteger(w.series!.position)).map((w) => w.series!.position))
    const entries: SeriesEntry[] = ws.map((w) => ({ position: w.series!.position, work: w, read: finished.has(w.id!) }))
    for (let n = 1; n <= Math.floor(highest); n++) if (!have.has(n)) entries.push({ position: n, gap: true })
    entries.sort((a, b) => a.position - b.position || Number(!!a.gap) - Number(!!b.gap))
    return {
      key,
      name: ws[0].series!.name,
      entries,
      owned: ws.length,
      read: ws.filter((w) => finished.has(w.id!)).length,
      gaps: entries.filter((e) => e.gap).length,
      highest,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
}
