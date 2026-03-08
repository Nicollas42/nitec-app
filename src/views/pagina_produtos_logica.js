import { reactive, ref, computed, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia'; 
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';

export function useLogicaProdutos() {
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    const { lista_produtos } = storeToRefs(loja_produtos);

    const termo_pesquisa = ref('');
    
    const produtos_filtrados = computed(() => {
        if (!termo_pesquisa.value) return lista_produtos.value;
        const termo = termo_pesquisa.value.toLowerCase();
        return lista_produtos.value.filter(p => 
            p.nome_produto.toLowerCase().includes(termo) || 
            (p.codigo_barras && p.codigo_barras.includes(termo))
        );
    });

    const modal_novo_produto = ref(false); 
    const salvando = ref(false);
    const modo_edicao = ref(false);
    const id_edicao = ref(null);

    const formulario_dados = reactive({
        nome_produto: '', codigo_barras: '', preco_venda: '', preco_custo: '', 
        categoria: 'Geral', estoque_atual: 0, data_validade: ''
    });

    const modal_perda = ref(false);
    const registrando_perda = ref(false);
    const formulario_perda = reactive({ produto_id: null, nome_produto: '', quantidade: 1, motivo: 'Quebra / Dano' });

    // 🟢 NOVO: LÓGICA DE ENTRADAS DE ESTOQUE (COMPRAS)
    const modal_entrada = ref(false);
    const registrando_entrada = ref(false);
    const formulario_entrada = reactive({ produto_id: null, nome_produto: '', quantidade: 1, custo_unitario: '', fornecedor: '' });

    const abrir_modal_novo = () => {
        modo_edicao.value = false; id_edicao.value = null;
        Object.assign(formulario_dados, { nome_produto: '', codigo_barras: '', preco_venda: '', preco_custo: '', categoria: 'Geral', estoque_atual: 0, data_validade: '' });
        modal_novo_produto.value = true;
    };

    const abrir_modal_edicao = (produto) => {
        modo_edicao.value = true; id_edicao.value = produto.id;
        Object.assign(formulario_dados, { 
            nome_produto: produto.nome_produto, codigo_barras: produto.codigo_barras || '', 
            preco_venda: produto.preco_venda, preco_custo: produto.preco_custo || '', 
            categoria: produto.categoria || 'Geral', estoque_atual: produto.estoque_atual, data_validade: produto.data_validade || '' 
        });
        modal_novo_produto.value = true;
    };

    const salvar_produto = async () => {
        salvando.value = true;
        try {
            if (modo_edicao.value) await api_cliente.post(`/produtos/editar/${id_edicao.value}`, formulario_dados);
            else await api_cliente.post('/cadastrar-produto', formulario_dados);
            modal_novo_produto.value = false; 
            await loja_produtos.buscar_produtos(true);
        } catch (erro) { alert(erro.response?.data?.mensagem || "Erro ao salvar o produto."); } 
        finally { salvando.value = false; }
    };

    const abrir_modal_perda = (produto) => {
        formulario_perda.produto_id = produto.id; formulario_perda.nome_produto = produto.nome_produto;
        formulario_perda.quantidade = 1; formulario_perda.motivo = 'Quebra / Dano';
        modal_perda.value = true;
    };

    const registrar_perda = async () => {
        if (formulario_perda.quantidade <= 0) return alert("A quantidade deve ser maior que zero.");
        registrando_perda.value = true;
        try {
            await api_cliente.post('/estoque/registrar-perda', formulario_perda);
            modal_perda.value = false; await loja_produtos.buscar_produtos(true); 
        } catch (erro) { alert(erro.response?.data?.mensagem || "Erro ao registrar baixa."); } 
        finally { registrando_perda.value = false; }
    };

    // 🟢 FUNÇÕES DO MODAL DE ENTRADA
    const abrir_modal_entrada = (produto) => {
        formulario_entrada.produto_id = produto.id; 
        formulario_entrada.nome_produto = produto.nome_produto;
        formulario_entrada.quantidade = 1; 
        formulario_entrada.custo_unitario = produto.preco_custo || ''; 
        formulario_entrada.fornecedor = '';
        modal_entrada.value = true;
    };

    const registrar_entrada = async () => {
        if (formulario_entrada.quantidade <= 0 || formulario_entrada.custo_unitario < 0) return alert("Preencha valores válidos.");
        registrando_entrada.value = true;
        try {
            await api_cliente.post('/estoque/registrar-entrada', formulario_entrada);
            modal_entrada.value = false; await loja_produtos.buscar_produtos(true); 
        } catch (erro) { alert(erro.response?.data?.mensagem || "Erro ao registrar entrada."); } 
        finally { registrando_entrada.value = false; }
    };

    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => loja_produtos.buscar_produtos());
    onActivated(() => loja_produtos.buscar_produtos(true)); 

    return { 
        produtos_filtrados, termo_pesquisa, voltar_painel,
        modal_novo_produto, formulario_dados, salvar_produto, salvando, modo_edicao,
        abrir_modal_novo, abrir_modal_edicao,
        modal_perda, formulario_perda, abrir_modal_perda, registrar_perda, registrando_perda,
        modal_entrada, formulario_entrada, abrir_modal_entrada, registrar_entrada, registrando_entrada // 🟢 Adicionado
    };
}