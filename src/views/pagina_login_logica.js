import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';

/**
 * Hook de lógica encapsulada para a tela de Login (Composable).
 * * @return {Object}
 */
export function useLogicaLogin() {
    const roteador = useRouter();
    const loja_autenticacao = useAuthStore();

    const email_input = ref('');
    const senha_input = ref('');

    /**
     * Captura o envio do formulário, valida na API e envia para a central.
     * * @return {Promise<void>}
     */
    const processar_formulario = async () => {
        try {
            // Realiza o login real via Axios contra o Laravel
            await loja_autenticacao.realizar_login(email_input.value, senha_input.value);
            
            // Independente do tipo, agora todos entram pela Central de Ícones
            roteador.push('/painel-central');
            
        } catch (erro) {
            // Exibe o erro de credenciais ou de conexão com o servidor
            alert(erro.message);
        }
    };

    return {
        email_input,
        senha_input,
        processar_formulario
    };
}