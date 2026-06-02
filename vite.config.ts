import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// base: './' keeps asset URLs relative so the same build works on GitHub Pages
// (project subpath) and Vercel without extra config.
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icons/apple-touch-icon-180.png'],
      manifest: {
        name: 'Тайкун-Парк',
        short_name: 'Тайкун-Парк',
        description: 'Аркада весёлых idle-тайкунов: ферма, кофейня и не только.',
        lang: 'ru',
        theme_color: '#1a1736',
        background_color: '#1a1736',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      // SW off in dev to avoid aggressive caching while iterating (matches prior projects)
      devOptions: { enabled: false },
    }),
  ],
})
