import { LazorkitProvider } from '@lazorkit/wallet'
import { WalletDemo } from './components/WalletDemo'
import { Header } from './components/common/Header'

const rpcUrl = import.meta.env.VITE_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com'
const portalUrl = import.meta.env.VITE_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'
// const paymasterUrl = import.meta.env.VITE_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com'
// const paymasterApiKey = import.meta.env.VITE_LAZORKIT_PAYMASTER_API_KEY

export default function App() {
/*
  const paymasterConfig = useMemo(() => ({ 
    paymasterUrl, 
    apiKey: paymasterApiKey 
  }), [])
*/

  return (
    <LazorkitProvider
      rpcUrl={rpcUrl}
      portalUrl={portalUrl}
      // paymasterConfig={paymasterConfig} // Disable Paymaster to reduce transaction size
    >
      <Header title="Junglex + Lazorkit Demo" />
      <div style={{ maxWidth: 640, margin: '24px auto', padding: 16 }}>
        <WalletDemo />
      </div>
    </LazorkitProvider>
  )
}
