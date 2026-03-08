import { ref, computed, onMounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

export function useLogicaAnalises() {
    const carregando = ref(true);
    const dados_dashboard = ref(null);
    const aba_ativa = ref('inteligência'); 

    const visibilidade = ref({
        vendas_dia: true, mapa_calor: true, comparador: true, ranking_mesas: true, curva_abc: true
    });

    const alternar_visibilidade = (painel) => visibilidade.value[painel] = !visibilidade.value[painel];

    const produto_comp_1 = ref('');
    const produto_comp_2 = ref('');

    const data_inicio = ref(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
    const data_fim = ref(new Date().toISOString().split('T')[0]);

    // 🟢 NOVO: ESTADOS DOS FILTROS DA AUDITORIA
    const filtro_auditoria_texto = ref('');
    const filtro_auditoria_tipo = ref('todos'); // 'todos', 'venda', 'perda', 'entrada'

    // 🟢 NOVO: MOTOR DE FILTRAGEM EM TEMPO REAL
    const log_auditoria_filtrado = computed(() => {
        if (!dados_dashboard.value || !dados_dashboard.value.log_auditoria) return [];

        return dados_dashboard.value.log_auditoria.filter(evento => {
            // 1. Filtro por Categoria (Venda, Entrada, Perda)
            if (filtro_auditoria_tipo.value !== 'todos' && evento.tipo_evento !== filtro_auditoria_tipo.value) {
                return false;
            }

            // 2. Filtro por Pesquisa de Texto (Busca em tudo: Título, Descrição, Usuário)
            if (filtro_auditoria_texto.value) {
                const termo = filtro_auditoria_texto.value.toLowerCase();
                const string_busca = `${evento.titulo} ${evento.descricao} ${evento.usuario} ${evento.detalhes_extras || ''}`.toLowerCase();
                if (!string_busca.includes(termo)) {
                    return false;
                }
            }

            return true;
        });
    });

    const definir_periodo = (tipo) => {
        const hoje = new Date();
        data_fim.value = hoje.toISOString().split('T')[0];
        if (tipo === 'hoje') data_inicio.value = data_fim.value;
        else if (tipo === 'semana') data_inicio.value = new Date(hoje.setDate(hoje.getDate() - 7)).toISOString().split('T')[0];
        else if (tipo === 'mes') data_inicio.value = new Date(hoje.setDate(hoje.getDate() - 30)).toISOString().split('T')[0];
        buscar_dados();
    };

    const buscar_dados = async () => {
        carregando.value = true;
        try {
            const res = await api_cliente.get(`/analises/dashboard?data_inicio=${data_inicio.value}&data_fim=${data_fim.value}`);
            dados_dashboard.value = res.data;

            if (res.data.ranking_produtos && res.data.ranking_produtos.length > 0) {
                produto_comp_1.value = res.data.ranking_produtos[0].produto_id;
                if (res.data.ranking_produtos.length > 1) produto_comp_2.value = res.data.ranking_produtos[1].produto_id;
                else produto_comp_2.value = res.data.ranking_produtos[0].produto_id;
            }
        } catch (e) { console.error(e); } 
        finally { carregando.value = false; }
    };

    const formatarDataLog = (dataString) => {
        const data = new Date(dataString);
        // Formato bem curto para caber na tabela: "08/03 14:30"
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    onMounted(() => buscar_dados());

    return {
        carregando, dados_dashboard, aba_ativa, 
        visibilidade, alternar_visibilidade, 
        data_inicio, data_fim, definir_periodo, buscar_dados,
        produto_comp_1, produto_comp_2, formatarDataLog,
        filtro_auditoria_texto, filtro_auditoria_tipo, log_auditoria_filtrado // 🟢 Exportados!
    };
}