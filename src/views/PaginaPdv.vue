<template>
    <div class="tela_pdv_layout flex flex-col md:flex-row h-full bg-gray-50 font-sans overflow-hidden">
        
        <section class="w-full md:w-2/3 p-4 md:p-6 flex flex-col h-full md:border-r border-gray-200">
            <header class="flex justify-between items-center mb-6 shrink-0">
                <h1 class="text-xl md:text-2xl font-black text-gray-800 tracking-tight">
                    {{ id_comanda_pagamento ? '💳 Pagamento' : 'Terminal de Vendas' }}
                </h1>
                <button @click="voltar_painel" class="md:hidden px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-bold transition-all shadow-sm">Voltar</button>
            </header>

            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 overflow-y-auto pr-2 pb-20 md:pb-4 flex-1">
                <button v-for="produto in lista_produtos" :key="produto.id" @click="id_comanda_pagamento ? null : adicionar_ao_carrinho(produto)" 
                        :class="id_comanda_pagamento ? 'border-gray-100 opacity-50 cursor-not-allowed grayscale' : 'border-gray-200 hover:border-nitec_blue hover:shadow-md active:scale-95 bg-white'"
                        class="p-4 rounded-2xl border transition-all flex flex-col items-center justify-center text-center group h-28 relative overflow-hidden">
                    
                    <span class="text-sm font-bold text-gray-700 leading-tight mb-2 line-clamp-2 w-full px-2">{{ produto.nome_produto }}</span>
                    <span class="text-lg font-black text-green-600">R$ {{ produto.preco_venda }}</span>
                    
                    <div class="absolute top-0 right-0 bg-gray-100 text-gray-500 text-[9px] font-black px-2 py-1 rounded-bl-lg">QTD: {{ produto.estoque_atual }}</div>
                </button>
            </div>
        </section>

        <section class="w-full md:w-1/3 bg-white flex flex-col z-20 h-[50vh] md:h-full fixed md:relative bottom-0 left-0 right-0 shadow-[0_-15px_40px_rgba(0,0,0,0.1)] md:shadow-none border-t md:border-t-0 border-gray-200 rounded-t-3xl md:rounded-none">
            
            <div class="bg-gray-50/80 backdrop-blur-md border-b border-gray-100 p-4 text-center shrink-0 rounded-t-3xl md:rounded-none">
                <h2 class="text-xs font-black text-gray-600 uppercase tracking-widest">
                    {{ id_comanda_pagamento ? 'Resumo da Conta' : 'Comanda Atual' }}
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
                        <p class="text-[10px] text-gray-500 font-bold mt-0.5">{{ item.quantidade }}x <span class="text-green-600">R$ {{ item.preco_venda }}</span></p>
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
                <div class="flex justify-between items-center mb-4">
                    <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Calculado:</span>
                    <span class="text-2xl md:text-3xl font-black text-nitec_blue tracking-tighter">R$ {{ valor_total_comanda.toFixed(2) }}</span>
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
    lista_produtos, carrinho_venda, adicionar_ao_carrinho, 
    remover_do_carrinho, valor_total_comanda, 
    id_comanda_vinculada, id_comanda_pagamento, processar_acao_principal, voltar_painel 
} = useLogicaPdv();
</script>

<style scoped>
/* Evita que botões fiquem cortados no iPhone */
.pb-safe { padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>