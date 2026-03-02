import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';

/**
 * Lógica central do Painel de Controle com controle de permissão e suporte.
 * @return {Object}
 */
export function useLogicaDashboard() {
    const roteador = useRouter();
    const loja_autenticacao = useAuthStore();

    // Dados do utilizador logado e Modo Suporte
    const em_modo_suporte = ref(localStorage.getItem('nitec_modo_suporte') === 'ativo');
    const nome_cliente = ref(localStorage.getItem('nitec_nome_cliente') || '');
    
    const usuario_nome = computed(() => loja_autenticacao.usuario_logado?.name || 'Operador');
    const usuario_cargo = computed(() => loja_autenticacao.usuario_logado?.tipo_usuario || 'Acesso Padrão');

    /**
     * Verifica se o utilizador logado possui nível de administrador central.
     * @return {boolean}
     */
    const eh_super_admin = computed(() => {
        return loja_autenticacao.usuario_logado?.tipo_usuario === 'admin';
    });

    /**
     * Encerra a simulação de acesso e restaura o token do admin central.
     */
    const encerrar_suporte = () => {
        const token_admin = localStorage.getItem('nitec_token_admin');
        if (token_admin) {
            localStorage.setItem('nitec_token', token_admin);
        }
        
        // Limpa os dados do cliente
        localStorage.removeItem('nitec_modo_suporte');
        localStorage.removeItem('nitec_api_tenant');
        localStorage.removeItem('nitec_nome_cliente');
        localStorage.removeItem('nitec_token_admin');

        // Força um recarregamento limpo para voltar à raiz central
        window.location.href = '/admin-estabelecimentos';
    };

    /**
     * Redireciona o utilizador para o módulo desejado.
     * @param {string} rota_url 
     */
    const ir_para = (rota_url) => {
        roteador.push(rota_url);
    };

    /**
     * Encerra a sessão geral e retorna ao login.
     */
    const realizar_logout = () => {
        if (confirm("Deseja realmente sair do sistema?")) {
            // Se estiver em suporte, limpa primeiro
            if (em_modo_suporte.value) {
                encerrar_suporte();
            }
            loja_autenticacao.encerrar_sessao();
            roteador.push('/login');
        }
    };

    return {
        usuario_nome,
        usuario_cargo,
        eh_super_admin,
        em_modo_suporte,
        nome_cliente,
        encerrar_suporte,
        ir_para,
        realizar_logout
    };
}