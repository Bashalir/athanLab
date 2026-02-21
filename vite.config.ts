import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: {
    __BUILD_ID__: JSON.stringify(`salat-${Date.now()}`),
  },
});
