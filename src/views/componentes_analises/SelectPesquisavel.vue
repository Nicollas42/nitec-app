<template>
    <div class="relative w-full md:w-48" ref="container">
        <input 
            type="text" 
            v-model="termo_pesquisa" 
            @focus="ao_focar"
            :placeholder="placeholder"
            class="w-full bg-white border border-gray-200 text-xs font-bold rounded-lg p-2.5 outline-none text-gray-700 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-text"
        />
        
        <div v-if="aberto" class="absolute z-[100] mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-48 overflow-y-auto">
            <div 
                v-for="op in opcoes_filtradas" :key="op.produto_id" 
                @mousedown.prevent="selecionar(op)"
                class="p-3 text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
            >
                {{ op.nome_produto }}
            </div>
            <div v-if="opcoes_filtradas.length === 0" class="p-3 text-xs text-gray-400 italic text-center">
                Nenhum produto encontrado.
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    opcoes: { type: Array, required: true },
    modelValue: { type: [String, Number], default: '' },
    placeholder: { type: String, default: 'Pesquisar produto...' }
});

const emit = defineEmits(['update:modelValue']);

const aberto = ref(false);
const termo_pesquisa = ref('');
const container = ref(null);

watch(() => props.modelValue, (novo_valor) => {
    // 🟢 Regra adicionada: Se o modelValue for limpo por fora, limpa o texto também
    if (!novo_valor) {
        termo_pesquisa.value = '';
        return;
    }
    const selecionado = props.opcoes.find(op => op.produto_id === novo_valor);
    if (selecionado && !aberto.value) {
        termo_pesquisa.value = selecionado.nome_produto;
    }
}, { immediate: true });

const ao_focar = () => {
    aberto.value = true;
    termo_pesquisa.value = ''; 
};

const selecionar = (opcao) => {
    termo_pesquisa.value = opcao.nome_produto;
    emit('update:modelValue', opcao.produto_id);
    aberto.value = false;
};

const opcoes_filtradas = computed(() => {
    if (!termo_pesquisa.value) return props.opcoes;
    return props.opcoes.filter(op => 
        op.nome_produto.toLowerCase().includes(termo_pesquisa.value.toLowerCase())
    );
});

const clicar_fora = (e) => {
    if (container.value && !container.value.contains(e.target)) {
        aberto.value = false;
        const selecionado = props.opcoes.find(op => op.produto_id === props.modelValue);
        if (selecionado) termo_pesquisa.value = selecionado.nome_produto;
        else termo_pesquisa.value = '';
    }
};

onMounted(() => document.addEventListener('click', clicar_fora));
onUnmounted(() => document.removeEventListener('click', clicar_fora));
</script>