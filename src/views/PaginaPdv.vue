<template>
    <div class="tela_pdv_layout flex flex-col md:flex-row h-full bg-gray-50 font-sans overflow-hidden relative">
        
        <section class="w-full md:w-2/3 p-4 md:p-6 flex flex-col h-full md:border-r border-gray-200">
            <header class="flex flex-col gap-4 mb-6 shrink-0">
                <div class="flex justify-between items-center">
                    <h1 class="text-xl md:text-2xl font-black text-gray-800 tracking-tight uppercase italic">
                        {{ id_comanda_pagamento ? '💳 Pagamento de Conta' : (id_comanda_vinculada ? '📥 Lançar na Mesa' : 'Venda Balcão') }}
                    </h1>
                    <button @click="voltar_painel" class="md:hidden px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-bold transition-all shadow-sm">Voltar</button>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <div class="flex-1 flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus-within:border-nitec_blue transition-colors shadow-sm">
                        <span class="text-gray-400 mr-2">🔍</span>
                        <input type="text" v-model="termo_pesquisa" placeholder="Procurar produto ou código de barras..." class="bg-transparent text-sm font-bold outline-none text-gray-700 w-full placeholder:font-medium">
                    </div>
                    <select v-model="categoria_selecionada" class="bg-white border border-gray-200 text-gray-600 text-xs font-black uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-nitec_blue shadow-sm">
                        <option v-for="cat in categorias_unicas" :key="cat" :value="cat">
                            {{ cat === 'todas' ? '📋 Todas as Categorias' : cat }}
                        </option>
                    </select>
                </div>
            </header>

            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-2 pb-20 md:pb-4 flex-1 content-start">
                
                <div v-if="produtos_vitrine.length === 0" class="col-span-full py-10 text-center text-gray-400 font-bold text-sm italic border-2 border-dashed border-gray-200 rounded-2xl">
                    Nenhum produto encontrado para o filtro.
                </div>

                <div v-for="produto in produtos_vitrine" :key="produto.id" class="relative group h-28">
                    <button @click="id_comanda_pagamento ? null : adicionar_ao_carrinho(produto)" 
                            :class="id_comanda_pagamento ? 'border-gray-100 opacity-50 cursor-not-allowed grayscale' : 'border-gray-200 hover:border-nitec_blue hover:shadow-md active:scale-95 bg-white'"
                            class="w-full h-full p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center overflow-hidden">
                        
                        <span class="text-sm font-bold text-gray-700 leading-tight mb-2 line-clamp-2 w-full px-2">{{ produto.nome_produto }}</span>
                        <span class="text-lg font-black text-green-600">R$ {{ Number(produto.preco_venda).toFixed(2) }}</span>
                        
                        <div class="absolute top-0 left-0 bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-1 rounded-br-lg">QTD: {{ produto.estoque_atual }}</div>
                    </button>

                    <button @click.stop="alternar_fixacao(produto.id)" 
                            class="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all bg-white border shadow-sm z-10"
                            :class="produtos_fixados.includes(produto.id) ? 'border-orange-200 bg-orange-50' : 'border-gray-100 opacity-0 group-hover:opacity-100 hover:border-orange-200 hover:bg-orange-50'"
                            title="Fixar/Desafixar no topo">
                        <span :class="produtos_fixados.includes(produto.id) ? '' : 'grayscale opacity-50'">📌</span>
                    </button>
                </div>
            </div>
        </section>

        <section class="w-full md:w-1/3 bg-white flex flex-col z-20 h-[55vh] md:h-full fixed md:relative bottom-0 left-0 right-0 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] md:shadow-none border-t md:border-t-0 border-gray-200 rounded-t-3xl md:rounded-none">
            
            <div class="bg-gray-50/80 backdrop-blur-md border-b border-gray-100 p-4 text-center shrink-0 rounded-t-3xl md:rounded-none">
                <h2 class="text-xs font-black text-gray-600 uppercase tracking-widest">
                    {{ id_comanda_pagamento ? 'Resumo da Conta' : 'Carrinho Atual' }}
                </h2>
                <div class="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-2 md:hidden"></div>
            </div>

            <div class="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                <div v-if="carrinho_venda.length === 0" class="flex flex-col items-center justify-center h-full text-gray-300">
                    <span class="text-4xl mb-2 opacity-60">🛒</span>
                    <p class="text-[10px] font-bold uppercase tracking-widest">Carrinho Vazio</p>
                </div>
                
                <div v-for="(item, indice) in carrinho_venda" :key="indice" class="flex justify-between items-center border-b border-gray-50 py-2 group">
                    <div>
                        <p class="text-xs font-bold text-gray-800">{{ item.nome_produto }}</p>
                        <p class="text-[10px] text-gray-500 font-bold mt-0.5">{{ item.quantidade }}x <span class="text-green-600">R$ {{ Number(item.preco_venda).toFixed(2) }}</span></p>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="text-sm font-black text-gray-800">R$ {{ (item.quantidade * item.preco_venda).toFixed(2) }}</span>
                        <button v-if="!id_comanda_pagamento" @click="remover_do_carrinho(indice)" class="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1 rounded-lg transition-colors flex items-center justify-center" title="Remover">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            <div class="p-5 md:p-6 bg-white border-t border-gray-100 shrink-0 pb-safe">
                
                <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Subtotal:</span>
                    <span class="text-sm font-black text-gray-600">R$ {{ subtotal_comanda.toFixed(2) }}</span>
                </div>
                
                <div v-if="!id_comanda_vinculada" class="flex justify-between items-center mb-4 pb-4 border-b border-gray-100">
                    <span class="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                        <span>🏷️</span> Desconto (R$):
                    </span>
                    <input type="number" v-model="valor_desconto" min="0" step="0.01" placeholder="0.00" class="w-24 p-2 text-right bg-orange-50 border border-orange-200 rounded-lg outline-none focus:border-orange-400 text-sm font-black text-orange-700 transition-colors placeholder:text-orange-300">
                </div>

                <div class="flex justify-between items-center mb-4">
                    <span class="text-[10px] font-black text-gray-800 uppercase tracking-widest">Total a Pagar:</span>
                    <span class="text-2xl md:text-3xl font-black text-nitec_blue tracking-tighter" :class="valor_desconto > 0 ? 'text-green-600' : ''">
                        R$ {{ valor_final_comanda.toFixed(2) }}
                    </span>
                </div>
                
                <button @click="processar_acao_principal" :class="id_comanda_pagamento ? 'bg-green-500 hover:bg-green-600' : 'bg-nitec_blue hover:bg-blue-700'" class="w-full text-white font-black text-sm py-4 rounded-xl shadow-md transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2">
                    <template v-if="id_comanda_pagamento"><span>💳</span> Confirmar Pagamento</template>
                    <template v-else-if="id_comanda_vinculada"><span>📥</span> Lançar Produtos</template>
                    <template v-else><span>💸</span> Venda Balcão</template>
                </button>
            </div>
        </section>
        
    </div>
</template>

<script setup>
import { useLogicaPdv } from './pagina_pdv_logica.js';
const { 
    produtos_vitrine, categorias_unicas, termo_pesquisa, categoria_selecionada, 
    produtos_fixados, alternar_fixacao,
    carrinho_venda, adicionar_ao_carrinho, remover_do_carrinho, 
    subtotal_comanda, valor_final_comanda, valor_desconto,
    id_comanda_vinculada, id_comanda_pagamento, processar_acao_principal, voltar_painel 
} = useLogicaPdv();
</script>

<style scoped>
.pb-safe { padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
</style>