<template>
    <div class="flex flex-col relative w-full">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Painel de Lucro</span>
            <button @click="$emit('alternar')" class="text-gray-500 hover:text-blue-600 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm bg-white hover:bg-gray-50">
                {{ visivel ? '👁️ Ocultar ABC' : '👁️‍🗨️ Mostrar ABC' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative transition-all">
            <div class="p-6 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-3xl">
                <div class="flex items-center gap-2">
                    <h2 class="text-sm font-black text-gray-800 uppercase">Curva ABC (Lucratividade Real)</h2>
                    <div class="relative group">
                        <span class="cursor-pointer text-gray-400 hover:text-blue-500 bg-white border border-gray-200 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                        <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                            <p>Mostra os produtos que trazem mais lucro limpo para a casa. Pode usar o campo de pesquisa para encontrar o desempenho de um prato específico.</p>
                            <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                        </div>
                    </div>
                </div>

                <div class="flex items-center gap-2 w-full md:w-auto">
                    <SelectPesquisavel :opcoes="produtos" v-model="filtro_produto" placeholder="Filtrar um produto..." />
                    <button v-if="filtro_produto" @click="filtro_produto = ''" class="text-[10px] text-red-500 hover:text-red-700 font-bold px-3 py-2 bg-red-50 rounded-lg transition-colors uppercase tracking-widest">
                        Limpar
                    </button>
                </div>
            </div>

            <div class="overflow-x-auto rounded-b-3xl">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-white text-gray-400 border-b border-gray-100">
                        <tr>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider">Produto</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center">Unid. Vendidas</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right">Receita Bruta</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right text-red-400">Custo Total</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right text-green-600">Lucro Estimado</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <tr v-for="(p, index) in produtos_filtrados" :key="p.produto_id" class="hover:bg-blue-50 transition-colors">
                            <td class="py-4 px-6 font-black text-gray-700 flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-gray-100 text-[10px] text-gray-400 flex items-center justify-center">{{ index + 1 }}º</span>
                                {{ p.nome_produto }}
                            </td>
                            <td class="py-4 px-6 text-center font-bold text-gray-500">{{ p.quantidade_total }}x</td>
                            <td class="py-4 px-6 text-right font-bold text-gray-500">R$ {{ Number(p.receita_total).toFixed(2) }}</td>
                            <td class="py-4 px-6 text-right font-bold text-red-500">R$ {{ (Number(p.receita_total) - Number(p.lucro_total)).toFixed(2) }}</td>
                            <td class="py-4 px-6 text-right font-black text-green-600">R$ {{ Number(p.lucro_total).toFixed(2) }}</td>
                        </tr>
                        <tr v-if="!produtos_filtrados || produtos_filtrados.length === 0">
                            <td colspan="5" class="p-8 text-center text-xs text-gray-400 font-medium italic">Nenhum produto encontrado.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import SelectPesquisavel from './SelectPesquisavel.vue';

const props = defineProps({ visivel: Boolean, produtos: Array });
defineEmits(['alternar']);

const filtro_produto = ref('');

const produtos_filtrados = computed(() => {
    if (!props.produtos) return [];
    if (!filtro_produto.value) return props.produtos;
    return props.produtos.filter(p => p.produto_id === filtro_produto.value);
});
</script>