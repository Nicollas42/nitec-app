import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    // ID único do app — padrão: domínio invertido + nome
    appId   : 'br.dev.nitec.app',
    appName : 'NitecSystem',

    // Pasta do build do Vue
    webDir  : 'dist',

    // Permite HTTP (necessário para o servidor local em HTTP)
    server: {
        // Em produção aponta para a VPS
        // Em desenvolvimento aponta para o Vite local
        url           : undefined,
        cleartext     : true,   // 🟢 Permite HTTP (necessário para servidor local 192.168.x.x:3737)
        allowNavigation: ['*.nitec.dev.br', '192.168.*.*'],
    },

    android: {
        // Permite tráfego HTTP em produção (necessário para servidor local)
        // Equivalente ao android:usesCleartextTraffic="true" no AndroidManifest
        allowMixedContent: true,
        captureInput     : true,
        webContentsDebuggingEnabled: true, // Remover em produção final
    },

    plugins: {
        // SplashScreen desabilitado — o app carrega direto
        SplashScreen: {
            launchShowDuration: 0,
        },
    },
};

export default config;