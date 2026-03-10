import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaComandas() {
    const roteador = useRouter();
    const toast_store = useToastStore();
    const lista_comandas = ref([]);
    const filtro_status = ref('todas'); 
    
    const tipo_exibicao = ref('ordem'); // 'ordem' ou 'agrupada'

    const modal_historico_visivel = ref(false);
    const comanda_selecionada = ref(null);
    const reabrindo = ref(false);

    const carregar_comandas = async () => {
        try {
            const resposta = await api_cliente.get('/listar-comandas');
            lista_comandas.value = resposta.data.comandas;
        } catch (erro) { console.error("Erro ao carregar as comandas:", erro); }
    };

    // 🟢 ALGORITMO INTELIGENTE DE SESSÃO (Sem precisar do Banco de Dados)
    const comandas_com_sessao = computed(() => {
        let lista = [...lista_comandas.value];
        
        // 1. Organiza do mais antigo para o mais novo
        lista.sort((a, b) => new Date(a.data_hora_abertura) - new Date(b.data_hora_abertura));
        
        let sessoes_ativas = {}; 
        
        lista.forEach(c => {
            if (!c.mesa_id) {
                c._sessao = 'balcao_' + c.id;
                c._sessao_inicio = new Date(c.data_hora_abertura).getTime();
            } else {
                if (c.tipo_conta === 'geral') {
                    // Nova sessão da mesa iniciada!
                    sessoes_ativas[c.mesa_id] = c;
                    c._sessao = 'sessao_' + c.id;
                    c._sessao_inicio = new Date(c.data_hora_abertura).getTime();
                } else {
                    // É individual: atrela à ÚLTIMA sessão que foi aberta nesta mesa
                    if (sessoes_ativas[c.mesa_id]) {
                        c._sessao = 'sessao_' + sessoes_ativas[c.mesa_id].id;
                        c._sessao_inicio = new Date(sessoes_ativas[c.mesa_id].data_hora_abertura).getTime();
                    } else {
                        c._sessao = 'sessao_orfa_' + c.id;
                        c._sessao_inicio = new Date(c.data_hora_abertura).getTime();
                    }
                }
            }
        });
        return lista;
    });

    const comandas_filtradas = computed(() => {
        let filtradas = comandas_com_sessao.value;
        
        if (filtro_status.value !== 'todas') {
            filtradas = filtradas.filter(c => c.status_comanda === filtro_status.value);
        }

        if (tipo_exibicao.value === 'agrupada') {
            // Ordena 1º: Sessões mais novas no topo. 2º: Ordem dentro da mesma sessão.
            return filtradas.sort((a, b) => {
                if (a._sessao !== b._sessao) return b._sessao_inicio - a._sessao_inicio; 
                return new Date(a.data_hora_abertura) - new Date(b.data_hora_abertura); 
            });
        }

        // Ordem cronológica pura
        return filtradas.sort((a, b) => b.id - a.id);
    });

    const formatar_data = (dataStr) => {
        if (!dataStr) return '---';
        const d = new Date(dataStr);
        return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    };

    const abrir_detalhes = async (comanda) => {
        if (comanda.status_comanda === 'aberta') {
            if (comanda.mesa_id) roteador.push(`/mesa/${comanda.mesa_id}/detalhes`);
            else alert(`Acessando a comanda avulsa/balcão #${comanda.id}...`);
        } else {
            try {
                const res = await api_cliente.get(`/buscar-comanda/${comanda.id}`);
                comanda_selecionada.value = res.data.dados;
                modal_historico_visivel.value = true;
            } catch (e) { toast_store.exibir_toast("Erro ao buscar detalhes do recibo.", "erro"); }
        }
    };

    const reabrir_comanda = async () => {
        if (!confirm("Deseja realmente reabrir esta comanda? A mesa ficará ocupada novamente.")) return;
        reabrindo.value = true;
        try {
            await api_cliente.post(`/reabrir-comanda/${comanda_selecionada.value.id}`);
            toast_store.exibir_toast("Comanda reaberta com sucesso!", "sucesso");
            modal_historico_visivel.value = false;
            carregar_comandas();
        } catch (e) { toast_store.exibir_toast(e.response?.data?.mensagem || "Erro ao reabrir comanda.", "erro"); } 
        finally { reabrindo.value = false; }
    };

    onMounted(() => carregar_comandas());
    onActivated(() => carregar_comandas()); 

    return {
        filtro_status, tipo_exibicao, comandas_filtradas, 
        alterar_filtro: (n) => filtro_status.value = n,
        alterar_exibicao: (n) => tipo_exibicao.value = n,
        formatar_data, abrir_detalhes, voltar_painel: () => roteador.push('/painel-central'),
        modal_historico_visivel, comanda_selecionada, fechar_modal_historico: () => modal_historico_visivel.value = false, 
        reabrir_comanda, reabrindo
    };
}