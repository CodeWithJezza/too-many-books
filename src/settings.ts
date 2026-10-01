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
