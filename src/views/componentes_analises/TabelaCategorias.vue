<template>
    <div class="flex flex-col relative w-full mb-10">
        <div class="flex justify-between items-end mb-2 px-2">
            <span class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-2">Análise de Setores</span>
            <button @click="$emit('alternar')" class="text-[var(--text-muted)] hover:text-blue-500 font-bold flex items-center gap-1 text-[10px] uppercase tracking-widest transition-colors px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-card)] hover:bg-[var(--bg-card-hover)]">
                {{ visivel ? '👁️ Ocultar Categorias' : '👁️‍🗨️ Mostrar Categorias' }}
            </button>
        </div>

        <div v-show="visivel" class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] flex flex-col relative transition-all duration-300">
            <div class="p-6 bg-[var(--bg-page)] border-b border-[var(--border-subtle)] flex items-center gap-2 rounded-t-3xl transition-colors duration-300">
                <h2 class="text-sm font-black text-[var(--text-primary)] uppercase">Desempenho por Categoria</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-[var(--text-muted)] hover:text-blue-500 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Descubra qual setor do seu restaurante traz mais lucro bruto. <strong class="text-blue-300">Clique na categoria para expandir</strong> e ver quais produtos vendem mais nela!</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="overflow-x-auto rounded-b-3xl">
                <table class="w-full text-left text-sm whitespace-nowrap">
                    <thead class="bg-[var(--bg-card)] text-[var(--text-muted)] border-b border-[var(--border-subtle)] transition-colors duration-300">
                        <tr>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider">Categoria / Família</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center">Volume (Qtd)</th>
                            <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right text-green-500">Receita Bruta</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-subtle)] transition-colors duration-300">
                        <template v-for="(cat, index) in categorias" :key="cat.nome_categoria">
                            <tr @click="linha_expandida = linha_expandida === index ? null : index" class="hover:bg-[var(--bg-card-hover)] transition-colors cursor-pointer group select-none">
                                <td class="py-4 px-6 font-black text-[var(--text-primary)] flex items-center gap-3">
                                    <span class="w-6 h-6 rounded bg-[var(--bg-page)] text-[10px] text-[var(--text-muted)] flex items-center justify-center transition-transform group-hover:bg-blue-500/20 group-hover:text-blue-500 border border-[var(--border-subtle)]" :class="linha_expandida === index ? 'rotate-90 bg-blue-500/20 text-blue-500' : ''">
                                        ▶
                                    </span>
                                    {{ cat.nome_categoria || 'Sem Categoria' }}
                                </td>
                                <td class="py-4 px-6 text-center font-bold text-[var(--text-muted)]">{{ cat.quantidade_total }} itens</td>
                                <td class="py-4 px-6 text-right font-black text-green-500">R$ {{ Number(cat.receita_total).toFixed(2) }}</td>
                            </tr>
                            
                            <tr v-if="linha_expandida === index" class="bg-[var(--bg-page)]/50 shadow-inner transition-colors duration-300">
                                <td colspan="3" class="p-0 border-b border-[var(--border-subtle)]">
                                    <div class="pl-12 pr-6 py-4">
                                        <table class="w-full text-xs text-left bg-[var(--bg-card)] rounded-xl shadow-sm border border-[var(--border-subtle)] overflow-hidden transition-colors duration-300">
                                            <thead class="bg-[var(--bg-page)] text-[9px] uppercase tracking-widest text-[var(--text-muted)]">
                                                <tr>
                                                    <th class="py-2.5 px-4 font-bold">Produto</th>
                                                    <th class="py-2.5 px-4 font-bold text-center">Unidades</th>
                                                    <th class="py-2.5 px-4 font-bold text-right">Faturamento</th>
                                                    <th class="py-2.5 px-4 font-bold text-right text-green-500">Lucro</th>
                                                </tr>
                                            </thead>
                                            <tbody class="divide-y divide-[var(--border-subtle)]">
                                                <tr v-for="prod in cat.produtos" :key="prod.nome_produto" class="hover:bg-[var(--bg-card-hover)] transition-colors">
                                                    <td class="py-2.5 px-4 font-bold text-[var(--text-primary)]">{{ prod.nome_produto }}</td>
                                                    <td class="py-2.5 px-4 text-center font-bold text-[var(--text-muted)]">{{ prod.quantidade_total }}x</td>
                                                    <td class="py-2.5 px-4 text-right font-black text-[var(--text-primary)]">R$ {{ Number(prod.receita_total).toFixed(2) }}</td>
                                                    <td class="py-2.5 px-4 text-right font-black text-green-500">R$ {{ Number(prod.lucro_total).toFixed(2) }}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </td>
                            </tr>
                        </template>

                        <tr v-if="!categorias || categorias.length === 0">
                            <td colspan="3" class="p-8 text-center text-xs text-[var(--text-muted)] font-medium italic">Dados insuficientes para agrupar.</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({ visivel: Boolean, categorias: Array });
defineEmits(['alternar']);

// Controla qual gaveta está aberta
const linha_expandida = ref(null);
</script>