import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { civicLandingPlugin } from './vite.landing';

export default defineConfig({
  plugins: [react(), civicLandingPlugin()],
  base: '/app/',
  publicDir: 'public',
  build: {
    outDir: 'dist/app',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  preview: {
    port: 5173,
  },
});
