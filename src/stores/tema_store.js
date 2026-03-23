import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

const TEMAS = [
    { id: 'claro',      nome: 'Claro',      icone: '☀️',  escuro: false },
    { id: 'nevoa',      nome: 'Névoa',      icone: '🌤️', escuro: false },
    { id: 'ardosia',    nome: 'Ardósia',    icone: '🌙',  escuro: true  },
    { id: 'crepusculo', nome: 'Crepúsculo', icone: '🌆',  escuro: true  },
    { id: 'noite',      nome: 'Noite',      icone: '🌑',  escuro: true  },
];

export const useTemaStore = defineStore('tema', () => {
    const tema_atual = ref(localStorage.getItem('nitec_tema') || 'claro');

    const tema_info = computed(() => TEMAS.find(t => t.id === tema_atual.value) || TEMAS[0]);
    const modo_escuro = computed(() => tema_info.value.escuro);

    const aplicar_tema = () => {
        const html = document.documentElement;

        // Remove todos os atributos/classes de tema anteriores
        html.removeAttribute('data-tema');
        html.classList.remove('dark');

        if (tema_atual.value === 'noite') {
            html.classList.add('dark');
        } else if (tema_atual.value !== 'claro') {
            html.setAttribute('data-tema', tema_atual.value);
            // Adiciona .dark para Tailwind compat nos temas escuros
            if (tema_info.value.escuro) html.classList.add('dark');
        }

        const metaThemeColor = document.querySelector('meta[name=theme-color]');
        if (metaThemeColor) {
            metaThemeColor.setAttribute('content', modo_escuro.value ? '#1e2230' : '#f8f9fa');
        }
    };

    const selecionar_tema = (id) => {
        tema_atual.value = id;
        localStorage.setItem('nitec_tema', id);
        aplicar_tema();
    };

    // Compatibilidade com código antigo que chama alternar_tema()
    const alternar_tema = () => {
        const idx = TEMAS.findIndex(t => t.id === tema_atual.value);
        selecionar_tema(TEMAS[(idx + 1) % TEMAS.length].id);
    };

    aplicar_tema();

    return { tema_atual, tema_info, modo_escuro, temas: TEMAS, selecionar_tema, alternar_tema, aplicar_tema };
});
