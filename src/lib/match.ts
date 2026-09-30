import type { MetadataHit } from '../metadata/types'
import type { Work } from '../types'

export const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const stripArticle = (s: string) => s.replace(/^(the|a|an) /, '')
const sameName = (a: string, b: string) => stripArticle(norm(a)) === stripArticle(norm(b))

export type MatchKind = 'exact' | 'fuzzy'

/**
 * Tier 1 (exact): a stored Open Library key or ISBN. Tier 2 (fuzzy): same
 * normalized title and author, no shared id. The caller only suggests fuzzy
 * matches and never merges on its own (BUILD_BRIEF, matching rules).
 */
export function matchHit(works: Work[], hit: MetadataHit): { work: Work; kind: MatchKind } | undefined {
  for (const w of works) {
    const ids = w.externalIds
    if (ids?.openLibrary?.includes(hit.key) || ids?.isbn?.some((i) => hit.isbns.includes(i))) return { work: w, kind: 'exact' }
  }
  for (const w of works) {
    if (sameName(w.title, hit.title) && (!hit.author || !w.author || sameName(w.author, hit.author))) return { work: w, kind: 'fuzzy' }
  }
  return undefined
}

export function searchLibrary(works: Work[], text: string, limit = 5): Work[] {
  const n = norm(text)
  if (n.length < 2) return []
  return works.filter((w) => norm(w.title).includes(n) || norm(w.author).includes(n)).slice(0, limit)
}
