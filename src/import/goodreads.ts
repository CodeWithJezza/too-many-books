import type { Format, GoodreadsFields, GoodreadsRecord, GoodreadsShelf } from '../types'
import { parseCsv } from './csv'

export class GoodreadsFormatError extends Error {}

export type ParsedGoodreads = Pick<GoodreadsRecord, 'bookId' | 'seen' | 'isbn' | 'formatHint'>

const REQUIRED = ['Book Id', 'Title', 'Author', 'Exclusive Shelf']
const SHELVES: GoodreadsShelf[] = ['read', 'to-read', 'currently-reading']

/** Goodreads writes ISBNs as ="0439023483" so spreadsheets keep leading zeros. */
const cleanIsbn = (v: string | undefined) => (v ?? '').replace(/^=?"?/, '').replace(/"?$/, '').replace(/[^0-9Xx]/g, '') || undefined

/** Goodreads reviews carry HTML line breaks and entities; keep the words, drop the markup. */
export function plainText(v: string): string {
  return v
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatFromBinding(binding: string | undefined): Format | undefined {
  const b = (binding ?? '').toLowerCase()
  if (/audio|cd/.test(b)) return 'audiobook'
  if (/kindle|ebook|e-book|nook/.test(b)) return 'ebook'
  if (/hardcover|paperback|mass market|board book|library binding|trade/.test(b)) return 'print'
  return undefined
}

/** Goodreads dates arrive as 2026/09/12; anything else is treated as unknown rather than guessed. */
export function parseGoodreadsDate(v: string | undefined): string | undefined {
  const m = /^(\d{4})\/(\d{1,2})\/(\d{1,2})$/.exec((v ?? '').trim())
  if (!m) return undefined
  const [, y, mo, d] = m
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}

export function parseGoodreadsExport(text: string): { records: ParsedGoodreads[]; ignored: number } {
  const rows = parseCsv(text)
  const header = rows[0]
  if (!header || REQUIRED.some((c) => !header.includes(c))) {
    throw new GoodreadsFormatError('This does not look like a Goodreads library export. Its columns (Book Id, Title, Author, Exclusive Shelf) are missing.')
  }
  const col = Object.fromEntries(header.map((h, i) => [h, i])) as Record<string, number>
  const get = (r: string[], name: string) => r[col[name]]?.trim() ?? ''
  const records: ParsedGoodreads[] = []
  const seen = new Set<string>()
  let ignored = 0
  for (const r of rows.slice(1)) {
    const bookId = get(r, 'Book Id')
    const shelf = get(r, 'Exclusive Shelf') as GoodreadsShelf
    if (!bookId || !SHELVES.includes(shelf) || seen.has(bookId)) { ignored++; continue }
    seen.add(bookId)
    const rating = Number(get(r, 'My Rating'))
    const fields: GoodreadsFields = {
      title: get(r, 'Title') || 'Untitled',
      author: get(r, 'Author'),
      shelf,
      rating: rating >= 1 && rating <= 5 ? Math.round(rating) : undefined,
      dateRead: parseGoodreadsDate(get(r, 'Date Read')),
      review: plainText(get(r, 'My Review')) || undefined,
    }
    records.push({ bookId, seen: fields, isbn: cleanIsbn(get(r, 'ISBN13')) ?? cleanIsbn(get(r, 'ISBN')), formatHint: formatFromBinding(get(r, 'Binding')) })
  }
  return { records, ignored }
}
