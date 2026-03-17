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

// ─── Utilitário: obtém URL do servidor local (Movido para o topo) ────────────

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

// ─── Circuit Breaker — VPS ───────────────────────────────────────────────────
// Quando a VPS falha, marca por 30s para evitar os 3.5s de timeout em cada
// requisição seguinte. Funciona mesmo com WiFi sem internet (navigator.onLine=true).
let _vps_indisponivel_ate = 0;
const _marcar_vps_indisponivel  = () => { _vps_indisponivel_ate = Date.now() + 30_000; };
const _resetar_circuit_breaker  = () => { _vps_indisponivel_ate = 0; };
const _vps_bloqueada            = () => Date.now() < _vps_indisponivel_ate;

// ─── Instância principal (aponta para VPS) ───────────────────────────────────

const api_cliente = axios.create({
    baseURL: configurar_url_base(localStorage.getItem('nitec_tenant_id')),
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    timeout: 3500, // 🟢 Reduzido para 3.5s. Desiste rápido da Nuvem para focar no Local!
});

// ─── Interceptor de requisição ────────────────────────────────────────────────

api_cliente.interceptors.request.use(async (config) => {
    const token = localStorage.getItem('nitec_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Accept']           = 'application/json';
    const loja_atual = localStorage.getItem('nitec_tenant_id') || 'master';
    config.baseURL   = configurar_url_base(loja_atual);

    // 🟢 ATALHO OFFLINE: Se o navegador sabe que está sem internet E já temos
    // o servidor local em cache, redirecionamos direto para ele — zero espera.
    // Vai direto ao servidor local se:
    // (a) navigator diz offline, OU
    // (b) circuit breaker está aberto (VPS falhou recentemente)
    if (!navigator.onLine || _vps_bloqueada()) {
        const url_local = await obter_url_servidor_local();
        if (url_local) {
            config.baseURL            = `${url_local}/api`;
            config.timeout            = 5000;
            config._roteado_ao_local  = true;
        }
    }

    return config;
});

// ─── Interceptor de resposta (O Cérebro do Offline) ──────────────────────────

api_cliente.interceptors.response.use((response) => {
    if (typeof response.data === 'string' && response.data.includes('<html')) {
        return Promise.reject(new Error("Erro de Rota: O Laravel devolveu HTML."));
    }

    // 🟢 AUTO-CACHE (Espionagem Positiva)
    try {
        if (response.config.method === 'get') {
            const url = response.config.url;
            if (url.includes('/listar-comandas') && response.data.comandas) {
                sincronizar_cache_para_local(null, null, response.data.comandas);
            } 
            else if (url.includes('/detalhes-mesa/') && response.data.dados?.listar_comandas) {
                sincronizar_cache_para_local(null, null, response.data.dados.listar_comandas);
            }
        }
    } catch (e) { /* Silencioso, não trava o sistema se falhar */ }

    // Resposta real da VPS — reativa o circuit breaker
    if (!response.config._roteado_ao_local) {
        _resetar_circuit_breaker();
    }

    return response;
}, async (error) => {
    // 🟢 CORREÇÃO: Tratar o 404 (Not Found) e o 0 (Network Error) como falhas legítimas para o Plano B
    const erro_critico = !error.response || error.response.status >= 500 || error.response.status === 404 || error.response.status === 0;
    const config_original = error.config;

    if (erro_critico && config_original && !config_original._tentou_local) {
        config_original._tentou_local = true;

        // Abre o circuit breaker — próximas requisições vão direto ao local
        if (!config_original._roteado_ao_local) {
            _marcar_vps_indisponivel();
        }

        console.groupCollapsed(`🔴 [DEBUG OFFLINE] Falha na VPS: ${config_original.url}`);
        console.log("1. Detetada falha na VPS ou ausência de internet. Tentando transição para Servidor Local...");

        let url_local = await obter_url_servidor_local();
        
        if (!url_local) {
            console.log("2. O IP local não estava no cache. Tentando descobrir na rede...");
            url_local = await descobrir_servidor_local();
        }

        console.log("3. IP do Servidor Local resolvido:", url_local || "Nenhum encontrado");

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

                console.log("4. ✔️ SUCESSO! Servidor local respondeu.");
                
                if (resposta_local.data && resposta_local.data._debug) {
                    console.log(`%c 🧠 [O CÉREBRO DO SERVIDOR LOCAL - ${config_original.url}] `, 'background: #111; color: #00ff00; font-size: 13px; font-weight: bold;', resposta_local.data._debug);
                }

                console.groupEnd();
                return resposta_local;

            } catch (erro_local) {
                console.warn("4. ❌ FALHA no IP principal:", erro_local.message);
                
                // 🟢 PLANO B DE SOBREVIVÊNCIA (Localhost)
                if (window?.require && !url_local.includes('127.0.0.1')) {
                    console.log("5. 🔄 Tentando auto-resgate via Localhost (127.0.0.1)...");
                    try {
                        const api_localhost = axios.create({
                            baseURL: `http://127.0.0.1:3737/api`,
                            headers: { ...config_original.headers },
                            timeout: 3000,
                        });
                        const resposta_localhost = await api_localhost.request({
                            method: config_original.method,
                            url   : config_original.url,
                            data  : config_original.data,
                        });
                        console.log("6. ✔️ SUCESSO via Localhost!");
                        console.groupEnd();
                        return resposta_localhost;
                    } catch (erro_localhost) {
                        console.warn("6. ❌ Localhost também falhou.");
                    }
                }

                if (!erro_local.response) {
                    limpar_cache_servidor();
                }
                console.groupEnd();
                return Promise.reject(erro_local); 
            }
        }
        console.groupEnd();
    }

    return Promise.reject(error);
});

export default api_cliente;

// ─── Sincronizadores ─────────────────────────────────────────────────────────

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

export const sincronizar_cache_para_local = async (produtos, mesas, comandas = null) => {
    const url_local = await obter_url_servidor_local();
    if (!url_local) return;

    try {
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

        console.log(`[Cache→Local] Snapshot enviado. Quantidade de Itens gravados: ${itens ? itens.length : 'Nenhum/Vazio'}`);
    } catch { /* silencioso */ }
};

// ─── Sincronização automática ao voltar online ────────────────────────────────────────

if (typeof window !== 'undefined') {
    window.addEventListener('online', async () => {
        console.log('[Nitec] 🟢 Internet voltou! Sincronizando fila local com a VPS...');
        // Passo 1: Envia todas as ações offline acumuladas para a VPS
        await sincronizar_servidor_local_com_vps();
        console.log('[Nitec] Fila sincronizada. Atualizando stores...');
        // Passo 2: Só agora busca dados frescos — evita comanda reaparecer
        try {
            const { useMesasStore }    = await import('../stores/mesas_store.js');
            const { useComandasStore } = await import('../stores/comandas_store.js');
            useMesasStore().buscar_mesas(true);
            useComandasStore().buscar_comandas(true);
        } catch (e) {
            console.warn('[Nitec] Erro ao atualizar stores após reconexão:', e.message);
        }
    });
}