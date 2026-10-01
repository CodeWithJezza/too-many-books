import { useEffect, useRef, useState } from 'react'
import { authorsCompatible, lookupQuery, seriesKey, seriesQuery, titleKey } from '../lib/match'
import type { MetadataHit } from '../metadata/types'
import { useLookupMode } from '../settings'
import { searchMetadata, searchSeries } from '../storage'

/**
 * The Open Library hit that is the same book as an Inbox group, or none. Only an exact
 * normalized title and compatible author counts (see titleKey), because its subjects and page count are then
 * safe to offer as suggestions; a near miss could suggest the wrong Genre.
 */
export function bestHit(hits: MetadataHit[], title: string, author: string): MetadataHit | undefined {
  const k = titleKey(title)
  return hits.find((h) => titleKey(h.title) === k && authorsCompatible(h.author, author))
}

/**
 * The AniList series a volume belongs to, but only for the form the reader chose: a manga and its
 * light novel share a title, so without that choice there is nothing safe to suggest.
 */
export function bestSeriesHit(hits: MetadataHit[], title: string, form: 'novel' | 'manga'): MetadataHit | undefined {
  const k = seriesKey(title)
  return hits.find((h) => h.form === form && [h.title, ...(h.altTitles ?? [])].some((t) => seriesKey(t) === k))
}

// Open Library is a free service: look up at most two rows at a time, on demand.
const MAX_PARALLEL = 2
let running = 0
const waiting: (() => void)[] = []
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (running >= MAX_PARALLEL) await new Promise<void>((r) => waiting.push(r))
  running++
  try {
    return await fn()
  } finally {
    running--
    waiting.shift()?.()
  }
}

export type Lookup = { state: 'idle' | 'loading' | 'done' | 'failed'; hit?: MetadataHit }

/**
 * Looks a row up once. In automatic mode that happens when it scrolls into view; in "ask" mode
 * only when `run` is called; with lookups off, never. Suggestions only; failure is harmless.
 */
export function useLookup(title: string, author: string, enabled: boolean) {
  const mode = useLookupMode()
  const ref = useRef<HTMLLIElement>(null)
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' })
  const started = useRef(false)

  const run = () => {
    if (started.current || !enabled || mode === 'off') return
    started.current = true
    setLookup({ state: 'loading' })
    slot(() => searchMetadata(lookupQuery(title, author)))
      .then((hits) => setLookup({ state: 'done', hit: bestHit(hits, title, author) }))
      .catch(() => setLookup({ state: 'failed' }))
  }

  useEffect(() => {
    const el = ref.current
    if (mode !== 'auto' || !enabled || started.current || !el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        obs.disconnect()
        run()
      },
      { rootMargin: '200px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title, author, enabled, mode])

  return { ref, lookup, run, mode }
}

/**
 * Looks a manga or light novel up on AniList for genre suggestions, once the reader has said which
 * form it is. Automatic mode looks as soon as a form is chosen; "ask" mode waits for the button.
 */
export function useSeriesLookup(title: string, form: 'novel' | 'manga' | undefined, enabled: boolean) {
  const mode = useLookupMode()
  const [result, setResult] = useState<Lookup & { form?: string }>({ state: 'idle' })
  const started = useRef<string | undefined>(undefined)

  const run = () => {
    if (!form || !enabled || mode === 'off' || started.current === form) return
    started.current = form
    setResult({ state: 'loading', form })
    slot(() => searchSeries(seriesQuery(title)))
      .then((hits) => setResult({ state: 'done', hit: bestSeriesHit(hits, title, form), form }))
      .catch(() => setResult({ state: 'failed', form }))
  }

  useEffect(() => {
    if (mode === 'auto') run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form, enabled, mode, title])

  // A result belongs to the form it was asked for; choosing the other form starts clean.
  const lookup: Lookup = form && result.form === form ? result : { state: 'idle' }
  return { lookup, run, mode }
}
