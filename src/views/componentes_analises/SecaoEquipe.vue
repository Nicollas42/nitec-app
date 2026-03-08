<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div v-for="(garcom, idx) in equipe" :key="garcom.name" 
            class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col gap-5">
            
            <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-0 opacity-50"></div>
            
            <div class="flex justify-between items-start relative z-10">
                <div class="flex items-center gap-4">
                    <span class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-lg border border-blue-100 shadow-inner">{{ idx + 1 }}º</span>
                    <div>
                        <p class="font-black text-gray-800 uppercase text-base tracking-tight">{{ garcom.name }}</p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{{ garcom.total_mesas }} Mesas Atendidas</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Receita Gerada</p>
                    <p class="font-black text-gray-800 text-xl tracking-tighter">R$ {{ Number(garcom.total_vendas).toFixed(2) }}</p>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-3 relative z-10 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>📈</span> Lucro Líquido</span>
                    <span class="font-black text-green-600 text-sm">R$ {{ Number(garcom.lucro_gerado).toFixed(2) }}</span>
                </div>
                <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>🏷️</span> Ticket Médio</span>
                    <span class="font-bold text-gray-700 text-sm">R$ {{ garcom.total_mesas > 0 ? (Number(garcom.total_vendas) / Number(garcom.total_mesas)).toFixed(2) : '0.00' }}</span>
                </div>
                <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>⏳</span> Tempo / Mesa</span>
                    <span class="font-bold text-gray-700 text-sm">{{ garcom.tempo_medio_minutos }} min</span>
                </div>
                <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                    <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>🏃</span> Esforço Físico</span>
                    <span class="font-bold text-gray-700 text-sm">{{ garcom.itens_servidos }} itens</span>
                </div>
            </div>

            <div class="relative z-10 bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <span class="text-2xl drop-shadow-sm">🏆</span>
                    <div>
                        <span class="text-[9px] font-black uppercase tracking-widest text-orange-600 block">Ponto Forte (Mais Vendido)</span>
                        <span class="font-bold text-orange-800 text-sm mt-0.5 block truncate max-w-[150px]" :title="garcom.produto_campeao">{{ garcom.produto_campeao }}</span>
                    </div>
                </div>
                <span class="font-black text-orange-600 text-lg bg-white px-3 py-1 rounded-lg shadow-sm border border-orange-200">{{ garcom.qtd_campeao }}x</span>
            </div>
        </div>
        
        <div v-if="!equipe || equipe.length === 0" class="col-span-full text-center py-10 text-gray-500 font-medium italic bg-white rounded-3xl shadow-sm border border-gray-100">
            Nenhuma venda registada neste período para a equipa.
        </div>
    </div>
</template>

<script setup>
defineProps({
    equipe: {
        type: Array,
        default: () => []
    }
});
</script>