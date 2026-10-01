import type { MetadataHit } from '../metadata/types'
import type { Work } from '../types'

export const norm = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[’'`]/g, '').replace(/[^a-z0-9]+/g, ' ').trim()
const stripArticle = (s: string) => s.replace(/^(the|a|an) /, '')
const sameName = (a: string, b: string) => stripArticle(norm(a)) === stripArticle(norm(b))

/** Words that make a parenthetical part of what the book is, not just an edition label: (Manga) and (Light Novel) are different books. */
const FORM = /light novel|manga|graphic novel|comic/

/**
 * A title reduced to what identifies the book: no article, no edition labels such as
 * "(Unabridged)", and "Volume 3" / "Vol. 3" the same. The volume number and a form marker
 * stay, so Vol. 3 never matches Vol. 2 and a manga never matches its light novel.
 */
export function titleKey(title: string): string {
  const t = title.replace(/\(([^)]*)\)/g, (_, inner: string) => (FORM.test(inner.toLowerCase()) ? ` ${inner} ` : ' '))
  return stripArticle(norm(t).replace(/\b(volume|vol) (\d+)\b/g, 'vol $2'))
}

/** Same author, allowing one name to be a part of the other ("Touya" within "Touya, chibi"). A missing author matches anyone. */
export function authorsCompatible(a: string, b: string): boolean {
  const ta = new Set(norm(a).split(' ').filter(Boolean))
  const tb = new Set(norm(b).split(' ').filter(Boolean))
  if (ta.size === 0 || tb.size === 0) return true
  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta]
  return [...small].every((t) => big.has(t))
}

/** A volume's series: the title without edition labels, the volume number and anything after it. */
export function seriesKey(title: string): string {
  return titleKey(title.replace(/,?\s*\b(?:volume|vol\.?)\s*\d+.*$/i, '').replace(/\([^)]*\)/g, ' '))
}

/** What to ask a series catalog: the title without labels and volume. */
export const seriesQuery = (title: string): string =>
  title.replace(/,?\s*\b(?:volume|vol\.?)\s*\d+.*$/i, '').replace(/\([^)]*\)/g, ' ').replace(/\s+/g, ' ').trim()

/** What to ask Open Library: the title without labels, the volume, and the first author. */
export function lookupQuery(title: string, author: string): string {
  const vol = title.match(/\b(?:volume|vol\.?)\s*(\d+)/i)?.[1]
  const base = title.replace(/\([^)]*\)/g, ' ').replace(/,?\s*\b(?:volume|vol\.?)\s*\d+\b/i, ' ').replace(/\s+/g, ' ').trim()
  const first = author.split(',')[0].trim()
  return [base, first, vol ? `Vol. ${vol}` : ''].filter(Boolean).join(' ')
}

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
