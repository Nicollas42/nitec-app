<template>
    <div class="flex flex-col relative w-full mb-10">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Controle de Perdas</span>
            <button @click="$emit('alternar')" class="text-gray-500 hover:text-red-600 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm bg-white hover:bg-gray-50">
                {{ visivel ? '👁️ Ocultar Descontos' : '👁️‍🗨️ Mostrar Descontos' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative transition-all">
            <div class="p-6 bg-red-50 border-b border-red-100 flex items-center gap-2 rounded-t-3xl">
                <h2 class="text-sm font-black text-red-800 uppercase">Sangria por Descontos (Diário)</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-red-400 hover:text-red-600 bg-white border border-red-200 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Acompanhe o volume de dinheiro que está a ser "perdoado" aos clientes em formato de desconto. Picos neste gráfico exigem atenção!</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="h-64 w-full bg-white rounded-2xl">
                    <Bar v-if="dados_grafico" :data="dados_grafico" :options="opcoes_grafico" />
                    <div v-else class="h-full flex items-center justify-center text-xs text-gray-400 italic">Nenhum desconto registado neste período.</div>
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

const props = defineProps({ visivel: Boolean, dados_descontos: Array });
defineEmits(['alternar']);

const dados_grafico = computed(() => {
    if (!props.dados_descontos || props.dados_descontos.length === 0) return null;

    const etiquetas = props.dados_descontos.map(item => {
        const dataObj = new Date(item.data_venda + 'T12:00:00'); 
        return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    const valores = props.dados_descontos.map(item => Number(item.total_desconto));

    return {
        labels: etiquetas,
        datasets: [{ 
            label: 'Descontos Concedidos (R$)', 
            backgroundColor: '#ef4444', 
            borderRadius: 6,
            data: valores 
        }]
    };
});

const opcoes_grafico = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937', callbacks: { label: (ctx) => `R$ ${ctx.raw.toFixed(2)}` } } },
    scales: { x: { grid: { display: false }, border: { display: false } }, y: { beginAtZero: true, border: { display: false }, grid: { color: '#f3f4f6' } } }
};
</script>