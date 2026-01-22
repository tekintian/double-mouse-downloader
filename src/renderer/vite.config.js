import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import packageJson from '../../package.json';
import path from 'path';

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  base: './',
  resolve: {
    preserveSymlinks: true,
    alias: {
      'react-dom/client': path.resolve(__dirname, '../../node_modules/react-dom/index.js')
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  server: {
    port: process.env.VITE_PORT ? parseInt(process.env.VITE_PORT) : 3000,
    host: 'localhost',
    open: false,
    strictPort: true,
    fs: {
      strict: false
    }
  },
  build: {
    outDir: '../../build/renderer/',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {}
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
});