import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; 
import { useAuthStore } from '../stores/auth_store.js';
import { iniciar_sincronizacao_de_fundo, parar_sincronizacao_de_fundo } from '../servicos/sincronizador_bg.js'; 
import { db } from '../banco_local/db.js';


export function useLogicaDashboard() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_autenticacao = useAuthStore();

    const em_modo_suporte = ref(localStorage.getItem('nitec_modo_suporte') === 'ativo');
    const nome_cliente = ref(localStorage.getItem('nitec_nome_cliente') || '');
    const esta_offline = ref(!navigator.onLine);

    const isElectron = navigator.userAgent.toLowerCase().includes('electron');
    let ipcRenderer = null;
    if (isElectron) ipcRenderer = window.require('electron').ipcRenderer;

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

    const abrir_modal_atualizacoes = () => {
        modal_visivel.value = true;
        buscar_historico_github();
        if (isElectron) {
            estado_atualizacao.value = 'parado';
            ipcRenderer.send('checar-atualizacoes');
        }
    };

    const checar_atualizacoes = () => ipcRenderer?.send('checar-atualizacoes');
    const baixar_atualizacao = () => ipcRenderer?.send('baixar-atualizacao');
    const instalar_atualizacao = () => ipcRenderer?.send('instalar-atualizacao');
    const baixar_versao_antiga = (url) => isElectron ? window.require('electron').shell.openExternal(url) : window.open(url, '_blank');

    // --- 🟢 CORREÇÃO: ORDEM DE EXECUÇÃO DO SUPORTE ---
    const encerrar_suporte = async () => {
        parar_sincronizacao_de_fundo(); 
        
        // 1. PRIMEIRO: Salva as informações do Admin Master na memória temporária
        const token_admin = localStorage.getItem('nitec_token_admin');
        const usuario_admin_raw = localStorage.getItem('nitec_usuario_admin');
        
        // 2. SEGUNDO: Limpa todo o lixo do cliente atual (Isso apagaria o Admin se não tivéssemos salvo no passo 1)
        await limpar_dados_locais_completos();
        
        // 3. TERCEIRO: Restaura as informações do Admin no sistema principal
        if (token_admin && usuario_admin_raw) {
            localStorage.setItem('nitec_tenant_id', 'master');
            localStorage.setItem('nitec_token', token_admin);
            localStorage.setItem('nitec_usuario', usuario_admin_raw); 
        }

        // 4. QUARTO: Redireciona e força o recarregamento
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
        window.addEventListener('online', () => esta_offline.value = false);
        window.addEventListener('offline', () => esta_offline.value = true);

        if (ipcRenderer) {
            ipcRenderer.send('pedir-versao');
            ipcRenderer.on('resposta-versao', (event, v) => versao_atual.value = v);
            
            ipcRenderer.on('status-atualizacao', (event, info) => {
                estado_atualizacao.value = info.status;
                mensagem_status.value = info.mensagem;
                status_erro.value = info.status === 'erro';
                if (info.status === 'disponivel') {
                    tem_atualizacao_nova.value = true;
                    versao_nova.value = info.versao;
                }
            });
            ipcRenderer.on('progresso-download', (event, p) => progresso.value = Math.round(p));
            ipcRenderer.on('mensagem-atualizacao', (event, msg) => mensagem_status.value = msg);
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
        progresso, versao_nova, status_erro, tem_atualizacao_nova, historico_versoes, carregando_historico,
        abrir_modal_atualizacoes, fechar_modal: () => modal_visivel.value = false,
        checar_atualizacoes, baixar_atualizacao, instalar_atualizacao, baixar_versao_antiga,
        esta_offline, rota_atual, ir_para: (url) => roteador.push(url)
    };
}