<template>
    <div class="tela_gestao_comandas p-6 md:p-8 bg-gray-50 h-full font-sans flex flex-col relative overflow-y-auto">
        
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
            <div class="w-full flex justify-between items-center md:w-auto md:block">
                <div>
                    <h1 class="text-2xl font-black text-gray-800 tracking-tight italic uppercase">Gestão de Comandas</h1>
                    <p class="text-xs text-gray-500 mt-1 font-bold uppercase tracking-widest">Controlo de faturação e sessões de atendimento.</p>
                </div>
                
                <button @click="voltar_painel" class="md:hidden px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                    Voltar
                </button>
            </div>
            
            <div class="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div class="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 w-full md:w-64 focus-within:border-nitec_blue transition-colors shadow-sm">
                    <span class="text-gray-400 text-xs mr-2">🔍</span>
                    <input v-model="termo_pesquisa_comanda" type="text" placeholder="Buscar cliente, mesa, total..." class="bg-transparent text-xs font-bold outline-none text-gray-700 w-full placeholder:font-medium">
                </div>

                <div class="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full sm:w-auto">
                    <button @click="alterar_exibicao('ordem')" 
                            :class="tipo_exibicao === 'ordem' ? 'bg-nitec_blue text-white shadow-md' : 'text-gray-400 hover:text-gray-600'"
                            class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        🕒 Ordem
                    </button>
                    <button @click="alterar_exibicao('agrupada')" 
                            :class="tipo_exibicao === 'agrupada' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'"
                            class="flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                        🪑 Mesas
                    </button>
                </div>
            </div>
        </header>

        <main class="flex-1 bg-white rounded-[2rem] shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            
            <div class="flex border-b border-gray-100 bg-gray-50/50 overflow-x-auto shrink-0">
                <button v-for="s in ['todas', 'aberta', 'fechada', 'cancelada']" :key="s" 
                        @click="alterar_filtro(s)" 
                        :class="filtro_status === s ? 'border-b-2 border-nitec_blue text-nitec_blue bg-white' : 'text-gray-400 hover:text-gray-600'" 
                        class="px-8 py-4 text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap">
                    {{ s }}
                </button>
            </div>

            <div class="overflow-x-auto flex-1 custom-scrollbar">
                <table class="w-full text-left whitespace-nowrap text-sm border-separate border-spacing-0">
                    <thead class="bg-gray-50 text-gray-500 sticky top-0 z-10 border-b border-gray-100">
                        <tr>
                            <th class="py-4 px-8 font-black uppercase text-[10px] tracking-widest">Identificação</th>
                            <th class="py-4 px-6 font-black uppercase text-[10px] tracking-widest">Sessão de Mesa</th>
                            <th class="py-4 px-6 font-black uppercase text-[10px] tracking-widest">Cliente</th>
                            <th class="py-4 px-6 font-black uppercase text-[10px] tracking-widest text-center">Status</th>
                            <th class="py-4 px-6 font-black uppercase text-[10px] tracking-widest text-right">Total</th>
                            <th class="py-4 px-6 font-black uppercase text-[10px] tracking-widest text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        <tr v-if="comandas_filtradas.length === 0">
                            <td colspan="6" class="p-20 text-center text-gray-300 font-black uppercase text-xs tracking-widest">Nenhuma comanda encontrada</td>
                        </tr>
                        
                        <tr v-for="(comanda, index) in comandas_filtradas" :key="comanda.id" 
                            class="hover:bg-gray-50 transition-colors group cursor-pointer relative" 
                            @click="abrir_detalhes(comanda, comanda.status_comanda === 'aberta' ? (comanda.mesa_id ? 'mesa' : 'cobrar') : 'recibo')">
                            
                            <td class="py-4 px-8 relative">
                                <div v-if="tipo_exibicao === 'agrupada' && index > 0 && comandas_filtradas[index-1]._sessao === comanda._sessao" 
                                     class="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500/30"></div>
                                <div v-if="tipo_exibicao === 'agrupada' && (index === 0 || comandas_filtradas[index-1]._sessao !== comanda._sessao)" 
                                     class="absolute left-0 top-2 bottom-2 w-1.5 bg-purple-600 rounded-r-full shadow-[2px_0_8px_rgba(147,51,234,0.3)]"></div>
                                
                                <p class="font-black text-gray-800">#{{ comanda.id }}</p>
                                <p class="text-[10px] text-gray-400 uppercase font-black tracking-widest mt-0.5">Ref: Interna</p>
                            </td>

                            <td class="py-4 px-6">
                                <div class="flex items-center gap-3">
                                    <div class="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-black text-gray-500">
                                        {{ comanda.buscar_mesa ? comanda.buscar_mesa.nome_mesa.charAt(0) : 'B' }}
                                    </div>
                                    <div>
                                        <p class="text-xs font-black text-gray-800 uppercase italic">{{ comanda.buscar_mesa ? comanda.buscar_mesa.nome_mesa : 'Venda Balcão' }}</p>
                                        
                                        <p class="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                                            <template v-if="comanda.status_comanda === 'fechada'">
                                                Fechada em: {{ formatar_data(comanda.data_hora_fechamento) }}
                                            </template>
                                            <template v-else-if="comanda.status_comanda === 'cancelada'">
                                                Cancelada em: {{ formatar_data(comanda.deleted_at || comanda.updated_at) }}
                                            </template>
                                            <template v-else>
                                                Aberta em: {{ formatar_data(comanda.data_hora_abertura) }}
                                            </template>
                                        </p>
                                        
                                    </div>
                                </div>
                            </td>

                            <td class="py-4 px-6 font-bold text-gray-600 text-xs">
                                {{ comanda.buscar_cliente ? comanda.buscar_cliente.nome_cliente : 'CONTA GERAL' }}
                            </td>

                            <td class="py-4 px-6 text-center">
                                <span :class="{
                                        'bg-blue-50 text-blue-600 border-blue-100': comanda.status_comanda === 'aberta',
                                        'bg-green-50 text-green-600 border-green-100': comanda.status_comanda === 'fechada',
                                        'bg-red-50 text-red-600 border-red-100': comanda.status_comanda === 'cancelada'
                                    }" 
                                    class="px-3 py-1 rounded-md text-[9px] uppercase font-black tracking-widest border">
                                    {{ comanda.status_comanda }}
                                </span>
                            </td>

                            <td class="py-4 px-6 text-right font-black text-gray-800">R$ {{ Number(comanda.valor_total).toFixed(2) }}</td>

                            <td class="py-4 px-6 text-right">
                                <div v-if="comanda.status_comanda === 'aberta'" class="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                                    <button v-if="comanda.mesa_id" @click.stop="abrir_detalhes(comanda, 'mesa')" class="text-nitec_blue text-[10px] uppercase font-black tracking-widest hover:underline">
                                        Mesa 🪑
                                    </button>
                                    <template v-else>
                                        <button @click.stop="abrir_detalhes(comanda, 'lancar')" class="text-nitec_blue text-[10px] uppercase font-black tracking-widest hover:underline">
                                            Lançar 🚀
                                        </button>
                                        <button @click.stop="abrir_detalhes(comanda, 'cobrar')" class="text-green-600 text-[10px] uppercase font-black tracking-widest hover:underline">
                                            Cobrar 💳
                                        </button>
                                    </template>
                                </div>
                                <button v-else @click.stop="abrir_detalhes(comanda, 'recibo')" class="text-nitec_blue text-[10px] uppercase font-black tracking-widest hover:underline opacity-40 group-hover:opacity-100 transition-opacity">
                                    Ver Recibo 📄
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>

        <div v-if="modal_historico_visivel" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-2 border-gray-100">
                <header class="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 class="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Recibo Detalhado</h2>
                        <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                            CMD #{{ comanda_selecionada.id }} • {{ comanda_selecionada.buscar_mesa ? comanda_selecionada.buscar_mesa.nome_mesa : 'BALCÃO' }}
                        </p>
                    </div>
                    <button @click="fechar_modal_historico" class="text-gray-300 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
                </header>
                
                <div class="p-8 flex-1 overflow-y-auto max-h-[50vh] custom-scrollbar">
                    <div class="space-y-4">
                        <div v-if="comanda_selecionada.listar_itens.length === 0" class="text-center py-4 text-xs text-gray-400 italic">Nenhum item consumido nesta conta.</div>
                        <div v-for="item in comanda_selecionada.listar_itens" :key="item.id" class="flex justify-between items-center">
                            <p class="text-xs font-bold text-gray-700 uppercase tracking-tight">
                                <span class="bg-gray-100 px-2 py-0.5 rounded text-[10px] mr-2">{{ item.quantidade }}x</span>
                                {{ item.buscar_produto.nome_produto }}
                            </p>
                            <p class="text-xs font-black text-gray-800">R$ {{ (item.quantidade * item.preco_unitario).toFixed(2) }}</p>
                        </div>
                    </div>
                    
                    <div class="mt-8 pt-6 border-t border-dashed border-gray-200 space-y-2">
                        <div class="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Subtotal</span>
                            <span>R$ {{ (Number(comanda_selecionada.valor_total) + Number(comanda_selecionada.desconto || 0)).toFixed(2) }}</span>
                        </div>
                        <div v-if="comanda_selecionada.desconto > 0" class="flex justify-between text-orange-500 font-black text-[10px] uppercase tracking-widest">
                            <span>Desconto</span>
                            <span>- R$ {{ Number(comanda_selecionada.desconto).toFixed(2) }}</span>
                        </div>
                        <div class="flex justify-between text-2xl font-black text-nitec_blue pt-2 tracking-tighter">
                            <span>TOTAL</span>
                            <span>R$ {{ Number(comanda_selecionada.valor_total).toFixed(2) }}</span>
                        </div>
                    </div>
                </div>

                <div class="p-8 bg-gray-50 border-t border-gray-100 flex gap-3">
                    <button @click="fechar_modal_historico" class="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors shadow-sm">Fechar</button>
                    <button v-if="comanda_selecionada.status_comanda === 'fechada'" @click="reabrir_comanda" :disabled="reabrindo" class="flex-[1.5] py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {{ reabrindo ? 'Processando...' : '🔄 Reabrir Comanda' }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaComandas } from './pagina_comandas_logica.js';
const { 
    filtro_status, tipo_exibicao, comandas_filtradas, alterar_filtro, alterar_exibicao, formatar_data,
    abrir_detalhes, voltar_painel, modal_historico_visivel, comanda_selecionada, fechar_modal_historico, reabrir_comanda, reabrindo,termo_pesquisa_comanda
} = useLogicaComandas();
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
</style>