import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

/**
 * Armazena a lista de produtos na memória RAM para acesso instantâneo (Zero Delay).
 * * @return {Object}
 */
export const useProdutosStore = defineStore('produtos_store', () => {
    const lista_produtos = ref([]);

    /**
     * Busca os produtos na API. Só faz a requisição se a lista estiver vazia,
     * ou se for forçado (como após cadastrar um novo produto).
     * * @param {boolean} forcar_atualizacao 
     */
    const buscar_produtos = async (forcar_atualizacao = false) => {
        if (lista_produtos.value.length > 0 && !forcar_atualizacao) {
            return; // Já temos os dados, não faz o utilizador esperar!
        }

        try {
            const resposta = await api_cliente.get('/produtos/listar');
            lista_produtos.value = resposta.data.produtos;
        } catch (erro) {
            console.error("Erro ao carregar catálogo:", erro);
        }
    };

    return { 
        lista_produtos, 
        buscar_produtos 
    };
});