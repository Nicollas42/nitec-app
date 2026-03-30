import { ref, computed, onMounted, watch } from 'vue'; 
import { useRouter, useRoute } from 'vue-router'; 
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore    } from '../stores/mesas_store.js';
import { useComandasStore } from '../stores/comandas_store.js';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';
import { useToastStore } from '../stores/toast_store.js';

/**
 * Centraliza a logica operacional do PDV, incluindo vendas e modo offline.
 */
export function use_logica_pdv() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_produtos = useProdutosStore();
    const loja_mesas    = useMesasStore();
    const loja_comandas = useComandasStore();
    const toast_global  = useToastStore();
    
    const carrinho_venda = ref([]);
    const itens_ja_lancados = ref([]); 
    const acoes_pendentes_db = ref([]); 
    
    const id_comanda_vinculada  = ref(null);
    const id_comanda_pagamento  = ref(null);
    const id_mesa_atual         = ref(null);
    const ids_pagamento_total   = ref([]); // pagamento de TODAS as comandas da mesa de uma vez
    const total_mesa_externo    = ref(0);  // valor total passado via query param
    const valor_desconto        = ref('');
    const forma_pagamento       = ref('dinheiro');
    const processando_finalizacao = ref(false);

    // 🟢 Controle UI (Mobile)
    const carrinho_expandido = ref(false);

    const termo_pesquisa = ref('');
    const categoria_selecionada = ref('todas');
    const produtos_fixados = ref(JSON.parse(localStorage.getItem('nitec_pdv_fixados') || '[]'));
    const avisos_excedente_emitidos = ref({});

    // Modal de adicionais
    const modal_adicionais_visivel = ref(false);
    const produto_adicionais_temp = ref(null);     // produto selecionado temporariamente
    const selecao_adicionais_temp = ref({});        // { item_adicional_id: qtd }

    /**
     * Retorna todos os codigos pesquisaveis do produto para uso no PDV.
     *
     * @param {Record<string, any>} produto
     * @returns {string[]}
     */
    const obter_codigos_pesquisaveis = (produto) => {
        const codigos_barras = Array.isArray(produto?.codigos_barras) ? produto.codigos_barras : [];
        const codigo_principal = produto?.codigo_barras_principal ? [produto.codigo_barras_principal] : [];

        return [...new Set([produto?.codigo_interno, ...codigo_principal, ...codigos_barras].filter(Boolean).map(String))];
    };

    /**
     * Verifica se o produto corresponde ao termo digitado no PDV.
     *
     * @param {Record<string, any>} produto
     * @param {string} termo
     * @returns {boolean}
     */
    const produto_corresponde_termo = (produto, termo) => {
        const termo_normalizado = termo.toLowerCase().trim();

        if (!termo_normalizado) {
            return true;
        }

        const nome_corresponde = produto.nome_produto.toLowerCase().includes(termo_normalizado);
        const codigo_corresponde = obter_codigos_pesquisaveis(produto).some((codigo) => {
            return codigo.toLowerCase().includes(termo_normalizado);
        });

        return nome_corresponde || codigo_corresponde;
    };

    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    // Categorias vindas da tabela categorias_produtos (via API), com fallback para
    // as categorias dos próprios produtos caso a API falhe.
    const categorias_unicas = ref(['todas']);

    const carregar_categorias = async () => {
        try {
            const resposta = await api_cliente.get('/produtos/categorias');
            const lista = resposta.data?.categorias || [];
            // Ordena: 'Geral' primeiro, restante em ordem alfabética
            const ordenadas = [...lista].sort((a, b) => {
                if (a === 'Geral') return -1;
                if (b === 'Geral') return 1;
                return a.localeCompare(b);
            });
            categorias_unicas.value = ['todas', ...ordenadas];
        } catch {
            // Fallback: extrai das categorias já carregadas nos produtos
            const cats = loja_produtos.lista_produtos.map(p => p.categoria).filter(Boolean);
            categorias_unicas.value = ['todas', ...new Set(cats)];
        }
    };

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
            const matchTexto = produto_corresponde_termo(p, termo_pesquisa.value);
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

    const quantidade_selecionada_por_produto = computed(() => {
        return carrinho_venda.value.reduce((mapa, item) => {
            mapa[item.id] = (mapa[item.id] || 0) + Number(item.quantidade || 0);
            return mapa;
        }, {});
    });

    const obter_estoque_numerico = (produto) => Math.max(0, Number(produto?.estoque_atual) || 0);
    const quantidade_selecionada = (produto_id) => quantidade_selecionada_por_produto.value[produto_id] || 0;
    const estoque_disponivel_visual = (produto) => Math.max(0, obter_estoque_numerico(produto) - quantidade_selecionada(produto.id));
    const quantidade_excedente = (produto) => Math.max(0, quantidade_selecionada(produto.id) - obter_estoque_numerico(produto));
    const tem_excedente = (produto) => quantidade_excedente(produto) > 0;

    const limpar_aviso_excedente = (produto_id) => {
        if (!avisos_excedente_emitidos.value[produto_id]) return;
        delete avisos_excedente_emitidos.value[produto_id];
        avisos_excedente_emitidos.value = { ...avisos_excedente_emitidos.value };
    };

    const marcar_aviso_excedente = (produto_id) => {
        avisos_excedente_emitidos.value = { ...avisos_excedente_emitidos.value, [produto_id]: true };
    };

    const calcular_excedentes_carrinho = () => {
        return carrinho_venda.value
            .map(item => {
                const estoque_atual = obter_estoque_numerico(item);
                const excedente = Math.max(0, Number(item.quantidade || 0) - estoque_atual);
                return excedente > 0 ? { item, excedente } : null;
            })
            .filter(Boolean);
    };

    /**
     * Registra ajustes operacionais de estoque quando o PDV excede o saldo atual.
     */
    const registrar_entradas_forcadas = async () => {
        const excedentes = calcular_excedentes_carrinho();
        if (excedentes.length === 0) return;

        for (const { item, excedente } of excedentes) {
            const payload = {
                modo_entrada: 'ajuste_pdv',
                produto_id: item.id,
                quantidade_comprada: excedente,
                custo_unitario_compra: Number(item.preco_custo_medio || 0),
            };

            try {
                await api_cliente.post('/estoque/registrar-entrada', payload);
            } catch (e) {
                console.error('Falha ao registrar entrada forcada:', e);
                const erro = new Error(e.response?.data?.mensagem || `Nao foi possivel registrar a Entrada Forcada de ${item.nome_produto}.`);
                erro.entrada_forcada = true;
                throw erro;
            }
        }
    };

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
            // Chave inclui adicionais para não fundir itens com extras diferentes
            const mapa_agrupado = {};
            for (const it of itens_oficiais) {
                const ads = (it.adicionais || []).map(a => `${a.item_adicional_id}:${a.quantidade||1}`).sort().join(',');
                const chave = `${it.produto_id}_${ads}`;
                if (!mapa_agrupado[chave]) mapa_agrupado[chave] = { ...it, quantidade: Number(it.quantidade) };
                else mapa_agrupado[chave].quantidade += Number(it.quantidade);
            }

            itens_ja_lancados.value = Object.values(mapa_agrupado).map(i => ({
                id_item_comanda: i.id,
                produto_id: i.produto_id,
                nome_produto: i.buscar_produto?.nome_produto || `Produto #${i.produto_id}`,
                quantidade: i.quantidade,
                preco_venda: i.preco_unitario,
                adicionais: (i.adicionais || []).map(a => ({
                    id: a.item_adicional_id,
                    nome: a.buscar_item_adicional?.nome || `#${a.item_adicional_id}`,
                    preco_unitario: Number(a.preco_unitario) || 0,
                    quantidade: a.quantidade || 1,
                })),
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
        id_comanda_vinculada.value = novaQuery.comanda  || null;
        id_comanda_pagamento.value = novaQuery.pagamento || null;
        ids_pagamento_total.value  = novaQuery.pagamento_total
            ? String(novaQuery.pagamento_total).split(',').filter(Boolean)
            : [];
        total_mesa_externo.value   = novaQuery.total_mesa ? Number(novaQuery.total_mesa) : 0;
        id_mesa_atual.value        = null;
        carrinho_venda.value       = [];
        avisos_excedente_emitidos.value = {};
        itens_ja_lancados.value    = [];
        acoes_pendentes_db.value   = [];
        valor_desconto.value       = '';
        forma_pagamento.value      = 'dinheiro';

        // Extrai mesa_id do comanda_id offline (ex: "off_5" → mesa 5)
        const comanda_id = novaQuery.comanda || novaQuery.pagamento;
        if (comanda_id && String(comanda_id).startsWith('off_')) {
            id_mesa_atual.value = String(comanda_id).replace('off_', '');
        }

        if (id_comanda_pagamento.value || id_comanda_vinculada.value) {
            recarregar_dados_comanda();
        }

        if (ids_pagamento_total.value.length > 0) {
            recarregar_dados_total_mesa();
        }
    }, { immediate: true });

    // Busca os itens de TODAS as comandas da mesa e os mescla num único carrinho de pagamento.
    // Espelha o comportamento de recarregar_dados_comanda, mas para múltiplos IDs.
    const recarregar_dados_total_mesa = async () => {
        const ids = ids_pagamento_total.value;
        if (!ids.length) return;

        try {
            const respostas = await Promise.all(ids.map(id => api_cliente.get(`/buscar-comanda/${id}`)));
            const todos_itens = respostas.flatMap(res => res.data.dados.listar_itens || []);

            // Agrupa produtos iguais somando quantidades (chave inclui adicionais)
            const mapa = {};
            for (const it of todos_itens) {
                const ads = (it.adicionais || []).map(a => `${a.item_adicional_id}:${a.quantidade||1}`).sort().join(',');
                const chave = `${it.produto_id}_${ads}`;
                if (!mapa[chave]) mapa[chave] = { ...it, quantidade: Number(it.quantidade) };
                else mapa[chave].quantidade += Number(it.quantidade);
            }

            itens_ja_lancados.value = Object.values(mapa).map(i => ({
                id_item_comanda: i.id,
                produto_id     : i.produto_id,
                nome_produto   : i.buscar_produto?.nome_produto || `Produto #${i.produto_id}`,
                quantidade     : i.quantidade,
                preco_venda    : i.preco_unitario,
                adicionais     : (i.adicionais || []).map(a => ({
                    id: a.item_adicional_id,
                    nome: a.buscar_item_adicional?.nome || `#${a.item_adicional_id}`,
                    preco_unitario: Number(a.preco_unitario) || 0,
                    quantidade: a.quantidade || 1,
                })),
            }));

            // Recalcula o total real (mais preciso que o total_mesa passado via URL)
            total_mesa_externo.value = itens_ja_lancados.value.reduce((acc, i) => {
                const extras = (i.adicionais || []).reduce((s, a) => s + (a.preco_unitario || 0) * (a.quantidade || 1), 0);
                return acc + i.quantidade * (i.preco_venda + extras);
            }, 0);
        } catch (e) {
            console.error('[pagar_tudo] Erro ao carregar itens das comandas:', e);
            toast_global.exibir_toast('Erro ao carregar itens da mesa.', 'erro');
        }
    };

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
        // Se o produto tem grupos de adicionais, abre o modal
        if (p.tem_adicionais && p.grupos_adicionais && p.grupos_adicionais.length > 0) {
            produto_adicionais_temp.value = p;
            selecao_adicionais_temp.value = {};
            modal_adicionais_visivel.value = true;
            return;
        }

        // Produto sem adicionais — comportamento original
        _inserir_no_carrinho(p, []);
    };

    /**
     * Gera uma chave única para o item no carrinho baseada no produto + adicionais selecionados.
     * Permite que o mesmo produto com adicionais diferentes fique em linhas separadas.
     */
    const _gerar_chave_carrinho = (produto_id, adicionais) => {
        if (!adicionais || adicionais.length === 0) return String(produto_id);
        const sorted = [...adicionais].sort((a, b) => a.id - b.id).map(a => `${a.id}:${a.qtd}`).join(',');
        return `${produto_id}|${sorted}`;
    };

    const _inserir_no_carrinho = (p, adicionais_selecionados) => {
        const chave = _gerar_chave_carrinho(p.id, adicionais_selecionados);
        const item = carrinho_venda.value.find(i => (i._chave_carrinho || String(i.id)) === chave);
        const estoque_atual = obter_estoque_numerico(p);

        if (item) {
            item.quantidade += 1;
        } else {
            carrinho_venda.value.push({
                ...p,
                quantidade: 1,
                adicionais: adicionais_selecionados,
                _chave_carrinho: chave,
            });
        }

        const quantidade_atual = quantidade_selecionada(p.id);
        if (quantidade_atual > estoque_atual) {
            if (!avisos_excedente_emitidos.value[p.id]) {
                toast_global.exibir_toast(`Estoque cadastrado insuficiente para ${p.nome_produto}. O excedente sera lancado como Entrada Forcada.`, "aviso");
                marcar_aviso_excedente(p.id);
            }
        } else {
            limpar_aviso_excedente(p.id);
        }
    };

    const confirmar_adicionais = () => {
        const p = produto_adicionais_temp.value;
        if (!p) return;

        const adicionais = [];
        for (const grupo of (p.grupos_adicionais || [])) {
            for (const item of (grupo.itens || [])) {
                const qtd = selecao_adicionais_temp.value[item.id] || 0;
                if (qtd > 0) {
                    adicionais.push({ id: item.id, nome: item.nome, preco: Number(item.preco), qtd });
                }
            }
        }

        _inserir_no_carrinho(p, adicionais);
        modal_adicionais_visivel.value = false;
        produto_adicionais_temp.value = null;
    };

    const cancelar_adicionais = () => {
        modal_adicionais_visivel.value = false;
        produto_adicionais_temp.value = null;
    };

    const total_preview_adicionais = computed(() => {
        const p = produto_adicionais_temp.value;
        if (!p) return 0;
        let soma = Number(p.preco_venda) || 0;
        for (const grupo of (p.grupos_adicionais || [])) {
            for (const item of (grupo.itens || [])) {
                const qtd = selecao_adicionais_temp.value[item.id] || 0;
                soma += Number(item.preco) * qtd;
            }
        }
        return soma;
    });

    const alterar_qtd_adicional = (item_id, acao) => {
        const atual = selecao_adicionais_temp.value[item_id] || 0;
        if (acao === 'incrementar') {
            selecao_adicionais_temp.value = { ...selecao_adicionais_temp.value, [item_id]: atual + 1 };
        } else if (acao === 'decrementar' && atual > 0) {
            selecao_adicionais_temp.value = { ...selecao_adicionais_temp.value, [item_id]: atual - 1 };
        }
    };

    const remover_do_carrinho = (idx) => {
        const item = carrinho_venda.value[idx];
        carrinho_venda.value.splice(idx, 1);
        if (item) limpar_aviso_excedente(item.id);
    };

    const alterar_quantidade_novo = (idx, acao) => {
        const item = carrinho_venda.value[idx];
        if (!item) return;

        if (acao === 'incrementar') {
            item.quantidade++;
            const estoque_atual = obter_estoque_numerico(item);
            if (item.quantidade > estoque_atual && !avisos_excedente_emitidos.value[item.id]) {
                toast_global.exibir_toast(`Estoque cadastrado insuficiente para ${item.nome_produto}. O excedente sera lancado como Entrada Forcada.`, "aviso");
                marcar_aviso_excedente(item.id);
            }
        }
        else if (acao === 'decrementar') {
            if (item.quantidade > 1) {
                item.quantidade--;
                if (item.quantidade <= obter_estoque_numerico(item)) limpar_aviso_excedente(item.id);
            }
            else remover_do_carrinho(idx);
        }
    };

    const em_modo_pagar_tudo = computed(() => ids_pagamento_total.value.length > 0);

    /**
     * Calcula o preço unitário total de um item (base + adicionais).
     */
    const _preco_unitario_com_adicionais = (item) => {
        const base = Number(item.preco_venda) || 0;
        const extras = (item.adicionais || []).reduce((s, a) => s + (Number(a.preco) || 0) * (a.qtd || 1), 0);
        return base + extras;
    };

    const subtotal_comanda = computed(() => {
        if (em_modo_pagar_tudo.value) return total_mesa_externo.value;
        const soma_novos = carrinho_venda.value.reduce((acc, i) => acc + (_preco_unitario_com_adicionais(i) * i.quantidade), 0);
        const soma_antigos = itens_ja_lancados.value.reduce((acc, i) => {
            const base = Number(i.preco_venda) || 0;
            const extras = (i.adicionais || []).reduce((s, a) => s + (Number(a.preco_unitario) || 0) * (a.quantidade || 1), 0);
            return acc + (base + extras) * i.quantidade;
        }, 0);
        return soma_novos + soma_antigos;
    });

    const valor_final_comanda = computed(() => Math.max(0, subtotal_comanda.value - (Number(valor_desconto.value) || 0)));

    /**
     * Mapeia os itens do carrinho para o payload da API, incluindo adicionais.
     */
    const _mapear_itens_payload = () => carrinho_venda.value.map(i => {
        const item_payload = { produto_id: i.id, quantidade: i.quantidade, preco_unitario: i.preco_venda };
        if (i.adicionais && i.adicionais.length > 0) {
            item_payload.adicionais = i.adicionais.filter(a => (a.qtd || 0) > 0).map(a => ({
                item_adicional_id: a.id,
                quantidade: a.qtd || 1,
                preco_unitario: Number(a.preco) || 0,
            }));
        }
        return item_payload;
    });

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

        if (carrinho_venda.value.length === 0 && acoes_pendentes_db.value.length === 0 && !id_comanda_pagamento.value && !em_modo_pagar_tudo.value) {
            return toast_global.exibir_toast("Nenhuma alteração foi feita.", "erro");
        }

        const eh_pagamento = em_modo_pagar_tudo.value || !!id_comanda_pagamento.value || !id_comanda_vinculada.value;
        if (eh_pagamento && !forma_pagamento.value) {
            return toast_global.exibir_toast("Selecione a forma de pagamento.", "erro");
        }

        processando_finalizacao.value = true;
        const data_atual = new Date().toISOString();
        const tenant_id = localStorage.getItem('nitec_tenant_id');

        // 0. PAGAMENTO TOTAL DA MESA (todas as comandas de uma vez)
        if (em_modo_pagar_tudo.value) {
            try {
                const desconto_por_comanda = (Number(valor_desconto.value) || 0) / ids_pagamento_total.value.length;
                for (const id of ids_pagamento_total.value) {
                    const uuid_pgto = gerarUUID();
                    const payload_p = { data_hora_fechamento: data_atual, desconto: desconto_por_comanda, forma_pagamento: forma_pagamento.value, uuid_operacao: uuid_pgto };
                    await api_cliente.post(`/fechar-comanda/${id}`, payload_p);
                }
                loja_mesas.buscar_mesas(true);
                roteador.push('/mapa-mesas');
                toast_global.exibir_toast("Mesa fechada com sucesso!", "sucesso");
            } catch (e) {
                toast_global.exibir_toast(e.response?.data?.mensagem || "Erro ao fechar a mesa.", "erro");
            } finally { processando_finalizacao.value = false; }
            return;
        }

        // 1. PAGAMENTO DE CONTA
        if (id_comanda_pagamento.value) {
            try {
                if (typeof sincronizar_pendencias_bd === 'function') await sincronizar_pendencias_bd(); 
                await registrar_entradas_forcadas();
                if (carrinho_venda.value.length > 0) {
                    const payload_add = { itens: _mapear_itens_payload(), uuid_operacao: gerarUUID() };
                    await api_cliente.post(`/adicionar-itens-comanda/${id_comanda_pagamento.value}`, payload_add);
                }
                const uuid_pgto = gerarUUID();
                const payload_pagamento = { data_hora_fechamento: data_atual, desconto: Number(valor_desconto.value) || 0, forma_pagamento: forma_pagamento.value, uuid_operacao: uuid_pgto };
                const res = await api_cliente.post(`/fechar-comanda/${id_comanda_pagamento.value}`, payload_pagamento);
                loja_mesas.buscar_mesas(true); 
                roteador.push('/mapa-mesas');
                toast_global.exibir_toast(res.data.mensagem || "Processado com sucesso!", "sucesso"); 
            } catch (e) { 
                if (e.entrada_forcada) {
                    toast_global.exibir_toast(e.message, "erro");
                    return;
                }
                if (!e.response || e.response.status >= 500 || e.response.status === 404) { 
                    const uuid_pgto = gerarUUID();
                    const payload_pagamento = { data_hora_fechamento: data_atual, desconto: Number(valor_desconto.value) || 0, forma_pagamento: forma_pagamento.value, uuid_operacao: uuid_pgto };
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: `/fechar-comanda/${id_comanda_pagamento.value}`, metodo: 'POST', payload_venda: payload_pagamento, uuid_operacao: uuid_pgto });
                    toast_global.exibir_toast("⚠️ Servidor indisponível: Pagamento salvo no PC!", "aviso");
                    roteador.push('/mapa-mesas');
                } else toast_global.exibir_toast(e.message || e.response?.data?.mensagem || "Erro ao processar pagamento.", "erro"); 
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
                await registrar_entradas_forcadas();
                const uuid_add = gerarUUID();
                const payload = { itens: _mapear_itens_payload(), uuid_operacao: uuid_add };
                
                // Tenta enviar via API (Se a VPS falhar, o interceptor manda para o Servidor Local)
                await api_cliente.post(`/adicionar-itens-comanda/${id_comanda_vinculada.value}`, payload);
                toast_global.exibir_toast("📥 Novos itens lançados com sucesso!", "sucesso");
                
                loja_produtos.buscar_produtos(true);
                carrinho_venda.value = [];
                avisos_excedente_emitidos.value = {};
                roteador.go(-1);
                
            } catch (e) { 
                // SÓ ENTRA AQUI SE A NUVEM E O SERVIDOR LOCAL FALHAREM
                console.error("Falha ao adicionar itens (VPS e Local):", e);
                if (e.entrada_forcada) {
                    toast_global.exibir_toast(e.message, "erro");
                    return;
                }
                if (!e.response || e.response.status >= 500 || e.response.status === 404) { 
                    const uuid_add = gerarUUID();
                    const payload = { itens: _mapear_itens_payload(), uuid_operacao: uuid_add };
                    
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
                    avisos_excedente_emitidos.value = {};
                    roteador.go(-1);
                } else {
                    toast_global.exibir_toast(e.message || e.response?.data?.mensagem || "Erro ao atualizar a comanda.", "erro"); 
                }
            } finally { processando_finalizacao.value = false; }
        
        // 3. VENDA BALCÃO AVULSA
        } else {
            const uuid_balcao = gerarUUID();
            const payload = { itens: _mapear_itens_payload(), desconto: Number(valor_desconto.value) || 0, forma_pagamento: forma_pagamento.value, uuid_operacao: uuid_balcao };
            try {
                await registrar_entradas_forcadas();
                await api_cliente.post('/venda-balcao', payload);
                toast_global.exibir_toast("💸 Venda Balcão concluída!", "sucesso"); 
                carrinho_venda.value = [];
                avisos_excedente_emitidos.value = {};
                valor_desconto.value = '';
                loja_produtos.buscar_produtos(true); 
            } catch (e) { 
                if (e.entrada_forcada) {
                    toast_global.exibir_toast(e.message, "erro");
                    return;
                }
                if (!e.response || e.response.status >= 500 || e.response.status === 404) { 
                    await db.vendas_pendentes.add({ tenant_id, data_venda: data_atual, valor_total: valor_final_comanda.value, url_destino: '/venda-balcao', metodo: 'POST', payload_venda: payload, uuid_operacao: uuid_balcao });
                    toast_global.exibir_toast("⚠️ Servidor indisponível: Venda Balcão salva no PC!", "aviso");
                    carrinho_venda.value = [];
                    avisos_excedente_emitidos.value = {};
                    valor_desconto.value = '';
                } else toast_global.exibir_toast(e.response?.data?.mensagem || "Erro ao processar venda balcão.", "erro"); 
            } finally { processando_finalizacao.value = false; }
        }
    };

    onMounted(async () => {
        await loja_produtos.buscar_produtos();
        carregar_categorias();
    });

    return {
        produtos_vitrine, categorias_unicas, termo_pesquisa, categoria_selecionada, 
        produtos_fixados, alternar_fixacao,
        carrinho_venda, itens_ja_lancados, alterar_quantidade_db, remover_item_db, processando_finalizacao,
        adicionar_ao_carrinho, remover_do_carrinho, alterar_quantidade_novo,
        quantidade_selecionada, estoque_disponivel_visual, quantidade_excedente, tem_excedente,
        subtotal_comanda, valor_final_comanda, valor_desconto, forma_pagamento,
        id_comanda_vinculada, id_comanda_pagamento,
        em_modo_pagar_tudo, ids_pagamento_total, total_mesa_externo, 
        carrinho_expandido, // 🟢 Estado de UI mobile exportado
        processar_acao_principal, voltar_painel: () => roteador.push('/painel-central'),
        // Modal de adicionais
        modal_adicionais_visivel, produto_adicionais_temp, selecao_adicionais_temp,
        confirmar_adicionais, cancelar_adicionais, total_preview_adicionais, alterar_qtd_adicional,
        _preco_unitario_com_adicionais,
    };
}
