// C:\PDP\NITEC_APP\src\stores\auth_store.js
import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

export const useAuthStore = defineStore('auth_store', () => {
    const usuario_logado = ref(JSON.parse(localStorage.getItem('nitec_usuario')) || null);
    const token_acesso = ref(localStorage.getItem('nitec_token') || null);

    const realizar_login = async (email_digitado, senha_digitada) => {
        try {
            const resposta = await api_cliente.post('/realizar-login', {
                email: email_digitado,
                password: senha_digitada 
            });

            if (resposta.data.status) {
                token_acesso.value = resposta.data.token;
                usuario_logado.value = resposta.data.usuario;

                localStorage.setItem('nitec_token', token_acesso.value);
                localStorage.setItem('nitec_usuario', JSON.stringify(usuario_logado.value));
            }
        } catch (erro_http) {
            console.error('Falha na autenticação:', erro_http);
            
            // Tratamento otimizado para extrair a mensagem do Laravel (401/422)
            if (erro_http.response && erro_http.response.data) {
                const msg = erro_http.response.data.message || erro_http.response.data.mensagem || 'Credenciais inválidas.';
                throw new Error(msg);
            }
            
            throw new Error('Não foi possível conectar ao servidor da Nitec.');
        }
    };

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