import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import roteador_principal from './router/roteador_principal.js';

// --- INÍCIO DA CORREÇÃO DE FOCO DO ELECTRON ---
import Swal from 'sweetalert2';

// Substitui o alert() padrão para não travar o Electron
window.alert = (mensagem) => {
    Swal.fire({
        title: 'NitecSystem',
        text: mensagem,
        icon: 'info',
        confirmButtonColor: '#2563eb' // nitec_blue
    });
};

// Substitui o confirm() padrão
window.confirm = async (mensagem) => {
    const resultado = await Swal.fire({
        title: 'Atenção',
        text: mensagem,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#16a34a', // verde
        cancelButtonColor: '#dc2626', // vermelho
        confirmButtonText: 'Sim, continuar',
        cancelButtonText: 'Cancelar'
    });
    return resultado.isConfirmed;
};
// --- FIM DA CORREÇÃO ---

const aplicativo_vue = createApp(App);

aplicativo_vue.use(createPinia());
aplicativo_vue.use(roteador_principal);

aplicativo_vue.mount('#app');