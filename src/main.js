import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import roteador_principal from './router/roteador_principal.js';
import Swal from 'sweetalert2';
import { useToastStore } from './stores/toast_store.js';

const debug_runtime_ativo = () => {
    try {
        const parametros = new URLSearchParams(window.location.search);
        return parametros.has('debug') || localStorage.getItem('nitec_debug_runtime') === '1';
    } catch {
        return false;
    }
};

const extrair_mensagem_erro = (erro) => {
    if (!erro) return 'Erro desconhecido.';
    if (erro instanceof Error) return erro.stack || erro.message;
    if (typeof erro === 'object') {
        try {
            return JSON.stringify(erro, null, 2);
        } catch {
            return String(erro);
        }
    }
    return String(erro);
};

const exibir_overlay_debug = (origem, erro) => {
    console.error(`[Nitec Debug] ${origem}`, erro);

    if (!debug_runtime_ativo()) return;

    let painel = document.getElementById('nitec-runtime-debug');
    if (!painel) {
        painel = document.createElement('div');
        painel.id = 'nitec-runtime-debug';
        painel.style.cssText = [
            'position:fixed',
            'top:12px',
            'left:12px',
            'right:12px',
            'z-index:999999',
            'max-height:45vh',
            'overflow:auto',
            'padding:14px 16px',
            'border-radius:16px',
            'background:#111827',
            'color:#f8fafc',
            'border:1px solid #334155',
            'box-shadow:0 20px 40px rgba(15,23,42,.35)',
            'font:12px/1.45 monospace',
            'white-space:pre-wrap',
            'word-break:break-word',
        ].join(';');
        document.body.appendChild(painel);
    }

    painel.textContent = [
        '[DEBUG RUNTIME]',
        `Origem: ${origem}`,
        `URL: ${window.location.href}`,
        `Hora: ${new Date().toISOString()}`,
        '',
        extrair_mensagem_erro(erro),
    ].join('\n');
};

window.addEventListener('error', (evento) => {
    exibir_overlay_debug(
        `window.error${evento.filename ? ` @ ${evento.filename}:${evento.lineno}:${evento.colno}` : ''}`,
        evento.error || evento.message
    );
});

window.addEventListener('unhandledrejection', (evento) => {
    exibir_overlay_debug('unhandledrejection', evento.reason);
});

// Substitui o confirm() padrão
window.confirm = async (mensagem) => {
    const resultado = await Swal.fire({
        title: 'Atenção',
        text: mensagem,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#16a34a',
        cancelButtonColor: '#dc2626',
        confirmButtonText: 'Sim, continuar',
        cancelButtonText: 'Cancelar'
    });
    return resultado.isConfirmed;
};

const pinia = createPinia();

// 🟢 Plugin de persistência — stores sobrevivem a recarregamentos e troca de abas
pinia.use(piniaPluginPersistedstate);

const aplicativo_vue = createApp(App);
aplicativo_vue.config.errorHandler = (erro, _instancia, info) => {
    exibir_overlay_debug(`vue.errorHandler (${info || 'sem contexto'})`, erro);
};
aplicativo_vue.use(pinia);
aplicativo_vue.use(roteador_principal);
aplicativo_vue.mount('#app');

// Substitui o alert() pelo toast do sistema (auto-dismissível, sem precisar clicar)
// Colocado após use(pinia) para garantir que a store esteja acessível
window.alert = (mensagem) => {
    const tipo = /erro|falha|inválid|não foi|acesso negado/i.test(mensagem) ? 'erro' : 'sucesso';
    useToastStore().exibir_toast(mensagem, tipo);
};
