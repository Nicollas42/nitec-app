import axios from 'axios';

export const configurar_url_base = (codigo_loja = null) => {
    // Agora confiamos APENAS no empacotador do Vite.
    // npm run dev = true | npm run electron:build = false
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

const api_cliente = axios.create({
    baseURL: configurar_url_base(localStorage.getItem('nitec_tenant_id')),
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// INTERCEPTOR DE REQUISIÇÃO (Ida)
api_cliente.interceptors.request.use((config) => {
    const token = localStorage.getItem('nitec_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    config.headers['Accept'] = 'application/json';
    
    const loja_atual = localStorage.getItem('nitec_tenant_id') || 'master';
    config.baseURL = configurar_url_base(loja_atual);
    
    return config;
});

// NOVIDADE: INTERCEPTOR DE RESPOSTA (Volta) - O ESCUDO ANTI-HTML!
api_cliente.interceptors.response.use((response) => {
    // Se o Laravel tentar enganar o Vue mandando HTML com Status 200, nós bloqueamos!
    if (typeof response.data === 'string' && response.data.includes('<html')) {
        console.error("Recebido HTML em vez de JSON:", response.data);
        return Promise.reject(new Error("Erro de Rota: O Laravel devolveu uma página HTML. Rota não encontrada."));
    }
    return response;
}, (error) => {
    return Promise.reject(error);
});

export default api_cliente;