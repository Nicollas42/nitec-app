import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';
import axios from 'axios';
import { configurar_url_base } from '../servicos/api_cliente.js';

export function useLogicaLogin() {
    const roteador = useRouter();
    const loja_autenticacao = useAuthStore();

    const codigo_loja_input = ref('');
    const email_input = ref('');
    const senha_input = ref('');
    const lembrar_credenciais = ref(false);

    onMounted(() => {
        const hostname = window.location.hostname;
        let loja_detectada = '';
        
        if (hostname && !hostname.startsWith('nitec.') && !hostname.startsWith('localhost') && hostname !== '127.0.0.1') {
            loja_detectada = hostname.split('.')[0];
        } else {
            loja_detectada = localStorage.getItem('nitec_tenant_id') || '';
        }

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
            
            localStorage.setItem('nitec_tenant_id', loja);
            
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
            alert(erro.message || "Erro ao fazer login.");
        }
    };

    const esqueci_senha = async () => {
        const loja = codigo_loja_input.value.trim() || 'master';
        
        if (!email_input.value) {
            alert("Por favor, digite o seu e-mail no campo acima antes de clicar em 'Esqueci minha senha'.");
            return;
        }

        const confirmacao = await confirm(`Deseja enviar um link de recuperação para ${email_input.value} na loja "${loja}"?`);
        if (!confirmacao) return;

        try {
            const url_central = configurar_url_base('master');
            const resposta = await axios.post(`${url_central}/admin/esqueci-senha`, {
                email: email_input.value,
                loja: loja
            }, {
                headers: { 'Accept': 'application/json' }
            });

            alert(resposta.data.mensagem);

        } catch (erro) {
            const msg = erro.response?.data?.mensagem || "Erro ao tentar conectar com o servidor.";
            alert(msg);
        }
    };

    return { 
        codigo_loja_input, email_input, senha_input, 
        lembrar_credenciais, processar_formulario, esqueci_senha
    };
}