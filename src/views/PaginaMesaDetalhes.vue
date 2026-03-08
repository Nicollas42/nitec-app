<template>
    <div class="tela_detalhes_mesa p-6 md:p-8 bg-gray-50 h-full font-sans flex flex-col relative overflow-y-auto">
        
        <div v-if="dados_mesa" class="conteudo_mesa flex flex-col h-full max-w-7xl mx-auto w-full">
            
            <header class="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6 gap-4">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-xl font-black">
                        {{ dados_mesa.nome_mesa.charAt(0) }}
                    </div>
                    <div>
                        <h1 class="text-xl font-black text-gray-800 tracking-tight">{{ dados_mesa.nome_mesa }}</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Em Atendimento</p>
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-2 w-full md:w-auto">
                    <button @click="voltar_mapa" class="flex-1 md:flex-none px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-bold transition-all">
                        Voltar
                    </button>
                    <button @click="adicionar_novo_cliente" class="flex-1 md:flex-none px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-lg hover:bg-blue-100 text-sm font-bold transition-all flex items-center justify-center gap-1">
                        <span>➕</span> Sub-Comanda
                    </button>
                </div>
            </header>

            <main class="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5 items-start pb-6">
                
                <article v-for="(comanda, index) in dados_mesa.listar_comandas" :key="comanda.id" 
                         class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col relative overflow-hidden group">
                    
                    <div class="absolute left-0 top-0 bottom-0 w-1" :class="comanda.tipo_conta === 'geral' ? 'bg-nitec_blue' : 'bg-purple-500'"></div>

                    <div class="flex justify-between items-start mb-4 border-b border-gray-100 pb-4 pl-2 relative">
                        <div>
                            <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100 mb-1 inline-block">CMD #{{ comanda.id }}</span>
                            <h2 class="text-base font-black text-gray-800 leading-tight">
                                {{ comanda.tipo_conta === 'geral' ? 'Conta Principal' : 'Conta Individual' }}
                            </h2>
                            <p class="text-xs text-gray-500 mt-1">
                                Cliente: <span class="font-bold text-gray-700">{{ comanda.buscar_cliente?.nome_cliente || 'Não informado' }}</span>
                            </p>
                        </div>

                        <div class="flex flex-col items-end gap-1">
                            <button @click="abrir_modal_cancelamento(comanda.id)" class="text-gray-300 hover:text-red-500 bg-white hover:bg-red-50 h-8 w-8 rounded-lg flex items-center justify-center transition-colors shadow-sm border border-transparent hover:border-red-100" title="Cancelar Comanda">
                                🗑️
                            </button>
                            <span class="text-xl font-black text-gray-800">R$ {{ Number(comanda.valor_total).toFixed(2) }}</span>
                        </div>
                    </div>

                    <div class="flex gap-2 mb-5 pl-2">
                        <button @click="abrir_pdv_para_comanda(comanda.id)" class="flex-1 bg-white border border-gray-300 text-gray-700 hover:border-nitec_blue hover:text-nitec_blue font-bold py-2.5 rounded-lg transition-colors text-xs flex justify-center items-center gap-2">
                            🛒 Lançar
                        </button>
                        <button @click="fechar_conta_comanda(comanda.id)" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-bold py-2.5 rounded-lg transition-colors text-xs flex justify-center items-center gap-2 shadow-sm">
                            💳 Receber
                        </button>
                    </div>

                    <div class="flex-1 overflow-y-auto max-h-56 pr-2 pl-2">
                        <h3 class="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Itens ({{ comanda.listar_itens.length }})</h3>
                        
                        <div v-if="comanda.listar_itens.length === 0" class="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            <p class="text-xs text-gray-400 font-medium">Comanda vazia.</p>
                        </div>

                        <div v-for="item in comanda.listar_itens" :key="item.id" class="flex flex-col py-2 border-b border-gray-50 last:border-0">
                            <div class="flex justify-between items-start mb-1">
                                <p class="text-xs font-bold text-gray-700 leading-tight pr-2">{{ item.buscar_produto.nome_produto }}</p>
                                <span class="text-xs font-black text-gray-800 whitespace-nowrap">R$ {{ (item.quantidade * item.preco_unitario).toFixed(2) }}</span>
                            </div>
                            
                            <div class="flex items-center justify-between mt-1">
                                <div class="flex items-center bg-gray-50 rounded border border-gray-200 overflow-hidden">
                                    <button @click="alterar_quantidade(item.id, 'decrementar')" class="px-2 py-0.5 hover:bg-gray-200 text-gray-600 font-bold transition-colors">-</button>
                                    <span class="px-2 py-0.5 text-xs font-black text-gray-700 w-6 text-center bg-white">{{ item.quantidade }}</span>
                                    <button @click="alterar_quantidade(item.id, 'incrementar')" class="px-2 py-0.5 hover:bg-gray-200 text-gray-600 font-bold transition-colors">+</button>
                                </div>
                                <button @click="remover_item_consumido(item.id)" class="text-gray-300 hover:text-red-500 p-1 rounded transition-colors" title="Remover item">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </main>
        </div>

        <div v-if="modal_cliente_visivel" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div class="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl">
                <div class="mb-5">
                    <h2 class="text-lg font-black text-gray-800">Nova Sub-Comanda</h2>
                    <p class="text-xs text-gray-500 mt-1">Separar a conta para um novo cliente nesta mesa.</p>
                </div>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-bold text-gray-600">Nome do Cliente</label>
                        <input v-model="input_novo_cliente" type="text" placeholder="Ex: Maria Souza" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" @keyup.enter="confirmar_novo_cliente" autofocus>
                    </div>
                    <div class="flex gap-3 mt-2">
                        <button @click="fechar_modal_cliente" class="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                        <button @click="confirmar_novo_cliente" class="flex-1 py-3 bg-nitec_blue hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition-all text-sm">
                            Criar Conta
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="modal_cancelamento_visivel" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-white w-full max-w-md p-8 rounded-[2rem] shadow-2xl border-2 border-red-100 flex flex-col text-center">
                
                <div class="mx-auto w-16 h-16 rounded-2xl bg-red-50 text-red-500 border-2 border-red-100 flex items-center justify-center mb-4 shadow-inner text-2xl">
                    🚨
                </div>

                <h2 class="text-xl font-black text-gray-800">Cancelar Comanda</h2>
                <p class="text-xs text-gray-500 font-bold mt-1 mb-6">Esta ação fechará a conta e libertará a mesa.</p>
                
                <div class="flex flex-col gap-4 text-left">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-gray-400">Motivo do Cancelamento</label>
                        <select v-model="form_cancelamento.motivo_cancelamento" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500 text-sm font-bold text-gray-700">
                            <option value="Cliente saiu sem pagar (Calote)">🏃 Cliente saiu sem pagar (Calote)</option>
                            <option value="Erro de Digitação / Lançamento">⌨️ Erro de Lançamento</option>
                            <option value="Cliente desistiu antes de consumir">🚶 Desistiu de consumir</option>
                        </select>
                    </div>

                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-2">
                        <p class="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">O que fazer com os itens lançados?</p>
                        
                        <label class="flex items-center gap-3 cursor-pointer mb-3 p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm">
                            <input type="radio" :value="false" v-model="form_cancelamento.retornar_ao_estoque" class="w-4 h-4 text-red-500 focus:ring-red-500">
                            <div>
                                <span class="block text-xs font-black text-gray-800">Foram consumidos (Gerar Perda)</span>
                                <span class="block text-[10px] text-gray-500 font-bold">O sistema registrará o prejuízo na Auditoria.</span>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 cursor-pointer p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200 shadow-sm">
                            <input type="radio" :value="true" v-model="form_cancelamento.retornar_ao_estoque" class="w-4 h-4 text-green-500 focus:ring-green-500">
                            <div>
                                <span class="block text-xs font-black text-gray-800">Foi um erro (Devolver ao Estoque)</span>
                                <span class="block text-[10px] text-gray-500 font-bold">Os itens voltam para a prateleira.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="flex gap-3 mt-6">
                    <button @click="modal_cancelamento_visivel = false" class="flex-1 py-3.5 bg-gray-100 border border-gray-200 text-gray-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-colors shadow-sm">Cancelar</button>
                    <button @click="confirmar_cancelamento" :disabled="cancelando" class="flex-[1.5] py-3.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all disabled:opacity-50">
                        {{ cancelando ? 'Processando...' : 'Confirmar Encerramento' }}
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
    remover_item_consumido, fechar_conta_comanda,
    modal_cancelamento_visivel, form_cancelamento, abrir_modal_cancelamento, 
    confirmar_cancelamento, cancelando 
} = useLogicaMesaDetalhes();
</script>