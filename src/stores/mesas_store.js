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
        // 🛡️ VACINA 1: Garante que se for undefined, vira um array vazio
        const mesas_atuais = lista_mesas.value || [];

        if (mesas_atuais.length > 0 && !forcar_atualizacao) {
            return; 
        }

        try {
            // URL já no seu padrão de Verbo-Primeiro
            const resposta = await api_cliente.get('/listar-mesas');
            
            // 🛡️ VACINA 2: Procura em 'dados' (que é o que o seu Controller manda)
            // Se não achar, procura em 'mesas'. Se não achar nenhum, assume array vazio [].
            lista_mesas.value = resposta.data.dados || resposta.data.mesas || [];
            
        } catch (erro) {
            console.error("Erro ao carregar o mapa de mesas:", erro);
            lista_mesas.value = []; // Previne o erro "undefined" em caso de falha de internet
        }
    };

    return { 
        lista_mesas, 
        buscar_mesas 
    };
});