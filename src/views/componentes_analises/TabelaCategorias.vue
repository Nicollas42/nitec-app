<template>
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative transition-all mb-10">
        <div class="p-6 bg-gray-50 border-b border-gray-100 flex items-center gap-2 rounded-t-3xl">
            <h2 class="text-sm font-black text-gray-800 uppercase">Desempenho por Categoria</h2>
            <div class="relative group">
                <span class="cursor-pointer text-gray-400 hover:text-blue-500 bg-white border border-gray-200 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                    <p>Descubra qual setor do seu restaurante traz mais lucro bruto, comparando Bebidas, Comidas, etc.</p>
                    <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                </div>
            </div>
        </div>

        <div class="overflow-x-auto rounded-b-3xl">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-white text-gray-400 border-b border-gray-100">
                    <tr>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider">Categoria / Família</th>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center">Volume (Qtd)</th>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right text-green-600">Receita Bruta</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    <tr v-for="(cat, index) in categorias" :key="cat.nome_categoria" class="hover:bg-blue-50 transition-colors">
                        <td class="py-4 px-6 font-black text-gray-700 flex items-center gap-3">
                            <span class="w-6 h-6 rounded bg-gray-100 text-[10px] text-gray-400 flex items-center justify-center">{{ index + 1 }}º</span>
                            {{ cat.nome_categoria || 'Sem Categoria' }}
                        </td>
                        <td class="py-4 px-6 text-center font-bold text-gray-500">{{ cat.quantidade_total }} itens</td>
                        <td class="py-4 px-6 text-right font-black text-green-600">R$ {{ Number(cat.receita_total).toFixed(2) }}</td>
                    </tr>
                    <tr v-if="!categorias || categorias.length === 0">
                        <td colspan="3" class="p-8 text-center text-xs text-gray-400 font-medium italic">Dados insuficientes para agrupar.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
defineProps({ categorias: Array });
</script>