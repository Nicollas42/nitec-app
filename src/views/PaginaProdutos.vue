<template>
    <div class="pagina_produtos p-6 md:p-8 bg-gray-50 h-full overflow-y-auto font-sans flex flex-col relative">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 shrink-0">
            <div>
                <h1 class="text-2xl font-black text-gray-800 tracking-tight">Gestão de Produtos</h1>
                <p class="text-sm text-gray-500 mt-1">Catálogo de itens, categorização e controlo de estoque.</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button @click="voltar_painel" class="lg:hidden px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-xs font-black uppercase tracking-widest transition-all flex-1">
                    Voltar
                </button>
                
                <div class="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-64 focus-within:border-blue-400 transition-colors shadow-sm">
                    <span class="text-gray-400 mr-2">🔍</span>
                    <input type="text" v-model="termo_pesquisa" placeholder="Buscar produto ou código..." class="bg-transparent text-xs font-bold outline-none text-gray-700 w-full placeholder:font-medium">
                </div>

                <button @click="abrir_modal_novo" class="px-6 py-2.5 bg-nitec_blue text-white rounded-xl hover:bg-blue-700 text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none">
                    <span>➕</span> Novo Produto
                </button>
            </div>
        </header>

        <main class="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div class="overflow-x-auto flex-1">
                <table class="w-full text-left whitespace-nowrap text-sm">
                    <thead class="bg-gray-50 text-gray-500 sticky top-0 z-10 border-b border-gray-100">
                        <tr>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider">Produto</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider">Categoria</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider">Preços</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider text-right">Estoque</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider text-right w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-if="!produtos_filtrados || produtos_filtrados.length === 0">
                            <td colspan="5" class="p-10 text-center text-gray-400 font-medium italic">Nenhum produto encontrado.</td>
                        </tr>
                        <tr v-for="produto in produtos_filtrados" :key="produto.id" class="hover:bg-gray-50 transition-colors group">
                            
                            <td class="py-4 px-6">
                                <div class="flex items-center gap-2">
                                    <p class="font-bold text-gray-800">{{ produto.nome_produto }}</p>
                                    <span v-if="produto.data_validade" class="px-2 py-0.5 text-[9px] bg-orange-100 text-orange-700 rounded font-black uppercase tracking-widest" title="Data de Validade">
                                        ⏳ {{ new Date(produto.data_validade).toLocaleDateString() }}
                                    </span>
                                </div>
                                <p class="text-[10px] text-gray-400 font-mono mt-0.5">{{ produto.codigo_barras || 'Sem código' }}</p>
                            </td>

                            <td class="py-4 px-6 text-gray-600 font-medium text-[10px] uppercase tracking-widest">
                                <span class="bg-gray-100 border border-gray-200 px-2 py-1 rounded-md">{{ produto.categoria || 'Geral' }}</span>
                            </td>
                            
                            <td class="py-4 px-6">
                                <p class="text-green-600 font-black">V: R$ {{ Number(produto.preco_venda).toFixed(2) }}</p>
                                <p class="text-red-400 font-bold text-[10px] mt-0.5 uppercase tracking-widest">C: {{ produto.preco_custo ? 'R$ ' + Number(produto.preco_custo).toFixed(2) : '—' }}</p>
                            </td>
                            
                            <td class="py-4 px-6 text-right">
                                <span class="text-gray-700 py-1 px-3 rounded-md text-xs font-black border" 
                                      :class="produto.estoque_atual <= 0 ? 'bg-red-50 border-red-200 text-red-600' : 'bg-gray-100 border-gray-200'">
                                    {{ produto.estoque_atual }} un.
                                </span>
                            </td>

                            <td class="py-4 px-6 text-right">
                                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button @click="abrir_modal_edicao(produto)" class="bg-white text-gray-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 h-8 w-8 rounded-xl text-xs flex items-center justify-center shadow-sm border border-gray-200 transition-colors" title="Editar Produto">
                                        ✏️
                                    </button>
                                    
                                    <button @click="abrir_modal_entrada(produto)" class="bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white px-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-blue-100 transition-colors" title="Dar Entrada de Estoque">
                                        📦 Entrada
                                    </button>

                                    <button @click="abrir_modal_perda(produto)" class="bg-red-50 text-red-500 hover:bg-red-500 hover:text-white px-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-red-100 transition-colors" title="Registrar Baixa/Perda">
                                        📉 Baixa
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>

        <div v-if="modal_novo_produto" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div class="bg-white w-full max-w-lg p-6 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh]">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-lg font-black text-gray-800">{{ modo_edicao ? 'Editar Produto' : 'Novo Produto' }}</h2>
                        <p class="text-xs text-gray-500 font-bold mt-1">Catálogo e controlo de estoque.</p>
                    </div>
                    <button @click="modal_novo_produto = false" class="text-gray-400 hover:text-red-500 font-bold text-2xl leading-none bg-gray-50 h-8 w-8 rounded-full flex items-center justify-center transition-colors">&times;</button>
                </div>
                
                <form @submit.prevent="salvar_produto" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Nome do Produto</label>
                        <input v-model="formulario_dados.nome_produto" type="text" placeholder="Ex: Cerveja Artesanal IPA" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold text-gray-800" required>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Categoria (BI)</label>
                            <select v-model="formulario_dados.categoria" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-bold text-gray-700">
                                <option value="Geral">Geral</option>
                                <option value="Bebidas (Não Alcoólicas)">Bebidas (Não Alcoólicas)</option>
                                <option value="Bebidas (Alcoólicas)">Bebidas (Alcoólicas)</option>
                                <option value="Pratos Principais">Pratos Principais</option>
                                <option value="Entradas / Petiscos">Entradas / Petiscos</option>
                                <option value="Sobremesas">Sobremesas</option>
                                <option value="Porções Extras">Porções Extras</option>
                            </select>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Código de Barras</label>
                            <input v-model="formulario_dados.codigo_barras" type="text" placeholder="Opcional" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors font-mono text-sm font-bold text-gray-600">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 mt-2">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Preço Custo (R$)</label>
                            <input v-model="formulario_dados.preco_custo" type="number" step="0.01" placeholder="0.00" class="w-full p-3 bg-red-50 border border-red-200 rounded-xl outline-none focus:border-red-400 transition-colors text-sm font-black text-red-700">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Preço Venda (R$)</label>
                            <input v-model="formulario_dados.preco_venda" type="number" step="0.01" placeholder="0.00" class="w-full p-3 bg-green-50 border border-green-200 rounded-xl outline-none focus:border-green-400 transition-colors text-sm font-black text-green-700" required>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Estoque Físico</label>
                            <input v-model="formulario_dados.estoque_atual" type="number" placeholder="0" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-blue-500 transition-colors text-sm font-black text-gray-800" required>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-1">Validade <span class="text-orange-500">(Opcional)</span></label>
                            <input v-model="formulario_dados.data_validade" type="date" class="w-full p-3 bg-orange-50 border border-orange-200 rounded-xl outline-none focus:border-orange-400 transition-colors text-sm font-black text-orange-800 cursor-pointer">
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-4">
                        <button type="button" @click="modal_novo_produto = false" class="flex-1 py-3.5 bg-gray-100 border border-gray-200 text-gray-500 uppercase tracking-widest rounded-xl font-black text-[10px] hover:bg-gray-200 transition-colors shadow-sm">Cancelar</button>
                        <button type="submit" :disabled="salvando" class="flex-[2] py-3.5 bg-nitec_blue hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all disabled:opacity-50">
                            {{ salvando ? 'A Gravar...' : (modo_edicao ? 'Salvar Alterações' : 'Salvar e Catalogar') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="modal_perda" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 border-2 border-red-100">
                <div class="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-500 border-2 border-red-100 flex items-center justify-center mb-4 shadow-inner text-2xl">
                    📉
                </div>
                
                <h2 class="text-xl font-black text-center text-gray-800 tracking-tight">Registrar Baixa</h2>
                <p class="text-center text-xs text-gray-500 font-bold mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100">{{ formulario_perda.nome_produto }}</p>
                
                <div class="mt-6 flex flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Quantidade Perdida</label>
                        <input v-model="formulario_perda.quantidade" type="number" min="1" class="w-full p-3 bg-red-50 border border-red-200 rounded-xl outline-none focus:border-red-400 transition-colors text-center text-lg font-black text-red-700">
                    </div>
                    
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Motivo da Baixa</label>
                        <select v-model="formulario_perda.motivo" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-red-400 transition-colors text-sm font-bold text-gray-700">
                            <option value="Quebra / Dano">💥 Quebra / Dano</option>
                            <option value="Vencimento / Estragou">⏳ Vencimento / Estragou</option>
                            <option value="Consumo Interno (Staff)">🍽️ Consumo Interno (Staff)</option>
                            <option value="Perda por Erro de Cozinha">🔥 Erro na Cozinha</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-8 w-full">
                    <button @click="modal_perda = false" class="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button @click="registrar_perda" :disabled="registrando_perda" class="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50">
                        {{ registrando_perda ? 'Aguarde...' : 'Confirmar Baixa' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="modal_entrada" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 border-2 border-blue-100">
                <div class="mx-auto w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 border-2 border-blue-100 flex items-center justify-center mb-4 shadow-inner text-2xl">
                    📦
                </div>
                
                <h2 class="text-xl font-black text-center text-gray-800 tracking-tight">Nova Compra / Entrada</h2>
                <p class="text-center text-xs text-gray-500 font-bold mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100">{{ formulario_entrada.nome_produto }}</p>
                
                <div class="mt-6 flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Qtd. Recebida</label>
                            <input v-model="formulario_entrada.quantidade" type="number" min="1" class="w-full p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-black text-blue-700">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Custo UN (R$)</label>
                            <input v-model="formulario_entrada.custo_unitario" type="number" step="0.01" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-black text-gray-800">
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Fornecedor (Opcional)</label>
                        <input v-model="formulario_entrada.fornecedor" type="text" placeholder="Ex: Ambev, Atacadão..." class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-gray-700">
                    </div>
                </div>
                
                <div class="flex gap-3 mt-8 w-full">
                    <button @click="modal_entrada = false" class="flex-1 py-3 bg-gray-100 text-gray-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors">
                        Cancelar
                    </button>
                    <button @click="registrar_entrada" :disabled="registrando_entrada" class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50">
                        {{ registrando_entrada ? 'Aguarde...' : 'Lançar Estoque' }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaProdutos } from './pagina_produtos_logica.js';
const { 
    produtos_filtrados, termo_pesquisa, voltar_painel,
    modal_novo_produto, formulario_dados, salvar_produto, salvando, modo_edicao,
    abrir_modal_novo, abrir_modal_edicao,
    modal_perda, formulario_perda, abrir_modal_perda, registrar_perda, registrando_perda 
} = useLogicaProdutos();
</script>