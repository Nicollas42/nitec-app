import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useTemaStore = defineStore('tema', () => {
    // Inicializa a partir do localStorage ou prefere o tema do sistema
    const modo_escuro = ref(
        localStorage.getItem('nitec_modo_escuro') === 'true' || 
        (!localStorage.getItem('nitec_modo_escuro') && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );

    const aplicar_tema = () => {
        if (modo_escuro.value) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        // Atualiza a meta tag de cor do browser para mobile
        const metaThemeColor = document.querySelector("meta[name=theme-color]");
        if (metaThemeColor) {
            metaThemeColor.setAttribute("content", modo_escuro.value ? '#0f1117' : '#f8f9fa');
        }
    };

    const alternar_tema = () => {
        modo_escuro.value = !modo_escuro.value;
        localStorage.setItem('nitec_modo_escuro', modo_escuro.value);
        aplicar_tema();
    };

    // Aplica inicialmente
    aplicar_tema();

    return { modo_escuro, alternar_tema, aplicar_tema };
});
