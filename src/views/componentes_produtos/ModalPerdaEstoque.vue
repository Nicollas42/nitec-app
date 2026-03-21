<template>
    <div class="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="w-full sm:max-w-sm rounded-t-[2rem] sm:rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-subtle)] border-b-0 sm:border-b overflow-hidden">

            <!-- Handle mobile -->
            <div class="sm:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 rounded-full bg-[var(--border-subtle)]"></div>
            </div>

            <!-- Cabeçalho -->
            <div class="px-6 pt-5 pb-4 border-b border-[var(--border-subtle)] bg-red-500/5">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h2 class="text-base font-black text-[var(--text-primary)] flex items-center gap-2">
                            <span class="text-red-500">📉</span> Baixa de Estoque
                        </h2>
                        <p class="text-xs font-bold text-red-500 mt-0.5">{{ formulario_perda.nome_produto }}</p>
                    </div>
                    <button @click="$emit('fechar')"
                        class="h-9 w-9 flex-none flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm">
                        ✕
                    </button>
                </div>
            </div>

            <div class="p-6 space-y-5">

                <!-- Quantidade -->
                <div class="space-y-2">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">
                        Quantas unidades retirar?
                    </label>
                    <div class="grid grid-cols-[3rem_minmax(0,8rem)_3rem] justify-center gap-3">
                        <button type="button"
                            @click="formulario_perda.quantidade = Math.max(1, Number(formulario_perda.quantidade) - 1)"
                            class="h-11 w-12 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xl font-black text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition-all">
                            −
                        </button>
                        <input v-model="formulario_perda.quantidade" type="number" min="1"
                            class="w-full px-3 py-2.5 rounded-xl border border-red-500/20 bg-red-500/5 text-center text-2xl font-black text-red-500 outline-none focus:border-red-500 transition-colors" />
                        <button type="button"
                            @click="formulario_perda.quantidade = Number(formulario_perda.quantidade) + 1"
                            class="h-11 w-12 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-xl font-black text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] active:scale-95 transition-all">
                            +
                        </button>
                    </div>
                </div>

                <!-- Motivo em chips -->
                <div class="space-y-2">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        Motivo *
                    </label>
                    <div class="grid grid-cols-2 gap-2">
                        <button v-for="m in motivos" :key="m.valor" type="button"
                            @click="formulario_perda.motivo = m.valor"
                            class="py-3 px-3 rounded-xl border text-[10px] font-black text-left transition-all active:scale-95"
                            :class="formulario_perda.motivo === m.valor
                                ? 'border-red-500/50 bg-red-500/15 text-red-600 shadow-sm'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:border-[var(--text-muted)]/30'">
                            <span class="text-base block mb-1">{{ m.icone }}</span>
                            {{ m.label }}
                        </button>
                    </div>
                </div>

                <!-- Observação -->
                <div class="space-y-2">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        Observação <span class="font-normal opacity-60">(opcional)</span>
                    </label>
                    <textarea v-model="formulario_perda.observacao" rows="2"
                        placeholder="Detalhe o ocorrido se necessário..."
                        class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm text-[var(--text-primary)] outline-none focus:border-red-400 transition-colors resize-none font-bold">
                    </textarea>
                </div>
            </div>

            <!-- Rodapé -->
            <div class="px-6 pb-6 flex gap-3">
                <button @click="$emit('fechar')"
                    class="flex-1 py-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card)] transition-colors">
                    Cancelar
                </button>
                <button @click="$emit('confirmar')"
                    :disabled="registrando_perda || !formulario_perda.quantidade || !formulario_perda.motivo"
                    class="flex-1 py-3.5 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-red-700 active:scale-95 transition-all">
                    {{ registrando_perda ? 'Processando...' : 'Confirmar Baixa' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
defineProps({
    formulario_perda: { type: Object, required: true },
    registrando_perda: { type: Boolean, required: true },
});

defineEmits(['fechar', 'confirmar']);

const motivos = [
    { valor: 'Quebra / Dano', icone: '💥', label: 'Quebra / Dano' },
    { valor: 'Vencimento / Estragou', icone: '🗑️', label: 'Vencimento' },
    { valor: 'Consumo Interno (Staff)', icone: '👨‍🍳', label: 'Consumo Staff' },
    { valor: 'Perda por Erro de Cozinha', icone: '🍽️', label: 'Erro Cozinha' },
];
</script>
