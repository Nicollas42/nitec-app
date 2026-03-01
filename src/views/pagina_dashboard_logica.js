import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';

/**
 * Lógica central do Painel de Controle.
 * * @return {Object}
 */
export function useLogicaDashboard() {
    const roteador = useRouter();
    const loja_autenticacao = useAuthStore();

    // Dados do usuário logado
    const usuario_nome = computed(() => loja_autenticacao.usuario_logado?.nome || 'Operador');
    const usuario_cargo = computed(() => loja_autenticacao.usuario_logado?.tipo_usuario || 'Acesso Padrão');

    /**
     * Redireciona o usuário para o módulo desejado.
     * * @param {string} rota_url 
     */
    const ir_para = (rota_url) => {
        roteador.push(rota_url);
    };

    /**
     * Encerra a sessão e retorna ao login.
     */
    const realizar_logout = () => {
        if(confirm("Deseja realmente sair do sistema?")) {
            loja_autenticacao.encerrar_sessao();
            roteador.push('/login');
        }
    };

    return {
        usuario_nome,
        usuario_cargo,
        ir_para,
        realizar_logout
    };
}