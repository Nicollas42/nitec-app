import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api_cardapio, { obter_base_publica_cardapio } from '../servicos/api_cardapio.js';

const criar_config_padrao = () => ({
    nome_exibicao: 'Nosso Cardapio',
    subtitulo: 'Explore os produtos disponiveis na sua mesa',
    mensagem_boas_vindas: 'Cadastre-se para ver a comanda da mesa e chamar o garcom quando quiser.',
    cor_primaria: '#0F766E',
    cor_destaque: '#F59E0B',
    cor_fundo: '#FFF7ED',
    logo_url: '',
});

const aplicar_modo_publico_cardapio = () => {
    document.body.classList.add('nitec-cardapio-publico');
    document.getElementById('app')?.classList.add('nitec-cardapio-publico');
};

const remover_modo_publico_cardapio = () => {
    document.body.classList.remove('nitec-cardapio-publico');
    document.getElementById('app')?.classList.remove('nitec-cardapio-publico');
};

export function useLogicaCardapioCliente() {
    const rota_atual = useRoute();

    const carregando_inicial = ref(true);
    const carregando_comanda = ref(false);
    const enviando_cadastro = ref(false);
    const enviando_solicitacao = ref(false);
    const modal_solicitacao_aberto = ref(false);
    const aba_ativa = ref('cardapio');
    const config = ref(criar_config_padrao());
    const produtos = ref([]);
    const mesa = ref(null);
    const comanda = ref(null);
    const sessao_cliente = ref(null);
    const erro_carregamento = ref('');
    const feedback = ref({ tipo: '', mensagem: '' });
    const cadastro = reactive({
        nome: '',
        telefone: '',
    });
    const selecao = ref({});

    let intervalo_polling = null;
    let timeout_feedback = null;

    const id_mesa = computed(() => Number(rota_atual.params.id_mesa));
    const chave_sessao = computed(() => `nitec_cardapio_sessao:${window.location.host}:mesa:${rota_atual.params.id_mesa}`);
    const tem_sessao = computed(() => !!sessao_cliente.value?.comanda_id);
    const modo_debug = computed(() => {
        try {
            const parametros = new URLSearchParams(window.location.search);
            return parametros.has('debug') || localStorage.getItem('nitec_debug_runtime') === '1';
        } catch {
            return false;
        }
    });

    const estilo_cardapio = computed(() => ({
        '--cardapio-primary': config.value.cor_primaria || '#0F766E',
        '--cardapio-accent': config.value.cor_destaque || '#F59E0B',
        '--cardapio-bg': config.value.cor_fundo || '#FFF7ED',
    }));

    const debug_publico = computed(() => ({
        href: window.location.href,
        base_publica: obter_base_publica_cardapio(localStorage.getItem('nitec_tenant_id')),
        api_base: api_cardapio.defaults.baseURL,
        mesa_id: id_mesa.value,
        mesa: mesa.value,
        sessao: sessao_cliente.value,
        comanda_id: comanda.value?.id || null,
        produtos_carregados: produtos.value.length,
        erro_carregamento: erro_carregamento.value || null,
        feedback: feedback.value?.mensagem || null,
    }));

    const produtos_por_categoria = computed(() => {
        const grupos = {};

        for (const produto of produtos.value) {
            const categoria = produto.categoria?.trim() || 'Sem categoria';
            if (!grupos[categoria]) grupos[categoria] = [];
            grupos[categoria].push(produto);
        }

        return Object.entries(grupos)
            .sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }))
            .map(([categoria, itens]) => ({
                categoria,
                produtos: [...itens].sort((a, b) => String(a.nome_produto || '').localeCompare(String(b.nome_produto || ''), 'pt-BR', {
                    sensitivity: 'base',
                })),
            }));
    });

    const lista_solicitacao = computed(() => {
        return Object.values(selecao.value).sort((a, b) => String(a.nome_produto || '').localeCompare(String(b.nome_produto || ''), 'pt-BR', {
            sensitivity: 'base',
        }));
    });

    const total_itens_solicitacao = computed(() => {
        return lista_solicitacao.value.reduce((acc, item) => acc + Number(item.quantidade || 0), 0);
    });

    const total_solicitacao = computed(() => {
        return lista_solicitacao.value.reduce((acc, item) => {
            return acc + (Number(item.preco_venda || 0) * Number(item.quantidade || 0));
        }, 0);
    });

    const total_comanda = computed(() => Number(comanda.value?.valor_total || 0));

    const notificar = (mensagem, tipo = 'info') => {
        feedback.value = { mensagem, tipo };
        if (timeout_feedback) clearTimeout(timeout_feedback);
        timeout_feedback = setTimeout(() => {
            feedback.value = { tipo: '', mensagem: '' };
        }, 4500);
    };

    const preencher_cadastro_com_sessao = (sessao) => {
        cadastro.nome = sessao?.nome || cadastro.nome;
        cadastro.telefone = sessao?.telefone || cadastro.telefone;
    };

    const salvar_sessao = () => {
        if (!sessao_cliente.value) return;
        sessionStorage.setItem(chave_sessao.value, JSON.stringify(sessao_cliente.value));
    };

    const restaurar_sessao = () => {
        const salvo = sessionStorage.getItem(chave_sessao.value);
        if (!salvo) return;

        try {
            const sessao = JSON.parse(salvo);
            if (String(sessao.mesa_id) !== String(id_mesa.value)) return;
            sessao_cliente.value = sessao;
            preencher_cadastro_com_sessao(sessao);
        } catch (_) {
            sessionStorage.removeItem(chave_sessao.value);
        }
    };

    const limpar_sessao = (manter_cadastro = true) => {
        if (manter_cadastro && sessao_cliente.value) {
            preencher_cadastro_com_sessao(sessao_cliente.value);
        }
        sessao_cliente.value = null;
        comanda.value = null;
        sessionStorage.removeItem(chave_sessao.value);
    };

    const carregar_config_e_produtos = async () => {
        const [resposta_config, resposta_produtos] = await Promise.all([
            api_cardapio.get('/cardapio/config'),
            api_cardapio.get('/cardapio/produtos'),
        ]);

        config.value = {
            ...criar_config_padrao(),
            ...(resposta_config.data || {}),
        };
        produtos.value = resposta_produtos.data?.produtos || [];
    };

    const carregar_estado_mesa = async ({ silencioso = false } = {}) => {
        if (!id_mesa.value) return;
        if (!silencioso) carregando_comanda.value = true;

        try {
            const resposta = await api_cardapio.get(`/cardapio/mesa/${id_mesa.value}`, {
                params: sessao_cliente.value?.comanda_id ? { comanda_id: sessao_cliente.value.comanda_id } : {},
            });

            mesa.value = resposta.data?.mesa || null;

            if (!sessao_cliente.value?.comanda_id) {
                comanda.value = null;
                return;
            }

            if (resposta.data?.comanda) {
                comanda.value = resposta.data.comanda;
            } else {
                limpar_sessao(true);
                aba_ativa.value = 'cardapio';
                notificar('Sua comanda foi encerrada. Faca um novo cadastro para continuar.', 'aviso');
            }
        } catch (erro) {
            if (erro.response?.status === 404) {
                erro_carregamento.value = 'Mesa nao encontrada.';
                mesa.value = null;
                limpar_sessao(false);
            } else if (!silencioso) {
                console.error(erro);
                notificar('Nao foi possivel atualizar os dados da mesa agora.', 'erro');
            }
        } finally {
            if (!silencioso) carregando_comanda.value = false;
        }
    };

    const carregar_tela = async () => {
        carregando_inicial.value = true;
        erro_carregamento.value = '';
        restaurar_sessao();

        try {
            await carregar_config_e_produtos();
            await carregar_estado_mesa();
        } catch (erro) {
            console.error(erro);
            erro_carregamento.value = 'Nao foi possivel carregar o cardapio desta mesa.';
        } finally {
            carregando_inicial.value = false;
        }
    };

    const registrar_cliente = async () => {
        if (!cadastro.nome.trim() || !cadastro.telefone.trim()) {
            notificar('Informe nome e telefone para continuar.', 'aviso');
            return;
        }

        enviando_cadastro.value = true;
        try {
            const resposta = await api_cardapio.post('/cardapio/registrar', {
                mesa_id: id_mesa.value,
                nome: cadastro.nome.trim(),
                telefone: cadastro.telefone.trim(),
            });

            sessao_cliente.value = {
                comanda_id: resposta.data.comanda_id,
                mesa_id: resposta.data.mesa_id,
                nome: resposta.data.nome,
                telefone: resposta.data.telefone,
            };

            salvar_sessao();
            aba_ativa.value = 'cardapio';
            await carregar_estado_mesa();
            notificar('Cadastro concluido. Bem-vindo ao cardapio digital!', 'sucesso');
        } catch (erro) {
            console.error(erro);
            notificar(erro.response?.data?.mensagem || 'Nao foi possivel concluir o cadastro.', 'erro');
        } finally {
            enviando_cadastro.value = false;
        }
    };

    const obter_quantidade_selecionada = (produto_id) => {
        return selecao.value[produto_id]?.quantidade || 0;
    };

    const ajustar_quantidade_solicitacao = (produto, delta) => {
        const atual = obter_quantidade_selecionada(produto.id);
        const proximo = Math.max(0, atual + delta);

        if (proximo === 0) {
            delete selecao.value[produto.id];
            selecao.value = { ...selecao.value };
            return;
        }

        selecao.value = {
            ...selecao.value,
            [produto.id]: {
                id: produto.id,
                nome_produto: produto.nome_produto,
                preco_venda: Number(produto.preco_venda || 0),
                quantidade: proximo,
            },
        };
    };

    const abrir_modal_solicitacao = () => {
        if (!tem_sessao.value) {
            notificar('Cadastre-se primeiro para solicitar atendimento.', 'aviso');
            return;
        }

        if (lista_solicitacao.value.length === 0) {
            notificar('Selecione ao menos um produto antes de solicitar atendimento.', 'aviso');
            return;
        }

        modal_solicitacao_aberto.value = true;
    };

    const fechar_modal_solicitacao = () => {
        modal_solicitacao_aberto.value = false;
    };

    const enviar_solicitacao_atendimento = async () => {
        if (!tem_sessao.value || lista_solicitacao.value.length === 0) return;

        enviando_solicitacao.value = true;
        try {
            await api_cardapio.post('/cardapio/solicitar-atendimento', {
                mesa_id: id_mesa.value,
                comanda_id: sessao_cliente.value.comanda_id,
                nome_cliente: sessao_cliente.value.nome,
                telefone: sessao_cliente.value.telefone,
                produtos_desejados: lista_solicitacao.value.map((item) => ({
                    id: item.id,
                    quantidade: item.quantidade,
                })),
            });

            selecao.value = {};
            modal_solicitacao_aberto.value = false;
            notificar('Garcom notificado!', 'sucesso');
            await carregar_estado_mesa({ silencioso: true });
        } catch (erro) {
            console.error(erro);
            notificar(erro.response?.data?.mensagem || 'Nao foi possivel enviar a solicitacao.', 'erro');
        } finally {
            enviando_solicitacao.value = false;
        }
    };

    const iniciar_polling = () => {
        if (intervalo_polling) return;

        intervalo_polling = setInterval(() => {
            if (sessao_cliente.value?.comanda_id) {
                carregar_estado_mesa({ silencioso: true });
            }
        }, 10000);
    };

    const parar_polling = () => {
        if (!intervalo_polling) return;
        clearInterval(intervalo_polling);
        intervalo_polling = null;
    };

    watch(() => rota_atual.params.id_mesa, () => {
        limpar_sessao(false);
        selecao.value = {};
        carregar_tela();
    });

    onMounted(() => {
        aplicar_modo_publico_cardapio();
        carregar_tela();
        iniciar_polling();
    });

    onUnmounted(() => {
        remover_modo_publico_cardapio();
        parar_polling();
        if (timeout_feedback) clearTimeout(timeout_feedback);
    });

    return {
        carregando_inicial,
        carregando_comanda,
        enviando_cadastro,
        enviando_solicitacao,
        modal_solicitacao_aberto,
        aba_ativa,
        config,
        mesa,
        comanda,
        cadastro,
        feedback,
        erro_carregamento,
        tem_sessao,
        modo_debug,
        debug_publico,
        estilo_cardapio,
        produtos_por_categoria,
        lista_solicitacao,
        total_itens_solicitacao,
        total_solicitacao,
        total_comanda,
        registrar_cliente,
        obter_quantidade_selecionada,
        ajustar_quantidade_solicitacao,
        abrir_modal_solicitacao,
        fechar_modal_solicitacao,
        enviar_solicitacao_atendimento,
    };
}
