import { useWallet } from '@lazorkit/wallet'
import { PayWithSolana } from './common/PayWithSolana'

export function WalletDemo() {
  const {
    smartWalletPubkey,
    isConnected,
    isLoading,
    isConnecting,
    error,
    connect,
    disconnect
  } = useWallet()

  // Dirección de ejemplo para recibir pagos (puedes cambiarla por la tuya)
  const DEMO_RECIPIENT = '7BeWr6tVa1pYgrEddekYTnQENU22bBw9H8HYJUkbrN71';

  const handleConnect = async () => {
    try {
      await connect()
    } catch (e) {
      console.error(e)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!isConnected ? (
        <button onClick={handleConnect} disabled={isLoading} style={{ padding: 12 }}>
          {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
        </button>
      ) : (
        <>
          <p>Wallet: {smartWalletPubkey?.toString().slice(0, 8)}...</p>
          
          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            {/* Componente Reutilizable: Pago en SOL */}
            <PayWithSolana 
              label="Checkout Básico"
              amount={0.05}
              currency="SOL"
              recipient={DEMO_RECIPIENT}
            />

            {/* Componente Reutilizable: Pago en USDC */}
            <PayWithSolana 
              label="Checkout Stablecoin"
              amount={10}
              currency="USDC"
              recipient={DEMO_RECIPIENT}
            />
          </div>

          <div style={{ marginTop: '20px', display: 'flex', gap: 8 }}>
            <button onClick={handleDisconnect} style={{ padding: 12, background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
              Desconectar Wallet
            </button>
          </div>
        </>
      )}
      {error && <p style={{ color: 'red' }}>Error: {error.message}</p>}
    </div>
  )
}
