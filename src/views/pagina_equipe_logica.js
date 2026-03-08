import { ref, onMounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

export function useLogicaEquipe() {
    const carregando = ref(true);
    const funcionarios = ref([]);
    const modal_aberto = ref(false);
    const salvando = ref(false);

    // Estado do formulário
    const form = ref({
        name: '',
        email: '',
        password: '',
        tipo_usuario: 'garcom',
        tipo_contrato: 'fixo',
        horas_validade: 8 // Padrão de 8 horas para temporários
    });

    const buscar_funcionarios = async () => {
        carregando.value = true;
        try {
            const resposta = await api_cliente.get('/equipe/listar');
            funcionarios.value = resposta.data.funcionarios;
        } catch (erro) {
            console.error("Erro ao buscar equipe:", erro);
            alert("Não foi possível carregar a equipa.");
        } finally {
            carregando.value = false;
        }
    };

    const abrir_modal = () => {
        form.value = { name: '', email: '', password: '', tipo_usuario: 'garcom', tipo_contrato: 'fixo', horas_validade: 8 };
        modal_aberto.value = true;
    };

    const fechar_modal = () => {
        modal_aberto.value = false;
    };

    const salvar_funcionario = async () => {
        if (!form.value.name || !form.value.email || !form.value.password) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        salvando.value = true;
        try {
            await api_cliente.post('/equipe/cadastrar', form.value);
            fechar_modal();
            await buscar_funcionarios(); // Recarrega a lista
        } catch (erro) {
            console.error(erro);
            alert(erro.response?.data?.message || "Erro ao cadastrar funcionário.");
        } finally {
            salvando.value = false;
        }
    };

    const alternar_status = async (id) => {
        try {
            await api_cliente.post(`/equipe/alternar-status/${id}`);
            await buscar_funcionarios(); // Recarrega para refletir a mudança
        } catch (erro) {
            console.error(erro);
            alert(erro.response?.data?.mensagem || "Erro ao alterar status.");
        }
    };

    onMounted(() => {
        buscar_funcionarios();
    });

    return {
        carregando, funcionarios, modal_aberto, salvando, form,
        abrir_modal, fechar_modal, salvar_funcionario, alternar_status
    };
}