import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Configuração do Vite para o ecossistema Nitec.
 * Focada em compatibilidade com Electron, PWA e Multi-Tenancy local.
 */
export default defineConfig({
    base: './',

    plugins: [
        vue(),
        vueDevTools(),

        // 🟢 PWA — gera Service Worker e manifest automaticamente
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

            // Manifest do app instalável
            manifest: {
                name: 'NitecSystem',
                short_name: 'Nitec',
                description: 'Sistema de gestão para bares e restaurantes',
                theme_color: '#008CBA',
                background_color: '#1a1a1a',
                display: 'standalone',
                orientation: 'portrait',
                scope: '/',
                start_url: '/',
                icons: [
                    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
                    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
                ]
            },

            // Workbox — estratégia de cache
            workbox: {
                // Faz cache de todos os assets do app (JS, CSS, fontes, imagens)
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

                // Estratégia: tenta rede primeiro, cai para cache se offline
                runtimeCaching: [
                    {
                        // Cache das chamadas da API VPS
                        urlPattern: /^https:\/\/.*\.nitec\.dev\.br\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'nitec-api-cache',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                            networkTimeoutSeconds: 5,
                        }
                    },
                    {
                        // Cache do servidor local (nunca cacheia — sempre ao vivo)
                        urlPattern: /^http:\/\/192\.168\.\d+\.\d+:3737\/.*/i,
                        handler: 'NetworkOnly',
                    }
                ],

                // Script customizado do Service Worker (detecta offline e notifica o app)
                importScripts: ['sw-offline-detector.js'],
            },

            // Modo desenvolvimento — ativa o SW em dev para testar
            devOptions: {
                enabled: false, // mude para true se quiser testar o SW em npm run dev
                type: 'module',
            }
        }),
    ],

    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        },
    },

    server: {
        port: 5173,
        host: true,
        cors: true,
        allowedHosts: true,
    }
})