<template>
    <div class="p-6 bg-[var(--bg-page)] h-full overflow-y-auto font-sans relative transition-colors duration-300">
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 bg-[var(--bg-card)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)] transition-colors duration-300">
            <div>
                <div class="flex items-center gap-3">
                    <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Inteligencia de Negocios</h1>
                    <button @click="modal_config_visivel = true" class="text-[var(--text-muted)] hover:text-nitec_blue transition-colors" title="Configurar horario do turno">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </div>

                <div class="flex gap-2 mt-2">
                    <button @click="definir_periodo('hoje')" class="px-3 py-1.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/10 hover:text-blue-500 text-[var(--text-muted)] transition-colors">Hoje</button>
                    <button @click="definir_periodo('semana')" class="px-3 py-1.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/10 hover:text-blue-500 text-[var(--text-muted)] transition-colors">7 Dias</button>
                    <button @click="definir_periodo('mes')" class="px-3 py-1.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-500/10 hover:text-blue-500 text-[var(--text-muted)] transition-colors">30 Dias</button>
                </div>
            </div>

            <div class="flex flex-wrap items-center gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                <button @click="voltar_painel" class="lg:hidden px-5 py-2.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all flex-1 shadow-sm h-[38px] flex items-center justify-center">
                    Voltar
                </button>

                <div class="flex flex-1 items-center bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 gap-2 shadow-inner">
                    <input type="date" v-model="data_inicio" @change="buscar_dados" class="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-[var(--text-primary)] cursor-pointer w-full text-center" style="color-scheme: dark;">
                    <span class="text-[var(--text-muted)] text-xs">-></span>
                    <input type="date" v-model="data_fim" @change="buscar_dados" class="bg-transparent text-xs font-black uppercase tracking-widest outline-none text-[var(--text-primary)] cursor-pointer w-full text-center" style="color-scheme: dark;">
                </div>

                <button @click="buscar_dados" class="bg-nitec_blue hover:bg-blue-700 text-white h-[38px] w-[38px] rounded-xl shadow-md transition-all flex items-center justify-center active:scale-95 flex-shrink-0" title="Pesquisar periodo">
                    <span class="text-sm">🔍</span>
                </button>
            </div>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm font-bold animate-pulse">Calculando inteligencia de dados...</p>
        </div>

        <div v-else-if="dados_dashboard" class="animate-in fade-in duration-500 pb-20">
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <div class="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm hover:bg-[var(--bg-card-hover)] transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Faturamento Bruto</span>
                        <span class="text-[var(--text-muted)] group-hover:text-green-500 transition-colors text-base grayscale group-hover:grayscale-0">💰</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-[var(--text-primary)] tracking-tighter">R$ {{ dados_dashboard.indicadores.faturamento_bruto }}</h3>
                </div>

                <div class="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm hover:bg-[var(--bg-card-hover)] transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Vendas Avulsas</span>
                        <span class="text-[var(--text-muted)] group-hover:text-orange-500 transition-colors text-base grayscale group-hover:grayscale-0">🛍️</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-[var(--text-primary)] tracking-tighter">R$ {{ dados_dashboard.indicadores.faturamento_balcao }}</h3>
                </div>

                <div class="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm hover:bg-[var(--bg-card-hover)] transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Ticket Medio</span>
                        <span class="text-[var(--text-muted)] group-hover:text-blue-500 transition-colors text-base grayscale group-hover:grayscale-0">🏷️</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-[var(--text-primary)] tracking-tighter">R$ {{ dados_dashboard.indicadores.ticket_medio }}</h3>
                </div>

                <div class="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border-subtle)] shadow-sm hover:bg-[var(--bg-card-hover)] transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Total Comandas</span>
                        <span class="text-[var(--text-muted)] group-hover:text-purple-500 transition-colors text-base grayscale group-hover:grayscale-0">🧾</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-[var(--text-primary)] tracking-tighter">{{ dados_dashboard.indicadores.total_pedidos }}</h3>
                </div>

                <div class="bg-red-500/5 p-6 rounded-3xl border border-red-500/20 shadow-sm hover:bg-red-500/10 transition-all group flex flex-col">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-[10px] font-bold text-red-500 uppercase tracking-widest">Descontos</span>
                        <span class="text-red-500/50 group-hover:text-red-500 transition-colors text-base grayscale group-hover:grayscale-0">🎁</span>
                    </div>
                    <h3 class="text-2xl lg:text-3xl font-black text-red-500 tracking-tighter">R$ {{ dados_dashboard.indicadores.total_descontos }}</h3>
                </div>
            </div>

            <nav class="flex gap-1 mb-8 bg-[var(--bg-card)] border border-[var(--border-subtle)] p-1.5 rounded-2xl w-fit overflow-x-auto max-w-full shadow-inner">
                <button
                    v-for="aba in abas_analises"
                    :key="aba.id"
                    @click="aba_ativa = aba.id"
                    :class="aba_ativa === aba.id ? 'bg-[var(--bg-page)] border border-[var(--border-subtle)] shadow-sm text-nitec_blue font-black' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] font-bold'"
                    class="px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all whitespace-nowrap"
                >
                    {{ aba.label }}
                </button>
            </nav>

            <main class="flex-1 relative">
                <div v-show="aba_ativa === 'estatisticas'" class="flex flex-col gap-10">
                    <SecaoEvolucaoVendas :visivel="visibilidade.evolucao_vendas" @alternar="alternar_visibilidade('evolucao_vendas')" :dados_cronologicos="dados_dashboard.vendas_cronologicas" />
                    <SecaoVendasPorDia :visivel="visibilidade.vendas_dia" @alternar="alternar_visibilidade('vendas_dia')" :dados_dias="dados_dashboard.vendas_por_dia" />
                    <TabelaCategorias :visivel="visibilidade.categorias" @alternar="alternar_visibilidade('categorias')" :categorias="dados_dashboard.vendas_por_categoria" />
                    <SecaoMapaCalor :visivel="visibilidade.mapa_calor" @alternar="alternar_visibilidade('mapa_calor')" :horarios="dados_dashboard.horarios" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" />
                    <TabelaRankingMesas :visivel="visibilidade.ranking_mesas" @alternar="alternar_visibilidade('ranking_mesas')" :mesas="dados_dashboard.ranking_mesas" />
                    <TabelaCurvaABC :visivel="visibilidade.curva_abc" @alternar="alternar_visibilidade('curva_abc')" :produtos="dados_dashboard.ranking_produtos" />
                    <SecaoComparador :visivel="visibilidade.comparador" @alternar="alternar_visibilidade('comparador')" :dados_por_hora="dados_dashboard.produtos_por_hora" :produtos_disponiveis="dados_dashboard.ranking_produtos" v-model:produtosSelecionados="produtos_comparador" />
                    <SecaoDescontos :visivel="visibilidade.descontos" @alternar="alternar_visibilidade('descontos')" :dados_descontos="dados_dashboard.descontos_cronologicos" />
                </div>

                <div v-show="aba_ativa === 'estoque_sem_giro'">
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

                <div v-show="aba_ativa === 'consultas'">
                    <SecaoConsultasAgente
                        v-model:pergunta_agente="pergunta_agente"
                        :consultando_agente="consultando_agente"
                        :historico_consultas="historico_consultas"
                        :sugestoes_consulta="sugestoes_consulta"
                        @selecionar-sugestao="selecionar_sugestao_agente"
                        @limpar="limpar_consultas_agente"
                        @enviar="consultar_agente"
                    />
                </div>
            </main>
        </div>

        <div v-if="modal_config_visivel" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div class="bg-[var(--bg-card)] rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl flex flex-col text-center border-2 border-[var(--border-subtle)]">
                <div class="w-16 h-16 bg-blue-500/10 text-nitec_blue text-3xl rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-inner border border-blue-500/20">🌙</div>
                <h2 class="text-xl font-black text-[var(--text-primary)] tracking-tight mb-2 uppercase italic">Virada do Turno</h2>
                <p class="text-[11px] text-[var(--text-muted)] font-bold mb-6 leading-relaxed bg-[var(--bg-page)] p-3 rounded-xl border border-[var(--border-subtle)]">
                    Defina o horario em que o expediente fecha para agrupar as vendas da madrugada no dia correto.
                </p>
                <div class="text-left mb-8">
                    <label class="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">Horario de Virada</label>
                    <input type="time" v-model="hora_virada_turno" class="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-2xl p-4 text-2xl font-black text-[var(--text-primary)] outline-none focus:border-nitec_blue text-center transition-colors shadow-sm" style="color-scheme: dark;">
                </div>
                <div class="flex gap-3">
                    <button @click="modal_config_visivel = false" class="flex-1 py-4 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] font-black rounded-2xl text-[10px] uppercase tracking-widest transition-colors">Cancelar</button>
                    <button @click="salvar_config_turno" class="flex-1 py-4 bg-nitec_blue hover:bg-blue-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95">Salvar</button>
                </div>
            </div>
        </div>

        <div v-if="modal_recibo_visivel" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <div class="bg-[var(--bg-card)] w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border-2 border-[var(--border-subtle)]">
                <header class="p-8 bg-[var(--bg-page)] border-b border-[var(--border-subtle)] flex justify-between items-start">
                    <div>
                        <h2 class="text-xl font-black text-[var(--text-primary)] tracking-tighter uppercase italic">Recibo Detalhado</h2>
                        <div class="text-[10px] font-black uppercase tracking-widest mt-2 flex flex-wrap items-center gap-1.5">
                            <span class="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-muted)] px-2 py-0.5 rounded">CMD #{{ comanda_selecionada.id }}</span>
                            <span class="text-[var(--text-muted)]">•</span>
                            <span class="text-[var(--text-muted)]">{{ comanda_selecionada.buscar_mesa ? comanda_selecionada.buscar_mesa.nome_mesa : 'BALCAO' }}</span>
                            <span class="text-[var(--text-muted)]">•</span>
                            <span v-if="comanda_selecionada.buscar_cliente || comanda_selecionada.nome_cliente" class="text-blue-500 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <span>👤</span> {{ comanda_selecionada.buscar_cliente?.nome_cliente || comanda_selecionada.nome_cliente }}
                            </span>
                            <span v-else class="text-purple-500 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                                <span>👥</span> CONTA GERAL
                            </span>
                        </div>
                    </div>
                    <button @click="fechar_modal_recibo" class="text-[var(--text-muted)] hover:text-red-500 font-bold text-2xl">&times;</button>
                </header>

                <div class="p-8 flex-1 overflow-y-auto max-h-[50vh]">
                    <div class="space-y-4">
                        <div v-if="!comanda_selecionada.listar_itens || comanda_selecionada.listar_itens.length === 0" class="text-center py-4 text-xs text-[var(--text-muted)] italic">Nenhum item consumido nesta conta.</div>

                        <div v-for="item in comanda_selecionada.listar_itens" :key="item.id" class="flex justify-between items-center">
                            <p class="text-xs font-bold text-[var(--text-primary)] uppercase tracking-tight">
                                <span class="bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)] px-2 py-0.5 rounded text-[10px] mr-2">{{ item.quantidade }}x</span>
                                {{ item.buscar_produto?.nome_produto || 'Produto Removido' }}
                            </p>
                            <p class="text-xs font-black text-[var(--text-primary)]">R$ {{ (item.quantidade * item.preco_unitario).toFixed(2) }}</p>
                        </div>
                    </div>

                    <div class="mt-8 pt-6 border-t border-dashed border-[var(--border-subtle)] space-y-2">
                        <div class="flex justify-between text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">
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
import SecaoConsultasAgente from './componentes_analises/SecaoConsultasAgente.vue';

const {
    carregando,
    dados_dashboard,
    aba_ativa,
    abas_analises,
    visibilidade,
    alternar_visibilidade,
    data_inicio,
    data_fim,
    definir_periodo,
    buscar_dados,
    produtos_comparador,
    formatarDataLog,
    filtro_auditoria_texto,
    filtro_auditoria_tipo,
    log_auditoria_filtrado,
    modal_config_visivel,
    hora_virada_turno,
    salvar_config_turno,
    modal_recibo_visivel,
    comanda_selecionada,
    abrir_recibo_auditoria,
    fechar_modal_recibo,
    voltar_painel,
    pergunta_agente,
    consultando_agente,
    historico_consultas,
    sugestoes_consulta,
    selecionar_sugestao_agente,
    limpar_consultas_agente,
    consultar_agente,
} = useLogicaAnalises();
</script>
