<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Infraestrutura</span>
            <button @click="$emit('alternar')" class="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm bg-white hover:bg-gray-50">
                {{ visivel ? '👁️ Ocultar Mesas' : '👁️‍🗨️ Mostrar Mesas' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative transition-all">
            <div class="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-2 rounded-t-3xl">
                <h2 class="text-sm font-black text-gray-800 uppercase">Ranking de Ocupação de Mesas</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-gray-400 hover:text-blue-500 bg-white border border-gray-200 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Descubra quais os lugares do seu salão que geram mais receita. Ajuda a definir as zonas "VIP" e as áreas que precisam de ser melhoradas.</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="max-h-[500px] overflow-y-auto overflow-x-auto custom-scrollbar rounded-b-3xl">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-white text-gray-400 sticky top-0 z-10 shadow-sm border-b border-gray-100">
                        <tr>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider bg-white">Identificação da Mesa</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center bg-white">Contas Fechadas</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center text-orange-400 bg-white">Tempo Médio</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right bg-white">Receita Gerada</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right text-blue-500 bg-white">Ticket Médio p/ Mesa</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <tr v-for="(m, index) in mesas" :key="m.nome_mesa" class="hover:bg-blue-50 transition-colors">
                            <td class="py-4 px-6 font-black text-gray-700 flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-gray-100 text-[10px] text-gray-400 flex items-center justify-center">{{ index + 1 }}º</span>
                                {{ m.nome_mesa }}
                            </td>
                            <td class="py-4 px-6 text-center font-bold text-gray-500">{{ m.total_atendimentos }}x</td>
                            
                            <td class="py-4 px-6 text-center font-bold text-orange-500">
                                <span class="flex items-center justify-center gap-1"><span>⏳</span> {{ m.tempo_medio_minutos || '--' }} min</span>
                            </td>

                            <td class="py-4 px-6 text-right font-bold text-gray-500">R$ {{ Number(m.receita_gerada).toFixed(2) }}</td>
                            <td class="py-4 px-6 text-right font-black text-blue-600">
                                R$ {{ m.total_atendimentos > 0 ? (Number(m.receita_gerada) / Number(m.total_atendimentos)).toFixed(2) : '0.00' }}
                            </td>
                        </tr>
                        <tr v-if="!mesas || mesas.length === 0">
                            <td colspan="5" class="p-8 text-center text-xs text-gray-400 font-medium italic">Nenhuma mesa atendeu clientes neste período.</td>
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