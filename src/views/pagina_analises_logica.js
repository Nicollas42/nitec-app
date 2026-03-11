import { ref, computed, onMounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaAnalises() {
    const carregando = ref(true);
    const dados_dashboard = ref(null);
    const aba_ativa = ref('inteligência'); 
    const toast_global = useToastStore(); 

    // 🟢 TODOS os gráficos registados aqui para não sumirem!
    const visibilidade = ref({
        vendas_dia: true, 
        mapa_calor: true, 
        comparador: true, 
        ranking_mesas: true, 
        curva_abc: true, 
        evolucao_vendas: true,
        categorias: true,
        descontos: true
    });

    const alternar_visibilidade = (painel) => visibilidade.value[painel] = !visibilidade.value[painel];

    const produtos_comparador = ref([]);
    const data_inicio = ref('');
    const data_fim = ref('');
    const modal_config_visivel = ref(false);
    const hora_virada_turno = ref(localStorage.getItem('nitec_hora_virada') || '04:00'); 

    const filtro_auditoria_texto = ref('');
    const filtro_auditoria_tipo = ref('todos'); 

    const modal_recibo_visivel = ref(false);
    const comanda_selecionada = ref(null);

    const log_auditoria_filtrado = computed(() => {
        if (!dados_dashboard.value || !dados_dashboard.value.log_auditoria) return [];

        return dados_dashboard.value.log_auditoria.filter(evento => {
            if (filtro_auditoria_tipo.value !== 'todos' && evento.tipo_evento !== filtro_auditoria_tipo.value) return false;
            
            if (filtro_auditoria_texto.value) {
                const termo = filtro_auditoria_texto.value.toLowerCase();
                const string_busca = `${evento.titulo} ${evento.descricao} ${evento.usuario} ${evento.cliente || ''} ${evento.detalhes_extras || ''}`.toLowerCase();
                if (!string_busca.includes(termo)) return false;
            }
            return true;
        });
    });

    const abrir_recibo_auditoria = async (evento) => {
        let id_comanda = evento.referencia_id;
        if (!id_comanda) {
            const extrair_id = (evento.titulo + " " + evento.descricao).match(/#(\d+)/);
            if (extrair_id) id_comanda = extrair_id[1];
        }
        if (!id_comanda) return toast_global.exibir_toast("Não foi possível identificar a comanda.", "erro");

        try {
            const res = await api_cliente.get(`/buscar-comanda/${id_comanda}`);
            comanda_selecionada.value = res.data.dados;
            modal_recibo_visivel.value = true;
        } catch (e) {
            toast_global.exibir_toast("Erro ao carregar detalhes do recibo.", "erro");
        }
    };

    const fechar_modal_recibo = () => {
        modal_recibo_visivel.value = false;
        comanda_selecionada.value = null;
    };

    const salvar_config_turno = () => {
        localStorage.setItem('nitec_hora_virada', hora_virada_turno.value);
        modal_config_visivel.value = false;
        definir_periodo('hoje'); 
    };

    const definir_periodo = (tipo) => {
        const agora = new Date();
        const [hora_virada, min_virada] = hora_virada_turno.value.split(':').map(Number);
        
        if (agora.getHours() < hora_virada || (agora.getHours() === hora_virada && agora.getMinutes() < min_virada)) {
            agora.setDate(agora.getDate() - 1);
        }

        const formatar = (d) => {
            const pad = n => n.toString().padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
        };

        data_fim.value = formatar(agora);
        
        const data_ini = new Date(agora);
        if (tipo === 'semana') data_ini.setDate(data_ini.getDate() - 6);
        else if (tipo === 'mes') data_ini.setDate(data_ini.getDate() - 29);
        
        data_inicio.value = formatar(data_ini);
        buscar_dados();
    };

    const buscar_dados = async () => {
        carregando.value = true;
        try {
            const inicio_real = `${data_inicio.value}T${hora_virada_turno.value}:00`;
            const [a, m, d] = data_fim.value.split('-');
            const d_fim = new Date(a, m - 1, d);
            d_fim.setDate(d_fim.getDate() + 1);
            const pad = n => n.toString().padStart(2, '0');
            const fim_real = `${d_fim.getFullYear()}-${pad(d_fim.getMonth()+1)}-${pad(d_fim.getDate())}T${hora_virada_turno.value}:00`;

            const res = await api_cliente.get(`/analises/dashboard?data_inicio=${inicio_real}&data_fim=${fim_real}`);
            dados_dashboard.value = res.data;

            if (res.data.ranking_produtos && res.data.ranking_produtos.length > 0) {
                produtos_comparador.value = res.data.ranking_produtos.slice(0, 3).map(p => p.produto_id);
            }
        } catch (e) { console.error(e); } 
        finally { carregando.value = false; }
    };

    const formatarDataLog = (dataString) => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    onMounted(() => definir_periodo('hoje'));

    return {
        carregando, dados_dashboard, aba_ativa, 
        visibilidade, alternar_visibilidade, 
        data_inicio, data_fim, definir_periodo, buscar_dados,
        produtos_comparador, formatarDataLog,
        filtro_auditoria_texto, filtro_auditoria_tipo, log_auditoria_filtrado,
        modal_config_visivel, hora_virada_turno, salvar_config_turno,
        modal_recibo_visivel, comanda_selecionada, abrir_recibo_auditoria, fechar_modal_recibo 
    };
}