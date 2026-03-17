<template>
    <div class="tela_pdv_layout flex flex-col md:flex-row h-full bg-[var(--bg-page)] font-sans overflow-hidden relative transition-colors duration-300">
        
        <section class="w-full md:w-2/3 p-4 md:p-6 flex flex-col h-full md:border-r border-[var(--border-subtle)] transition-colors duration-300">
            <header class="flex flex-col gap-4 mb-6 shrink-0">

                <div class="flex justify-between items-center">
                    <h1 class="text-xl md:text-2xl font-black text-[var(--text-primary)] tracking-tight uppercase italic">
                        {{ id_comanda_pagamento ? '💳 Pagamento de Conta' : (id_comanda_vinculada ? '📥 Lançar na Mesa' : 'Venda Balcão') }}
                    </h1>
                    <button @click="voltar_painel" class="md:hidden px-4 py-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-card-hover)] text-sm font-bold transition-all shadow-sm">Voltar</button>
                </div>

                <div class="flex flex-col sm:flex-row gap-3">
                    <div class="flex-1 flex items-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 focus-within:border-nitec_blue transition-colors shadow-sm">
                        <span class="text-[var(--text-muted)] mr-2">🔍</span>
                        <input type="text" v-model="termo_pesquisa" placeholder="Procurar produto ou código de barras..." class="bg-transparent text-sm font-bold outline-none text-[var(--text-primary)] w-full placeholder:font-medium placeholder:text-[var(--text-muted)]">
                    </div>
                    <select v-model="categoria_selecionada" class="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-black uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none focus:border-nitec_blue shadow-sm">
                        <option v-for="cat in categorias_unicas" :key="cat" :value="cat">
                            {{ cat === 'todas' ? '📋 Todas as Categorias' : cat }}
                        </option>
                    </select>
                </div>
            </header>

            <div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 overflow-y-auto pr-2 pb-24 md:pb-4 flex-1 content-start custom-scrollbar">
                
                <div v-if="produtos_vitrine.length === 0" class="col-span-full py-10 text-center text-[var(--text-muted)] font-bold text-sm italic border-2 border-dashed border-[var(--border-subtle)] rounded-2xl">
                    Nenhum produto encontrado para o filtro.
                </div>

                <div v-for="produto in produtos_vitrine" :key="produto.id" class="relative group h-28">
                    <button @click="id_comanda_pagamento ? null : adicionar_ao_carrinho(produto)" 
                            :class="id_comanda_pagamento ? 'opacity-50 cursor-not-allowed grayscale' : 'hover:border-nitec_blue hover:shadow-md active:scale-95'"
                            class="w-full h-full p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] transition-all flex flex-col items-center justify-center text-center overflow-hidden">
                        
                        <span class="text-sm font-bold text-[var(--text-primary)] leading-tight mb-2 line-clamp-2 w-full px-2">{{ produto.nome_produto }}</span>
                        <span class="text-lg font-black text-green-500">R$ {{ Number(produto.preco_venda).toFixed(2) }}</span>
                        
                        <div class="absolute top-0 left-0 bg-[var(--bg-page)] text-[var(--text-muted)] text-[9px] font-black px-2 py-1 rounded-br-lg border-b border-r border-[var(--border-subtle)]">QTD: {{ produto.estoque_atual }}</div>
                    </button>

                    <button @click.stop="alternar_fixacao(produto.id)" 
                            class="absolute top-2 right-2 h-7 w-7 rounded-full flex items-center justify-center transition-all bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm z-10"
                            :class="produtos_fixados.includes(produto.id) ? 'border-orange-400 bg-orange-500/10' : 'opacity-0 group-hover:opacity-100 hover:border-orange-400 hover:bg-orange-500/10'"
                            title="Fixar/Desafixar no topo">
                        <span :class="produtos_fixados.includes(produto.id) ? '' : 'grayscale opacity-50'">📌</span>
                    </button>
                </div>
            </div>
        </section>

        <!-- 🟢 PAINEL DO CARRINHO (Com Toggle Colapsável no Mobile) -->
        <section :class="carrinho_expandido ? 'h-[75vh]' : 'h-24 md:h-full'" 
                 class="w-full md:w-1/3 bg-[var(--bg-card)] flex flex-col z-20 fixed md:relative bottom-0 left-0 right-0 shadow-[0_-15px_40px_rgba(0,0,0,0.3)] md:shadow-none border-t md:border-t-0 border-[var(--border-subtle)] rounded-t-3xl md:rounded-none transition-all duration-300">
            
            <div @click="carrinho_expandido = !carrinho_expandido" 
                 class="bg-[var(--bg-page)]/80 backdrop-blur-md border-b border-[var(--border-subtle)] p-4 text-center shrink-0 rounded-t-3xl md:rounded-none cursor-pointer md:cursor-default flex justify-between items-center md:block">
                
                <h2 class="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest text-center flex-1">
                    {{ id_comanda_pagamento ? 'Resumo da Conta' : 'Carrinho Atual' }}
                    <span v-if="carrinho_venda.length > 0 && !carrinho_expandido" class="md:hidden ml-2 bg-nitec_blue text-white px-2 py-0.5 rounded-full text-[10px]">{{ carrinho_venda.length }} itens</span>
                </h2>
                
                <button class="md:hidden text-[var(--text-primary)] font-bold text-xl px-2">
                    {{ carrinho_expandido ? '▼' : '▲' }}
                </button>
            </div>

            <div v-show="carrinho_expandido || true" class="flex-1 overflow-y-auto p-4 flex flex-col gap-1 custom-scrollbar md:!flex" :class="!carrinho_expandido ? 'hidden md:flex' : 'flex'">
                
                <div v-if="carrinho_venda.length === 0 && (!itens_ja_lancados || itens_ja_lancados.length === 0)" class="flex flex-col items-center justify-center h-full text-[var(--text-muted)] opacity-50">
                    <span class="text-4xl mb-2">🛒</span>
                    <p class="text-[10px] font-bold uppercase tracking-widest">Carrinho Vazio</p>
                </div>
                
                <div v-for="item in itens_ja_lancados" :key="'db_'+item.id_item_comanda" 
                     class="flex flex-col border border-purple-500/20 py-2 group px-2 relative bg-[var(--bg-page)] rounded-xl mb-1 shadow-sm">
                    
                    <div class="flex justify-between items-start mb-1">
                        <div>
                            <p class="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5"><span class="text-[10px] text-purple-500" title="Já gravado">☁️</span> {{ item.nome_produto }}</p>
                            <p class="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">{{ item.quantidade }}x <span class="text-green-500">R$ {{ Number(item.preco_venda).toFixed(2) }}</span></p>
                        </div>
                        <span class="text-sm font-black text-[var(--text-primary)]">R$ {{ (item.quantidade * item.preco_venda).toFixed(2) }}</span>
                    </div>
                    
                    <div class="flex items-center justify-between mt-1">
                        <div class="flex items-center bg-[var(--bg-card)] rounded-md border border-[var(--border-subtle)] shadow-sm">
                            <button @click="alterar_quantidade_db(item.id_item_comanda, 'decrementar')" class="w-6 h-6 flex items-center justify-center text-[var(--text-primary)] hover:text-red-500 font-black">-</button>
                            <span class="w-6 text-center text-xs font-black text-[var(--text-primary)]">{{ item.quantidade }}</span>
                            <button @click="alterar_quantidade_db(item.id_item_comanda, 'incrementar')" class="w-6 h-6 flex items-center justify-center text-[var(--text-primary)] hover:text-blue-500 font-black">+</button>
                        </div>
                        <button @click="remover_item_db(item.id_item_comanda)" class="text-[var(--text-muted)] hover:text-red-500 text-[10px] uppercase font-black tracking-widest px-2 transition-colors">
                            Remover
                        </button>
                    </div>
                </div>

                <div v-for="(item, indice) in carrinho_venda" :key="'novo_'+indice" 
                     class="flex flex-col border border-green-500/20 py-2 group px-2 relative bg-[var(--bg-page)] rounded-xl mb-1 shadow-sm">
                    
                    <div class="flex justify-between items-start mb-1">
                        <div>
                            <p class="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5"><span class="text-[10px] text-green-500">🆕</span> {{ item.nome_produto }}</p>
                            <p class="text-[10px] text-[var(--text-muted)] font-bold mt-0.5">{{ item.quantidade }}x <span class="text-green-500">R$ {{ Number(item.preco_venda).toFixed(2) }}</span></p>
                        </div>
                        <span class="text-sm font-black text-[var(--text-primary)]">R$ {{ (item.quantidade * item.preco_venda).toFixed(2) }}</span>
                    </div>

                    <div class="flex items-center justify-between mt-1">
                        <div class="flex items-center bg-[var(--bg-card)] rounded-md border border-[var(--border-subtle)] shadow-sm">
                            <button @click="alterar_quantidade_novo(indice, 'decrementar')" class="w-6 h-6 flex items-center justify-center text-[var(--text-primary)] hover:text-red-500 font-black">-</button>
                            <span class="w-6 text-center text-xs font-black text-[var(--text-primary)]">{{ item.quantidade }}</span>
                            <button @click="alterar_quantidade_novo(indice, 'incrementar')" class="w-6 h-6 flex items-center justify-center text-[var(--text-primary)] hover:text-blue-500 font-black">+</button>
                        </div>
                        <button @click="remover_do_carrinho(indice)" class="text-[var(--text-muted)] hover:text-red-500 text-[10px] uppercase font-black tracking-widest px-2 transition-colors">
                            Remover
                        </button>
                    </div>
                </div>

            </div>

            <div v-show="carrinho_expandido || true" class="p-5 md:p-6 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] shrink-0 pb-safe z-30 md:!block" :class="!carrinho_expandido ? 'hidden md:block' : 'block'">
                <div class="flex justify-between items-center mb-3">
                    <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Subtotal:</span>
                    <span class="text-sm font-black text-[var(--text-primary)]">R$ {{ subtotal_comanda.toFixed(2) }}</span>
                </div>
                
                <div v-if="!id_comanda_vinculada" class="flex justify-between items-center mb-4 pb-4 border-b border-[var(--border-subtle)]">
                    <span class="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                        <span>🏷️</span> Desconto (R$):
                    </span>
                    <input type="number" v-model="valor_desconto" min="0" step="0.01" placeholder="0.00" class="w-24 p-2 text-right bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-lg outline-none focus:border-orange-500 text-sm font-black text-orange-500 transition-colors placeholder:text-[var(--text-muted)]">
                </div>

                <div class="flex justify-between items-center mb-4">
                    <span class="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest">Total a Pagar:</span>
                    <span class="text-2xl md:text-3xl font-black text-nitec_blue tracking-tighter" :class="valor_desconto > 0 ? 'text-green-500' : ''">
                        R$ {{ valor_final_comanda.toFixed(2) }}
                    </span>
                </div>
                
                <button @click="processar_acao_principal" :disabled="processando_finalizacao" :class="id_comanda_pagamento ? 'bg-green-600 hover:bg-green-500' : 'bg-nitec_blue hover:bg-blue-500'" class="w-full text-white font-black text-sm py-4 rounded-xl shadow-md transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10">
                    <template v-if="processando_finalizacao">
                        <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        A PROCESSAR...
                    </template>
                    <template v-else>
                        <template v-if="id_comanda_pagamento"><span>💳</span> Confirmar Pagamento</template>
                        <template v-else-if="id_comanda_vinculada"><span>📥</span> Atualizar Comanda</template>
                        <template v-else><span>💸</span> Venda Balcão</template>
                    </template>
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
    carrinho_venda, itens_ja_lancados, alterar_quantidade_db, remover_item_db, processando_finalizacao,
    adicionar_ao_carrinho, remover_do_carrinho, 
    subtotal_comanda, valor_final_comanda, valor_desconto, alterar_quantidade_novo,
    id_comanda_vinculada, id_comanda_pagamento, carrinho_expandido, processar_acao_principal, voltar_painel,
} = useLogicaPdv();
</script>

<style scoped>
.pb-safe { padding-bottom: max(1.25rem, env(safe-area-inset-bottom)); }
.line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
</style>