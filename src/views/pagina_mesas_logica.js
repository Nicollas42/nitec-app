import { computed, onActivated, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useMesasStore } from '../stores/mesas_store.js';
import { useComandasStore } from '../stores/comandas_store.js';
import { useToastStore } from '../stores/toast_store.js';
import { db } from '../banco_local/db.js';

export function useLogicaMesas() {
    const roteador = useRouter();
    const loja_mesas = useMesasStore();
    const loja_comandas = useComandasStore();
    const toast_global = useToastStore();

    const carregando = ref(false);
    const termo_pesquisa = ref('');
    const filtro_status = ref('todas');
    const criando_mesa = ref(false);
    const mesa_carregando = ref(null);
    const input_nome_mesa = ref('');
    const modal_nova_mesa = ref(false);
    const modal_visivel = ref(false);
    const modal_qr_mesas = ref(false);
    const mesa_em_abertura = ref(null);
    const input_nome_cliente = ref('');

    const grade_colunas = ref(Number(localStorage.getItem('nitec_mesas_colunas') || 5));
    const grade_linhas = ref(Number(localStorage.getItem('nitec_mesas_linhas') || 0));
    const modal_grade = ref(false);

    const info_por_mesa = computed(() => {
        const mapa = {};

        for (const comanda of loja_comandas.lista_comandas) {
            // Conta as abertas para os totalizadores financeiros da tela
            // E sinaliza as pendentes (aguardando aprovação do garçom)
            if (comanda.status_comanda !== 'aberta' && comanda.status_comanda !== 'pendente') continue;

            const chave = String(comanda.mesa_id);
            if (!mapa[chave]) mapa[chave] = { count: 0, total: 0, tem_pendente: false };

            if (comanda.status_comanda === 'pendente') {
                mapa[chave].tem_pendente = true;
            } else if (comanda.status_comanda === 'aberta') {
                mapa[chave].count += 1;
                mapa[chave].total += Number(comanda.valor_total || 0);
            }
        }

        return mapa;
    });

    const salvar_grade = (cols, rows) => {
        grade_colunas.value = Math.max(1, Math.min(20, cols));
        grade_linhas.value = Math.max(0, Math.min(20, rows));
        localStorage.setItem('nitec_mesas_colunas', grade_colunas.value);
        localStorage.setItem('nitec_mesas_linhas', grade_linhas.value);
        modal_grade.value = false;
    };

    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    const mesas_filtradas = computed(() => {
        let resultado = loja_mesas.lista_mesas || [];

        if (filtro_status.value !== 'todas') {
            resultado = resultado.filter((mesa) => mesa.status_mesa === filtro_status.value);
        }

        if (termo_pesquisa.value) {
            const termo = termo_pesquisa.value.toLowerCase();
            resultado = resultado.filter((mesa) => (mesa.nome_mesa || '').toLowerCase().includes(termo));
        }

        return resultado;
    });

    const carregar_dados = async (forcar = true, exibir_loader = true) => {
        if (exibir_loader) carregando.value = true;

        try {
            await Promise.all([
                loja_mesas.buscar_mesas(forcar),
                loja_comandas.buscar_comandas(forcar),
            ]);
        } finally {
            if (exibir_loader) carregando.value = false;
        }
    };

    let intervalo_polling = null;

    const iniciar_polling_ativo = () => {
        if (intervalo_polling) return;

        intervalo_polling = setInterval(() => {
            carregar_dados(true, false);
        }, 10000);
    };

    const parar_polling_ativo = () => {
        if (!intervalo_polling) return;
        clearInterval(intervalo_polling);
        intervalo_polling = null;
    };

    const adicionar_nova_mesa = async () => {
        const nome_digitado = input_nome_mesa.value.trim();
        if (!nome_digitado) {
            toast_global.exibir_toast('Digite o nome da mesa.', 'erro');
            return;
        }

        criando_mesa.value = true;
        try {
            await api_cliente.post('/cadastrar-mesa', { nome_mesa: nome_digitado, capacidade_pessoas: 4 });
            toast_global.exibir_toast('Mesa criada com sucesso!', 'sucesso');
            await loja_mesas.buscar_mesas(true);
            modal_nova_mesa.value = false;
            input_nome_mesa.value = '';
        } catch (erro) {
            if (!erro.response) {
                await loja_mesas.criar_mesa_offline(nome_digitado);
                toast_global.exibir_toast('Offline: mesa salva localmente e sera sincronizada depois.', 'aviso');
                modal_nova_mesa.value = false;
                input_nome_mesa.value = '';
            } else {
                toast_global.exibir_toast(erro.response?.data?.mensagem || 'Erro ao cadastrar a mesa.', 'erro');
            }
        } finally {
            criando_mesa.value = false;
        }
    };

    const selecionar_mesa = (mesa_clicada) => {
        const pendencia_comanda = info_por_mesa.value[String(mesa_clicada.id)]?.tem_pendente;
        const pendencia_chamado = mesa_clicada.solicitando_atendimento;

        // Só exibe o modal de "Iniciar Mesa" se estiver livre e rigorosamente SEM pendências.
        // Se ela tem um cliente aguardando aprovação, pula o modal e entra nos detalhes.
        if (mesa_clicada.status_mesa === 'livre' && !pendencia_comanda && !pendencia_chamado) {
            mesa_em_abertura.value = mesa_clicada;
            input_nome_cliente.value = '';
            modal_visivel.value = true;
            return;
        }

        mesa_carregando.value = mesa_clicada.id;
        setTimeout(() => {
            roteador.push(`/mesa/${mesa_clicada.id}/detalhes`);
            setTimeout(() => {
                mesa_carregando.value = null;
            }, 500);
        }, 250);
    };

    const fechar_modal = () => {
        modal_visivel.value = false;
        mesa_em_abertura.value = null;
    };

    const confirmar_abertura_comanda = async () => {
        if (!mesa_em_abertura.value?.id) return;

        const id_mesa_aberta = mesa_em_abertura.value.id;
        const payload = {
            mesa_id: id_mesa_aberta,
            nome_cliente: input_nome_cliente.value,
            tipo_conta: 'geral',
            data_hora_abertura: new Date().toISOString(),
            uuid_operacao: gerarUUID(),
        };

        try {
            await api_cliente.post('/abrir-comanda', payload);
            await loja_mesas.buscar_mesas(true);
            fechar_modal();
            roteador.push(`/mesa/${id_mesa_aberta}/detalhes`);
        } catch (erro) {
            if (!erro.response) {
                await db.vendas_pendentes.add({
                    tenant_id: localStorage.getItem('nitec_tenant_id'),
                    data_venda: new Date().toISOString(),
                    valor_total: 0,
                    url_destino: '/abrir-comanda',
                    metodo: 'POST',
                    payload_venda: payload,
                });
                await db.mesas.update(id_mesa_aberta, { status_mesa: 'ocupada' });
                toast_global.exibir_toast('Offline: comanda aberta salva localmente!', 'aviso');
                await loja_mesas.buscar_mesas(true);
                fechar_modal();
                roteador.push(`/mesa/${id_mesa_aberta}/detalhes`);
            } else {
                toast_global.exibir_toast('Erro ao abrir a comanda.', 'erro');
            }
        }
    };

    const iniciar_venda_balcao = () => roteador.push('/pdv-caixa');
    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => {
        carregar_dados(true, true);
        iniciar_polling_ativo();
    });

    onActivated(() => {
        carregar_dados(true, false);
        iniciar_polling_ativo();
    });

    onUnmounted(() => {
        parar_polling_ativo();
    });

    return {
        lista_mesas: computed(() => loja_mesas.lista_mesas),
        mesas_filtradas,
        carregando,
        termo_pesquisa,
        filtro_status,
        input_nome_mesa,
        adicionar_nova_mesa,
        criando_mesa,
        selecionar_mesa,
        iniciar_venda_balcao,
        voltar_painel,
        modal_visivel,
        modal_qr_mesas,
        modal_nova_mesa,
        mesa_em_abertura,
        input_nome_cliente,
        fechar_modal,
        confirmar_abertura_comanda,
        mesa_carregando,
        info_por_mesa,
        grade_colunas,
        grade_linhas,
        modal_grade,
        salvar_grade,
    };
}
