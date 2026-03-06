import { ref, onMounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

export function useLogicaPermissoes() {
    // Começa como true para a tela não tentar renderizar o v-model na matriz vazia e dar "undefined"
    const carregando = ref(true); 
    const matriz_permissoes = ref([]);
    const status_salvamento = ref('');

    const perfis = ['caixa', 'garcom', 'gerente'];
    const modulos = [
        { chave: 'acessar_pdv', nome: 'Acessar Frente de Caixa' },
        { chave: 'acessar_mesas', nome: 'Visualizar Mesas' },
        { chave: 'editar_produtos', nome: 'Cadastrar/Editar Produtos' },
        { chave: 'cancelar_itens', nome: 'Excluir itens de uma comanda' }
    ];

    const carregar_permissoes_atuais = async () => {
        try {
            // Em breve vindo do banco
            matriz_permissoes.value = [
                { perfil: 'caixa', acessar_pdv: true, acessar_mesas: true, editar_produtos: false, cancelar_itens: true },
                { perfil: 'garcom', acessar_pdv: false, acessar_mesas: true, editar_produtos: false, cancelar_itens: false },
                { perfil: 'gerente', acessar_pdv: true, acessar_mesas: true, editar_produtos: true, cancelar_itens: true }
            ];
        } catch (erro) {
            console.error(erro);
        } finally {
            carregando.value = false;
        }
    };

    const salvar_permissoes = async () => {
        status_salvamento.value = 'Salvando...';
        try {
            setTimeout(() => {
                status_salvamento.value = 'Permissões atualizadas com sucesso!';
                setTimeout(() => status_salvamento.value = '', 3000);
            }, 1000);
        } catch (erro) {
            status_salvamento.value = 'Erro ao salvar!';
        }
    };

    onMounted(() => {
        carregar_permissoes_atuais();
    });

    return { carregando, matriz_permissoes, perfis, modulos, salvar_permissoes, status_salvamento };
}