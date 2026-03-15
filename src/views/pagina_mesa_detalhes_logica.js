import { ref, reactive, onMounted, onActivated, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore } from '../stores/mesas_store.js';
import { useComandasStore } from '../stores/comandas_store.js';
import { obter_servidor_cacheado } from '../servicos/descoberta_rede.js';
import { db } from '../banco_local/db.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaMesaDetalhes() {
    const rota_atual    = useRoute();
    const roteador      = useRouter();
    const loja_produtos = useProdutosStore();
    const loja_mesas    = useMesasStore();
    const loja_comandas = useComandasStore();
    const toast_global  = useToastStore();

    const dados_mesa                 = ref(null);
    const carregando                 = ref(false);
    const item_processando           = ref(null);
    const modal_cliente_visivel      = ref(false);
    const input_novo_cliente         = ref('');
    const modal_cancelamento_visivel = ref(false);
    const cancelando                 = ref(false);
    const form_cancelamento          = reactive({
        comanda_id          : null,
        motivo_cancelamento : 'Erro de Digitação / Lançamento',
        retornar_ao_estoque : true
    });

    let intervalo_polling = null;

    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const montar_dados_do_cache = (id_mesa) => {
        const mesa = loja_mesas.lista_mesas.find(m => String(m.id) === String(id_mesa))
            || { id: id_mesa, nome_mesa: `Mesa ${id_mesa}`, status_mesa: 'ocupada' };

        const comandas_da_mesa = loja_comandas.lista_comandas
            .filter(c => String(c.mesa_id) === String(id_mesa) && c.status_comanda === 'aberta')
            .map(c => ({
                ...c,
                buscar_cliente: c.buscar_cliente || (c.nome_cliente ? { nome_cliente: c.nome_cliente } : null),
                listar_itens  : (c.listar_itens || []).map(i => ({
                    ...i,
                    buscar_produto: i.buscar_produto || { nome_produto: i.nome_produto || `Produto #${i.produto_id}` }
                }))
            }));

        if (comandas_da_mesa.length === 0) return null;

        return {
            nome_mesa      : mesa.nome_mesa,
            status_mesa    : mesa.status_mesa || 'ocupada',
            listar_comandas: comandas_da_mesa
        };
    };

    const carregar_dados_completos = async () => {
        const id_dinamico = rota_atual.params.id_mesa;
        if (!id_dinamico) return;

        carregando.value = true;

        // 🟢 Exibição imediata com dados do cache — sem tela branca
        // Sempre atualiza o cache na tela (não só quando null)
        // para garantir que itens adicionados offline apareçam imediatamente
        const dados_cache = montar_dados_do_cache(id_dinamico);
        if (dados_cache) {
            dados_mesa.value = dados_cache;
        }

        try {
            const resposta        = await api_cliente.get(`/detalhes-mesa/${id_dinamico}`);
            const dados_servidor = resposta.data.dados;

            // 🟢 Merge inteligente: combina itens do servidor com itens adicionados
            // localmente no mesmo ciclo offline (ainda não sincronizados)
            // Evita que a resposta do servidor apague itens que o store já tem
            if (dados_servidor && dados_cache) {
                const ids_servidor = new Set(
                    (dados_servidor.listar_comandas || [])
                        .flatMap(c => (c.listar_itens || []).map(i => String(i.id)))
                );
                // Adiciona itens do cache que o servidor ainda não tem
                dados_servidor.listar_comandas = (dados_servidor.listar_comandas || []).map(c => {
                    const comanda_cache = (dados_cache.listar_comandas || []).find(cc => String(cc.id) === String(c.id));
                    if (!comanda_cache) return c;
                    const itens_so_no_cache = (comanda_cache.listar_itens || []).filter(i => !ids_servidor.has(String(i.id)));
                    return {
                        ...c,
                        listar_itens: [...(c.listar_itens || []), ...itens_so_no_cache],
                        valor_total : c.valor_total + itens_so_no_cache.reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0)
                    };
                });
            }

            dados_mesa.value = dados_servidor || dados_cache;

        } catch (erro) {
            // 🟢 Fallback quando:
            // - sem resposta (timeout/rede)
            // - erro >= 500 (servidor caiu)
            // - 404 enquanto offline/servidor local (mesa ainda não sincronizou)
            const usando_local  = !!localStorage.getItem('nitec_servidor_local');
            const sem_internet  = !navigator.onLine || usando_local;
            const erro_de_rede  = !erro.response || erro.response.status >= 500;
            const nao_encontrou = erro.response?.status === 404 && sem_internet;

            if (erro_de_rede || nao_encontrou) {

                // Fallback 1 — store persistido
                const fallback_store = montar_dados_do_cache(id_dinamico);
                if (fallback_store) {
                    dados_mesa.value = fallback_store;
                    return;
                }

                // Fallback 2 — Dexie (QR Sync)
                const mesa_em_cache      = loja_mesas.lista_mesas.find(m => String(m.id) === String(id_dinamico))
                    || { id: id_dinamico, nome_mesa: `Mesa ${id_dinamico}` };
                const comanda_id_offline = `off_${id_dinamico}`;
                const estado_local       = await db.estado_comandas_local.get(comanda_id_offline);
                const itens_brutos       = estado_local?.itens || [];

                const itens_agrupados = [];
                for (const item of itens_brutos) {
                    const existente = itens_agrupados.find(i => i.produto_id === item.produto_id);
                    if (existente) existente.quantidade += item.quantidade;
                    else itens_agrupados.push({ ...item });
                }

                const valor_total_local = itens_agrupados.reduce(
                    (acc, i) => acc + (i.preco_unitario * i.quantidade), 0
                );

                dados_mesa.value = {
                    nome_mesa      : mesa_em_cache.nome_mesa,
                    status_mesa    : 'ocupada',
                    listar_comandas: [{
                        id             : comanda_id_offline,
                        tipo_conta     : 'geral',
                        status_comanda : 'aberta',
                        valor_total    : valor_total_local,
                        buscar_cliente : { nome_cliente: estado_local?.nome_cliente || 'Atendimento Offline' },
                        listar_itens   : itens_agrupados.map(i => ({
                            id            : `offline_item_${i.produto_id}`,
                            produto_id    : i.produto_id,
                            quantidade    : i.quantidade,
                            preco_unitario: i.preco_unitario,
                            buscar_produto: { nome_produto: i.nome_produto || `Produto #${i.produto_id}` },
                            is_offline    : true
                        })),
                        is_offline: true
                    }]
                };

            } else {
                toast_global.exibir_toast("Erro ao carregar informações da mesa.", "erro");
                if (!dados_mesa.value) voltar_mapa();
            }
        } finally {
            carregando.value = false;
        }
    };

    /**
     * Polling offline — atualiza os detalhes da mesa a cada 15s
     * enquanto offline mas conectado ao servidor local.
     * Seguro: carregar_dados_completos nunca limpa dados existentes,
     * sempre exibe o cache antes da requisição terminar.
     */
    const iniciar_polling_offline = () => {
        if (intervalo_polling) return;

        intervalo_polling = setInterval(async () => {
            const offline      = !navigator.onLine;
            const tem_servidor = !!obter_servidor_cacheado();

            if (offline && tem_servidor) {
                await carregar_dados_completos();
            }
        }, 15000);
    };

    const parar_polling_offline = () => {
        if (intervalo_polling) {
            clearInterval(intervalo_polling);
            intervalo_polling = null;
        }
    };

    watch(() => rota_atual.params.id_mesa, (novo_id) => {
        if (novo_id) carregar_dados_completos();
    });

    const abrir_pdv_para_comanda = (id_comanda) => roteador.push(`/pdv-caixa?comanda=${id_comanda}`);
    const fechar_conta_comanda   = (id_comanda) => roteador.push(`/pdv-caixa?pagamento=${id_comanda}`);
    const adicionar_novo_cliente = () => { input_novo_cliente.value = ''; modal_cliente_visivel.value = true; };
    const fechar_modal_cliente   = () => modal_cliente_visivel.value = false;

    const confirmar_novo_cliente = async () => {
        if (!input_novo_cliente.value) return toast_global.exibir_toast("Digite o nome do cliente.", "erro");
        const uuid    = gerarUUID();
        const payload = {
            mesa_id      : rota_atual.params.id_mesa,
            nome_cliente : input_novo_cliente.value,
            tipo_conta   : 'individual',
            uuid_operacao: uuid
        };
        try {
            await api_cliente.post('/abrir-comanda', payload);
            fechar_modal_cliente();
            carregar_dados_completos();
        } catch (erro) {
            // 🟢 Fallback quando:
            // - sem resposta (timeout/rede)
            // - erro >= 500 (servidor caiu)
            // - 404 enquanto offline/servidor local (mesa ainda não sincronizou)
            const usando_local  = !!localStorage.getItem('nitec_servidor_local');
            const sem_internet  = !navigator.onLine || usando_local;
            const erro_de_rede  = !erro.response || erro.response.status >= 500;
            const nao_encontrou = erro.response?.status === 404 && sem_internet;

            if (erro_de_rede || nao_encontrou) {
                await db.vendas_pendentes.add({
                    tenant_id    : localStorage.getItem('nitec_tenant_id'),
                    data_venda   : new Date().toISOString(),
                    valor_total  : 0,
                    url_destino  : '/abrir-comanda',
                    metodo       : 'POST',
                    payload_venda: payload,
                    uuid_operacao: uuid
                });
                toast_global.exibir_toast("⚠️ Offline: Criação de conta enviada para a fila!", "aviso");
                fechar_modal_cliente();
                voltar_mapa();
            } else toast_global.exibir_toast("Erro ao criar sub-comanda.", "erro");
        }
    };

    const alterar_quantidade = async (id_item, acao) => {
        if (String(id_item).startsWith('offline_item_'))
            return toast_global.exibir_toast("⚠️ Item offline — sincronize antes de alterar.", "aviso");

        item_processando.value = id_item;
        const uuid    = gerarUUID();
        const payload = { acao, uuid_operacao: uuid };
        try {
            await api_cliente.post(`/alterar-quantidade-item/${id_item}`, payload);
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) {
            // 🟢 Fallback quando:
            // - sem resposta (timeout/rede)
            // - erro >= 500 (servidor caiu)
            // - 404 enquanto offline/servidor local (mesa ainda não sincronizou)
            const usando_local  = !!localStorage.getItem('nitec_servidor_local');
            const sem_internet  = !navigator.onLine || usando_local;
            const erro_de_rede  = !erro.response || erro.response.status >= 500;
            const nao_encontrou = erro.response?.status === 404 && sem_internet;

            if (erro_de_rede || nao_encontrou) {
                await db.vendas_pendentes.add({
                    tenant_id    : localStorage.getItem('nitec_tenant_id'),
                    data_venda   : new Date().toISOString(),
                    valor_total  : 0,
                    url_destino  : `/alterar-quantidade-item/${id_item}`,
                    metodo       : 'POST',
                    payload_venda: payload,
                    uuid_operacao: uuid
                });
                toast_global.exibir_toast("⚠️ Offline: Alteração guardada!", "aviso");
                voltar_mapa();
            } else toast_global.exibir_toast("Erro ao atualizar quantidade.", "erro");
        } finally { item_processando.value = null; }
    };

    const remover_item_consumido = async (id_item_comanda) => {
        if (String(id_item_comanda).startsWith('offline_item_'))
            return toast_global.exibir_toast("⚠️ Item offline — sincronize antes de remover.", "aviso");

        if (!confirm("Deseja cancelar estes itens? Eles voltarão para o estoque.")) return;
        item_processando.value = id_item_comanda;
        const uuid    = gerarUUID();
        const payload = { uuid_operacao: uuid };
        try {
            await api_cliente.delete(`/remover-item-comanda/${id_item_comanda}`, { data: payload });
            carregar_dados_completos();
            loja_produtos.buscar_produtos(true);
        } catch (erro) {
            // 🟢 Fallback quando:
            // - sem resposta (timeout/rede)
            // - erro >= 500 (servidor caiu)
            // - 404 enquanto offline/servidor local (mesa ainda não sincronizou)
            const usando_local  = !!localStorage.getItem('nitec_servidor_local');
            const sem_internet  = !navigator.onLine || usando_local;
            const erro_de_rede  = !erro.response || erro.response.status >= 500;
            const nao_encontrou = erro.response?.status === 404 && sem_internet;

            if (erro_de_rede || nao_encontrou) {
                await db.vendas_pendentes.add({
                    tenant_id    : localStorage.getItem('nitec_tenant_id'),
                    data_venda   : new Date().toISOString(),
                    valor_total  : 0,
                    url_destino  : `/remover-item-comanda/${id_item_comanda}`,
                    metodo       : 'DELETE',
                    payload_venda: payload,
                    uuid_operacao: uuid
                });
                toast_global.exibir_toast("⚠️ Offline: Remoção enviada para a fila!", "aviso");
                voltar_mapa();
            } else toast_global.exibir_toast("Erro ao remover os itens.", "erro");
        } finally { item_processando.value = null; }
    };

    const abrir_modal_cancelamento = (id_comanda) => {
        form_cancelamento.comanda_id          = id_comanda;
        form_cancelamento.motivo_cancelamento = 'Erro de Digitação / Lançamento';
        form_cancelamento.retornar_ao_estoque = true;
        modal_cancelamento_visivel.value      = true;
    };

    const confirmar_cancelamento = async () => {
        cancelando.value = true;
        const uuid    = gerarUUID();
        const payload = {
            motivo_cancelamento: form_cancelamento.motivo_cancelamento,
            retornar_ao_estoque: form_cancelamento.retornar_ao_estoque,
            uuid_operacao      : uuid
        };
        try {
            await api_cliente.post(`/fechar-comanda/cancelar/${form_cancelamento.comanda_id}`, payload);
            modal_cancelamento_visivel.value = false;
            voltar_mapa();
            loja_produtos.buscar_produtos(true);
        } catch (erro) {
            // 🟢 Fallback quando:
            // - sem resposta (timeout/rede)
            // - erro >= 500 (servidor caiu)
            // - 404 enquanto offline/servidor local (mesa ainda não sincronizou)
            const usando_local  = !!localStorage.getItem('nitec_servidor_local');
            const sem_internet  = !navigator.onLine || usando_local;
            const erro_de_rede  = !erro.response || erro.response.status >= 500;
            const nao_encontrou = erro.response?.status === 404 && sem_internet;

            if (erro_de_rede || nao_encontrou) {
                await db.vendas_pendentes.add({
                    tenant_id    : localStorage.getItem('nitec_tenant_id'),
                    data_venda   : new Date().toISOString(),
                    valor_total  : 0,
                    url_destino  : `/fechar-comanda/cancelar/${form_cancelamento.comanda_id}`,
                    metodo       : 'POST',
                    payload_venda: payload,
                    uuid_operacao: uuid
                });
                toast_global.exibir_toast("⚠️ Offline: Cancelamento salvo!", "aviso");
                modal_cancelamento_visivel.value = false;
                voltar_mapa();
            } else toast_global.exibir_toast(erro.response?.data?.mensagem || "Erro ao cancelar.", "erro");
        } finally { cancelando.value = false; }
    };

    const voltar_mapa = () => roteador.push('/mapa-mesas');

    onMounted(() => {
        carregar_dados_completos();
        iniciar_polling_offline();
    });

    onActivated(() => {
        carregar_dados_completos();
        iniciar_polling_offline();
    });

    onUnmounted(() => parar_polling_offline());

    return {
        dados_mesa, carregando, voltar_mapa, abrir_pdv_para_comanda,
        adicionar_novo_cliente, modal_cliente_visivel, input_novo_cliente,
        fechar_modal_cliente, confirmar_novo_cliente, alterar_quantidade,
        remover_item_consumido, fechar_conta_comanda,
        modal_cancelamento_visivel, form_cancelamento, abrir_modal_cancelamento,
        confirmar_cancelamento, cancelando, item_processando,
    };
}