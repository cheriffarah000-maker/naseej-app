import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The browser only ever talks to the gateway (REST) and the transport service
 * (WebSocket). Vite proxies both, so there is no CORS problem in development
 * and no hardcoded host in the app code.
 */
const gateway = process.env.GATEWAY_URL || 'http://localhost:8080';
const transport = process.env.TRANSPORT_URL || 'http://localhost:3003';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: gateway, changeOrigin: true },
      '/socket.io': { target: transport, changeOrigin: true, ws: true },
    },
  },
  // Same proxy for `vite preview`, so a production build can be checked locally.
  preview: {
    host: '0.0.0.0',
    port: 4173,
    proxy: {
      '/api': { target: gateway, changeOrigin: true },
      '/socket.io': { target: transport, changeOrigin: true, ws: true },
    },
  },
});
