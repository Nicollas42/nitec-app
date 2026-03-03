// C:\PDP\NITEC_APP\src\servicos\api_cliente.js
import axios from 'axios';

/**
 * Monta a URL da API baseado no ambiente e no código do lojista.
 */
export const configurar_url_base = (codigo_loja = null) => {
    const hostname = window.location.hostname;
    const eh_desenvolvimento = import.meta.env.DEV || 
                               hostname.endsWith('.localhost') ||
                               hostname === 'localhost' ||
                               hostname === ''; 

    let dominio_final = '';

    if (!codigo_loja || codigo_loja.toLowerCase() === 'master') {
        dominio_final = eh_desenvolvimento ? 'nitec.localhost:8000' : 'nitec.dev.br';
    } else {
        // CORREÇÃO: Garante o sufixo .nitec.localhost para o Windows resolver o DNS
        const sufixo = eh_desenvolvimento ? '.nitec.localhost:8000' : '.nitec.dev.br';
        dominio_final = codigo_loja + sufixo;
    }

    const protocolo = eh_desenvolvimento ? 'http' : 'https';
    return `${protocolo}://${dominio_final}/api`;
};

// Inicia com a loja salva, ou aponta para a central
const api_cliente = axios.create({
    baseURL: configurar_url_base(localStorage.getItem('nitec_tenant_id')),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

api_cliente.interceptors.request.use((config) => {
    const token = localStorage.getItem('nitec_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api_cliente;