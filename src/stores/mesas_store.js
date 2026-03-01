import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

/**
 * Armazena o estado das mesas na memória global para carregamento instantâneo.
 * * @return {Object}
 */
export const useMesasStore = defineStore('mesas_store', () => {
    const lista_mesas = ref([]);

    /**
     * Busca as mesas no back-end. Se já existirem, não faz o utilizador esperar.
     * * @param {boolean} forcar_atualizacao 
     */
    const buscar_mesas = async (forcar_atualizacao = false) => {
        if (lista_mesas.value.length > 0 && !forcar_atualizacao) {
            return; 
        }

        try {
            const resposta = await api_cliente.get('/mesas/listar');
            lista_mesas.value = resposta.data.mesas;
        } catch (erro) {
            console.error("Erro ao carregar o mapa de mesas:", erro);
        }
    };

    return { 
        lista_mesas, 
        buscar_mesas 
    };
});