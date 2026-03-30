import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente, { consultar_agente_ia } from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js';

/**
 * Centraliza o estado e as acoes da tela de analises.
 *
 * @returns {object}
 */
export function useLogicaAnalises() {
    const carregando = ref(true);
    const dados_dashboard = ref(null);
    const aba_ativa = ref('estatisticas');
    const toast_global = useToastStore();
    const router = useRouter();
    const abas_analises = [
        { id: 'estatisticas', label: 'Estatisticas' },
        { id: 'estoque_sem_giro', label: 'Estoque S/ Giro' },
        { id: 'equipe', label: 'Equipe' },
        { id: 'fornecedores', label: 'Fornecedores' },
        { id: 'auditoria', label: 'Auditoria' },
        { id: 'consultas', label: 'Consultas' },
    ];

    const visibilidade = ref({
        vendas_dia: true,
        mapa_calor: true,
        comparador: true,
        ranking_mesas: true,
        curva_abc: true,
        evolucao_vendas: true,
        categorias: true,
        descontos: true,
        formas_pagamento: true,
    });

    const produtos_comparador = ref([]);
    const data_inicio = ref('');
    const data_fim = ref('');
    const modal_config_visivel = ref(false);
    const hora_virada_turno = ref(localStorage.getItem('nitec_hora_virada') || '04:00');
    const filtro_auditoria_texto = ref('');
    const filtro_auditoria_tipo = ref('todos');
    const modal_recibo_visivel = ref(false);
    const comanda_selecionada = ref(null);
    const pergunta_agente = ref('');
    const consultando_agente = ref(false);
    const historico_consultas = ref([]);
    const sugestoes_consulta = [
        'Qual o produto mais vendido?',
        'Quais produtos estao sem giro?',
        'Quem concedeu mais descontos?',
        'Qual foi o faturamento de balcao?',
        'Quais mesas geraram mais receita?',
    ];

    /**
     * Envia o usuario de volta ao painel principal.
     *
     * @returns {void}
     */
    const voltar_painel = () => {
        router.push('/painel-central');
    };

    /**
     * Alterna a visibilidade de um painel estatistico.
     *
     * @param {string} painel
     * @returns {void}
     */
    const alternar_visibilidade = (painel) => {
        visibilidade.value[painel] = !visibilidade.value[painel];
    };

    const log_auditoria_filtrado = computed(() => {
        if (!dados_dashboard.value || !dados_dashboard.value.log_auditoria) {
            return [];
        }

        return dados_dashboard.value.log_auditoria.filter((evento) => {
            if (filtro_auditoria_tipo.value !== 'todos' && evento.tipo_evento !== filtro_auditoria_tipo.value) {
                return false;
            }

            if (filtro_auditoria_texto.value) {
                const termo = filtro_auditoria_texto.value.toLowerCase();
                const string_busca = `${evento.titulo} ${evento.descricao} ${evento.usuario} ${evento.cliente || ''} ${evento.detalhes_extras || ''}`.toLowerCase();
                if (!string_busca.includes(termo)) {
                    return false;
                }
            }

            return true;
        });
    });

    /**
     * Formata uma data para o padrao usado pelos inputs da tela.
     *
     * @param {Date} data_base
     * @returns {string}
     */
    const formatar_data_input = (data_base) => {
        const pad = (valor) => valor.toString().padStart(2, '0');
        return `${data_base.getFullYear()}-${pad(data_base.getMonth() + 1)}-${pad(data_base.getDate())}`;
    };

    /**
     * Carrega o recibo detalhado a partir de um evento da auditoria.
     *
     * @param {object} evento
     * @returns {Promise<void>}
     */
    const abrir_recibo_auditoria = async (evento) => {
        let id_comanda = evento.referencia_id;

        if (!id_comanda) {
            const extrair_id = `${evento.titulo} ${evento.descricao}`.match(/#(\d+)/);
            if (extrair_id) {
                id_comanda = extrair_id[1];
            }
        }

        if (!id_comanda) {
            toast_global.exibir_toast('Nao foi possivel identificar a comanda.', 'erro');
            return;
        }

        try {
            const resposta = await api_cliente.get(`/buscar-comanda/${id_comanda}`);
            comanda_selecionada.value = resposta.data.dados;
            modal_recibo_visivel.value = true;
        } catch (erro) {
            toast_global.exibir_toast('Erro ao carregar detalhes do recibo.', 'erro');
        }
    };

    /**
     * Fecha o modal do recibo e limpa a comanda aberta.
     *
     * @returns {void}
     */
    const fechar_modal_recibo = () => {
        modal_recibo_visivel.value = false;
        comanda_selecionada.value = null;
    };

    /**
     * Persiste o horario de virada do turno e recarrega o periodo atual.
     *
     * @returns {void}
     */
    const salvar_config_turno = () => {
        localStorage.setItem('nitec_hora_virada', hora_virada_turno.value);
        modal_config_visivel.value = false;
        definir_periodo('hoje');
    };

    /**
     * Define um periodo padrao de analise respeitando a virada do turno.
     *
     * @param {'hoje'|'semana'|'mes'} tipo
     * @returns {void}
     */
    const definir_periodo = (tipo) => {
        const agora = new Date();
        const [hora_virada, minuto_virada] = hora_virada_turno.value.split(':').map(Number);

        if (agora.getHours() < hora_virada || (agora.getHours() === hora_virada && agora.getMinutes() < minuto_virada)) {
            agora.setDate(agora.getDate() - 1);
        }

        data_fim.value = formatar_data_input(agora);

        const data_inicial = new Date(agora);
        if (tipo === 'semana') {
            data_inicial.setDate(data_inicial.getDate() - 6);
        } else if (tipo === 'mes') {
            data_inicial.setDate(data_inicial.getDate() - 29);
        }

        data_inicio.value = formatar_data_input(data_inicial);
        buscar_dados();
    };

    /**
     * Busca os dados do dashboard para o periodo selecionado.
     *
     * @returns {Promise<void>}
     */
    const buscar_dados = async () => {
        carregando.value = true;

        try {
            const inicio_real = `${data_inicio.value}T${hora_virada_turno.value}:00`;
            const [ano, mes, dia] = data_fim.value.split('-');
            const data_final = new Date(ano, mes - 1, dia);
            data_final.setDate(data_final.getDate() + 1);
            const fim_real = `${formatar_data_input(data_final)}T${hora_virada_turno.value}:00`;

            const resposta = await api_cliente.get(`/analises/dashboard?data_inicio=${inicio_real}&data_fim=${fim_real}`);
            dados_dashboard.value = resposta.data;

            if (resposta.data.ranking_produtos && resposta.data.ranking_produtos.length > 0) {
                produtos_comparador.value = resposta.data.ranking_produtos.slice(0, 3).map((produto) => produto.produto_id);
            }
        } catch (erro) {
            console.error(erro);
            toast_global.exibir_toast('Erro ao carregar as analises.', 'erro');
        } finally {
            carregando.value = false;
        }
    };

    /**
     * Seleciona uma sugestao pronta de pergunta para o agente.
     *
     * @param {string} sugestao
     * @returns {void}
     */
    const selecionar_sugestao_agente = (sugestao) => {
        pergunta_agente.value = sugestao;
    };

    /**
     * Limpa o historico local da aba de consultas.
     *
     * @returns {void}
     */
    const limpar_consultas_agente = () => {
        pergunta_agente.value = '';
        historico_consultas.value = [];
    };

    /**
     * Envia uma pergunta em linguagem natural para o agente e armazena a resposta.
     *
     * @returns {Promise<void>}
     */
    const consultar_agente = async () => {
        const pergunta_normalizada = pergunta_agente.value.trim();

        if (!pergunta_normalizada) {
            toast_global.exibir_toast('Digite uma pergunta para o agente.', 'erro');
            return;
        }

        consultando_agente.value = true;

        try {
            const resposta = await consultar_agente_ia({
                pergunta: pergunta_normalizada,
                limite_linhas: 10,
            });

            historico_consultas.value.unshift({
                id_consulta: `${Date.now()}_${historico_consultas.value.length}`,
                pergunta: pergunta_normalizada,
                ...resposta.data,
            });

            pergunta_agente.value = '';
            aba_ativa.value = 'consultas';
        } catch (erro) {
            const mensagem_erro =
                erro.response?.data?.mensagem ||
                erro.response?.data?.detail ||
                erro.message ||
                'Erro ao consultar o agente.';

            toast_global.exibir_toast(mensagem_erro, 'erro');
        } finally {
            consultando_agente.value = false;
        }
    };

    /**
     * Formata a data da auditoria para exibicao resumida.
     *
     * @param {string} data_string
     * @returns {string}
     */
    const formatarDataLog = (data_string) => {
        const data = new Date(data_string);
        return `${data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} as ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    };

    const ja_ativado = ref(false);

    onMounted(() => definir_periodo('hoje'));
    onActivated(() => {
        if (!ja_ativado.value) {
            aba_ativa.value = 'estatisticas';
            ja_ativado.value = true;
        }
    });

    return {
        carregando,
        dados_dashboard,
        aba_ativa,
        abas_analises,
        visibilidade,
        alternar_visibilidade,
        data_inicio,
        data_fim,
        definir_periodo,
        buscar_dados,
        produtos_comparador,
        formatarDataLog,
        filtro_auditoria_texto,
        filtro_auditoria_tipo,
        log_auditoria_filtrado,
        modal_config_visivel,
        hora_virada_turno,
        salvar_config_turno,
        modal_recibo_visivel,
        comanda_selecionada,
        abrir_recibo_auditoria,
        fechar_modal_recibo,
        voltar_painel,
        pergunta_agente,
        consultando_agente,
        historico_consultas,
        sugestoes_consulta,
        selecionar_sugestao_agente,
        limpar_consultas_agente,
        consultar_agente,
    };
}
