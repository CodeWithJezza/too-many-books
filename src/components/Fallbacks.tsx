import { Component, type ReactNode } from 'react'

function Shell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="library fallback">
      <h1>{title}</h1>
      <div className="state">{children}</div>
    </main>
  )
}

/** Shown when the browser will not open on-device storage (private browsing, blocked site data, a full disk). */
export function StorageUnavailable({ detail }: { detail?: string }) {
  return (
    <Shell title="Your library can't open">
      <p className="state-title">This browser is blocking storage</p>
      <p>Too Many Books keeps your library on this device, so it needs the browser's site storage. Private browsing, a blocked-cookies setting or a full disk can turn it off. Nothing was lost.</p>
      <p>Open the app in a normal window, allow site data for this address, then try again.</p>
      {detail && <p className="hint">Browser said: {detail}</p>}
      <button type="button" className="btn-primary" onClick={() => location.reload()}>Try again</button>
    </Shell>
  )
}

/** Catches a crash in any screen so the whole app does not turn into a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() {
    return { failed: true }
  }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <Shell title="Something went wrong">
        <p className="state-title">That screen crashed</p>
        <p>Your library is stored on this device and was not changed. Reloading usually fixes it. If it keeps happening, tell me what you were doing.</p>
        <button type="button" className="btn-primary" onClick={() => location.reload()}>Reload</button>
      </Shell>
    )
  }
}
