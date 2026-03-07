import { ref, onMounted } from 'vue';
import axios from 'axios';
import api_cliente, { configurar_url_base } from '../servicos/api_cliente.js';

export function useAdminEstabelecimentos() {
    const estabelecimentos_ativos = ref([]);
    const estabelecimentos_inativos = ref([]);
    
    // 🟢 ESTADOS DA NOVA INTERFACE MINIMALISTA
    const aba_atual = ref('ativos'); // Controla qual lista mostrar na tabela
    const modal_novo_cliente = ref(false); // Controla a janela de cadastro

    const novo_bar = ref({ id_do_bar: '', dominio: '', nome_dono: '', email_dono: '', senha_dono: '', cnpj: '', telefone: '' });
    const senhas_visiveis = ref({});

    const dominio_base = ref(window.location.hostname.includes('localhost') ? 'nitec.localhost' : 'nitec.dev.br');
    const dominio_prefixo = ref('');

    const alternar_senha = (id) => {
        senhas_visiveis.value[id] = !senhas_visiveis.value[id];
    };

    const formatarTelefone = (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length > 0 && !v.startsWith('55')) v = '55' + v;
        if (v.length <= 12) {
            v = v.replace(/^(\d{2})(\d{2})(\d{4})(\d{0,4})/, '+$1 ($2) $3-$4');
        } else {
            v = v.replace(/^(\d{2})(\d{2})(\d{5})(\d{0,4})/, '+$1 ($2) $3-$4');
        }
        novo_bar.value.telefone = v.replace(/-$/, ''); 
    };

    const formatarDocumento = (e) => {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length <= 11) { 
            v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
        } else { 
            v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
        }
        novo_bar.value.cnpj = v.replace(/[-/.]*$/, '');
    };

    const validarCPF_CNPJ = (val) => {
        if (!val) return false;
        const doc = val.replace(/\D/g, '');
        if (doc.length !== 11 && doc.length !== 14) return false;
        if (/^(\d)\1+$/.test(doc)) return false;

        if (doc.length === 11) {
            let sum = 0, rest;
            for (let i = 1; i <= 9; i++) sum += parseInt(doc.substring(i-1, i)) * (11 - i);
            rest = (sum * 10) % 11;
            if ((rest == 10) || (rest == 11)) rest = 0;
            if (rest != parseInt(doc.substring(9, 10))) return false;
            sum = 0;
            for (let i = 1; i <= 10; i++) sum += parseInt(doc.substring(i-1, i)) * (12 - i);
            rest = (sum * 10) % 11;
            if ((rest == 10) || (rest == 11)) rest = 0;
            if (rest != parseInt(doc.substring(10, 11))) return false;
            return true;
        }

        if (doc.length === 14) {
            let tamanho = doc.length - 2;
            let numeros = doc.substring(0, tamanho);
            let digitos = doc.substring(tamanho);
            let soma = 0;
            let pos = tamanho - 7;
            for (let i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2) pos = 9;
            }
            let resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(0)) return false;
            
            tamanho = doc.length - 1;
            numeros = doc.substring(0, tamanho);
            soma = 0;
            pos = tamanho - 7;
            for (let i = tamanho; i >= 1; i--) {
                soma += numeros.charAt(tamanho - i) * pos--;
                if (pos < 2) pos = 9;
            }
            resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;
            if (resultado != digitos.charAt(1)) return false;
            return true;
        }
        return false;
    };

    const carregar_dados = async () => {
        try {
            const resposta = await api_cliente.get('/admin/listar-estabelecimentos');
            if (resposta.data.ativos || resposta.data.inativos) {
                estabelecimentos_ativos.value = resposta.data.ativos || [];
                estabelecimentos_inativos.value = resposta.data.inativos || [];
            } else {
                estabelecimentos_ativos.value = resposta.data.dados || [];
                estabelecimentos_inativos.value = [];
            }
        } catch (erro) {
            console.error("Erro ao listar:", erro);
        }
    };

    const registrar_estabelecimento = async () => {
        if(!novo_bar.value.id_do_bar || !dominio_prefixo.value) return alert("Preencha ID e Domínio.");
        if(novo_bar.value.cnpj && !validarCPF_CNPJ(novo_bar.value.cnpj)) {
            return alert("O CPF ou CNPJ informado é inválido. Por favor, corrija.");
        }

        const prefixo_limpo = dominio_prefixo.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        novo_bar.value.dominio = `${prefixo_limpo}.${dominio_base.value}`;

        try {
            await api_cliente.post('/admin/cadastrar-novo-bar', novo_bar.value);
            novo_bar.value = { id_do_bar: '', dominio: '', nome_dono: '', email_dono: '', senha_dono: '', cnpj: '', telefone: '' };
            dominio_prefixo.value = '';
            modal_novo_cliente.value = false; // Fecha o modal após sucesso
            carregar_dados();
            alert("Cliente SaaS criado com sucesso!");
        } catch (erro) {
            alert("Erro ao registrar.");
        }
    };

    const alternar_status = async (id) => {
        if(!confirm("Deseja alterar o status de acesso deste cliente?")) return;
        try {
            const resposta = await api_cliente.put(`/admin/alternar-status-bar/${id}`);
            alert(resposta.data.mensagem);
            carregar_dados();
        } catch (erro) {
            alert("Erro ao alterar status.");
        }
    };

    const excluir_cliente = async (id) => {
        const confirmacao = confirm(`⚠️ ATENÇÃO EXTREMA!\n\nVocê está prestes a EXCLUIR PERMANENTEMENTE o cliente '${id}'.\nIsso apagará o banco de dados dele e todas as informações. \n\nDeseja realmente continuar?`);
        if(!confirmacao) return;

        try {
            const resposta = await api_cliente.delete(`/admin/excluir-bar/${id}`);
            alert(resposta.data.mensagem);
            carregar_dados(); 
        } catch (erro) {
            alert("Erro ao excluir o cliente permanentemente.");
            console.error(erro);
        }
    };

    const acessar_suporte = async (tenant_id) => {
        try {
            const url_central = configurar_url_base('master'); 
            const resposta = await axios.get(`${url_central}/admin/gerar-acesso-suporte/${tenant_id}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('nitec_token')}`
                }
            });

            if (resposta.data.sucesso) {
                localStorage.setItem('nitec_token_admin', localStorage.getItem('nitec_token'));
                localStorage.setItem('nitec_usuario_admin', localStorage.getItem('nitec_usuario')); 
                
                localStorage.setItem('nitec_token', resposta.data.token);
                localStorage.setItem('nitec_modo_suporte', 'ativo');
                localStorage.setItem('nitec_api_tenant', resposta.data.api_url);
                localStorage.setItem('nitec_nome_cliente', resposta.data.nome_dono);
                localStorage.setItem('nitec_tenant_id', tenant_id); 

                localStorage.setItem('nitec_usuario', JSON.stringify({
                    nome: `SUPORTE: ${resposta.data.nome_dono}`,
                    tipo_usuario: 'dono' 
                }));

                window.location.hash = '/painel-central';
                window.location.reload();
            }
        } catch (erro) {
            console.error("Falha no suporte:", erro);
            alert("Erro ao conectar com a central para suporte técnico.");
        }
    };

    onMounted(carregar_dados);

    return {
        estabelecimentos_ativos, estabelecimentos_inativos, novo_bar,
        senhas_visiveis, dominio_base, dominio_prefixo, alternar_senha,
        formatarTelefone, formatarDocumento, registrar_estabelecimento,
        alternar_status, excluir_cliente, acessar_suporte,
        aba_atual, modal_novo_cliente // 🟢 Exportando as novas variáveis de controle
    };
}