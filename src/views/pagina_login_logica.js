// C:\PDP\NITEC_APP\src\views\pagina_login_logica.js
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';

export function useLogicaLogin() {
    const roteador = useRouter();
    const loja_autenticacao = useAuthStore();

    const codigo_loja_input = ref('');
    const email_input = ref('');
    const senha_input = ref('');
    const lembrar_credenciais = ref(false);

    onMounted(() => {
        // 1. Tenta detetar a loja pelo hostname (Web)
        const hostname = window.location.hostname;
        let loja_detectada = '';
        
        if (hostname && !hostname.startsWith('nitec.') && !hostname.startsWith('localhost') && hostname !== '127.0.0.1') {
            loja_detectada = hostname.split('.')[0];
        } else {
            // Puxa o último cache de navegação (Automático)
            loja_detectada = localStorage.getItem('nitec_tenant_id') || '';
        }

        // 2. RECUPERAÇÃO DE CREDENCIAIS (Prioridade Máxima)
        const email_salvo = localStorage.getItem('nitec_saved_email');
        const senha_salva = localStorage.getItem('nitec_saved_password');
        const loja_salva = localStorage.getItem('nitec_saved_loja'); 
        
        if (email_salvo && senha_salva) {
            email_input.value = email_salvo;
            senha_input.value = atob(senha_salva); 
            
            codigo_loja_input.value = loja_salva || loja_detectada;
            lembrar_credenciais.value = true;
        } else {
            codigo_loja_input.value = loja_detectada;
        }
    });

    const processar_formulario = async () => {
        try {
            const loja = codigo_loja_input.value.trim() || 'master';
            
            await loja_autenticacao.realizar_login(loja, email_input.value, senha_input.value);
            
            if (lembrar_credenciais.value) {
                localStorage.setItem('nitec_saved_email', email_input.value);
                localStorage.setItem('nitec_saved_password', btoa(senha_input.value));
                localStorage.setItem('nitec_saved_loja', loja); 
            } else {
                localStorage.removeItem('nitec_saved_email');
                localStorage.removeItem('nitec_saved_password');
                localStorage.removeItem('nitec_saved_loja');
            }

            roteador.push('/painel-central');
        } catch (erro) {
            alert(erro.message);
        }
    };

    return { 
        codigo_loja_input, 
        email_input, 
        senha_input, 
        lembrar_credenciais, 
        processar_formulario 
    };
}