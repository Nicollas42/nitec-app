import { computed, onActivated, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore } from '../stores/mesas_store.js';
import { useComandasStore } from '../stores/comandas_store.js';
import { db } from '../banco_local/db.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaMesaDetalhes() {
    const rota_atual = useRoute();
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    const loja_mesas = useMesasStore();
    const loja_comandas = useComandasStore();
    const toast_global = useToastStore();

    const dados_mesa = ref(null);
    const carregando = ref(false);
    const item_processando = ref(null);
    const modal_cliente_visivel = ref(false);
    const input_novo_cliente = ref('');
    const modal_cancelamento_visivel = ref(false);
    const cancelando = ref(false);
    const resolvendo_atendimento = ref(false);
    const resolvendo_individual = ref(null);
    const processando_aprovacao = ref(null);
    const form_cancelamento = reactive({
        comanda_id: null,
        motivo_cancelamento: 'Erro de Digitacao / Lancamento',
        retornar_ao_estoque: true,
    });

    let intervalo_polling = null;

    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    /**
     * Ordena comandas e seus itens por ID para garantir ordem estável em todo ciclo.
     * @param {Array} comandas
     * @return {Array}
     */
    const ordenar_comandas = (comandas) =>
        [...comandas]
            .sort((a, b) => Number(a.id) - Number(b.id))
            .map((comanda) => ({
                ...comanda,
                listar_itens: [...(comanda.listar_itens || [])].sort((a, b) => Number(a.id) - Number(b.id)),
            }));

    const montar_dados_do_cache = (id_mesa) => {
        const mesa = loja_mesas.lista_mesas.find((item) => String(item.id) === String(id_mesa))
            || { id: id_mesa, nome_mesa: `Mesa ${id_mesa}`, status_mesa: 'ocupada' };

        const comandas_da_mesa = loja_comandas.lista_comandas
            .filter((comanda) => String(comanda.mesa_id) === String(id_mesa) && comanda.status_comanda === 'aberta')
            .map((comanda) => ({
                ...comanda,
                buscar_cliente: comanda.buscar_cliente || (comanda.nome_cliente ? { nome_cliente: comanda.nome_cliente } : null),
                listar_itens: (comanda.listar_itens || []).map((item) => ({
                    ...item,
                    buscar_produto: item.buscar_produto || { nome_produto: item.nome_produto || `Produto #${item.produto_id}` },
                })),
            }));

        if (comandas_da_mesa.length === 0) return null;

        return {
            id: mesa.id,
            nome_mesa: mesa.nome_mesa,
            status_mesa: mesa.status_mesa || 'ocupada',
            solicitando_atendimento: !!mesa.solicitando_atendimento,
            solicitacao_detalhes: mesa.solicitacao_detalhes || null,
            listar_comandas: ordenar_comandas(comandas_da_mesa), // sobrescreve com ordem estável
        };
    };

    /**
     * Aplica os dados oficiais da API sem substituir o array inteiro durante o polling.
     * Atualiza campos escalares e faz merge in-place das comandas para evitar que
     * o Vue reordene os elementos no DOM.
     *
     * @param {Object} dados_oficiais
     * @param {boolean} exibir_loader
     */
    const aplicar_dados_oficiais = (dados_oficiais, exibir_loader) => {
        // Primeira carga ou loader explícito: substituição total é aceitável (tela em branco ou spinner)
        if (exibir_loader || !dados_mesa.value) {
            dados_mesa.value = dados_oficiais;
            return;
        }

        // Polling silencioso: só atualiza campos escalares da mesa
        dados_mesa.value.nome_mesa               = dados_oficiais.nome_mesa;
        dados_mesa.value.status_mesa             = dados_oficiais.status_mesa;
        dados_mesa.value.solicitando_atendimento = dados_oficiais.solicitando_atendimento;
        dados_mesa.value.solicitacao_detalhes    = dados_oficiais.solicitacao_detalhes;

        const novas = dados_oficiais.listar_comandas;
        const atuais = [...dados_mesa.value.listar_comandas];

        const ids_novos = new Set(novas.map((c) => String(c.id)));

        // Remove comandas que foram fechadas (não voltaram na resposta)
        const base = atuais.filter((c) => ids_novos.has(String(c.id)));

        // Atualiza existentes no-place ou insere novas mantendo ordem por ID
        for (const nova of novas) {
            const idx = base.findIndex((c) => String(c.id) === String(nova.id));
            if (idx !== -1) {
                base[idx] = nova; // merge no slot existente → sem movimento no DOM
            } else {
                // Insere nova comanda na posição correta (ordem crescente de ID)
                const pos = base.findIndex((c) => Number(c.id) > Number(nova.id));
                if (pos === -1) base.push(nova);
                else base.splice(pos, 0, nova);
            }
        }

        dados_mesa.value.listar_comandas = base;
    };

    const carregar_dados_completos = async (exibir_loader = false) => {
        const id_mesa = rota_atual.params.id_mesa;
        if (!id_mesa) return;

        if (exibir_loader || !dados_mesa.value) carregando.value = true;

        // Cache só na PRIMEIRA carga (evita tela em branco). Durante polling,
        // mantemos o estado atual e fazemos merge in-place via aplicar_dados_oficiais.
        if (!dados_mesa.value) {
            const dados_cache = montar_dados_do_cache(id_mesa);
            if (dados_cache) dados_mesa.value = dados_cache;
        }

        try {
            const resposta = await api_cliente.get(`/detalhes-mesa/${id_mesa}`);
            const dados_oficiais = resposta.data.dados;

            dados_oficiais.listar_comandas = ordenar_comandas(
                (dados_oficiais.listar_comandas || []).map((comanda) => {
                    const mapa_agrupado = {};

                    for (const item of comanda.listar_itens || []) {
                        const chave = String(item.produto_id);
                        if (!mapa_agrupado[chave]) {
                            mapa_agrupado[chave] = { ...item, quantidade: Number(item.quantidade) };
                        } else {
                            mapa_agrupado[chave].quantidade += Number(item.quantidade);
                        }
                    }

                    // Ordena os itens agrupados por ID para ordem estável
                    const itens_finais = Object.values(mapa_agrupado).sort((a, b) => Number(a.id) - Number(b.id));
                    const valor_somado = itens_finais.reduce((acc, item) => {
                        return acc + (Number(item.quantidade) * Number(item.preco_unitario));
                    }, 0);

                    return { ...comanda, listar_itens: itens_finais, valor_total: valor_somado };
                })
            );

            aplicar_dados_oficiais(dados_oficiais, exibir_loader);
        } catch (erro) {
            console.error('Falha ao carregar detalhes da mesa:', erro);

            const erro_de_rede = !erro.response || erro.response.status >= 500 || erro.response.status === 404;
            if (erro_de_rede) {
                const mesa_em_cache = loja_mesas.lista_mesas.find((mesa) => String(mesa.id) === String(id_mesa))
                    || { id: id_mesa, nome_mesa: `Mesa ${id_mesa}` };
                const comanda_id_offline = `off_${id_mesa}`;
                const estado_local = await db.estado_comandas_local.get(comanda_id_offline);
                const itens_brutos = estado_local?.itens || [];

                const itens_agrupados = [];
                for (const item of itens_brutos) {
                    const existente = itens_agrupados.find((registro) => registro.produto_id === item.produto_id);
                    if (existente) existente.quantidade += item.quantidade;
                    else itens_agrupados.push({ ...item });
                }

                dados_mesa.value = {
                    id: mesa_em_cache.id,
                    nome_mesa: mesa_em_cache.nome_mesa,
                    status_mesa: 'ocupada',
                    solicitando_atendimento: !!mesa_em_cache.solicitando_atendimento,
                    solicitacao_detalhes: mesa_em_cache.solicitacao_detalhes || null,
                    listar_comandas: [{
                        id: comanda_id_offline,
                        tipo_conta: 'geral',
                        status_comanda: 'aberta',
                        valor_total: itens_agrupados.reduce((acc, item) => acc + (item.preco_unitario * item.quantidade), 0),
                        buscar_cliente: { nome_cliente: estado_local?.nome_cliente || 'Atendimento Offline' },
                        listar_itens: itens_agrupados.map((item) => ({
                            id: `offline_item_${item.produto_id}`,
                            produto_id: item.produto_id,
                            quantidade: item.quantidade,
                            preco_unitario: item.preco_unitario,
                            buscar_produto: { nome_produto: item.nome_produto || `Produto #${item.produto_id}` },
                            is_offline: true,
                        })),
                        is_offline: true,
                    }],
                };
            } else {
                toast_global.exibir_toast('Erro fatal ao carregar a mesa.', 'erro');
                if (!dados_mesa.value) voltar_mapa();
            }
        } finally {
            carregando.value = false;
        }
    };

    const iniciar_polling_ativo = () => {
        if (intervalo_polling) return;
        intervalo_polling = setInterval(() => {
            carregar_dados_completos(false);
        }, 10000);
    };

    const parar_polling_ativo = () => {
        if (!intervalo_polling) return;
        clearInterval(intervalo_polling);
        intervalo_polling = null;
    };

    watch(() => rota_atual.params.id_mesa, (novo_id) => {
        if (novo_id) carregar_dados_completos(true);
    });

    const abrir_pdv_para_comanda = (id_comanda) => roteador.push(`/pdv-caixa?comanda=${id_comanda}`);
    const fechar_conta_comanda = (id_comanda) => roteador.push(`/pdv-caixa?pagamento=${id_comanda}`);
    const adicionar_novo_cliente = () => {
        input_novo_cliente.value = '';
        modal_cliente_visivel.value = true;
    };
    const fechar_modal_cliente = () => {
        modal_cliente_visivel.value = false;
    };

    const confirmar_novo_cliente = async () => {
        if (!input_novo_cliente.value) {
            toast_global.exibir_toast('Digite o nome do cliente.', 'erro');
            return;
        }

        const uuid = gerarUUID();
        const payload = {
            mesa_id: rota_atual.params.id_mesa,
            nome_cliente: input_novo_cliente.value,
            tipo_conta: 'individual',
            uuid_operacao: uuid,
        };

        try {
            await api_cliente.post('/abrir-comanda', payload);
            fechar_modal_cliente();
            await carregar_dados_completos(false);
        } catch (erro) {
            const erro_de_rede = !erro.response || erro.response.status >= 500 || erro.response.status === 404;

            if (erro_de_rede) {
                await db.vendas_pendentes.add({
                    tenant_id: localStorage.getItem('nitec_tenant_id'),
                    data_venda: new Date().toISOString(),
                    valor_total: 0,
                    url_destino: '/abrir-comanda',
                    metodo: 'POST',
                    payload_venda: payload,
                    uuid_operacao: uuid,
                });
                toast_global.exibir_toast('Offline: criacao da sub-comanda enviada para a fila.', 'aviso');
                fechar_modal_cliente();
                voltar_mapa();
            } else {
                toast_global.exibir_toast('Erro ao criar sub-comanda.', 'erro');
            }
        }
    };

    const alterar_quantidade = async (id_item, acao) => {
        if (String(id_item).startsWith('offline_item_')) {
            toast_global.exibir_toast('Item offline: sincronize antes de alterar.', 'aviso');
            return;
        }

        item_processando.value = id_item;
        const uuid = gerarUUID();
        const payload = { acao, uuid_operacao: uuid };

        try {
            await api_cliente.post(`/alterar-quantidade-item/${id_item}`, payload);
            await carregar_dados_completos(false);
            await loja_produtos.buscar_produtos(true);
        } catch (erro) {
            const erro_de_rede = !erro.response || erro.response.status >= 500 || erro.response.status === 404;

            if (erro_de_rede) {
                await db.vendas_pendentes.add({
                    tenant_id: localStorage.getItem('nitec_tenant_id'),
                    data_venda: new Date().toISOString(),
                    valor_total: 0,
                    url_destino: `/alterar-quantidade-item/${id_item}`,
                    metodo: 'POST',
                    payload_venda: payload,
                    uuid_operacao: uuid,
                });
                toast_global.exibir_toast('Offline: alteracao guardada para sincronizar.', 'aviso');
                voltar_mapa();
            } else {
                toast_global.exibir_toast('Erro ao atualizar quantidade.', 'erro');
            }
        } finally {
            item_processando.value = null;
        }
    };

    const remover_item_consumido = async (id_item_comanda) => {
        if (String(id_item_comanda).startsWith('offline_item_')) {
            toast_global.exibir_toast('Item offline: sincronize antes de remover.', 'aviso');
            return;
        }

        if (!(await confirm('Deseja cancelar estes itens? Eles voltarao para o estoque.'))) return;

        item_processando.value = id_item_comanda;
        const uuid = gerarUUID();
        const payload = { uuid_operacao: uuid };

        try {
            await api_cliente.delete(`/remover-item-comanda/${id_item_comanda}`, { data: payload });
            await carregar_dados_completos(false);
            await loja_produtos.buscar_produtos(true);
        } catch (erro) {
            const erro_de_rede = !erro.response || erro.response.status >= 500 || erro.response.status === 404;

            if (erro_de_rede) {
                await db.vendas_pendentes.add({
                    tenant_id: localStorage.getItem('nitec_tenant_id'),
                    data_venda: new Date().toISOString(),
                    valor_total: 0,
                    url_destino: `/remover-item-comanda/${id_item_comanda}`,
                    metodo: 'DELETE',
                    payload_venda: payload,
                    uuid_operacao: uuid,
                });
                toast_global.exibir_toast('Offline: remocao enviada para a fila.', 'aviso');
                voltar_mapa();
            } else {
                toast_global.exibir_toast('Erro ao remover os itens.', 'erro');
            }
        } finally {
            item_processando.value = null;
        }
    };

    const abrir_modal_cancelamento = (id_comanda) => {
        form_cancelamento.comanda_id = id_comanda;
        form_cancelamento.motivo_cancelamento = 'Erro de Digitacao / Lancamento';
        form_cancelamento.retornar_ao_estoque = true;
        modal_cancelamento_visivel.value = true;
    };

    const confirmar_cancelamento = async () => {
        cancelando.value = true;
        const uuid = gerarUUID();
        const payload = {
            motivo_cancelamento: form_cancelamento.motivo_cancelamento,
            retornar_ao_estoque: form_cancelamento.retornar_ao_estoque,
            uuid_operacao: uuid,
        };

        try {
            await api_cliente.post(`/fechar-comanda/cancelar/${form_cancelamento.comanda_id}`, payload);
            modal_cancelamento_visivel.value = false;
            voltar_mapa();
            await loja_produtos.buscar_produtos(true);
        } catch (erro) {
            const erro_de_rede = !erro.response || erro.response.status >= 500 || erro.response.status === 404;

            if (erro_de_rede) {
                await db.vendas_pendentes.add({
                    tenant_id: localStorage.getItem('nitec_tenant_id'),
                    data_venda: new Date().toISOString(),
                    valor_total: 0,
                    url_destino: `/fechar-comanda/cancelar/${form_cancelamento.comanda_id}`,
                    metodo: 'POST',
                    payload_venda: payload,
                    uuid_operacao: uuid,
                });
                toast_global.exibir_toast('Offline: cancelamento salvo na fila.', 'aviso');
                modal_cancelamento_visivel.value = false;
                voltar_mapa();
            } else {
                toast_global.exibir_toast(erro.response?.data?.mensagem || 'Erro ao cancelar a comanda.', 'erro');
            }
        } finally {
            cancelando.value = false;
        }
    };

    const resolver_atendimento = async () => {
        const id_mesa = rota_atual.params.id_mesa;
        if (!id_mesa) return;

        resolvendo_atendimento.value = true;
        try {
            await api_cliente.post(`/mesas/${id_mesa}/resolver-atendimento`);
            await Promise.all([
                loja_mesas.buscar_mesas(true),
                carregar_dados_completos(false),
            ]);
            toast_global.exibir_toast('Solicitacao de atendimento resolvida.', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast_global.exibir_toast('Nao foi possivel resolver a solicitacao.', 'erro');
        } finally {
            resolvendo_atendimento.value = false;
        }
    };

    const resolver_atendimento_individual = async (indice) => {
        const id_mesa = rota_atual.params.id_mesa;
        if (!id_mesa) return;

        resolvendo_individual.value = indice;
        try {
            await api_cliente.post(`/mesas/${id_mesa}/resolver-atendimento-individual`, { indice });
            await Promise.all([
                loja_mesas.buscar_mesas(true),
                carregar_dados_completos(false),
            ]);
            toast_global.exibir_toast('Pedido lancado na comanda com sucesso.', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast_global.exibir_toast('Nao foi possivel resolver este pedido.', 'erro');
        } finally {
            resolvendo_individual.value = null;
        }
    };

    const formatar_data_hora = (valor) => {
        if (!valor) return '';
        try {
            return new Intl.DateTimeFormat('pt-BR', {
                dateStyle: 'short',
                timeStyle: 'short',
            }).format(new Date(valor));
        } catch (_) {
            return valor;
        }
    };

    const voltar_mapa = () => roteador.push('/mapa-mesas');

    const comandas_pendentes = computed(() => {
        if (!dados_mesa.value?.listar_comandas) return [];
        return dados_mesa.value.listar_comandas.filter((c) => c.status_comanda === 'pendente');
    });

    const comandas_abertas = computed(() => {
        if (!dados_mesa.value?.listar_comandas) return [];
        return dados_mesa.value.listar_comandas.filter((c) => c.status_comanda === 'aberta');
    });

    const total_geral = computed(() => {
        return comandas_abertas.value.reduce((acc, comanda) => acc + Number(comanda.valor_total || 0), 0);
    });

    const pagar_tudo = () => {
        const comandas = dados_mesa.value?.listar_comandas || [];
        if (comandas.length === 0) return;
        if (comandas.length === 1) {
            fechar_conta_comanda(comandas[0].id);
            return;
        }

        const ids_str = comandas.map((comanda) => comanda.id).join(',');
        const total_str = total_geral.value.toFixed(2);
        roteador.push(`/pdv-caixa?pagamento_total=${ids_str}&total_mesa=${total_str}`);
    };

    const marcar_cozinha_vista = async () => {
        const id_mesa = rota_atual.params.id_mesa;
        if (!id_mesa) return;
        try {
            await api_cliente.post(`/cozinha/marcar-visto/${id_mesa}`);
        } catch (_) {
            /* silencioso */
        }
    };

    const aprovar_comanda = async (id_comanda) => {
        processando_aprovacao.value = id_comanda;
        try {
            await api_cliente.post(`/comandas/${id_comanda}/aprovar`);
            await carregar_dados_completos(false);
            await loja_mesas.buscar_mesas(true);
            toast_global.exibir_toast('Comanda aprovada!', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast_global.exibir_toast('Nao foi possivel aprovar a comanda.', 'erro');
        } finally {
            processando_aprovacao.value = null;
        }
    };

    const aprovar_todas_pendentes = async () => {
        const id_mesa = rota_atual.params.id_mesa;
        if (!id_mesa) return;

        processando_aprovacao.value = 'todas';
        try {
            await api_cliente.post(`/mesas/${id_mesa}/aprovar-todas-pendentes`);
            await carregar_dados_completos(false);
            await loja_mesas.buscar_mesas(true);
            toast_global.exibir_toast('Todas as comandas pendentes aprovadas!', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast_global.exibir_toast('Nao foi possivel aprovar as comandas.', 'erro');
        } finally {
            processando_aprovacao.value = null;
        }
    };

    const rejeitar_comanda = async (id_comanda) => {
        processando_aprovacao.value = id_comanda;
        try {
            await api_cliente.post(`/comandas/${id_comanda}/rejeitar`);
            await carregar_dados_completos(false);
            await loja_mesas.buscar_mesas(true);
            toast_global.exibir_toast('Comanda rejeitada.', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast_global.exibir_toast('Nao foi possivel rejeitar a comanda.', 'erro');
        } finally {
            processando_aprovacao.value = null;
        }
    };

    const formatar_cpf_mascarado = (cpf) => {
        if (!cpf || cpf.length !== 11) return cpf || '';
        return `***.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-**`;
    };

    onMounted(() => {
        carregar_dados_completos(true);
        iniciar_polling_ativo();
        marcar_cozinha_vista();
    });

    onActivated(() => {
        carregar_dados_completos(false);
        iniciar_polling_ativo();
        marcar_cozinha_vista();
    });

    onUnmounted(() => {
        parar_polling_ativo();
    });

    return {
        dados_mesa,
        carregando,
        voltar_mapa,
        total_geral,
        pagar_tudo,
        abrir_pdv_para_comanda,
        adicionar_novo_cliente,
        modal_cliente_visivel,
        input_novo_cliente,
        fechar_modal_cliente,
        confirmar_novo_cliente,
        alterar_quantidade,
        remover_item_consumido,
        fechar_conta_comanda,
        modal_cancelamento_visivel,
        form_cancelamento,
        abrir_modal_cancelamento,
        confirmar_cancelamento,
        cancelando,
        item_processando,
        resolver_atendimento,
        resolvendo_atendimento,
        resolver_atendimento_individual,
        resolvendo_individual,
        formatar_data_hora,
        comandas_pendentes,
        comandas_abertas,
        processando_aprovacao,
        aprovar_comanda,
        aprovar_todas_pendentes,
        rejeitar_comanda,
        formatar_cpf_mascarado,
    };
}
