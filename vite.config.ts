import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa'; // Importação do motor PWA

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // Configuração da PWA para o cliente Stacy Costa Nails
        VitePWA({
          registerType: 'autoUpdate', // Atualiza a app no telemóvel do cliente automaticamente
          includeAssets: ['favicon.svg', 'capa-whatsapp.webp', 'mapa.jpg'], 
          manifest: {
            name: 'Gestão Stacy Costa Nails',
            short_name: 'Stacy Nails',
            description: 'Painel de Gestão e Agendamentos Stacy Costa Nails',
            theme_color: '#b5967a', // A cor Bronze da barra de topo no telemóvel
            background_color: '#fdfbf7', // A cor Nude do fundo do splash screen
            display: 'standalone', // Faz com que pareça uma app nativa (sem barra do chrome)
            icons: [
              {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
              },
              {
                src: 'pwa-512x512.png',
                sizes: '512x512',
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
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});