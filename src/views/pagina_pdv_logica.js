import { ref, computed, onMounted, watch } from 'vue'; 
import { useRouter, useRoute } from 'vue-router'; 
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore } from '../stores/mesas_store.js';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaPdv() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_produtos = useProdutosStore();
    const loja_mesas = useMesasStore();
    const toast_global = useToastStore();
    
    const carrinho_venda = ref([]);
    const id_comanda_vinculada = ref(null);
    const id_comanda_pagamento = ref(null);
    const valor_desconto = ref('');

    // 🟢 NOVOS ESTADOS PARA O MOTOR DE BUSCA E FIXAÇÃO
    const termo_pesquisa = ref('');
    const categoria_selecionada = ref('todas');
    const produtos_fixados = ref(JSON.parse(localStorage.getItem('nitec_pdv_fixados') || '[]'));

    // 🟢 Extrai as categorias dinamicamente do que vem do banco
    const categorias_unicas = computed(() => {
        const cats = loja_produtos.lista_produtos.map(p => p.categoria).filter(Boolean);
        return ['todas', ...new Set(cats)];
    });

    // 🟢 Fixa ou desfixa o produto salvando no aparelho do utilizador
    const alternar_fixacao = (id_produto) => {
        if (produtos_fixados.value.includes(id_produto)) {
            produtos_fixados.value = produtos_fixados.value.filter(id => id !== id_produto);
        } else {
            produtos_fixados.value.push(id_produto);
        }
        localStorage.setItem('nitec_pdv_fixados', JSON.stringify(produtos_fixados.value));
    };

    // 🟢 Motor que filtra e organiza os produtos na tela
    const produtos_vitrine = computed(() => {
        return loja_produtos.lista_produtos.filter(p => {
            const matchTexto = p.nome_produto.toLowerCase().includes(termo_pesquisa.value.toLowerCase()) || 
                               (p.codigo_barras && p.codigo_barras.includes(termo_pesquisa.value));
            const matchCat = categoria_selecionada.value === 'todas' || p.categoria === categoria_selecionada.value;
            return matchTexto && matchCat;
        }).sort((a, b) => {
            const aFixado = produtos_fixados.value.includes(a.id);
            const bFixado = produtos_fixados.value.includes(b.id);
            
            // Fixados ficam sempre no topo
            if (aFixado && !bFixado) return -1;
            if (!aFixado && bFixado) return 1;
            
            // O restante fica em ordem alfabética
            return a.nome_produto.localeCompare(b.nome_produto);
        });
    });

    const carregar_comanda_para_pagamento = async () => {
        try {
            const res = await api_cliente.get(`/buscar-comanda/${id_comanda_pagamento.value}`);
            const dados = res.data.dados;
            carrinho_venda.value = dados.listar_itens.map(i => ({
                id: i.produto_id, nome_produto: i.buscar_produto.nome_produto,
                preco_venda: i.preco_unitario, quantidade: i.quantidade
            }));
        } catch (e) { console.error(e); }
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
        
        // 🟢 Correção Garantida: Só bloqueia o carrinho vazio SE NÃO FOR PAGAMENTO DE COMANDA
        if (carrinho_venda.value.length === 0 && !id_comanda_pagamento.value) {
            return toast_global.exibir_toast("Adicione produtos ao carrinho.", "erro");
        }

        if (id_comanda_pagamento.value) {
            try {
                const res = await api_cliente.post(`/fechar-comanda/${id_comanda_pagamento.value}`, {
                    data_hora_fechamento: new Date().toISOString(),
                    desconto: Number(valor_desconto.value) || 0 
                });
                loja_mesas.buscar_mesas(true); 
                roteador.push('/mapa-mesas');
                toast_global.exibir_toast(res.data.mensagem || "Processado com sucesso!", "sucesso"); 
            } catch (e) { toast_global.exibir_toast("Erro ao processar pagamento.", "erro"); }
            return;
        }

        if (id_comanda_vinculada.value) {
            const payload = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })) };
            try {
                await api_cliente.post(`/adicionar-itens-comanda/${id_comanda_vinculada.value}`, payload);
                toast_global.exibir_toast("📥 Itens lançados na mesa!", "sucesso"); 
                loja_produtos.buscar_produtos(true);
                roteador.go(-1);
            } catch (e) {
                if (!e.response || e.response.status >= 500) {
                    await db.vendas_pendentes.add({ tenant_id: localStorage.getItem('nitec_tenant_id'), data_venda: new Date().toISOString(), valor_total: valor_final_comanda.value, url_destino: `/adicionar-itens-comanda/${id_comanda_vinculada.value}`, payload_venda: payload });
                    toast_global.exibir_toast("⚠️ Offline: Pedido salvo no PC!", "erro");
                    roteador.go(-1);
                }
            }
        } else {
            if (!confirm(`Finalizar venda avulsa: R$ ${valor_final_comanda.value.toFixed(2)}?`)) return;
            try {
                await api_cliente.post('/venda-balcao', { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), desconto: Number(valor_desconto.value) || 0 });
                toast_global.exibir_toast("💸 Venda Balcão concluída!", "sucesso"); 
                carrinho_venda.value = [];
                valor_desconto.value = '';
                loja_produtos.buscar_produtos(true); 
            } catch (e) { toast_global.exibir_toast("Erro ao processar venda balcão.", "erro"); }
        }
    };

    onMounted(() => loja_produtos.buscar_produtos());

    return {
        // 🟢 Exportamos o produtos_vitrine para o visual
        produtos_vitrine, categorias_unicas, termo_pesquisa, categoria_selecionada, 
        produtos_fixados, alternar_fixacao,
        carrinho_venda, adicionar_ao_carrinho, remover_do_carrinho: (idx) => carrinho_venda.value.splice(idx, 1),
        subtotal_comanda, valor_final_comanda, valor_desconto, 
        id_comanda_vinculada, id_comanda_pagamento, 
        processar_acao_principal, voltar_painel: () => roteador.push('/painel-central')
    };
}