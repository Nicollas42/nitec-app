import { ref, reactive, onMounted, onActivated, watch } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';

export function useLogicaMesaDetalhes() {
    const rota_atual = useRoute();
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    
    const dados_mesa = ref(null);
    const modal_cliente_visivel = ref(false);
    const input_novo_cliente = ref('');

    const modal_cancelamento_visivel = ref(false);
    const cancelando = ref(false);
    const form_cancelamento = reactive({
        comanda_id: null,
        motivo_cancelamento: 'Erro de Digitação / Lançamento',
        retornar_ao_estoque: true 
    });

    const carregar_dados_completos = async () => {
        const id_dinamico = rota_atual.params.id_mesa;
        if (!id_dinamico) return; 

        dados_mesa.value = null;

        try {
            const resposta = await api_cliente.get(`/detalhes-mesa/${id_dinamico}`);
            dados_mesa.value = resposta.data.dados;
        } catch (erro) {
            console.error(erro);
            alert("Erro ao carregar informações da mesa.");
            voltar_mapa();
        }
    };

    watch(() => rota_atual.params.id_mesa, (novo_id) => {
        if (novo_id) carregar_dados_completos();
    });

    const abrir_pdv_para_comanda = (id_comanda) => roteador.push(`/pdv-caixa?comanda=${id_comanda}`);
    
    const fechar_conta_comanda = (id_comanda) => roteador.push(`/pdv-caixa?pagamento=${id_comanda}`);

    const adicionar_novo_cliente = () => { input_novo_cliente.value = ''; modal_cliente_visivel.value = true; };
    const fechar_modal_cliente = () => modal_cliente_visivel.value = false;

    const confirmar_novo_cliente = async () => {
        if (!input_novo_cliente.value) return alert("Por favor, digite o nome do cliente.");
        try {
            await api_cliente.post('/abrir-comanda', {
                mesa_id: rota_atual.params.id_mesa, 
                nome_cliente: input_novo_cliente.value,
                tipo_conta: 'individual'
            });
            fechar_modal_cliente();
            carregar_dados_completos();
        } catch (erro) { alert("Erro ao criar sub-comanda separada."); }
    };

    const alterar_quantidade = async (id_item, acao) => {
        try {
            await api_cliente.post(`/alterar-quantidade-item/${id_item}`, { acao });
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) { alert(erro.response?.data?.mensagem || "Erro ao atualizar quantidade."); }
    };

    const remover_item_consumido = async (id_item_comanda) => {
        if (!confirm("Deseja cancelar estes itens? Eles voltarão para o estoque.")) return;
        try {
            await api_cliente.delete(`/remover-item-comanda/${id_item_comanda}`);
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) { alert("Erro ao remover os itens."); }
    };

    const abrir_modal_cancelamento = (id_comanda) => {
        form_cancelamento.comanda_id = id_comanda;
        form_cancelamento.motivo_cancelamento = 'Erro de Digitação / Lançamento';
        form_cancelamento.retornar_ao_estoque = true;
        modal_cancelamento_visivel.value = true;
    };

    const confirmar_cancelamento = async () => {
        cancelando.value = true;
        try {
            await api_cliente.post(`/fechar-comanda/cancelar/${form_cancelamento.comanda_id}`, {
                motivo_cancelamento: form_cancelamento.motivo_cancelamento,
                retornar_ao_estoque: form_cancelamento.retornar_ao_estoque
            });
            modal_cancelamento_visivel.value = false;
            voltar_mapa(); 
            loja_produtos.buscar_produtos(true); 
        } catch (erro) {
            alert(erro.response?.data?.mensagem || "Erro ao cancelar comanda.");
        } finally {
            cancelando.value = false;
        }
    };

    const voltar_mapa = () => roteador.push('/mapa-mesas');

    onMounted(() => carregar_dados_completos());
    onActivated(() => carregar_dados_completos());

    return {
        dados_mesa, voltar_mapa, abrir_pdv_para_comanda,
        adicionar_novo_cliente, modal_cliente_visivel, input_novo_cliente,
        fechar_modal_cliente, confirmar_novo_cliente, alterar_quantidade, 
        remover_item_consumido, fechar_conta_comanda,
        modal_cancelamento_visivel, form_cancelamento, abrir_modal_cancelamento, 
        confirmar_cancelamento, cancelando 
    };
}