<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Painel de Comparador de Vendas</span>
            <button @click="$emit('alternar')" class="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm bg-white hover:bg-gray-50">
                {{ visivel ? '👁️ Ocultar ABC' : '👁️‍🗨️ Mostrar ABC' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center p-6 border-b border-gray-100 gap-4 bg-gray-50 rounded-t-3xl">
                <div class="flex items-center gap-2">
                    <div>
                        <h2 class="text-lg font-black text-gray-800 uppercase tracking-tight">Comparador de Vendas</h2>
                        <p class="text-xs text-gray-500">Cruze o desempenho ao longo das 24h.</p>
                    </div>
                    <div class="relative group ml-2">
                        <span class="cursor-pointer text-gray-400 hover:text-blue-500 bg-white border border-gray-200 rounded-full h-6 w-6 flex items-center justify-center font-bold text-xs shadow-sm">ℹ️</span>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-72 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                            <p><strong class="text-blue-300">Dica:</strong> Pesquise e selecione dois produtos. O gráfico revela qual horário exato cada prato tem o seu pico de saída.</p>
                            <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-200 shadow-sm w-full md:w-auto">
                    <SelectPesquisavel :opcoes="produtos_disponiveis" v-model="p1" placeholder="Produto 1..." />
                    <span class="text-[10px] font-black text-gray-400 uppercase">VS</span>
                    <SelectPesquisavel :opcoes="produtos_disponiveis" v-model="p2" placeholder="Produto 2..." />
                </div>
            </div>

            <div class="p-6">
                <div class="h-72 w-full bg-gray-50 rounded-2xl p-4 shadow-inner border border-gray-100">
                    <Line v-if="dados_grafico" :data="dados_grafico" :options="opcoes_grafico" />
                    <div v-else class="h-full flex items-center justify-center text-xs text-gray-400 italic">Selecione dois produtos para comparar o histórico.</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import SelectPesquisavel from './SelectPesquisavel.vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement);

const props = defineProps({
    visivel: Boolean, dados_por_hora: Array, produtos_disponiveis: Array,
    produto1: [String, Number], produto2: [String, Number]
});

const emit = defineEmits(['alternar', 'update:produto1', 'update:produto2']);

const p1 = computed({ get: () => props.produto1, set: (v) => emit('update:produto1', v) });
const p2 = computed({ get: () => props.produto2, set: (v) => emit('update:produto2', v) });

const dados_grafico = computed(() => {
    if (!props.dados_por_hora || !p1.value || !p2.value) return null;
    const nome_p1 = props.produtos_disponiveis.find(p => p.produto_id === p1.value)?.nome_produto || 'Prod 1';
    const nome_p2 = props.produtos_disponiveis.find(p => p.produto_id === p2.value)?.nome_produto || 'Prod 2';

    const etiquetas = Array.from({ length: 24 }, (_, i) => `${i}h`);
    const d1 = Array(24).fill(0);
    const d2 = Array(24).fill(0);

    props.dados_por_hora.forEach(item => {
        if (item.produto_id === p1.value) d1[item.hora] = Number(item.quantidade);
        if (item.produto_id === p2.value) d2[item.hora] = Number(item.quantidade);
    });

    return {
        labels: etiquetas,
        datasets: [
            { label: nome_p1, borderColor: '#2563eb', backgroundColor: '#2563eb', tension: 0.4, data: d1 },
            { label: nome_p2, borderColor: '#9333ea', backgroundColor: '#9333ea', tension: 0.4, data: d2 }
        ]
    };
});

const opcoes_grafico = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { position: 'top', labels: { usePointStyle: true, boxWidth: 8, font: { weight: 'bold' } } } },
    scales: { y: { beginAtZero: true, border: { display: false } }, x: { grid: { display: false } } }
};
</script>