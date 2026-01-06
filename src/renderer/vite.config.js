import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from '../../package.json';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  base: './',
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
    host: 'localhost',
    open: false,
    strictPort: true,
  },
  build: {
    outDir: '../../build/renderer/',
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});