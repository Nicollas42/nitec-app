<template>
    <div class="flex flex-col gap-8 pb-10">

        <!-- Gráfico: Faturamento por Funcionário -->
        <div class="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-colors duration-300">
            <div class="p-6 border-b border-[var(--border-subtle)]">
                <h2 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Faturamento por Funcionário</h2>
                <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Receita total gerada no período</p>
            </div>
            <div class="p-6">
                <div v-if="equipe_filtrada.length > 0" class="h-56 w-full bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] p-3">
                    <Bar :data="grafico_faturamento" :options="opcoes_h" />
                </div>
                <p v-else class="text-center text-xs text-[var(--text-muted)] italic py-8">Sem dados para o período.</p>
            </div>
        </div>

        <!-- Gráfico: Lucro vs Descontos -->
        <div class="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-colors duration-300">
            <div class="p-6 border-b border-[var(--border-subtle)]">
                <h2 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Lucro Gerado vs Descontos Concedidos</h2>
                <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Comparativo de contribuição positiva e negativa por membro</p>
            </div>
            <div class="p-6">
                <div v-if="equipe_filtrada.length > 0" class="h-56 w-full bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] p-3">
                    <Bar :data="grafico_lucro_desconto" :options="opcoes_agrupado" />
                </div>
                <p v-else class="text-center text-xs text-[var(--text-muted)] italic py-8">Sem dados para o período.</p>
            </div>
        </div>

        <!-- Gráfico: Atendimentos -->
        <div class="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden transition-colors duration-300">
            <div class="p-6 border-b border-[var(--border-subtle)]">
                <h2 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Atendimentos por Canal</h2>
                <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Mesas atendidas vs vendas avulsas no balcão por funcionário</p>
            </div>
            <div class="p-6">
                <div v-if="equipe_filtrada.length > 0" class="h-56 w-full bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] p-3">
                    <Bar :data="grafico_atendimentos" :options="opcoes_agrupado" />
                </div>
                <p v-else class="text-center text-xs text-[var(--text-muted)] italic py-8">Sem dados para o período.</p>
            </div>
        </div>

        <!-- Tabela detalhada -->
        <div class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] overflow-hidden transition-colors duration-300">
            <div class="p-6 bg-[var(--bg-page)] border-b border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 transition-colors duration-300">
                <div class="flex items-center gap-2">
                    <h2 class="text-sm font-black text-[var(--text-primary)] uppercase">Desempenho da Equipe</h2>
                    <div class="relative group">
                        <span class="cursor-pointer text-[var(--text-muted)] hover:text-blue-500 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                            <p>Mede a produtividade de cada funcionário. Compare quem atende mais mesas, gera mais receita e quem está a conceder mais descontos.</p>
                            <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                    </div>
                </div>
                <select v-model="filtro_status" class="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest rounded-xl px-4 py-3 outline-none shadow-sm focus:border-blue-400 transition-colors w-full md:w-auto" style="color-scheme: dark;">
                    <option value="ativos">Apenas Equipa Ativa</option>
                    <option value="todos">Exibir Todos (Inc. Inativos/Demitidos)</option>
                </select>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-[var(--bg-card)] text-[var(--text-muted)] border-b border-[var(--border-subtle)] transition-colors duration-300">
                        <tr>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-widest">Membro da Equipa</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-widest text-center">Mesas</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-widest text-center">Balcão</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-widest text-center">Volume Físico</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-widest text-left">Produto Campeão</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-widest text-right text-green-500">Performance Real</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-widest text-right text-red-500">Descontos Dados</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-subtle)] transition-colors duration-300">
                        <tr v-for="(garcom, index) in equipe_filtrada" :key="garcom.name" class="hover:bg-[var(--bg-card-hover)] transition-colors group">
                            <td class="py-4 px-6">
                                <div class="flex items-center gap-3">
                                    <span class="w-6 h-6 rounded bg-[var(--bg-page)] text-[10px] font-bold text-[var(--text-primary)] flex items-center justify-center shadow-inner border border-[var(--border-subtle)]">{{ index + 1 }}º</span>
                                    <div class="flex flex-col">
                                        <div class="flex items-center gap-2">
                                            <span class="font-black text-[var(--text-primary)]">{{ garcom.name }}</span>
                                            <span v-if="garcom.status_conta !== 'ativo'" class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-500/10 text-red-500 border border-red-500/20">
                                                {{ garcom.status_conta }}
                                            </span>
                                        </div>
                                        <span class="text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                            <span :class="garcom.tipo_contrato === 'temporario' ? 'text-orange-500' : 'text-blue-500'">
                                                {{ garcom.tipo_contrato === 'temporario' ? '⏳ Temporário' : '📄 Fixo' }}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </td>
                            <td class="py-4 px-6 text-center">
                                <div class="flex flex-col">
                                    <span class="font-bold text-[var(--text-primary)]">{{ garcom.total_mesas }}</span>
                                    <span class="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">~{{ garcom.tempo_medio_minutos }} min</span>
                                </div>
                            </td>
                            <td class="py-4 px-6 text-center">
                                <div class="flex flex-col">
                                    <span class="font-bold text-[var(--text-primary)]">{{ garcom.total_balcao }}</span>
                                    <span class="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">avulso</span>
                                </div>
                            </td>
                            <td class="py-4 px-6 text-center">
                                <div class="flex flex-col">
                                    <span class="font-bold text-[var(--text-primary)]">{{ garcom.itens_servidos }} Itens</span>
                                    <span class="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Servidos</span>
                                </div>
                            </td>
                            <td class="py-4 px-6">
                                <div class="flex flex-col">
                                    <span class="font-bold text-orange-500 truncate max-w-[150px]" :title="garcom.produto_campeao">{{ garcom.produto_campeao }}</span>
                                    <span class="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">{{ garcom.qtd_campeao }}x vendidos</span>
                                </div>
                            </td>
                            <td class="py-4 px-6 text-right">
                                <div class="flex flex-col items-end">
                                    <span class="font-black text-green-500 text-base">R$ {{ Number(garcom.total_vendas).toFixed(2) }}</span>
                                    <span class="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Lucro: R$ {{ Number(garcom.lucro_gerado).toFixed(2) }}</span>
                                </div>
                            </td>
                            <td class="py-4 px-6 text-right">
                                <span class="font-black text-red-500 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                                    - R$ {{ Number(garcom.descontos_concedidos).toFixed(2) }}
                                </span>
                            </td>
                        </tr>
                        <tr v-if="!equipe_filtrada || equipe_filtrada.length === 0">
                            <td colspan="7" class="p-10 text-center text-[10px] tracking-widest uppercase text-[var(--text-muted)] font-black italic">Nenhum membro da equipa atende a estes critérios de pesquisa.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({ equipe: { type: Array, default: () => [] } });

const filtro_status = ref('ativos');

const equipe_filtrada = computed(() => {
    if (!props.equipe) return [];
    return props.equipe.filter(membro => {
        if (filtro_status.value === 'ativos') return membro.status_conta === 'ativo';
        return true;
    });
});

const nomes = computed(() => equipe_filtrada.value.map(g => g.name));

const grafico_faturamento = computed(() => ({
    labels: nomes.value,
    datasets: [{
        label: 'Faturamento (R$)',
        data: equipe_filtrada.value.map(g => Number(g.total_vendas)),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: '#10b981',
        borderWidth: 2,
        borderRadius: 8,
    }],
}));

const grafico_lucro_desconto = computed(() => ({
    labels: nomes.value,
    datasets: [
        {
            label: 'Lucro Gerado (R$)',
            data: equipe_filtrada.value.map(g => Number(g.lucro_gerado)),
            backgroundColor: 'rgba(16, 185, 129, 0.25)',
            borderColor: '#10b981',
            borderWidth: 2,
            borderRadius: 6,
        },
        {
            label: 'Descontos (R$)',
            data: equipe_filtrada.value.map(g => Number(g.descontos_concedidos)),
            backgroundColor: 'rgba(239, 68, 68, 0.25)',
            borderColor: '#ef4444',
            borderWidth: 2,
            borderRadius: 6,
        },
    ],
}));

const grafico_atendimentos = computed(() => ({
    labels: nomes.value,
    datasets: [
        {
            label: 'Mesas',
            data: equipe_filtrada.value.map(g => g.total_mesas),
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            borderRadius: 6,
        },
        {
            label: 'Balcão (Avulso)',
            data: equipe_filtrada.value.map(g => g.total_balcao),
            backgroundColor: 'rgba(245, 158, 11, 0.25)',
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderRadius: 6,
        },
    ],
}));

const opcoes_h = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#1f2937', callbacks: { label: (ctx) => `R$ ${ctx.raw.toFixed(2)}` } },
    },
    scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(127,127,127,0.1)' }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false } },
    },
};

const opcoes_agrupado = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10, weight: 'bold' } } },
        tooltip: { backgroundColor: '#1f2937' },
    },
    scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { beginAtZero: true, grid: { color: 'rgba(127,127,127,0.1)' }, border: { display: false } },
    },
};
</script>
