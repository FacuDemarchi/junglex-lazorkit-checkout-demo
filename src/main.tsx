import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

function BufferPolyfill() {
  useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).Buffer) {
      import('buffer').then(({ Buffer }) => {
        (window as any).Buffer = Buffer
      })
    }
  }, [])
  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BufferPolyfill />
    <App />
  </StrictMode>
)
