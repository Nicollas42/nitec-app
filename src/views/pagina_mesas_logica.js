import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useMesasStore } from '../stores/mesas_store.js';

export function useLogicaMesas() {
    const roteador = useRouter();
    const loja_mesas = useMesasStore(); 
    
    const input_nome_mesa = ref('');
    const modal_visivel = ref(false);
    const modal_nova_mesa = ref(false); // 🟢 Controle do novo modal de criação
    const mesa_em_abertura = ref(null);
    const input_nome_cliente = ref('');
    
    const mesa_carregando = ref(null);

    const adicionar_nova_mesa = async () => {
        const nome_digitado = input_nome_mesa.value;
        if (!nome_digitado) return;

        input_nome_mesa.value = ''; 

        try {
            await api_cliente.post('/cadastrar-mesa', { nome_mesa: nome_digitado });
            loja_mesas.buscar_mesas(true); 
            modal_nova_mesa.value = false; // Fecha o modal após sucesso
        } catch (erro) {
            if (!erro.response || erro.response.status >= 500) {
                console.warn("Ativando criação de mesa offline...");
                await loja_mesas.criar_mesa_offline(nome_digitado);
                alert("⚠️ Sem conexão! A mesa foi criada localmente e aparecerá na rede assim que a internet voltar.");
                modal_nova_mesa.value = false;
            } else {
                alert("Erro ao cadastrar. O nome pode já existir.");
            }
        }
    };

    const selecionar_mesa = (mesa_clicada) => {
        if (mesa_clicada.status_mesa === 'livre') {
            mesa_em_abertura.value = mesa_clicada;
            input_nome_cliente.value = '';
            modal_visivel.value = true;
        } else {
            mesa_carregando.value = mesa_clicada.id;
            setTimeout(() => {
                roteador.push(`/mesa/${mesa_clicada.id}/detalhes`);
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
            // 🟢 Guardamos o ID antes de fechar o modal
            const id_mesa_aberta = mesa_em_abertura.value.id; 

            await api_cliente.post('/abrir-comanda', {
                mesa_id: id_mesa_aberta,
                nome_cliente: input_nome_cliente.value,
                tipo_conta: 'geral',
                data_hora_abertura: new Date().toISOString(),
            });

            loja_mesas.buscar_mesas(true); 
            fechar_modal();

            // 🟢 Redireciona diretamente para a tela da mesa aberta!
            roteador.push(`/mesa/${id_mesa_aberta}/detalhes`);
            
        } catch (erro) {
            alert("Erro ao abrir a comanda. Verifique a conexão com o servidor.");
        }
    };

    const iniciar_venda_balcao = () => roteador.push('/pdv-caixa');
    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => loja_mesas.buscar_mesas());
    onActivated(() => loja_mesas.buscar_mesas(true));

    return { 
        lista_mesas: computed(() => loja_mesas.lista_mesas), 
        input_nome_mesa, adicionar_nova_mesa, selecionar_mesa, 
        iniciar_venda_balcao, voltar_painel, modal_visivel, modal_nova_mesa, // 🟢 Exportado
        mesa_em_abertura, input_nome_cliente, fechar_modal,
        confirmar_abertura_comanda, mesa_carregando
    };
}