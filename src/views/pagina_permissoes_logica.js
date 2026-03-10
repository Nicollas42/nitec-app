import { ref, onMounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js'; // 🟢 Importando o Toast Global

export function useLogicaPermissoes() {
    const toast_store = useToastStore(); // 🟢 Instanciando
    const carregando = ref(true); 
    const matriz_permissoes = ref([]);

    const perfis = ['caixa', 'garcom', 'gerente'];
    
    // 🟢 Lista de permissões expandida para abranger todo o sistema
    const modulos = [
        { chave: 'acessar_pdv', nome: 'Acessar Frente de Caixa / PDV', icone: '💰' },
        { chave: 'acessar_mesas', nome: 'Visualizar Mapa de Mesas', icone: '🪑' },
        { chave: 'acessar_comandas', nome: 'Acessar Gestão de Comandas', icone: '📝' },
        { chave: 'cancelar_vendas', nome: 'Cancelar Vendas e Excluir Itens', icone: '🗑️' },
        { chave: 'aplicar_desconto', nome: 'Aplicar Descontos no Caixa', icone: '🏷️' },
        { chave: 'gerenciar_produtos', nome: 'Cadastrar e Editar Produtos', icone: '📦' },
        { chave: 'gerenciar_equipe', nome: 'Gerenciar Equipa de Funcionários', icone: '👥' },
        { chave: 'ver_analises', nome: 'Acessar Relatórios e Análises', icone: '📈' }
    ];

    const carregar_permissoes_atuais = async () => {
        try {
            // Mock de dados atualizado com as novas chaves (em breve virá da API)
            matriz_permissoes.value = [
                { perfil: 'caixa', acessar_pdv: true, acessar_mesas: true, acessar_comandas: true, cancelar_vendas: false, aplicar_desconto: true, gerenciar_produtos: false, gerenciar_equipe: false, ver_analises: false },
                { perfil: 'garcom', acessar_pdv: false, acessar_mesas: true, acessar_comandas: true, cancelar_vendas: false, aplicar_desconto: false, gerenciar_produtos: false, gerenciar_equipe: false, ver_analises: false },
                { perfil: 'gerente', acessar_pdv: true, acessar_mesas: true, acessar_comandas: true, cancelar_vendas: true, aplicar_desconto: true, gerenciar_produtos: true, gerenciar_equipe: true, ver_analises: true }
            ];
        } catch (erro) {
            console.error(erro);
            toast_store.exibir_toast("Erro ao carregar permissões", "erro");
        } finally {
            carregando.value = false;
        }
    };

    const salvar_permissoes = async () => {
        try {
            // Simulando o tempo de salvamento na API
            setTimeout(() => {
                toast_store.exibir_toast("Permissões atualizadas com sucesso!", "sucesso"); // 🟢 Usando o Pop-up Global
            }, 800);
        } catch (erro) {
            toast_store.exibir_toast("Erro ao salvar permissões", "erro");
        }
    };

    onMounted(() => {
        carregar_permissoes_atuais();
    });

    return { carregando, matriz_permissoes, perfis, modulos, salvar_permissoes };
}