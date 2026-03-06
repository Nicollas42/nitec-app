import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';

export function useLogicaMesaDetalhes() {
    const rota_atual = useRoute();
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    
    const id_mesa_atual = rota_atual.params.id_mesa;

    const dados_mesa = ref(null);

    const modal_cliente_visivel = ref(false);
    const input_novo_cliente = ref('');

    const carregar_dados_completos = async () => {
        try {
            const resposta = await api_cliente.get(`/detalhes-mesa/${id_mesa_atual}`);
            // 👇 LER DE 'dados' PARA NÃO DAR TELA BRANCA
            dados_mesa.value = resposta.data.dados;
        } catch (erro) {
            alert("Erro ao carregar informações da mesa.");
            voltar_mapa();
        }
    };

    const abrir_pdv_para_comanda = (id_comanda) => {
        roteador.push(`/pdv-caixa?comanda=${id_comanda}`);
    };

    const adicionar_novo_cliente = () => {
        input_novo_cliente.value = '';
        modal_cliente_visivel.value = true;
    };

    const fechar_modal_cliente = () => {
        modal_cliente_visivel.value = false;
    };

    const confirmar_novo_cliente = async () => {
        if (!input_novo_cliente.value) {
            alert("Por favor, digite o nome do cliente.");
            return;
        }

        try {
            await api_cliente.post('/abrir-comanda', {
                mesa_id: id_mesa_atual,
                nome_cliente: input_novo_cliente.value,
                tipo_conta: 'individual' 
            });
            fechar_modal_cliente();
            carregar_dados_completos();
        } catch (erro) {
            alert("Erro ao criar sub-comanda separada.");
        }
    };

    const alterar_quantidade = async (id_item, acao) => {
        try {
            await api_cliente.post(`/alterar-quantidade-item/${id_item}`, { acao });
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) {
            alert(erro.response?.data?.mensagem || "Erro ao atualizar quantidade.");
        }
    };

    const remover_item_consumido = async (id_item_comanda) => {
        if (!confirm("Deseja cancelar estes itens? Eles voltarão para o estoque.")) return;

        try {
            await api_cliente.delete(`/remover-item-comanda/${id_item_comanda}`);
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) {
            alert("Erro ao remover os itens.");
        }
    };

    const fechar_conta_comanda = (id_comanda) => {
        roteador.push(`/pdv-caixa?pagamento=${id_comanda}`);
    };

    const voltar_mapa = () => roteador.push('/mapa-mesas');

    onMounted(() => {
        carregar_dados_completos();
    });

    return {
        dados_mesa, voltar_mapa, abrir_pdv_para_comanda,
        adicionar_novo_cliente, modal_cliente_visivel, input_novo_cliente,
        fechar_modal_cliente, confirmar_novo_cliente, alterar_quantidade,
        remover_item_consumido, fechar_conta_comanda
    };
}