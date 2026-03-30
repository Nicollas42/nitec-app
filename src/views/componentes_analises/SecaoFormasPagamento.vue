<template>
    <div class="flex flex-col relative w-full mb-10">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Meios de Pagamento</span>
            <button @click="$emit('alternar')" class="text-[var(--text-muted)] hover:text-nitec_blue font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]">
                {{ visivel ? '👁️ Ocultar' : '👁️‍🗨️ Mostrar' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] flex flex-col relative transition-all duration-300">
            <!-- Header -->
            <div class="p-6 border-b border-[var(--border-subtle)] flex items-center gap-2 rounded-t-3xl transition-colors duration-300">
                <h2 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">💳 Distribuição por Forma de Pagamento</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-[var(--text-muted)] hover:text-nitec_blue bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Veja como o faturamento se divide entre os meios de pagamento utilizados no período selecionado.</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="p-6">
                <div v-if="!dados_formas || dados_formas.length === 0" class="h-40 flex items-center justify-center text-xs text-[var(--text-muted)] italic">
                    Nenhum pagamento registrado com forma de pagamento neste período.
                </div>

                <div v-else class="flex flex-col lg:flex-row gap-8 items-center">
                    <!-- Gráfico Doughnut -->
                    <div class="w-56 h-56 flex-shrink-0 relative">
                        <Doughnut :data="dados_grafico" :options="opcoes_grafico" />
                    </div>

                    <!-- Tabela lateral -->
                    <div class="flex-1 w-full">
                        <table class="w-full text-xs">
                            <thead>
                                <tr class="text-[var(--text-muted)] border-b border-[var(--border-subtle)]">
                                    <th class="py-2 text-left font-black uppercase tracking-widest text-[9px]">Método</th>
                                    <th class="py-2 text-right font-black uppercase tracking-widest text-[9px]">Comandas</th>
                                    <th class="py-2 text-right font-black uppercase tracking-widest text-[9px]">Faturamento</th>
                                    <th class="py-2 text-right font-black uppercase tracking-widest text-[9px]">% do Total</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-[var(--border-subtle)]">
                                <tr v-for="item in dados_formas" :key="item.forma_pagamento" class="hover:bg-[var(--bg-card-hover)] transition-colors">
                                    <td class="py-3 font-black text-[var(--text-primary)] flex items-center gap-2">
                                        <span class="text-base">{{ emoji_por_metodo[item.forma_pagamento] || '💵' }}</span>
                                        <span>{{ label_por_metodo[item.forma_pagamento] || item.forma_pagamento }}</span>
                                    </td>
                                    <td class="py-3 text-right font-bold text-[var(--text-muted)]">{{ item.total_comandas }}</td>
                                    <td class="py-3 text-right font-black text-green-500">R$ {{ Number(item.faturamento_total).toFixed(2) }}</td>
                                    <td class="py-3 text-right">
                                        <div class="flex items-center justify-end gap-2">
                                            <div class="w-20 bg-[var(--bg-page)] rounded-full h-1.5 border border-[var(--border-subtle)]">
                                                <div class="h-1.5 rounded-full transition-all" :style="{ width: percentual(item) + '%', backgroundColor: cor_por_metodo[item.forma_pagamento] || '#6366f1' }"></div>
                                            </div>
                                            <span class="font-black text-[var(--text-primary)] w-10 text-right">{{ percentual(item) }}%</span>
                                        </div>
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr class="border-t-2 border-[var(--border-subtle)]">
                                    <td class="pt-3 font-black text-[var(--text-primary)] uppercase tracking-widest text-[10px]">Total</td>
                                    <td class="pt-3 text-right font-black text-[var(--text-primary)]">{{ total_comandas }}</td>
                                    <td class="pt-3 text-right font-black text-nitec_blue">R$ {{ total_faturamento.toFixed(2) }}</td>
                                    <td class="pt-3 text-right font-black text-[var(--text-muted)] text-[10px]">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { Doughnut } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, ArcElement);

const props = defineProps({ visivel: Boolean, dados_formas: Array });
defineEmits(['alternar']);

const label_por_metodo = { dinheiro: 'Dinheiro', pix: 'Pix', debito: 'Débito', credito: 'Crédito', nao_informado: 'Não informado' };
const emoji_por_metodo = { dinheiro: '💵', pix: '📲', debito: '💳', credito: '💳', nao_informado: '❓' };
const cor_por_metodo   = { dinheiro: '#22c55e', pix: '#3b82f6', debito: '#f59e0b', credito: '#8b5cf6', nao_informado: '#6b7280' };

const total_faturamento = computed(() => (props.dados_formas || []).reduce((s, i) => s + Number(i.faturamento_total), 0));
const total_comandas    = computed(() => (props.dados_formas || []).reduce((s, i) => s + Number(i.total_comandas), 0));

const percentual = (item) => {
    if (!total_faturamento.value) return 0;
    return Math.round((Number(item.faturamento_total) / total_faturamento.value) * 100);
};

const dados_grafico = computed(() => {
    if (!props.dados_formas || props.dados_formas.length === 0) return null;
    return {
        labels: props.dados_formas.map(i => label_por_metodo[i.forma_pagamento] || i.forma_pagamento),
        datasets: [{
            data: props.dados_formas.map(i => Number(i.faturamento_total)),
            backgroundColor: props.dados_formas.map(i => cor_por_metodo[i.forma_pagamento] || '#6366f1'),
            borderWidth: 3,
            borderColor: 'transparent',
            hoverOffset: 8,
        }]
    };
});

const opcoes_grafico = {
    responsive: true, maintainAspectRatio: false, cutout: '68%',
    plugins: {
        legend: { display: false },
        tooltip: {
            backgroundColor: '#1f2937',
            callbacks: { label: (ctx) => ` R$ ${ctx.raw.toFixed(2)}` }
        }
    }
};
</script>
