import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { configurar_url_base, sincronizar_cache_para_local } from '../servicos/api_cliente.js';

export const useAuthStore = defineStore('auth_store', () => {
    const usuario_logado = ref(JSON.parse(localStorage.getItem('nitec_usuario')) || null);
    const token_acesso = ref(localStorage.getItem('nitec_token') || null);

    const realizar_login = async (loja, email, senha) => {
        try {
            const rota_login = (loja === 'master') ? '/admin/login' : '/realizar-login';

            const resposta = await api_cliente.post(rota_login, {
                email: email,
                password: senha
            });

            const token = resposta.data.token;
            const usuario = resposta.data.usuario;

            token_acesso.value = token;
            usuario_logado.value = usuario;

            localStorage.setItem('nitec_token', token);
            localStorage.setItem('nitec_usuario', JSON.stringify(usuario));

            // 🟢 Notifica o Electron sobre o tipo de usuário logado
            // O Electron decide se inicia ou para o servidor local
            if (window?.require) {
                try {
                    const { ipcRenderer } = window.require('electron');
                    await ipcRenderer.invoke('notificar-login', {
                        tipo_usuario: usuario.tipo_usuario,
                        tenant_id   : loja,
                    });
                } catch { /* não está no Electron */ }
            }

            // 🟢 Sincronização completa com o servidor local após login
            if (loja !== 'master') {
                sincronizar_snapshot_completo().catch(() => {});
            }

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
        localStorage.removeItem('nitec_api_tenant');
        localStorage.removeItem('nitec_modo_suporte');
        localStorage.removeItem('nitec_nome_cliente');
        localStorage.removeItem('nitec_token_admin');
        localStorage.removeItem('nitec_usuario_admin');
    };

    return { usuario_logado, token_acesso, realizar_login, encerrar_sessao };
});

/**
 * Busca todos os dados da VPS e envia para o servidor local em background.
 * Chamado logo após o login bem-sucedido.
 * Roda em segundo plano — não bloqueia o login nem a navegação.
 */
const sincronizar_snapshot_completo = async () => {
    try {
        // Busca os 3 recursos em paralelo para ser mais rápido
        const [resp_produtos, resp_mesas, resp_comandas] = await Promise.allSettled([
            api_cliente.get('/listar-produtos'),
            api_cliente.get('/listar-mesas'),
            api_cliente.get('/listar-comandas'),
        ]);

        const produtos = resp_produtos.status === 'fulfilled'
            ? (resp_produtos.value.data.produtos || [])
            : null;

        const mesas = resp_mesas.status === 'fulfilled'
            ? (resp_mesas.value.data.dados || resp_mesas.value.data.mesas || [])
            : null;

        const comandas = resp_comandas.status === 'fulfilled'
            ? (resp_comandas.value.data.comandas || [])
            : null;

        await sincronizar_cache_para_local(produtos, mesas, comandas);

        console.log('[Auth] Snapshot completo enviado para o servidor local.');
    } catch (e) {
        console.warn('[Auth] Falha ao sincronizar snapshot:', e.message);
    }
};