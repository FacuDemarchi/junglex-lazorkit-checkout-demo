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

## Correcciones del SDK (Parches Críticos)

Para asegurar el funcionamiento correcto de la integración, se han aplicado los siguientes parches al SDK `@lazorkit/wallet`:

1.  **Optimización de Tamaño de Transacción (ALT)**:
    *   Se implementaron **Address Lookup Tables (ALT)** para reducir el tamaño de las transacciones complejas.
    *   Esto permite utilizar el flujo rápido ("Single Instruction") evitando el error `Transaction too large`.
    *   Script de utilidad: `scripts/create-alt.js` (para crear nuevas tablas si es necesario).

2.  **Validación BN (Big Number)**:
    *   Se relajó la validación estricta de `instanceof BN` en el SDK, permitiendo compatibilidad con diferentes versiones de `bn.js` empaquetadas por Vite.
    *   Esto soluciona el error `params.timestamp must be a BN instance`.

3.  **Compatibilidad WebAuthn (Polyfill)**:
    *   Se añadió un polyfill (`src/webauthn-polyfill.js`) que asegura que las credenciales creadas usen el algoritmo **ES256** (P-256).
    *   Normaliza las firmas (S-value) para cumplir con las restricciones del contrato inteligente, solucionando el error `custom program error: 0x2`.

4.  **Configuración de Paymaster**:
    *   Se corrigió el manejo de la configuración del Paymaster para evitar bucles de renderizado infinitos y errores de URL nula.

Estos parches se aplican automáticamente tras instalar dependencias mediante el script `scripts/patch-wallet.js`.

## Scripts
- `pnpm dev`: ejecuta el servidor local en HTTPS (https://localhost:5173)
- `pnpm build`: compila producción
- `pnpm preview`: sirve el build
- `node scripts/create-alt.js`: crea una Address Lookup Table en Devnet (requiere clave privada en el script).

## Estructura
- `src/App.tsx`: Provider de Lazorkit y layout
- `src/components/WalletDemo.tsx`: flujo de conexión y transferencia gasless
- `src/components/common/Header.tsx`: encabezado básico reutilizado desde Junglex
- `src/webauthn-polyfill.js`: Parches en tiempo de ejecución para WebAuthn.

## Tutoriales
- Ver `docs/tutorial-passkey.md` y `docs/tutorial-gasless.md`

## Notas
- Este proyecto está orientado al bounty “Integrate Passkey technology with Lazorkit to 10x Solana UX”.
