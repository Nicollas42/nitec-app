import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  // Configurações de Servidor adicionadas para o sistema SaaS (Tenancy)
  server: {
    host: true, // Expõe o servidor para a rede local e subdomínios
    cors: true, // Permite requisições de diferentes origens (CORS)
    allowedHosts: true, // Liberta o acesso via nomes customizados como "dubai.localhost"
  }
})