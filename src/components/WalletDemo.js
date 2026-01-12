import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useWallet } from '@lazorkit/wallet';
import { PayWithSolana } from './common/PayWithSolana';
export function WalletDemo() {
    const { smartWalletPubkey, isConnected, isLoading, isConnecting, error, connect, disconnect } = useWallet();
    // Dirección de ejemplo para recibir pagos (puedes cambiarla por la tuya)
    const DEMO_RECIPIENT = '7BeWr6tVa1pYgrEddekYTnQENU22bBw9H8HYJUkbrN71';
    const handleConnect = async () => {
        try {
            await connect();
        }
        catch (e) {
            console.error(e);
        }
    };
    const handleDisconnect = () => {
        disconnect();
    };
    return (_jsxs("div", { style: { display: 'flex', flexDirection: 'column', gap: 12 }, children: [!isConnected ? (_jsx("button", { onClick: handleConnect, disabled: isLoading, style: { padding: 12 }, children: isConnecting ? 'Conectando...' : 'Conectar Wallet' })) : (_jsxs(_Fragment, { children: [_jsxs("p", { children: ["Wallet: ", smartWalletPubkey?.toString().slice(0, 8), "..."] }), _jsxs("div", { style: { display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }, children: [_jsx(PayWithSolana, { label: "Checkout B\u00E1sico", amount: 0.05, currency: "SOL", recipient: DEMO_RECIPIENT }), _jsx(PayWithSolana, { label: "Checkout Stablecoin", amount: 10, currency: "USDC", recipient: DEMO_RECIPIENT })] }), _jsx("div", { style: { marginTop: '20px', display: 'flex', gap: 8 }, children: _jsx("button", { onClick: handleDisconnect, style: { padding: 12, background: '#ff6b6b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }, children: "Desconectar Wallet" }) })] })), error && _jsxs("p", { style: { color: 'red' }, children: ["Error: ", error.message] })] }));
}
