import { useState, useMemo } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, LAMPORTS_PER_SOL, Connection } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';

// USDC Devnet Mint
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Address Lookup Table for optimization (System, Sysvars, Token Programs)
const ALT_ADDRESS = '4CM61MFhHssmGQny9df26DdyVGgnrpMPZn1cTU7zYdi1';

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

  const rpcUrl = import.meta.env.VITE_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com';
  const connection = useMemo(() => new Connection(rpcUrl, 'confirmed'), [rpcUrl]);

  const ensureSolBalance = async (pubkey: PublicKey, requiredLamports: number) => {
    const feeBuffer = 50_000;
    let current = await connection.getBalance(pubkey, 'confirmed');
    const target = requiredLamports + feeBuffer;
    let attempts = 0;
    while (current < target && attempts < 3) {
      const toAirdrop = Math.min(target - current, 1_000_000_000); // máx 1 SOL
      const sig = await connection.requestAirdrop(pubkey, toAirdrop);
      await connection.confirmTransaction(sig, 'finalized');
      current = await connection.getBalance(pubkey, 'confirmed');
      attempts++;
    }
    if (current < target) {
      throw new Error('No se pudo fondear la smart wallet en Devnet');
    }
  };

  const handlePay = async () => {
    console.log('Botón de pago presionado. Wallet:', smartWalletPubkey?.toString());
    if (!smartWalletPubkey) return;
    setStatus('processing');
    setTxSig(null);

    try {
      console.log('Iniciando proceso de pago...');
      
      // Load ALT for optimization
      console.log('Loading ALT:', ALT_ADDRESS);
      const altPubkey = new PublicKey(ALT_ADDRESS);
      let altAccount;
      try {
        const altResponse = await connection.getAddressLookupTable(altPubkey);
        altAccount = altResponse.value;
        console.log('ALT Loaded:', altAccount ? 'Found' : 'Not Found');
      } catch (e) {
        console.warn('Failed to load ALT:', e);
      }

      const recipientPubkey = new PublicKey(recipient);
      const instructions: any[] = [];

      if (currency === 'SOL') {
        const lamports = Math.floor(amount * LAMPORTS_PER_SOL);
        console.log(`Verificando balance de SOL para enviar ${lamports} lamports...`);
        await ensureSolBalance(smartWalletPubkey, lamports);
        console.log('Balance verificado/airdrop completado.');
        
        instructions.push(
          SystemProgram.transfer({
            fromPubkey: smartWalletPubkey,
            toPubkey: recipientPubkey,
            lamports,
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

        instructions.push(
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

      // 2. Sign and Send
      // Match official documentation pattern
      const signature = await signAndSendTransaction({
        instructions,
        transactionOptions: {
          // feeToken: 'USDC' // Optional: Pay gas in USDC
          addressLookupTableAccounts: altAccount ? [altAccount] : [],
        }
      });

      console.log('Transaction confirmed:', signature);
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
