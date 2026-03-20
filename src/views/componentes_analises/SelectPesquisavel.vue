<template>
    <div class="relative w-full" ref="container">
        <input 
            type="text" 
            v-model="termo_pesquisa" 
            @focus="ao_focar"
            :placeholder="placeholder"
            class="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-bold rounded-lg p-2.5 outline-none text-[var(--text-primary)] shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-text placeholder-[var(--text-muted)]"
        />
        
        <div v-if="aberto" class="absolute z-[100] mt-1 w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar transition-colors duration-300">
            <div 
                v-for="op in opcoes_filtradas" :key="obter_valor(op)" 
                @mousedown.prevent="selecionar(op)"
                class="p-3 text-xs font-bold text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] hover:text-blue-500 cursor-pointer border-b border-[var(--border-subtle)] last:border-0 transition-colors"
            >
                {{ obter_rotulo(op) }}
            </div>
            <div v-if="opcoes_filtradas.length === 0" class="p-3 text-xs text-[var(--text-muted)] italic text-center">
                {{ texto_vazio }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    opcoes: { type: Array, required: true },
    modelValue: { type: [String, Number], default: '' },
    placeholder: { type: String, default: 'Pesquisar produto...' },
    chave_valor: { type: String, default: 'produto_id' },
    chave_rotulo: { type: String, default: 'nome_produto' },
    texto_vazio: { type: String, default: 'Nenhum item encontrado.' },
});
const emit = defineEmits(['update:modelValue']);

const aberto = ref(false);
const termo_pesquisa = ref('');
const container = ref(null);

/**
 * Retorna o valor interno da opcao pesquisavel.
 *
 * @param {Record<string, any>} opcao
 * @returns {string|number}
 */
const obter_valor = (opcao) => opcao?.[props.chave_valor];

/**
 * Retorna o rotulo visivel da opcao pesquisavel.
 *
 * @param {Record<string, any>} opcao
 * @returns {string}
 */
const obter_rotulo = (opcao) => String(opcao?.[props.chave_rotulo] || '');

watch(() => props.modelValue, (novo_valor) => {
    if (!novo_valor) { termo_pesquisa.value = ''; return; }
    const selecionado = props.opcoes.find(op => obter_valor(op) === novo_valor);
    if (selecionado && !aberto.value) { termo_pesquisa.value = obter_rotulo(selecionado); }
}, { immediate: true });

const ao_focar = () => { aberto.value = true; termo_pesquisa.value = ''; };

const selecionar = (opcao) => {
    termo_pesquisa.value = obter_rotulo(opcao);
    emit('update:modelValue', obter_valor(opcao));
    aberto.value = false;
};

const opcoes_filtradas = computed(() => {
    if (!termo_pesquisa.value) return props.opcoes;
    return props.opcoes.filter(op => obter_rotulo(op).toLowerCase().includes(termo_pesquisa.value.toLowerCase()));
});

const clicar_fora = (e) => {
    if (container.value && !container.value.contains(e.target)) {
        aberto.value = false;
        const selecionado = props.opcoes.find(op => obter_valor(op) === props.modelValue);
        if (selecionado) termo_pesquisa.value = obter_rotulo(selecionado);
        else termo_pesquisa.value = '';
    }
};

// Usa mousedown em vez de click para que o @click.stop nos cards pai
// não impeça o fechamento do dropdown ao clicar fora.
onMounted(() => document.addEventListener('mousedown', clicar_fora));
onUnmounted(() => document.removeEventListener('mousedown', clicar_fora));
</script>