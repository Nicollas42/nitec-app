import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useMesasStore } from '../stores/mesas_store.js';

export function useLogicaMesas() {
    const roteador = useRouter();
    const loja_mesas = useMesasStore(); // Conecta à memória instantânea
    
    const input_nome_mesa = ref('');
    
    // Controles do Modal de Abertura de Mesa
    const modal_visivel = ref(false);
    const mesa_em_abertura = ref(null);
    const input_nome_cliente = ref('');

    /**
     * Cadastra uma mesa física no sistema.
     */
    const adicionar_nova_mesa = async () => {
        try {
            await api_cliente.post('/mesas/cadastrar', { nome_mesa: input_nome_mesa.value });
            input_nome_mesa.value = ''; 
            loja_mesas.buscar_mesas(true); // Força a atualização da RAM
        } catch (erro) {
            alert("Erro ao cadastrar. O nome pode já existir.");
        }
    };

    /**
     * Lida com o clique numa mesa da grelha.
     * * @param {Object} mesa_clicada 
     */
    const selecionar_mesa = (mesa_clicada) => {
        if (mesa_clicada.status_mesa === 'livre') {
            mesa_em_abertura.value = mesa_clicada;
            input_nome_cliente.value = '';
            modal_visivel.value = true;
        } else {
            // CORREÇÃO: Envia para o painel de detalhes da mesa específica
            roteador.push(`/mesa/${mesa_clicada.id}/detalhes`);
        }
    };

    const fechar_modal = () => {
        modal_visivel.value = false;
        mesa_em_abertura.value = null;
    };

    /**
     * Envia os dados do modal para o Laravel criar a comanda.
     * * @return {Promise<void>}
     */
    const confirmar_abertura_comanda = async () => {
        try {
            // Comunicação com a nova rota da API
            await api_cliente.post('/comandas/abrir', {
                mesa_id: mesa_em_abertura.value.id,
                nome_cliente: input_nome_cliente.value
            });

            // Força a Store (RAM) a puxar a lista de mesas atualizada
            // Isso fará a mesa ficar Vermelha instantaneamente na tela!
            loja_mesas.buscar_mesas(true); 
            
            fechar_modal();

        } catch (erro) {
            alert("Erro ao abrir a comanda. Verifique a conexão com o servidor.");
            console.error(erro);
        }
    };

    const iniciar_venda_balcao = () => roteador.push('/pdv-caixa');
    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => {
        loja_mesas.buscar_mesas(); // Zero delay
    });

    return { 
        lista_mesas: computed(() => loja_mesas.lista_mesas), 
        input_nome_mesa, 
        adicionar_nova_mesa, 
        selecionar_mesa, 
        iniciar_venda_balcao, 
        voltar_painel,
        modal_visivel,
        mesa_em_abertura,
        input_nome_cliente,
        fechar_modal,
        confirmar_abertura_comanda
    };
}