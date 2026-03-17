<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Fluxo Geral e Específico</span>
            <button @click="$emit('alternar')" class="text-[var(--text-muted)] hover:text-blue-500 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]">
                {{ visivel ? '👁️ Ocultar Fluxo' : '👁️‍🗨️ Mostrar Fluxo' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] flex flex-col relative transition-all duration-300">
            <div class="p-6 bg-[var(--bg-page)] border-b border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-3xl transition-colors duration-300">
                <div class="flex items-center gap-2">
                    <h2 class="text-sm font-black text-[var(--text-primary)] uppercase">Mapa de Calor por Horário</h2>
                    <div class="relative group">
                        <span class="cursor-pointer text-[var(--text-muted)] hover:text-blue-500 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                        <div class="absolute bottom-full left-0 mb-2 hidden group-hover:block w-72 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                            <p>Mostra o volume geral de comandas. <strong class="text-blue-300">Clique em qualquer produto da lista</strong> ou pesquise para que o gráfico mostre <strong class="text-orange-400">exatamente</strong> as vendas desse item!</p>
                            <div class="absolute top-full left-4 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto">
                    <SelectPesquisavel :opcoes="produtos_disponiveis" v-model="filtro_produto" placeholder="Pesquisar Produto..." />
                    <button v-if="filtro_produto" @click="filtro_produto = ''" class="text-[10px] text-red-500 hover:text-red-400 font-black px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl transition-colors uppercase tracking-widest shadow-sm">
                        Limpar / Geral
                    </button>
                </div>
            </div>

            <div class="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div class="flex flex-col">
                    <h3 class="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">
                        Volume de Pedidos <span :class="filtro_produto ? 'text-orange-500' : 'text-blue-500'">{{ filtro_produto ? '(Específico)' : '(Geral)' }}</span>
                    </h3>
                    <div class="bg-[var(--bg-page)] p-4 rounded-3xl border border-[var(--border-subtle)] h-80 flex-1 shadow-inner transition-colors duration-300">
                        <Bar v-if="dados_grafico" :data="dados_grafico" :options="opcoes_grafico" />
                    </div>
                </div>

                <div class="space-y-4 flex flex-col h-full">
                    <h3 class="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Detalhes da hora (Clique para filtrar)</h3>
                    <div class="bg-[var(--bg-page)] p-6 rounded-3xl border border-[var(--border-subtle)] h-80 overflow-y-auto shadow-inner custom-scrollbar transition-colors duration-300">
                        
                        <div v-for="h in horarios" :key="h.hora" class="flex flex-col mb-8 last:mb-0 group">
                            <div class="flex items-center gap-4 mb-3">
                                <span class="text-xs font-black text-[var(--text-muted)] w-8 group-hover:text-blue-500 transition-colors">{{ h.hora }}h</span>
                                <div class="flex-1 h-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full overflow-hidden">
                                    <div class="h-full bg-[var(--text-muted)] rounded-full transition-all duration-1000" :style="{ width: (h.total_pedidos * 5) + '%' }"></div>
                                </div>
                                <span class="text-[10px] font-black text-[var(--text-primary)] bg-[var(--bg-card)] px-2 py-1 rounded shadow-sm border border-[var(--border-subtle)]">{{ h.total_pedidos }} ped. totais</span>
                            </div>
                            
                            <div class="ml-12 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl overflow-hidden shadow-sm transition-colors duration-300">
                                <div class="max-h-40 overflow-y-auto custom-scrollbar">
                                    <table class="w-full text-left text-[10px] whitespace-nowrap">
                                        <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] sticky top-0 z-10 border-b border-[var(--border-subtle)]">
                                            <tr>
                                                <th class="py-2 px-3 font-bold uppercase tracking-wider w-8 text-center">#</th>
                                                <th class="py-2 px-3 font-bold uppercase tracking-wider">Produto</th>
                                                <th class="py-2 px-3 font-bold uppercase tracking-wider text-right">Qtd</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-[var(--border-subtle)]">
                                            <tr v-for="(p, i) in obter_detalhes(h.hora)" :key="p.produto_id" 
                                                @click="filtro_produto = p.produto_id"
                                                class="hover:bg-orange-500/10 transition-colors cursor-pointer group/linha"
                                                title="Clique para destacar este produto no gráfico">
                                                
                                                <td class="py-2 px-3 text-center text-[var(--text-muted)] font-bold group-hover/linha:text-orange-500">
                                                    <span v-if="!filtro_produto && i === 0">🥇</span>
                                                    <span v-else-if="!filtro_produto && i === 1">🥈</span>
                                                    <span v-else-if="!filtro_produto && i === 2">🥉</span>
                                                    <span v-else-if="filtro_produto">🎯</span>
                                                    <span v-else>{{ i + 1 }}º</span>
                                                </td>
                                                <td class="py-2 px-3 font-black group-hover/linha:text-orange-500" :class="filtro_produto ? 'text-orange-500' : 'text-[var(--text-primary)]'">
                                                    {{ p.nome_produto }}
                                                </td>
                                                <td class="py-2 px-3 text-right font-black group-hover/linha:text-orange-500" :class="filtro_produto ? 'text-orange-500' : 'text-blue-500'">
                                                    {{ p.quantidade }}x
                                                </td>
                                            </tr>
                                            <tr v-if="obter_detalhes(h.hora).length === 0">
                                                <td colspan="3" class="py-4 text-center text-[var(--text-muted)] italic">Nenhuma venda registada.</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { Bar } from 'vue-chartjs';
import { Chart as ChartJS, Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale } from 'chart.js';
import SelectPesquisavel from './SelectPesquisavel.vue'; 

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

const props = defineProps({ visivel: Boolean, horarios: Array, dados_por_hora: Array, produtos_disponiveis: Array });
defineEmits(['alternar']);

const filtro_produto = ref('');

const obter_detalhes = (hora) => {
    if (!props.dados_por_hora) return [];
    let produtos_da_hora = props.dados_por_hora.filter(p => p.hora === hora);
    if (filtro_produto.value) return produtos_da_hora.filter(p => p.produto_id === filtro_produto.value);
    else {
        produtos_da_hora.sort((a, b) => b.quantidade - a.quantidade);
        return produtos_da_hora; 
    }
};

const dados_grafico = computed(() => {
    if (!props.horarios) return null;
    const etiquetas = Array.from({ length: 24 }, (_, i) => `${i}h`);
    const dados = Array(24).fill(0);

    if (filtro_produto.value && props.dados_por_hora) {
        props.dados_por_hora.forEach(item => {
            if (item.produto_id === filtro_produto.value) dados[item.hora] = Number(item.quantidade);
        });
        const nome = props.produtos_disponiveis.find(p => p.produto_id === filtro_produto.value)?.nome_produto || 'Produto';
        return { labels: etiquetas, datasets: [{ label: `Unidades de ${nome}`, backgroundColor: '#f97316', borderRadius: 4, data: dados }] };
    } else {
        props.horarios.forEach(h => dados[h.hora] = h.total_pedidos);
        return { labels: etiquetas, datasets: [{ label: 'Pedidos Gerais', backgroundColor: '#3b82f6', borderRadius: 4, data: dados }] };
    }
});

const opcoes_grafico = { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { backgroundColor: '#1f2937' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true } } };
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>