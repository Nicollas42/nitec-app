import axios from 'axios';

// Verifica se existe uma API de tenant ativa, senão usa a central
const url_base = localStorage.getItem('nitec_api_tenant') || 'https://nitec.dev.br/api';

const api_cliente = axios.create({
    baseURL: url_base,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Interceptor para injetar o token dinâmico
api_cliente.interceptors.request.use((config) => {
    const token = localStorage.getItem('nitec_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api_cliente;