// C:\PDP\NITEC_APP\src\stores\auth_store.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { configurar_url_base } from '../servicos/api_cliente.js';

export const useAuthStore = defineStore('auth_store', () => {
    const usuario_logado = ref(JSON.parse(localStorage.getItem('nitec_usuario')) || null);
    const token_acesso = ref(localStorage.getItem('nitec_token') || null);

    const realizar_login = async (loja, email, senha) => {
        try {
            // Se for master, bate no Admin. Se for cliente, bate no Tenant.
            const rota_login = (loja === 'master') ? '/admin/login' : '/realizar-login';

            const resposta = await api_cliente.post(rota_login, {
                email: email,
                password: senha
            });

            // Salva o token e os dados
            const token = resposta.data.token;
            const usuario = resposta.data.usuario;

            token_acesso.value = token;
            usuario_logado.value = usuario;

            localStorage.setItem('nitec_token', token);
            localStorage.setItem('nitec_usuario', JSON.stringify(usuario));

            return resposta.data;
        } catch (erro) {
            console.error("Erro no login:", erro);
            throw new Error(erro.response?.data?.mensagem || "Credenciais inválidas ou loja inativa.");
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