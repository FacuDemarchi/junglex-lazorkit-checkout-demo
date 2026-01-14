import { useMemo } from 'react'
import { LazorkitProvider } from '@lazorkit/wallet'
import { WalletDemo } from './components/WalletDemo'
import { Header } from './components/common/Header'

const rpcUrl = import.meta.env.VITE_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com'
const portalUrl = import.meta.env.VITE_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'
// const paymasterUrl = import.meta.env.VITE_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com'
// const paymasterApiKey = import.meta.env.VITE_LAZORKIT_PAYMASTER_API_KEY

export default function App() {
  // Use a stable object for paymasterConfig to prevent infinite render loops in the SDK
  // We leave it empty to disable the Paymaster and reduce transaction size
  // @ts-ignore - We intentionally pass an empty object to disable paymaster, casting to any to bypass TS check
  const paymasterConfig = useMemo(() => ({} as any), [])

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
