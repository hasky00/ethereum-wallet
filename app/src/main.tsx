import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { PrivyProvider } from '@privy-io/react-auth'
import './index.css'
import App from './App.tsx'
import { PRIVY_APP_ID, privyConfig } from './privy-config'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PrivyProvider appId={PRIVY_APP_ID} config={privyConfig}>
      <App />
    </PrivyProvider>
  </StrictMode>,
)
