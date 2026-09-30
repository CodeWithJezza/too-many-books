import type { MetadataHit, MetadataProvider } from './types'

const FIELDS = 'key,title,author_name,first_publish_year,cover_i,number_of_pages_median,subject,isbn'

interface Doc {
  key: string
  title: string
  author_name?: string[]
  first_publish_year?: number
  cover_i?: number
  number_of_pages_median?: number
  subject?: string[]
  isbn?: string[]
}

export const openLibrary: MetadataProvider = {
  id: 'open-library',
  async search(query, signal) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=8&fields=${FIELDS}`
    const res = await fetch(url, { signal })
    if (!res.ok) throw new Error(`Open Library answered ${res.status}`)
    const json = (await res.json()) as { docs?: Doc[] }
    return (json.docs ?? []).map(toHit)
  },
}

export function toHit(d: Doc): MetadataHit {
  return {
    providerId: 'open-library',
    key: d.key,
    title: d.title,
    author: d.author_name?.[0] ?? '',
    year: d.first_publish_year,
    coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-M.jpg` : undefined,
    pageCount: d.number_of_pages_median,
    subjects: (d.subject ?? []).slice(0, 40),
    isbns: (d.isbn ?? []).slice(0, 12),
  }
}
