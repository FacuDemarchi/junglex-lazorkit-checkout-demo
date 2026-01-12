import { jsx as _jsx } from "react/jsx-runtime";
export function Header({ title }) {
    return (_jsx("header", { style: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            borderBottom: '1px solid #eee'
        }, children: _jsx("h1", { style: { margin: 0, fontSize: 20 }, children: title }) }));
}
