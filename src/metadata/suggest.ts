import type { GenreId } from '../types'

const RULES: [GenreId, RegExp][] = [
  ['scifi', /science.?fiction|sci-?fi|dystopi|space (opera|flight)/i],
  ['fantasy', /fantasy|magic|dragons|wizards/i],
  ['historical', /historical (fiction|novel)|fiction.*historical/i],
  ['mystery', /mystery|detective|crime|thriller|suspense/i],
  ['romance', /romance|love stories/i],
  ['nonfiction', /^(non-?fiction|biograph|memoir|essays|history$|natural history|psychology|nature)/i],
  ['literary', /literary|literature/i],
]

/** Suggestions only; the reader confirms every Genre. */
export function suggestGenres(subjects: string[]): GenreId[] {
  const out = new Set<GenreId>()
  for (const [id, rx] of RULES) if (subjects.some((s) => rx.test(s))) out.add(id)
  return [...out]
}
