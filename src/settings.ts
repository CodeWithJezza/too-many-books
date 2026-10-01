import { useSyncExternalStore } from 'react'

/**
 * Online book lookups send the title and author you are looking up to Open Library, and the
 * browser's address to the sites that serve covers. This is a per-device preference, so it
 * lives in this browser and is not part of a backup.
 *
 * auto: look up Inbox rows as they come into view. ask: only when a row's button is pressed.
 * off: never contact Open Library; the Add screen then offers only your own library and typing by hand.
 */
export type LookupMode = 'auto' | 'ask' | 'off'

const KEY = 'tmb-lookups'
const EVENT = 'tmb-settings'
let memory: LookupMode = 'auto'

export function getLookupMode(): LookupMode {
  try {
    const v = globalThis.localStorage?.getItem(KEY)
    if (v === 'ask' || v === 'off' || v === 'auto') return v
  } catch {
    /* private mode: fall through to this session's value */
  }
  return memory
}

export function setLookupMode(mode: LookupMode): void {
  memory = mode
  try {
    globalThis.localStorage?.setItem(KEY, mode)
  } catch {
    /* the choice still holds for this session */
  }
  globalThis.dispatchEvent?.(new Event(EVENT))
}

const subscribe = (cb: () => void) => {
  globalThis.addEventListener?.(EVENT, cb)
  globalThis.addEventListener?.('storage', cb)
  return () => {
    globalThis.removeEventListener?.(EVENT, cb)
    globalThis.removeEventListener?.('storage', cb)
  }
}

export const useLookupMode = (): LookupMode => useSyncExternalStore(subscribe, getLookupMode)

/** How the Library lays out books. A per-device preference, kept in this browser like the lookup mode. */
export type LibraryView = 'grid-s' | 'grid-m' | 'grid-l' | 'list'
const VIEWS: LibraryView[] = ['grid-s', 'grid-m', 'grid-l', 'list']
const VIEW_KEY = 'tmb-view'
let viewMemory: LibraryView = 'grid-m'

export function getLibraryView(): LibraryView {
  try {
    const v = globalThis.localStorage?.getItem(VIEW_KEY) as LibraryView | null
    if (v && VIEWS.includes(v)) return v
  } catch {
    /* private mode: fall through to this session's value */
  }
  return viewMemory
}

export function setLibraryView(v: LibraryView): void {
  viewMemory = v
  try {
    globalThis.localStorage?.setItem(VIEW_KEY, v)
  } catch {
    /* the choice still holds for this session */
  }
  globalThis.dispatchEvent?.(new Event(EVENT))
}

export const useLibraryView = (): LibraryView => useSyncExternalStore(subscribe, getLibraryView)

/** Optional Stats charts that start hidden. A per-device preference, kept in this browser. */
export type OptionalChart = 'pages' | 'trends' | 'authors'
const chartMemory: Record<OptionalChart, boolean> = { pages: false, trends: false, authors: false }
const chartKey = (c: OptionalChart) => `tmb-stats-${c}`

export function getChart(c: OptionalChart): boolean {
  try {
    const v = globalThis.localStorage?.getItem(chartKey(c))
    if (v === '1' || v === '0') return v === '1'
  } catch {
    /* private mode: fall through to this session's value */
  }
  return chartMemory[c]
}

export function setChart(c: OptionalChart, on: boolean): void {
  chartMemory[c] = on
  try {
    globalThis.localStorage?.setItem(chartKey(c), on ? '1' : '0')
  } catch {
    /* the choice still holds for this session */
  }
  globalThis.dispatchEvent?.(new Event(EVENT))
}

export const useChart = (c: OptionalChart): boolean => useSyncExternalStore(subscribe, () => getChart(c))
