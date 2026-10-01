import type { Lookup } from '../import/lookup'
import type { LookupMode } from '../settings'

/** What an Inbox row says about its online lookup, and the button that starts one in "ask" mode. */
export function LookupLine({ lookup, mode, run, undecided, saves }: {
  lookup: Lookup
  mode: LookupMode
  run: () => void
  undecided: boolean
  /** What a found book adds when saved, e.g. "page count and cover". */
  saves: string
}) {
  if (mode === 'off') return null
  if (lookup.state === 'idle' && mode === 'ask') {
    return <button type="button" className="btn-link" onClick={run}>Look up details online</button>
  }
  const hit = lookup.hit
  return (
    <p className="ib-lookup" role={lookup.state === 'failed' ? 'status' : undefined}>
      {lookup.state === 'loading' && 'Checking Open Library…'}
      {lookup.state === 'done' && hit && !undecided && `Found on Open Library.${saves ? ` Its ${saves} added when you save.` : ''}`}
      {lookup.state === 'done' && hit && undecided && 'Found on Open Library. Answer the question above to use it.'}
      {lookup.state === 'done' && !hit && 'No sure match on Open Library, so nothing is suggested.'}
      {lookup.state === 'failed' && 'Could not reach Open Library. You can set genres later.'}
    </p>
  )
}
