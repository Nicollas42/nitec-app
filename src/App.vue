<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue';
import { db } from './banco_local/db.js';
import { useRouter } from 'vue-router';

const roteador = useRouter();

onMounted(async () => {
    // 🟢 1. TRAVA ANTI-ZUMBI: Executa antes de qualquer outra coisa
    // O sessionStorage morre quando o App fecha. Se não houver 'app_ligado', é um boot fresco.
    if (!sessionStorage.getItem('nitec_app_booted')) {
        sessionStorage.setItem('nitec_app_booted', 'true');

        // Se o App abriu e o modo suporte estava ativo, houve um encerramento forçado (X)
        if (localStorage.getItem('nitec_modo_suporte') === 'ativo') {
            console.warn("🧹 Detectada sessão de suporte órfã. Limpando banco local...");
            
            // A MAGIA: Limpa o banco local (Dexie) IMEDIATAMENTE
            await db.transaction('rw', db.tables, async () => {
                for (const tabela of db.tables) {
                    await tabela.clear();
                }
            });

            // Restaura as credenciais do Admin Master
            const token_admin = localStorage.getItem('nitec_token_admin');
            const usuario_admin = localStorage.getItem('nitec_usuario_admin');
            
            if (token_admin && usuario_admin) {
                localStorage.setItem('nitec_tenant_id', 'master');
                localStorage.setItem('nitec_token', token_admin);
                localStorage.setItem('nitec_usuario', usuario_admin);
            }

            // Remove os rastros do cliente anterior
            localStorage.removeItem('nitec_modo_suporte');
            localStorage.removeItem('nitec_api_tenant');
            localStorage.removeItem('nitec_nome_cliente');
            localStorage.removeItem('nitec_token_admin');
            localStorage.removeItem('nitec_usuario_admin');

            // Força um recarregamento limpo na rota do Admin
            window.location.hash = '/admin-estabelecimentos';
            window.location.reload();
            return; 
        }
    }
});

// --- VACINAS DO PWA (Foco de Inputs) ---
window.addEventListener('click', (evento) => {
    if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA') {
        window.focus(); 
        evento.target.focus(); 
    }
});

window.addEventListener('focus', () => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
    }
});
</script>