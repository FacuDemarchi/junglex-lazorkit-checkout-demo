import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { StrictMode, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
function BufferPolyfill() {
    useEffect(() => {
        if (typeof window !== 'undefined' && !window.Buffer) {
            import('buffer').then(({ Buffer }) => {
                window.Buffer = Buffer;
            });
        }
    }, []);
    return null;
}
createRoot(document.getElementById('root')).render(_jsxs(StrictMode, { children: [_jsx(BufferPolyfill, {}), _jsx(App, {})] }));
