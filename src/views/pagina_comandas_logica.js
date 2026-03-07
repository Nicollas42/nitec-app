import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';

export function useLogicaComandas() {
    const roteador = useRouter();
    const lista_comandas = ref([]);
    const filtro_status = ref('todas'); 

    const carregar_comandas = async () => {
        try {
            const resposta = await api_cliente.get('/listar-comandas');
            lista_comandas.value = resposta.data.comandas;
        } catch (erro) {
            console.error("Erro ao carregar as comandas:", erro);
        }
    };

    const comandas_filtradas = computed(() => {
        if (filtro_status.value === 'todas') return lista_comandas.value;
        return lista_comandas.value.filter(c => c.status_comanda === filtro_status.value);
    });

    const abrir_detalhes = (comanda) => {
        if (comanda.mesa_id) roteador.push(`/mesa/${comanda.mesa_id}/detalhes`);
        else alert(`Acessando a comanda avulsa/balcão #${comanda.id}... (Em breve)`);
    };

    onMounted(() => carregar_comandas());
    onActivated(() => carregar_comandas()); // 🟢 Atualiza os dados assim que o ecrã "descongela"

    return {
        filtro_status, comandas_filtradas, alterar_filtro: (novo) => filtro_status.value = novo,
        abrir_detalhes, voltar_painel: () => roteador.push('/painel-central')
    };
}