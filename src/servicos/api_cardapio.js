import axios from 'axios';
import { configurar_url_base } from './api_cliente.js';

const protocolo = window.location.protocol;
const host = window.location.hostname;
const porta = window.location.port ? `:${window.location.port}` : '';
const base_url = `${protocolo}//${host}${porta}/api`;

const api_cardapio = axios.create({
    baseURL: base_url,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    },
    timeout: 10000,
});

api_cardapio.interceptors.response.use((response) => {
    if (typeof response.data === 'string' && response.data.includes('<html')) {
        return Promise.reject(new Error('A API do cardapio devolveu HTML em vez de JSON.'));
    }

    return response;
});

const host_atual_eh_tenant_nitec = () => {
    const hostname = window.location.hostname || '';
    return (
        hostname === 'nitec.localhost'
        || hostname.endsWith('.nitec.localhost')
        || hostname === 'nitec.dev.br'
        || hostname.endsWith('.nitec.dev.br')
    );
};

export const obter_base_publica_cardapio = (tenant_id = localStorage.getItem('nitec_tenant_id')) => {
    if (/^https?:$/.test(window.location.protocol) && host_atual_eh_tenant_nitec()) {
        return `${window.location.protocol}//${window.location.host}`;
    }

    return configurar_url_base(tenant_id).replace(/\/api$/, '');
};

export const obter_url_publica_cardapio_mesa = (mesa_id, tenant_id = localStorage.getItem('nitec_tenant_id')) => {
    return `${obter_base_publica_cardapio(tenant_id)}/#/cardapio/mesa/${mesa_id}`;
};

export default api_cardapio;
