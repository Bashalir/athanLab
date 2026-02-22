import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';
import { execSync } from 'node:child_process';
import postcssGlobalData from '@csstools/postcss-global-data';
import postcssCustomProperties from 'postcss-custom-properties';

function getBuildLabel() {
  let hash = 'dev';
  try {
    hash = execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    // Keep default hash when git is unavailable.
  }
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = String(now.getFullYear()).slice(-2);
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `AthanLab-${hash}-${dd}${mm}${yy}-${hh}${min}`;
}

export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/athanLab/' : '/',
  plugins: [
    react(),
    legacy({
      targets: ['ios >= 9', 'safari >= 9'],
      renderModernChunks: false,
    }),
  ],
  css: {
    postcss: {
      plugins: [
        postcssGlobalData({
          files: ['src/styles/tokens.css'],
        }),
        postcssCustomProperties({
          // Keep CSS variables for modern browsers, but add static fallbacks
          // for legacy Safari/iOS that do not support custom properties.
          preserve: true,
        }),
      ],
    },
  },
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
    __APP_VERSION__: JSON.stringify(getBuildLabel()),
  },
}));
