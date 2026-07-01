/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Mundial 2026 - Cuadro Circular',
        short_name: 'Mundial 2026',
        description: 'Cuadro de eliminatorias radial del Mundial de Fútbol',
        theme_color: '#090d16',
        icons: [
          {
            src: 'https://flagcdn.com/w160/un.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'https://flagcdn.com/w320/un.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
});
