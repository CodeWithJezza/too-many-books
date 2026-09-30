import { registerSW } from 'virtual:pwa-register'

/**
 * Offline support and updates. A new version waits until the reader taps Reload, so an
 * unsaved form is never thrown away. The service worker never touches IndexedDB.
 */
type Listener = () => void
const listeners = new Set<Listener>()
let needRefresh = false
let offlineReady = false
let update: ((reload?: boolean) => Promise<void>) | undefined

export function initPwa() {
  // Dev only: lets the update and offline toasts be rendered without publishing a new version.
  if (import.meta.env.DEV) {
    ;(window as unknown as { __pwaDebug: unknown }).__pwaDebug = {
      needRefresh() { needRefresh = true; listeners.forEach((l) => l()) },
      offlineReady() { offlineReady = true; listeners.forEach((l) => l()) },
    }
  }
  update = registerSW({
    onNeedRefresh() { needRefresh = true; listeners.forEach((l) => l()) },
    onOfflineReady() { offlineReady = true; listeners.forEach((l) => l()) },
  })
}
export const subscribePwa = (l: Listener) => { listeners.add(l); return () => void listeners.delete(l) }
export const pwaState = () => `${needRefresh ? 'u' : ''}${offlineReady ? 'o' : ''}`
export const applyUpdate = () => update?.(true)
export const dismissOffline = () => { offlineReady = false; listeners.forEach((l) => l()) }

/** iPhone, iPad, or iPadOS pretending to be a Mac; these install through Safari's Share menu. */
export function isAppleTouch(): boolean {
  const ua = navigator.userAgent
  return /iPad|iPhone/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
}

/** True when running from the Home Screen or an installed window. */
export function isInstalled(): boolean {
  return window.matchMedia?.('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true
}
