import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

/**
 * Configuração do Vite para o ecossistema Nitec.
 * Focada em compatibilidade com Electron e Multi-Tenancy local.
 */
export default defineConfig({
  // Mantemos './' para garantir que builds de produção/teste funcionem via file:// se necessário
  base: './',

  plugins: [
    vue(),
    vueDevTools(),
  ],

  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },

  server: {
    port: 5173,
    host: true, // Expõe para a rede local (importante para testes em dispositivos)
    cors: true, // Permite que o Electron faça requisições cross-origin para a API Laravel
    
    // Configuração crítica para o modelo Multi-Tenant do pacote stancl/tenancy
    // permite acessar via dubai.localhost:5173, nitec.localhost:5173, etc.
    allowedHosts: true, 
  }
})