import axios from 'axios';
import { descobrir_servidor_local, obter_servidor_cacheado, limpar_cache_servidor } from './descoberta_rede.js';

// ─── Configuração de URL base da VPS ─────────────────────────────────────────

export const configurar_url_base = (codigo_loja = null) => {
    const eh_desenvolvimento = import.meta.env.DEV;
    let dominio_final = '';

    if (!codigo_loja || codigo_loja.toLowerCase() === 'master') {
        dominio_final = eh_desenvolvimento ? 'nitec.localhost:8000' : 'nitec.dev.br';
    } else {
        const sufixo = eh_desenvolvimento ? '.nitec.localhost:8000' : '.nitec.dev.br';
        dominio_final = codigo_loja + sufixo;
    }

    const protocolo = eh_desenvolvimento ? 'http' : 'https';
    return `${protocolo}://${dominio_final}/api`;
};

// ─── Instância principal (aponta para VPS) ───────────────────────────────────

const api_cliente = axios.create({
    baseURL: configurar_url_base(localStorage.getItem('nitec_tenant_id')),
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 8000,
});

// ─── Interceptor de requisição ────────────────────────────────────────────────

api_cliente.interceptors.request.use((config) => {
    const token = localStorage.getItem('nitec_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Accept']           = 'application/json';
    const loja_atual = localStorage.getItem('nitec_tenant_id') || 'master';
    config.baseURL   = configurar_url_base(loja_atual);
    return config;
});

// ─── Interceptor de resposta ─────────────────────────────────────────────────

api_cliente.interceptors.response.use((response) => {
    if (typeof response.data === 'string' && response.data.includes('<html')) {
        return Promise.reject(new Error("Erro de Rota: O Laravel devolveu HTML."));
    }
    return response;
}, async (error) => {
    const sem_resposta    = !error.response || error.response.status >= 500;
    const config_original = error.config;

    if (sem_resposta && config_original && !config_original._tentou_local) {
        config_original._tentou_local = true;

        let url_local = obter_servidor_cacheado();
        if (!url_local) {
            url_local = await descobrir_servidor_local();
        }

        if (url_local) {
            try {
                const api_local = axios.create({
                    baseURL: `${url_local}/api`,
                    headers: { ...config_original.headers },
                    timeout: 5000,
                });
                
                const resposta_local = await api_local.request({
                    method: config_original.method,
                    url   : config_original.url,
                    data  : config_original.data,
                });

                // 🟢 RASTREADOR 2: O que o Axios recebeu do Servidor Local?
                console.log(`[DEBUG AXIOS] Resposta do Servidor Local para ${config_original.url}:`, resposta_local.data);

                return resposta_local;

            } catch (erro_local) {
                // 🟢 CORREÇÃO 1: Limpa o cache APENAS se for erro de rede/timeout
                if (!erro_local.response) {
                    limpar_cache_servidor();
                }
                console.warn('[api_cliente] Servidor local falhou:', erro_local.message);
                
                // 🟢 CORREÇÃO 2: Rejeitar o erro local
                return Promise.reject(erro_local); 
            }
        }
    }

    return Promise.reject(error);
});

export default api_cliente;

// ─── Utilitário: obtém URL do servidor local ─────────────────────────────────

/**
 * Retorna URL do servidor local via cache ou IPC do Electron.
 * @returns {Promise<string|null>}
 */
const obter_url_servidor_local = async () => {
    const cacheado = obter_servidor_cacheado();
    if (cacheado) return cacheado;

    if (window?.require) {
        try {
            const { ipcRenderer } = window.require('electron');
            const info = await ipcRenderer.invoke('obter-servidor-local');
            if (info?.url) {
                localStorage.setItem('nitec_servidor_local', info.url);
                return info.url;
            }
        } catch { /* não está no Electron */ }
    }
    return null;
};

// ─── Sincronizadores ─────────────────────────────────────────────────────────

/**
 * Sincroniza a fila do servidor local com a VPS quando a internet voltar.
 * Chamado pelo sincronizador_bg.js a cada 20s.
 */
export const sincronizar_servidor_local_com_vps = async () => {
    if (!window?.require) return;

    const token    = localStorage.getItem('nitec_token');
    const tenant   = localStorage.getItem('nitec_tenant_id');
    const url_base = configurar_url_base(tenant);
    if (!token || !url_base) return;

    try {
        const { ipcRenderer } = window.require('electron');
        const resultado = await ipcRenderer.invoke('sincronizar-fila-local', { url_base, token });
        if (resultado.ok > 0)    console.log(`[Sync Local→VPS] ${resultado.ok} ação(ões) enviadas.`);
        if (resultado.falha > 0) console.warn(`[Sync Local→VPS] ${resultado.falha} falharam.`);
    } catch (e) {
        console.error('[Sync Local→VPS] Erro:', e.message);
    }
};

/**
 * Envia snapshot completo para o servidor local.
 * Inclui produtos, mesas, comandas e itens — tudo que o app precisa
 * para funcionar normalmente quando a VPS ficar offline.
 *
 * Chamado pelos stores após cada busca bem-sucedida na VPS.
 *
 * @param {Array|null} produtos
 * @param {Array|null} mesas
 * @param {Array|null} comandas  Lista de comandas com listar_itens embutidos
 */
export const sincronizar_cache_para_local = async (produtos, mesas, comandas = null) => {
    const url_local = await obter_url_servidor_local();
    if (!url_local) return;

    try {
        // Desmembra comandas e itens em listas separadas para o servidor local
        let itens = null;
        let comandas_sem_itens = null;

        if (comandas && Array.isArray(comandas)) {
            itens = [];
            comandas_sem_itens = comandas.map(c => {
                const { listar_itens, ...comanda_base } = c;
                if (listar_itens) {
                    listar_itens.forEach(item => itens.push({ ...item, comanda_id: c.id }));
                }
                return comanda_base;
            });
        }

        await axios.post(`${url_local}/api/sync-produtos`, {
            produtos,
            mesas,
            comandas : comandas_sem_itens,
            itens,
        }, { timeout: 5000 });

        console.log('[Cache→Local] Snapshot completo enviado para o servidor local.');
    } catch { /* silencioso — servidor local pode não estar disponível */ }
};