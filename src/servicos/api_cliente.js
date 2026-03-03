import axios from 'axios';

/**
 * Define a URL base dinamicamente garantindo que o deploy na VPS nunca quebre.
 * @return {string}
 */
const obter_url_base = () => {
    const api_salva = localStorage.getItem('nitec_api_tenant');
    if (api_salva) return api_salva;

    const hostname_atual = window.location.hostname;
    
    // Detecta se é desenvolvimento (Browser com .localhost, Vite IP, ou Electron puro)
    const eh_desenvolvimento = import.meta.env.DEV || 
                               hostname_atual === 'localhost' || 
                               hostname_atual === '127.0.0.1' ||
                               hostname_atual.endsWith('.localhost');

    if (eh_desenvolvimento) {
        // Se estiver rodando como file:// no Electron sem hostname, força localhost
        const host_api = hostname_atual === '' ? 'localhost' : hostname_atual;
        return `http://${host_api}:8000/api`;
    }

    // Se o código cair aqui, significa que está rodando na VPS compilado.
    return 'https://nitec.dev.br/api';
};

const api_cliente = axios.create({
    baseURL: obter_url_base(),
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