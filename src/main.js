import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import roteador_principal from './router/roteador_principal.js';
import Swal from 'sweetalert2';

// Substitui o alert() padrão para não travar o Electron
window.alert = (mensagem) => {
    Swal.fire({
        title: 'NitecSystem',
        text: mensagem,
        icon: 'info',
        confirmButtonColor: '#2563eb'
    });
};

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
aplicativo_vue.use(pinia);
aplicativo_vue.use(roteador_principal);
aplicativo_vue.mount('#app');