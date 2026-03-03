// C:\PDP\NITEC_APP\src\stores\auth_store.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { configurar_url_base } from '../servicos/api_cliente.js';

export const useAuthStore = defineStore('auth_store', () => {
    const usuario_logado = ref(JSON.parse(localStorage.getItem('nitec_usuario')) || null);
    const token_acesso = ref(localStorage.getItem('nitec_token') || null);

    const realizar_login = async (codigo_loja, email_digitado, senha_digitada) => {
        try {
            // Limpeza preventiva
            localStorage.removeItem('nitec_api_tenant');
            localStorage.removeItem('nitec_modo_suporte');

            const url_correta = configurar_url_base(codigo_loja);
            api_cliente.defaults.baseURL = url_correta;

            const eh_master = !codigo_loja || codigo_loja.toLowerCase() === 'master';
            const endpoint_login = eh_master ? '/admin/login' : '/realizar-login';

            const resposta = await api_cliente.post(endpoint_login, {
                email: email_digitado,
                password: senha_digitada 
            });

            if (resposta.data.status) {
                token_acesso.value = resposta.data.token;
                usuario_logado.value = resposta.data.usuario;

                localStorage.setItem('nitec_tenant_id', codigo_loja);
                localStorage.setItem('nitec_token', token_acesso.value);
                localStorage.setItem('nitec_usuario', JSON.stringify(usuario_logado.value));
            }
        } catch (erro_http) {
            localStorage.removeItem('nitec_tenant_id');
            console.error('Falha na autenticação:', erro_http);
            
            if (erro_http.response && erro_http.response.data.mensagem) {
                throw new Error(erro_http.response.data.mensagem);
            }
            throw new Error('Credenciais inválidas ou erro de conexão com a unidade selecionada.');
        }
    };

    const encerrar_sessao = () => {
        usuario_logado.value = null;
        token_acesso.value = null;

        localStorage.removeItem('nitec_token');
        localStorage.removeItem('nitec_usuario');

        // Limpa obrigatoriamente rastros de suporte para evitar 401
        localStorage.removeItem('nitec_api_tenant');
        localStorage.removeItem('nitec_modo_suporte');
        localStorage.removeItem('nitec_nome_cliente');
        localStorage.removeItem('nitec_token_admin');
        localStorage.removeItem('nitec_usuario_admin');
        
        // NOTA: Não removemos as chaves 'nitec_saved_' nem 'nitec_tenant_id'
    };

    return { usuario_logado, token_acesso, realizar_login, encerrar_sessao };
});