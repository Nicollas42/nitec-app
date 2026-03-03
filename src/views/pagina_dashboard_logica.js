// C:\PDP\NITEC_APP\src\views\pagina_dashboard_logica.js
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';

export function useLogicaDashboard() {
    const roteador = useRouter();
    const loja_autenticacao = useAuthStore();

    const em_modo_suporte = ref(localStorage.getItem('nitec_modo_suporte') === 'ativo');
    const nome_cliente = ref(localStorage.getItem('nitec_nome_cliente') || '');

    // C:\PDP\NITEC_APP\src\views\pagina_dashboard_logica.js

    const encerrar_suporte = () => {
        const token_admin = localStorage.getItem('nitec_token_admin');
        const usuario_admin_raw = localStorage.getItem('nitec_usuario_admin');
        
        if (!token_admin) {
            alert("Sessão administrativa expirada. Por favor, faça login novamente.");
            return sair();
        }

        // 1. RESTAURAÇÃO NO DISCO (LocalStorage)
        localStorage.removeItem('nitec_modo_suporte');
        localStorage.removeItem('nitec_api_tenant');
        localStorage.removeItem('nitec_nome_cliente');
        
        localStorage.setItem('nitec_tenant_id', 'master');
        localStorage.setItem('nitec_token', token_admin);
        
        if (usuario_admin_raw) {
            localStorage.setItem('nitec_usuario', usuario_admin_raw); 
            
            // 2. RESTAURAÇÃO NA RAM (Pinia Store)
            // Isso atualiza o estado reativo instantaneamente. 
            // Quando o Router for verificar a permissão, já vai ler "admin_master"!
            loja_autenticacao.usuario_logado = JSON.parse(usuario_admin_raw);
            loja_autenticacao.token_acesso = token_admin;
        }

        // 3. LIMPEZA DOS BACKUPS
        localStorage.removeItem('nitec_token_admin');
        localStorage.removeItem('nitec_usuario_admin');

        // 4. NAVEGAÇÃO SEGURA E SILENCIOSA
        // O Router agora deixará passar sem exibir o popup
        window.location.hash = '/admin-estabelecimentos';
        window.location.reload();
    };

    const ir_para = (rota_url) => {
        roteador.push(rota_url);
    };

    const sair = () => {
        if (confirm("Deseja realmente sair do sistema?")) {
            // Se estiver em suporte, limpamos os backups de admin
            // e os status de suporte. Mantemos o tenant_id.
            if (em_modo_suporte.value) {
                localStorage.removeItem('nitec_token_admin');
                localStorage.removeItem('nitec_modo_suporte');
                localStorage.removeItem('nitec_api_tenant');
                localStorage.removeItem('nitec_nome_cliente');
                localStorage.removeItem('nitec_usuario_admin');
            }
            
            loja_autenticacao.encerrar_sessao();
            roteador.push('/login');
        }
    };

    return { 
        nome_cliente, 
        em_modo_suporte, 
        ir_para, 
        sair, 
        encerrar_suporte 
    };
}