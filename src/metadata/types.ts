export interface MetadataHit {
  providerId: string
  /** Provider's own key, e.g. an Open Library work key. */
  key: string
  title: string
  author: string
  year?: number
  coverUrl?: string
  pageCount?: number
  subjects: string[]
  isbns: string[]
}

/** Swappable catalog behind one interface (ADR 0004). Results are suggestions only. */
export interface MetadataProvider {
  id: string
  search(query: string, signal?: AbortSignal): Promise<MetadataHit[]>
}
