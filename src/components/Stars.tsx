import { useId } from 'react'

const STAR = 'M12 2.8l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2 6.3 20.3l1.2-6.4L2.8 9.5l6.4-.8z'

/** Half-star ratings. `undefined` renders "Unrated", which is not a low score. */
export function Stars({ value, size = 16 }: { value?: number; size?: number }) {
  const uid = useId()
  if (value === undefined) return <span className="unrated">Unrated</span>
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const fill = Math.max(0, Math.min(1, value - i))
        const id = `${uid}-${i}`
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id={id}><rect x="0" y="0" width={24 * fill} height="24" /></clipPath>
            </defs>
            <path d={STAR} className="star-off" />
            <path d={STAR} className="star-on" clipPath={`url(#${id})`} />
          </svg>
        )
      })}
    </span>
  )
}
