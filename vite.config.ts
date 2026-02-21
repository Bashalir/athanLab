import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    legacy({
      targets: ['ios >= 9', 'safari >= 9'],
      renderModernChunks: false,
    }),
  ],
  build: {
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  define: {
    __BUILD_ID__: JSON.stringify(`salat-${Date.now()}`),
  },
});
