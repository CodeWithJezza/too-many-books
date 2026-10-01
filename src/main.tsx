import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/jost'
import './styles.css'
import App from './App'
import { ErrorBoundary, StorageUnavailable } from './components/Fallbacks'
import { initPwa } from './pwa'
import { db, requestPersistence, seedIfEmpty } from './storage'

initPwa()
void requestPersistence()

async function boot() {
  const root = createRoot(document.getElementById('root')!)
  try {
    await db.open()
    await seedIfEmpty()
  } catch (e) {
    root.render(<StorageUnavailable detail={e instanceof Error ? e.message : undefined} />)
    return
  }
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
void boot()
