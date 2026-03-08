<template>
    <div class="p-6 bg-gray-50 h-full overflow-y-auto font-sans relative">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div>
                <h1 class="text-2xl font-black text-gray-800 tracking-tight">Inteligência de Negócios</h1>
                <div class="flex gap-2 mt-2">
                    <button @click="definir_periodo('hoje')" class="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors">Hoje</button>
                    <button @click="definir_periodo('semana')" class="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors">7 Dias</button>
                    <button @click="definir_periodo('mes')" class="px-3 py-1 bg-gray-100 rounded-lg text-[10px] font-bold uppercase hover:bg-blue-100 transition-colors">30 Dias</button>
                </div>
            </div>

            <div class="flex items-center gap-2">
                <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 gap-2 shadow-inner">
                    <input type="date" v-model="data_inicio" @change="buscar_dados" class="bg-transparent text-xs font-bold outline-none text-gray-700 cursor-pointer">
                    <span class="text-gray-400 text-xs">➔</span>
                    <input type="date" v-model="data_fim" @change="buscar_dados" class="bg-transparent text-xs font-bold outline-none text-gray-700 cursor-pointer">
                </div>
                <button @click="buscar_dados" class="bg-nitec_blue hover:bg-blue-700 text-white h-[38px] w-[38px] rounded-xl shadow-md transition-all flex items-center justify-center active:scale-95" title="Pesquisar Período">
                    🔍
                </button>
            </div>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-gray-400 mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-bold animate-pulse">Calculando inteligência de dados...</p>
        </div>

        <div v-else-if="dados_dashboard" class="animate-in fade-in duration-500 pb-20">
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-6xl opacity-5">💰</div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Faturamento Bruto</p>
                    <p class="text-3xl font-black text-gray-800 tracking-tighter">R$ {{ dados_dashboard.indicadores.faturamento_bruto }}</p>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-6xl opacity-5">🏷️</div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Ticket Médio</p>
                    <p class="text-3xl font-black text-gray-800 tracking-tighter">R$ {{ dados_dashboard.indicadores.ticket_medio }}</p>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-6xl opacity-5">🧾</div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Total Comandas</p>
                    <p class="text-3xl font-black text-gray-800 tracking-tighter">{{ dados_dashboard.indicadores.total_pedidos }}</p>
                </div>
                <div class="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                    <div class="absolute -right-4 -top-4 text-6xl opacity-5">⏳</div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase mb-1 tracking-widest">Permanência Média</p>
                    <p class="text-3xl font-black text-gray-800 tracking-tighter">{{ dados_dashboard.indicadores.tempo_permanencia }}</p>
                </div>
            </div>

            <nav class="flex gap-1 mb-6 bg-gray-200/50 p-1 rounded-2xl w-fit overflow-x-auto max-w-full">
                <button v-for="aba in ['inteligência', 'encalhados', 'equipe', 'auditoria']" :key="aba"
                    @click="aba_ativa = aba"
                    :class="aba_ativa === aba ? 'bg-white shadow-sm text-nitec_blue font-black' : 'text-gray-500 hover:text-gray-700 font-bold'"
                    class="px-6 py-2 rounded-xl text-xs uppercase tracking-widest transition-all whitespace-nowrap">
                    {{ aba }}
                </button>
            </nav>

            <main>
                <div v-if="aba_ativa === 'inteligência'" class="flex flex-col gap-10">
                    <SecaoVendasPorDia :visivel="visibilidade.vendas_dia" @alternar="alternar_visibilidade('vendas_dia')" :dados_dias="dados_dashboard.vendas_por_dia" />
                    <SecaoMapaCalor :visivel="visibilidade.mapa_calor" @alternar="alternar_visibilidade('mapa_calor')" :horarios="dados_dashboard.horarios" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" />
                    <TabelaRankingMesas :visivel="visibilidade.ranking_mesas" @alternar="alternar_visibilidade('ranking_mesas')" :mesas="dados_dashboard.ranking_mesas" />
                    <SecaoComparador :visivel="visibilidade.comparador" @alternar="alternar_visibilidade('comparador')" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" v-model:produto1="produto_comp_1" v-model:produto2="produto_comp_2" />
                    <TabelaCurvaABC :visivel="visibilidade.curva_abc" @alternar="alternar_visibilidade('curva_abc')" :produtos="dados_dashboard.ranking_produtos" />
                </div>

                <div v-if="aba_ativa === 'encalhados'" class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div class="p-6 bg-red-50 border-b border-red-100 flex items-center gap-3">
                        <span class="text-xl">⚠️</span>
                        <h2 class="text-sm font-black text-red-800 uppercase">Produtos Sem Saída (Estoque Parado)</h2>
                    </div>
                    <table class="w-full text-left text-sm">
                        <tr v-for="p in dados_dashboard.encalhados" :key="p.nome_produto" class="border-b border-gray-50 last:border-0 hover:bg-red-50/50 transition-colors">
                            <td class="p-5 font-bold text-gray-700">{{ p.nome_produto }}</td>
                            <td class="p-5 text-gray-400 font-bold">Estoque: {{ p.estoque_atual }}</td>
                            <td class="p-5 text-right font-black text-gray-500">R$ {{ p.preco_venda }}</td>
                        </tr>
                        <tr v-if="!dados_dashboard.encalhados || dados_dashboard.encalhados.length === 0">
                            <td colspan="3" class="p-8 text-center text-xs text-gray-400 font-medium italic">Nenhum produto encalhado!</td>
                        </tr>
                    </table>
                </div>

                <div v-if="aba_ativa === 'equipe'" class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div v-for="(garcom, idx) in dados_dashboard.equipe" :key="garcom.name" 
                        class="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col gap-5">
                        
                        <div class="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-0 opacity-50"></div>
                        
                        <div class="flex justify-between items-start relative z-10">
                            <div class="flex items-center gap-4">
                                <span class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-lg border border-blue-100 shadow-inner">{{ idx + 1 }}º</span>
                                <div>
                                    <p class="font-black text-gray-800 uppercase text-base tracking-tight">{{ garcom.name }}</p>
                                    <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{{ garcom.total_mesas }} Mesas Atendidas</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1">Receita Gerada</p>
                                <p class="font-black text-gray-800 text-xl tracking-tighter">R$ {{ Number(garcom.total_vendas).toFixed(2) }}</p>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-3 relative z-10 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                            <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>📈</span> Lucro Líquido</span>
                                <span class="font-black text-green-600 text-sm">R$ {{ Number(garcom.lucro_gerado).toFixed(2) }}</span>
                            </div>
                            
                            <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>🏷️</span> Ticket Médio</span>
                                <span class="font-bold text-gray-700 text-sm">R$ {{ garcom.total_mesas > 0 ? (Number(garcom.total_vendas) / Number(garcom.total_mesas)).toFixed(2) : '0.00' }}</span>
                            </div>
                            
                            <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>⏳</span> Tempo / Mesa</span>
                                <span class="font-bold text-gray-700 text-sm">{{ garcom.tempo_medio_minutos }} min</span>
                            </div>
                            
                            <div class="flex flex-col bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span class="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-1 flex items-center gap-1"><span>🏃</span> Esforço Físico</span>
                                <span class="font-bold text-gray-700 text-sm">{{ garcom.itens_servidos }} itens</span>
                            </div>
                        </div>

                        <div class="relative z-10 bg-orange-50 border border-orange-100 rounded-xl p-4 flex items-center justify-between">
                            <div class="flex items-center gap-3">
                                <span class="text-2xl drop-shadow-sm">🏆</span>
                                <div>
                                    <span class="text-[9px] font-black uppercase tracking-widest text-orange-600 block">Ponto Forte (Mais Vendido)</span>
                                    <span class="font-bold text-orange-800 text-sm mt-0.5 block truncate max-w-[150px]" :title="garcom.produto_campeao">{{ garcom.produto_campeao }}</span>
                                </div>
                            </div>
                            <span class="font-black text-orange-600 text-lg bg-white px-3 py-1 rounded-lg shadow-sm border border-orange-200">{{ garcom.qtd_campeao }}x</span>
                        </div>

                    </div>
                    
                    <div v-if="!dados_dashboard.equipe || dados_dashboard.equipe.length === 0" class="col-span-full text-center py-10 text-gray-500 font-medium italic bg-white rounded-3xl shadow-sm border border-gray-100">
                        Nenhuma venda registada neste período para a equipa.
                    </div>
                </div>

                <div v-if="aba_ativa === 'auditoria'" class="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <div class="mb-8 flex items-center justify-between">
                        <div>
                            <h2 class="text-xl font-black text-gray-800 tracking-tight">Timeline de Auditoria</h2>
                            <p class="text-xs text-gray-500 font-bold mt-1">Rastreio completo de vendas, quebras e entradas no estoque.</p>
                        </div>
                    </div>

                    <div class="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
                        
                        <div v-if="!dados_dashboard.log_auditoria || dados_dashboard.log_auditoria.length === 0" class="pl-6 text-gray-400 text-sm italic">
                            Nenhum registo encontrado neste período.
                        </div>

                        <div v-for="(evento, idx) in dados_dashboard.log_auditoria" :key="idx" class="relative pl-8 group">
                            
                            <div class="absolute -left-[21px] top-1 h-10 w-10 rounded-full border-4 border-white flex items-center justify-center text-lg shadow-sm transition-transform group-hover:scale-110"
                                 :class="{
                                     'bg-blue-100 text-blue-600': evento.cor === 'blue',
                                     'bg-red-100 text-red-600': evento.cor === 'red',
                                     'bg-green-100 text-green-600': evento.cor === 'green'
                                 }">
                                {{ evento.icone }}
                            </div>
                            
                            <div class="bg-gray-50 hover:bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-colors cursor-default">
                                <div class="flex justify-between items-start mb-2">
                                    <p class="text-[10px] text-gray-400 font-black uppercase tracking-widest">
                                        {{ formatarDataLog(evento.data_hora) }} • <span class="text-gray-600">Por {{ evento.usuario }}</span>
                                    </p>
                                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded"
                                          :class="{
                                            'bg-blue-100 text-blue-700': evento.tipo_evento === 'entrada',
                                            'bg-red-100 text-red-700': evento.tipo_evento === 'perda',
                                            'bg-green-100 text-green-700': evento.tipo_evento === 'venda'
                                          }">
                                        {{ evento.tipo_evento }}
                                    </span>
                                </div>
                                
                                <h3 class="text-sm font-black text-gray-800">{{ evento.titulo }}</h3>
                                <p class="text-xs text-gray-600 mt-1 font-medium">{{ evento.descricao }}</p>
                                
                                <p v-if="evento.detalhes_extras" class="text-[10px] text-gray-500 font-bold bg-white border border-gray-200 p-2 rounded-lg mt-3">
                                    {{ evento.detalhes_extras }}
                                </p>
                            </div>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    </div>
</template>

<script setup>
import { useLogicaAnalises } from './pagina_analises_logica.js';

import SecaoMapaCalor from './componentes_analises/SecaoMapaCalor.vue';
import SecaoComparador from './componentes_analises/SecaoComparador.vue';
import TabelaCurvaABC from './componentes_analises/TabelaCurvaABC.vue';
import SecaoVendasPorDia from './componentes_analises/SecaoVendasPorDia.vue';
import TabelaRankingMesas from './componentes_analises/TabelaRankingMesas.vue';

const { 
    carregando, dados_dashboard, aba_ativa, 
    visibilidade, alternar_visibilidade, 
    data_inicio, data_fim, definir_periodo, buscar_dados,
    produto_comp_1, produto_comp_2
} = useLogicaAnalises();
</script>