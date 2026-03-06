import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; 
import { useAuthStore } from '../stores/auth_store.js';

export function useLogicaDashboard() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_autenticacao = useAuthStore();

    const em_modo_suporte = ref(localStorage.getItem('nitec_modo_suporte') === 'ativo');
    const nome_cliente = ref(localStorage.getItem('nitec_nome_cliente') || '');

    const esta_offline = ref(!navigator.onLine);
    const atualizar_status_rede = () => { esta_offline.value = !navigator.onLine; };

    const versao_atual = ref(import.meta.env.PACKAGE_VERSION || '1.0.2');
    const modal_visivel = ref(false);
    const estado_atualizacao = ref('parado'); 
    const mensagem_status = ref('Clique abaixo para procurar novas versões.');
    const progresso = ref(0);
    const versao_nova = ref('');
    const status_erro = ref(false);
    const tem_atualizacao_nova = ref(false);
    const historico_versoes = ref([]);
    const carregando_historico = ref(false);

    const isElectron = window && window.process && window.process.type;
    let ipcRenderer = null;

    if (isElectron) {
        ipcRenderer = window.require('electron').ipcRenderer;
    }

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

    const fechar_modal = () => modal_visivel.value = false;
    const checar_atualizacoes = () => { if (ipcRenderer) ipcRenderer.send('checar-atualizacoes'); };
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

    onMounted(() => {
        window.addEventListener('online', atualizar_status_rede);
        window.addEventListener('offline', atualizar_status_rede);

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
            versao_atual.value = 'Web';
        }
    });

    onUnmounted(() => {
        window.removeEventListener('online', atualizar_status_rede);
        window.removeEventListener('offline', atualizar_status_rede);
        if (ipcRenderer) {
            ipcRenderer.removeAllListeners('status-atualizacao');
            ipcRenderer.removeAllListeners('progresso-download');
            ipcRenderer.removeAllListeners('mensagem-atualizacao');
            ipcRenderer.removeAllListeners('resposta-versao');
        }
    });

    const ir_para = (rota_url) => roteador.push(rota_url);

    const encerrar_suporte = () => {
        try {
            const token_admin = localStorage.getItem('nitec_token_admin');
            const usuario_admin_raw = localStorage.getItem('nitec_usuario_admin');
            
            localStorage.removeItem('nitec_modo_suporte');
            localStorage.removeItem('nitec_api_tenant');
            localStorage.removeItem('nitec_nome_cliente');
            
            if (token_admin && usuario_admin_raw) {
                localStorage.setItem('nitec_tenant_id', 'master');
                localStorage.setItem('nitec_token', token_admin);
                localStorage.setItem('nitec_usuario', usuario_admin_raw); 
            }

            localStorage.removeItem('nitec_token_admin');
            localStorage.removeItem('nitec_usuario_admin');

            window.location.href = window.location.origin + window.location.pathname + '#/admin-estabelecimentos';
            window.location.reload();
        } catch (erro) {
            console.error("Erro ao sair do suporte:", erro);
            alert("Ocorreu um erro ao sair. Limpando a sessão forçadamente...");
            localStorage.clear();
            window.location.href = window.location.origin + window.location.pathname + '#/login';
            window.location.reload();
        }
    };

    const sair = () => {
        try {
            if (confirm("Deseja realmente sair do sistema?")) {
                localStorage.removeItem('nitec_token_admin');
                localStorage.removeItem('nitec_modo_suporte');
                localStorage.removeItem('nitec_api_tenant');
                localStorage.removeItem('nitec_nome_cliente');
                localStorage.removeItem('nitec_usuario_admin');
                
                loja_autenticacao.encerrar_sessao();
                
                window.location.href = window.location.origin + window.location.pathname + '#/login';
                window.location.reload();
            }
        } catch (erro) {
            console.error("Erro no logout:", erro);
        }
    };

    return { 
        nome_cliente, em_modo_suporte, ir_para, sair, encerrar_suporte,
        versao_atual, modal_visivel, estado_atualizacao, mensagem_status, 
        progresso, versao_nova, status_erro, tem_atualizacao_nova, historico_versoes, carregando_historico,
        abrir_modal_atualizacoes, fechar_modal, checar_atualizacoes, 
        baixar_atualizacao, instalar_atualizacao, baixar_versao_antiga,
        esta_offline, rota_atual
    };
}