import { useEffect, useRef, useState } from 'react'
import { nameKey } from '../lib/inbox'
import type { MetadataHit } from '../metadata/types'
import { useLookupMode } from '../settings'
import { searchMetadata } from '../storage'

/**
 * The Open Library hit that is the same book as an Inbox group, or none. Only an exact
 * normalized title and author match counts, because its subjects and page count are then
 * safe to offer as suggestions; a near miss could suggest the wrong Genre.
 */
export function bestHit(hits: MetadataHit[], title: string, author: string): MetadataHit | undefined {
  const k = nameKey(title, author)
  return hits.find((h) => nameKey(h.title, h.author) === k)
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
    slot(() => searchMetadata(`${title} ${author}`.trim()))
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
