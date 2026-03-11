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
    const itens_ja_lancados = ref([]); 
    const acoes_pendentes_db = ref([]); 
    
    const id_comanda_vinculada = ref(null);
    const id_comanda_pagamento = ref(null);
    const valor_desconto = ref('');
    const processando_finalizacao = ref(false); 

    const termo_pesquisa = ref('');
    const categoria_selecionada = ref('todas');
    const produtos_fixados = ref(JSON.parse(localStorage.getItem('nitec_pdv_fixados') || '[]'));

    // 🟢 GERADOR DE CÓDIGO ÚNICO (Impede Vendas Duplicadas)
    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const categorias_unicas = computed(() => {
        const cats = loja_produtos.lista_produtos.map(p => p.categoria).filter(Boolean);
        return ['todas', ...new Set(cats)];
    });

    const alternar_fixacao = (id_produto) => {
        if (produtos_fixados.value.includes(id_produto)) {
            produtos_fixados.value = produtos_fixados.value.filter(id => id !== id_produto);
        } else {
            produtos_fixados.value.push(id_produto);
        }
        localStorage.setItem('nitec_pdv_fixados', JSON.stringify(produtos_fixados.value));
    };

    const produtos_vitrine = computed(() => {
        return loja_produtos.lista_produtos.filter(p => {
            const matchTexto = p.nome_produto.toLowerCase().includes(termo_pesquisa.value.toLowerCase()) || 
                               (p.codigo_barras && p.codigo_barras.includes(termo_pesquisa.value));
            const matchCat = categoria_selecionada.value === 'todas' || p.categoria === categoria_selecionada.value;
            return matchTexto && matchCat;
        }).sort((a, b) => {
            const aFixado = produtos_fixados.value.includes(a.id);
            const bFixado = produtos_fixados.value.includes(b.id);
            if (aFixado && !bFixado) return -1;
            if (!aFixado && bFixado) return 1;
            return a.nome_produto.localeCompare(b.nome_produto);
        });
    });

    const recarregar_dados_comanda = async () => {
        const id = id_comanda_pagamento.value || id_comanda_vinculada.value;
        if (!id) return;
        try {
            const res = await api_cliente.get(`/buscar-comanda/${id}`);
            itens_ja_lancados.value = res.data.dados.listar_itens.map(i => ({
                id_item_comanda: i.id,
                nome_produto: i.buscar_produto.nome_produto,
                quantidade: i.quantidade,
                preco_venda: i.preco_unitario
            }));
        } catch(e) { 
            if (!e.response) toast_global.exibir_toast("Sem internet para carregar os itens.", "erro");
            else console.error(e); 
        }
    };

    watch(() => rota_atual.query, (novaQuery) => {
        id_comanda_vinculada.value = novaQuery.comanda || null;
        id_comanda_pagamento.value = novaQuery.pagamento || null;
        carrinho_venda.value = [];
        itens_ja_lancados.value = [];
        acoes_pendentes_db.value = []; 
        valor_desconto.value = '';

        if (id_comanda_pagamento.value || id_comanda_vinculada.value) {
            recarregar_dados_comanda();
        }
    }, { immediate: true });

    const alterar_quantidade_db = (id_item_comanda, acao) => {
        const item = itens_ja_lancados.value.find(i => i.id_item_comanda === id_item_comanda);
        if (item) {
            if (acao === 'incrementar') item.quantidade++;
            else if (acao === 'decrementar' && item.quantidade > 1) item.quantidade--;
            else if (acao === 'decrementar' && item.quantidade === 1) return remover_item_db(id_item_comanda);
        }
        // Assina a operação com UUID
        acoes_pendentes_db.value.push({ tipo: 'alterar', id: id_item_comanda, acao, uuid_operacao: gerarUUID() });
    };

    const remover_item_db = (id_item_comanda) => {
        itens_ja_lancados.value = itens_ja_lancados.value.filter(i => i.id_item_comanda !== id_item_comanda);
        acoes_pendentes_db.value = acoes_pendentes_db.value.filter(a => a.id !== id_item_comanda);
        acoes_pendentes_db.value.push({ tipo: 'remover', id: id_item_comanda, uuid_operacao: gerarUUID() });
    };

    const adicionar_ao_carrinho = (p) => {
        const item = carrinho_venda.value.find(i => i.id === p.id);
        if (item) item.quantidade += 1;
        else carrinho_venda.value.push({ ...p, quantidade: 1 });
    };

    const remover_do_carrinho = (idx) => carrinho_venda.value.splice(idx, 1);

    const alterar_quantidade_novo = (idx, acao) => {
        if (acao === 'incrementar') carrinho_venda.value[idx].quantidade++;
        else if (acao === 'decrementar') {
            if (carrinho_venda.value[idx].quantidade > 1) carrinho_venda.value[idx].quantidade--;
            else remover_do_carrinho(idx);
        }
    };

    const subtotal_comanda = computed(() => {
        const soma_novos = carrinho_venda.value.reduce((acc, i) => acc + (i.preco_venda * i.quantidade), 0);
        const soma_antigos = itens_ja_lancados.value.reduce((acc, i) => acc + (i.preco_venda * i.quantidade), 0);
        return soma_novos + soma_antigos;
    });

    const valor_final_comanda = computed(() => Math.max(0, subtotal_comanda.value - (Number(valor_desconto.value) || 0)));

    const sincronizar_pendencias_bd = async () => {
        for (const tarefa of acoes_pendentes_db.value) {
            try {
                if (tarefa.tipo === 'alterar') {
                    await api_cliente.post(`/alterar-quantidade-item/${tarefa.id}`, { acao: tarefa.acao, uuid_operacao: tarefa.uuid_operacao });
                } else if (tarefa.tipo === 'remover') {
                    await api_cliente.delete(`/remover-item-comanda/${tarefa.id}`, { data: { uuid_operacao: tarefa.uuid_operacao } });
                }
            } catch (e) {
                if (!e.response) {
                    const url = tarefa.tipo === 'alterar' ? `/alterar-quantidade-item/${tarefa.id}` : `/remover-item-comanda/${tarefa.id}`;
                    const metodo = tarefa.tipo === 'alterar' ? 'POST' : 'DELETE';
                    const payload = tarefa.tipo === 'alterar' ? { acao: tarefa.acao, uuid_operacao: tarefa.uuid_operacao } : { uuid_operacao: tarefa.uuid_operacao };
                    
                    await db.vendas_pendentes.add({
                        tenant_id: localStorage.getItem('nitec_tenant_id'),
                        data_venda: new Date().toISOString(),
                        valor_total: 0, url_destino: url, metodo, payload_venda: payload
                    });
                } else throw e; 
            }
        }
        acoes_pendentes_db.value = []; 
    };

    const processar_acao_principal = async () => {
        if (processando_finalizacao.value) return;

        if (carrinho_venda.value.length === 0 && acoes_pendentes_db.value.length === 0 && !id_comanda_pagamento.value) {
            return toast_global.exibir_toast("Nenhuma alteração foi feita.", "erro");
        }

        processando_finalizacao.value = true;
        const data_atual = new Date().toISOString();
        const tenant_id = localStorage.getItem('nitec_tenant_id');

        // 🟢 1. PAGAMENTO DE CONTA
        if (id_comanda_pagamento.value) {
            try {
                await sincronizar_pendencias_bd(); 
                if (carrinho_venda.value.length > 0) {
                    const payload_add = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), uuid_operacao: gerarUUID() };
                    await api_cliente.post(`/adicionar-itens-comanda/${id_comanda_pagamento.value}`, payload_add);
                }
                
                const uuid_pgto = gerarUUID();
                const payload_pagamento = { data_hora_fechamento: data_atual, desconto: Number(valor_desconto.value) || 0, uuid_operacao: uuid_pgto };
                const res = await api_cliente.post(`/fechar-comanda/${id_comanda_pagamento.value}`, payload_pagamento);
                
                loja_mesas.buscar_mesas(true); 
                roteador.push('/mapa-mesas');
                toast_global.exibir_toast(res.data.mensagem || "Processado com sucesso!", "sucesso"); 
            } catch (e) { 
                if (!e.response) { 
                    const payload_pagamento = { data_hora_fechamento: data_atual, desconto: Number(valor_desconto.value) || 0, uuid_operacao: gerarUUID() };
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: `/fechar-comanda/${id_comanda_pagamento.value}`, metodo: 'POST', payload_venda: payload_pagamento });
                    toast_global.exibir_toast("⚠️ Pagamento salvo no Modo Offline!", "erro");
                    roteador.push('/mapa-mesas');
                } else toast_global.exibir_toast("Erro ao processar pagamento.", "erro"); 
            } finally { processando_finalizacao.value = false; }
            return;
        }

        // 🟢 2. LANÇAR NA MESA
        if (id_comanda_vinculada.value) {
            try {
                await sincronizar_pendencias_bd(); 
                if (carrinho_venda.value.length === 0) {
                    toast_global.exibir_toast("✔️ Comanda atualizada com sucesso!", "sucesso");
                    return roteador.go(-1);
                }
                const uuid_add = gerarUUID();
                const payload = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), uuid_operacao: uuid_add };
                await api_cliente.post(`/adicionar-itens-comanda/${id_comanda_vinculada.value}`, payload);
                toast_global.exibir_toast("📥 Novos itens lançados com sucesso!", "sucesso"); 
                loja_produtos.buscar_produtos(true);
                roteador.go(-1);
            } catch (e) { 
                if (!e.response) { 
                    const payload = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), uuid_operacao: gerarUUID() };
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: `/adicionar-itens-comanda/${id_comanda_vinculada.value}`, metodo: 'POST', payload_venda: payload });
                    toast_global.exibir_toast("⚠️ Offline: Lançamento salvo no PC!", "erro");
                    roteador.go(-1);
                } else toast_global.exibir_toast("Erro ao atualizar a comanda.", "erro"); 
            } finally { processando_finalizacao.value = false; }
        
        // 🟢 3. VENDA BALCÃO AVULSA
        } else {
            const uuid_balcao = gerarUUID();
            const payload = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), desconto: Number(valor_desconto.value) || 0, uuid_operacao: uuid_balcao };
            try {
                await api_cliente.post('/venda-balcao', payload);
                toast_global.exibir_toast("💸 Venda Balcão concluída!", "sucesso"); 
                carrinho_venda.value = [];
                valor_desconto.value = '';
                loja_produtos.buscar_produtos(true); 
            } catch (e) { 
                if (!e.response) { 
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: '/venda-balcao', metodo: 'POST', payload_venda: payload });
                    toast_global.exibir_toast("⚠️ Offline: Venda Balcão salva no PC!", "erro");
                    carrinho_venda.value = [];
                    valor_desconto.value = '';
                } else toast_global.exibir_toast("Erro ao processar venda balcão.", "erro"); 
            } finally { processando_finalizacao.value = false; }
        }
    };

    onMounted(() => loja_produtos.buscar_produtos());

    return {
        produtos_vitrine, categorias_unicas, termo_pesquisa, categoria_selecionada, 
        produtos_fixados, alternar_fixacao,
        carrinho_venda, itens_ja_lancados, alterar_quantidade_db, remover_item_db, processando_finalizacao,
        adicionar_ao_carrinho, remover_do_carrinho, alterar_quantidade_novo,
        subtotal_comanda, valor_final_comanda, valor_desconto, 
        id_comanda_vinculada, id_comanda_pagamento, 
        processar_acao_principal, voltar_painel: () => roteador.push('/painel-central')
    };
}