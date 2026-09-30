import type { Format, ImportRecord } from '../types'

export type ParsedRecord = Omit<ImportRecord, 'id' | 'importId' | 'state'>

export interface ParseResult {
  records: ParsedRecord[]
  /** Rows that were not `Borrowed` (returns, holds, etc.); ignored by design (ADR 0002). */
  ignored: number
}

export class ImportFormatError extends Error {}

interface Row {
  activity?: string
  timestamp?: number
  title?: { text?: string; titleId?: string }
  author?: string
  publisher?: string
  isbn?: string
  library?: { key?: string; text?: string }
  cover?: { url?: string; format?: string }
}

/**
 * Parses Libby's JSON timeline export. Only `Borrowed` rows are read. A row that
 * lacks what identity needs (library key, titleId, timestamp) is skipped and
 * counted as ignored rather than guessed at.
 */
export function parseLibbyExport(json: unknown): ParseResult {
  const timeline = (json as { timeline?: unknown } | null)?.timeline
  if (!Array.isArray(timeline)) {
    throw new ImportFormatError('This does not look like a Libby JSON timeline export. It has no "timeline" list.')
  }
  const records: ParsedRecord[] = []
  const seen = new Set<string>()
  let ignored = 0
  for (const r of timeline as Row[]) {
    const titleId = r?.title?.titleId
    const libraryKey = r?.library?.key
    const ts = r?.timestamp
    if (r?.activity !== 'Borrowed' || !titleId || !libraryKey || typeof ts !== 'number') {
      ignored++
      continue
    }
    const key = `${libraryKey}:${titleId}:${ts}`
    if (seen.has(key)) {
      ignored++
      continue
    }
    seen.add(key)
    const f = r.cover?.format
    const format: Format | undefined = f === 'ebook' || f === 'audiobook' ? f : undefined
    records.push({
      source: 'libby',
      key,
      title: (r.title?.text ?? '').trim() || 'Untitled',
      author: (r.author ?? '').trim(),
      titleId,
      isbn: r.isbn || undefined,
      publisher: r.publisher || undefined,
      format,
      libraryKey,
      libraryName: r.library?.text ?? libraryKey,
      borrowedAt: ts,
      coverUrl: r.cover?.url || undefined,
    })
  }
  return { records, ignored }
}
