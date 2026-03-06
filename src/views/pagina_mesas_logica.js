import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useMesasStore } from '../stores/mesas_store.js';

export function useLogicaMesas() {
    const roteador = useRouter();
    const loja_mesas = useMesasStore(); 
    
    const input_nome_mesa = ref('');
    const modal_visivel = ref(false);
    const mesa_em_abertura = ref(null);
    const input_nome_cliente = ref('');
    
    // 🟢 ESTADO DO SPINNER
    const mesa_carregando = ref(null);

    const adicionar_nova_mesa = async () => {
        try {
            await api_cliente.post('/cadastrar-mesa', { nome_mesa: input_nome_mesa.value });
            input_nome_mesa.value = ''; 
            loja_mesas.buscar_mesas(true); 
        } catch (erro) {
            alert("Erro ao cadastrar. O nome pode já existir.");
        }
    };

    const selecionar_mesa = (mesa_clicada) => {
        if (mesa_clicada.status_mesa === 'livre') {
            mesa_em_abertura.value = mesa_clicada;
            input_nome_cliente.value = '';
            modal_visivel.value = true;
        } else {
            // Ativa o spinner na mesa clicada
            mesa_carregando.value = mesa_clicada.id;
            // Aguarda 400ms para a animação rodar suavemente e muda de página
            setTimeout(() => {
                roteador.push(`/mesa/${mesa_clicada.id}/detalhes`);
                // Limpa o spinner para quando o utilizador voltar
                setTimeout(() => mesa_carregando.value = null, 500);
            }, 400);
        }
    };

    const fechar_modal = () => {
        modal_visivel.value = false;
        mesa_em_abertura.value = null;
    };

    const confirmar_abertura_comanda = async () => {
        try {
            await api_cliente.post('/abrir-comanda', {
                mesa_id: mesa_em_abertura.value.id,
                nome_cliente: input_nome_cliente.value,
                tipo_conta: 'geral' // <-- AVISA QUE É A CONTA PRINCIPAL
            });

            loja_mesas.buscar_mesas(true); 
            fechar_modal();
        } catch (erro) {
            alert("Erro ao abrir a comanda. Verifique a conexão com o servidor.");
        }
    };

    const iniciar_venda_balcao = () => roteador.push('/pdv-caixa');
    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => loja_mesas.buscar_mesas());

    return { 
        lista_mesas: computed(() => loja_mesas.lista_mesas), 
        input_nome_mesa, adicionar_nova_mesa, selecionar_mesa, 
        iniciar_venda_balcao, voltar_painel, modal_visivel,
        mesa_em_abertura, input_nome_cliente, fechar_modal,
        confirmar_abertura_comanda, mesa_carregando
    };
}