<template>
    <div class="flex flex-col gap-6">

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- SECAO 1: CONSULTAS RÁPIDAS                                      -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="bg-[var(--bg-card)] rounded-[2rem] shadow-sm border border-[var(--border-subtle)] flex flex-col transition-colors duration-300">

            <!-- Cabeçalho da seção -->
            <div class="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-page)] rounded-t-[2rem] transition-colors duration-300">
                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Análises Instantâneas</p>
                <h2 class="text-base font-black text-[var(--text-primary)] tracking-tight mt-1">Consultas Rápidas</h2>
                <p class="text-xs text-[var(--text-muted)] font-medium mt-1">
                    Clique em qualquer pergunta para ver o resultado instantaneamente, sem usar o agente IA.
                </p>
            </div>

            <div class="p-6 flex flex-col gap-5">

                <!-- Estado de carregamento do catálogo -->
                <div v-if="carregando_catalogo" class="flex items-center gap-3 py-4">
                    <svg class="animate-spin h-5 w-5 text-nitec_blue flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-sm font-medium text-[var(--text-muted)]">Carregando catálogo de consultas...</p>
                </div>

                <template v-else-if="categorias.length > 0">

                    <!-- Pills de categorias -->
                    <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        <button
                            v-for="cat in categorias"
                            :key="cat.id"
                            @click="categoria_ativa = cat.id"
                            :class="[
                                'flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-200',
                                categoria_ativa === cat.id
                                    ? 'bg-nitec_blue text-white shadow-md'
                                    : 'bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                            ]"
                        >
                            <span>{{ cat.icone }}</span>
                            <span>{{ cat.titulo }}</span>
                        </button>
                    </div>

                    <!-- Grid de cards de perguntas -->
                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div
                            v-for="query in perguntas_categoria"
                            :key="query.slug"
                            @click="executar_consulta(query)"
                            :class="[
                                'rounded-2xl border p-4 transition-all duration-200 cursor-pointer select-none',
                                consulta_ativa && consulta_ativa.slug === query.slug
                                    ? 'border-nitec_blue bg-blue-500/5 shadow-sm'
                                    : 'border-[var(--border-subtle)] hover:border-blue-400/40 hover:bg-blue-500/5'
                            ]"
                        >
                            <p class="text-sm font-black text-[var(--text-primary)] leading-tight">{{ query.titulo }}</p>
                            <p class="text-[11px] text-[var(--text-muted)] font-medium mt-1.5 leading-snug">{{ query.descricao }}</p>

                            <!-- Parâmetros configuráveis -->
                            <div
                                v-if="query.parametros?.length > 0"
                                class="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-wrap gap-2"
                                @click.stop
                            >
                                <div v-for="param in query.parametros" :key="param.chave" class="flex flex-col gap-1">
                                    <label class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-0.5">
                                        {{ param.label }}
                                    </label>
                                    <select
                                        :value="parametros_ativos[query.slug]?.[param.chave] ?? param.padrao"
                                        @change="ao_mudar_parametro(query.slug, param.chave, $event.target.value)"
                                        class="bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-[10px] font-black rounded-lg px-2 py-1.5 outline-none cursor-pointer transition-colors hover:border-nitec_blue focus:border-nitec_blue"
                                        style="color-scheme: dark;"
                                    >
                                        <option
                                            v-for="opcao in param.opcoes"
                                            :key="opcao.valor"
                                            :value="opcao.valor"
                                        >{{ opcao.label }}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Área de resultado da consulta pronta -->
                    <div v-if="consulta_ativa" class="rounded-[1.75rem] border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-card)] shadow-sm">

                        <!-- Cabeçalho do resultado -->
                        <div class="px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-page)] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div>
                                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Resultado</p>
                                <h3 class="text-base font-black text-[var(--text-primary)] mt-1">{{ consulta_ativa.titulo }}</h3>
                            </div>
                            <span
                                v-if="resultado_pronto && !carregando_resultado"
                                class="flex-shrink-0 px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]"
                            >
                                {{ resultado_pronto.total_linhas }} {{ resultado_pronto.total_linhas === 1 ? 'linha' : 'linhas' }}
                            </span>
                        </div>

                        <!-- Loading do resultado -->
                        <div v-if="carregando_resultado" class="px-6 py-10 flex flex-col items-center justify-center text-center">
                            <svg class="animate-spin h-8 w-8 text-nitec_blue mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <p class="text-sm font-black text-[var(--text-primary)]">Executando consulta...</p>
                        </div>

                        <!-- Erro do resultado -->
                        <div v-else-if="erro_resultado" class="px-6 py-8 text-center">
                            <p class="text-sm font-black text-red-500">{{ erro_resultado }}</p>
                        </div>

                        <!-- Tabela sem dados -->
                        <div
                            v-else-if="resultado_pronto && resultado_pronto.total_linhas === 0"
                            class="px-6 py-10 text-center"
                        >
                            <p class="text-sm font-black text-[var(--text-primary)]">Nenhum resultado encontrado.</p>
                            <p class="text-[11px] text-[var(--text-muted)] font-medium mt-1">Esta consulta não retornou dados para o período atual.</p>
                        </div>

                        <!-- Tabela com dados -->
                        <div
                            v-else-if="resultado_pronto && resultado_pronto.total_linhas > 0"
                            class="overflow-x-auto"
                        >
                            <table class="w-full text-left text-xs whitespace-nowrap">
                                <thead class="bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
                                    <tr>
                                        <th
                                            v-for="coluna in resultado_pronto.colunas"
                                            :key="coluna"
                                            class="px-5 py-3 font-black uppercase tracking-widest text-[9px] text-[var(--text-muted)]"
                                        >
                                            {{ coluna }}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-[var(--border-subtle)]">
                                    <tr
                                        v-for="(linha, idx_linha) in resultado_pronto.linhas"
                                        :key="'resultado-' + idx_linha"
                                        class="hover:bg-[var(--bg-card-hover)] transition-colors"
                                    >
                                        <td
                                            v-for="coluna in resultado_pronto.colunas"
                                            :key="'resultado-' + idx_linha + '-' + coluna"
                                            class="px-5 py-3 font-medium text-[var(--text-primary)]"
                                        >
                                            {{ linha[coluna] ?? '-' }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                    </div>

                </template>

            </div>
        </div>

        <!-- ═══════════════════════════════════════════════════════════════ -->
        <!-- SECAO 2: PERGUNTA LIVRE AO AGENTE IA                           -->
        <!-- ═══════════════════════════════════════════════════════════════ -->
        <div class="bg-[var(--bg-card)] rounded-[2rem] shadow-sm border border-[var(--border-subtle)] flex flex-col transition-colors duration-300">

            <!-- Cabeçalho da seção -->
            <div class="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-page)] rounded-t-[2rem] transition-colors duration-300">
                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Inteligência Artificial</p>
                        <h2 class="text-base font-black text-[var(--text-primary)] tracking-tight mt-1">Pergunta Livre ao Agente IA</h2>
                        <p class="text-xs text-[var(--text-muted)] font-medium mt-1">
                            Para perguntas que não estão na lista acima.
                        </p>
                    </div>

                    <button
                        v-if="historico_consultas.length > 0"
                        @click="$emit('limpar')"
                        class="px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors w-full lg:w-auto"
                    >
                        Limpar Historico
                    </button>
                </div>

                <div class="mt-5 flex flex-col gap-3">
                    <textarea
                        :value="pergunta_agente"
                        rows="4"
                        placeholder="Ex.: Qual o produto mais vendido nos ultimos 30 dias?"
                        class="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl px-5 py-4 text-sm font-medium text-[var(--text-primary)] outline-none resize-none focus:border-blue-500 shadow-sm transition-colors placeholder:text-[var(--text-muted)]"
                        @input="$emit('update:pergunta_agente', $event.target.value)"
                        @keydown.ctrl.enter.prevent="$emit('enviar')"
                    />

                    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            Use `Ctrl + Enter` para enviar rapidamente.
                        </p>

                        <button
                            :disabled="consultando_agente || !pergunta_agente.trim()"
                            @click="$emit('enviar')"
                            class="px-6 py-3 rounded-2xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                        >
                            {{ consultando_agente ? 'Consultando...' : 'Perguntar ao Agente' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Histórico de consultas ao agente -->
            <div class="p-6 flex flex-col gap-5">

                <!-- Spinner enquanto o agente processa -->
                <div
                    v-if="consultando_agente"
                    class="rounded-[1.75rem] border border-blue-500/20 bg-blue-500/5 px-6 py-10 flex flex-col items-center justify-center text-center"
                >
                    <svg class="animate-spin h-9 w-9 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p class="text-sm font-black text-[var(--text-primary)]">O agente esta analisando a sua base.</p>
                    <p class="text-[11px] text-[var(--text-muted)] font-medium mt-2">Essa consulta pode levar alguns segundos.</p>
                </div>

                <!-- Estado vazio -->
                <div
                    v-else-if="historico_consultas.length === 0"
                    class="rounded-[1.75rem] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-page)] px-6 py-10 text-center"
                >
                    <p class="text-sm font-black text-[var(--text-primary)]">Nenhuma consulta feita ainda.</p>
                    <p class="text-[11px] text-[var(--text-muted)] font-medium mt-2">
                        Faça uma pergunta acima e o agente vai responder com texto, SQL gerado e preview dos dados.
                    </p>
                </div>

                <!-- Cards do histórico -->
                <div
                    v-for="consulta in historico_consultas"
                    :key="consulta.id_consulta"
                    class="rounded-[1.75rem] border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-card)] shadow-sm"
                >
                    <div class="px-6 py-5 border-b border-[var(--border-subtle)] bg-[var(--bg-page)]">
                        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                            <div>
                                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Pergunta</p>
                                <h3 class="text-base font-black text-[var(--text-primary)] mt-2">{{ consulta.pergunta }}</h3>
                            </div>

                            <div class="flex flex-wrap gap-2">
                                <span class="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[10px] font-black uppercase tracking-widest">
                                    {{ consulta.tipo_resposta || 'resposta' }}
                                </span>
                                <span
                                    v-if="consulta.duracao_ms"
                                    class="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest"
                                >
                                    {{ consulta.duracao_ms }} ms
                                </span>
                            </div>
                        </div>
                    </div>

                    <div class="px-6 py-5 flex flex-col gap-5">
                        <div class="rounded-2xl bg-emerald-500/5 border border-emerald-500/15 px-5 py-4">
                            <p class="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-2">Resposta</p>
                            <p class="text-sm leading-relaxed font-medium text-[var(--text-primary)] whitespace-pre-line">
                                {{ consulta.resposta_texto }}
                            </p>
                        </div>

                        <div v-if="consulta.advertencias && consulta.advertencias.length > 0" class="rounded-2xl bg-amber-500/5 border border-amber-500/20 px-5 py-4">
                            <p class="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-2">Advertencias</p>
                            <ul class="flex flex-col gap-2">
                                <li
                                    v-for="advertencia in consulta.advertencias"
                                    :key="advertencia"
                                    class="text-sm font-medium text-[var(--text-primary)]"
                                >
                                    {{ advertencia }}
                                </li>
                            </ul>
                        </div>

                        <details v-if="consulta.sql_gerado" class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] px-5 py-4">
                            <summary class="cursor-pointer text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                SQL Gerado
                            </summary>
                            <pre class="mt-4 whitespace-pre-wrap break-words text-xs font-mono text-[var(--text-primary)]">{{ consulta.sql_gerado }}</pre>
                        </details>

                        <div
                            v-if="consulta.linhas && consulta.linhas.length > 0 && consulta.colunas && consulta.colunas.length > 0"
                            class="rounded-2xl border border-[var(--border-subtle)] overflow-hidden"
                        >
                            <div class="px-5 py-4 bg-[var(--bg-page)] border-b border-[var(--border-subtle)]">
                                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                    Preview dos Dados
                                </p>
                            </div>

                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-xs whitespace-nowrap">
                                    <thead class="bg-[var(--bg-card)] border-b border-[var(--border-subtle)]">
                                        <tr>
                                            <th
                                                v-for="coluna in consulta.colunas"
                                                :key="coluna"
                                                class="px-5 py-3 font-black uppercase tracking-widest text-[9px] text-[var(--text-muted)]"
                                            >
                                                {{ coluna }}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-[var(--border-subtle)]">
                                        <tr
                                            v-for="(linha, idx_linha) in consulta.linhas"
                                            :key="consulta.id_consulta + '-' + idx_linha"
                                            class="hover:bg-[var(--bg-card-hover)] transition-colors"
                                        >
                                            <td
                                                v-for="coluna in consulta.colunas"
                                                :key="consulta.id_consulta + '-' + idx_linha + '-' + coluna"
                                                class="px-5 py-3 font-medium text-[var(--text-primary)]"
                                            >
                                                {{ linha[coluna] ?? '-' }}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>

    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import api_cliente from '../../servicos/api_cliente.js';

const props = defineProps({
    pergunta_agente:    { type: String,  default: '' },
    consultando_agente: { type: Boolean, default: false },
    historico_consultas: { type: Array, default: () => [] },
    sugestoes_consulta: { type: Array,  default: () => [] },
});

defineEmits([
    'update:pergunta_agente',
    'enviar',
    'limpar',
    'selecionar-sugestao',
]);

// ── Estado interno das consultas prontas ────────────────────────────────────
const categorias           = ref([]);
const categoria_ativa      = ref(null);
const carregando_catalogo  = ref(false);
const consulta_ativa       = ref(null);
const resultado_pronto     = ref(null);
const carregando_resultado = ref(false);
const erro_resultado       = ref(null);
const parametros_ativos    = ref({}); // { [slug]: { chave: valor } }

// ── Queries da categoria selecionada ────────────────────────────────────────
const perguntas_categoria = computed(() => {
    if (!categoria_ativa.value) return [];
    const cat = categorias.value.find(c => c.id === categoria_ativa.value);
    return cat ? cat.queries : [];
});

// ── Inicializa os defaults de parâmetros de todas as queries ─────────────────
function inicializar_parametros() {
    const mapa = {};
    for (const cat of categorias.value) {
        for (const query of cat.queries) {
            if (query.parametros?.length > 0) {
                mapa[query.slug] = {};
                for (const param of query.parametros) {
                    mapa[query.slug][param.chave] = param.padrao;
                }
            }
        }
    }
    parametros_ativos.value = mapa;
}

// ── Muda um parâmetro e re-executa se a query estiver ativa ─────────────────
function ao_mudar_parametro(slug, chave, valor) {
    if (!parametros_ativos.value[slug]) {
        parametros_ativos.value[slug] = {};
    }
    parametros_ativos.value[slug][chave] = valor;

    if (consulta_ativa.value?.slug === slug) {
        executar_consulta(consulta_ativa.value);
    }
}

// ── Execução de uma consulta pronta ─────────────────────────────────────────
async function executar_consulta(query) {
    consulta_ativa.value       = query;
    carregando_resultado.value = true;
    resultado_pronto.value     = null;
    erro_resultado.value       = null;

    const params = parametros_ativos.value[query.slug] ?? {};
    const qs     = new URLSearchParams(params).toString();
    const url    = '/analises/consultas-prontas/' + query.slug + (qs ? '?' + qs : '');

    try {
        const resposta = await api_cliente.get(url);
        resultado_pronto.value = resposta.data;
    } catch {
        erro_resultado.value = 'Não foi possível carregar esta consulta.';
    } finally {
        carregando_resultado.value = false;
    }
}

// ── Carregamento do catálogo na montagem ────────────────────────────────────
onMounted(async () => {
    carregando_catalogo.value = true;
    try {
        const resposta = await api_cliente.get('/analises/consultas-prontas');
        categorias.value = resposta.data.categorias ?? [];
        inicializar_parametros();
        if (categorias.value.length > 0) {
            categoria_ativa.value = categorias.value[0].id;
        }
    } catch {
        // falha silenciosa — catálogo permanece vazio
    } finally {
        carregando_catalogo.value = false;
    }
});
</script>
