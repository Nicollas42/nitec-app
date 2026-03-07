import { reactive, ref, onMounted, onActivated } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia'; 
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';

export function useLogicaProdutos() {
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();
    const { lista_produtos } = storeToRefs(loja_produtos);

    const modal_novo_produto = ref(false); 

    // 🟢 Atualizado: Adicionado os novos campos de BI
    const formulario_dados = reactive({
        nome_produto: '', 
        codigo_barras: '', 
        preco_venda: '', 
        preco_custo: '', // Novo
        categoria: 'Geral', // Novo (Padrão)
        estoque_atual: 0
    });

    const cadastrar_novo_produto = async () => {
        try {
            await api_cliente.post('/cadastrar-produto', formulario_dados);
            
            // Reset do formulário após sucesso
            formulario_dados.nome_produto = '';
            formulario_dados.codigo_barras = ''; 
            formulario_dados.preco_venda = '';
            formulario_dados.preco_custo = ''; // Reset do novo campo
            formulario_dados.categoria = 'Geral'; // Reset do novo campo
            formulario_dados.estoque_atual = 0;
            
            modal_novo_produto.value = false; 
            await loja_produtos.buscar_produtos(true);
            alert("Produto cadastrado com sucesso!");
        } catch (erro) {
            alert("Erro ao cadastrar o produto.");
            console.error(erro);
        }
    };

    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => loja_produtos.buscar_produtos());
    onActivated(() => loja_produtos.buscar_produtos(true)); 

    return { 
        formulario_dados, lista_produtos, cadastrar_novo_produto, voltar_painel,
        modal_novo_produto 
    };
}