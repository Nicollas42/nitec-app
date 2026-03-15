import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { sincronizar_cache_para_local } from '../servicos/api_cliente.js';

export const useComandasStore = defineStore('comandas_store', () => {
    const lista_comandas     = ref([]);
    const ultima_atualizacao = ref(null);

    const buscar_comandas = async (forcar_atualizacao = false) => {
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (usuario_raw) {
            const usuario = JSON.parse(usuario_raw);
            if (usuario.tipo_usuario === 'admin_master') {
                lista_comandas.value = [];
                return;
            }
        }

        const agora       = Date.now();
        const cache_fresco = ultima_atualizacao.value && (agora - ultima_atualizacao.value) < 30000;
        if (lista_comandas.value.length > 0 && !forcar_atualizacao && cache_fresco) return;

        try {
            const resposta   = await api_cliente.get('/listar-comandas');
            const recebidas  = resposta.data.comandas || [];

            // 🟢 PROTEÇÃO CRÍTICA: nunca sobrescreve dados existentes com lista vazia
            // O servidor local pode retornar vazio se o snapshot ainda não chegou
            if (recebidas.length === 0 && lista_comandas.value.length > 0) {
                console.warn('[comandas_store] Resposta vazia ignorada — mantendo dados persistidos.');
                return;
            }

            lista_comandas.value     = recebidas;
            ultima_atualizacao.value = agora;

            sincronizar_cache_para_local(null, null, recebidas).catch(() => {});

        } catch (erro) {
            console.warn("🔴 Offline: usando comandas persistidas.");
            // Persist já tem dados — não limpa, não substitui
        }
    };

    return { lista_comandas, ultima_atualizacao, buscar_comandas };
}, {
    persist: {
        key    : 'nitec_comandas_store',
        storage: localStorage,
        pick   : ['lista_comandas', 'ultima_atualizacao'],
    }
});