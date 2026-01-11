import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// USDC Devnet Mint
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

interface PayWithSolanaProps {
  label: string;
  amount: number; // Cantidad en unidades naturales (ej: 0.1 SOL, 10 USDC)
  currency: 'SOL' | 'USDC';
  recipient: string;
}

export function PayWithSolana({ label, amount, currency, recipient }: PayWithSolanaProps) {
  const { smartWalletPubkey, signAndSendTransaction, isSigning } = useWallet();
  const [status, setStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [txSig, setTxSig] = useState<string | null>(null);

  const handlePay = async () => {
    if (!smartWalletPubkey) return;
    setStatus('processing');
    setTxSig(null);

    try {
      const recipientPubkey = new PublicKey(recipient);
      const transaction = new Transaction();

      if (currency === 'SOL') {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: smartWalletPubkey,
            toPubkey: recipientPubkey,
            lamports: Math.floor(amount * LAMPORTS_PER_SOL),
          })
        );
      } else if (currency === 'USDC') {
        // Calcular ATAs
        const senderAta = await getAssociatedTokenAddress(USDC_MINT, smartWalletPubkey);
        const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

        // Nota: En una app real, deberías verificar si recipientAta existe y crearla si no.
        // Aquí asumimos que existe o que el error se manejará.
        
        // USDC tiene 6 decimales
        const amountInBaseUnits = Math.floor(amount * 1_000_000);

        transaction.add(
          createTransferInstruction(
            senderAta,
            recipientAta,
            smartWalletPubkey,
            amountInBaseUnits,
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }

      const signature = await signAndSendTransaction(transaction);
      setTxSig(signature);
      setStatus('success');
    } catch (error) {
      console.error('Payment failed:', error);
      setStatus('error');
    }
  };

  return (
    <div style={{ border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginTop: '12px' }}>
      <h3>{label}</h3>
      <p>
        Monto: <strong>{amount} {currency}</strong>
      </p>
      <p style={{ fontSize: '0.8em', color: '#666' }}>Destino: {recipient.slice(0, 6)}...{recipient.slice(-4)}</p>
      
      <button 
        onClick={handlePay} 
        disabled={isSigning || status === 'processing'}
        style={{ 
          marginTop: '8px',
          width: '100%',
          padding: '10px',
          backgroundColor: currency === 'USDC' ? '#2775CA' : '#9945FF',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: isSigning ? 'not-allowed' : 'pointer'
        }}
      >
        {status === 'processing' ? 'Procesando...' : `Pagar con ${currency}`}
      </button>

      {status === 'success' && txSig && (
        <div style={{ marginTop: '8px', color: 'green', fontSize: '0.9em' }}>
          ✅ ¡Pago enviado! 
          <br />
          <a 
            href={`https://explorer.solana.com/tx/${txSig}?cluster=devnet`} 
            target="_blank" 
            rel="noopener noreferrer"
          >
            Ver transacción
          </a>
        </div>
      )}
      
      {status === 'error' && (
        <div style={{ marginTop: '8px', color: 'red', fontSize: '0.9em' }}>
          ❌ Error al enviar el pago. Revisa la consola.
        </div>
      )}
    </div>
  );
}
