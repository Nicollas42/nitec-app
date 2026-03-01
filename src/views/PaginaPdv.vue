<template>
    <div class="tela_pdv_layout flex h-screen bg-gray-100 font-sans overflow-hidden">
        
        <section class="area_catalogo w-2/3 p-6 flex flex-col">
            <header class="cabecalho_catalogo flex justify-between items-center mb-6">
                <h1 class="titulo_pdv text-2xl font-black text-gray-800 uppercase tracking-tighter">Terminal de Vendas</h1>
                <button @click="voltar_painel" class="botao_voltar bg-gray-800 text-white px-5 py-2 rounded-lg font-bold shadow hover:bg-black transition-all">Voltar</button>
            </header>

            <div class="grelha_itens grid grid-cols-3 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-10">
                <button 
                    v-for="produto in lista_produtos" 
                    :key="produto.id" 
                    @click="adicionar_ao_carrinho(produto)" 
                    class="cartao_venda bg-white p-5 rounded-2xl shadow-sm border border-gray-200 hover:border-blue-500 hover:shadow-lg transition-all flex flex-col items-center transform active:scale-95">
                    
                    <span class="nome_item text-sm font-bold text-gray-700 text-center mb-3 leading-tight h-10 overflow-hidden">{{ produto.nome_produto }}</span>
                    <span class="preco_item text-xl font-black text-green-600">R$ {{ produto.preco_venda }}</span>
                    <span class="estoque_item text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-widest">Estoque: {{ produto.estoque_atual }}</span>
                </button>
            </div>
        </section>

        <section class="area_comanda w-1/3 bg-white border-l border-gray-300 shadow-2xl flex flex-col z-10">
            <div class="cabecalho_comanda bg-gray-900 text-white p-5 text-center shadow-md">
                <h2 class="titulo_comanda text-lg font-bold uppercase tracking-widest">Comanda Atual</h2>
            </div>

            <div class="lista_carrinho flex-1 overflow-y-auto p-5 flex flex-col gap-4">
                <div v-if="carrinho_venda.length === 0" class="carrinho_vazio flex flex-col items-center justify-center h-full text-gray-400">
                    <span class="text-4xl mb-2 opacity-50">🛒</span>
                    <p class="italic text-sm">Comanda vazia...</p>
                </div>
                
                <div v-for="(item, indice) in carrinho_venda" :key="indice" class="linha_comanda flex justify-between items-center border-b border-gray-100 pb-3">
                    <div class="dados_item">
                        <p class="nome text-sm font-bold text-gray-800">{{ item.nome_produto }}</p>
                        <p class="preco_unitario text-xs text-gray-500 font-semibold">{{ item.quantidade }}x R$ {{ item.preco_venda }}</p>
                    </div>
                    <div class="acoes_item flex items-center gap-4">
                        <span class="subtotal_item text-sm font-black text-gray-800">R$ {{ (item.quantidade * item.preco_venda).toFixed(2) }}</span>
                        <button @click="remover_do_carrinho(indice)" class="botao_remover bg-red-100 text-red-600 hover:bg-red-500 hover:text-white w-8 h-8 rounded-full font-black transition-colors flex items-center justify-center">×</button>
                    </div>
                </div>
            </div>

            <div class="rodape_cobranca p-6 bg-gray-50 border-t border-gray-200">
                <div class="caixa_total flex justify-between items-center mb-6">
                    <span class="rotulo_total text-lg font-bold text-gray-500 uppercase">Total:</span>
                    <span class="valor_total text-4xl font-black text-blue-600 tracking-tighter">R$ {{ valor_total_comanda.toFixed(2) }}</span>
                </div>
                
                <button @click="processar_acao_principal" class="botao_finalizar_venda w-full bg-green-500 hover:bg-green-600 text-white font-black text-xl py-5 rounded-xl shadow-xl transition-all active:scale-95 uppercase tracking-widest flex items-center justify-center gap-3">
                    <span>{{ id_comanda_vinculada ? '📥 Lançar na Comanda' : '💸 Cobrar Venda' }}</span>
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
    id_comanda_vinculada, processar_acao_principal, voltar_painel 
} = useLogicaPdv();
</script>