import { ref, computed, onMounted } from 'vue';
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
        if (filtro_status.value === 'todas') {
            return lista_comandas.value;
        }
        return lista_comandas.value.filter(
            (comanda) => comanda.status_comanda === filtro_status.value
        );
    });

    const alterar_filtro = (novo_status) => {
        filtro_status.value = novo_status;
    };

    const abrir_detalhes = (comanda) => {
        if (comanda.mesa_id) {
            roteador.push(`/mesa/${comanda.mesa_id}/detalhes`);
        } else {
            alert(`Acessando a comanda avulsa/balcão #${comanda.id}... (Em breve)`);
        }
    };

    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => {
        carregar_comandas();
    });

    return {
        filtro_status,
        comandas_filtradas,
        alterar_filtro,
        abrir_detalhes,
        voltar_painel
    };
}