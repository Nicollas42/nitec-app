import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { configurar_url_base, sincronizar_cache_para_local } from '../servicos/api_cliente.js';

export const useAuthStore = defineStore('auth_store', () => {
    const usuario_logado = ref(JSON.parse(localStorage.getItem('nitec_usuario')) || null);
    const token_acesso   = ref(localStorage.getItem('nitec_token') || null);

    const realizar_login = async (loja, email, senha) => {
        try {
            const rota_login = (loja === 'master') ? '/admin/login' : '/realizar-login';

            const resposta = await api_cliente.post(rota_login, {
                email   : email,
                password: senha
            });

            const token  = resposta.data.token;
            const usuario = resposta.data.usuario;

            token_acesso.value   = token;
            usuario_logado.value = usuario;

            localStorage.setItem('nitec_token',   token);
            localStorage.setItem('nitec_usuario', JSON.stringify(usuario));

            // 🟢 Notifica o Electron sobre o tipo de usuário logado
            if (window?.require) {
                try {
                    const { ipcRenderer } = window.require('electron');
                    await ipcRenderer.invoke('notificar-login', {
                        tipo_usuario: usuario.tipo_usuario,
                        tenant_id   : loja,
                    });
                } catch { /* não está no Electron */ }
            }

            // 🟢 Pré-carrega todos os stores persistidos em background
            // Isso garante que os dados ficam disponíveis offline imediatamente
            if (loja !== 'master') {
                pre_carregar_stores().catch(() => {});
            }

            return resposta.data;
        } catch (erro) {
            console.error("Erro no login:", erro);
            throw new Error(erro.response?.data?.mensagem || "Credenciais inválidas ou loja inativa.");
        }
    };

    const encerrar_sessao = () => {
        usuario_logado.value = null;
        token_acesso.value   = null;

        localStorage.removeItem('nitec_token');
        localStorage.removeItem('nitec_usuario');
        localStorage.removeItem('nitec_api_tenant');
        localStorage.removeItem('nitec_modo_suporte');
        localStorage.removeItem('nitec_nome_cliente');
        localStorage.removeItem('nitec_token_admin');
        localStorage.removeItem('nitec_usuario_admin');

        // 🟢 Limpa também os stores persistidos ao sair
        localStorage.removeItem('nitec_mesas_store');
        localStorage.removeItem('nitec_produtos_store');
        localStorage.removeItem('nitec_comandas_store');
    };

    return { usuario_logado, token_acesso, realizar_login, encerrar_sessao };
}, {
    persist: {
        key    : 'nitec_auth_store',
        storage: localStorage,
        pick   : ['usuario_logado', 'token_acesso'],
    }
});

/**
 * Pré-carrega todos os stores persistidos logo após o login.
 * Roda em paralelo e em background — não bloqueia a navegação.
 * Os dados ficam no localStorage via pinia-plugin-persistedstate.
 * Na próxima vez que o usuário acessar qualquer tela, os dados já estão lá.
 */
const pre_carregar_stores = async () => {
    try {
        // Importação dinâmica para evitar circular dependency
        const { useProdutosStore } = await import('./produtos_store.js');
        const { useMesasStore    } = await import('./mesas_store.js');
        const { useComandasStore } = await import('./comandas_store.js');

        const loja_produtos = useProdutosStore();
        const loja_mesas    = useMesasStore();
        const loja_comandas = useComandasStore();

        // Busca tudo em paralelo
        const [r_produtos, r_mesas, r_comandas] = await Promise.allSettled([
            loja_produtos.buscar_produtos(true),
            loja_mesas.buscar_mesas(true),
            loja_comandas.buscar_comandas(true),
        ]);

        console.log('[Auth] Stores pré-carregados:', {
            produtos: r_produtos.status,
            mesas   : r_mesas.status,
            comandas: r_comandas.status,
        });

        // Envia snapshot completo para o servidor local (PC do dono)
        await sincronizar_cache_para_local(
            loja_produtos.lista_produtos,
            loja_mesas.lista_mesas,
            loja_comandas.lista_comandas
        );

        console.log('[Auth] Snapshot completo enviado para o servidor local.');
    } catch (e) {
        console.warn('[Auth] Falha ao pré-carregar stores:', e.message);
    }
};