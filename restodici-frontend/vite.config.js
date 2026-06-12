// vite.config.js — Configuration du bundler Vite pour le frontend RESTODICI
// Gère le serveur de dev, les proxies API/WebSocket et le découpage du bundle en production.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  // En développement : redirige /api et /socket.io vers le backend NestJS
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },

  build: {
    // Taille max avant avertissement : on tolère 800kb par chunk après le splitting
    chunkSizeWarningLimit: 800,

    rollupOptions: {
      output: {
        // Sépare les grosses librairies tierces en chunks distincts
        // → le navigateur peut les mettre en cache séparément entre les déploiements
        manualChunks: {
          // Cœur React (petit, très stable — long cache)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Icônes Lucide (gros paquet, rarement mis à jour)
          'vendor-lucide': ['lucide-react'],

          // Graphiques Chart.js + wrapper React
          'vendor-charts': ['chart.js', 'react-chartjs-2'],

          // Requêtes serveur et formulaires
          'vendor-query': ['@tanstack/react-query', 'axios'],

          // Cartographie (Leaflet est très lourd, ~150kb)
          'vendor-leaflet': ['leaflet', 'react-leaflet'],
        },
      },
    },
  },
});
