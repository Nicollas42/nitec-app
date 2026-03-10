<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Painel de Comparador de Vendas</span>
            <button @click="$emit('alternar')" class="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm bg-white hover:bg-gray-50">
                {{ visivel ? '👁️ Ocultar Comparador' : '👁️‍🗨️ Mostrar Comparador' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100 gap-4 bg-gray-50 rounded-t-3xl">
                <div class="flex items-center gap-2">
                    <div>
                        <h2 class="text-lg font-black text-gray-800 uppercase tracking-tight">Guerra de Produtos</h2>
                        <p class="text-xs text-gray-500">Selecione vários produtos e cruze o desempenho ao longo das 24h.</p>
                    </div>
                </div>

                <div class="relative w-full md:w-72" ref="containerMenu">
                    <button @click="menu_aberto = !menu_aberto" class="w-full bg-white border border-gray-200 text-xs font-black uppercase tracking-widest rounded-xl p-3 outline-none text-nitec_blue shadow-sm flex justify-between items-center hover:border-nitec_blue transition-colors">
                        <span>📊 Comparar ({{ (produtosSelecionados || []).length }}/5)</span>
                        <span class="text-gray-400" :class="menu_aberto ? 'rotate-180' : ''">▼</span>
                    </button>
                    
                    <div v-if="menu_aberto" class="absolute right-0 top-full mt-2 w-full md:w-80 bg-white border border-gray-200 rounded-2xl shadow-2xl z-[200] max-h-64 overflow-y-auto custom-scrollbar p-2">
                        <label v-for="p in produtos_disponiveis" :key="p.produto_id" class="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl cursor-pointer transition-colors border-b border-gray-50 last:border-0 group">
                            <input type="checkbox" :value="p.produto_id" v-model="selecionados_locais" :disabled="selecionados_locais.length >= 5 && !selecionados_locais.includes(p.produto_id)" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500">
                            <span class="text-xs font-bold text-gray-700 group-hover:text-blue-700">{{ p.nome_produto }}</span>
                        </label>
                        <div v-if="!produtos_disponiveis || produtos_disponiveis.length === 0" class="p-3 text-xs text-gray-400 text-center italic">Nenhum produto para comparar.</div>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="h-72 w-full bg-gray-50 rounded-2xl p-4 shadow-inner border border-gray-100">
                    <Line v-if="dados_grafico" :data="dados_grafico" :options="opcoes_grafico" />
                    <div v-else class="h-full flex items-center justify-center text-xs text-gray-400 font-medium italic">Selecione ao menos um produto no menu acima para gerar o gráfico.</div>
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
    // 🟢 Proteção nativa do Vue para evitar 'undefined'
    produtosSelecionados: { type: Array, default: () => [] } 
});

const emit = defineEmits(['alternar', 'update:produtosSelecionados']);

const menu_aberto = ref(false);
const selecionados_locais = ref(props.produtosSelecionados ? [...props.produtosSelecionados] : []);

watch(selecionados_locais, (novo) => emit('update:produtosSelecionados', novo));
watch(() => props.produtosSelecionados, (novo) => selecionados_locais.value = novo ? [...novo] : []);

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