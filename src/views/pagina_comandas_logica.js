import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js';
import { useComandasStore } from '../stores/comandas_store.js';
import { db } from '../banco_local/db.js';

export function useLogicaComandas() {
    const roteador      = useRouter();
    const toast_store   = useToastStore();
    const loja_comandas = useComandasStore();

    const filtro_status           = ref('todas');
    const termo_pesquisa_comanda  = ref('');
    const tipo_exibicao           = ref('ordem');
    const modal_historico_visivel = ref(false);
    const comanda_selecionada     = ref(null);
    const reabrindo               = ref(false);

    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const carregar_comandas = async () => {
        await loja_comandas.buscar_comandas();
    };

    const comandas_com_sessao = computed(() => {
        let lista = [...loja_comandas.lista_comandas];
        lista.sort((a, b) => new Date(a.data_hora_abertura) - new Date(b.data_hora_abertura));
        let sessoes_ativas = {};

        lista.forEach(c => {
            if (!c.mesa_id) {
                c._sessao        = 'balcao_' + c.id;
                c._sessao_inicio = new Date(c.data_hora_abertura).getTime();
            } else {
                if (c.tipo_conta === 'geral') {
                    sessoes_ativas[c.mesa_id] = c;
                    c._sessao        = 'sessao_' + c.id;
                    c._sessao_inicio = new Date(c.data_hora_abertura).getTime();
                } else {
                    if (sessoes_ativas[c.mesa_id]) {
                        c._sessao        = 'sessao_' + sessoes_ativas[c.mesa_id].id;
                        c._sessao_inicio = new Date(sessoes_ativas[c.mesa_id].data_hora_abertura).getTime();
                    } else {
                        c._sessao        = 'sessao_orfa_' + c.id;
                        c._sessao_inicio = new Date(c.data_hora_abertura).getTime();
                    }
                }
            }
        });
        return lista;
    });

    const comandas_filtradas = computed(() => {
        let filtradas = comandas_com_sessao.value;

        if (filtro_status.value !== 'todas')
            filtradas = filtradas.filter(c => c.status_comanda === filtro_status.value);

        if (termo_pesquisa_comanda.value) {
            const termo = termo_pesquisa_comanda.value.toLowerCase();
            filtradas   = filtradas.filter(c => {
                const cliente   = (c.buscar_cliente?.nome_cliente || 'conta geral').toLowerCase();
                const mesa      = (c.buscar_mesa?.nome_mesa || 'venda balcão').toLowerCase();
                const atendente = (c.buscar_usuario?.name || '').toLowerCase();
                const total     = String(c.valor_total);
                return cliente.includes(termo) || mesa.includes(termo) || atendente.includes(termo) || total.includes(termo);
            });
        }

        if (tipo_exibicao.value === 'agrupada') {
            return filtradas.sort((a, b) => {
                if (a._sessao !== b._sessao) return b._sessao_inicio - a._sessao_inicio;
                return new Date(a.data_hora_abertura) - new Date(b.data_hora_abertura);
            });
        }

        return filtradas.sort((a, b) => {
            if (filtro_status.value === 'aberta')    return new Date(b.data_hora_abertura) - new Date(a.data_hora_abertura);
            if (filtro_status.value === 'fechada')   return new Date(b.data_hora_fechamento || 0) - new Date(a.data_hora_fechamento || 0);
            if (filtro_status.value === 'cancelada') return new Date(b.updated_at || b.data_hora_abertura) - new Date(a.updated_at || a.data_hora_abertura);
            const dataA = new Date(a.data_hora_fechamento || a.updated_at || a.data_hora_abertura);
            const dataB = new Date(b.data_hora_fechamento || b.updated_at || b.data_hora_abertura);
            return dataB - dataA;
        });
    });

    const formatar_data = (dataStr) => {
        if (!dataStr) return '---';
        const d = new Date(dataStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const abrir_detalhes = async (comanda, acao) => {
        // Comanda ABERTA — navega direto, sem requisição
        if (comanda.status_comanda === 'aberta') {
            if (comanda.mesa_id) {
                roteador.push(`/mesa/${comanda.mesa_id}/detalhes`);
            } else {
                if (acao === 'lancar') roteador.push(`/pdv-caixa?comanda=${comanda.id}`);
                else roteador.push(`/pdv-caixa?pagamento=${comanda.id}`);
            }
            return;
        }

        // Comanda FECHADA ou CANCELADA — busca detalhes do histórico
        try {
            const res = await api_cliente.get(`/buscar-comanda/${comanda.id}`);
            comanda_selecionada.value     = res.data.dados;
            modal_historico_visivel.value = true;

        } catch (e) {
            // 🟢 Fallback offline — usa dados já persistidos no store
            // Evita tela branca quando sem internet ou servidor local
            const comanda_cache = loja_comandas.lista_comandas.find(c => String(c.id) === String(comanda.id));

            if (comanda_cache) {
                comanda_selecionada.value     = comanda_cache;
                modal_historico_visivel.value = true;
                toast_store.exibir_toast("⚠️ Offline: exibindo dados salvos.", "aviso");
            } else {
                toast_store.exibir_toast("⚠️ Offline: detalhes não disponíveis.", "aviso");
            }
        }
    };

    const reabrir_comanda = async () => {
        reabrindo.value  = true;
        const payload    = { uuid_operacao: gerarUUID() };
        const id_mesa    = comanda_selecionada.value.mesa_id;
        const id_comanda = comanda_selecionada.value.id;

        try {
            await api_cliente.post(`/reabrir-comanda/${id_comanda}`, payload);
            toast_store.exibir_toast("Comanda reaberta!", "sucesso");
            modal_historico_visivel.value = false;
            if (id_mesa) roteador.push(`/mesa/${id_mesa}/detalhes`);
            else roteador.push(`/pdv-caixa?comanda=${id_comanda}`);
            await loja_comandas.buscar_comandas(true);
        } catch (e) {
            if (!e.response) {
                await db.vendas_pendentes.add({
                    tenant_id    : localStorage.getItem('nitec_tenant_id'),
                    data_venda   : new Date().toISOString(),
                    valor_total  : 0,
                    url_destino  : `/reabrir-comanda/${id_comanda}`,
                    metodo       : 'POST',
                    payload_venda: payload
                });
                toast_store.exibir_toast("⚠️ Offline: Reabertura salva!", "aviso");
                modal_historico_visivel.value = false;
                if (id_mesa) roteador.push('/mapa-mesas');
                else roteador.push(`/pdv-caixa?comanda=${id_comanda}`);
            } else toast_store.exibir_toast(e.response?.data?.mensagem || "Erro ao reabrir.", "erro");
        } finally { reabrindo.value = false; }
    };

    onMounted(() => carregar_comandas());
    onActivated(() => loja_comandas.buscar_comandas(true));

    return {
        filtro_status, tipo_exibicao, comandas_filtradas, termo_pesquisa_comanda,
        alterar_filtro  : (n) => filtro_status.value  = n,
        alterar_exibicao: (n) => tipo_exibicao.value  = n,
        formatar_data, abrir_detalhes,
        voltar_painel: () => roteador.push('/painel-central'),
        modal_historico_visivel, comanda_selecionada,
        fechar_modal_historico: () => modal_historico_visivel.value = false,
        reabrir_comanda, reabrindo
    };
}