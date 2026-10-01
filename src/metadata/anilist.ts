import type { MetadataHit, MetadataProvider } from './types'

const QUERY = `query($s: String) { Page(perPage: 8) { media(search: $s, type: MANGA) { id format title { romaji english } genres volumes } } }`

interface Media {
  id: number
  format: string | null
  title: { romaji: string | null; english: string | null }
  genres: string[] | null
  volumes: number | null
}

/**
 * AniList: free, no key, callable from the browser. It catalogues series, not editions, so it has
 * no ISBNs or page counts; it says whether a series is a light novel (NOVEL) or manga, and its genres.
 * Results are suggestions only (ADR 0004).
 */
export const aniList: MetadataProvider = {
  id: 'anilist',
  async search(query, signal) {
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ query: QUERY, variables: { s: query } }),
      signal,
    })
    if (!res.ok) throw new Error(`AniList answered ${res.status}`)
    const json = (await res.json()) as { data?: { Page?: { media?: Media[] } } }
    return (json.data?.Page?.media ?? []).map(toHit)
  },
}

export function toHit(m: Media): MetadataHit {
  const names = [m.title.english, m.title.romaji].filter((x): x is string => !!x)
  return {
    providerId: 'anilist',
    key: `anilist:${m.id}`,
    title: names[0] ?? '',
    altTitles: names.slice(1),
    author: '',
    subjects: m.genres ?? [],
    isbns: [],
    form: m.format === 'NOVEL' ? 'novel' : 'manga',
  }
}
