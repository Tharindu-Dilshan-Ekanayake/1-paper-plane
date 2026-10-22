import '@fontsource/fredoka-one/400.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.jsx'
import BloxityProvider from './bloxity/BloxityProvider.jsx'
import { installDebugHooks } from './debug'
import './index.css'

installDebugHooks()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* Slug comes from VITE_GAME_SLUG in client/.env — see .env.example. */}
    <BloxityProvider gameSlug={import.meta.env.VITE_GAME_SLUG}>
      <App />
    </BloxityProvider>
  </StrictMode>,
)
