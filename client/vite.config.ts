import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { civicLandingPlugin } from './vite.landing';

const clientRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), civicLandingPlugin()],
  base: '/app/',
  publicDir: 'public',
  build: {
    // Vercel Express serves ONLY the repo-root `public/` folder as the CDN.
    outDir: path.resolve(clientRoot, '../public/app'),
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
