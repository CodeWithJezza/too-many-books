/**
 * Tracks how much has changed since the last backup, so the app can prompt for one
 * (ADR 0005). Best effort and per device: it lives in localStorage, and losing it only
 * means a later or earlier reminder, never lost data.
 */
const KEY_AT = 'tmb-last-backup'
const KEY_N = 'tmb-changes'
const EVENT = 'tmb-changes'

let paused = 0

const read = (k: string): number => {
  try {
    return Number(globalThis.localStorage?.getItem(k)) || 0
  } catch {
    return 0
  }
}
const write = (k: string, v: number) => {
  try {
    globalThis.localStorage?.setItem(k, String(v))
  } catch {
    /* private mode */
  }
  globalThis.dispatchEvent?.(new Event(EVENT))
}

export const bumpChanges = () => {
  if (!paused) write(KEY_N, read(KEY_N) + 1)
}
export const changesSinceBackup = () => read(KEY_N)
export const lastBackupAt = (): number | undefined => read(KEY_AT) || undefined
export function markBackedUp(at = Date.now()) {
  write(KEY_AT, at)
  write(KEY_N, 0)
}
/** Runs a bulk write (seeding, restoring, importing a backup) without counting it as reader changes. */
export async function untracked<T>(fn: () => Promise<T>): Promise<T> {
  paused++
  try {
    return await fn()
  } finally {
    paused--
  }
}
export function subscribeChanges(cb: () => void): () => void {
  globalThis.addEventListener?.(EVENT, cb)
  return () => globalThis.removeEventListener?.(EVENT, cb)
}
/** Time to ask: 15 or more changes since the last backup, or real books and no backup yet. */
export function shouldPromptBackup(hasRealBooks: boolean): boolean {
  const n = changesSinceBackup()
  return n >= 15 || (hasRealBooks && !lastBackupAt() && n > 0)
}
