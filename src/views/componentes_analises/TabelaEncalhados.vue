<template>
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <h2 class="text-sm font-black text-red-800 uppercase">Produtos Sem Saída (Estoque Parado)</h2>
        </div>
        
        <div class="max-h-[500px] overflow-y-auto custom-scrollbar">
            <table class="w-full text-left text-sm">
                <thead class="bg-white text-gray-400 sticky top-0 z-10 border-b border-gray-100 shadow-sm text-[9px] uppercase tracking-widest font-bold">
                    <tr>
                        <th class="py-3 px-5">Produto</th>
                        <th class="py-3 px-5 text-center">Tempo Parado</th>
                        <th class="py-3 px-5">Estoque</th>
                        <th class="py-3 px-5 text-right">Preço de Venda</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="p in encalhados" :key="p.nome_produto" class="border-b border-gray-50 last:border-0 hover:bg-red-50/50 transition-colors">
                        <td class="p-5 font-bold text-gray-700">{{ p.nome_produto }}</td>
                        
                        <td class="p-5 text-center">
                            <span class="bg-red-100 text-red-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-red-200">
                                {{ p.dias_sem_venda ? p.dias_sem_venda + ' Dias' : 'S/ Registo' }}
                            </span>
                        </td>

                        <td class="p-5 text-gray-400 font-bold">{{ p.estoque_atual }} un.</td>
                        <td class="p-5 text-right font-black text-gray-500">R$ {{ p.preco_venda }}</td>
                    </tr>
                    <tr v-if="!encalhados || encalhados.length === 0">
                        <td colspan="4" class="p-8 text-center text-xs text-gray-400 font-medium italic">Nenhum produto encalhado!</td>
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
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #fca5a5; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #f87171; }
</style>