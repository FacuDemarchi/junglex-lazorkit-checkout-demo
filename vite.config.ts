import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(), 
    basicSsl(),
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
})
