// C:\PDP\NITEC_APP\src\views\pagina_dashboard_logica.js
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';

export function useLogicaDashboard() {
    const roteador = useRouter();
    const loja_autenticacao = useAuthStore();

    const em_modo_suporte = ref(localStorage.getItem('nitec_modo_suporte') === 'ativo');
    const nome_cliente = ref(localStorage.getItem('nitec_nome_cliente') || '');

    // ==========================================
    // ESTADOS: ATUALIZAÇÕES DO ELECTRON
    // ==========================================
    const versao_atual = ref('1.0.0'); // Em produção, isto virá do package.json
    const modal_visivel = ref(false);
    const estado_atualizacao = ref('parado'); // parado, buscando, disponivel, baixando, pronto, erro
    const mensagem_status = ref('Clique abaixo para procurar novas versões.');
    const progresso = ref(0);
    const versao_nova = ref('');
    const status_erro = ref(false);

    // ==========================================
    // SETUP: IPC RENDERER (ELECTRON)
    // ==========================================
    const isElectron = window && window.process && window.process.type;
    let ipcRenderer = null;

    if (isElectron) {
        ipcRenderer = window.require('electron').ipcRenderer;
    }

    // ==========================================
    // FUNÇÕES: MODAL E ATUALIZAÇÕES
    // ==========================================
    const abrir_modal_atualizacoes = () => {
        modal_visivel.value = true;
        progresso.value = 0;
        status_erro.value = false;
        
        if (!isElectron) {
            mensagem_status.value = 'Você está usando a versão Web. O PDV atualiza-se automaticamente sempre que a página é recarregada.';
            estado_atualizacao.value = 'atualizado';
        } else {
            mensagem_status.value = 'Pronto para verificar atualizações no servidor.';
            estado_atualizacao.value = 'parado';
        }
    };

    const fechar_modal = () => {
        modal_visivel.value = false;
    };

    const checar_atualizacoes = () => {
        if (ipcRenderer) ipcRenderer.send('checar-atualizacoes');
    };

    const baixar_atualizacao = () => {
        if (ipcRenderer) {
            estado_atualizacao.value = 'baixando';
            mensagem_status.value = 'Baixando atualização... Por favor, aguarde.';
            ipcRenderer.send('baixar-atualizacao');
        }
    };

    const instalar_atualizacao = () => {
        if (ipcRenderer) {
            mensagem_status.value = 'Fechando o sistema e instalando...';
            ipcRenderer.send('instalar-atualizacao');
        }
    };

    // ==========================================
    // LIFECYCLE: EVENTOS DO ELECTRON
    // ==========================================
    onMounted(() => {
        if (ipcRenderer) {
            ipcRenderer.on('status-atualizacao', (event, info) => {
                status_erro.value = info.status === 'erro';
                mensagem_status.value = info.mensagem;
                estado_atualizacao.value = info.status;
                if (info.versao) versao_nova.value = info.versao;
            });

            ipcRenderer.on('progresso-download', (event, p) => {
                progresso.value = Math.round(p);
                mensagem_status.value = `Baixando... ${progresso.value}%`;
            });

            ipcRenderer.on('mensagem-atualizacao', (event, msg) => {
                 mensagem_status.value = msg;
            });
        }
    });

    onUnmounted(() => {
        if (ipcRenderer) {
            ipcRenderer.removeAllListeners('status-atualizacao');
            ipcRenderer.removeAllListeners('progresso-download');
            ipcRenderer.removeAllListeners('mensagem-atualizacao');
        }
    });

    // ==========================================
    // FUNÇÕES GERAIS DO DASHBOARD
    // ==========================================
    const encerrar_suporte = () => {
        const token_admin = localStorage.getItem('nitec_token_admin');
        const usuario_admin_raw = localStorage.getItem('nitec_usuario_admin');
        
        if (!token_admin) {
            alert("Sessão administrativa expirada. Por favor, faça login novamente.");
            return sair();
        }

        localStorage.removeItem('nitec_modo_suporte');
        localStorage.removeItem('nitec_api_tenant');
        localStorage.removeItem('nitec_nome_cliente');
        
        localStorage.setItem('nitec_tenant_id', 'master');
        localStorage.setItem('nitec_token', token_admin);
        
        if (usuario_admin_raw) {
            localStorage.setItem('nitec_usuario', usuario_admin_raw); 
            loja_autenticacao.usuario_logado = JSON.parse(usuario_admin_raw);
            loja_autenticacao.token_acesso = token_admin;
        }

        localStorage.removeItem('nitec_token_admin');
        localStorage.removeItem('nitec_usuario_admin');

        window.location.hash = '/admin-estabelecimentos';
        window.location.reload();
    };

    const ir_para = (rota_url) => {
        roteador.push(rota_url);
    };

    const sair = () => {
        // Agora usa o SweetAlert2 graças ao nosso Override global!
        if (confirm("Deseja realmente sair do sistema?")) {
            if (em_modo_suporte.value) {
                localStorage.removeItem('nitec_token_admin');
                localStorage.removeItem('nitec_modo_suporte');
                localStorage.removeItem('nitec_api_tenant');
                localStorage.removeItem('nitec_nome_cliente');
                localStorage.removeItem('nitec_usuario_admin');
            }
            loja_autenticacao.encerrar_sessao();
            roteador.push('/login');
        }
    };

    return { 
        nome_cliente, em_modo_suporte, ir_para, sair, encerrar_suporte,
        // Retornos da atualização
        versao_atual, modal_visivel, estado_atualizacao, mensagem_status, 
        progresso, versao_nova, status_erro, 
        abrir_modal_atualizacoes, fechar_modal, checar_atualizacoes, 
        baixar_atualizacao, instalar_atualizacao
    };
}