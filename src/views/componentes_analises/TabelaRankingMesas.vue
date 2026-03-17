<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Infraestrutura</span>
            <button @click="$emit('alternar')" class="text-[var(--text-muted)] hover:text-blue-500 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]">
                {{ visivel ? '👁️ Ocultar Mesas' : '👁️‍🗨️ Mostrar Mesas' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] flex flex-col relative transition-all duration-300">
            <div class="p-6 bg-[var(--bg-page)] border-b border-[var(--border-subtle)] flex items-center gap-2 rounded-t-3xl transition-colors duration-300">
                <h2 class="text-sm font-black text-[var(--text-primary)] uppercase">Ranking de Ocupação de Mesas</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-[var(--text-muted)] hover:text-blue-500 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Descubra quais os lugares do seu salão que geram mais receita. Ajuda a definir as zonas "VIP" e as áreas que precisam de ser melhoradas.</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar rounded-b-3xl">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] sticky top-0 z-10 shadow-sm border-b border-[var(--border-subtle)] transition-colors duration-300">
                        <tr>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider bg-[var(--bg-page)] transition-colors duration-300">Identificação da Mesa</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center bg-[var(--bg-page)] transition-colors duration-300">Contas Fechadas</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center text-orange-500 bg-[var(--bg-page)] transition-colors duration-300">Tempo Médio</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right bg-[var(--bg-page)] transition-colors duration-300">Receita Gerada</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right text-blue-500 bg-[var(--bg-page)] transition-colors duration-300">Ticket Médio p/ Mesa</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-subtle)] transition-colors duration-300">
                        <tr v-for="(m, index) in mesas" :key="m.nome_mesa" class="hover:bg-[var(--bg-card-hover)] transition-colors">
                            <td class="py-4 px-6 font-black text-[var(--text-primary)] flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-muted)] flex items-center justify-center">{{ index + 1 }}º</span>
                                {{ m.nome_mesa }}
                            </td>
                            <td class="py-4 px-6 text-center font-bold text-[var(--text-muted)]">{{ m.total_atendimentos }}x</td>
                            
                            <td class="py-4 px-6 text-center font-bold text-orange-500">
                                <span class="flex items-center justify-center gap-1"><span>⏳</span> {{ m.tempo_medio_minutos || '--' }} min</span>
                            </td>

                            <td class="py-4 px-6 text-right font-bold text-[var(--text-muted)]">R$ {{ Number(m.receita_gerada).toFixed(2) }}</td>
                            <td class="py-4 px-6 text-right font-black text-blue-500">
                                R$ {{ m.total_atendimentos > 0 ? (Number(m.receita_gerada) / Number(m.total_atendimentos)).toFixed(2) : '0.00' }}
                            </td>
                        </tr>
                        <tr v-if="!mesas || mesas.length === 0">
                            <td colspan="5" class="p-8 text-center text-xs text-[var(--text-muted)] font-medium italic">Nenhuma mesa atendeu clientes neste período.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({ visivel: Boolean, mesas: Array });
defineEmits(['alternar']);
</script>

<style scoped>
/* 🟢 Estilização da barra de rolagem para combinar com o dashboard */
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>