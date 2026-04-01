import { computed, onActivated, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useMesasStore } from '../stores/mesas_store.js';
import { useProdutosStore } from '../stores/produtos_store.js';
import { useToastStore } from '../stores/toast_store.js';

const criar_config_padrao = () => ({
    nome_exibicao: 'Nosso Cardapio',
    subtitulo: 'Sabores da casa para pedir na mesa',
    mensagem_boas_vindas: 'Explore o cardapio virtual, acompanhe sua comanda e chame o garcom quando precisar.',
    cor_primaria: '#0F766E',
    cor_destaque: '#F59E0B',
    cor_fundo: '#FFF7ED',
    logo_url: '',
});

export function useLogicaCardapioAdmin() {
    const roteador = useRouter();
    const toast = useToastStore();
    const loja_produtos = useProdutosStore();
    const loja_mesas = useMesasStore();

    const carregando = ref(true);
    const salvando_config = ref(false);
    const produto_processando = ref(null);
    const configuracao = ref(criar_config_padrao());

    const voltar_painel = () => roteador.push('/painel-central');

    const carregar_configuracao = async () => {
        const resposta = await api_cliente.get('/cardapio/admin/config');
        configuracao.value = {
            ...criar_config_padrao(),
            ...(resposta.data || {}),
        };
    };

    const carregar_dados = async (forcar = true) => {
        carregando.value = true;
        try {
            await Promise.all([
                carregar_configuracao(),
                loja_produtos.buscar_produtos(forcar),
                loja_mesas.buscar_mesas(forcar),
            ]);
        } catch (erro) {
            console.error(erro);
            toast.exibir_toast('Erro ao carregar o cardapio digital.', 'erro');
        } finally {
            carregando.value = false;
        }
    };

    const salvar_config = async () => {
        salvando_config.value = true;
        try {
            const payload = {
                ...configuracao.value,
                subtitulo: configuracao.value.subtitulo || null,
                mensagem_boas_vindas: configuracao.value.mensagem_boas_vindas || null,
                logo_url: configuracao.value.logo_url || null,
            };

            const resposta = await api_cliente.put('/cardapio/admin/config', payload);
            configuracao.value = {
                ...criar_config_padrao(),
                ...(resposta.data || payload),
            };
            toast.exibir_toast('Configuracao do cardapio salva!', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast.exibir_toast('Nao foi possivel salvar o cardapio.', 'erro');
        } finally {
            salvando_config.value = false;
        }
    };

    const alternar_visibilidade = async (produto) => {
        const valor_anterior = !!produto.visivel_cardapio;
        const novo_valor = !valor_anterior;
        produto.visivel_cardapio = novo_valor;
        produto_processando.value = produto.id;

        try {
            await api_cliente.put(`/produtos/${produto.id}/visibilidade-cardapio`, {
                visivel_cardapio: novo_valor,
            });
        } catch (erro) {
            console.error(erro);
            produto.visivel_cardapio = valor_anterior;
            toast.exibir_toast('Nao foi possivel atualizar este produto.', 'erro');
        } finally {
            produto_processando.value = null;
        }
    };

    const produtos_por_categoria = computed(() => {
        const grupos = {};

        for (const produto of loja_produtos.lista_produtos || []) {
            const categoria = produto.categoria?.trim() || 'Sem categoria';
            if (!grupos[categoria]) grupos[categoria] = [];
            grupos[categoria].push(produto);
        }

        return Object.entries(grupos)
            .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
            .map(([categoria, produtos]) => ({
                categoria,
                produtos: [...produtos].sort((a, b) => {
                    return String(a.nome_produto || '').localeCompare(String(b.nome_produto || ''), 'pt-BR', {
                        sensitivity: 'base',
                    });
                }),
            }));
    });

    const total_produtos_visiveis = computed(() => {
        return (loja_produtos.lista_produtos || []).filter((produto) => produto.visivel_cardapio).length;
    });

    const preview_style = computed(() => ({
        '--cardapio-primary': configuracao.value.cor_primaria || '#0F766E',
        '--cardapio-accent': configuracao.value.cor_destaque || '#F59E0B',
        '--cardapio-bg': configuracao.value.cor_fundo || '#FFF7ED',
    }));

    onMounted(() => {
        carregar_dados(true);
    });

    onActivated(() => {
        carregar_dados(true);
    });

    return {
        carregando,
        salvando_config,
        produto_processando,
        configuracao,
        produtos_por_categoria,
        total_produtos_visiveis,
        preview_style,
        lista_mesas: computed(() => loja_mesas.lista_mesas || []),
        voltar_painel,
        salvar_config,
        alternar_visibilidade,
    };
}
