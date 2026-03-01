import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

/**
 * Gerencia o estado global do caixa, incluindo vendas offline e carrinho.
 * Implementa persistência automática no LocalStorage.
 * * @return {Object}
 */
export const useCaixaStore = defineStore('caixa_store', () => {
    // Estado
    const fila_pedidos_offline = ref(JSON.parse(localStorage.getItem('nitec_pedidos_offline')) || []);
    const carrinho_atual = ref([]);

    /**
     * Adiciona um pedido à fila de espera para sincronização.
     * * @param {Object} pedido_dados
     * @return {void}
     */
    const salvar_pedido_offline = (pedido_dados) => {
        fila_pedidos_offline.value.push({
            ...pedido_dados,
            id_local: `OFF_${Date.now()}`,
            data_hora: new Date().toISOString()
        });
    };

    /**
     * Limpa a fila após sincronização bem-sucedida com a API Laravel.
     * * @return {void}
     */
    const limpar_fila_sincronizada = () => {
        fila_pedidos_offline.value = [];
    };

    // Observador para persistir a fila sempre que houver mudanças
    watch(fila_pedidos_offline, (nova_fila) => {
        localStorage.setItem('nitec_pedidos_offline', JSON.stringify(nova_fila));
    }, { deep: true });

    return {
        fila_pedidos_offline,
        carrinho_atual,
        salvar_pedido_offline,
        limpar_fila_sincronizada
    };
});