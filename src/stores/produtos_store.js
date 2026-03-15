import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { sincronizar_cache_para_local } from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';

export const useProdutosStore = defineStore('produtos_store', () => {
    const lista_produtos     = ref([]);
    const modo_offline       = ref(false);
    const ultima_atualizacao = ref(null);

    /**
     * Busca produtos da VPS ou usa cache persistido.
     * Com persist ativo, os dados ficam no localStorage e nunca somem.
     */
    const buscar_produtos = async (forcar_atualizacao = false) => {
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (usuario_raw) {
            const usuario = JSON.parse(usuario_raw);
            if (usuario.tipo_usuario === 'admin_master') {
                lista_produtos.value = [];
                return;
            }
        }

        // 🟢 Usa cache persistido se tiver dados recentes (menos de 60s)
        const agora = Date.now();
        const cache_fresco = ultima_atualizacao.value && (agora - ultima_atualizacao.value) < 60000;
        if (lista_produtos.value.length > 0 && !forcar_atualizacao && cache_fresco) return;

        try {
            const timestamp = new Date().getTime();
            const resposta  = await api_cliente.get(`/listar-produtos?_t=${timestamp}`);

            const produtos_recebidos = resposta.data.produtos || [];
            lista_produtos.value     = produtos_recebidos;
            ultima_atualizacao.value = agora;
            modo_offline.value       = false;

            // Salva no Dexie e envia para servidor local
            await db.produtos.clear();
            await db.produtos.bulkAdd(produtos_recebidos);
            sincronizar_cache_para_local(produtos_recebidos, null).catch(() => {});

        } catch (erro) {
            console.error("Erro ao carregar produtos:", erro);

            if (erro.response?.status === 401) {
                alert("Sessão expirada. Faça login novamente.");
                localStorage.removeItem('nitec_token');
                localStorage.removeItem('nitec_usuario');
                window.location.href = '/#/login';
                window.location.reload();
                return;
            }

            console.warn("🔴 Offline: usando produtos persistidos.");
            modo_offline.value = true;

            // Se o persist já tem dados, usa sem avisar
            if (lista_produtos.value.length > 0) return;

            // Fallback final: Dexie
            const produtos_salvos = await db.produtos.toArray();
            if (produtos_salvos.length > 0) {
                lista_produtos.value = produtos_salvos;
            } else {
                lista_produtos.value = [];
                alert("Você está offline e não há produtos salvos no dispositivo.");
            }
        }
    };

    return {
        lista_produtos,
        modo_offline,
        ultima_atualizacao,
        buscar_produtos
    };
}, {
    // 🟢 Persistência automática
    persist: {
        key    : 'nitec_produtos_store',
        storage: localStorage,
        pick   : ['lista_produtos', 'ultima_atualizacao'],
    }
});