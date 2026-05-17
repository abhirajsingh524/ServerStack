import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      // Proxy all /api requests to the Express backend on :5000
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('\n[PROXY ERROR] Backend not reachable at http://127.0.0.1:5000');
            console.error('Make sure the backend is running: npm run dev (in the root folder)\n');
          });
        },
      },
      '/uploads': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: '../frontend-dist',
    emptyOutDir: true,
  },
});
