import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { sincronizar_cache_para_local } from '../servicos/api_cliente.js';

export const useComandasStore = defineStore('comandas_store', () => {
    const lista_comandas     = ref([]);
    const ultima_atualizacao = ref(null);

    /**
     * Busca comandas da VPS com listar_itens incluídos.
     * O backend agora inclui listar_itens.buscar_produto em cada comanda —
     * sem isso o modo offline não tem os itens para exibir nem para o PDV carregar.
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

        const agora        = Date.now();
        const cache_fresco = ultima_atualizacao.value && (agora - ultima_atualizacao.value) < 30000;
        if (lista_comandas.value.length > 0 && !forcar_atualizacao && cache_fresco) return;

        try {
            const resposta  = await api_cliente.get('/listar-comandas');
            const recebidas = resposta.data.comandas || [];

            // 🟢 Proteção: nunca sobrescreve dados existentes com lista vazia
            if (recebidas.length === 0 && lista_comandas.value.length > 0) {
                console.warn('[comandas_store] Resposta vazia ignorada — mantendo dados persistidos.');
                return;
            }

            lista_comandas.value     = recebidas;
            ultima_atualizacao.value = agora;

            // Envia snapshot para o servidor local — inclui itens separados
            sincronizar_cache_para_local(null, null, recebidas).catch(() => {});

        } catch (erro) {
            console.warn("🔴 Offline: usando comandas persistidas (com listar_itens).");
            // Persist já tem dados completos — não limpa
        }
    };

    /**
     * Retorna os itens de uma comanda específica do store persistido.
     * Fallback principal quando offline e /buscar-comanda falha.
     * @param {string|number} id_comanda
     * @returns {Array}
     */
    const obter_itens_comanda = (id_comanda) => {
        const comanda = lista_comandas.value.find(c => String(c.id) === String(id_comanda));
        return comanda?.listar_itens || [];
    };

    /**
     * Atualiza os itens de uma comanda no store local após lançamento offline.
     * Chamado pelo PDV após adicionar itens via servidor local.
     * @param {string|number} id_comanda
     * @param {Array} novos_itens
     */
    const atualizar_itens_comanda = (id_comanda, novos_itens) => {
        const idx = lista_comandas.value.findIndex(c => String(c.id) === String(id_comanda));
        if (idx >= 0) {
            const comanda = lista_comandas.value[idx];
            const itens_existentes = comanda.listar_itens || [];

            // Merge — adiciona novos itens sem duplicar
            const itens_merged = [...itens_existentes];
            for (const novo of novos_itens) {
                const existente = itens_merged.find(i => i.produto_id === novo.produto_id);
                if (existente) {
                    existente.quantidade += novo.quantidade;
                } else {
                    itens_merged.push(novo);
                }
            }

            // Recalcula total
            const total = itens_merged.reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0);
            lista_comandas.value[idx] = {
                ...comanda,
                listar_itens: itens_merged,
                valor_total : total,
            };
        }
    };

    return {
        lista_comandas,
        ultima_atualizacao,
        buscar_comandas,
        obter_itens_comanda,
        atualizar_itens_comanda,
    };
}, {
    persist: {
        key    : 'nitec_comandas_store',
        storage: localStorage,
        pick   : ['lista_comandas', 'ultima_atualizacao'],
    }
});