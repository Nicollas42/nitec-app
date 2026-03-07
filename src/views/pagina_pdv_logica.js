import { ref, computed, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router'; 
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore } from '../stores/mesas_store.js';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';

export function useLogicaPdv() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_produtos = useProdutosStore();
    const loja_mesas = useMesasStore();
    
    const carrinho_venda = ref([]);
    const id_comanda_vinculada = ref(null);
    const id_comanda_pagamento = ref(null);

    // 🟢 REATIVIDADE PARA ABAS INSTANTÂNEAS (KEEP-ALIVE)
    watch(() => rota_atual.query, (novaQuery) => {
        id_comanda_vinculada.value = novaQuery.comanda || null;
        id_comanda_pagamento.value = novaQuery.pagamento || null;

        // 🟢 VACINA VISUAL: Independentemente de ser nova venda ou pagamento, 
        // nós limpamos o carrinho na hora para apagar o lixo da RAM.
        carrinho_venda.value = [];

        if (id_comanda_pagamento.value) {
            carregar_comanda_para_pagamento();
        }
    }, { immediate: true });

    const adicionar_ao_carrinho = (p) => {
        const item = carrinho_venda.value.find(i => i.id === p.id);
        if (item) item.quantidade += 1;
        else carrinho_venda.value.push({ ...p, quantidade: 1 });
    };

    const valor_total_comanda = computed(() => {
        return carrinho_venda.value.reduce((acc, i) => acc + (i.preco_venda * i.quantidade), 0);
    });

    const carregar_comanda_para_pagamento = async () => {
        try {
            const res = await api_cliente.get(`/buscar-comanda/${id_comanda_pagamento.value}`);
            const dados = res.data.dados;
            
            carrinho_venda.value = dados.listar_itens.map(i => ({
                id: i.produto_id,
                nome_produto: i.buscar_produto.nome_produto,
                preco_venda: i.preco_unitario,
                quantidade: i.quantidade
            }));
        } catch (e) {
            console.error("Erro ao carregar itens para fechamento:", e);
        }
    };

    const processar_acao_principal = async () => {
        if (carrinho_venda.value.length === 0) return alert("Adicione produtos ao carrinho.");

        // CENÁRIO: FECHAR CONTA
        if (id_comanda_pagamento.value) {
            try {
                await api_cliente.post(`/fechar-comanda/${id_comanda_pagamento.value}`, {
                    data_hora_fechamento: new Date().toISOString()
                });
                
                alert("💳 Pagamento confirmado! Comanda encerrada.");
                loja_mesas.buscar_mesas(true); 
                roteador.push('/comandas'); 
            } catch (e) { 
                alert("Erro ao processar pagamento."); 
            }
            return;
        }

        // CENÁRIO: LANÇAR NA MESA
        if (id_comanda_vinculada.value) {
            const payload = {
                itens: carrinho_venda.value.map(i => ({
                    produto_id: i.id,
                    quantidade: i.quantidade,
                    preco_unitario: i.preco_venda
                }))
            };
            const url = `/adicionar-itens-comanda/${id_comanda_vinculada.value}`;
            try {
                await api_cliente.post(url, payload);
                alert("Itens lançados!");
                loja_produtos.buscar_produtos(true);
                roteador.go(-1);
            } catch (e) {
                if (!e.response || e.response.status >= 500) {
                    await db.vendas_pendentes.add({
                        tenant_id: localStorage.getItem('nitec_tenant_id'),
                        data_venda: new Date().toISOString(),
                        valor_total: valor_total_comanda.value,
                        url_destino: url, 
                        payload_venda: payload  
                    });
                    alert("⚠️ Offline: Pedido salvo no PC!");
                    roteador.go(-1);
                }
            }
        } else {
            alert("Módulo de Venda Balcão em desenvolvimento.");
        }
    };

    onMounted(() => {
        loja_produtos.buscar_produtos();
    });

    return {
        lista_produtos: computed(() => loja_produtos.lista_produtos),
        carrinho_venda, 
        adicionar_ao_carrinho, 
        remover_do_carrinho: (idx) => carrinho_venda.value.splice(idx, 1),
        valor_total_comanda, 
        id_comanda_vinculada, 
        id_comanda_pagamento, 
        processar_acao_principal, 
        voltar_painel: () => roteador.push('/painel-central')
    };
}