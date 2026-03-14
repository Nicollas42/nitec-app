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
            console.log('[api_cliente] VPS indisponível. Descobrindo servidor local...');
            url_local = await descobrir_servidor_local();
        }

        if (url_local) {
            console.log(`[api_cliente] Redirecionando para servidor local: ${url_local}`);
            try {
                const api_local = axios.create({
                    baseURL: url_local,
                    headers: { ...config_original.headers },
                    timeout: 5000,
                });
                return await api_local.request({
                    method: config_original.method,
                    url   : config_original.url,
                    data  : config_original.data,
                });
            } catch (erro_local) {
                limpar_cache_servidor();
                console.warn('[api_cliente] Servidor local também falhou:', erro_local.message);
            }
        }
    }

    return Promise.reject(error);
});

export default api_cliente;

// ─── Utilitário: obtém URL do servidor local (cache ou IPC) ──────────────────

/**
 * Retorna a URL do servidor local.
 * Tenta o cache primeiro, depois IPC do Electron (não faz fetch, funciona offline).
 * @returns {Promise<string|null>}
 */
const obter_url_servidor_local = async () => {
    const cacheado = obter_servidor_cacheado();
    if (cacheado) return cacheado;

    // IPC do Electron — não faz fetch, nunca bloqueado por falta de internet
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
 * Envia cache de produtos e mesas para o servidor local.
 * Chamado pelos stores após busca bem-sucedida na VPS.
 * 🟢 Corrigido: tenta IPC quando não há cache ainda (primeiro uso).
 */
export const sincronizar_cache_para_local = async (produtos, mesas) => {
    const url_local = await obter_url_servidor_local();
    if (!url_local) return;

    try {
        await axios.post(`${url_local}/api/sync-produtos`, { produtos, mesas }, { timeout: 3000 });
        console.log('[Cache→Local] Produtos e mesas enviados para o servidor local.');
    } catch { /* silencioso */ }
};