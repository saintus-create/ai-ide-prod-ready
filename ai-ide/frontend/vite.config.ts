import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:4000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@codemirror/view', '@codemirror/state', '@codemirror/lang-javascript', '@codemirror/theme-one-dark'],
        },
      },
    },
  },
  define: {
    // Ensure proper environment variable handling
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:4000'),
    __WS_URL__: JSON.stringify(process.env.VITE_WS_URL || 'http://localhost:4000'),
  },
});