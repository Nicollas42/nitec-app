<template>
    <div class="pagina_produtos p-6 md:p-8 bg-[var(--bg-page)] h-full overflow-y-auto font-sans flex flex-col relative transition-colors duration-300">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 shrink-0">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Gestão de Produtos</h1>
                <p class="text-sm text-[var(--text-muted)] mt-1">Catálogo de itens, categorização e controlo de estoque.</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button @click="voltar_painel" class="lg:hidden px-5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all flex-1 shadow-sm">
                    Voltar
                </button>
                
                <div class="flex items-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 w-full md:w-64 focus-within:border-nitec_blue transition-colors shadow-sm">
                    <span class="text-[var(--text-muted)] mr-2">🔍</span>
                    <input type="text" v-model="termo_pesquisa" placeholder="Buscar produto ou código..." class="bg-transparent text-xs font-bold outline-none text-[var(--text-primary)] w-full placeholder:font-medium placeholder:text-[var(--text-muted)]">
                </div>

                <button @click="abrir_modal_novo" class="px-6 py-2.5 bg-nitec_blue text-white rounded-xl hover:bg-blue-700 text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none">
                    <span>➕</span> Novo Produto
                </button>
            </div>
        </header>

        <main class="flex-1 bg-[var(--bg-card)] rounded-[2rem] shadow-sm border border-[var(--border-subtle)] overflow-hidden flex flex-col transition-colors duration-300">
            <div class="overflow-y-auto flex-1 custom-scrollbar">
                
                <!-- MOBILE CARDS -->
                <div class="md:hidden flex flex-col divide-y divide-[var(--border-subtle)]">
                    <div v-if="!produtos_filtrados || produtos_filtrados.length === 0" class="p-10 text-center text-[var(--text-muted)] font-medium italic">
                        Nenhum produto encontrado.
                    </div>
                    <div v-for="produto in produtos_filtrados" :key="'mob-'+produto.id" class="p-6 flex flex-col gap-4 hover:bg-[var(--bg-card-hover)] transition-colors">
                        <div class="flex justify-between items-start gap-4">
                            <div>
                                <h3 class="font-bold text-[var(--text-primary)] text-sm leading-tight">{{ produto.nome_produto }}</h3>
                                <p class="text-[10px] text-[var(--text-muted)] font-mono mt-1">{{ produto.codigo_barras || 'Sem código' }}</p>
                                <span class="inline-block mt-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{{ produto.categoria || 'Geral' }}</span>
                            </div>
                            <span v-if="produto.data_validade" class="px-2 py-1 text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded font-black uppercase tracking-widest whitespace-nowrap">
                                ⏳ {{ new Date(produto.data_validade).toLocaleDateString() }}
                            </span>
                        </div>
                        
                        <div class="flex justify-between items-end mt-2">
                            <div>
                                <p class="text-green-500 font-black text-sm">V: R$ {{ Number(produto.preco_venda).toFixed(2) }}</p>
                                <p class="text-red-400 font-bold text-[10px] mt-0.5 uppercase tracking-widest">C: {{ produto.preco_custo ? 'R$ ' + Number(produto.preco_custo).toFixed(2) : '—' }}</p>
                            </div>
                            <div class="text-right flex flex-col items-end">
                                <span class="py-1 px-3 rounded-md text-xs font-black border" 
                                      :class="produto.estoque_atual <= 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[var(--bg-page)] border-[var(--border-subtle)] text-[var(--text-primary)]'">
                                    {{ produto.estoque_atual }} un.
                                </span>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 mt-2 pt-4 border-t border-[var(--border-subtle)]">
                            <button @click="abrir_modal_edicao(produto)" class="flex-1 bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-[var(--border-subtle)] transition-colors shadow-sm">
                                ✏️ Editar
                            </button>
                            <button @click="abrir_modal_entrada(produto)" class="flex-1 bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-colors shadow-sm">
                                📦 Entrada
                            </button>
                            <button @click="abrir_modal_perda(produto)" class="flex-1 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 transition-colors shadow-sm">
                                📉 Baixa
                            </button>
                        </div>
                    </div>
                </div>

                <!-- DESKTOP TABLE -->
                <table class="w-full text-left whitespace-nowrap text-sm hidden md:table">
                    <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] sticky top-0 z-10 border-b border-[var(--border-subtle)]">
                        <tr>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider">Produto</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider">Categoria</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider">Preços</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider text-right">Estoque</th>
                            <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-wider text-right w-24">Ações</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)]">
                        <tr v-if="!produtos_filtrados || produtos_filtrados.length === 0">
                            <td colspan="5" class="p-10 text-center text-[var(--text-muted)] font-medium italic">Nenhum produto encontrado.</td>
                        </tr>
                        <tr v-for="produto in produtos_filtrados" :key="produto.id" class="hover:bg-[var(--bg-card-hover)] transition-colors group">
                            
                            <td class="py-4 px-6">
                                <div class="flex items-center gap-2">
                                    <p class="font-bold text-[var(--text-primary)]">{{ produto.nome_produto }}</p>
                                    <span v-if="produto.data_validade" class="px-2 py-0.5 text-[9px] bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded font-black uppercase tracking-widest" title="Data de Validade">
                                        ⏳ {{ new Date(produto.data_validade).toLocaleDateString() }}
                                    </span>
                                </div>
                                <p class="text-[10px] text-[var(--text-muted)] font-mono mt-0.5">{{ produto.codigo_barras || 'Sem código' }}</p>
                            </td>

                            <td class="py-4 px-6 text-[var(--text-muted)] font-medium text-[10px] uppercase tracking-widest">
                                <span class="bg-[var(--bg-page)] border border-[var(--border-subtle)] px-2 py-1 rounded-md">{{ produto.categoria || 'Geral' }}</span>
                            </td>
                            
                            <td class="py-4 px-6">
                                <p class="text-green-500 font-black">V: R$ {{ Number(produto.preco_venda).toFixed(2) }}</p>
                                <p class="text-red-400 font-bold text-[10px] mt-0.5 uppercase tracking-widest">C: {{ produto.preco_custo ? 'R$ ' + Number(produto.preco_custo).toFixed(2) : '—' }}</p>
                            </td>
                            
                            <td class="py-4 px-6 text-right">
                                <span class="text-[var(--text-primary)] py-1 px-3 rounded-md text-xs font-black border" 
                                      :class="produto.estoque_atual <= 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[var(--bg-page)] border-[var(--border-subtle)]'">
                                    {{ produto.estoque_atual }} un.
                                </span>
                            </td>

                            <td class="py-4 px-6 text-right">
                                <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button @click="abrir_modal_edicao(produto)" class="bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/10 h-8 w-8 rounded-xl text-xs flex items-center justify-center shadow-sm border border-[var(--border-subtle)] transition-colors" title="Editar Produto">
                                        ✏️
                                    </button>
                                    
                                    <button @click="abrir_modal_entrada(produto)" class="bg-blue-500/10 text-blue-500 hover:bg-blue-600 hover:text-white px-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-blue-500/20 transition-colors" title="Dar Entrada de Estoque">
                                        📦 Entrada
                                    </button>

                                    <button @click="abrir_modal_perda(produto)" class="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-3 h-8 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm border border-red-500/20 transition-colors" title="Registrar Baixa/Perda">
                                        📉 Baixa
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>

        <div v-if="modal_novo_produto" class="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
            <div class="bg-[var(--bg-card)] w-full max-w-lg p-6 rounded-[2rem] shadow-2xl overflow-y-auto max-h-[90vh] border-2 border-[var(--border-subtle)]">
                <div class="flex justify-between items-center mb-6">
                    <div>
                        <h2 class="text-lg font-black text-[var(--text-primary)]">{{ modo_edicao ? 'Editar Produto' : 'Novo Produto' }}</h2>
                        <p class="text-xs text-[var(--text-muted)] font-bold mt-1">Catálogo e controlo de estoque.</p>
                    </div>
                    <button @click="modal_novo_produto = false" class="text-[var(--text-muted)] hover:text-red-500 font-bold text-2xl leading-none bg-[var(--bg-page)] h-8 w-8 rounded-full flex items-center justify-center transition-colors">&times;</button>
                </div>
                
                <form @submit.prevent="salvar_produto" class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome do Produto</label>
                        <input v-model="formulario_dados.nome_produto" type="text" placeholder="Ex: Cerveja Artesanal IPA" class="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl outline-none focus:border-nitec_blue transition-colors text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" required>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Categoria (BI)</label>
                            <select v-model="formulario_dados.categoria" class="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl outline-none focus:border-nitec_blue transition-colors text-sm font-bold text-[var(--text-primary)]">
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
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Código de Barras</label>
                            <input v-model="formulario_dados.codigo_barras" type="text" placeholder="Opcional" class="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl outline-none focus:border-nitec_blue transition-colors font-mono text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]">
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-4 mt-2">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Preço Custo (R$)</label>
                            <input v-model="formulario_dados.preco_custo" type="number" step="0.01" placeholder="0.00" class="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-xl outline-none focus:border-red-500 transition-colors text-sm font-black text-red-500 placeholder:text-red-500/50">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Preço Venda (R$)</label>
                            <input v-model="formulario_dados.preco_venda" type="number" step="0.01" placeholder="0.00" class="w-full p-3 bg-green-500/5 border border-green-500/20 rounded-xl outline-none focus:border-green-500 transition-colors text-sm font-black text-green-500 placeholder:text-green-500/50" required>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-4 border-t border-[var(--border-subtle)] pt-4">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Estoque Físico</label>
                            <input v-model="formulario_dados.estoque_atual" type="number" placeholder="0" class="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl outline-none focus:border-nitec_blue transition-colors text-sm font-black text-[var(--text-primary)] placeholder:text-[var(--text-muted)]" required>
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-1">Validade <span class="text-orange-500">(Opcional)</span></label>
                            <input v-model="formulario_dados.data_validade" type="date" class="w-full p-3 bg-orange-500/5 border border-orange-500/20 rounded-xl outline-none focus:border-orange-500 transition-colors text-sm font-black text-orange-500 cursor-pointer">
                        </div>
                    </div>
                    
                    <div class="flex gap-3 mt-4">
                        <button type="button" @click="modal_novo_produto = false" class="flex-1 py-3.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-widest rounded-xl font-black text-[10px] hover:text-[var(--text-primary)] transition-colors shadow-sm">Cancelar</button>
                        <button type="submit" :disabled="salvando" class="flex-[2] py-3.5 bg-nitec_blue hover:bg-blue-700 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all disabled:opacity-50">
                            {{ salvando ? 'A Gravar...' : (modo_edicao ? 'Salvar Alterações' : 'Salvar e Catalogar') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="modal_perda" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div class="bg-[var(--bg-card)] rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 border-2 border-red-500/20">
                <div class="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 border-2 border-red-500/20 flex items-center justify-center mb-4 shadow-inner text-2xl">
                    📉
                </div>
                
                <h2 class="text-xl font-black text-center text-[var(--text-primary)] tracking-tight">Registrar Baixa</h2>
                <p class="text-center text-xs text-[var(--text-muted)] font-bold mt-1 bg-[var(--bg-page)] p-2 rounded-lg border border-[var(--border-subtle)]">{{ formulario_perda.nome_produto }}</p>
                
                <div class="mt-6 flex flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Quantidade Perdida</label>
                        <input v-model="formulario_perda.quantidade" type="number" min="1" class="w-full p-3 bg-red-500/5 border border-red-500/20 rounded-xl outline-none focus:border-red-500 transition-colors text-center text-lg font-black text-red-500">
                    </div>
                    
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Motivo da Baixa</label>
                        <select v-model="formulario_perda.motivo" class="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl outline-none focus:border-red-500 transition-colors text-sm font-bold text-[var(--text-primary)]">
                            <option value="Quebra / Dano">💥 Quebra / Dano</option>
                            <option value="Vencimento / Estragou">⏳ Vencimento / Estragou</option>
                            <option value="Consumo Interno (Staff)">🍽️ Consumo Interno (Staff)</option>
                            <option value="Perda por Erro de Cozinha">🔥 Erro na Cozinha</option>
                        </select>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-8 w-full">
                    <button @click="modal_perda = false" class="flex-1 py-3.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)] rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-[var(--text-primary)] transition-colors">
                        Cancelar
                    </button>
                    <button @click="registrar_perda" :disabled="registrando_perda" class="flex-1 py-3.5 bg-red-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50">
                        {{ registrando_perda ? 'Aguarde...' : 'Confirmar Baixa' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="modal_entrada" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div class="bg-[var(--bg-card)] rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col p-8 border-2 border-blue-500/20">
                <div class="mx-auto w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 border-2 border-blue-500/20 flex items-center justify-center mb-4 shadow-inner text-2xl">
                    📦
                </div>
                
                <h2 class="text-xl font-black text-center text-[var(--text-primary)] tracking-tight">Nova Compra / Entrada</h2>
                <p class="text-center text-xs text-[var(--text-muted)] font-bold mt-1 bg-[var(--bg-page)] p-2 rounded-lg border border-[var(--border-subtle)]">{{ formulario_entrada.nome_produto }}</p>
                
                <div class="mt-6 flex flex-col gap-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Qtd. Recebida</label>
                            <input v-model="formulario_entrada.quantidade" type="number" min="1" class="w-full p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-black text-blue-500">
                        </div>
                        <div class="flex flex-col gap-1">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Custo UN (R$)</label>
                            <input v-model="formulario_entrada.custo_unitario" type="number" step="0.01" class="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg font-black text-[var(--text-primary)] placeholder:text-[var(--text-muted)]">
                        </div>
                    </div>
                    
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fornecedor (Opcional)</label>
                        <input v-model="formulario_entrada.fornecedor" type="text" placeholder="Ex: Ambev, Atacadão..." class="w-full p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm font-bold text-[var(--text-primary)] placeholder:text-[var(--text-muted)]">
                    </div>
                </div>
                
                <div class="flex gap-3 mt-8 w-full">
                    <button @click="modal_entrada = false" class="flex-1 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)] rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-[var(--text-primary)] transition-colors">
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