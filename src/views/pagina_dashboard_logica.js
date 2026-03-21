import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; 
import { useAuthStore } from '../stores/auth_store.js';
import { useToastStore } from '../stores/toast_store.js'; 
import { iniciar_sincronizacao_de_fundo, parar_sincronizacao_de_fundo } from '../servicos/sincronizador_bg.js'; 
import { db } from '../banco_local/db.js';

export function useLogicaDashboard() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_autenticacao = useAuthStore();
    const toast_store = useToastStore(); 

    const em_modo_suporte = ref(localStorage.getItem('nitec_modo_suporte') === 'ativo');
    const nome_cliente = ref(localStorage.getItem('nitec_nome_cliente') || '');
    const esta_offline = ref(!navigator.onLine);

    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    let ipcRenderer = null;
    if (isElectron) ipcRenderer = window.require('electron').ipcRenderer;

    // 🟢 Detecta se está rodando como APK Android (Capacitor)
    const isAndroid = !isElectron && typeof window !== 'undefined' && 
                      (navigator.userAgent.includes('Android') || window?.Capacitor?.isNativePlatform?.());

    const versao_atual = ref(import.meta.env.PACKAGE_VERSION || '1.1.0');
    const modal_visivel = ref(false);
    const modal_qr_visivel = ref(false);
    const abrir_modal_qr = () => modal_qr_visivel.value = true;
    const fechar_modal_qr = () => modal_qr_visivel.value = false;
    const estado_atualizacao = ref('parado'); 
    const mensagem_status = ref('Clique abaixo para procurar novas versões.');
    const progresso = ref(0);
    const versao_nova = ref('');
    const url_apk_nova = ref('');
    const status_erro = ref(false);
    const tem_atualizacao_nova = ref(false);
    const historico_versoes = ref([]);
    const carregando_historico = ref(false);

    const e_versao_mais_recente = (v_nova, v_atual) => {
        const n = v_nova.split('.').map(Number);
        const a = v_atual.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (n[i] > a[i]) return true;
            if (n[i] < a[i]) return false;
        }
        return false;
    };

    async function limpar_dados_locais_completos() {
        try {
            await db.transaction('rw', db.tables, async () => {
                for (const tabela of db.tables) {
                    await tabela.clear();
                }
            });
            const chaves = [
                'nitec_token_admin', 'nitec_modo_suporte', 'nitec_api_tenant',
                'nitec_nome_cliente', 'nitec_usuario_admin'
            ];
            chaves.forEach(k => localStorage.removeItem(k));
        } catch (erro) {
            console.error("Erro na limpeza de sessão:", erro);
        }
    }

    const buscar_historico_github = async () => {
        carregando_historico.value = true;
        try {
            const resposta = await fetch('https://api.github.com/repos/Nicollas42/nitec-atualizacoes/releases');
            const dados = await resposta.json();
            historico_versoes.value = dados.filter(release => !release.draft);
        } catch (erro) { console.error(erro); } finally { carregando_historico.value = false; }
    };

    // ─── Auto-update Android ─────────────────────────────────────────────────

    /**
     * Verifica se há nova versão disponível para Android no GitHub.
     * Procura por um asset .apk na release mais recente.
     */
    /**
     * Prioriza o APK versionado da release para evitar baixar assets genÃ©ricos
     * quando existir um arquivo com nome amigÃ¡vel publicado.
     * @param {Array<{ name?: string, browser_download_url?: string }>} lista_assets
     * @param {string} versao_release
     * @returns {{ name?: string, browser_download_url?: string } | null}
     */
    const obter_asset_apk_da_release = (lista_assets = [], versao_release = '') => {
        const nome_versionado = `NitecSystem-${versao_release}.apk`;
        const asset_versionado = lista_assets.find((asset) => asset?.name === nome_versionado);

        if (asset_versionado) return asset_versionado;

        return lista_assets.find((asset) => asset?.name?.toLowerCase().endsWith('.apk')) || null;
    };

    const checar_atualizacoes_android = async () => {
        estado_atualizacao.value = 'buscando';
        mensagem_status.value = 'Verificando atualizações...';
        status_erro.value = false;

        try {
            const resp = await fetch('https://api.github.com/repos/Nicollas42/nitec-atualizacoes/releases/latest');
            const release = await resp.json();

            if (!release?.tag_name) {
                mensagem_status.value = 'Não foi possível verificar atualizações.';
                estado_atualizacao.value = 'erro';
                status_erro.value = true;
                return;
            }

            // Remove o 'v' da tag (ex: v1.1.5 → 1.1.5)
            const versao_github = release.tag_name.replace(/^v/, '');

            // Procura o APK nos assets da release
            const asset_apk = obter_asset_apk_da_release(release.assets || [], versao_github);

            if (e_versao_mais_recente(versao_github, versao_atual.value) && asset_apk) {
                versao_nova.value = versao_github;
                url_apk_nova.value = asset_apk.browser_download_url;
                estado_atualizacao.value = 'disponivel';
                mensagem_status.value = `Versão ${versao_github} disponível!`;
                tem_atualizacao_nova.value = true;
            } else {
                estado_atualizacao.value = 'atualizado';
                mensagem_status.value = 'Você já está na versão mais recente.';
                tem_atualizacao_nova.value = false;
            }
        } catch (e) {
            estado_atualizacao.value = 'erro';
            mensagem_status.value = 'Erro ao verificar atualizações.';
            status_erro.value = true;
        }
    };

    /**
     * Baixa e instala o APK diretamente no Android.
     * Abre o link de download no browser externo do celular.
     * O Android baixa o APK e pede confirmação para instalar.
     */
    const baixar_e_instalar_android = () => {
        if (!url_apk_nova.value) return;
        // Abre no browser externo — o Android gerencia o download e instalação
        window.open(url_apk_nova.value, '_system');
        mensagem_status.value = 'Download iniciado no navegador. Abra o arquivo para instalar.';
        estado_atualizacao.value = 'baixando';
    };

    // ─── Controle do modal de atualizações ───────────────────────────────────

    const abrir_modal_atualizacoes = () => {
        modal_visivel.value = true;
        progresso.value = 0;
        status_erro.value = false;
        buscar_historico_github();

        if (isAndroid) {
            // Android — verifica via GitHub API diretamente
            checar_atualizacoes_android();
        } else if (!isElectron) {
            // Browser web
            mensagem_status.value = 'Você está usando a versão Web. O PDV atualiza-se automaticamente ao recarregar.';
            estado_atualizacao.value = 'atualizado';
        } else {
            // Electron (desktop)
            mensagem_status.value = 'Pronto para verificar atualizações no servidor.';
            estado_atualizacao.value = 'parado';
            checar_atualizacoes();
        }
    };

    const obter_link_executavel = (assets) => {
        if (!assets || assets.length === 0) return '#';
        const asset_exe = assets.find(a => a.name.endsWith('.exe'));
        return asset_exe ? asset_exe.browser_download_url : assets[0].browser_download_url;
    };

    const checar_atualizacoes = () => {
        if (ipcRenderer) {
            estado_atualizacao.value = 'buscando';
            mensagem_status.value = 'Buscando atualizações no servidor...';
            ipcRenderer.send('checar-atualizacoes');
        }
    };
    
    const baixar_atualizacao = () => {
        if (isAndroid) {
            baixar_e_instalar_android();
            return;
        }
        if (ipcRenderer) {
            estado_atualizacao.value = 'baixando';
            mensagem_status.value = 'Iniciando download da atualização... Por favor, aguarde.';
            ipcRenderer.send('baixar-atualizacao');
        }
    };

    const instalar_atualizacao = () => {
        if (ipcRenderer) {
            mensagem_status.value = 'Fechando o sistema e instalando...';
            ipcRenderer.send('instalar-atualizacao');
        }
    };

    const baixar_versao_antiga = (url) => isElectron 
        ? window.require('electron').shell.openExternal(url) 
        : window.open(url, '_blank');

    const encerrar_suporte = async () => {
        parar_sincronizacao_de_fundo(); 
        const token_admin = localStorage.getItem('nitec_token_admin');
        const usuario_admin_raw = localStorage.getItem('nitec_usuario_admin');
        await limpar_dados_locais_completos();
        if (token_admin && usuario_admin_raw) {
            localStorage.setItem('nitec_tenant_id', 'master');
            localStorage.setItem('nitec_token', token_admin);
            localStorage.setItem('nitec_usuario', usuario_admin_raw); 
        }
        roteador.replace('/admin-estabelecimentos').then(() => window.location.reload());
    };

    const sair = async () => {
        if (!confirm("Deseja realmente sair do sistema?")) return;
        parar_sincronizacao_de_fundo(); 
        await limpar_dados_locais_completos();
        loja_autenticacao.encerrar_sessao();
        roteador.replace('/login').then(() => window.location.reload());
    };

    onMounted(() => {
        iniciar_sincronizacao_de_fundo();
        window.addEventListener('online',  () => { esta_offline.value = false; fechar_modal_qr(); });
        window.addEventListener('offline', () => esta_offline.value = true);

        if (ipcRenderer) {
            ipcRenderer.send('pedir-versao');
            ipcRenderer.send('checar-atualizacoes');

            ipcRenderer.on('resposta-versao', (event, v) => versao_atual.value = v);
            
            ipcRenderer.on('status-atualizacao', (event, info) => {
                status_erro.value = info.status === 'erro';
                
                if (info.status === 'disponivel') {
                    if (e_versao_mais_recente(info.versao, versao_atual.value)) {
                        estado_atualizacao.value = 'disponivel';
                        mensagem_status.value = info.mensagem;
                        tem_atualizacao_nova.value = true;
                        versao_nova.value = info.versao;
                    } else {
                        estado_atualizacao.value = 'atualizado';
                        mensagem_status.value = 'Você já está usando a versão mais recente.';
                        tem_atualizacao_nova.value = false;
                    }
                } else {
                    estado_atualizacao.value = info.status;
                    mensagem_status.value = info.mensagem;
                }

                if (info.status === 'pronto') {
                    toast_store.exibir_toast("Sistema atualizado! Reiniciando em instantes...", "sucesso");
                    setTimeout(() => { estado_atualizacao.value = 'instalando'; instalar_atualizacao(); }, 2500);
                }
            });

            ipcRenderer.on('progresso-download', (event, p) => {
                progresso.value = Math.round(p);
                mensagem_status.value = `Baixando... ${progresso.value}%`;
            });

            ipcRenderer.on('mensagem-atualizacao', (event, msg) => mensagem_status.value = msg);
        }

        // 🟢 No Android, verifica atualizações automaticamente ao abrir
        if (isAndroid) {
            setTimeout(() => checar_atualizacoes_android(), 3000);
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

    return { 
        nome_cliente, em_modo_suporte, sair, encerrar_suporte,
        versao_atual, modal_visivel, estado_atualizacao, mensagem_status, 
        progresso, versao_nova, status_erro, tem_atualizacao_nova, 
        historico_versoes, carregando_historico,
        abrir_modal_atualizacoes, fechar_modal: () => modal_visivel.value = false,
        checar_atualizacoes, baixar_atualizacao, instalar_atualizacao, 
        baixar_versao_antiga, obter_link_executavel,
        esta_offline, rota_atual, ir_para: (url) => roteador.push(url), 
        modal_qr_visivel, abrir_modal_qr, fechar_modal_qr,
        isAndroid,
    };
}
