import { ref, computed, onMounted, watch } from 'vue'; 
import { useRouter, useRoute } from 'vue-router'; 
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore } from '../stores/mesas_store.js';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';
import { useToastStore } from '../stores/toast_store.js'; // 🟢 1. Importando o Pop-up Global

export function useLogicaPdv() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_produtos = useProdutosStore();
    const loja_mesas = useMesasStore();
    
    // 🟢 2. Instanciando o Pop-up Global
    const toast_global = useToastStore();
    
    const carrinho_venda = ref([]);
    const id_comanda_vinculada = ref(null);
    const id_comanda_pagamento = ref(null);
    const valor_desconto = ref('');

    const carregar_comanda_para_pagamento = async () => {
        try {
            const res = await api_cliente.get(`/buscar-comanda/${id_comanda_pagamento.value}`);
            const dados = res.data.dados;
            
            carrinho_venda.value = dados.listar_itens.map(i => ({
                id: i.produto_id, nome_produto: i.buscar_produto.nome_produto,
                preco_venda: i.preco_unitario, quantidade: i.quantidade
            }));
        } catch (e) { 
            console.error(e); 
        }
    };

    watch(() => rota_atual.query, (novaQuery) => {
        id_comanda_vinculada.value = novaQuery.comanda || null;
        id_comanda_pagamento.value = novaQuery.pagamento || null;

        carrinho_venda.value = [];
        valor_desconto.value = '';

        if (id_comanda_pagamento.value) carregar_comanda_para_pagamento();
    }, { immediate: true });

    const adicionar_ao_carrinho = (p) => {
        const item = carrinho_venda.value.find(i => i.id === p.id);
        if (item) item.quantidade += 1;
        else carrinho_venda.value.push({ ...p, quantidade: 1 });
    };

    const subtotal_comanda = computed(() => carrinho_venda.value.reduce((acc, i) => acc + (i.preco_venda * i.quantidade), 0));
    const valor_final_comanda = computed(() => Math.max(0, subtotal_comanda.value - (Number(valor_desconto.value) || 0)));

    const processar_acao_principal = async () => {
        // Usa o pop-up vermelho para erro de carrinho vazio
        if (carrinho_venda.value.length === 0) {
            return toast_global.exibir_toast("Adicione produtos ao carrinho.", "erro");
        }

        // CENÁRIO: FECHAR CONTA DA MESA
        if (id_comanda_pagamento.value) {
            try {
                await api_cliente.post(`/fechar-comanda/${id_comanda_pagamento.value}`, {
                    data_hora_fechamento: new Date().toISOString(),
                    desconto: Number(valor_desconto.value) || 0 
                });
                
                loja_mesas.buscar_mesas(true); 
                
                // 🟢 Redireciona imediatamente E mostra a notificação (sem delay!)
                roteador.push('/mapa-mesas');
                toast_global.exibir_toast("💳 Pagamento confirmado!"); 
                 
            } catch (e) { 
                toast_global.exibir_toast("Erro ao processar pagamento.", "erro"); 
            }
            return;
        }

        // CENÁRIO: LANÇAR ITENS NUMA MESA ABERTA
        if (id_comanda_vinculada.value) {
            const payload = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })) };
            try {
                await api_cliente.post(`/adicionar-itens-comanda/${id_comanda_vinculada.value}`, payload);
                loja_produtos.buscar_produtos(true);
                
                // 🟢 Redireciona imediatamente E mostra a notificação (sem delay!)
                roteador.go(-1);
                toast_global.exibir_toast("📥 Itens lançados na mesa!"); 
                
            } catch (e) {
                if (!e.response || e.response.status >= 500) {
                    await db.vendas_pendentes.add({ tenant_id: localStorage.getItem('nitec_tenant_id'), data_venda: new Date().toISOString(), valor_total: valor_final_comanda.value, url_destino: `/adicionar-itens-comanda/${id_comanda_vinculada.value}`, payload_venda: payload });
                    roteador.go(-1);
                    toast_global.exibir_toast("⚠️ Offline: Pedido salvo no PC!", "erro");
                } else {
                    toast_global.exibir_toast("Erro ao processar.", "erro");
                }
            }
        } 
        
        // CENÁRIO: VENDA BALCÃO
        else {
            if (!confirm(`Finalizar venda avulsa: R$ ${valor_final_comanda.value.toFixed(2)}?`)) return;
            try {
                await api_cliente.post('/venda-balcao', { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), desconto: Number(valor_desconto.value) || 0 });
                
                carrinho_venda.value = [];
                valor_desconto.value = '';
                loja_produtos.buscar_produtos(true); 

                // 🟢 Mostra a notificação imediatamente!
                toast_global.exibir_toast("💸 Venda Balcão concluída!"); 

            } catch (e) { 
                toast_global.exibir_toast("Erro ao processar venda balcão.", "erro"); 
            }
        }
    };

    onMounted(() => loja_produtos.buscar_produtos());

    return {
        lista_produtos: computed(() => loja_produtos.lista_produtos),
        carrinho_venda, adicionar_ao_carrinho, remover_do_carrinho: (idx) => carrinho_venda.value.splice(idx, 1),
        subtotal_comanda, valor_final_comanda, valor_desconto, 
        id_comanda_vinculada, id_comanda_pagamento, 
        processar_acao_principal, voltar_painel: () => roteador.push('/painel-central')
    };
}