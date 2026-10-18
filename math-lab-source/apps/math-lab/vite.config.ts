import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  publicDir: '../web/public',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../../dist/math-lab',
    emptyOutDir: true,
    sourcemap: false,
    assetsInlineLimit: 0,
  },
});
