export type GenreId = 'scifi' | 'fantasy' | 'historical' | 'mystery' | 'romance' | 'nonfiction' | 'literary'

/** A date at day, month or year precision. Absent means unknown, never guessed. */
export interface DatePart {
  y: number
  m?: number
  d?: number
}

export type ReadingStatus = 'reading' | 'finished' | 'dnf'
export type Format = 'ebook' | 'audiobook' | 'print'

export interface Work {
  id?: number
  title: string
  author: string
  genres: GenreId[]
  tags: string[]
  series?: { name: string; position: number }
  pageCount?: number
  coverUrl?: string
  /** Identifiers of every edition met, used to recognise the Work on later imports. */
  externalIds?: { openLibrary?: string[]; isbn?: string[]; libby?: string[] }
  /** Manual shelves: 'want' plus any custom shelf ids. Currently reading and Read are derived. */
  shelves: string[]
  /** Demo content only; removed when the reader imports or adds their own library. */
  synthetic?: boolean
}

export interface Reading {
  id?: number
  workId: number
  status: ReadingStatus
  format: Format
  start?: DatePart
  finish?: DatePart
  /** Half-star steps, 0.5 to 5. Absent means unrated, which is not a low score. */
  rating?: number
  review?: string
}

export interface Loan {
  id?: number
  workId: number
  source: 'libby'
  borrowed: DatePart
  library: string
  format?: Format
  /** Import record this Loan came from, when it came from an import. */
  recordKey?: string
}

export interface WorkSummary extends Work {
  id: number
  latest?: Reading
  readingCount: number
}

export interface WorkDetail extends WorkSummary {
  readings: Reading[]
  loans: Loan[]
}

export type RecordState = 'pending' | 'accepted' | 'dismissed'

/**
 * One row from an import file, remembered permanently (dismissed ones too) so a
 * later Import recognises it. For Libby this is a Loan, identified by library key,
 * titleId and borrow timestamp (ADR 0002).
 */
export interface ImportRecord {
  id?: number
  source: 'libby'
  /** `${library.key}:${titleId}:${timestamp}`, unique. */
  key: string
  importId: number
  state: RecordState
  title: string
  author: string
  titleId: string
  isbn?: string
  publisher?: string
  /** Absent when the export does not say; never guessed. */
  format?: Format
  libraryKey: string
  libraryName: string
  /** Borrow time in epoch milliseconds. */
  borrowedAt: number
  coverUrl?: string
  workId?: number
}

export interface ImportRun {
  id?: number
  source: 'libby'
  at: number
  fileName: string
  found: number
  added: number
  alreadySeen: number
  ignored: number
}
