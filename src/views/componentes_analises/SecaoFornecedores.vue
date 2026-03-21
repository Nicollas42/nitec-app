<template>
    <div class="flex flex-col gap-8 pb-10">

        <!-- KPIs -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1">
                <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Fornecedores Ativos</span>
                <span class="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{{ kpis.ativos }}</span>
            </div>
            <div class="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1">
                <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total Investido</span>
                <span class="text-2xl font-black text-[var(--text-primary)] tracking-tighter">R$ {{ kpis.total_investido }}</span>
            </div>
            <div class="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1">
                <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Total de Compras</span>
                <span class="text-2xl font-black text-[var(--text-primary)] tracking-tighter">{{ kpis.total_compras }}</span>
            </div>
            <div class="bg-[var(--bg-card)] p-5 rounded-3xl border border-[var(--border-subtle)] shadow-sm flex flex-col gap-1">
                <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Média por Compra</span>
                <span class="text-2xl font-black text-[var(--text-primary)] tracking-tighter">R$ {{ kpis.media_por_compra }}</span>
            </div>
        </div>

        <!-- Carregando -->
        <div v-if="carregando" class="flex items-center justify-center py-20 gap-3">
            <svg class="animate-spin h-6 w-6 text-nitec_blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest animate-pulse">Carregando fornecedores...</p>
        </div>

        <template v-else-if="fornecedores.length > 0">
            <!-- Gráfico: Investimento por Fornecedor -->
            <div class="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
                <div class="p-6 border-b border-[var(--border-subtle)]">
                    <h2 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Investimento por Fornecedor</h2>
                    <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Total gasto em compras de estoque por parceiro</p>
                </div>
                <div class="p-6">
                    <div class="h-64 w-full bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] p-3">
                        <Bar :data="grafico_investimento" :options="opcoes_barras_h" />
                    </div>
                </div>
            </div>

            <!-- Gráfico: Número de Compras -->
            <div class="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
                <div class="p-6 border-b border-[var(--border-subtle)]">
                    <h2 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Frequência de Compras</h2>
                    <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">Quantidade de pedidos realizados por fornecedor</p>
                </div>
                <div class="p-6">
                    <div class="h-64 w-full bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] p-3">
                        <Bar :data="grafico_compras" :options="opcoes_barras_h" />
                    </div>
                </div>
            </div>

            <!-- Tabela comparativa -->
            <div class="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">
                <div class="p-6 border-b border-[var(--border-subtle)]">
                    <h2 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-tight">Comparativo de Fornecedores</h2>
                </div>
                <div class="overflow-x-auto">
                    <table class="w-full text-left text-sm whitespace-nowrap">
                        <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] border-b border-[var(--border-subtle)] text-[9px] uppercase tracking-widest font-bold">
                            <tr>
                                <th class="py-3 px-6">Fornecedor</th>
                                <th class="py-3 px-6 text-center">Status</th>
                                <th class="py-3 px-6 text-center">Compras</th>
                                <th class="py-3 px-6 text-center">Produtos</th>
                                <th class="py-3 px-6 text-center">Última Compra</th>
                                <th class="py-3 px-6 text-right text-blue-500">Total Investido</th>
                                <th class="py-3 px-6 text-right">Participação</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[var(--border-subtle)]">
                            <tr v-for="f in fornecedores" :key="f.id" class="hover:bg-[var(--bg-card-hover)] transition-colors">
                                <td class="py-4 px-6 font-black text-[var(--text-primary)]">{{ f.nome }}</td>
                                <td class="py-4 px-6 text-center">
                                    <span :class="f.status === 'ativo' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'"
                                          class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border">
                                        {{ f.status }}
                                    </span>
                                </td>
                                <td class="py-4 px-6 text-center font-bold text-[var(--text-primary)]">{{ f.total_compras }}</td>
                                <td class="py-4 px-6 text-center font-bold text-[var(--text-muted)]">{{ f.qtd_produtos }} itens</td>
                                <td class="py-4 px-6 text-center">
                                    <span v-if="f.ultima_compra" class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
                                        {{ formatarData(f.ultima_compra) }}
                                    </span>
                                    <span v-else class="text-[10px] text-[var(--text-muted)] italic">N/A</span>
                                </td>
                                <td class="py-4 px-6 text-right font-black text-blue-500">R$ {{ Number(f.total_investido).toFixed(2) }}</td>
                                <td class="py-4 px-6 text-right">
                                    <div class="flex items-center justify-end gap-2">
                                        <div class="w-20 bg-[var(--bg-page)] rounded-full h-1.5 overflow-hidden border border-[var(--border-subtle)]">
                                            <div class="h-1.5 rounded-full bg-nitec_blue transition-all" :style="{ width: participacao(f.total_investido) + '%' }"></div>
                                        </div>
                                        <span class="text-[10px] font-black text-[var(--text-muted)] w-8 text-right">{{ participacao(f.total_investido) }}%</span>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <div v-else-if="!carregando" class="bg-[var(--bg-card)] rounded-3xl border border-[var(--border-subtle)] p-16 text-center">
            <p class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest italic">Nenhuma compra registrada com fornecedor vinculado.</p>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import api_cliente from '../../servicos/api_cliente.js';

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const carregando = ref(true);
const fornecedores = ref([]);
const sem_fornecedor = ref({ total_compras: 0, total_investido: 0 });

const total_geral = computed(() => fornecedores.value.reduce((acc, f) => acc + Number(f.total_investido), 0));

const kpis = computed(() => {
    const ativos = fornecedores.value.filter(f => f.status === 'ativo').length;
    const total_investido = total_geral.value;
    const total_compras = fornecedores.value.reduce((acc, f) => acc + f.total_compras, 0);
    const media = total_compras > 0 ? total_investido / total_compras : 0;
    return {
        ativos,
        total_investido: total_investido.toFixed(2),
        total_compras,
        media_por_compra: media.toFixed(2),
    };
});

const participacao = (investido) => {
    if (!total_geral.value) return 0;
    return Math.round((Number(investido) / total_geral.value) * 100);
};

const CORES = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#84cc16'];

const grafico_investimento = computed(() => ({
    labels: fornecedores.value.map(f => f.nome),
    datasets: [{
        label: 'Total Investido (R$)',
        data: fornecedores.value.map(f => Number(f.total_investido)),
        backgroundColor: fornecedores.value.map((_, i) => CORES[i % CORES.length] + '33'),
        borderColor: fornecedores.value.map((_, i) => CORES[i % CORES.length]),
        borderWidth: 2,
        borderRadius: 8,
    }],
}));

const grafico_compras = computed(() => ({
    labels: fornecedores.value.map(f => f.nome),
    datasets: [{
        label: 'Nº de Compras',
        data: fornecedores.value.map(f => f.total_compras),
        backgroundColor: fornecedores.value.map((_, i) => CORES[i % CORES.length] + '33'),
        borderColor: fornecedores.value.map((_, i) => CORES[i % CORES.length]),
        borderWidth: 2,
        borderRadius: 8,
    }],
}));

const opcoes_barras_h = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: '#1f2937' },
    },
    scales: {
        x: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, border: { display: false } },
        y: { grid: { display: false }, border: { display: false } },
    },
};

const formatarData = (dateStr) => {
    if (!dateStr) return '';
    const [ano, mes, dia] = dateStr.split('-');
    return `${dia}/${mes}/${ano}`;
};

onMounted(async () => {
    try {
        const resposta = await api_cliente.get('/analises/fornecedores');
        fornecedores.value = resposta.data.fornecedores ?? [];
        sem_fornecedor.value = resposta.data.sem_fornecedor ?? { total_compras: 0, total_investido: 0 };
    } catch {
        fornecedores.value = [];
    } finally {
        carregando.value = false;
    }
});
</script>
