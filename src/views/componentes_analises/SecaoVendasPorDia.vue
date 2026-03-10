<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Comportamento</span>
            <button @click="$emit('alternar')" class="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm bg-white hover:bg-gray-50">
                {{ visivel ? '👁️ Ocultar Dias' : '👁️‍🗨️ Mostrar Dias' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative transition-all">
            <div class="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-2 rounded-t-3xl">
                <h2 class="text-sm font-black text-gray-800 uppercase">Faturamento por Dia da Semana</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-gray-400 hover:text-blue-500 bg-white border border-gray-200 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Analise a força de vendas de cada dia da semana. Essencial para planeamento de stock e definição de escalas de funcionários para os dias de pico.</p>
                        <div class="absolute top-full left-4 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="h-64 w-full bg-white rounded-2xl p-2">
                    <Bar v-if="dados_grafico" :data="dados_grafico" :options="opcoes_grafico" />
                    <div v-else class="h-full flex items-center justify-center text-xs text-gray-400 italic">Sem dados suficientes.</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({ visivel: Boolean, dados_dias: Array });
defineEmits(['alternar']);

const dados_grafico = computed(() => {
    if (!props.dados_dias) return null;
    const nomes_dias = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const valores = Array(7).fill(0);

    props.dados_dias.forEach(item => {
        valores[item.dia_semana - 1] = Number(item.faturamento_total);
    });

    return {
        labels: nomes_dias,
        datasets: [{ label: 'Faturamento (R$)', backgroundColor: '#10b981', borderRadius: 6, data: valores }]
    };
});

const opcoes_grafico = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', callbacks: { label: (ctx) => `R$ ${ctx.raw.toFixed(2)}` } } }, scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, grid: { color: '#f3f4f6' }, border: { display: false } } } };
</script>