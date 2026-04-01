import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaPermissoes() {
    const toast_store = useToastStore();
    const router = useRouter();
    const carregando = ref(true);
    const matriz_permissoes = ref([]);

    const voltar_painel = () => router.push('/painel-central');

    const perfis = ['caixa', 'garcom', 'gerente'];

    const modulos = [
        { chave: 'acessar_pdv', nome: 'Acessar Frente de Caixa / PDV', icone: '💰' },
        { chave: 'acessar_mesas', nome: 'Visualizar Mapa de Mesas', icone: '🪑' },
        { chave: 'acessar_comandas', nome: 'Acessar Gestao de Comandas', icone: '📝' },
        { chave: 'cancelar_vendas', nome: 'Cancelar Vendas e Excluir Itens', icone: '🗑️' },
        { chave: 'aplicar_desconto', nome: 'Aplicar Descontos no Caixa', icone: '🏷️' },
        { chave: 'gerenciar_produtos', nome: 'Cadastrar e Editar Produtos', icone: '📦' },
        { chave: 'gerenciar_equipe', nome: 'Gerenciar Equipa de Funcionarios', icone: '👥' },
        { chave: 'ver_analises', nome: 'Acessar Relatorios e Analises', icone: '📈' },
        { chave: 'gerenciar_cardapio', nome: 'Gerenciar Cardapio Digital', icone: '🍽️' },
    ];

    const carregar_permissoes_atuais = async () => {
        try {
            const resposta = await api_cliente.get('/permissoes');
            matriz_permissoes.value = resposta.data;
        } catch (erro) {
            console.error(erro);
            toast_store.exibir_toast('Erro ao carregar permissoes', 'erro');
        } finally {
            carregando.value = false;
        }
    };

    const salvar_permissoes = async () => {
        try {
            await api_cliente.post('/permissoes', { matriz: matriz_permissoes.value });
            toast_store.exibir_toast('Permissoes atualizadas com sucesso!', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast_store.exibir_toast('Erro ao salvar permissoes', 'erro');
        }
    };

    onMounted(() => {
        carregar_permissoes_atuais();
    });

    return { carregando, matriz_permissoes, perfis, modulos, salvar_permissoes, voltar_painel };
}
