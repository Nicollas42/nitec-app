import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';
import roteador_principal from './router/roteador_principal.js';
import Swal from 'sweetalert2';
import { useToastStore } from './stores/toast_store.js';

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

// Substitui o alert() pelo toast do sistema (auto-dismissível, sem precisar clicar)
// Colocado após use(pinia) para garantir que a store esteja acessível
window.alert = (mensagem) => {
    const tipo = /erro|falha|inválid|não foi|acesso negado/i.test(mensagem) ? 'erro' : 'sucesso';
    useToastStore().exibir_toast(mensagem, tipo);
};