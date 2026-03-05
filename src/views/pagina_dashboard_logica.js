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
    const versao_atual = ref(import.meta.env.PACKAGE_VERSION || '1.0.2');
    const modal_visivel = ref(false);
    const estado_atualizacao = ref('parado'); 
    const mensagem_status = ref('Clique abaixo para procurar novas versões.');
    const progresso = ref(0);
    const versao_nova = ref('');
    const status_erro = ref(false);
    
    // NOVIDADES: Histórico e Notificação
    const tem_atualizacao_nova = ref(false);
    const historico_versoes = ref([]);
    const carregando_historico = ref(false);

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
    const buscar_historico_github = async () => {
        carregando_historico.value = true;
        try {
            const resposta = await fetch('https://api.github.com/repos/Nicollas42/nitec-atualizacoes/releases');
            const dados = await resposta.json();
            historico_versoes.value = dados.filter(release => !release.draft);
        } catch (erro) {
            console.error("Erro ao buscar histórico:", erro);
        } finally {
            carregando_historico.value = false;
        }
    };

    const baixar_versao_antiga = (url_download) => {
        if (isElectron) {
            window.require('electron').shell.openExternal(url_download);
        } else {
            window.open(url_download, '_blank');
        }
    };

    const abrir_modal_atualizacoes = () => {
        modal_visivel.value = true;
        progresso.value = 0;
        status_erro.value = false;
        tem_atualizacao_nova.value = false; 
        
        buscar_historico_github();
        
        if (!isElectron) {
            mensagem_status.value = 'Você está usando a versão Web. O PDV atualiza-se automaticamente.';
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
            ipcRenderer.send('pedir-versao');
            ipcRenderer.on('resposta-versao', (event, v) => versao_atual.value = v);

            ipcRenderer.send('checar-atualizacoes');

            ipcRenderer.on('status-atualizacao', (event, info) => {
                if (modal_visivel.value) {
                    status_erro.value = info.status === 'erro';
                    mensagem_status.value = info.mensagem;
                    estado_atualizacao.value = info.status;
                }
                
                if (info.status === 'disponivel') {
                    tem_atualizacao_nova.value = true;
                    if (info.versao) versao_nova.value = info.versao;
                }
            });

            ipcRenderer.on('progresso-download', (event, p) => {
                if (modal_visivel.value) {
                    progresso.value = Math.round(p);
                    mensagem_status.value = `Baixando... ${progresso.value}%`;
                }
            });

            ipcRenderer.on('mensagem-atualizacao', (event, msg) => {
                 if (modal_visivel.value) mensagem_status.value = msg;
            });
        } else {
            // SE ESTIVER A RODAR NO NAVEGADOR (Chrome/Edge via npm run dev)
            // Impede o "Carregando..." infinito!
            versao_atual.value = 'Web';
        }
    });

    onUnmounted(() => {
        if (ipcRenderer) {
            ipcRenderer.removeAllListeners('status-atualizacao');
            ipcRenderer.removeAllListeners('progresso-download');
            ipcRenderer.removeAllListeners('mensagem-atualizacao');
            ipcRenderer.removeAllListeners('resposta-versao');
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
        versao_atual, modal_visivel, estado_atualizacao, mensagem_status, 
        progresso, versao_nova, status_erro, tem_atualizacao_nova, historico_versoes, carregando_historico,
        abrir_modal_atualizacoes, fechar_modal, checar_atualizacoes, 
        baixar_atualizacao, instalar_atualizacao, baixar_versao_antiga
    };
}