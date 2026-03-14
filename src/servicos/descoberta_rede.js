/**
 * descoberta_rede.js
 * Descobre o endereço do servidor local Nitec.
 * No Electron: usa IPC direto (não faz fetch de rede).
 * No browser/PWA: usa scan de rede local.
 */

const CHAVE_STORAGE = 'nitec_servidor_local';
const PORTA_PADRAO  = 3737;

/**
 * Verifica se está rodando dentro do Electron.
 * @returns {boolean}
 */
const eh_electron = () => {
    try {
        return !!(window?.require && window.require('electron'));
    } catch {
        return false;
    }
};

/**
 * Obtém o servidor local via IPC do Electron.
 * Este método NÃO faz fetch de rede — é apenas comunicação interna.
 * @returns {Promise<string|null>}
 */
const obter_via_ipc = async () => {
    try {
        const { ipcRenderer } = window.require('electron');
        const info = await ipcRenderer.invoke('obter-servidor-local');
        if (info?.url) return info.url;
    } catch (e) {
        console.warn('[descoberta_rede] IPC falhou:', e.message);
    }
    return null;
};

/**
 * Testa ping num endereço local — só usado em PWA/browser, nunca no Electron.
 * @param {string} url
 * @returns {Promise<boolean>}
 */
const testar_ping_local = async (url) => {
    try {
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 1500);
        const resp  = await fetch(`${url}/api/ping`, { signal: ctrl.signal, cache: 'no-store' });
        clearTimeout(timer);
        const dados = await resp.json();
        return dados?.servidor === 'nitec_local';
    } catch {
        return false;
    }
};

/**
 * Obtém o IP local via RTCPeerConnection para inferir a sub-rede.
 * @returns {Promise<string[]>}
 */
const gerar_ips_sub_rede = async () => {
    const ips = [];
    try {
        const pc = new RTCPeerConnection({ iceServers: [] });
        pc.createDataChannel('');
        await pc.createOffer().then(o => pc.setLocalDescription(o));
        await new Promise(resolve => {
            const timer = setTimeout(resolve, 1000);
            pc.onicecandidate = (e) => {
                if (!e.candidate) { clearTimeout(timer); resolve(); return; }
                const match = e.candidate.candidate.match(/(\d+\.\d+\.\d+)\.\d+/);
                if (match) {
                    const prefixo = match[1];
                    for (let i = 1; i <= 254; i++) ips.push(`${prefixo}.${i}`);
                }
            };
        });
        pc.close();
    } catch {
        // Fallback: sub-redes mais comuns
        for (let i = 1; i <= 254; i++) {
            ips.push(`192.168.1.${i}`);
            ips.push(`192.168.0.${i}`);
            ips.push(`192.168.15.${i}`);
        }
    }
    return [...new Set(ips)];
};

/**
 * Descobre o servidor local Nitec na rede.
 * Prioridade: IPC Electron → cache localStorage → scan de rede (PWA)
 * @returns {Promise<string|null>}
 */
export const descobrir_servidor_local = async () => {
    // 1. Electron: IPC direto — sem fetch, sem bloqueio por falta de internet
    if (eh_electron()) {
        const url = await obter_via_ipc();
        if (url) {
            localStorage.setItem(CHAVE_STORAGE, url);
            return url;
        }
        return null;
    }

    // 2. Cache do localStorage (browser/PWA)
    const cacheado = localStorage.getItem(CHAVE_STORAGE);
    if (cacheado) {
        const ok = await testar_ping_local(cacheado);
        if (ok) return cacheado;
        localStorage.removeItem(CHAVE_STORAGE);
    }

    // 3. Scan ativo da rede local (browser/PWA sem cache)
    const ips = await gerar_ips_sub_rede();
    const GRUPO = 30;
    for (let i = 0; i < ips.length; i += GRUPO) {
        const grupo = ips.slice(i, i + GRUPO);
        const resultados = await Promise.all(
            grupo.map(async ip => {
                const url = `http://${ip}:${PORTA_PADRAO}`;
                return (await testar_ping_local(url)) ? url : null;
            })
        );
        const encontrado = resultados.find(r => r !== null);
        if (encontrado) {
            localStorage.setItem(CHAVE_STORAGE, encontrado);
            return encontrado;
        }
    }

    return null;
};

/**
 * Retorna o URL cacheado sem fazer descoberta.
 * @returns {string|null}
 */
export const obter_servidor_cacheado = () => localStorage.getItem(CHAVE_STORAGE);

/**
 * Limpa o cache do servidor local.
 */
export const limpar_cache_servidor = () => localStorage.removeItem(CHAVE_STORAGE);