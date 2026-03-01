import './assets/main.css';
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

// Importando o nosso roteador personalizado
import roteador_principal from './router/roteador_principal.js';

const aplicativo_vue = createApp(App);

aplicativo_vue.use(createPinia());
aplicativo_vue.use(roteador_principal);

aplicativo_vue.mount('#app');