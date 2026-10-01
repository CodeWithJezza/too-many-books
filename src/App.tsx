import { useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { applyUpdate, dismissOffline, pwaState, subscribePwa } from './pwa'
import { applyQuery, defaultQuery } from './lib/filter'
import { Icon, type IconName } from './components/Icon'
import { Add } from './screens/Add'
import { EditWork } from './screens/EditWork'
import { Inbox } from './screens/Inbox'
import { Library } from './screens/Library'
import { Stats } from './screens/Stats'
import { Settings } from './screens/Settings'
import { WorkPanel } from './screens/WorkPanel'
import { buildGroups } from './lib/inbox'
import { useGoodreads, useRecords, useWorks, useWorksRaw } from './storage'

type Tab = 'library' | 'inbox' | 'stats' | 'settings' | 'add'
const TABS: { id: Exclude<Tab, 'add'>; label: string; icon: IconName }[] = [
  { id: 'library', label: 'Library', icon: 'library' },
  { id: 'inbox', label: 'Inbox', icon: 'inbox' },
  { id: 'stats', label: 'Stats', icon: 'stats' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
]

type Theme = 'light' | 'dark'
function readTheme(): Theme {
  try {
    return localStorage.getItem('tmb-theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export default function App() {
  const works = useWorks()
  const pwa = useSyncExternalStore(subscribePwa, pwaState)
  const pending = useRecords('pending')
  const rawWorks = useWorksRaw()
  const grPending = useGoodreads('pending')
  const inboxCount = useMemo(() => buildGroups(pending ?? [], rawWorks).length + (grPending?.length ?? 0), [pending, rawWorks, grPending])
  const [tab, setTab] = useState<Tab>('library')
  const [selectedId, setSelectedId] = useState<number | undefined>()
  const [editId, setEditId] = useState<number | undefined>()
  const [editDirty, setEditDirty] = useState(false)
  const [leaveTo, setLeaveTo] = useState<(() => void) | undefined>()
  const [theme, setTheme] = useState<Theme>(readTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('tmb-theme', theme)
    } catch {
      /* private mode: theme just won't persist */
    }
  }, [theme])

  // On the wide two-pane layout, open the first Work so the panel is never a blank column.
  useEffect(() => {
    if (!works?.length || selectedId !== undefined) return
    if (window.matchMedia('(min-width: 1100px)').matches) setSelectedId(applyQuery(works, defaultQuery)[0]?.id)
  }, [works, selectedId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !window.matchMedia('(min-width: 1100px)').matches && setSelectedId(undefined)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  /** Every navigation goes through here so an unsaved edit is never dropped silently. */
  function go(action: () => void) {
    if (editId !== undefined && editDirty) setLeaveTo(() => action)
    else { setEditId(undefined); action() }
  }

  const sample = !!works?.some((w) => w.synthetic)
  const panelOpen = selectedId !== undefined

  return (
    <div className="app" data-panel={panelOpen ? 'open' : 'closed'} data-tab={tab === 'library' && editId === undefined ? 'library' : 'other'}>
      <nav className="side" aria-label="Main">
        <div className="brand"><i />Too Many<br />Books</div>
        <ul>
          {TABS.map((t) => (
            <li key={t.id}>
              <button type="button" className="nav-item" aria-current={tab === t.id && editId === undefined ? 'page' : undefined} onClick={() => go(() => setTab(t.id))}>
                <Icon name={t.icon} />
                <span className="nav-label">{t.label}</span>
                {t.id === 'library' && works && <span className="nav-count">{works.length}</span>}
                {t.id === 'inbox' && inboxCount > 0 && <span className="nav-badge" aria-label={`${inboxCount} to review`}>{inboxCount}</span>}
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="add" onClick={() => go(() => setTab('add'))} aria-current={tab === 'add' && editId === undefined ? 'page' : undefined}>
          <Icon name="plus" size={18} /><span className="add-full">Add a book</span><span className="add-short">Add</span>
        </button>
        <button type="button" className="theme" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
          <span>{theme === 'dark' ? 'Light theme' : 'Dark theme'}</span>
        </button>
      </nav>

      {editId !== undefined && (
        <EditWork
          id={editId}
          onClose={() => setEditId(undefined)}
          onDeleted={() => { setEditId(undefined); setSelectedId(undefined) }}
          onDirty={setEditDirty}
          leaveRequested={leaveTo !== undefined}
          onLeaveAnswer={(discard) => { const next = leaveTo; setLeaveTo(undefined); if (discard) { setEditId(undefined); setEditDirty(false); next?.() } }}
        />
      )}
      {editId === undefined && tab === 'library' && (
        <>
          <Library works={works} selectedId={selectedId} onSelect={setSelectedId} sample={sample} onOpenSettings={() => setTab('settings')} />
          <WorkPanel id={selectedId} onClose={() => setSelectedId(undefined)} onEdit={setEditId} />
        </>
      )}
      {editId === undefined && tab === 'library' && panelOpen && <div className="scrim" onClick={() => setSelectedId(undefined)} aria-hidden="true" />}
      {editId === undefined && tab === 'inbox' && <Inbox />}
      {editId === undefined && tab === 'stats' && <Stats />}
      {editId === undefined && tab === 'settings' && <Settings />}
      {editId === undefined && tab === 'add' && <Add onSaved={(id) => { setSelectedId(id); setTab('library') }} />}
      {pwa.includes('u') && (
        <p className="toast" role="status">A new version is ready. <button type="button" className="btn-link inline" onClick={() => void applyUpdate()}>Reload</button></p>
      )}
      {pwa.includes('o') && !pwa.includes('u') && (
        <p className="toast" role="status">Ready to work offline. <button type="button" className="btn-link inline" onClick={dismissOffline}>Got it</button></p>
      )}
    </div>
  )
}
