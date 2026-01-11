## Objetivo
- Crear un repo de ejemplo Vite (React + TypeScript) que demuestre integración de Lazorkit: login con passkeys, smart wallet y transacción gasless en Solana Devnet.
- Reutilizar componentes y estilos de tu proyecto Junglex donde aporten valor (Header, CryptoPayment, AllCoinDropdown, etc.), simplificados para el demo.
- Cumplir entregables del bounty: repo limpio, README claro, al menos 2 tutoriales paso a paso y demo funcional.

## Alcance y Entregables
- Proyecto Vite React + TS con pnpm.
- Integración Lazorkit Provider y hook de wallet.
- Flujo de login con passkey y creación de smart wallet.
- Transacción gasless (transferencia de SOL/USDC en Devnet) usando paymaster.
- Persistencia de sesión y reconexión automática.
- UI mínima: botón “Conectar”, estado de wallet, transferencia, desconectar.
- README con instalación, entorno y ejecución.
- 2 tutoriales en markdown:
  - “Cómo crear una wallet con passkey y conectar”
  - “Cómo enviar una transacción gasless (SOL/USDC) en Devnet”

## Referencias Técnicas
- Junglex: stack con React/Next y Supabase; reutilizaremos componentes de `frontend/src/components/common` y `client` donde aplique (ajustados a Vite y TS).
- Lazorkit SDK web: `@lazorkit/wallet` provee Provider y `useWallet` para login, passkeys y gasless.
- Devnet: `rpcUrl=https://api.devnet.solana.com`, `portalUrl=https://portal.lazor.sh`, `paymasterUrl` provisto por Lazorkit.

## Plan de Implementación
1. Inicializar proyecto base
- Crear Vite React + TS con pnpm.
- Configurar eslint/prettier según convenciones simples.
- Añadir `.env.example` con variables LAZORKIT_RPC_URL, LAZORKIT_PORTAL_URL, LAZORKIT_PAYMASTER_URL.

2. Integrar Lazorkit
- Instalar `@lazorkit/wallet` y `@solana/web3.js`.
- Configurar `LazorkitProvider` en `src/main.tsx` leyendo variables de entorno.
- Añadir polyfill de Buffer en el navegador cuando sea necesario.

3. UI y flujo de wallet
- Crear `WalletDemo.tsx` con `useWallet`:
  - Conectar (passkey + smart wallet).
  - Mostrar `smartWalletPubkey` y estado.
  - Desconectar.
- Implementar función de transferencia `signAndSendTransaction` (SOL en Devnet). Opcional: USDC Devnet con `PublicKey` del mint.

4. Reutilización de Junglex
- Importar y adaptar `Header` y un pequeño `CryptoPayment` simplificado para Vite/TS.
- Ajustar estilos (CSS/inline) manteniendo mínima dependencia.

5. Persistencia y UX
- Activar `persistCredentials` / reconexión automática en Provider.
- Manejar errores y estados de carga.

6. Documentación y Tutoriales
- README: overview, instalación, configuración de entorno, ejecución.
- Tutorial 1: Passkey + smart wallet (paso a paso).
- Tutorial 2: Transacción gasless (paso a paso).

7. Verificación
- Ejecutar app local en HTTPS (requisito WebAuthn) usando `vite-plugin-basic-ssl` o alternativa.
- Probar login y transferencia en Devnet.
- Preparar build y deploy estático (Vercel/Netlify) para demo pública.

## Estructura de Carpetas
- `src/main.tsx`: Provider y bootstrapping.
- `src/App.tsx`: layout y rutas simples.
- `src/components/WalletDemo.tsx`: UI de conexión y transferencia.
- `src/components/common/Header.tsx`: adaptado desde Junglex.
- `src/lib/solana.ts`: utilidades (claves, mints, helpers).
- `public/`: assets.
- `.env.example` y `.env.local`.

## Configuración de Entorno
- LAZORKIT_RPC_URL: https://api.devnet.solana.com
- LAZORKIT_PORTAL_URL: https://portal.lazor.sh
- LAZORKIT_PAYMASTER_URL: (endpoint de paymaster de Lazorkit)

## Próximas Extensiones (opcional)
- USDC gasless con comprobación de saldo y recepción.
- Persistencia multi‑dispositivo de passkeys.
- Mini widget “Pay with Solana” reutilizable.

¿Confirmás este plan para que proceda a implementar el proyecto Vite, integrar Lazorkit y adaptar componentes de Junglex? 