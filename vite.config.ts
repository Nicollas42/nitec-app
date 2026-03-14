import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import { VitePWA } from 'vite-plugin-pwa'
import { readFileSync } from 'node:fs'

// 🟢 Lê a versão do package.json em tempo de build
// Isso injeta import.meta.env.PACKAGE_VERSION no bundle
// sem isso o Android sempre usa o fallback '1.1.0'
const { version } = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
    base: './',

    // 🟢 Injeta a versão como variável de ambiente acessível em todo o app
    define: {
        'import.meta.env.PACKAGE_VERSION': JSON.stringify(version),
    },

    plugins: [
        vue(),
        vueDevTools(),

        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],

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

            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.nitec\.dev\.br\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'nitec-api-cache',
                            expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
                            networkTimeoutSeconds: 5,
                        }
                    },
                    {
                        urlPattern: /^http:\/\/192\.168\.\d+\.\d+:3737\/.*/i,
                        handler: 'NetworkOnly',
                    }
                ],
                importScripts: ['sw-offline-detector.js'],
            },

            devOptions: {
                enabled: false,
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