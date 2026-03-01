import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // Importamos o useRoute
import { useProdutosStore } from '../stores/produtos_store.js';
import api_cliente from '../servicos/api_cliente.js';

/**
 * Lógica central operacional da Frente de Caixa (PDV).
 * * @return {Object}
 */
export function useLogicaPdv() {
    const roteador = useRouter();
    const rota_atual = useRoute(); // Para ler os parâmetros da URL
    const loja_produtos = useProdutosStore();
    const carrinho_venda = ref([]);

    // Verifica se a URL tem '?comanda=X'
    const id_comanda_vinculada = ref(rota_atual.query.comanda || null);

    const adicionar_ao_carrinho = (produto_selecionado) => {
        const item_ja_na_comanda = carrinho_venda.value.find(item => item.id === produto_selecionado.id);
        if (item_ja_na_comanda) {
            item_ja_na_comanda.quantidade += 1;
        } else {
            carrinho_venda.value.push({ ...produto_selecionado, quantidade: 1 });
        }
    };

    const remover_do_carrinho = (indice_item) => {
        carrinho_venda.value.splice(indice_item, 1);
    };

    const valor_total_comanda = computed(() => {
        return carrinho_venda.value.reduce((acumulador, item) => acumulador + (item.preco_venda * item.quantidade), 0);
    });

    /**
     * Dispara a ação principal do botão verde (Lançar ou Cobrar).
     * * @return {Promise<void>}
     */
    const processar_acao_principal = async () => {
        if (carrinho_venda.value.length === 0) {
            alert("A comanda está vazia. Adicione produtos primeiro.");
            return;
        }

        if (id_comanda_vinculada.value) {
            // CENÁRIO 1: Lançando na Comanda da Mesa
            try {
                // Formata os dados exatamente como o Laravel espera
                const payload = {
                    itens: carrinho_venda.value.map(item => ({
                        produto_id: item.id,
                        quantidade: item.quantidade,
                        preco_unitario: item.preco_venda
                    }))
                };
                
                await api_cliente.post(`/comandas/${id_comanda_vinculada.value}/adicionar-itens`, payload);
                alert("Produtos lançados na comanda com sucesso!");
                
                // Força a Store de produtos a atualizar o estoque no background
                loja_produtos.buscar_produtos(true);
                
                // Retorna exatamente para a tela anterior (Detalhes da Mesa)
                roteador.go(-1);
                
            } catch (erro) {
                alert("Erro ao lançar produtos. Verifique o console.");
                console.error(erro);
            }
        } else {
            // CENÁRIO 2: Venda Avulsa (Balcão)
            alert("Módulo de Venda Avulsa (Em breve) - Aqui abrirá o Modal de Pagamento (PIX, Cartão, etc).");
        }
    };

    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => {
        loja_produtos.buscar_produtos();
    });

    return {
        lista_produtos: computed(() => loja_produtos.lista_produtos),
        carrinho_venda,
        adicionar_ao_carrinho,
        remover_do_carrinho,
        valor_total_comanda,
        id_comanda_vinculada,
        processar_acao_principal,
        voltar_painel
    };
}