<template>
    <div class="p-6 md:p-8 bg-[var(--bg-page)] h-full overflow-y-auto font-sans transition-colors duration-300">
        <header class="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[2rem] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
                <p class="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-600">Cardapio Digital</p>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight mt-2">Cardapios PDF e QR Codes</h1>
                <p class="text-sm font-bold text-[var(--text-muted)] mt-2 max-w-3xl">
                    Envie os PDFs dos seus cardapios e gere os QR Codes das mesas. O cliente le tudo em formato livro digital.
                </p>
            </div>
            <div class="flex gap-2 w-full lg:w-auto">
                <button
                    @click="voltar_painel"
                    class="lg:hidden flex-1 px-5 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)] text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                    Voltar
                </button>
            </div>
        </header>

        <div v-if="carregando" class="py-20 flex flex-col items-center justify-center text-[var(--text-muted)]">
            <svg class="animate-spin h-10 w-10 text-emerald-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-sm font-black">Preparando o cardapio digital...</p>
        </div>

        <div v-else class="mt-6 flex flex-col gap-6">
            <section class="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[2rem] p-6 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-6">
                    <div>
                        <h2 class="text-lg font-black text-[var(--text-primary)]">Cardapios em PDF</h2>
                        <p class="text-xs font-bold text-[var(--text-muted)] mt-1">
                            Envie um ou mais arquivos PDF (cardapio principal, happy hour, promocional). O cliente vê tudo em formato livro digital.
                        </p>
                    </div>
                </div>

                <!-- Formulário de upload -->
                <form
                    class="rounded-[1.5rem] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-page)] p-5 mb-5"
                    @submit.prevent="enviar_pdf"
                >
                    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-end">
                        <label class="flex flex-col gap-2">
                            <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome do cardapio</span>
                            <input
                                v-model="form_pdf.nome_cardapio"
                                type="text"
                                placeholder="Ex: Principal, Happy Hour, Promocoes"
                                class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500"
                            />
                        </label>

                        <label class="flex flex-col gap-2">
                            <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Arquivo PDF (max 20MB)</span>
                            <input
                                type="file"
                                accept="application/pdf"
                                @change="on_arquivo_selecionado"
                                class="text-sm font-bold text-[var(--text-primary)] file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:text-white file:text-xs file:font-black file:uppercase file:tracking-widest hover:file:bg-emerald-700 file:cursor-pointer"
                            />
                        </label>
                    </div>

                    <div class="flex justify-end mt-4">
                        <button
                            type="submit"
                            :disabled="enviando_pdf || !form_pdf.arquivo"
                            class="px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                        >
                            {{ enviando_pdf ? 'Enviando...' : 'Enviar PDF' }}
                        </button>
                    </div>
                </form>

                <!-- Lista de PDFs cadastrados -->
                <div v-if="lista_pdfs.length === 0" class="text-center py-10 text-[var(--text-muted)]">
                    <p class="text-sm font-black">Nenhum cardapio enviado ainda.</p>
                    <p class="text-xs font-bold mt-2">Suba seu primeiro PDF acima.</p>
                </div>

                <ul v-else class="space-y-3">
                    <li
                        v-for="pdf in lista_pdfs"
                        :key="pdf.id"
                        class="rounded-[1.5rem] border border-[var(--border-subtle)] bg-[var(--bg-page)] p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                        :class="pdf.ativo ? 'border-emerald-500/30' : 'opacity-70'"
                    >
                        <div class="flex items-center gap-3 min-w-0 flex-1">
                            <div class="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 text-[10px] font-black tracking-widest shrink-0">
                                PDF
                            </div>
                            <div class="min-w-0 flex-1">
                                <input
                                    :value="pdf.nome_cardapio"
                                    @change="(e) => renomear_pdf(pdf, e.target.value)"
                                    type="text"
                                    class="w-full bg-transparent outline-none text-sm font-black text-[var(--text-primary)] truncate"
                                />
                                <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                    {{ formatar_tamanho(pdf.arquivo_tamanho) }}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <a
                                :href="pdf.arquivo_url"
                                target="_blank"
                                rel="noopener"
                                class="px-3 py-2 rounded-xl border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
                            >
                                Abrir
                            </a>

                            <button
                                @click="alternar_pdf_ativo(pdf)"
                                :disabled="pdf_processando === pdf.id"
                                class="relative inline-flex h-8 w-16 items-center rounded-full transition-colors"
                                :class="pdf.ativo ? 'bg-emerald-500' : 'bg-slate-300'"
                            >
                                <span
                                    class="inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform"
                                    :class="pdf.ativo ? 'translate-x-9' : 'translate-x-1'"
                                ></span>
                                <span class="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-white/90">
                                    {{ pdf_processando === pdf.id ? '...' : (pdf.ativo ? 'On' : 'Off') }}
                                </span>
                            </button>

                            <button
                                @click="excluir_pdf(pdf)"
                                :disabled="pdf_processando === pdf.id"
                                class="px-3 py-2 rounded-xl border border-rose-500/30 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-colors disabled:opacity-50"
                            >
                                Remover
                            </button>
                        </div>
                    </li>
                </ul>
            </section>

            <section class="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[2rem] p-6 shadow-sm">
                <GaleriaQrMesas
                    :mesas="lista_mesas"
                    titulo="QR Codes unicos das mesas"
                    subtitulo="Cada QR leva direto para a rota publica do cardapio digital da mesa correspondente."
                />
            </section>
        </div>
    </div>
</template>

<script setup>
import GaleriaQrMesas from './componentes_mesa_caixa/GaleriaQrMesas.vue';
import { useLogicaCardapioAdmin } from './pagina_cardapio_admin_logica.js';

const {
    carregando,
    lista_mesas,
    voltar_painel,

    // pdfs
    lista_pdfs,
    form_pdf,
    enviando_pdf,
    pdf_processando,
    on_arquivo_selecionado,
    enviar_pdf,
    alternar_pdf_ativo,
    renomear_pdf,
    excluir_pdf,
    formatar_tamanho,
} = useLogicaCardapioAdmin();
</script>
