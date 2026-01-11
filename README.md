# Junglex + Lazorkit Checkout Demo

Proyecto de ejemplo con Vite (React + TypeScript) que integra Lazorkit para:
- Login con passkeys y creación de smart wallet
- Transacción gasless en Solana Devnet
- Persistencia de sesión y reconexión automática

## Requisitos
- pnpm
- Node 20+

## Configuración de entorno
Crear un archivo `.env.local` basado en `.env.example`:
```
VITE_LAZORKIT_RPC_URL=https://api.devnet.solana.com
VITE_LAZORKIT_PORTAL_URL=https://portal.lazor.sh
VITE_LAZORKIT_PAYMASTER_URL=https://kora.devnet.lazorkit.com
```

## Scripts
- `pnpm dev`: ejecuta el servidor local en HTTPS (https://localhost:5173)
- `pnpm build`: compila producción
- `pnpm preview`: sirve el build

## Estructura
- `src/App.tsx`: Provider de Lazorkit y layout
- `src/components/WalletDemo.tsx`: flujo de conexión y transferencia gasless
- `src/components/common/Header.tsx`: encabezado básico reutilizado desde Junglex

## Tutoriales
- Ver `docs/tutorial-passkey.md` y `docs/tutorial-gasless.md`

## Notas
- Este proyecto está orientado al bounty “Integrate Passkey technology with Lazorkit to 10x Solana UX”.
