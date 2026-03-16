import { ref, computed, onMounted, watch } from 'vue'; 
import { useRouter, useRoute } from 'vue-router'; 
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore    } from '../stores/mesas_store.js';
import { useComandasStore } from '../stores/comandas_store.js';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaPdv() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_produtos = useProdutosStore();
    const loja_mesas    = useMesasStore();
    const loja_comandas = useComandasStore();
    const toast_global  = useToastStore();
    
    const carrinho_venda = ref([]);
    const itens_ja_lancados = ref([]); 
    const acoes_pendentes_db = ref([]); 
    
    const id_comanda_vinculada = ref(null);
    const id_comanda_pagamento = ref(null);
    const id_mesa_atual = ref(null); // 🟢 Mesa vinculada à comanda (para o QR Sync)
    const valor_desconto = ref('');
    const processando_finalizacao = ref(false); 

    const termo_pesquisa = ref('');
    const categoria_selecionada = ref('todas');
    const produtos_fixados = ref(JSON.parse(localStorage.getItem('nitec_pdv_fixados') || '[]'));

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

        // 1. Já prepara os itens fantasmas (offline) para o caso de precisarmos deles
        const id_mesa = rota_atual.query.mesa;
        let itens_fantasmas = [];
        if (id_mesa) {
            const estado_local = await db.estado_comandas_local.get(`off_${id_mesa}`);
            if (estado_local && estado_local.itens) {
                itens_fantasmas = [...estado_local.itens];
            }
        }
        
        try {
            // 2. Tenta a API (que vai buscar à Nuvem ou ao Localhost pelo interceptor)
            const res = await api_cliente.get(`/buscar-comanda/${id}`);
            let itens_oficiais = res.data.dados.listar_itens || [];

            // 3. Fusão Inteligente: Junta o oficial com os fantasmas que ainda não subiram
            const ids_oficiais = new Set(itens_oficiais.map(i => String(i.uuid_operacao || i.id)));
            const fantasmas_nao_sincronizados = itens_fantasmas.filter(i => !ids_oficiais.has(String(i.uuid_operacao)));

            for (const fant of fantasmas_nao_sincronizados) {
                itens_oficiais.push({
                    id: `off_item_${fant.produto_id}_${Date.now()}`,
                    produto_id: fant.produto_id,
                    quantidade: fant.quantidade,
                    preco_unitario: fant.preco_unitario,
                    buscar_produto: { nome_produto: fant.nome_produto }
                });
            }

            // 4. Agrupa produtos iguais (Resolve linhas duplicadas no carrinho)
            const mapa_agrupado = {};
            for (const it of itens_oficiais) {
                const p_id = String(it.produto_id);
                if (!mapa_agrupado[p_id]) mapa_agrupado[p_id] = { ...it, quantidade: Number(it.quantidade) };
                else mapa_agrupado[p_id].quantidade += Number(it.quantidade);
            }

            itens_ja_lancados.value = Object.values(mapa_agrupado).map(i => ({
                id_item_comanda: i.id,
                produto_id: i.produto_id,
                nome_produto: i.buscar_produto?.nome_produto || `Produto #${i.produto_id}`,
                quantidade: i.quantidade,
                preco_venda: i.preco_unitario
            }));

        } catch(e) { 
            console.error("Falha total ao buscar comanda (Nuvem e Local):", e);
            
            // 5. MODO SOBREVIVÊNCIA EXTREMA: A Nuvem e o PC falharam.
            // Exibe APENAS os itens fantasmas guardados no Dexie do Telemóvel!
            if (itens_fantasmas.length > 0) {
                const mapa_agrupado = {};
                for (const it of itens_fantasmas) {
                    const p_id = String(it.produto_id);
                    if (!mapa_agrupado[p_id]) mapa_agrupado[p_id] = { ...it, quantidade: Number(it.quantidade) };
                    else mapa_agrupado[p_id].quantidade += Number(it.quantidade);
                }
                
                itens_ja_lancados.value = Object.values(mapa_agrupado).map(i => ({
                    id_item_comanda: `off_${i.produto_id}`,
                    produto_id: i.produto_id,
                    nome_produto: i.nome_produto || `Produto #${i.produto_id}`,
                    quantidade: i.quantidade,
                    preco_venda: i.preco_unitario
                }));
            } else {
                toast_global.exibir_toast("Modo Sobrevivência: Lançamento cego...", "aviso");
                itens_ja_lancados.value = [];
            }
        }
    };

    // 🟢 Salva snapshot legível no Dexie para o QR Sync
    const salvar_estado_local = async (comanda_id, novos_itens, uuid_operacao) => {
        try {
            const tenant_id = localStorage.getItem('nitec_tenant_id');
            const estado_existente = await db.estado_comandas_local.get(String(comanda_id));
            const itens_anteriores = estado_existente?.itens || [];

            // Cada item carrega o uuid_operacao do lote — base da deduplicação no merge
            const itens_com_uuid = novos_itens.map(i => ({ ...i, uuid_operacao }));

            await db.estado_comandas_local.put({
                comanda_id: String(comanda_id),
                mesa_id: id_mesa_atual.value,
                tenant_id,
                itens: [...itens_anteriores, ...itens_com_uuid],
                atualizado_em: new Date().toISOString()
            });
        } catch (e) {
            console.error("Erro ao salvar estado local:", e);
        }
    };

    watch(() => rota_atual.query, (novaQuery) => {
        id_comanda_vinculada.value = novaQuery.comanda || null;
        id_comanda_pagamento.value = novaQuery.pagamento || null;
        id_mesa_atual.value = null;
        carrinho_venda.value = [];
        itens_ja_lancados.value = [];
        acoes_pendentes_db.value = []; 
        valor_desconto.value = '';

        // Extrai mesa_id do comanda_id offline (ex: "off_5" → mesa 5)
        const comanda_id = novaQuery.comanda || novaQuery.pagamento;
        if (comanda_id && String(comanda_id).startsWith('off_')) {
            id_mesa_atual.value = String(comanda_id).replace('off_', '');
        }

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
                if (!e.response || e.response.status >= 500) {
                    const url = tarefa.tipo === 'alterar' ? `/alterar-quantidade-item/${tarefa.id}` : `/remover-item-comanda/${tarefa.id}`;
                    const metodo = tarefa.tipo === 'alterar' ? 'POST' : 'DELETE';
                    const payload = tarefa.tipo === 'alterar' ? { acao: tarefa.acao, uuid_operacao: tarefa.uuid_operacao } : { uuid_operacao: tarefa.uuid_operacao };
                    await db.vendas_pendentes.add({
                        tenant_id: localStorage.getItem('nitec_tenant_id'),
                        data_venda: new Date().toISOString(),
                        valor_total: 0, url_destino: url, metodo,
                        payload_venda: payload,
                        uuid_operacao: tarefa.uuid_operacao
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

        // 1. PAGAMENTO DE CONTA
        if (id_comanda_pagamento.value) {
            try {
                if (typeof sincronizar_pendencias_bd === 'function') await sincronizar_pendencias_bd(); 
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
                if (!e.response || e.response.status >= 500 || e.response.status === 404) { 
                    const uuid_pgto = gerarUUID();
                    const payload_pagamento = { data_hora_fechamento: data_atual, desconto: Number(valor_desconto.value) || 0, uuid_operacao: uuid_pgto };
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: `/fechar-comanda/${id_comanda_pagamento.value}`, metodo: 'POST', payload_venda: payload_pagamento, uuid_operacao: uuid_pgto });
                    toast_global.exibir_toast("⚠️ Servidor indisponível: Pagamento salvo no PC!", "aviso");
                    roteador.push('/mapa-mesas');
                } else toast_global.exibir_toast(e.response?.data?.mensagem || "Erro ao processar pagamento.", "erro"); 
            } finally { processando_finalizacao.value = false; }
            return;
        }

        // 2. LANÇAR NA MESA
        if (id_comanda_vinculada.value) {
            try {
                if (typeof sincronizar_pendencias_bd === 'function') await sincronizar_pendencias_bd(); 
                if (carrinho_venda.value.length === 0) {
                    toast_global.exibir_toast("✔️ Comanda atualizada com sucesso!", "sucesso");
                    return roteador.go(-1);
                }
                const uuid_add = gerarUUID();
                const payload = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), uuid_operacao: uuid_add };
                
                // Tenta enviar via API (Se a VPS falhar, o interceptor manda para o Servidor Local)
                await api_cliente.post(`/adicionar-itens-comanda/${id_comanda_vinculada.value}`, payload);
                toast_global.exibir_toast("📥 Novos itens lançados com sucesso!", "sucesso");
                
                loja_produtos.buscar_produtos(true);
                carrinho_venda.value = [];
                roteador.go(-1);
                
            } catch (e) { 
                // SÓ ENTRA AQUI SE A NUVEM E O SERVIDOR LOCAL FALHAREM
                console.error("Falha ao adicionar itens (VPS e Local):", e);
                if (!e.response || e.response.status >= 500 || e.response.status === 404) { 
                    const uuid_add = gerarUUID();
                    const payload = { itens: carrinho_venda.value.map(i => ({ produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda })), uuid_operacao: uuid_add };
                    
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: `/adicionar-itens-comanda/${id_comanda_vinculada.value}`, metodo: 'POST', payload_venda: payload, uuid_operacao: uuid_add });
                    
                    // Salva na comanda fantasma para visualização offline extrema
                    const c_offline = `off_${rota_atual.query.comanda}`;
                    let estado = await db.estado_comandas_local.get(c_offline) || { id: c_offline, itens: [] };
                    for(const it of payload.itens) {
                        estado.itens.push({...it, nome_produto: carrinho_venda.value.find(p => p.id === it.produto_id)?.nome_produto });
                    }
                    await db.estado_comandas_local.put(estado);

                    toast_global.exibir_toast("⚠️ Sobrevivência: Lançamento salvo no telemóvel!", "aviso");
                    carrinho_venda.value = [];
                    roteador.go(-1);
                } else {
                    toast_global.exibir_toast(e.response?.data?.mensagem || "Erro ao atualizar a comanda.", "erro"); 
                }
            } finally { processando_finalizacao.value = false; }
        
        // 3. VENDA BALCÃO AVULSA
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
                if (!e.response || e.response.status >= 500 || e.response.status === 404) { 
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: '/venda-balcao', metodo: 'POST', payload_venda: payload, uuid_operacao: uuid_balcao });
                    toast_global.exibir_toast("⚠️ Servidor indisponível: Venda Balcão salva no PC!", "aviso");
                    carrinho_venda.value = [];
                    valor_desconto.value = '';
                } else toast_global.exibir_toast(e.response?.data?.mensagem || "Erro ao processar venda balcão.", "erro"); 
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
        processar_acao_principal, voltar_painel: () => roteador.push('/painel-central'),
    };
}