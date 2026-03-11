<template>
    <div class="p-6 bg-gray-50 h-full overflow-y-auto font-sans relative">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-black text-gray-800 tracking-tight">Inteligência de Negócios</h1>
                    <button @click="modal_config_visivel = true" class="text-gray-400 hover:text-nitec_blue transition-colors" title="Configurar Horário do Turno">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    </button>
                </div>
                <div class="flex gap-2 mt-2">
                    <button @click="definir_periodo('hoje')" class="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 hover:text-blue-700 transition-colors">Hoje</button>
                    <button @click="definir_periodo('semana')" class="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 hover:text-blue-700 transition-colors">7 Dias</button>
                    <button @click="definir_periodo('mes')" class="px-3 py-1.5 bg-gray-100 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-100 hover:text-blue-700 transition-colors">30 Dias</button>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 gap-2 shadow-inner">
                    <input type="date" v-model="data_inicio" @change="buscar_dados" class="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-gray-600 cursor-pointer">
                    <span class="text-gray-300 text-xs">➔</span>
                    <input type="date" v-model="data_fim" @change="buscar_dados" class="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-gray-600 cursor-pointer">
                </div>
                <button @click="buscar_dados" class="bg-nitec_blue hover:bg-blue-700 text-white h-[38px] w-[38px] rounded-xl shadow-md transition-all flex items-center justify-center active:scale-95" title="Pesquisar Período">🔍</button>
            </div>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-gray-400 mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-bold animate-pulse">Calculando inteligência de dados...</p>
        </div>

        <div v-else-if="dados_dashboard" class="animate-in fade-in duration-500 pb-20">
            
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Faturamento Bruto</span>
                        <span class="text-gray-300 group-hover:text-green-500 transition-colors text-base grayscale group-hover:grayscale-0">💰</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-gray-800 tracking-tighter">R$ {{ dados_dashboard.indicadores.faturamento_bruto }}</h3>
                </div>

                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Vendas Avulsas (Balcão)</span>
                        <span class="text-gray-300 group-hover:text-orange-500 transition-colors text-base grayscale group-hover:grayscale-0">🛍️</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-gray-800 tracking-tighter">R$ {{ dados_dashboard.indicadores.faturamento_balcao }}</h3>
                </div>

                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Ticket Médio</span>
                        <span class="text-gray-300 group-hover:text-blue-500 transition-colors text-base grayscale group-hover:grayscale-0">🏷️</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-gray-800 tracking-tighter">R$ {{ dados_dashboard.indicadores.ticket_medio }}</h3>
                </div>

                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total Comandas</span>
                        <span class="text-gray-300 group-hover:text-purple-500 transition-colors text-base grayscale group-hover:grayscale-0">🧾</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-gray-800 tracking-tighter">{{ dados_dashboard.indicadores.total_pedidos }}</h3>
                </div>

                <div class="bg-red-50 p-6 rounded-3xl border border-red-100 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-red-500 uppercase tracking-widest">Descontos (Perda)</span>
                        <span class="text-red-300 group-hover:text-red-600 transition-colors text-base grayscale group-hover:grayscale-0">🎁</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-red-700 tracking-tighter">R$ {{ dados_dashboard.indicadores.total_descontos }}</h3>
                </div>

            </div>

            <nav class="flex gap-1 mb-8 bg-gray-200/50 p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full shadow-inner">
                <button v-for="aba in ['estatísticas', 'estoque S/ giro', 'equipe', 'auditoria']" :key="aba"
                    @click="aba_ativa = aba"
                    :class="aba_ativa === aba ? 'bg-white shadow-sm text-nitec_blue font-black' : 'text-gray-500 hover:text-gray-700 font-bold'"
                    class="px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all whitespace-nowrap">
                    {{ aba }}
                </button>
            </nav>

            <main class="flex-1 relative">
                <div v-show="aba_ativa === 'estatísticas'" class="flex flex-col gap-10">
                    
                    <SecaoEvolucaoVendas :visivel="visibilidade.evolucao_vendas" @alternar="alternar_visibilidade('evolucao_vendas')" :dados_cronologicos="dados_dashboard.vendas_cronologicas" />
                    
                    <SecaoVendasPorDia :visivel="visibilidade.vendas_dia" @alternar="alternar_visibilidade('vendas_dia')" :dados_dias="dados_dashboard.vendas_por_dia" />
                    
                    <TabelaCategorias :visivel="visibilidade.categorias" @alternar="alternar_visibilidade('categorias')" :categorias="dados_dashboard.vendas_por_categoria" />

                    <SecaoMapaCalor :visivel="visibilidade.mapa_calor" @alternar="alternar_visibilidade('mapa_calor')" :horarios="dados_dashboard.horarios" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" />
                    
                    <TabelaRankingMesas :visivel="visibilidade.ranking_mesas" @alternar="alternar_visibilidade('ranking_mesas')" :mesas="dados_dashboard.ranking_mesas" />
                    
                    <TabelaCurvaABC :visivel="visibilidade.curva_abc" @alternar="alternar_visibilidade('curva_abc')" :produtos="dados_dashboard.ranking_produtos" />

                    <SecaoComparador :visivel="visibilidade.comparador" @alternar="alternar_visibilidade('comparador')" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" v-model:produtosSelecionados="produtos_comparador" />

                    <SecaoDescontos :visivel="visibilidade.descontos" @alternar="alternar_visibilidade('descontos')" :dados_descontos="dados_dashboard.descontos_cronologicos" />

                </div>

                <div v-show="aba_ativa === 'estoque S/ giro'">
                    <TabelaEncalhados :encalhados="dados_dashboard.encalhados" />
                </div>

                <div v-show="aba_ativa === 'equipe'">
                    <SecaoEquipe :equipe="dados_dashboard.equipe" />
                </div>

                <div v-show="aba_ativa === 'auditoria'">
                    <TabelaAuditoria 
                        v-model:filtro_tipo="filtro_auditoria_tipo"
                        v-model:filtro_texto="filtro_auditoria_texto"
                        :log_filtrado="log_auditoria_filtrado"
                        :formatarDataLog="formatarDataLog"
                        @abrir-recibo="abrir_recibo_auditoria" 
                    />
                </div>
            </main>
        </div>

        <div v-if="modal_config_visivel" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div class="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col text-center border-2 border-gray-100">
                <div class="w-16 h-16 bg-blue-50 text-nitec_blue text-3xl rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner">🌙</div>
                <h2 class="text-xl font-black text-gray-800 tracking-tight mb-2 uppercase italic">Virada do Turno</h2>
                <p class="text-[11px] text-gray-500 font-bold mb-6 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                    Defina o horário em que o seu bar encerra o expediente da madrugada. O sistema usará isto para agrupar as vendas do dia corretamente.
                </p>
                <div class="text-left mb-8">
                    <label class="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 pl-2">Horário de Virada</label>
                    <input type="time" v-model="hora_virada_turno" class="w-full bg-white border-2 border-gray-200 rounded-2xl p-4 text-2xl font-black text-gray-700 outline-none focus:border-nitec_blue text-center transition-colors shadow-sm">
                </div>
                <div class="flex gap-3">
                    <button @click="modal_config_visivel = false" class="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancelar</button>
                    <button @click="salvar_config_turno" class="flex-1 py-4 bg-nitec_blue hover:bg-blue-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95">Salvar</button>
                </div>
            </div>
        </div>

        <div v-if="modal_recibo_visivel" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div class="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-2 border-gray-100">
                <header class="p-8 bg-gray-50 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <h2 class="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Recibo Detalhado</h2>
                        <div class="text-[10px] font-black uppercase tracking-widest mt-2 flex flex-wrap items-center gap-1.5">
                            <span class="bg-gray-200 text-gray-600 px-2 py-0.5 rounded">CMD #{{ comanda_selecionada.id }}</span>
                            <span class="text-gray-400">•</span>
                            <span class="text-gray-500">{{ comanda_selecionada.buscar_mesa ? comanda_selecionada.buscar_mesa.nome_mesa : 'BALCÃO' }}</span>
                            <span class="text-gray-400">•</span>
                            <span v-if="comanda_selecionada.buscar_cliente || comanda_selecionada.nome_cliente" class="text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <span>👤</span> {{ comanda_selecionada.buscar_cliente?.nome_cliente || comanda_selecionada.nome_cliente }}
                            </span>
                            <span v-else class="text-purple-600 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <span>👥</span> CONTA GERAL
                            </span>
                        </div>
                    </div>
                    <button @click="fechar_modal_recibo" class="text-gray-300 hover:text-red-500 font-bold text-2xl">&times;</button>
                </header>
                <div class="p-8 flex-1 overflow-y-auto max-h-[50vh]">
                    <div class="space-y-4">
                        <div v-if="!comanda_selecionada.listar_itens || comanda_selecionada.listar_itens.length === 0" class="text-center py-4 text-xs text-gray-400 italic">Nenhum item consumido nesta conta.</div>
                        <div v-for="item in comanda_selecionada.listar_itens" :key="item.id" class="flex justify-between items-center">
                            <p class="text-xs font-bold text-gray-700 uppercase tracking-tight"><span class="bg-gray-100 px-2 py-0.5 rounded text-[10px] mr-2">{{ item.quantidade }}x</span>{{ item.buscar_produto?.nome_produto || 'Produto Removido' }}</p>
                            <p class="text-xs font-black text-gray-800">R$ {{ (item.quantidade * item.preco_unitario).toFixed(2) }}</p>
                        </div>
                    </div>
                    <div class="mt-8 pt-6 border-t border-dashed border-gray-200 space-y-2">
                        <div class="flex justify-between text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            <span>Subtotal</span><span>R$ {{ (Number(comanda_selecionada.valor_total) + Number(comanda_selecionada.desconto || 0)).toFixed(2) }}</span>
                        </div>
                        <div v-if="comanda_selecionada.desconto > 0" class="flex justify-between text-orange-500 font-black text-[10px] uppercase tracking-widest">
                            <span>Desconto</span><span>- R$ {{ Number(comanda_selecionada.desconto).toFixed(2) }}</span>
                        </div>
                        <div class="flex justify-between text-2xl font-black text-nitec_blue pt-2 tracking-tighter">
                            <span>TOTAL</span><span>R$ {{ Number(comanda_selecionada.valor_total).toFixed(2) }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaAnalises } from './pagina_analises_logica.js';

import SecaoEvolucaoVendas from './componentes_analises/SecaoEvolucaoVendas.vue';
import SecaoVendasPorDia from './componentes_analises/SecaoVendasPorDia.vue';
import TabelaCategorias from './componentes_analises/TabelaCategorias.vue';
import SecaoMapaCalor from './componentes_analises/SecaoMapaCalor.vue';
import TabelaRankingMesas from './componentes_analises/TabelaRankingMesas.vue';
import TabelaCurvaABC from './componentes_analises/TabelaCurvaABC.vue';
import SecaoComparador from './componentes_analises/SecaoComparador.vue';
import SecaoDescontos from './componentes_analises/SecaoDescontos.vue'; 

import TabelaEncalhados from './componentes_analises/TabelaEncalhados.vue';
import SecaoEquipe from './componentes_analises/SecaoEquipe.vue';
import TabelaAuditoria from './componentes_analises/TabelaAuditoria.vue';

const { 
    carregando, dados_dashboard, aba_ativa, 
    visibilidade, alternar_visibilidade, 
    data_inicio, data_fim, definir_periodo, buscar_dados,
    produtos_comparador, formatarDataLog,
    filtro_auditoria_texto, filtro_auditoria_tipo, log_auditoria_filtrado,
    modal_config_visivel, hora_virada_turno, salvar_config_turno,
    modal_recibo_visivel, comanda_selecionada, abrir_recibo_auditoria, fechar_modal_recibo 
} = useLogicaAnalises();
</script>