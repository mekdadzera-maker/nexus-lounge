import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifestFilename: 'manifest.json',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'NEXUS Lounge — Qlf Gaming',
        short_name: 'Qlf Gaming',
        description: 'Two-level gaming & billiards hub in Sidi Bel Abbès. Book your station live.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#08080a',
        theme_color: '#08080a',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the built app shell (JS/CSS/HTML) so the site loads with no signal.
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            // Google Fonts stylesheet
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            // Google Fonts font files
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Supabase read-only data (stations, pricing, venue settings) so the
            // station list, pricing and hours still show with no connection.
            // Only GET is matched -- booking inserts are never cached and will
            // correctly fail offline rather than silently queue.
            urlPattern: ({ url, request }) =>
              url.hostname === 'zejraxsjieajrqsrcxhd.supabase.co' &&
              url.pathname.startsWith('/rest/v1/') &&
              request.method === 'GET',
            handler: 'StaleWhileRevalidate',
            method: 'GET',
            options: {
              cacheName: 'supabase-data',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
