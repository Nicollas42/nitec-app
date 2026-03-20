<template>
    <div class="bg-[var(--bg-card)] rounded-[2rem] shadow-sm border border-[var(--border-subtle)] flex flex-col transition-colors duration-300">
        <div class="p-6 border-b border-[var(--border-subtle)] bg-[var(--bg-page)] rounded-t-[2rem] transition-colors duration-300">
            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                <div>
                    <h2 class="text-lg font-black text-[var(--text-primary)] tracking-tight">Consultas ao Agente</h2>
                    <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">
                        Pergunte em linguagem natural sobre vendas, estoque, equipe e auditoria.
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

            <div class="mt-5 flex flex-wrap gap-2">
                <button
                    v-for="sugestao in sugestoes_consulta"
                    :key="sugestao"
                    @click="$emit('selecionar-sugestao', sugestao)"
                    class="px-3 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-nitec_blue hover:border-blue-400/40 hover:bg-blue-500/5 transition-colors text-left"
                >
                    {{ sugestao }}
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

        <div class="p-6 flex flex-col gap-5">
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

            <div
                v-else-if="historico_consultas.length === 0"
                class="rounded-[1.75rem] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-page)] px-6 py-10 text-center"
            >
                <p class="text-sm font-black text-[var(--text-primary)]">Nenhuma consulta feita ainda.</p>
                <p class="text-[11px] text-[var(--text-muted)] font-medium mt-2">
                    Faça uma pergunta acima e o agente vai responder com texto, SQL gerado e preview dos dados.
                </p>
            </div>

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
</template>

<script setup>
defineProps({
    pergunta_agente: { type: String, default: '' },
    consultando_agente: { type: Boolean, default: false },
    historico_consultas: { type: Array, default: () => [] },
    sugestoes_consulta: { type: Array, default: () => [] },
});

defineEmits([
    'update:pergunta_agente',
    'enviar',
    'limpar',
    'selecionar-sugestao',
]);
</script>
