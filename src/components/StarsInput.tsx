const STAR = 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z'

import { useId } from 'react'

/** Half-star picker: each star has a left-half and right-half button. Optional, so it can be cleared. */
export function StarsInput({ value, onChange }: { value?: number; onChange: (v: number | undefined) => void }) {
  // Each instance needs its own clip ids, or every later star row copies the first one.
  const uid = useId()
  return (
    <div className="stars-input">
      <div className="stars-pick" role="group" aria-label="Rating">
        {[0, 1, 2, 3, 4].map((i) => {
          const fill = Math.max(0, Math.min(1, (value ?? 0) - i))
          return (
            <span key={i} className="star-slot">
              <svg width="36" height="36" viewBox="0 0 24 24" aria-hidden="true">
                <defs><clipPath id={`${uid}-si-${i}`}><rect width={24 * fill} height="24" /></clipPath></defs>
                <path d={STAR} className="star-off" />
                <path d={STAR} className="star-on" clipPath={`url(#${uid}-si-${i})`} />
              </svg>
              {[0.5, 1].map((half) => {
                const v = i + half
                return (
                  <button key={half} type="button" className={`star-half star-half-${half === 0.5 ? 'l' : 'r'}`} aria-label={`${v} ${v === 1 ? 'star' : 'stars'}`} aria-pressed={value === v} onClick={() => onChange(value === v ? undefined : v)} />
                )
              })}
            </span>
          )
        })}
      </div>
      <span className="stars-side">
        <span className="stars-readout">{value === undefined ? 'Unrated' : `${value} of 5`}</span>
        {value !== undefined && <button type="button" className="btn-link" onClick={() => onChange(undefined)}>Clear</button>}
      </span>
    </div>
  )
}
