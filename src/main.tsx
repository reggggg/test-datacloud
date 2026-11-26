import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import '@fontsource-variable/inter'
import App from './App'
import { AppErrorBoundary } from './components/AppErrorBoundary'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <App />
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
)
