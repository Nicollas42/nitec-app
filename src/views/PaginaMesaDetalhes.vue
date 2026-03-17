<template>
    <div class="tela_detalhes_mesa p-6 md:p-8 bg-[var(--bg-page)] h-full font-sans flex flex-col relative overflow-y-auto transition-colors duration-300">
        
        <div v-if="dados_mesa" class="conteudo_mesa flex flex-col h-full max-w-7xl mx-auto w-full">
            
            <header class="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-subtle)] mb-8 gap-4 transition-colors duration-300">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 text-2xl font-black shadow-inner">
                        {{ dados_mesa.nome_mesa.charAt(0) }}
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">{{ dados_mesa.nome_mesa }}</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                            <p class="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Em Atendimento</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 w-full md:w-auto">
                    <button @click="voltar_mapa" class="flex-1 md:flex-none px-6 py-3 bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all">
                        Voltar
                    </button>
                    <button @click="adicionar_novo_cliente" class="flex-1 md:flex-none px-6 py-3 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 text-xs font-black uppercase tracking-widest transition-all shadow-sm">
                        ➕ Sub-Comanda
                    </button>
                </div>
            </header>

            <main class="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start pb-6">
                
                <article v-for="comanda in dados_mesa.listar_comandas" :key="comanda.id" 
                         class="bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col relative group transition-colors duration-300">
                    
                    <div class="flex justify-between items-start mb-6 border-b border-dashed border-[var(--border-subtle)] pb-5">
                        <div>
                            <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border mb-2 inline-block" 
                                  :class="comanda.tipo_conta === 'geral' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'">
                                CMD #{{ comanda.id }} • {{ comanda.tipo_conta === 'geral' ? 'Principal' : 'Individual' }}
                            </span>
                            <p class="text-sm text-[var(--text-muted)] mt-1 font-medium">
                                Cliente: <span class="font-black text-[var(--text-primary)]">{{ comanda.buscar_cliente?.nome_cliente || 'Não informado' }}</span>
                            </p>
                        </div>

                        <button @click="abrir_modal_cancelamento(comanda.id)" class="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 h-10 w-10 rounded-xl flex items-center justify-center transition-colors text-lg" title="Cancelar Comanda inteira">
                            🗑️
                        </button>
                    </div>

                    <div class="mb-6 flex flex-col gap-3">
                        <div class="flex items-end justify-between bg-[var(--bg-page)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-inner">
                            <span class="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Total a Pagar</span>
                            <span class="text-3xl font-black text-[var(--text-primary)] tracking-tighter">R$ {{ Number(comanda.valor_total).toFixed(2) }}</span>
                        </div>
                        
                        <div class="flex gap-2">
                            <button @click="abrir_pdv_para_comanda(comanda.id)" class="flex-1 bg-nitec_blue hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-md text-[10px] flex justify-center items-center gap-2 active:scale-95">
                                <span class="text-sm">➕</span> Adicionar Produto
                            </button>
                            <button @click="fechar_conta_comanda(comanda.id)" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-md text-[10px] flex justify-center items-center gap-2 active:scale-95">
                                <span class="text-sm">💳</span> Cobrar Conta
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto max-h-72 custom-scrollbar pr-2">
                        <h3 class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Itens Lançados ({{ comanda.listar_itens.length }})</h3>
                        
                        <div v-if="comanda.listar_itens.length === 0" class="text-center py-6 bg-[var(--bg-page)] rounded-2xl border border-dashed border-[var(--border-subtle)]">
                            <p class="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Comanda Vazia</p>
                        </div>

                        <div v-for="item in comanda.listar_itens" :key="item.id" 
                             class="flex flex-col p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-blue-500/50 rounded-2xl mb-2 transition-all relative"
                             :class="{'opacity-50 pointer-events-none grayscale': item_processando === item.id}">
                            
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex flex-col">
                                    <span class="font-black text-[var(--text-primary)] text-sm leading-tight">{{ item.buscar_produto.nome_produto }}</span>
                                    <span class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">R$ {{ Number(item.preco_unitario).toFixed(2) }} unid.</span>
                                </div>
                                <span class="font-black text-[var(--text-primary)] text-base tracking-tight">R$ {{ (item.quantidade * item.preco_unitario).toFixed(2) }}</span>
                            </div>
                            
                            <div class="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border-subtle)]">
                                <div class="flex items-center bg-[var(--bg-page)] rounded-lg p-1 border border-[var(--border-subtle)]">
                                    <button @click="alterar_quantidade(item.id, 'decrementar')" class="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded-md shadow-sm text-[var(--text-primary)] hover:text-red-500 font-black text-lg hover:border-red-500/50 border border-transparent transition-all">-</button>
                                    <span class="w-10 text-center text-sm font-black text-[var(--text-primary)]">{{ item.quantidade }}</span>
                                    <button @click="alterar_quantidade(item.id, 'incrementar')" class="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded-md shadow-sm text-[var(--text-primary)] hover:text-blue-500 font-black text-lg hover:border-blue-500/50 border border-transparent transition-all">+</button>
                                </div>
                                <button @click="remover_item_consumido(item.id)" class="text-[var(--text-muted)] hover:text-red-500 bg-[var(--bg-page)] hover:bg-red-500/10 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-500/30 transition-all">
                                    Remover
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </main>
        </div>

        <div v-if="modal_cliente_visivel" class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-[var(--bg-card)] w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-[var(--border-subtle)]">
                <div class="mb-6 text-center">
                    <div class="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">👥</div>
                    <h2 class="text-xl font-black text-[var(--text-primary)]">Nova Sub-Comanda</h2>
                    <p class="text-xs text-[var(--text-muted)] mt-1 font-medium">Separar a conta para um novo cliente nesta mesa.</p>
                </div>
                <div class="flex flex-col gap-4">
                    <input v-model="input_novo_cliente" type="text" placeholder="Nome do Cliente (Ex: Maria)" class="w-full p-4 bg-[var(--bg-page)] border-2 border-[var(--border-subtle)] rounded-2xl outline-none focus:border-purple-500 text-sm font-bold text-center text-[var(--text-primary)] transition-colors" @keyup.enter="confirmar_novo_cliente" autofocus>
                    <div class="flex gap-3 mt-2">
                        <button @click="fechar_modal_cliente" class="flex-1 py-4 bg-[var(--bg-page)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">Cancelar</button>
                        <button @click="confirmar_novo_cliente" class="flex-[1.5] py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95">Criar Conta</button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="modal_cancelamento_visivel" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-[var(--bg-card)] w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl flex flex-col text-center border-2 border-red-500/20">
                <div class="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 shadow-inner text-3xl">🚨</div>
                <h2 class="text-xl font-black text-[var(--text-primary)] tracking-tight">Cancelar Comanda</h2>
                <p class="text-xs text-[var(--text-muted)] font-bold mt-1 mb-6 bg-[var(--bg-page)] p-3 rounded-xl border border-[var(--border-subtle)]">Esta ação fechará a conta sem pagamento e libertará a mesa.</p>
                
                <div class="flex flex-col gap-4 text-left">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2">Motivo do Cancelamento</label>
                        <select v-model="form_cancelamento.motivo_cancelamento" class="w-full p-4 bg-[var(--bg-page)] border-2 border-[var(--border-subtle)] rounded-2xl outline-none focus:border-red-500 text-sm font-bold text-[var(--text-primary)] transition-colors">
                            <option value="Erro de Digitação / Lançamento">⌨️ Erro de Lançamento</option>
                            <option value="Cliente saiu sem pagar (Calote)">🏃 Cliente saiu sem pagar</option>
                            <option value="Cliente desistiu antes de consumir">🚶 Desistiu de consumir</option>
                        </select>
                    </div>

                    <div class="bg-[var(--bg-page)] p-4 rounded-2xl border border-[var(--border-subtle)] mt-2">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 text-center">O que fazer com os itens lançados?</p>
                        
                        <label class="flex items-center gap-3 cursor-pointer mb-2 p-3 bg-[var(--bg-card)] rounded-xl transition-all border border-[var(--border-subtle)] hover:border-red-500/50 shadow-sm group">
                            <input type="radio" :value="false" v-model="form_cancelamento.retornar_ao_estoque" class="w-5 h-5 text-red-500 focus:ring-red-500 bg-[var(--bg-page)] border-[var(--border-subtle)]">
                            <div>
                                <span class="block text-xs font-black text-[var(--text-primary)] group-hover:text-red-500 transition-colors">Foram consumidos (Gerar Perda)</span>
                                <span class="block text-[10px] text-[var(--text-muted)] font-bold">Prejuízo registado na Auditoria.</span>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 cursor-pointer p-3 bg-[var(--bg-card)] rounded-xl transition-all border border-[var(--border-subtle)] hover:border-green-500/50 shadow-sm group">
                            <input type="radio" :value="true" v-model="form_cancelamento.retornar_ao_estoque" class="w-5 h-5 text-green-500 focus:ring-green-500 bg-[var(--bg-page)] border-[var(--border-subtle)]">
                            <div>
                                <span class="block text-xs font-black text-[var(--text-primary)] group-hover:text-green-500 transition-colors">Foi um erro (Devolver)</span>
                                <span class="block text-[10px] text-[var(--text-muted)] font-bold">Os itens voltam para o estoque.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="flex gap-3 mt-6">
                    <button @click="modal_cancelamento_visivel = false" class="flex-1 py-4 bg-[var(--bg-page)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">Cancelar</button>
                    <button @click="confirmar_cancelamento" :disabled="cancelando" class="flex-[1.5] py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-50 border border-transparent">
                        {{ cancelando ? 'A Processar...' : 'Confirmar Encerramento' }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaMesaDetalhes } from './pagina_mesa_detalhes_logica.js';
const { 
    dados_mesa, voltar_mapa, abrir_pdv_para_comanda, 
    adicionar_novo_cliente, modal_cliente_visivel, input_novo_cliente, 
    fechar_modal_cliente, confirmar_novo_cliente, alterar_quantidade, 
    remover_item_consumido, fechar_conta_comanda, item_processando,
    modal_cancelamento_visivel, form_cancelamento, abrir_modal_cancelamento, 
    confirmar_cancelamento, cancelando 
} = useLogicaMesaDetalhes();
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
</style>