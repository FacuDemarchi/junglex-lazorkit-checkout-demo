import { useEffect, useMemo } from 'react'
import { LazorkitProvider } from '@lazorkit/wallet'
import { WalletDemo } from './components/WalletDemo'
import { Header } from './components/common/Header'

const rpcUrl = import.meta.env.VITE_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com'
const portalUrl = import.meta.env.VITE_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'
const paymasterUrl = import.meta.env.VITE_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com'

export default function App() {
  const paymasterConfig = useMemo(() => ({ paymasterUrl }), [])

  useEffect(() => {
    // Garantizar Buffer polyfill
    if (typeof window !== 'undefined' && !(window as any).Buffer) {
      import('buffer').then(({ Buffer }) => ((window as any).Buffer = Buffer))
    }
  }, [])

  return (
    <LazorkitProvider
      rpcUrl={rpcUrl}
      portalUrl={portalUrl}
      paymasterConfig={paymasterConfig}
    >
      <Header title="Junglex + Lazorkit Demo" />
      <div style={{ maxWidth: 640, margin: '24px auto', padding: 16 }}>
        <WalletDemo />
      </div>
    </LazorkitProvider>
  )
}
