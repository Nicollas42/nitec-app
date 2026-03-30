import { reactive, ref, computed, onMounted, onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';
import { useToastStore } from '../stores/toast_store.js';

// ─── Fábricas de estado vazio ────────────────────────────────────────────────

const criar_alias_vazio = () => ({
    id: null,
    codigo_barras: '',
    descricao_variacao: '',
});

const criar_vinculo_fornecedor_vazio = () => ({
    fornecedor_id: null,
    codigo_sku_fornecedor: '',
    unidade_embalagem: 'CX',
    fator_conversao: 1,
    custo_embalagem: '',
});

const criar_formulario_fornecedor_vazio = () => ({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    telefone: '',
    email: '',
    vendedor: '',
    contato_vendedor: '',
    status_fornecedor: 'ativo',
});

// ─── Estado de supressão do popstate (módulo, não reativo) ───────────────────
let _suprimindo_popstate = false;

// ─── Composable principal ────────────────────────────────────────────────────

export function use_logica_produtos() {
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    const toast_global = useToastStore();
    const { lista_produtos } = storeToRefs(loja_produtos);

    // ── Estado de navegação ──────────────────────────────────────────────────
    const aba_ativa = ref('estoque');
    const pilha_abas = ref([]);
    const termo_pesquisa = ref('');
    const filtro_fornecedor_id = ref('');
    const produto_expandido_ids = ref({});

    // ── Estado do formulário de produto ─────────────────────────────────────
    const carregando_produto = ref(false);
    const salvando = ref(false);
    const produto_excluindo_id = ref(null);
    const modo_edicao = ref(false);
    const id_edicao = ref(null);

    // ── Estado dos modais de estoque ─────────────────────────────────────────
    const modal_perda = ref(false);
    const registrando_perda = ref(false);
    const modal_entrada = ref(false);
    const registrando_entrada = ref(false);
    const termo_fornecedor_entrada = ref('');
    const dropdown_fornecedor_entrada_aberto = ref(false);

    /**
     * Detalhes completos do produto aberto no modal de entrada.
     * Contém os fornecedores_vinculados do produto para filtrar o dropdown.
     */
    const detalhes_produto_entrada = ref(null);

    // ── Estado do formulário de fornecedor ───────────────────────────────────
    const salvando_fornecedor = ref(false);
    const fornecedor_excluindo_id = ref(null);

    /**
     * 'produto' = formulário aberto pelo fluxo de cadastro de produto
     * 'entrada' = formulário aberto pelo modal de entrada de estoque
     * 'fornecedores' = aberto diretamente da aba fornecedores
     */
    const contexto_modal_fornecedor = ref('fornecedores');
    const modo_edicao_fornecedor = ref(false);
    const fornecedor_edicao_id = ref(null);
    const formulario_fornecedor_minimizado = ref(false);

    // ── Listas carregadas do backend ─────────────────────────────────────────
    const lista_fornecedores = ref([]);

    // ── Estado de adicionais ───────────────────────────────────────────────
    const lista_grupos_adicionais = ref([]);
    const grupo_em_edicao = ref(null);           // null = criar, object = editar
    const input_nome_grupo = ref('');
    const input_maximo_selecoes = ref(0);
    const input_nome_item = ref('');
    const input_preco_item = ref('');
    const grupo_expandido = ref(null);           // id do grupo expandido
    const item_em_edicao = ref(null);            // null = criar, object = editar
    const mostrando_form_grupo = ref(false);     // controla visibilidade do form

    // ── Formulários reativos ─────────────────────────────────────────────────

    const formulario_dados = reactive({
        nome_produto: '',
        codigo_interno: '',
        unidade_medida: 'UN',
        preco_venda: '',
        preco_custo_medio: '',
        margem_lucro_percentual: 0,
        categoria: 'Geral',
        codigos_barras_adicionais: [],
        fornecedores_vinculados: [],
        // Novo campo: tipo de item (orienta a UX sem mudar a estrutura do backend)
        tipo_item: 'comprado', // 'comprado' | 'fabricado'
        grupos_adicionais_ids: [],
        requer_cozinha: false,
    });

    const formulario_perda = reactive({
        produto_id: null,
        nome_produto: '',
        quantidade: 1,
        motivo: 'Quebra / Dano',
        observacao: '',
    });

    const formulario_entrada = reactive({
        modo_entrada: 'ajuste_manual',
        produto_id: null,
        nome_produto: '',
        fornecedor_id: null,
        quantidade_comprada: 1,
        custo_unitario_compra: '',
        codigo_sku_fornecedor: '',
        fator_conversao: 1,
        unidades_entrada: 1,
        custo_total_entrada: 0,
        custo_unitario_medio_entrada: 0,
        data_validade_lote: '',
    });

    const formulario_fornecedor = reactive(criar_formulario_fornecedor_vazio());

    // ─── Utilitários ─────────────────────────────────────────────────────────

    const normalizar_texto_busca = (valor) => String(valor || '').toLowerCase().trim();

    /**
     * Formata data ISO para exibição amigável.
     */
    const formatar_data_tabela = (valor_data) => {
        if (!valor_data) return 'Sem validade';
        return new Date(`${valor_data}T00:00:00`).toLocaleDateString('pt-BR');
    };

    /**
     * Retorna todos os códigos pesquisáveis de um produto.
     */
    const obter_codigos_produto = (produto) => {
        const codigos_barras = Array.isArray(produto?.codigos_barras) ? produto.codigos_barras : [];
        const codigo_principal = produto?.codigo_barras_principal ? [produto.codigo_barras_principal] : [];
        return [...new Set([produto?.codigo_interno, ...codigo_principal, ...codigos_barras].filter(Boolean))];
    };

    // ─── Computeds de listagem ────────────────────────────────────────────────

    const produtos_filtrados = computed(() => {
        if (!termo_pesquisa.value) return lista_produtos.value;
        const termo = termo_pesquisa.value.toLowerCase().trim();
        return lista_produtos.value.filter((produto) => {
            const nome_ok = produto.nome_produto.toLowerCase().includes(termo);
            const codigo_ok = obter_codigos_produto(produto).some((c) => String(c).toLowerCase().includes(termo));
            return nome_ok || codigo_ok;
        });
    });

    const fornecedores_filtrados = computed(() => {
        const ordenados = [...lista_fornecedores.value].sort((a, b) =>
            String(a.nome_fantasia || '').localeCompare(String(b.nome_fantasia || ''))
        );
        if (!filtro_fornecedor_id.value) return ordenados;
        return ordenados.filter((f) => Number(f.id) === Number(filtro_fornecedor_id.value));
    });

    const opcoes_filtro_fornecedor = computed(() =>
        [...lista_fornecedores.value]
            .sort((a, b) => String(a.nome_fantasia || '').localeCompare(String(b.nome_fantasia || '')))
            .map((f) => ({
                id: f.id,
                label: [f.nome_fantasia, f.vendedor, f.contato_vendedor, f.cnpj].filter(Boolean).join(' | '),
            }))
    );

    /**
     * CORREÇÃO: filtra apenas os fornecedores que estão vinculados ao produto
     * aberto no modal de entrada, evitando seleção de fornecedor não-vinculado.
     */
    const fornecedores_filtrados_entrada = computed(() => {
        const termo = normalizar_texto_busca(termo_fornecedor_entrada.value);

        // Se o produto tem fornecedores vinculados, mostra só eles
        const fornecedores_do_produto = detalhes_produto_entrada.value?.fornecedores_vinculados || [];
        const ids_vinculados = fornecedores_do_produto.map((fv) => Number(fv.fornecedor_id));

        const base =
            ids_vinculados.length > 0
                ? lista_fornecedores.value.filter((f) => ids_vinculados.includes(Number(f.id)))
                : lista_fornecedores.value;

        if (!termo) return base;

        return base.filter((f) => {
            return (
                normalizar_texto_busca(f.nome_fantasia).includes(termo) ||
                normalizar_texto_busca(f.razao_social).includes(termo) ||
                normalizar_texto_busca(f.cnpj).includes(termo) ||
                normalizar_texto_busca(f.vendedor).includes(termo)
            );
        });
    });

    /**
     * Retorna o vínculo produto-fornecedor correspondente ao fornecedor selecionado
     * na entrada, para exibir fator de conversão e SKU.
     */
    const fornecedor_entrada_vinculado = computed(() => {
        if (!formulario_entrada.fornecedor_id || !detalhes_produto_entrada.value) return null;
        return (detalhes_produto_entrada.value.fornecedores_vinculados || []).find(
            (fv) => Number(fv.fornecedor_id) === Number(formulario_entrada.fornecedor_id)
        ) || null;
    });

    /**
     * CORREÇÃO: computed definido fora do return, como todos os demais.
     */
    const produto_entrada_possui_fornecedores_vinculados = computed(() => {
        return (detalhes_produto_entrada.value?.fornecedores_vinculados?.length || 0) > 0;
    });

    const entrada_pronta_para_salvar = computed(() => {
        const base =
            formulario_entrada.produto_id &&
            Number(formulario_entrada.quantidade_comprada) > 0 &&
            Number(formulario_entrada.custo_unitario_compra) >= 0;

        if (formulario_entrada.modo_entrada !== 'compra_fornecedor') return Boolean(base);

        return Boolean(base && formulario_entrada.fornecedor_id && fornecedor_entrada_vinculado.value);
    });

    // ─── Reinicializadores ────────────────────────────────────────────────────

    const reiniciar_formulario_produto = () => {
        formulario_dados.nome_produto = '';
        formulario_dados.codigo_interno = '';
        formulario_dados.unidade_medida = 'UN';
        formulario_dados.preco_venda = '';
        formulario_dados.preco_custo_medio = '';
        formulario_dados.margem_lucro_percentual = 0;
        formulario_dados.categoria = 'Geral';
        formulario_dados.tipo_item = 'comprado';
        formulario_dados.codigos_barras_adicionais = [];
        formulario_dados.fornecedores_vinculados = [];
        formulario_dados.grupos_adicionais_ids = [];
        formulario_dados.requer_cozinha = false;
    };

    const reiniciar_formulario_entrada = () => {
        formulario_entrada.modo_entrada = 'ajuste_manual';
        formulario_entrada.produto_id = null;
        formulario_entrada.nome_produto = '';
        formulario_entrada.fornecedor_id = null;
        formulario_entrada.quantidade_comprada = 1;
        formulario_entrada.custo_unitario_compra = '';
        formulario_entrada.codigo_sku_fornecedor = '';
        formulario_entrada.fator_conversao = 1;
        formulario_entrada.unidades_entrada = 1;
        formulario_entrada.custo_total_entrada = 0;
        formulario_entrada.custo_unitario_medio_entrada = 0;
        formulario_entrada.data_validade_lote = '';
        termo_fornecedor_entrada.value = '';
        dropdown_fornecedor_entrada_aberto.value = false;
        detalhes_produto_entrada.value = null;
    };

    const reiniciar_formulario_fornecedor = () => {
        Object.assign(formulario_fornecedor, criar_formulario_fornecedor_vazio());
    };

    const preencher_formulario_fornecedor = (fornecedor) => {
        formulario_fornecedor.nome_fantasia = fornecedor.nome_fantasia || '';
        formulario_fornecedor.razao_social = fornecedor.razao_social || '';
        formulario_fornecedor.cnpj = fornecedor.cnpj || '';
        formulario_fornecedor.telefone = fornecedor.telefone || '';
        formulario_fornecedor.email = fornecedor.email || '';
        formulario_fornecedor.vendedor = fornecedor.vendedor || '';
        formulario_fornecedor.contato_vendedor = fornecedor.contato_vendedor || '';
        formulario_fornecedor.status_fornecedor = fornecedor.status_fornecedor || 'ativo';
    };

    // ─── Navegação entre abas ─────────────────────────────────────────────────

    // Avança para uma nova aba e registra uma entrada no histórico do browser,
    // para que o botão Voltar nativo do celular funcione corretamente.
    const ir_para_aba_interna = (nova_aba) => {
        pilha_abas.value.push(aba_ativa.value);
        aba_ativa.value = nova_aba;
        window.history.pushState({ sub_aba_produtos: nova_aba }, '');
    };

    // Volta um nível na pilha interna e sincroniza o histórico do browser.
    // Chamado pelos botões visuais de cancelar / voltar.
    const voltar_aba_um_nivel = () => {
        if (pilha_abas.value.length > 0) {
            aba_ativa.value = pilha_abas.value.pop();
            _suprimindo_popstate = true;
            window.history.go(-1);
        } else {
            roteador.back();
        }
    };

    // Pula direto ao estoque, limpando toda a pilha e sincronizando o histórico.
    const ir_diretamente_para_estoque = () => {
        const passos = pilha_abas.value.length;
        pilha_abas.value = [];
        aba_ativa.value = 'estoque';
        if (passos > 0) window.history.go(-passos);
    };

    // Chamado pelo listener popstate do componente (botão Voltar do celular).
    const manejar_popstate_produtos = (evento) => {
        if (_suprimindo_popstate) {
            _suprimindo_popstate = false;
            return;
        }
        if (evento.state && 'sub_aba_produtos' in evento.state) {
            if (pilha_abas.value.length > 0) {
                aba_ativa.value = pilha_abas.value.pop();
            }
        }
    };

    const abrir_aba_estoque = () => ir_diretamente_para_estoque();

    const abrir_aba_fornecedores = () => {
        contexto_modal_fornecedor.value = 'fornecedores';
        ir_para_aba_interna('fornecedores');
    };

    const voltar_painel = () => roteador.push('/painel-central');

    // ─── Expansão de linhas ───────────────────────────────────────────────────

    const produto_tem_detalhamento_fornecedor = (produto) =>
        Boolean(produto?.pode_expandir_estoque && Array.isArray(produto?.estoque_por_fornecedor));

    const produto_esta_expandido = (produto_id) =>
        Boolean(produto_expandido_ids.value[String(produto_id)]);

    const alternar_expansao_produto = (produto_id) => {
        const chave = String(produto_id);
        produto_expandido_ids.value = {
            ...produto_expandido_ids.value,
            [chave]: !produto_expandido_ids.value[chave],
        };
    };

    const alternar_formulario_fornecedor_minimizado = () => {
        formulario_fornecedor_minimizado.value = !formulario_fornecedor_minimizado.value;
    };

    // ─── Carregamento de dados ────────────────────────────────────────────────

    const carregar_fornecedores = async () => {
        try {
            const resposta = await api_cliente.get('/listar-fornecedores');
            lista_fornecedores.value = resposta.data.fornecedores || [];
        } catch (erro) {
            console.error('Erro ao carregar fornecedores:', erro);
        }
    };

    const buscar_detalhes_produto = async (produto_id) => {
        const resposta = await api_cliente.get(`/produtos/detalhes/${produto_id}`);
        return resposta.data.produto;
    };

    // ─── Formulário de produto ────────────────────────────────────────────────

    /**
     * Derivado do tipo_item: se for 'fabricado', limpa fornecedores ao salvar.
     */
    const preencher_formulario_produto = (produto) => {
        formulario_dados.nome_produto = produto.nome_produto || '';
        formulario_dados.codigo_interno = produto.codigo_interno || '';
        formulario_dados.unidade_medida = produto.unidade_medida || 'UN';
        formulario_dados.preco_venda = produto.preco_venda ?? '';
        formulario_dados.preco_custo_medio = produto.preco_custo_medio ?? '';
        formulario_dados.margem_lucro_percentual = produto.margem_lucro_percentual ?? 0;
        formulario_dados.categoria = produto.categoria || 'Geral';

        // Infere tipo_item a partir dos dados do produto
        const tem_fornecedores = (produto.fornecedores_vinculados || []).length > 0;
        formulario_dados.tipo_item = tem_fornecedores ? 'comprado' : 'fabricado';

        formulario_dados.codigos_barras_adicionais =
            (produto.codigos_barras_adicionais || []).length > 0
                ? produto.codigos_barras_adicionais.map((cb) => ({
                      id: cb.id ?? null,
                      codigo_barras: cb.codigo_barras || '',
                      descricao_variacao: cb.descricao_variacao || '',
                  }))
                : [];

        formulario_dados.fornecedores_vinculados =
            (produto.fornecedores_vinculados || []).length > 0
                ? produto.fornecedores_vinculados.map((fv) => ({
                      fornecedor_id: fv.fornecedor_id ?? null,
                      codigo_sku_fornecedor: fv.codigo_sku_fornecedor || '',
                      unidade_embalagem: fv.unidade_embalagem || 'CX',
                      fator_conversao: Number(fv.fator_conversao || 1),
                      custo_embalagem: fv.ultimo_preco_compra ?? '',
                  }))
                : [];

        formulario_dados.grupos_adicionais_ids =
            Array.isArray(produto.grupos_adicionais_ids) ? [...produto.grupos_adicionais_ids] : [];
        formulario_dados.requer_cozinha = !!produto.requer_cozinha;
    };

    const montar_payload_produto = () => {
        const fornecedores =
            formulario_dados.tipo_item === 'comprado'
                ? formulario_dados.fornecedores_vinculados
                      .map((fv) => ({
                          fornecedor_id: fv.fornecedor_id ? Number(fv.fornecedor_id) : null,
                          codigo_sku_fornecedor: fv.codigo_sku_fornecedor.trim(),
                          unidade_embalagem: fv.unidade_embalagem || 'CX',
                          fator_conversao: Number(fv.fator_conversao || 1),
                          custo_embalagem: Number(fv.custo_embalagem || 0),
                      }))
                      .filter((fv) => fv.fornecedor_id)
                : [];

        return {
            nome_produto: formulario_dados.nome_produto.trim(),
            codigo_interno: formulario_dados.codigo_interno.trim(),
            unidade_medida: formulario_dados.unidade_medida,
            preco_venda: Number(formulario_dados.preco_venda || 0),
            preco_custo_medio: Number(formulario_dados.preco_custo_medio || 0),
            margem_lucro_percentual: Number(formulario_dados.margem_lucro_percentual || 0),
            categoria: formulario_dados.categoria,
            codigos_barras_adicionais: formulario_dados.codigos_barras_adicionais
                .map((cb) => ({
                    id: cb.id || null,
                    codigo_barras: cb.codigo_barras.trim(),
                    descricao_variacao: cb.descricao_variacao?.trim() || null,
                }))
                .filter((cb) => cb.codigo_barras),
            fornecedores_vinculados: fornecedores,
            grupos_adicionais_ids: formulario_dados.grupos_adicionais_ids
                .map((id) => Number(id))
                .filter(Boolean),
            requer_cozinha: !!formulario_dados.requer_cozinha,
        };
    };

    const validar_formulario_produto = () => {
        const payload = montar_payload_produto();
        const codigos = payload.codigos_barras_adicionais.map((cb) => cb.codigo_barras);
        const fornecedores_ids = payload.fornecedores_vinculados
            .map((fv) => fv.fornecedor_id)
            .filter(Boolean);

        if (!payload.nome_produto) {
            alert('Informe o nome do produto.');
            return false;
        }

        if (!payload.codigo_interno) {
            alert('Informe o código interno do produto (ex: BEB-001).');
            return false;
        }

        if (!payload.unidade_medida) {
            alert('Selecione a unidade de medida.');
            return false;
        }

        if (codigos.length !== new Set(codigos).size) {
            alert('Existem códigos de barras duplicados.');
            return false;
        }

        if (fornecedores_ids.length !== new Set(fornecedores_ids).size) {
            alert('O mesmo fornecedor não pode ser vinculado duas vezes.');
            return false;
        }

        if (formulario_dados.tipo_item === 'comprado') {
            const vinculo_sem_sku = payload.fornecedores_vinculados.find(
                (fv) => fv.fornecedor_id && !fv.codigo_sku_fornecedor
            );
            if (vinculo_sem_sku) {
                alert('Preencha o código SKU para todos os fornecedores vinculados.');
                return false;
            }
        }

        return true;
    };

    const adicionar_alias_codigo_barras = () => {
        formulario_dados.codigos_barras_adicionais.push(criar_alias_vazio());
    };

    /**
     * CORREÇÃO: ao remover o único alias, limpa o array em vez de manter
     * uma linha vazia — o formulário já tem estado vazio explícito.
     */
    const remover_alias_codigo_barras = (indice) => {
        formulario_dados.codigos_barras_adicionais.splice(indice, 1);
        if (formulario_dados.codigos_barras_adicionais.length === 0) {
            formulario_dados.codigos_barras_adicionais = [criar_alias_vazio()];
        }
    };

    const adicionar_vinculo_fornecedor = () => {
        formulario_dados.fornecedores_vinculados.push(criar_vinculo_fornecedor_vazio());
    };

    /**
     * CORREÇÃO: ao remover o único vínculo, limpa o array completamente —
     * o estado vazio é representado por array vazio, não por linha fantasma.
     */
    const remover_vinculo_fornecedor = (indice) => {
        formulario_dados.fornecedores_vinculados.splice(indice, 1);
    };

    const abrir_modal_novo = async () => {
        modo_edicao.value = false;
        id_edicao.value = null;
        reiniciar_formulario_produto();
        await Promise.all([carregar_fornecedores(), carregar_grupos_adicionais()]);
        ir_para_aba_interna('formulario_produto');
    };

    const abrir_modal_edicao = async (produto) => {
        carregando_produto.value = true;
        modo_edicao.value = true;
        id_edicao.value = produto.id;
        ir_para_aba_interna('formulario_produto');
        try {
            await Promise.all([carregar_fornecedores(), carregar_grupos_adicionais()]);
            const detalhes = await buscar_detalhes_produto(produto.id);
            preencher_formulario_produto(detalhes);
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao carregar os detalhes do produto.');
            ir_diretamente_para_estoque();
        } finally {
            carregando_produto.value = false;
        }
    };

    const cancelar_formulario_produto = () => {
        modo_edicao.value = false;
        id_edicao.value = null;
        reiniciar_formulario_produto();
        voltar_aba_um_nivel();
    };

    const salvar_produto = async () => {
        if (!validar_formulario_produto()) return;
        salvando.value = true;
        try {
            const payload = montar_payload_produto();
            if (modo_edicao.value) {
                await api_cliente.post(`/produtos/editar/${id_edicao.value}`, payload);
            } else {
                await api_cliente.post('/cadastrar-produto', payload);
            }
            modo_edicao.value = false;
            id_edicao.value = null;
            await loja_produtos.buscar_produtos(true);
            await carregar_fornecedores();
            voltar_aba_um_nivel();
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao salvar o produto.');
        } finally {
            salvando.value = false;
        }
    };

    /**
     * MELHORIA: avisa ao usuário se o produto tem histórico de estoque
     * antes de prosseguir com a exclusão (soft delete é seguro, mas o
     * usuário merece ser informado).
     */
    const excluir_produto = async (produto) => {
        const tem_estoque = Number(produto.estoque_atual) > 0;
        const mensagem = tem_estoque
            ? `"${produto.nome_produto}" tem ${produto.estoque_atual} unidade(s) em estoque. Ao excluir, o histórico será preservado mas o produto sairá da listagem. Confirma?`
            : `Deseja realmente excluir "${produto.nome_produto}"?`;

        if (!(await window.confirm(mensagem))) return;

        produto_excluindo_id.value = produto.id;
        try {
            await api_cliente.delete(`/produtos/excluir/${produto.id}`);
            await loja_produtos.buscar_produtos(true);
            if (Number(id_edicao.value) === Number(produto.id)) {
                cancelar_formulario_produto();
            }
        } catch (erro) {
            alert(
                erro.response?.data?.mensagem ||
                    erro.response?.data?.errors?.produto?.[0] ||
                    'Erro ao excluir o produto.'
            );
        } finally {
            produto_excluindo_id.value = null;
        }
    };

    // ─── Modal de perda ───────────────────────────────────────────────────────

    const abrir_modal_perda = (produto) => {
        formulario_perda.produto_id = produto.id;
        formulario_perda.nome_produto = produto.nome_produto;
        formulario_perda.quantidade = 1;
        formulario_perda.motivo = 'Quebra / Dano';
        formulario_perda.observacao = '';
        modal_perda.value = true;
    };

    const registrar_perda = async () => {
        if (Number(formulario_perda.quantidade) <= 0) {
            alert('A quantidade deve ser maior que zero.');
            return;
        }
        registrando_perda.value = true;
        try {
            await api_cliente.post('/estoque/registrar-perda', {
                produto_id: formulario_perda.produto_id,
                quantidade: Number(formulario_perda.quantidade),
                motivo: formulario_perda.observacao
                    ? `${formulario_perda.motivo} — ${formulario_perda.observacao}`
                    : formulario_perda.motivo,
            });
            modal_perda.value = false;
            await loja_produtos.buscar_produtos(true);
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao registrar baixa.');
        } finally {
            registrando_perda.value = false;
        }
    };

    // ─── Modal de entrada ─────────────────────────────────────────────────────

    const recalcular_entrada = () => {
        const qtd = Number(formulario_entrada.quantidade_comprada || 0);
        const custo = Number(formulario_entrada.custo_unitario_compra || 0);
        const fator =
            formulario_entrada.modo_entrada === 'compra_fornecedor'
                ? Number(formulario_entrada.fator_conversao || 1)
                : 1;
        const unidades = Math.max(0, qtd * fator);
        const custo_total = Number((qtd * custo).toFixed(2));

        formulario_entrada.unidades_entrada = unidades;
        formulario_entrada.custo_total_entrada = custo_total;
        formulario_entrada.custo_unitario_medio_entrada = unidades > 0
            ? Number((custo_total / unidades).toFixed(4))
            : 0;
    };

    const atualizar_fornecedor_entrada = () => {
        if (formulario_entrada.modo_entrada !== 'compra_fornecedor') {
            formulario_entrada.fornecedor_id = null;
            formulario_entrada.codigo_sku_fornecedor = '';
            formulario_entrada.fator_conversao = 1;
            recalcular_entrada();
            return;
        }

        const vinculo = fornecedor_entrada_vinculado.value;
        if (!vinculo) {
            formulario_entrada.codigo_sku_fornecedor = '';
            formulario_entrada.fator_conversao = 1;
            recalcular_entrada();
            return;
        }

        formulario_entrada.codigo_sku_fornecedor = vinculo.codigo_sku_fornecedor || '';
        formulario_entrada.fator_conversao = Number(vinculo.fator_conversao || 1);
        if (!formulario_entrada.custo_unitario_compra || Number(formulario_entrada.custo_unitario_compra) === 0) {
            formulario_entrada.custo_unitario_compra = vinculo.ultimo_preco_compra ?? '';
        }
        recalcular_entrada();
    };

    const atualizar_modo_entrada = () => {
        if (formulario_entrada.modo_entrada !== 'compra_fornecedor') {
            atualizar_fornecedor_entrada();
            return;
        }
        const primeiro = detalhes_produto_entrada.value?.fornecedores_vinculados?.[0] || null;
        if (!primeiro) {
            formulario_entrada.modo_entrada = 'ajuste_manual';
            atualizar_fornecedor_entrada();
            return;
        }
        const fornecedor = lista_fornecedores.value.find(
            (f) => Number(f.id) === Number(primeiro.fornecedor_id)
        );
        if (fornecedor && !formulario_entrada.fornecedor_id) {
            selecionar_fornecedor_entrada(fornecedor);
        } else {
            atualizar_fornecedor_entrada();
        }
    };

    const selecionar_fornecedor_entrada = (fornecedor) => {
        formulario_entrada.fornecedor_id = fornecedor.id;
        termo_fornecedor_entrada.value = fornecedor.nome_fantasia;
        dropdown_fornecedor_entrada_aberto.value = false;
        atualizar_fornecedor_entrada();
    };

    const fechar_dropdown_fornecedor_entrada = () => {
        dropdown_fornecedor_entrada_aberto.value = false;
    };

    const abrir_modal_entrada = async (produto) => {
        reiniciar_formulario_entrada();
        formulario_entrada.produto_id = produto.id;
        formulario_entrada.nome_produto = produto.nome_produto;
        // Custo fica vazio intencionalmente: o usuário informa o custo real
        // da embalagem nesta compra. Será preenchido automaticamente com o
        // ultimo_preco_compra do fornecedor assim que ele for selecionado.
        formulario_entrada.custo_unitario_compra = '';
        modal_entrada.value = true;

        try {
            await carregar_fornecedores();
            detalhes_produto_entrada.value = await buscar_detalhes_produto(produto.id);

            const primeiro = detalhes_produto_entrada.value.fornecedores_vinculados?.[0] || null;
            if (primeiro) {
                formulario_entrada.modo_entrada = 'compra_fornecedor';
                const fornecedor = lista_fornecedores.value.find(
                    (f) => Number(f.id) === Number(primeiro.fornecedor_id)
                );
                if (fornecedor) {
                    selecionar_fornecedor_entrada(fornecedor);
                } else {
                    atualizar_fornecedor_entrada();
                }
            } else {
                formulario_entrada.modo_entrada = 'ajuste_manual';
                recalcular_entrada();
            }
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao carregar os dados de entrada de estoque.');
            modal_entrada.value = false;
        }
    };

    const registrar_entrada = async () => {
        if (!entrada_pronta_para_salvar.value) {
            alert(
                'Preencha os valores da entrada. Para compra por fornecedor, selecione um fornecedor vinculado ao produto.'
            );
            return;
        }
        registrando_entrada.value = true;
        try {
            await api_cliente.post('/estoque/registrar-entrada', {
                modo_entrada: formulario_entrada.modo_entrada,
                produto_id: formulario_entrada.produto_id,
                fornecedor_id:
                    formulario_entrada.modo_entrada === 'compra_fornecedor'
                        ? Number(formulario_entrada.fornecedor_id)
                        : null,
                quantidade_comprada: Number(formulario_entrada.quantidade_comprada),
                custo_unitario_compra: Number(formulario_entrada.custo_unitario_compra),
                data_validade_lote: formulario_entrada.data_validade_lote || null,
            });
            modal_entrada.value = false;
            await loja_produtos.buscar_produtos(true);
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao registrar entrada.');
        } finally {
            registrando_entrada.value = false;
        }
    };

    // ─── Fornecedor ───────────────────────────────────────────────────────────

    const abrir_modal_novo_fornecedor = (contexto = 'produto') => {
        contexto_modal_fornecedor.value = contexto;
        modo_edicao_fornecedor.value = false;
        fornecedor_edicao_id.value = null;
        reiniciar_formulario_fornecedor();
        formulario_fornecedor_minimizado.value = false;
        if (contexto === 'entrada') modal_entrada.value = false;
        ir_para_aba_interna('fornecedores');
    };

    const abrir_edicao_fornecedor = (fornecedor) => {
        contexto_modal_fornecedor.value = 'fornecedores';
        modo_edicao_fornecedor.value = true;
        fornecedor_edicao_id.value = fornecedor.id;
        formulario_fornecedor_minimizado.value = false;
        preencher_formulario_fornecedor(fornecedor);
        aba_ativa.value = 'fornecedores';
    };

    const cancelar_formulario_fornecedor = () => {
        contexto_modal_fornecedor.value = 'fornecedores';
        modo_edicao_fornecedor.value = false;
        fornecedor_edicao_id.value = null;
        reiniciar_formulario_fornecedor();
        aba_ativa.value = 'fornecedores';
    };

    const salvar_fornecedor = async () => {
        salvando_fornecedor.value = true;
        try {
            const payload = {
                nome_fantasia: formulario_fornecedor.nome_fantasia.trim(),
                razao_social: formulario_fornecedor.razao_social.trim(),
                cnpj: formulario_fornecedor.cnpj.trim(),
                telefone: formulario_fornecedor.telefone.trim() || null,
                email: formulario_fornecedor.email.trim() || null,
                vendedor: formulario_fornecedor.vendedor.trim() || null,
                contato_vendedor: formulario_fornecedor.contato_vendedor.trim() || null,
                status_fornecedor: formulario_fornecedor.status_fornecedor,
            };

            const resposta = modo_edicao_fornecedor.value
                ? await api_cliente.post(`/fornecedores/editar/${fornecedor_edicao_id.value}`, payload)
                : await api_cliente.post('/fornecedores/cadastrar', payload);

            const novo_fornecedor = resposta.data.fornecedor;
            await carregar_fornecedores();

            // Após criar via contexto produto, injeta automaticamente no formulário
            if (!modo_edicao_fornecedor.value && contexto_modal_fornecedor.value === 'produto') {
                let idx = formulario_dados.fornecedores_vinculados.findIndex((fv) => !fv.fornecedor_id);
                if (idx === -1) {
                    adicionar_vinculo_fornecedor();
                    idx = formulario_dados.fornecedores_vinculados.length - 1;
                }
                formulario_dados.fornecedores_vinculados[idx].fornecedor_id = novo_fornecedor.id;
                voltar_aba_um_nivel();
            } else {
                aba_ativa.value = 'fornecedores';
            }

            modo_edicao_fornecedor.value = false;
            fornecedor_edicao_id.value = null;
            reiniciar_formulario_fornecedor();
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao salvar fornecedor.');
        } finally {
            salvando_fornecedor.value = false;
        }
    };

    const excluir_fornecedor = async (fornecedor) => {
        if (!(await window.confirm(`Deseja realmente excluir o fornecedor "${fornecedor.nome_fantasia}"?`))) return;

        fornecedor_excluindo_id.value = fornecedor.id;
        try {
            await api_cliente.delete(`/fornecedores/excluir/${fornecedor.id}`);
            await carregar_fornecedores();

            // Remove da lista de vínculos do formulário de produto se estiver aberto
            formulario_dados.fornecedores_vinculados = formulario_dados.fornecedores_vinculados.filter(
                (fv) => Number(fv.fornecedor_id) !== Number(fornecedor.id)
            );

            if (Number(fornecedor_edicao_id.value) === Number(fornecedor.id)) {
                cancelar_formulario_fornecedor();
            }
        } catch (erro) {
            const mensagem =
                erro.response?.data?.mensagem ||
                erro.response?.data?.errors?.fornecedor?.[0] ||
                'Erro ao excluir o fornecedor.';
            alert(mensagem);
        } finally {
            fornecedor_excluindo_id.value = null;
        }
    };

    // ─── Triagem de Cozinha ───────────────────────────────────────────────────

    const abrir_aba_cozinha = () => {
        ir_para_aba_interna('cozinha_triagem');
    };

    const alternar_requer_cozinha = async (produto_id, valor) => {
        try {
            await api_cliente.post(`/produtos/${produto_id}/requer-cozinha`, { requer_cozinha: valor });
            const idx = lista_produtos.value.findIndex(p => p.id === produto_id);
            if (idx !== -1) lista_produtos.value[idx].requer_cozinha = valor;
        } catch (erro) {
            toast_global.exibir_toast(erro.response?.data?.mensagem || 'Erro ao atualizar.', 'erro');
        }
    };

    // ─── Adicionais (grupos + itens) ──────────────────────────────────────────

    const abrir_aba_adicionais = () => {
        ir_para_aba_interna('adicionais');
        carregar_grupos_adicionais();
    };

    const carregar_grupos_adicionais = async () => {
        try {
            const resposta = await api_cliente.get('/grupos-adicionais');
            lista_grupos_adicionais.value = resposta.data.grupos || resposta.data || [];
        } catch (erro) {
            console.error('Erro ao carregar grupos de adicionais:', erro);
            toast_global.exibir_toast('Erro ao carregar grupos de adicionais.', 'erro');
        }
    };

    const salvar_grupo = async () => {
        if (!input_nome_grupo.value.trim()) {
            toast_global.exibir_toast('Informe o nome do grupo.', 'erro');
            return;
        }
        try {
            const payload = {
                nome: input_nome_grupo.value.trim(),
                maximo_selecoes: Number(input_maximo_selecoes.value) || 0,
            };
            if (grupo_em_edicao.value) {
                await api_cliente.put(`/grupos-adicionais/${grupo_em_edicao.value.id}`, payload);
                toast_global.exibir_toast('Grupo atualizado com sucesso!', 'sucesso');
            } else {
                await api_cliente.post('/grupos-adicionais', payload);
                toast_global.exibir_toast('Grupo criado com sucesso!', 'sucesso');
            }
            cancelar_edicao_grupo();
            await carregar_grupos_adicionais();
        } catch (erro) {
            toast_global.exibir_toast(
                erro.response?.data?.mensagem || 'Erro ao salvar grupo.',
                'erro'
            );
        }
    };

    const excluir_grupo = async (id) => {
        if (!(await window.confirm('Deseja realmente excluir este grupo e todos os seus itens?'))) return;
        try {
            await api_cliente.delete(`/grupos-adicionais/${id}`);
            toast_global.exibir_toast('Grupo excluído com sucesso!', 'sucesso');
            if (grupo_expandido.value === id) grupo_expandido.value = null;
            await carregar_grupos_adicionais();
        } catch (erro) {
            toast_global.exibir_toast(
                erro.response?.data?.mensagem || 'Erro ao excluir grupo.',
                'erro'
            );
        }
    };

    const abrir_edicao_grupo = (grupo) => {
        grupo_em_edicao.value = grupo;
        input_nome_grupo.value = grupo.nome || '';
        input_maximo_selecoes.value = grupo.maximo_selecoes ?? 0;
        mostrando_form_grupo.value = true;
    };

    const cancelar_edicao_grupo = (fechar = true) => {
        grupo_em_edicao.value = null;
        input_nome_grupo.value = '';
        input_maximo_selecoes.value = 0;
        if (fechar) mostrando_form_grupo.value = false;
    };

    const alternar_grupo_expandido = (id) => {
        grupo_expandido.value = grupo_expandido.value === id ? null : id;
        // Limpa form de item ao trocar de grupo
        cancelar_edicao_item();
    };

    const salvar_item = async (grupo_id) => {
        if (!input_nome_item.value.trim()) {
            toast_global.exibir_toast('Informe o nome do item.', 'erro');
            return;
        }
        try {
            const payload = {
                grupo_adicional_id: grupo_id,
                nome: input_nome_item.value.trim(),
                preco: Number(input_preco_item.value) || 0,
            };
            if (item_em_edicao.value) {
                await api_cliente.put(`/itens-adicionais/${item_em_edicao.value.id}`, payload);
                toast_global.exibir_toast('Item atualizado com sucesso!', 'sucesso');
            } else {
                await api_cliente.post(`/grupos-adicionais/${grupo_id}/itens`, payload);
                toast_global.exibir_toast('Item adicionado com sucesso!', 'sucesso');
            }
            cancelar_edicao_item();
            await carregar_grupos_adicionais();
        } catch (erro) {
            toast_global.exibir_toast(
                erro.response?.data?.mensagem || 'Erro ao salvar item.',
                'erro'
            );
        }
    };

    const excluir_item = async (id) => {
        if (!(await window.confirm('Deseja realmente excluir este item adicional?'))) return;
        try {
            await api_cliente.delete(`/itens-adicionais/${id}`);
            toast_global.exibir_toast('Item excluído com sucesso!', 'sucesso');
            await carregar_grupos_adicionais();
        } catch (erro) {
            toast_global.exibir_toast(
                erro.response?.data?.mensagem || 'Erro ao excluir item.',
                'erro'
            );
        }
    };

    const abrir_edicao_item = (item) => {
        item_em_edicao.value = item;
        input_nome_item.value = item.nome || '';
        input_preco_item.value = item.preco ?? '';
    };

    const cancelar_edicao_item = () => {
        item_em_edicao.value = null;
        input_nome_item.value = '';
        input_preco_item.value = '';
    };

    // ─── Watches ──────────────────────────────────────────────────────────────

    watch(() => formulario_entrada.quantidade_comprada, recalcular_entrada);
    watch(() => formulario_entrada.custo_unitario_compra, recalcular_entrada);
    watch(() => formulario_entrada.fator_conversao, recalcular_entrada);
    watch(() => formulario_entrada.modo_entrada, atualizar_modo_entrada);

    // ─── Ciclo de vida ────────────────────────────────────────────────────────

    onMounted(async () => {
        await loja_produtos.buscar_produtos();
        await carregar_fornecedores();
    });

    onActivated(async () => {
        await loja_produtos.buscar_produtos(true);
        await carregar_fornecedores();
    });

    // ─── Interface pública ────────────────────────────────────────────────────

    return {
        aba_ativa,
        lista_produtos,
        produtos_filtrados,
        termo_pesquisa,
        filtro_fornecedor_id,
        voltar_painel,
        abrir_aba_estoque,
        abrir_aba_fornecedores,
        alternar_formulario_fornecedor_minimizado,
        formulario_fornecedor_minimizado,
        produto_tem_detalhamento_fornecedor,
        produto_esta_expandido,
        alternar_expansao_produto,
        formatar_data_tabela,
        carregando_produto,
        formulario_dados,
        salvar_produto,
        excluir_produto,
        cancelar_formulario_produto,
        salvando,
        produto_excluindo_id,
        modo_edicao,
        abrir_modal_novo,
        abrir_modal_edicao,
        adicionar_alias_codigo_barras,
        remover_alias_codigo_barras,
        adicionar_vinculo_fornecedor,
        remover_vinculo_fornecedor,
        lista_fornecedores,
        fornecedores_filtrados,
        opcoes_filtro_fornecedor,
        modal_perda,
        formulario_perda,
        abrir_modal_perda,
        registrar_perda,
        registrando_perda,
        modal_entrada,
        formulario_entrada,
        abrir_modal_entrada,
        registrar_entrada,
        registrando_entrada,
        atualizar_modo_entrada,
        termo_fornecedor_entrada,
        dropdown_fornecedor_entrada_aberto,
        fornecedores_filtrados_entrada,
        selecionar_fornecedor_entrada,
        fornecedor_entrada_vinculado,
        entrada_pronta_para_salvar,
        produto_entrada_possui_fornecedores_vinculados,
        fechar_dropdown_fornecedor_entrada,
        formulario_fornecedor,
        abrir_modal_novo_fornecedor,
        abrir_edicao_fornecedor,
        salvar_fornecedor,
        excluir_fornecedor,
        cancelar_formulario_fornecedor,
        salvando_fornecedor,
        fornecedor_excluindo_id,
        modo_edicao_fornecedor,
        voltar_aba_um_nivel,
        manejar_popstate_produtos,
        // Adicionais
        lista_grupos_adicionais,
        grupo_em_edicao,
        input_nome_grupo,
        input_maximo_selecoes,
        input_nome_item,
        input_preco_item,
        grupo_expandido,
        item_em_edicao,
        mostrando_form_grupo,
        abrir_aba_adicionais,
        carregar_grupos_adicionais,
        salvar_grupo,
        excluir_grupo,
        abrir_edicao_grupo,
        cancelar_edicao_grupo,
        alternar_grupo_expandido,
        salvar_item,
        excluir_item,
        abrir_edicao_item,
        cancelar_edicao_item,
        // Cozinha triagem
        abrir_aba_cozinha,
        alternar_requer_cozinha,
    };
}