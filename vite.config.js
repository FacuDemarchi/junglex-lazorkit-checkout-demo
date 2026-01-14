import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import mkcert from 'vite-plugin-mkcert';
export default defineConfig({
    plugins: [
        react(),
        mkcert({ force: true }),
        nodePolyfills({
            globals: {
                Buffer: true,
                global: true,
                process: true,
            },
            protocolImports: true,
        })
    ],
    server: {
        port: 5173
    },
    resolve: {
        alias: {
            buffer: 'vite-plugin-node-polyfills/shims/buffer',
        }
    }
});
