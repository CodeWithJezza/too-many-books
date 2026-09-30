import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/jost'
import './styles.css'
import App from './App'
import { initPwa } from './pwa'
import { requestPersistence, seedIfEmpty } from './storage'

initPwa()
void requestPersistence()
void seedIfEmpty().finally(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
