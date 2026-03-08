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

            <main class="flex-1">
                <div v-if="aba_ativa === 'inteligência'" class="flex flex-col gap-10">
                    <SecaoVendasPorDia :visivel="visibilidade.vendas_dia" @alternar="alternar_visibilidade('vendas_dia')" :dados_dias="dados_dashboard.vendas_por_dia" />
                    <SecaoMapaCalor :visivel="visibilidade.mapa_calor" @alternar="alternar_visibilidade('mapa_calor')" :horarios="dados_dashboard.horarios" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" />
                    <TabelaRankingMesas :visivel="visibilidade.ranking_mesas" @alternar="alternar_visibilidade('ranking_mesas')" :mesas="dados_dashboard.ranking_mesas" />
                    <SecaoComparador :visivel="visibilidade.comparador" @alternar="alternar_visibilidade('comparador')" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" v-model:produto1="produto_comp_1" v-model:produto2="produto_comp_2" />
                    <TabelaCurvaABC :visivel="visibilidade.curva_abc" @alternar="alternar_visibilidade('curva_abc')" :produtos="dados_dashboard.ranking_produtos" />
                </div>

                <div v-if="aba_ativa === 'encalhados'">
                    <TabelaEncalhados :encalhados="dados_dashboard.encalhados" />
                </div>

                <div v-if="aba_ativa === 'equipe'">
                    <SecaoEquipe :equipe="dados_dashboard.equipe" />
                </div>

                <div v-if="aba_ativa === 'auditoria'">
                    <TabelaAuditoria 
                        v-model:filtro_tipo="filtro_auditoria_tipo"
                        v-model:filtro_texto="filtro_auditoria_texto"
                        :log_filtrado="log_auditoria_filtrado"
                        :formatarDataLog="formatarDataLog"
                    />
                </div>
            </main>
        </div>
    </div>
</template>

<script setup>
// Lógica Principal
import { useLogicaAnalises } from './pagina_analises_logica.js';

// Componentes da Aba 1 (Inteligência)
import SecaoMapaCalor from './componentes_analises/SecaoMapaCalor.vue';
import SecaoComparador from './componentes_analises/SecaoComparador.vue';
import TabelaCurvaABC from './componentes_analises/TabelaCurvaABC.vue';
import SecaoVendasPorDia from './componentes_analises/SecaoVendasPorDia.vue';
import TabelaRankingMesas from './componentes_analises/TabelaRankingMesas.vue';

// 🟢 Componentes Novos (Abas 2, 3 e 4)
import TabelaEncalhados from './componentes_analises/TabelaEncalhados.vue';
import SecaoEquipe from './componentes_analises/SecaoEquipe.vue';
import TabelaAuditoria from './componentes_analises/TabelaAuditoria.vue';

const { 
    carregando, dados_dashboard, aba_ativa, 
    visibilidade, alternar_visibilidade, 
    data_inicio, data_fim, definir_periodo, buscar_dados,
    produto_comp_1, produto_comp_2, 
    formatarDataLog,
    filtro_auditoria_texto, 
    filtro_auditoria_tipo, 
    log_auditoria_filtrado 
} = useLogicaAnalises();
</script>