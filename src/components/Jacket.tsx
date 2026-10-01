import { useState } from 'react'
import { inkOf, labelOf } from '../lib/genres'
import type { WorkSummary } from '../types'

/**
 * A three-band paperback jacket. Genre sets the ink of the top and foot bands;
 * the middle stays clean so a real cover from Open Library can replace it later.
 */
export function Jacket({ work, selected, onClick, size = 'grid' }: {
  work: WorkSummary
  selected?: boolean
  onClick?: () => void
  size?: 'grid' | 'panel' | 'mini' | 'preview'
}) {
  const ink = inkOf(work.genres)
  const [coverFailed, setCoverFailed] = useState(false)
  const cover = work.coverUrl && !coverFailed ? work.coverUrl : undefined
  const body = (
    <>
      <span className="band band-top">{work.author}</span>
      <span className={`jacket-title${cover ? ' has-cover' : ''}`}>
        {cover && <img src={cover} alt="" loading="lazy" onError={() => setCoverFailed(true)} />}
        {work.title}
        {work.series && <small>{work.series.name}</small>}
      </span>
      <span className="band band-foot">{work.series ? `${labelOf(work.genres)} · ${work.series.position}` : labelOf(work.genres)}</span>
    </>
  )
  const cls = `jacket jacket-${size}${selected ? ' is-selected' : ''}`
  const longest = Math.max(1, ...work.title.split(/\s+/).map((w) => w.length))
  const style = { ['--ink-genre' as string]: ink, ['--wl' as string]: longest }
  if (!onClick) return <div className={cls} style={style} role="img" aria-label={`${work.title} by ${work.author}`}>{body}</div>
  return (
    <button type="button" className={cls} style={style} onClick={onClick} aria-pressed={selected} aria-label={`${work.title} by ${work.author}`}>
      {body}
    </button>
  )
}
