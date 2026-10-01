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
  externalIds?: { openLibrary?: string[]; isbn?: string[]; libby?: string[]; goodreads?: string[] }
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

/**
 * One borrow from a library. A Libby import supplies them in bulk; the reader can also
 * record one by hand. Either way it is evidence of borrowing, not of reading.
 */
export interface Loan {
  id?: number
  workId: number
  source: 'libby' | 'manual'
  /** Absent when unknown; never guessed. */
  borrowed?: DatePart
  /** Library name. Empty when the reader did not say which. */
  library: string
  format?: Format
  /** The Reading this borrow led to. Absent for borrows not (yet) tied to a Reading. Several Loans can share one Reading. */
  readingId?: number
  /** Import record this Loan came from, when it came from an import. Only imported Loans have one (ADR 0002). */
  recordKey?: string
}

export interface WorkSummary extends Work {
  id: number
  latest?: Reading
  readingCount: number
  /** Every Reading, when the list query supplies them; filters match against these. */
  readings?: Reading[]
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
  source: 'libby' | 'goodreads'
  at: number
  fileName: string
  found: number
  added: number
  alreadySeen: number
  ignored: number
}

export type GoodreadsShelf = 'read' | 'to-read' | 'currently-reading'

/** The Goodreads columns this app tracks for change detection. Other columns (average rating, page counts) shift constantly and are ignored. */
export interface GoodreadsFields {
  title: string
  author: string
  shelf: GoodreadsShelf
  /** 1 to 5 whole stars; absent means unrated (Goodreads writes 0). */
  rating?: number
  /** YYYY-MM-DD. Absent means unknown. */
  dateRead?: string
  review?: string
}

export const GOODREADS_FIELD_KEYS: (keyof GoodreadsFields)[] = ['title', 'author', 'shelf', 'rating', 'dateRead', 'review']

/**
 * One Goodreads row, remembered permanently (ADR 0003). `seen` is the source's latest
 * values; `applied` is what the app last took from the source, so a change made in the
 * app is told apart from a change made at Goodreads.
 */
export interface GoodreadsRecord {
  id?: number
  /** Goodreads "Book Id"; the identity of the row. Unique. */
  bookId: string
  importId: number
  state: RecordState
  seen: GoodreadsFields
  applied?: GoodreadsFields
  /** Fields that changed at the source since `applied`, when this returned as an update. */
  changed?: (keyof GoodreadsFields)[]
  isbn?: string
  /** Format guessed from Goodreads' Binding column, offered as an editable default. */
  formatHint?: Format
  workId?: number
  readingId?: number
}
