import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useMemo } from 'react';
import { LazorkitProvider } from '@lazorkit/wallet';
import { WalletDemo } from './components/WalletDemo';
import { Header } from './components/common/Header';
const rpcUrl = import.meta.env.VITE_LAZORKIT_RPC_URL || 'https://api.devnet.solana.com';
const portalUrl = import.meta.env.VITE_LAZORKIT_PORTAL_URL || 'https://portal.lazor.sh';
const paymasterUrl = import.meta.env.VITE_LAZORKIT_PAYMASTER_URL || 'https://kora.devnet.lazorkit.com';
export default function App() {
    const paymasterConfig = useMemo(() => ({ paymasterUrl }), []);
    useEffect(() => {
        // Garantizar Buffer polyfill
        if (typeof window !== 'undefined' && !window.Buffer) {
            import('buffer').then(({ Buffer }) => (window.Buffer = Buffer));
        }
    }, []);
    return (_jsxs(LazorkitProvider, { rpcUrl: rpcUrl, portalUrl: portalUrl, paymasterConfig: paymasterConfig, children: [_jsx(Header, { title: "Junglex + Lazorkit Demo" }), _jsx("div", { style: { maxWidth: 640, margin: '24px auto', padding: 16 }, children: _jsx(WalletDemo, {}) })] }));
}
