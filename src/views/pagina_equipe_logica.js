import { ref, computed, onMounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

export function useLogicaEquipe() {
    const carregando = ref(true);
    const funcionarios = ref([]);
    const modal_aberto = ref(false);
    const salvando = ref(false);

    const termo_pesquisa = ref('');
    const mostrar_demitidos = ref(false);

    // 🟢 Controle de Edição
    const modo_edicao = ref(false);
    const id_edicao = ref(null);

    const form = ref({
        name: '', email: '', telefone: '', password: '', tipo_usuario: 'garcom', tipo_contrato: 'fixo', horas_validade: 8
    });

    const modal_confirmacao = ref({ aberto: false, acao: '', id_funcionario: null, titulo: '', mensagem: '', texto_botao: '', cor_botao: '' });

    const buscar_funcionarios = async () => {
        carregando.value = true;
        try {
            const resposta = await api_cliente.get('/equipe/listar');
            funcionarios.value = resposta.data.funcionarios;
        } catch (erro) { console.error(erro); } finally { carregando.value = false; }
    };

    const funcionarios_filtrados = computed(() => {
        return funcionarios.value.filter(func => {
            if (!mostrar_demitidos.value && func.status_conta === 'demitido') return false;
            if (termo_pesquisa.value && !func.name.toLowerCase().includes(termo_pesquisa.value.toLowerCase())) return false;
            return true;
        });
    });

    // 🟢 FUNÇÕES PARA O MODAL (Novo vs Editar)
    const abrir_modal_novo = () => {
        modo_edicao.value = false;
        id_edicao.value = null;
        form.value = { name: '', email: '', telefone: '', password: '', tipo_usuario: 'garcom', tipo_contrato: 'fixo', horas_validade: 8 };
        modal_aberto.value = true;
    };

    const abrir_modal_edicao = (func) => {
        modo_edicao.value = true;
        id_edicao.value = func.id;
        form.value = { 
            name: func.name, 
            email: func.email, 
            telefone: func.telefone || '', 
            password: '', // Senha vem vazia. Se digitar, altera. Se não, mantém a velha.
            tipo_usuario: func.tipo_usuario, 
            tipo_contrato: func.tipo_contrato, 
            horas_validade: 8 
        };
        modal_aberto.value = true;
    };

    const salvar_funcionario = async () => {
        if (!form.value.name || !form.value.email) return alert("Preencha o Nome e o E-mail.");
        if (!modo_edicao.value && !form.value.password) return alert("A senha é obrigatória para novos registros.");

        salvando.value = true;
        try {
            if (modo_edicao.value) {
                await api_cliente.post(`/equipe/editar/${id_edicao.value}`, form.value);
            } else {
                await api_cliente.post('/equipe/cadastrar', form.value);
            }
            modal_aberto.value = false;
            await buscar_funcionarios(); 
        } catch (erro) { alert(erro.response?.data?.message || "Erro ao salvar."); } finally { salvando.value = false; }
    };

    const alternar_status = async (id) => {
        try { await api_cliente.post(`/equipe/alternar-status/${id}`); await buscar_funcionarios(); } 
        catch (erro) { alert(erro.response?.data?.mensagem || "Erro"); }
    };

    const pedir_confirmacao = (acao, id) => {
        modal_confirmacao.value.acao = acao;
        modal_confirmacao.value.id_funcionario = id;
        if (acao === 'demitir') {
            modal_confirmacao.value.titulo = "Demitir Funcionário";
            modal_confirmacao.value.mensagem = "Deseja realmente demitir este funcionário? Ele perderá o acesso imediatamente, mas o histórico de vendas será preservado.";
            modal_confirmacao.value.texto_botao = "Sim, Demitir";
            modal_confirmacao.value.cor_botao = "bg-red-500 hover:bg-red-600";
        } else if (acao === 'readmitir') {
            modal_confirmacao.value.titulo = "Readmitir Funcionário";
            modal_confirmacao.value.mensagem = "Este funcionário voltará para a equipa com o status 'Inativo'. Precisará ativar o acesso dele para que ele possa logar. Deseja continuar?";
            modal_confirmacao.value.texto_botao = "Sim, Readmitir";
            modal_confirmacao.value.cor_botao = "bg-blue-500 hover:bg-blue-600";
        }
        modal_confirmacao.value.aberto = true;
    };

    const fechar_confirmacao = () => { modal_confirmacao.value.aberto = false; modal_confirmacao.value.id_funcionario = null; };

    const executar_confirmacao = async () => {
        const id = modal_confirmacao.value.id_funcionario;
        const acao = modal_confirmacao.value.acao;
        if (!id) return;
        try {
            if (acao === 'demitir') await api_cliente.post(`/equipe/demitir/${id}`);
            else if (acao === 'readmitir') await api_cliente.post(`/equipe/readmitir/${id}`);
            fechar_confirmacao();
            await buscar_funcionarios(); 
        } catch (erro) { alert(erro.response?.data?.mensagem || "Erro ao executar ação."); fechar_confirmacao(); }
    };

    onMounted(() => buscar_funcionarios());

    return {
        carregando, funcionarios_filtrados, modal_aberto, salvando, form,
        termo_pesquisa, mostrar_demitidos, modal_confirmacao, modo_edicao,
        abrir_modal_novo, abrir_modal_edicao, fechar_modal: () => modal_aberto.value = false,
        salvar_funcionario, alternar_status, pedir_confirmacao, fechar_confirmacao, executar_confirmacao
    };
}