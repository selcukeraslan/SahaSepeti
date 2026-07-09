import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/inter/index.css'
import '@/styles/global.css'
import { App } from '@/app/App'
import { ConfigError } from '@/app/ConfigError'
import { supabaseConfigError } from '@/lib/supabase'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root elementi bulunamadı')
}

createRoot(rootElement).render(
  <StrictMode>
    {supabaseConfigError ? <ConfigError message={supabaseConfigError} /> : <App />}
  </StrictMode>,
)
