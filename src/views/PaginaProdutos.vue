<template>
    <div class="pagina_produtos p-6 md:p-8 bg-gray-50 h-full overflow-y-auto font-sans flex flex-col relative">
        
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
            <div>
                <h1 class="text-2xl font-black text-gray-800 tracking-tight">Gestão de Produtos</h1>
                <p class="text-sm text-gray-500 mt-1">Catálogo de itens, categorização e controlo de estoque.</p>
            </div>
            <div class="flex gap-3 w-full md:w-auto">
                <button @click="voltar_painel" class="md:hidden px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-bold transition-all flex-1">
                    Voltar
                </button>
                <button @click="modal_novo_produto = true" class="px-5 py-2.5 bg-nitec_blue text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none">
                    <span>➕</span> Novo Produto
                </button>
            </div>
        </header>

        <main class="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div class="overflow-x-auto flex-1">
                <table class="w-full text-left whitespace-nowrap text-sm">
                    <thead class="bg-gray-50 text-gray-500 sticky top-0 z-10 border-b border-gray-100">
                        <tr>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Produto</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Categoria</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Preço Venda</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider hidden md:table-cell">Preço Custo</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-right">Estoque</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-if="!lista_produtos || lista_produtos.length === 0">
                            <td colspan="5" class="p-10 text-center text-gray-400 font-medium italic">Nenhum produto cadastrado no catálogo.</td>
                        </tr>
                        <tr v-for="produto in lista_produtos" :key="produto.id" class="hover:bg-gray-50 transition-colors group">
                            <td class="py-4 px-6">
                                <p class="font-bold text-gray-800">{{ produto.nome_produto }}</p>
                                <p class="text-xs text-gray-400 font-mono mt-0.5">{{ produto.codigo_barras || 'Sem código' }}</p>
                            </td>
                            <td class="py-4 px-6 text-gray-600 font-medium text-xs">
                                <span class="bg-gray-100 px-2 py-1 rounded-md">{{ produto.categoria || 'Geral' }}</span>
                            </td>
                            <td class="py-4 px-6 text-green-600 font-black">R$ {{ produto.preco_venda }}</td>
                            <td class="py-4 px-6 text-red-500 font-bold hidden md:table-cell">
                                {{ produto.preco_custo ? 'R$ ' + produto.preco_custo : '—' }}
                            </td>
                            <td class="py-4 px-6 text-right">
                                <span class="bg-gray-100 text-gray-700 py-1 px-3 rounded-md text-xs font-black border border-gray-200">{{ produto.estoque_atual }}</span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>

        <div v-if="modal_novo_produto" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div class="bg-white w-full max-w-lg p-6 rounded-3xl shadow-2xl overflow-y-auto max-h-[90vh]">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-lg font-black text-gray-800">Novo Produto</h2>
                        <p class="text-xs text-gray-500">Cadastro completo com Categorização (BI).</p>
                    </div>
                    <button @click="modal_novo_produto = false" class="text-gray-400 hover:text-red-500 font-bold text-2xl leading-none">&times;</button>
                </div>
                
                <form @submit.prevent="cadastrar_novo_produto" class="flex flex-col gap-4">
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1 md:col-span-2">
                            <label class="text-xs font-bold text-gray-600">Nome do Produto</label>
                            <input v-model="formulario_dados.nome_produto" type="text" placeholder="Ex: Cerveja Artesanal IPA" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" required>
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-gray-600">Código de Barras</label>
                            <input v-model="formulario_dados.codigo_barras" type="text" placeholder="Ex: 7891234567890" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm">
                        </div>

                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-gray-600">Categoria (BI)</label>
                            <select v-model="formulario_dados.categoria" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700 appearance-none">
                                <option value="Geral">Geral</option>
                                <option value="Bebidas (Não Alcoólicas)">Bebidas (Não Alcoólicas)</option>
                                <option value="Bebidas (Alcoólicas)">Bebidas (Alcoólicas)</option>
                                <option value="Pratos Principais">Pratos Principais</option>
                                <option value="Entradas / Petiscos">Entradas / Petiscos</option>
                                <option value="Sobremesas">Sobremesas</option>
                                <option value="Porções Extras">Porções Extras</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 border-t border-gray-100 pt-4 mt-2">
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-gray-600">Preço Custo</label>
                            <input v-model="formulario_dados.preco_custo" type="number" step="0.01" placeholder="0.00" class="w-full p-3 bg-red-50 border border-red-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-red-700">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-gray-600">Preço Venda</label>
                            <input v-model="formulario_dados.preco_venda" type="number" step="0.01" placeholder="0.00" class="w-full p-3 bg-green-50 border border-green-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm font-bold text-green-700" required>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-bold text-gray-600">Estoque</label>
                            <input v-model="formulario_dados.estoque_atual" type="number" placeholder="0" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold" required>
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-4">
                        <button type="button" @click="modal_novo_produto = false" class="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors shadow-sm">Cancelar</button>
                        <button type="submit" class="flex-[2] py-3 bg-nitec_blue hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all text-sm">Salvar e Catalogar</button>
                    </div>
                </form>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaProdutos } from './pagina_produtos_logica.js';
const { formulario_dados, lista_produtos, cadastrar_novo_produto, voltar_painel, modal_novo_produto } = useLogicaProdutos();
</script>