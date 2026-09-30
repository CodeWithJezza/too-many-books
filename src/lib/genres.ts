import type { GenreId } from '../types'

export interface Genre {
  id: GenreId
  label: string
  /** Flat jacket ink. White text on every one of these clears 4.5:1. */
  ink: string
}

export const GENRES: Genre[] = [
  { id: 'scifi', label: 'Sci-fi', ink: '#1f3e8c' },
  { id: 'fantasy', label: 'Fantasy', ink: '#2e7d4f' },
  { id: 'historical', label: 'Historical', ink: '#a3286b' },
  { id: 'mystery', label: 'Mystery', ink: '#0f6b78' },
  { id: 'romance', label: 'Romance', ink: '#b3243b' },
  { id: 'nonfiction', label: 'Nonfiction', ink: '#8a5a00' },
  { id: 'literary', label: 'Literary', ink: '#4a4a7a' },
]

const byId = new Map(GENRES.map((g) => [g.id, g]))
export const genre = (id: GenreId): Genre => byId.get(id)!

/** A Work with no Genre yet gets a neutral brown band, so it reads as unsorted rather than as some other Genre. */
export const NO_GENRE_INK = '#5c4b3b'
export const inkOf = (genres: GenreId[]): string => (genres[0] ? genre(genres[0]).ink : NO_GENRE_INK)
export const labelOf = (genres: GenreId[]): string => (genres[0] ? genre(genres[0]).label : 'No genre')
