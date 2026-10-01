import { useMemo } from 'react'
import { Icon } from '../components/Icon'
import { buildSeries, seriesNameKey, type SeriesEntry } from '../lib/series'
import { useReadingData } from '../storage'

/**
 * A Series as a view inside Library (BUILD_BRIEF): the volumes the library holds, in order, with
 * the ones read marked and whole-number gaps shown as gaps. It never invents a volume past the
 * highest one held, and a gap can be filled through the Add flow.
 */
export function SeriesPanel({ name, onClose, onSelect, onAddGap, onShowInLibrary }: {
  name: string
  onClose: () => void
  onSelect: (id: number) => void
  onAddGap: (series: { name: string; position: number }) => void
  onShowInLibrary: (name: string) => void
}) {
  const data = useReadingData()
  const info = useMemo(() => buildSeries(data?.works ?? [], data?.readings ?? []).find((s) => s.key === seriesNameKey(name)), [data, name])
  const latest = useMemo(() => {
    const m = new Map<number, string>()
    for (const r of data?.readings ?? []) m.set(r.workId, r.status)
    return m
  }, [data])

  const status = (e: SeriesEntry): string => {
    if (e.read) return 'Read'
    const s = latest.get(e.work!.id!)
    if (s === 'reading') return 'Reading now'
    if (s === 'dnf') return 'DNF'
    return e.work!.shelves.includes('want') ? 'Want to read' : 'Not read'
  }

  return (
    <aside className="panel" aria-label="Series">
      <button type="button" className="panel-close" onClick={onClose} aria-label="Close series">
        <Icon name="back" />
        <span>Library</span>
      </button>
      {!info ? (
        <div className="panel-empty">
          <p className="panel-empty-title">No books in this series</p>
          <p>It is gone from your library.</p>
        </div>
      ) : (
        <div className="panel-body">
          <header>
            <h2>{info.name}</h2>
            <p className="work-meta">
              {info.read} of {info.owned + info.gaps} {info.owned + info.gaps === 1 ? 'volume' : 'volumes'} read, up to volume {info.highest}
            </p>
            <button type="button" className="btn-quiet edit-btn" onClick={() => onShowInLibrary(info.name)}>Show in Library</button>
          </header>
          <ol className="rows series-rows">
            {info.entries.map((e) => (
              <li key={e.work?.id ?? `gap-${e.position}`} className={`row series-row${e.gap ? ' is-gap' : ''}`}>
                <span className="series-pos">#{e.position}</span>
                {e.gap ? (
                  <>
                    <span className="series-gap">Not in your library</span>
                    <button type="button" className="btn-link" onClick={() => onAddGap({ name: info.name, position: e.position })} aria-label={`Add volume ${e.position}`}>Add</button>
                  </>
                ) : (
                  <button type="button" className="series-open" onClick={() => onSelect(e.work!.id!)}>
                    <span className="row-title">{e.work!.title}</span>
                    <span className={`row-tag${e.read ? ' is-read' : ''}`}>{status(e)}</span>
                  </button>
                )}
              </li>
            ))}
          </ol>
          <p className="hint">Gaps are whole-number volumes between 1 and {Math.floor(info.highest)} that are not in your library. The app does not know how long the series really is.</p>
        </div>
      )}
    </aside>
  )
}
