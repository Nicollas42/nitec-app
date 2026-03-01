import axios from 'axios';

/**
 * Instância configurada do Axios para comunicação com a API Laravel.
 * * @type {import('axios').AxiosInstance}
 */
const api_cliente = axios.create({
    baseURL: 'http://localhost:8000/api', // URL base do seu servidor Laravel
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

/**
 * Intercetor para injetar o Token de Acesso em todas as requisições automaticamente.
 */
api_cliente.interceptors.request.use((configuracao) => {
    const token_salvo = localStorage.getItem('nitec_token');
    if (token_salvo) {
        configuracao.headers.Authorization = `Bearer ${token_salvo}`;
    }
    return configuracao;
});

export default api_cliente;