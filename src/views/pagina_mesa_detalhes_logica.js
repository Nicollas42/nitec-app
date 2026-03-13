import { ref, reactive, onMounted, onActivated, watch } from 'vue'; 
import { useRoute, useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore } from '../stores/mesas_store.js'; // 🟢 NOVO: Loja de mesas
import { db } from '../banco_local/db.js'; 
import { useToastStore } from '../stores/toast_store.js'; 

export function useLogicaMesaDetalhes() {
    const rota_atual = useRoute();
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    const loja_mesas = useMesasStore(); // 🟢 Instanciado
    const toast_global = useToastStore();
    
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

    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const carregar_dados_completos = async () => {
        const id_dinamico = rota_atual.params.id_mesa;
        if (!id_dinamico) return; 

        dados_mesa.value = null;

        try {
            const resposta = await api_cliente.get(`/detalhes-mesa/${id_dinamico}`);
            dados_mesa.value = resposta.data.dados;
        } catch (erro) {
            if (!erro.response || erro.response.status >= 500) {
                toast_global.exibir_toast("⚠️ Offline: Sessão temporária gerada. Lançamentos serão enfileirados.", "aviso");
                
                // 🟢 MAGIA OFFLINE: Constrói uma mesa virtual para a tela não ficar em branco!
                const mesa_em_cache = loja_mesas.lista_mesas.find(m => String(m.id) === String(id_dinamico)) || { id: id_dinamico, nome_mesa: `Mesa ${id_dinamico}` };
                
                dados_mesa.value = {
                    mesa: mesa_em_cache,
                    comandas: [
                        {
                            id: `off_${id_dinamico}`, // ID Fantasma ("off_5")
                            nome_cliente: 'Novos Lançamentos (Offline)',
                            tipo_conta: 'geral',
                            status_comanda: 'aberta',
                            valor_total: 0,
                            itens: [],
                            is_offline: true
                        }
                    ]
                };
            } else {
                toast_global.exibir_toast("Erro ao carregar informações da mesa.", "erro");
                voltar_mapa();
            }
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
        if (!input_novo_cliente.value) return toast_global.exibir_toast("Digite o nome do cliente.", "erro");
        const payload = { mesa_id: rota_atual.params.id_mesa, nome_cliente: input_novo_cliente.value, tipo_conta: 'individual', uuid_operacao: gerarUUID() };
        try {
            await api_cliente.post('/abrir-comanda', payload);
            fechar_modal_cliente();
            carregar_dados_completos();
        } catch (erro) { 
            if (!erro.response || erro.response.status >= 500) { 
                await db.vendas_pendentes.add({ tenant_id: localStorage.getItem('nitec_tenant_id'), data_venda: new Date().toISOString(), valor_total: 0, url_destino: '/abrir-comanda', metodo: 'POST', payload_venda: payload });
                toast_global.exibir_toast("⚠️ Offline: Criação de conta enviada para a fila!", "aviso");
                fechar_modal_cliente();
                voltar_mapa();
            } else toast_global.exibir_toast("Erro ao criar sub-comanda.", "erro");
        }
    };

    const alterar_quantidade = async (id_item, acao) => {
        const payload = { acao, uuid_operacao: gerarUUID() };
        try {
            await api_cliente.post(`/alterar-quantidade-item/${id_item}`, payload);
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) { 
            if (!erro.response || erro.response.status >= 500) {
                await db.vendas_pendentes.add({ tenant_id: localStorage.getItem('nitec_tenant_id'), data_venda: new Date().toISOString(), valor_total: 0, url_destino: `/alterar-quantidade-item/${id_item}`, metodo: 'POST', payload_venda: payload });
                toast_global.exibir_toast("⚠️ Offline: Alteração guardada no PC!", "aviso");
                voltar_mapa();
            } else toast_global.exibir_toast("Erro ao atualizar quantidade.", "erro"); 
        }
    };

    const remover_item_consumido = async (id_item_comanda) => {
        if (!confirm("Deseja cancelar estes itens? Eles voltarão para o estoque.")) return;
        const payload = { uuid_operacao: gerarUUID() };
        try {
            await api_cliente.delete(`/remover-item-comanda/${id_item_comanda}`, { data: payload });
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) { 
            if (!erro.response || erro.response.status >= 500) {
                await db.vendas_pendentes.add({ tenant_id: localStorage.getItem('nitec_tenant_id'), data_venda: new Date().toISOString(), valor_total: 0, url_destino: `/remover-item-comanda/${id_item_comanda}`, metodo: 'DELETE', payload_venda: payload });
                toast_global.exibir_toast("⚠️ Offline: Remoção enviada para a fila!", "aviso");
                voltar_mapa();
            } else toast_global.exibir_toast("Erro ao remover os itens.", "erro"); 
        }
    };

    const abrir_modal_cancelamento = (id_comanda) => {
        form_cancelamento.comanda_id = id_comanda;
        form_cancelamento.motivo_cancelamento = 'Erro de Digitação / Lançamento';
        form_cancelamento.retornar_ao_estoque = true;
        modal_cancelamento_visivel.value = true;
    };

    const confirmar_cancelamento = async () => {
        cancelando.value = true;
        const payload = { motivo_cancelamento: form_cancelamento.motivo_cancelamento, retornar_ao_estoque: form_cancelamento.retornar_ao_estoque, uuid_operacao: gerarUUID() };
        try {
            await api_cliente.post(`/fechar-comanda/cancelar/${form_cancelamento.comanda_id}`, payload);
            modal_cancelamento_visivel.value = false;
            voltar_mapa(); 
            loja_produtos.buscar_produtos(true); 
        } catch (erro) {
            if (!erro.response || erro.response.status >= 500) {
                await db.vendas_pendentes.add({ tenant_id: localStorage.getItem('nitec_tenant_id'), data_venda: new Date().toISOString(), valor_total: 0, url_destino: `/fechar-comanda/cancelar/${form_cancelamento.comanda_id}`, metodo: 'POST', payload_venda: payload });
                toast_global.exibir_toast("⚠️ Offline: Cancelamento salvo no PC!", "aviso");
                modal_cancelamento_visivel.value = false;
                voltar_mapa();
            } else toast_global.exibir_toast(erro.response?.data?.mensagem || "Erro ao cancelar comanda.", "erro");
        } finally { cancelando.value = false; }
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