<template>
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
            <span class="text-xl">⚠️</span>
            <h2 class="text-sm font-black text-red-800 uppercase">Produtos Sem Saída (Estoque Parado)</h2>
        </div>
        <table class="w-full text-left text-sm">
            <tr v-for="p in encalhados" :key="p.nome_produto" class="border-b border-gray-50 last:border-0 hover:bg-red-50/50 transition-colors">
                <td class="p-5 font-bold text-gray-700">{{ p.nome_produto }}</td>
                <td class="p-5 text-gray-400 font-bold">Estoque: {{ p.estoque_atual }}</td>
                <td class="p-5 text-right font-black text-gray-500">R$ {{ p.preco_venda }}</td>
            </tr>
            <tr v-if="!encalhados || encalhados.length === 0">
                <td colspan="3" class="p-8 text-center text-xs text-gray-400 font-medium italic">Nenhum produto encalhado!</td>
            </tr>
        </table>
    </div>
</template>

<script setup>
defineProps({
    encalhados: {
        type: Array,
        default: () => []
    }
});
</script>