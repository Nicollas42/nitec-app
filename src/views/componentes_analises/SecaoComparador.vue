<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Painel de Comparador de Vendas</span>
            <button @click="$emit('alternar')" class="text-[var(--text-muted)] hover:text-blue-500 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]">
                {{ visivel ? '👁️ Ocultar Comparador' : '👁️‍🗨️ Mostrar Comparador' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] flex flex-col relative transition-colors duration-300">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-[var(--border-subtle)] gap-4 bg-[var(--bg-page)] rounded-t-3xl transition-colors duration-300">
                
                <div class="flex items-center gap-2">
                    <h2 class="text-sm font-black text-[var(--text-primary)] uppercase">Guerra de Produtos</h2>
                    <div class="relative group">
                        <span class="cursor-pointer text-[var(--text-muted)] hover:text-blue-500 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                        <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                            <p>Selecione até 5 produtos diferentes na lista ao lado e cruze o desempenho deles ao longo das 24 horas para descobrir em que período vendem mais.</p>
                            <div class="absolute top-full left-4 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                    </div>
                </div>

                <div class="relative w-full md:w-72" ref="containerMenu">
                    <button @click="menu_aberto = !menu_aberto" class="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-black uppercase tracking-widest rounded-xl p-3 outline-none text-nitec_blue shadow-sm flex justify-between items-center hover:border-nitec_blue transition-colors">
                        <span>📊 Comparar ({{ (produtosSelecionados || []).length }}/5)</span>
                        <span class="text-[var(--text-muted)] transition-transform duration-300" :class="menu_aberto ? 'rotate-180' : ''">▼</span>
                    </button>
                    
                    <div v-if="menu_aberto" class="absolute right-0 top-full mt-2 w-full md:w-80 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl shadow-2xl z-[200] max-h-64 overflow-y-auto custom-scrollbar p-2 transition-colors duration-300">
                        <label v-for="p in produtos_disponiveis" :key="p.produto_id" class="flex items-center gap-3 p-3 hover:bg-[var(--bg-card-hover)] rounded-xl cursor-pointer transition-colors border-b border-[var(--border-subtle)] last:border-0 group">
                            <input type="checkbox" :value="p.produto_id" v-model="selecionados_locais" :disabled="selecionados_locais.length >= 5 && !selecionados_locais.includes(p.produto_id)" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[var(--bg-page)] border-[var(--border-subtle)]">
                            <span class="text-xs font-bold text-[var(--text-primary)] group-hover:text-blue-500">{{ p.nome_produto }}</span>
                        </label>
                        <div v-if="!produtos_disponiveis || produtos_disponiveis.length === 0" class="p-3 text-xs text-[var(--text-muted)] text-center italic">Nenhum produto para comparar.</div>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="h-72 w-full bg-[var(--bg-page)] rounded-2xl p-4 shadow-inner border border-[var(--border-subtle)] transition-colors duration-300">
                    <Line v-if="dados_grafico" :data="dados_grafico" :options="opcoes_grafico" />
                    <div v-else class="h-full flex items-center justify-center text-xs text-[var(--text-muted)] font-medium italic">Selecione ao menos um produto no menu acima para gerar o gráfico.</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement);

const props = defineProps({
    visivel: Boolean, dados_por_hora: Array, produtos_disponiveis: Array,
    produtosSelecionados: { type: Array, default: () => [] } 
});

const emit = defineEmits(['alternar', 'update:produtosSelecionados']);

const menu_aberto = ref(false);
const selecionados_locais = ref(props.produtosSelecionados ? [...props.produtosSelecionados] : []);

// 🟢 CORREÇÃO: "deep: true" adicionado para o Vue entender quando a checkbox muda o array!
watch(selecionados_locais, (novo) => {
    emit('update:produtosSelecionados', [...novo]);
}, { deep: true });

watch(() => props.produtosSelecionados, (novo) => {
    if (JSON.stringify(novo) !== JSON.stringify(selecionados_locais.value)) {
        selecionados_locais.value = novo ? [...novo] : [];
    }
}, { deep: true });

const containerMenu = ref(null);
const fecharMenu = (e) => { if (containerMenu.value && !containerMenu.value.contains(e.target)) menu_aberto.value = false; };
onMounted(() => document.addEventListener('click', fecharMenu));
onUnmounted(() => document.removeEventListener('click', fecharMenu));

const paleta = ['#2563eb', '#f97316', '#10b981', '#9333ea', '#ef4444'];

const dados_grafico = computed(() => {
    if (!props.dados_por_hora || selecionados_locais.value.length === 0) return null;
    const etiquetas = Array.from({ length: 24 }, (_, i) => `${i}h`);

    const datasets = selecionados_locais.value.map((id_produto, index) => {
        const nome = props.produtos_disponiveis.find(p => p.produto_id === id_produto)?.nome_produto || 'Produto';
        const dados = Array(24).fill(0);
        
        props.dados_por_hora.forEach(item => {
            if (item.produto_id === id_produto) dados[item.hora] = Number(item.quantidade);
        });

        return {
            label: nome,
            borderColor: paleta[index % paleta.length],
            backgroundColor: paleta[index % paleta.length],
            tension: 0.4,
            data: dados
        };
    });

    return { labels: etiquetas, datasets };
});

const opcoes_grafico = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } } }, scales: { y: { beginAtZero: true, border: { display: false } }, x: { grid: { display: false } } } };
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>