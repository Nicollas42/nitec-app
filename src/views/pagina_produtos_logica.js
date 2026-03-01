import { reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useProdutosStore } from '../stores/produtos_store.js';

export function useLogicaProdutos() {
    const roteador = useRouter();
    const loja_produtos = useProdutosStore();

    // 'reactive' destranca os campos de texto no HTML
    const formulario_dados = reactive({
        nome_produto: '',
        preco_venda: '',
        estoque_atual: 0
    });

    const cadastrar_novo_produto = async () => {
        try {
            // Envia para o banco de dados
            await api_cliente.post('/produtos/cadastrar', formulario_dados);
            alert("Produto cadastrado com sucesso!");
            
            // Limpa os campos corretamente sem quebrar a reatividade
            formulario_dados.nome_produto = '';
            formulario_dados.preco_venda = '';
            formulario_dados.estoque_atual = 0;
            
            // Atualiza a memória global instantânea (força a ida ao banco)
            loja_produtos.buscar_produtos(true);
            
        } catch (erro) {
            alert("Erro ao cadastrar o produto.");
            console.error(erro);
        }
    };

    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => {
        loja_produtos.buscar_produtos();
    });

    return { 
        formulario_dados, 
        // Lemos a lista diretamente da memória RAM
        lista_produtos: computed(() => loja_produtos.lista_produtos), 
        cadastrar_novo_produto, 
        voltar_painel 
    };
}