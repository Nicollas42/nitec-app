<template>
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <h2 class="text-sm font-black text-red-800 uppercase tracking-tight">Estoque Sem Giro</h2>
        </div>
        
        <div class="max-h-[500px] overflow-y-auto custom-scrollbar">
            <table class="w-full text-left text-sm">
                <thead class="bg-white text-gray-400 sticky top-0 z-10 border-b border-gray-100 shadow-sm text-[9px] uppercase tracking-widest font-bold">
                    <tr>
                        <th class="py-3 px-5">Produto</th>
                        <th class="py-3 px-5 text-center">Tempo Parado</th>
                        <th class="py-3 px-5 text-center">Validade</th>
                        <th class="py-3 px-5 text-center">Estoque</th>
                        <th class="py-3 px-5 text-right text-red-500">Risco (Prejuízo)</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    <tr v-for="p in encalhados" :key="p.nome_produto" class="hover:bg-red-50/30 transition-colors">
                        <td class="p-5 font-bold text-gray-700">{{ p.nome_produto }}</td>
                        
                        <td class="p-5 text-center">
                            <span class="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-200">
                                {{ (p.dias_sem_venda !== undefined && p.dias_sem_venda !== null) ? p.dias_sem_venda + ' Dias' : 'S/ Reg.' }}
                            </span>
                        </td>

                        <td class="p-5 text-center">
                            <span v-if="p.data_validade" 
                                  :class="estaVencido(p.data_validade) ? 'bg-red-500 text-white border-red-600 shadow-sm' : 'bg-gray-100 text-gray-600 border-gray-200'" 
                                  class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border">
                                {{ estaVencido(p.data_validade) ? '⚠️ Vencido' : formatarData(p.data_validade) }}
                            </span>
                            <span v-else class="text-[10px] font-bold text-gray-300 uppercase tracking-widest">N/A</span>
                        </td>

                        <td class="p-5 text-center font-bold text-gray-500">{{ p.estoque_atual }} un.</td>
                        
                        <td class="p-5 text-right font-black text-red-500 tracking-tight">R$ {{ p.prejuizo_potencial }}</td>
                    </tr>
                    <tr v-if="!encalhados || encalhados.length === 0">
                        <td colspan="5" class="p-8 text-center text-xs text-gray-400 font-medium italic">O seu estoque está a girar perfeitamente!</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
defineProps({
    encalhados: { type: Array, default: () => [] }
});

// Transforma YYYY-MM-DD em DD/MM/YYYY
const formatarData = (dataStr) => {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if (partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
};

// Deteta se o produto já passou do prazo
const estaVencido = (dataStr) => {
    if (!dataStr) return false;
    const dataValidade = new Date(dataStr);
    dataValidade.setHours(23, 59, 59); // Considera vencido só depois da meia-noite do dia
    return dataValidade < new Date();
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #fca5a5; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f87171; }
</style>