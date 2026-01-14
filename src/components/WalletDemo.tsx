import { useWallet } from '@lazorkit/wallet'
import { useEffect, useState, useMemo } from 'react'
import { Connection } from '@solana/web3.js'
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
  const [balance, setBalance] = useState<number | null>(null)
  const rpcUrl = import.meta.env.VITE_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com'
  const portalUrl = import.meta.env.VITE_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh'
  const connection = useMemo(() => new Connection(rpcUrl, 'confirmed'), [rpcUrl])

  const handleConnect = async () => {
    try {
      await connect({ feeMode: 'user' })
    } catch (e) {
      console.error(e)
    }
  }

  const handleDisconnect = () => {
    disconnect()
  }

  const refreshBalance = async () => {
    if (!smartWalletPubkey) return
    const lamports = await connection.getBalance(smartWalletPubkey, 'confirmed')
    setBalance(lamports / 1_000_000_000)
  }

  useEffect(() => {
    refreshBalance()
  }, [smartWalletPubkey])

  const resetCredentials = async () => {
    if (confirm('¿Seguro que quieres resetear las credenciales? Esto desconectará la wallet y borrará los datos locales.')) {
      try {
        await disconnect()
      } catch {}
      try {
        localStorage.clear() // Borrar todo para asegurar
      } catch {}
      window.location.reload() // Recargar para limpiar estado en memoria
    }
  }
  
  const openPortalInTab = () => {
    const url = `${portalUrl}?action=connect`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {!isConnected ? (
        <button onClick={handleConnect} disabled={isLoading} style={{ padding: 12 }}>
          {isConnecting ? 'Conectando...' : 'Conectar Wallet'}
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <p style={{ margin: 0 }}>Wallet: {smartWalletPubkey?.toString().slice(0, 8)}...</p>
            <button 
              onClick={() => {
                if (smartWalletPubkey) {
                  navigator.clipboard.writeText(smartWalletPubkey.toString())
                  alert('Address copiada al portapapeles')
                }
              }}
              style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
            >
              Copiar
            </button>
          </div>
          <p>Balance (SOL): {balance !== null ? balance.toFixed(6) : '...'}</p>
          <button onClick={refreshBalance} style={{ width: 160, padding: 8 }}>Refrescar Balance</button>
          <button onClick={resetCredentials} style={{ width: 200, padding: 8 }}>Reset Credenciales</button>
          <button onClick={openPortalInTab} style={{ width: 220, padding: 8 }}>Abrir Portal en pestaña</button>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
            {/* Componente Reutilizable: Pago en SOL */}
            <PayWithSolana 
              label="Checkout Básico"
              amount={0.001}
              currency="SOL"
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
