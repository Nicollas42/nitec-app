import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { sincronizar_cache_para_local } from '../servicos/api_cliente.js';

export const useComandasStore = defineStore('comandas_store', () => {
    const lista_comandas     = ref([]);
    const ultima_atualizacao = ref(null);

    /**
     * Busca comandas da VPS ou usa cache persistido.
     * Nunca limpa os dados existentes se offline — mantém o que tem.
     */
    const buscar_comandas = async (forcar_atualizacao = false) => {
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (usuario_raw) {
            const usuario = JSON.parse(usuario_raw);
            if (usuario.tipo_usuario === 'admin_master') {
                lista_comandas.value = [];
                return;
            }
        }

        // Usa cache se tiver dados recentes (menos de 30s)
        const agora = Date.now();
        const cache_fresco = ultima_atualizacao.value && (agora - ultima_atualizacao.value) < 30000;
        if (lista_comandas.value.length > 0 && !forcar_atualizacao && cache_fresco) return;

        try {
            const resposta = await api_cliente.get('/listar-comandas');
            lista_comandas.value     = resposta.data.comandas || [];
            ultima_atualizacao.value = agora;

            // Envia para servidor local
            sincronizar_cache_para_local(null, null, lista_comandas.value).catch(() => {});

        } catch (erro) {
            console.warn("🔴 Offline: usando comandas persistidas.");
            // Mantém o que já está no store — não limpa
        }
    };

    return {
        lista_comandas,
        ultima_atualizacao,
        buscar_comandas,
    };
}, {
    persist: {
        key    : 'nitec_comandas_store',
        storage: localStorage,
        pick   : ['lista_comandas', 'ultima_atualizacao'],
    }
});