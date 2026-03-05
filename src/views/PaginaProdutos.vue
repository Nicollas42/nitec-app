<template>
    <div class="pagina_produtos p-8 bg-gray-100 min-h-screen font-sans">
        <header class="cabecalho_pagina flex justify-between items-center mb-8 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div>
                <h1 class="titulo_pagina text-2xl font-black text-gray-800 uppercase tracking-tight">Gestão de Produtos</h1>
                <p class="subtitulo_pagina text-sm text-gray-500">Adicione itens para o seu PDV</p>
            </div>
            <button @click="voltar_painel" class="botao_voltar bg-gray-800 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md">
                ⬅ Voltar ao Painel
            </button>
        </header>

        <div class="grelha_conteudo grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <section class="secao_formulario col-span-1 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 class="titulo_secao text-xl font-black mb-6 text-blue-600 border-b pb-2">Novo Produto</h2>
                
                <form @submit.prevent="cadastrar_novo_produto" class="formulario_produto flex flex-col gap-5">
                    
                    <div class="grupo_input">
                        <label class="rotulo block text-sm font-bold text-gray-700 mb-1">Código de Barras (Opcional)</label>
                        <input v-model="formulario_dados.codigo_barras" type="text" placeholder="Ex: 7891234567890" class="campo_texto w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono text-sm">
                    </div>

                    <div class="grupo_input">
                        <label class="rotulo block text-sm font-bold text-gray-700 mb-1">Nome do Produto</label>
                        <input v-model="formulario_dados.nome_produto" type="text" placeholder="Ex: Teclado Mecânico" class="campo_texto w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600" required>
                    </div>

                    <div class="grupo_input">
                        <label class="rotulo block text-sm font-bold text-gray-700 mb-1">Preço de Venda (R$)</label>
                        <input v-model="formulario_dados.preco_venda" type="number" step="0.01" placeholder="0.00" class="campo_texto w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600" required>
                    </div>

                    <div class="grupo_input">
                        <label class="rotulo block text-sm font-bold text-gray-700 mb-1">Stock Inicial</label>
                        <input v-model="formulario_dados.estoque_atual" type="number" placeholder="0" class="campo_texto w-full p-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600" required>
                    </div>

                    <button type="submit" class="botao_salvar mt-4 bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg transform active:scale-95">
                        CADASTRAR PRODUTO
                    </button>
                </form>
            </section>

            <section class="secao_lista col-span-2 bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                <h2 class="titulo_secao text-xl font-black mb-6 text-gray-800 border-b pb-2">Itens em Stock</h2>
                
                <div class="tabela_container overflow-x-auto">
                    <table class="tabela_produtos w-full text-left border-collapse">
                        <thead>
                            <tr class="cabecalho_tabela bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                                <th class="p-4 font-bold rounded-tl-lg">Item</th>
                                <th class="p-4 font-bold">Cód. Barras</th>
                                <th class="p-4 font-bold">Preço</th>
                                <th class="p-4 font-bold rounded-tr-lg">Stock</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-if="!lista_produtos || lista_produtos.length === 0">
                                <td colspan="4" class="p-8 text-center text-gray-500 italic">Nenhum produto cadastrado ainda.</td>
                            </tr>
                            <tr v-for="produto in lista_produtos" :key="produto.id" class="linha_produto border-b hover:bg-blue-50 transition-colors">
                                <td class="p-4 font-semibold text-gray-800">{{ produto.nome_produto }}</td>
                                <td class="p-4 text-gray-500 font-mono text-xs">{{ produto.codigo_barras || 'N/A' }}</td>
                                <td class="p-4 text-green-600 font-bold">R$ {{ produto.preco_venda }}</td>
                                <td class="p-4">
                                    <span class="badge_stock bg-gray-200 text-gray-800 py-1 px-3 rounded-full text-xs font-black">{{ produto.estoque_atual }}</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { useLogicaProdutos } from './pagina_produtos_logica.js';
const { formulario_dados, lista_produtos, cadastrar_novo_produto, voltar_painel } = useLogicaProdutos();
</script>