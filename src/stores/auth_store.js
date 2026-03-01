import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

/**
 * Gerencia o estado de autenticação e a comunicação com a API Laravel.
 * * @return {Object}
 */
export const useAuthStore = defineStore('auth_store', () => {
    // Estado inicial utilizando Snake Case
    const usuario_logado = ref(JSON.parse(localStorage.getItem('nitec_usuario')) || null);
    const token_acesso = ref(localStorage.getItem('nitec_token') || null);

    /**
     * Comunica com a API Laravel para validar as credenciais reais no banco de dados.
     * * @param {string} email_digitado
     * * @param {string} senha_digitada
     * * @return {Promise<void>}
     */
    const realizar_login = async (email_digitado, senha_digitada) => {
        try {
            // Ajustado para 'realizar-login' (Kebab Case) para bater com a rota do Laravel
            const resposta = await api_cliente.post('/realizar-login', {
                email: email_digitado,
                password: senha_digitada 
            });

            // O Laravel retorna um objeto com 'token' e 'usuario' dentro de 'data'
            if (resposta.data.status) {
                token_acesso.value = resposta.data.token;
                usuario_logado.value = resposta.data.usuario;

                // Persistência local para manter a sessão ao reiniciar o programa
                localStorage.setItem('nitec_token', token_acesso.value);
                localStorage.setItem('nitec_usuario', JSON.stringify(usuario_logado.value));
            }
            
        } catch (erro_http) {
            console.error('Falha na autenticação:', erro_http);
            
            // Tratamento de erro profissional para exibir no alert da View
            if (erro_http.response && erro_http.response.data.mensagem) {
                throw new Error(erro_http.response.data.mensagem);
            }
            
            throw new Error('Não foi possível conectar ao servidor da Nitec.');
        }
    };

    /**
     * Remove os dados locais e encerra a sessão no aplicativo.
     * * @return {void}
     */
    const encerrar_sessao = () => {
        usuario_logado.value = null;
        token_acesso.value = null;
        localStorage.removeItem('nitec_token');
        localStorage.removeItem('nitec_usuario');
    };

    return { 
        usuario_logado, 
        token_acesso, 
        realizar_login, 
        encerrar_sessao 
    };
});