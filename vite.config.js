import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-icon.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Family Finance Manager',
        short_name: 'FamilyFinance',
        description: 'Private family expense management application with YC aesthetics',
        theme_color: '#08080B',
        background_color: '#08080B',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/firebase')) {
            return 'vendor_firebase';
          }
          if (id.includes('node_modules/recharts')) {
            return 'vendor_charts';
          }
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/jspdf-autotable')) {
            return 'vendor_pdf';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor_icons';
          }
        }
      }
    },
    chunkSizeWarningLimit: 800
  }
})
