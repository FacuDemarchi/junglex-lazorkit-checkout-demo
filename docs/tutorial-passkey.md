# Cómo crear una wallet con passkey y conectar

1. Instalar dependencias: `pnpm install`
2. Configurar `.env.local` con URLs de Devnet y portal.
3. Ejecutar en HTTPS: `pnpm dev` (Vite con SSL).
4. Abrir https://localhost:5173 y pulsar “Conectar Wallet”.
5. Completar el flujo de passkey en el portal de Lazorkit.
6. Ver el `smartWalletPubkey` y estado conectado.
