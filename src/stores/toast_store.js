import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useToastStore = defineStore('toast_store', () => {
    const visivel = ref(false);
    const mensagem = ref('');
    const tipo = ref('sucesso'); // pode ser 'sucesso' ou 'erro'

    const exibir_toast = (msg, t = 'sucesso') => {
        mensagem.value = msg;
        tipo.value = t;
        visivel.value = true;
        
        // Esconde automaticamente após 3 segundos
        setTimeout(() => {
            visivel.value = false;
        }, 3000);
    };

    return { visivel, mensagem, tipo, exibir_toast };
});