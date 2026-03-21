<template>
    <div class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] overflow-hidden transition-colors duration-300">
        <div class="p-6 bg-red-500/10 border-b border-red-500/20 flex flex-col sm:flex-row sm:items-center gap-4">
            <div class="flex items-center gap-3 flex-1">
                <span class="text-xl">⚠️</span>
                <h2 class="text-sm font-black text-red-500 uppercase tracking-tight">Estoque Sem Giro</h2>
            </div>

            <div class="flex items-center gap-2">
                <div class="flex items-center bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 gap-2 shadow-inner">
                    <input type="date" v-model="data_inicio" class="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-[var(--text-primary)] cursor-pointer text-center" style="color-scheme: dark;">
                    <span class="text-[var(--text-muted)] text-[10px]">→</span>
                    <input type="date" v-model="data_fim" class="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none text-[var(--text-primary)] cursor-pointer text-center" style="color-scheme: dark;">
                </div>
                <button @click="buscar" class="bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/30 h-[34px] w-[34px] rounded-xl transition-all flex items-center justify-center active:scale-95 flex-shrink-0">
                    <span class="text-sm">🔍</span>
                </button>
            </div>
        </div>

        <div v-if="carregando" class="flex items-center justify-center py-12 gap-3">
            <svg class="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-xs font-bold text-[var(--text-muted)] animate-pulse uppercase tracking-widest">Buscando encalhados...</p>
        </div>

        <div v-else class="max-h-[500px] overflow-y-auto custom-scrollbar">
            <table class="w-full text-left text-sm">
                <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] sticky top-0 z-10 border-b border-[var(--border-subtle)] shadow-sm text-[9px] uppercase tracking-widest font-bold transition-colors duration-300">
                    <tr>
                        <th class="py-3 px-5">Produto</th>
                        <th class="py-3 px-5 text-center">Tempo Parado</th>
                        <th class="py-3 px-5 text-center">Validade</th>
                        <th class="py-3 px-5 text-center">Estoque</th>
                        <th class="py-3 px-5 text-right text-red-500">Risco (Prejuízo)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border-subtle)] transition-colors duration-300">
                    <tr v-for="p in encalhados" :key="p.nome_produto" class="hover:bg-red-500/5 transition-colors">
                        <td class="p-5 font-bold text-[var(--text-primary)]">{{ p.nome_produto }}</td>

                        <td class="p-5 text-center">
                            <span class="bg-red-500/10 text-red-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-500/20">
                                {{ (p.dias_sem_venda !== undefined && p.dias_sem_venda !== null) ? p.dias_sem_venda + ' Dias' : 'S/ Reg.' }}
                            </span>
                        </td>

                        <td class="p-5 text-center">
                            <span v-if="p.data_validade"
                                  :class="estaVencido(p.data_validade) ? 'bg-red-500 text-white border-red-600 shadow-sm' : 'bg-[var(--bg-page)] text-[var(--text-muted)] border-[var(--border-subtle)]'"
                                  class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border">
                                {{ estaVencido(p.data_validade) ? '⚠️ Vencido' : formatarData(p.data_validade) }}
                            </span>
                            <span v-else class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">N/A</span>
                        </td>

                        <td class="p-5 text-center font-bold text-[var(--text-muted)]">{{ p.estoque_atual }} un.</td>

                        <td class="p-5 text-right font-black text-red-500 tracking-tight">R$ {{ p.prejuizo_potencial }}</td>
                    </tr>
                    <tr v-if="!carregando && encalhados.length === 0">
                        <td colspan="5" class="p-8 text-center text-xs text-[var(--text-muted)] font-medium italic">O seu estoque está a girar perfeitamente!</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api_cliente from '../../servicos/api_cliente.js';

const encalhados = ref([]);
const carregando = ref(false);
const data_inicio = ref('');
const data_fim = ref('');

const buscar = async () => {
    carregando.value = true;
    try {
        const params = new URLSearchParams();
        if (data_inicio.value) params.set('data_inicio', data_inicio.value);
        if (data_fim.value) params.set('data_fim', data_fim.value);
        const qs = params.toString();
        const resposta = await api_cliente.get(`/analises/encalhados${qs ? '?' + qs : ''}`);
        encalhados.value = resposta.data.encalhados ?? [];
    } catch {
        encalhados.value = [];
    } finally {
        carregando.value = false;
    }
};

const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

const estaVencido = (dataStr) => {
    if (!dataStr) return false;
    const dataValidade = new Date(dataStr);
    dataValidade.setHours(23, 59, 59);
    return dataValidade < new Date();
};

onMounted(buscar);
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #fca5a5; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f87171; }
</style>
