<template>
    <div class="flex flex-col relative w-full mb-10">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Saúde Financeira</span>
            <button @click="$emit('alternar')" class="text-[var(--text-muted)] hover:text-blue-500 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]">
                {{ visivel ? '👁️ Ocultar Gráfico' : '👁️‍🗨️ Mostrar Gráfico' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] flex flex-col relative transition-all duration-300">
            <div class="p-6 bg-[var(--bg-card)] border-b border-[var(--border-subtle)] flex items-center gap-2 rounded-t-3xl transition-colors duration-300">
                <h2 class="text-sm font-black text-[var(--text-primary)] uppercase">Evolução de Faturamento</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-[var(--text-muted)] hover:text-blue-500 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Acompanhe se as suas vendas estão a crescer ou a cair ao longo do período selecionado. Picos representam os melhores dias.</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div class="h-72 w-full bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] p-2 transition-colors duration-300">
                    <Line v-if="dados_grafico" :data="dados_grafico" :options="opcoes_grafico" />
                    <div v-else class="h-full flex items-center justify-center text-xs text-[var(--text-muted)] italic">Sem dados suficientes para gerar a curva.</div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Line } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement, Filler } from 'chart.js';

// 🟢 Importante registrar o Filler para fazer o efeito de gradiente/área
ChartJS.register(Title, Tooltip, Legend, CategoryScale, LinearScale, LineElement, PointElement, Filler);

const props = defineProps({ visivel: Boolean, dados_cronologicos: Array });
defineEmits(['alternar']);

const dados_grafico = computed(() => {
    if (!props.dados_cronologicos || props.dados_cronologicos.length === 0) return null;

    const etiquetas = props.dados_cronologicos.map(item => {
        const dataObj = new Date(item.data_venda + 'T12:00:00'); // Evita bugs de fuso horário
        return dataObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    });

    const valores = props.dados_cronologicos.map(item => Number(item.faturamento_diario));

    return {
        labels: etiquetas,
        datasets: [{ 
            label: 'Faturamento Diário', 
            borderColor: '#8b5cf6', // Roxo nitec
            backgroundColor: 'rgba(139, 92, 246, 0.15)', // Roxo transparente
            fill: true,
            tension: 0.4, // Deixa a linha suave e arredondada
            pointBackgroundColor: '#ffffff',
            pointBorderColor: '#8b5cf6',
            pointBorderWidth: 2,
            pointRadius: 4,
            data: valores 
        }]
    };
});

const opcoes_grafico = {
    responsive: true, maintainAspectRatio: false,
    plugins: { 
        legend: { display: false }, 
        tooltip: { 
            backgroundColor: '#1f2937', 
            callbacks: { label: (ctx) => `R$ ${ctx.raw.toFixed(2)}` } 
        } 
    },
    scales: { 
        x: { grid: { display: false }, border: { display: false } }, 
        y: { beginAtZero: true, border: { display: false }, grid: { color: '#f3f4f6' } } 
    }
};
</script>