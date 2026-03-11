import { ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useMesasStore } from '../stores/mesas_store.js';
import { useToastStore } from '../stores/toast_store.js';
import { db } from '../banco_local/db.js';

export function useLogicaMesas() {
    const roteador = useRouter();
    const loja_mesas = useMesasStore(); 
    const toast_global = useToastStore();
    
    // 🟢 1. ESTADOS MODERNOS (Filtros, Pesquisa e Loadings)
    const carregando = ref(false);
    const termo_pesquisa = ref('');
    const filtro_status = ref('todas');
    const criando_mesa = ref(false);
    const mesa_carregando = ref(null);

    // 🟢 2. ESTADOS OPERACIONAIS (Modais e Formulários)
    const input_nome_mesa = ref('');
    const modal_nova_mesa = ref(false); 
    const modal_visivel = ref(false);
    const mesa_em_abertura = ref(null);
    const input_nome_cliente = ref('');
    
    // Gerador de UUID para impedir duplicação caso a net caia e volte rapidamente
    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID 
            ? crypto.randomUUID() 
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    // 🟢 3. LÓGICA DE GESTÃO (Busca e Filtro)
    const mesas_filtradas = computed(() => {
        let resultado = loja_mesas.lista_mesas || [];
        
        if (filtro_status.value !== 'todas') {
            resultado = resultado.filter(m => m.status_mesa === filtro_status.value);
        }
        
        if (termo_pesquisa.value) {
            const termo = termo_pesquisa.value.toLowerCase();
            resultado = resultado.filter(m => (m.nome_mesa || '').toLowerCase().includes(termo));
        }
        
        return resultado;
    });

    const carregar_dados = async () => {
        carregando.value = true;
        await loja_mesas.buscar_mesas();
        carregando.value = false;
    };

    // 🟢 4. AÇÃO: CRIAR NOVA MESA (Com UX Moderna e Offline)
    const adicionar_nova_mesa = async () => {
        const nome_digitado = input_nome_mesa.value;
        if (!nome_digitado.trim()) return toast_global.exibir_toast("Digite o nome da mesa.", "erro");
        
        criando_mesa.value = true;

        try {
            await api_cliente.post('/cadastrar-mesa', { nome_mesa: nome_digitado, capacidade_pessoas: 4 });
            toast_global.exibir_toast("Mesa criada com sucesso!", "sucesso");
            await loja_mesas.buscar_mesas(true); 
            modal_nova_mesa.value = false; 
            input_nome_mesa.value = '';
        } catch (erro) {
            if (!erro.response) {
                await loja_mesas.criar_mesa_offline(nome_digitado);
                toast_global.exibir_toast("⚠️ Offline: Mesa salva no PC e aparecerá na rede depois.", "aviso");
                modal_nova_mesa.value = false;
                input_nome_mesa.value = '';
            } else {
                toast_global.exibir_toast(erro.response?.data?.mensagem || "Erro ao cadastrar.", "erro");
            }
        } finally {
            criando_mesa.value = false;
        }
    };

    // 🟢 5. AÇÃO: FLUXO DO GARÇOM (Selecionar Mesa e Abrir Comanda)
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
        const id_mesa_aberta = mesa_em_abertura.value.id; 
        const payload = {
            mesa_id: id_mesa_aberta,
            nome_cliente: input_nome_cliente.value,
            tipo_conta: 'geral',
            data_hora_abertura: new Date().toISOString(),
            uuid_operacao: gerarUUID()
        };

        try {
            await api_cliente.post('/abrir-comanda', payload);
            loja_mesas.buscar_mesas(true); 
            fechar_modal();
            roteador.push(`/mesa/${id_mesa_aberta}/detalhes`);
        } catch (erro) {
            if (!erro.response) {
                // 🛑 MODO OFFLINE PARA ABERTURA DE MESA
                await db.vendas_pendentes.add({
                    tenant_id: localStorage.getItem('nitec_tenant_id'),
                    data_venda: new Date().toISOString(),
                    valor_total: 0,
                    url_destino: '/abrir-comanda',
                    metodo: 'POST',
                    payload_venda: payload
                });

                // Atualiza o Dexie localmente para a mesa ficar visualmente vermelha (ocupada)
                await db.mesas.update(id_mesa_aberta, { status_mesa: 'ocupada' });
                
                toast_global.exibir_toast("⚠️ Offline: Comanda aberta salva no PC!", "aviso");
                loja_mesas.buscar_mesas(true); // Dá refetch no Dexie para pintar a mesa de vermelho
                fechar_modal();
                roteador.push(`/mesa/${id_mesa_aberta}/detalhes`);
            } else {
                toast_global.exibir_toast("Erro ao abrir a comanda.", "erro");
            }
        }
    };

    const iniciar_venda_balcao = () => roteador.push('/pdv-caixa');
    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => carregar_dados());
    onActivated(() => loja_mesas.buscar_mesas(true));

    return { 
        // Exportando tudo exatamente com os mesmos nomes para não quebrar o HTML (Vue)
        lista_mesas: computed(() => loja_mesas.lista_mesas), 
        mesas_filtradas, carregando, termo_pesquisa, filtro_status,
        input_nome_mesa, adicionar_nova_mesa, criando_mesa,
        selecionar_mesa, iniciar_venda_balcao, voltar_painel, 
        modal_visivel, modal_nova_mesa, 
        mesa_em_abertura, input_nome_cliente, fechar_modal,
        confirmar_abertura_comanda, mesa_carregando
    };
}