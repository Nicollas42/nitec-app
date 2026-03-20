import { reactive, ref, computed, onMounted, onActivated, watch } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';

/**
 * Constroi um alias vazio para o formulario de produto.
 *
 * @returns {{ id: number|null, codigo_barras: string, descricao_variacao: string }}
 */
const criar_alias_vazio = () => ({
    id: null,
    codigo_barras: '',
    descricao_variacao: '',
});

/**
 * Constroi um vinculo vazio entre produto e fornecedor.
 *
 * @returns {{ fornecedor_id: number|null, codigo_sku_fornecedor: string, fator_conversao: number, ultimo_preco_compra: string|number }}
 */
const criar_vinculo_fornecedor_vazio = () => ({
    fornecedor_id: null,
    codigo_sku_fornecedor: '',
    fator_conversao: 1,
    ultimo_preco_compra: '',
});

/**
 * Constroi o estado padrao do formulario rapido de fornecedor.
 *
 * @returns {{ nome_fantasia: string, razao_social: string, cnpj: string, telefone: string, email: string, vendedor: string, contato_vendedor: string, status_fornecedor: string }}
 */
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

/**
 * Centraliza a logica da tela de produtos, entradas e fornecedores.
 */
export function use_logica_produtos() {
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    const { lista_produtos } = storeToRefs(loja_produtos);

    const termo_pesquisa = ref('');

    const modal_novo_produto = ref(false);
    const carregando_produto = ref(false);
    const salvando = ref(false);
    const modo_edicao = ref(false);
    const id_edicao = ref(null);

    const modal_perda = ref(false);
    const registrando_perda = ref(false);

    const modal_entrada = ref(false);
    const registrando_entrada = ref(false);
    const termo_fornecedor_entrada = ref('');
    const dropdown_fornecedor_entrada_aberto = ref(false);
    const detalhes_produto_entrada = ref(null);

    const modal_novo_fornecedor = ref(false);
    const salvando_fornecedor = ref(false);
    const contexto_modal_fornecedor = ref('produto');

    const lista_fornecedores = ref([]);

    const formulario_dados = reactive({
        nome_produto: '',
        codigo_interno: '',
        preco_venda: '',
        preco_custo_medio: '',
        categoria: 'Geral',
        estoque_atual: 0,
        data_validade: '',
        codigos_barras_adicionais: [criar_alias_vazio()],
        fornecedores_vinculados: [],
    });

    const formulario_perda = reactive({
        produto_id: null,
        nome_produto: '',
        quantidade: 1,
        motivo: 'Quebra / Dano',
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
    });

    const formulario_fornecedor = reactive(criar_formulario_fornecedor_vazio());

    /**
     * Retorna todos os codigos pesquisaveis de um produto.
     *
     * @param {Record<string, any>} produto
     * @returns {string[]}
     */
    const obter_codigos_produto = (produto) => {
        const codigos_barras = Array.isArray(produto?.codigos_barras) ? produto.codigos_barras : [];
        const codigo_principal = produto?.codigo_barras_principal ? [produto.codigo_barras_principal] : [];

        return [...new Set([produto?.codigo_interno, ...codigo_principal, ...codigos_barras].filter(Boolean))];
    };

    /**
     * Filtra os produtos pelo termo digitado em nome, codigo interno ou aliases.
     */
    const produtos_filtrados = computed(() => {
        if (!termo_pesquisa.value) {
            return lista_produtos.value;
        }

        const termo_normalizado = termo_pesquisa.value.toLowerCase().trim();

        return lista_produtos.value.filter((produto) => {
            const nome_corresponde = produto.nome_produto.toLowerCase().includes(termo_normalizado);
            const codigo_corresponde = obter_codigos_produto(produto).some((codigo) => String(codigo).toLowerCase().includes(termo_normalizado));

            return nome_corresponde || codigo_corresponde;
        });
    });

    /**
     * Filtra a lista de fornecedores para o campo pesquisavel do modal de entrada.
     */
    const fornecedores_filtrados_entrada = computed(() => {
        const termo_normalizado = termo_fornecedor_entrada.value.toLowerCase().trim();

        if (!termo_normalizado) {
            return lista_fornecedores.value;
        }

        return lista_fornecedores.value.filter((fornecedor) => {
            const nome_fantasia = fornecedor.nome_fantasia?.toLowerCase() || '';
            const razao_social = fornecedor.razao_social?.toLowerCase() || '';
            const cnpj = fornecedor.cnpj?.toLowerCase() || '';
            const vendedor = fornecedor.vendedor?.toLowerCase() || '';
            const contato_vendedor = fornecedor.contato_vendedor?.toLowerCase() || '';

            return nome_fantasia.includes(termo_normalizado)
                || razao_social.includes(termo_normalizado)
                || cnpj.includes(termo_normalizado)
                || vendedor.includes(termo_normalizado)
                || contato_vendedor.includes(termo_normalizado);
        });
    });

    /**
     * Indica se o fornecedor selecionado na entrada esta vinculado ao produto atual.
     */
    const fornecedor_entrada_vinculado = computed(() => {
        if (!formulario_entrada.fornecedor_id || !detalhes_produto_entrada.value) {
            return null;
        }

        return (detalhes_produto_entrada.value.fornecedores_vinculados || []).find((fornecedor_vinculado) => {
            return Number(fornecedor_vinculado.fornecedor_id) === Number(formulario_entrada.fornecedor_id);
        }) || null;
    });

    /**
     * Indica se o modal de entrada possui dados suficientes para salvar.
     */
    const entrada_pronta_para_salvar = computed(() => {
        if (formulario_entrada.modo_entrada !== 'compra_fornecedor') {
            return Boolean(
                formulario_entrada.produto_id
                && Number(formulario_entrada.quantidade_comprada) > 0
                && Number(formulario_entrada.custo_unitario_compra) >= 0
            );
        }

        return Boolean(
            formulario_entrada.produto_id
            && formulario_entrada.fornecedor_id
            && fornecedor_entrada_vinculado.value
            && Number(formulario_entrada.quantidade_comprada) > 0
            && Number(formulario_entrada.custo_unitario_compra) >= 0
        );
    });

    /**
     * Reinicia o formulario principal de produto para o estado padrao.
     */
    const reiniciar_formulario_produto = () => {
        formulario_dados.nome_produto = '';
        formulario_dados.codigo_interno = '';
        formulario_dados.preco_venda = '';
        formulario_dados.preco_custo_medio = '';
        formulario_dados.categoria = 'Geral';
        formulario_dados.estoque_atual = 0;
        formulario_dados.data_validade = '';
        formulario_dados.codigos_barras_adicionais = [criar_alias_vazio()];
        formulario_dados.fornecedores_vinculados = [];
    };

    /**
     * Reinicia o formulario de entrada de estoque para o estado padrao.
     */
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
        termo_fornecedor_entrada.value = '';
        dropdown_fornecedor_entrada_aberto.value = false;
        detalhes_produto_entrada.value = null;
    };

    /**
     * Reinicia o formulario rapido de fornecedor.
     */
    const reiniciar_formulario_fornecedor = () => {
        Object.assign(formulario_fornecedor, criar_formulario_fornecedor_vazio());
    };

    /**
     * Busca a lista de fornecedores no backend para uso nos selects.
     */
    const carregar_fornecedores = async () => {
        try {
            const resposta = await api_cliente.get('/listar-fornecedores');
            lista_fornecedores.value = resposta.data.fornecedores || [];
        } catch (erro) {
            console.error('Erro ao carregar fornecedores:', erro);
        }
    };

    /**
     * Busca os detalhes completos de um produto para edicao ou entrada.
     *
     * @param {number|string} produto_id
     * @returns {Promise<Record<string, any>>}
     */
    const buscar_detalhes_produto = async (produto_id) => {
        const resposta = await api_cliente.get(`/produtos/detalhes/${produto_id}`);
        return resposta.data.produto;
    };

    /**
     * Preenche o formulario principal com os detalhes completos do produto.
     *
     * @param {Record<string, any>} produto
     */
    const preencher_formulario_produto = (produto) => {
        formulario_dados.nome_produto = produto.nome_produto || '';
        formulario_dados.codigo_interno = produto.codigo_interno || '';
        formulario_dados.preco_venda = produto.preco_venda ?? '';
        formulario_dados.preco_custo_medio = produto.preco_custo_medio ?? '';
        formulario_dados.categoria = produto.categoria || 'Geral';
        formulario_dados.estoque_atual = produto.estoque_atual ?? 0;
        formulario_dados.data_validade = produto.data_validade || '';
        formulario_dados.codigos_barras_adicionais = (produto.codigos_barras_adicionais || []).length > 0
            ? produto.codigos_barras_adicionais.map((codigo_barras) => ({
                id: codigo_barras.id ?? null,
                codigo_barras: codigo_barras.codigo_barras || '',
                descricao_variacao: codigo_barras.descricao_variacao || '',
            }))
            : [criar_alias_vazio()];
        formulario_dados.fornecedores_vinculados = (produto.fornecedores_vinculados || []).length > 0
            ? produto.fornecedores_vinculados.map((fornecedor_vinculado) => ({
                fornecedor_id: fornecedor_vinculado.fornecedor_id ?? null,
                codigo_sku_fornecedor: fornecedor_vinculado.codigo_sku_fornecedor || '',
                fator_conversao: Number(fornecedor_vinculado.fator_conversao || 1),
                ultimo_preco_compra: fornecedor_vinculado.ultimo_preco_compra ?? '',
            }))
            : [];
    };

    /**
     * Monta o payload do produto para envio ao backend.
     *
     * @returns {Record<string, any>}
     */
    const montar_payload_produto = () => {
        return {
            nome_produto: formulario_dados.nome_produto.trim(),
            codigo_interno: formulario_dados.codigo_interno.trim(),
            preco_venda: Number(formulario_dados.preco_venda || 0),
            preco_custo_medio: Number(formulario_dados.preco_custo_medio || 0),
            categoria: formulario_dados.categoria,
            estoque_atual: Number(formulario_dados.estoque_atual || 0),
            data_validade: formulario_dados.data_validade || null,
            codigos_barras_adicionais: formulario_dados.codigos_barras_adicionais
                .map((codigo_barras) => ({
                    id: codigo_barras.id || null,
                    codigo_barras: codigo_barras.codigo_barras.trim(),
                    descricao_variacao: codigo_barras.descricao_variacao?.trim() || null,
                }))
                .filter((codigo_barras) => codigo_barras.codigo_barras),
            fornecedores_vinculados: formulario_dados.fornecedores_vinculados
                .map((fornecedor_vinculado) => ({
                    fornecedor_id: fornecedor_vinculado.fornecedor_id ? Number(fornecedor_vinculado.fornecedor_id) : null,
                    codigo_sku_fornecedor: fornecedor_vinculado.codigo_sku_fornecedor.trim(),
                    fator_conversao: Number(fornecedor_vinculado.fator_conversao || 1),
                    ultimo_preco_compra: fornecedor_vinculado.ultimo_preco_compra === '' || fornecedor_vinculado.ultimo_preco_compra === null
                        ? null
                        : Number(fornecedor_vinculado.ultimo_preco_compra),
                }))
                .filter((fornecedor_vinculado) => fornecedor_vinculado.fornecedor_id || fornecedor_vinculado.codigo_sku_fornecedor),
        };
    };

    /**
     * Valida o formulario principal antes de enviar ao backend.
     *
     * @returns {boolean}
     */
    const validar_formulario_produto = () => {
        const payload = montar_payload_produto();
        const codigos_barras = payload.codigos_barras_adicionais.map((codigo_barras) => codigo_barras.codigo_barras);
        const fornecedores = payload.fornecedores_vinculados.map((fornecedor_vinculado) => fornecedor_vinculado.fornecedor_id).filter(Boolean);

        if (!payload.nome_produto || !payload.codigo_interno) {
            alert('Informe o nome e o codigo interno do produto.');
            return false;
        }

        if (codigos_barras.length !== new Set(codigos_barras).size) {
            alert('Existem codigos de barras duplicados no formulario.');
            return false;
        }

        if (fornecedores.length !== new Set(fornecedores).size) {
            alert('O mesmo fornecedor nao pode ser vinculado duas vezes ao mesmo produto.');
            return false;
        }

        const vinculo_invalido = payload.fornecedores_vinculados.find((fornecedor_vinculado) => {
            return fornecedor_vinculado.fornecedor_id && !fornecedor_vinculado.codigo_sku_fornecedor;
        });

        if (vinculo_invalido) {
            alert('Preencha o codigo SKU para todos os fornecedores vinculados.');
            return false;
        }

        return true;
    };

    /**
     * Adiciona uma nova linha de alias ao formulario.
     */
    const adicionar_alias_codigo_barras = () => {
        formulario_dados.codigos_barras_adicionais.push(criar_alias_vazio());
    };

    /**
     * Remove uma linha de alias do formulario.
     *
     * @param {number} indice
     */
    const remover_alias_codigo_barras = (indice) => {
        if (formulario_dados.codigos_barras_adicionais.length === 1) {
            formulario_dados.codigos_barras_adicionais = [criar_alias_vazio()];
            return;
        }

        formulario_dados.codigos_barras_adicionais.splice(indice, 1);
    };

    /**
     * Adiciona uma nova linha de vinculo de fornecedor ao formulario.
     */
    const adicionar_vinculo_fornecedor = () => {
        formulario_dados.fornecedores_vinculados.push(criar_vinculo_fornecedor_vazio());
    };

    /**
     * Remove uma linha de vinculo de fornecedor do formulario.
     *
     * @param {number} indice
     */
    const remover_vinculo_fornecedor = (indice) => {
        if (formulario_dados.fornecedores_vinculados.length === 1) {
            formulario_dados.fornecedores_vinculados = [criar_vinculo_fornecedor_vazio()];
            return;
        }

        formulario_dados.fornecedores_vinculados.splice(indice, 1);
    };

    /**
     * Abre o modal de criacao de produto com estado limpo.
     */
    const abrir_modal_novo = async () => {
        modo_edicao.value = false;
        id_edicao.value = null;
        reiniciar_formulario_produto();
        await carregar_fornecedores();
        modal_novo_produto.value = true;
    };

    /**
     * Abre o modal de edicao buscando o detalhe completo do produto.
     *
     * @param {Record<string, any>} produto
     */
    const abrir_modal_edicao = async (produto) => {
        carregando_produto.value = true;
        modo_edicao.value = true;
        id_edicao.value = produto.id;
        modal_novo_produto.value = true;

        try {
            await carregar_fornecedores();
            const detalhes_produto = await buscar_detalhes_produto(produto.id);
            preencher_formulario_produto(detalhes_produto);
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao carregar os detalhes do produto.');
            modal_novo_produto.value = false;
        } finally {
            carregando_produto.value = false;
        }
    };

    /**
     * Persiste o formulario de produto no backend.
     */
    const salvar_produto = async () => {
        if (!validar_formulario_produto()) {
            return;
        }

        salvando.value = true;

        try {
            const payload = montar_payload_produto();

            if (modo_edicao.value) {
                await api_cliente.post(`/produtos/editar/${id_edicao.value}`, payload);
            } else {
                await api_cliente.post('/cadastrar-produto', payload);
            }

            modal_novo_produto.value = false;
            await loja_produtos.buscar_produtos(true);
            await carregar_fornecedores();
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao salvar o produto.');
        } finally {
            salvando.value = false;
        }
    };

    /**
     * Abre o modal de baixa para o produto selecionado.
     *
     * @param {Record<string, any>} produto
     */
    const abrir_modal_perda = (produto) => {
        formulario_perda.produto_id = produto.id;
        formulario_perda.nome_produto = produto.nome_produto;
        formulario_perda.quantidade = 1;
        formulario_perda.motivo = 'Quebra / Dano';
        modal_perda.value = true;
    };

    /**
     * Registra a baixa de estoque do produto selecionado.
     */
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
                motivo: formulario_perda.motivo,
            });

            modal_perda.value = false;
            await loja_produtos.buscar_produtos(true);
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao registrar baixa.');
        } finally {
            registrando_perda.value = false;
        }
    };

    /**
     * Atualiza os dados derivados da entrada de estoque.
     */
    const recalcular_entrada = () => {
        const quantidade_comprada = Number(formulario_entrada.quantidade_comprada || 0);
        const custo_unitario_compra = Number(formulario_entrada.custo_unitario_compra || 0);
        const fator_conversao = formulario_entrada.modo_entrada === 'compra_fornecedor'
            ? Number(formulario_entrada.fator_conversao || 1)
            : 1;

        formulario_entrada.unidades_entrada = Math.max(0, quantidade_comprada * fator_conversao);
        formulario_entrada.custo_total_entrada = Number((quantidade_comprada * custo_unitario_compra).toFixed(2));
    };

    /**
     * Sincroniza os dados do fornecedor selecionado no modal de entrada.
     */
    const atualizar_fornecedor_entrada = () => {
        if (formulario_entrada.modo_entrada !== 'compra_fornecedor') {
            formulario_entrada.fornecedor_id = null;
            formulario_entrada.codigo_sku_fornecedor = '';
            formulario_entrada.fator_conversao = 1;
            recalcular_entrada();
            return;
        }

        const fornecedor_vinculado = fornecedor_entrada_vinculado.value;

        if (!fornecedor_vinculado) {
            formulario_entrada.codigo_sku_fornecedor = '';
            formulario_entrada.fator_conversao = 1;
            recalcular_entrada();
            return;
        }

        formulario_entrada.codigo_sku_fornecedor = fornecedor_vinculado.codigo_sku_fornecedor || '';
        formulario_entrada.fator_conversao = Number(fornecedor_vinculado.fator_conversao || 1);

        if (formulario_entrada.custo_unitario_compra === '' || Number(formulario_entrada.custo_unitario_compra) === 0) {
            formulario_entrada.custo_unitario_compra = fornecedor_vinculado.ultimo_preco_compra ?? '';
        }

        recalcular_entrada();
    };

    /**
     * Alterna o modo operacional da entrada entre compra por fornecedor e ajuste manual.
     */
    const atualizar_modo_entrada = () => {
        if (formulario_entrada.modo_entrada !== 'compra_fornecedor') {
            atualizar_fornecedor_entrada();
            return;
        }

        const primeiro_fornecedor = detalhes_produto_entrada.value?.fornecedores_vinculados?.[0] || null;

        if (!primeiro_fornecedor) {
            formulario_entrada.modo_entrada = 'ajuste_manual';
            atualizar_fornecedor_entrada();
            return;
        }

        const fornecedor = lista_fornecedores.value.find((item) => Number(item.id) === Number(primeiro_fornecedor.fornecedor_id));

        if (fornecedor && !formulario_entrada.fornecedor_id) {
            selecionar_fornecedor_entrada(fornecedor);
            return;
        }

        atualizar_fornecedor_entrada();
    };

    /**
     * Seleciona um fornecedor a partir do dropdown pesquisavel da entrada.
     *
     * @param {Record<string, any>} fornecedor
     */
    const selecionar_fornecedor_entrada = (fornecedor) => {
        formulario_entrada.fornecedor_id = fornecedor.id;
        termo_fornecedor_entrada.value = fornecedor.nome_fantasia;
        dropdown_fornecedor_entrada_aberto.value = false;
        atualizar_fornecedor_entrada();
    };

    /**
     * Abre o modal de entrada carregando os detalhes do produto e fornecedores.
     *
     * @param {Record<string, any>} produto
     */
    const abrir_modal_entrada = async (produto) => {
        reiniciar_formulario_entrada();
        formulario_entrada.produto_id = produto.id;
        formulario_entrada.nome_produto = produto.nome_produto;
        formulario_entrada.custo_unitario_compra = produto.preco_custo_medio ?? '';
        modal_entrada.value = true;

        try {
            await carregar_fornecedores();
            detalhes_produto_entrada.value = await buscar_detalhes_produto(produto.id);

            const primeiro_fornecedor = detalhes_produto_entrada.value.fornecedores_vinculados?.[0] || null;

            if (primeiro_fornecedor) {
                formulario_entrada.modo_entrada = 'compra_fornecedor';
                const fornecedor = lista_fornecedores.value.find((item) => Number(item.id) === Number(primeiro_fornecedor.fornecedor_id));

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

    /**
     * Registra a entrada de estoque por fornecedor.
     */
    const registrar_entrada = async () => {
        if (!entrada_pronta_para_salvar.value) {
            alert('Preencha os valores da entrada. Se optar por compra por fornecedor, selecione um fornecedor vinculado.');
            return;
        }

        registrando_entrada.value = true;

        try {
            await api_cliente.post('/estoque/registrar-entrada', {
                modo_entrada: formulario_entrada.modo_entrada,
                produto_id: formulario_entrada.produto_id,
                fornecedor_id: formulario_entrada.modo_entrada === 'compra_fornecedor'
                    ? Number(formulario_entrada.fornecedor_id)
                    : null,
                quantidade_comprada: Number(formulario_entrada.quantidade_comprada),
                custo_unitario_compra: Number(formulario_entrada.custo_unitario_compra),
            });

            modal_entrada.value = false;
            await loja_produtos.buscar_produtos(true);
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao registrar entrada.');
        } finally {
            registrando_entrada.value = false;
        }
    };

    /**
     * Abre o modal rapido de fornecedor respeitando o contexto atual.
     *
     * @param {'produto'|'entrada'} contexto
     */
    const abrir_modal_novo_fornecedor = (contexto = 'produto') => {
        contexto_modal_fornecedor.value = contexto;
        reiniciar_formulario_fornecedor();
        modal_novo_fornecedor.value = true;
    };

    /**
     * Salva um novo fornecedor e o injeta no contexto ativo da interface.
     */
    const salvar_fornecedor = async () => {
        salvando_fornecedor.value = true;

        try {
            const resposta = await api_cliente.post('/fornecedores/cadastrar', {
                nome_fantasia: formulario_fornecedor.nome_fantasia.trim(),
                razao_social: formulario_fornecedor.razao_social.trim(),
                cnpj: formulario_fornecedor.cnpj.trim(),
                telefone: formulario_fornecedor.telefone.trim() || null,
                email: formulario_fornecedor.email.trim() || null,
                vendedor: formulario_fornecedor.vendedor.trim() || null,
                contato_vendedor: formulario_fornecedor.contato_vendedor.trim() || null,
                status_fornecedor: formulario_fornecedor.status_fornecedor,
            });

            const novo_fornecedor = resposta.data.fornecedor;
            await carregar_fornecedores();

            if (contexto_modal_fornecedor.value === 'entrada') {
                selecionar_fornecedor_entrada(novo_fornecedor);
            } else {
                let indice_vazio = formulario_dados.fornecedores_vinculados.findIndex((fornecedor_vinculado) => !fornecedor_vinculado.fornecedor_id);

                if (indice_vazio === -1) {
                    adicionar_vinculo_fornecedor();
                    indice_vazio = formulario_dados.fornecedores_vinculados.length - 1;
                }

                formulario_dados.fornecedores_vinculados[indice_vazio].fornecedor_id = novo_fornecedor.id;
            }

            modal_novo_fornecedor.value = false;
        } catch (erro) {
            alert(erro.response?.data?.mensagem || 'Erro ao cadastrar fornecedor.');
        } finally {
            salvando_fornecedor.value = false;
        }
    };

    /**
     * Fecha o dropdown pesquisavel de fornecedores da entrada.
     */
    const fechar_dropdown_fornecedor_entrada = () => {
        dropdown_fornecedor_entrada_aberto.value = false;
    };

    /**
     * Redireciona o usuario de volta ao painel central.
     */
    const voltar_painel = () => roteador.push('/painel-central');

    watch(() => formulario_entrada.quantidade_comprada, recalcular_entrada);
    watch(() => formulario_entrada.custo_unitario_compra, recalcular_entrada);
    watch(() => formulario_entrada.fator_conversao, recalcular_entrada);
    watch(() => formulario_entrada.modo_entrada, atualizar_modo_entrada);

    onMounted(async () => {
        await loja_produtos.buscar_produtos();
        await carregar_fornecedores();
    });

    onActivated(async () => {
        await loja_produtos.buscar_produtos(true);
        await carregar_fornecedores();
    });

    return {
        produtos_filtrados,
        termo_pesquisa,
        voltar_painel,
        modal_novo_produto,
        carregando_produto,
        formulario_dados,
        salvar_produto,
        salvando,
        modo_edicao,
        abrir_modal_novo,
        abrir_modal_edicao,
        adicionar_alias_codigo_barras,
        remover_alias_codigo_barras,
        adicionar_vinculo_fornecedor,
        remover_vinculo_fornecedor,
        lista_fornecedores,
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
        termo_fornecedor_entrada,
        dropdown_fornecedor_entrada_aberto,
        fornecedores_filtrados_entrada,
        selecionar_fornecedor_entrada,
        fornecedor_entrada_vinculado,
        entrada_pronta_para_salvar,
        atualizar_modo_entrada,
        fechar_dropdown_fornecedor_entrada,
        modal_novo_fornecedor,
        formulario_fornecedor,
        abrir_modal_novo_fornecedor,
        salvar_fornecedor,
        salvando_fornecedor,
        produto_entrada_possui_fornecedores_vinculados: computed(() => {
            return (detalhes_produto_entrada.value?.fornecedores_vinculados?.length || 0) > 0;
        }),
    };
}
