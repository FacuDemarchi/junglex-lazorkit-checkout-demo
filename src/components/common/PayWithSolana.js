import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useWallet } from '@lazorkit/wallet';
import { SystemProgram, PublicKey, Transaction, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { createTransferInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
// USDC Devnet Mint
const USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');
export function PayWithSolana({ label, amount, currency, recipient }) {
    const { smartWalletPubkey, signAndSendTransaction, isSigning } = useWallet();
    const [status, setStatus] = useState('idle');
    const [txSig, setTxSig] = useState(null);
    const handlePay = async () => {
        if (!smartWalletPubkey)
            return;
        setStatus('processing');
        setTxSig(null);
        try {
            const recipientPubkey = new PublicKey(recipient);
            const transaction = new Transaction();
            if (currency === 'SOL') {
                transaction.add(SystemProgram.transfer({
                    fromPubkey: smartWalletPubkey,
                    toPubkey: recipientPubkey,
                    lamports: Math.floor(amount * LAMPORTS_PER_SOL),
                }));
            }
            else if (currency === 'USDC') {
                // Calcular ATAs
                const senderAta = await getAssociatedTokenAddress(USDC_MINT, smartWalletPubkey);
                const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);
                // Nota: En una app real, deberías verificar si recipientAta existe y crearla si no.
                // Aquí asumimos que existe o que el error se manejará.
                // USDC tiene 6 decimales
                const amountInBaseUnits = Math.floor(amount * 1000000);
                transaction.add(createTransferInstruction(senderAta, recipientAta, smartWalletPubkey, amountInBaseUnits, [], TOKEN_PROGRAM_ID));
            }
            const signature = await signAndSendTransaction(transaction);
            setTxSig(signature);
            setStatus('success');
        }
        catch (error) {
            console.error('Payment failed:', error);
            setStatus('error');
        }
    };
    return (_jsxs("div", { style: { border: '1px solid #ccc', padding: '16px', borderRadius: '8px', marginTop: '12px' }, children: [_jsx("h3", { children: label }), _jsxs("p", { children: ["Monto: ", _jsxs("strong", { children: [amount, " ", currency] })] }), _jsxs("p", { style: { fontSize: '0.8em', color: '#666' }, children: ["Destino: ", recipient.slice(0, 6), "...", recipient.slice(-4)] }), _jsx("button", { onClick: handlePay, disabled: isSigning || status === 'processing', style: {
                    marginTop: '8px',
                    width: '100%',
                    padding: '10px',
                    backgroundColor: currency === 'USDC' ? '#2775CA' : '#9945FF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isSigning ? 'not-allowed' : 'pointer'
                }, children: status === 'processing' ? 'Procesando...' : `Pagar con ${currency}` }), status === 'success' && txSig && (_jsxs("div", { style: { marginTop: '8px', color: 'green', fontSize: '0.9em' }, children: ["\u2705 \u00A1Pago enviado!", _jsx("br", {}), _jsx("a", { href: `https://explorer.solana.com/tx/${txSig}?cluster=devnet`, target: "_blank", rel: "noopener noreferrer", children: "Ver transacci\u00F3n" })] })), status === 'error' && (_jsx("div", { style: { marginTop: '8px', color: 'red', fontSize: '0.9em' }, children: "\u274C Error al enviar el pago. Revisa la consola." }))] }));
}
