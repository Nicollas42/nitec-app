<template>
    <div class="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div class="w-full sm:max-w-xl max-h-[95dvh] overflow-y-auto rounded-t-[2rem] sm:rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-subtle)] border-b-0 sm:border-b">

            <!-- Handle mobile -->
            <div class="sm:hidden flex justify-center pt-3 pb-1">
                <div class="w-10 h-1 rounded-full bg-[var(--border-subtle)]"></div>
            </div>

            <!-- Cabeçalho -->
            <div class="px-6 pt-4 pb-4 border-b border-[var(--border-subtle)]">
                <div class="flex items-start justify-between gap-3">
                    <div>
                        <h2 class="text-lg font-black text-[var(--text-primary)]">Entrada de Estoque</h2>
                        <p class="text-xs font-bold text-[var(--text-muted)] mt-0.5">
                            {{ formulario_entrada.nome_produto }}
                        </p>
                    </div>
                    <button @click="$emit('fechar')"
                        class="h-9 w-9 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors text-sm">
                        ✕
                    </button>
                </div>

                <!-- Seletor de modo -->
                <div class="mt-4 grid grid-cols-2 gap-2 p-1 bg-[var(--bg-page)] rounded-xl border border-[var(--border-subtle)]">
                    <button type="button"
                        @click="formulario_entrada.modo_entrada = 'compra_fornecedor'; $emit('atualizar-modo')"
                        :disabled="!produto_entrada_possui_fornecedores_vinculados"
                        class="py-2.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        :class="formulario_entrada.modo_entrada === 'compra_fornecedor'
                            ? 'bg-[var(--bg-card)] shadow-sm border border-[var(--border-subtle)] text-blue-500'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'">
                        📦 Compra (NF)
                    </button>
                    <button type="button"
                        @click="formulario_entrada.modo_entrada = 'ajuste_manual'; $emit('atualizar-modo')"
                        class="py-2.5 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                        :class="formulario_entrada.modo_entrada === 'ajuste_manual'
                            ? 'bg-[var(--bg-card)] shadow-sm border border-[var(--border-subtle)] text-[var(--text-primary)]'
                            : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'">
                        ✏️ Ajuste / Produção
                    </button>
                </div>

                <!-- Aviso se produto não tem fornecedores vinculados -->
                <p v-if="!produto_entrada_possui_fornecedores_vinculados" class="mt-2 text-[10px] font-bold text-amber-600">
                    Este item não tem fornecedores vinculados. Cadastre um fornecedor no item para habilitar o modo Compra (NF).
                </p>
            </div>

            <div class="p-6 space-y-5">

                <!-- Fornecedor (só no modo compra) -->
                <div v-if="formulario_entrada.modo_entrada === 'compra_fornecedor'" class="space-y-3">
                    <div class="flex items-center justify-between">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fornecedor *</label>
                        <button type="button" @click="$emit('abrir-novo-fornecedor')"
                            class="text-[10px] font-black text-blue-500 hover:underline">
                            + Novo cadastro
                        </button>
                    </div>

                    <div class="relative">
                        <input
                            v-model="termo_local"
                            type="text"
                            placeholder="Digite o nome ou CNPJ do fornecedor..."
                            class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500 transition-colors"
                            @focus="$emit('abrir-dropdown-fornecedor')"
                            @blur="fechar_apos_blur"
                        />
                        <div v-if="dropdown_fornecedor_entrada_aberto"
                            class="absolute z-[120] mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl">
                            <button
                                v-for="f in fornecedores_filtrados_entrada" :key="f.id"
                                type="button"
                                class="w-full text-left p-3 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)] transition-colors"
                                @mousedown.prevent="$emit('selecionar-fornecedor', f)">
                                <div class="text-xs font-bold text-[var(--text-primary)]">{{ f.nome_fantasia }}</div>
                                <div class="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">{{ f.cnpj }}</div>
                            </button>
                            <div v-if="!fornecedores_filtrados_entrada.length"
                                class="p-3 text-xs italic text-[var(--text-muted)] text-center">
                                Nenhum fornecedor vinculado encontrado.
                            </div>
                        </div>
                    </div>

                    <!-- Chip do fornecedor selecionado com fator de conversão -->
                    <div v-if="fornecedor_entrada_vinculado"
                        class="rounded-xl border border-blue-500/20 bg-blue-500/5 p-3 text-xs font-bold text-blue-600">
                        <div class="flex items-center justify-between">
                            <span>SKU: <span class="font-mono">{{ fornecedor_entrada_vinculado.codigo_sku_fornecedor || '—' }}</span></span>
                            <span>Fator: <strong>{{ fornecedor_entrada_vinculado.fator_conversao }}x</strong></span>
                        </div>
                        <p v-if="Number(fornecedor_entrada_vinculado.fator_conversao) > 1" class="mt-1 text-blue-500 font-bold">
                            1 embalagem comprada = {{ fornecedor_entrada_vinculado.fator_conversao }} unidades no estoque
                        </p>
                    </div>
                </div>

                <!-- Campos principais de entrada -->
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                            {{ formulario_entrada.modo_entrada === 'compra_fornecedor' ? 'Qtd. de embalagens' : 'Qtd. de unidades' }}
                        </label>
                        <input
                            v-model="formulario_entrada.quantidade_comprada"
                            type="number" min="1"
                            class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500 transition-colors text-center text-xl font-black"
                        />
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                            {{ formulario_entrada.modo_entrada === 'compra_fornecedor' ? 'Custo / embalagem (R$)' : 'Custo unitário (R$)' }}
                        </label>
                        <input
                            v-model="formulario_entrada.custo_unitario_compra"
                            type="number" min="0" step="0.01"
                            class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500 transition-colors text-center text-xl font-black"
                        />
                    </div>
                </div>

                <!-- Data de validade -->
                <div class="space-y-1.5">
                    <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Data de Validade do Lote <span class="font-normal text-[var(--text-muted)]">(opcional)</span></label>
                    <input v-model="formulario_entrada.data_validade_lote" type="date"
                        class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500 transition-colors" />
                    <p v-if="!formulario_entrada.data_validade_lote" class="text-[10px] font-bold text-amber-600">
                        Sem validade definida — preencha para produtos perecíveis.
                    </p>
                </div>

                <!-- Resumo final da operação -->
                <div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-4 space-y-3">
                    <h3 class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Resumo da Operação</h3>
                    <div class="grid grid-cols-3 gap-3">

                        <!-- Unidades que entram -->
                        <div class="text-center rounded-xl bg-blue-500/5 border border-blue-500/20 p-3">
                            <p class="text-[9px] font-black uppercase tracking-widest text-blue-500">Unidades</p>
                            <p class="text-2xl font-black text-blue-500 mt-1 leading-none">{{ formulario_entrada.unidades_entrada }}</p>
                            <p class="text-[9px] font-bold text-[var(--text-muted)] mt-1">entram no estoque</p>
                        </div>

                        <!-- Custo por unidade — o mais importante -->
                        <div class="text-center rounded-xl border p-3"
                            :class="formulario_entrada.custo_unitario_medio_entrada > 0
                                ? 'bg-amber-500/5 border-amber-500/20'
                                : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'">
                            <p class="text-[9px] font-black uppercase tracking-widest"
                                :class="formulario_entrada.custo_unitario_medio_entrada > 0 ? 'text-amber-600' : 'text-[var(--text-muted)]'">
                                Custo / UN
                            </p>
                            <p class="text-lg font-black mt-1 leading-none"
                                :class="formulario_entrada.custo_unitario_medio_entrada > 0 ? 'text-amber-600' : 'text-[var(--text-muted)]'">
                                R$ {{ Number(formulario_entrada.custo_unitario_medio_entrada || 0).toFixed(2) }}
                            </p>
                            <p class="text-[9px] font-bold text-[var(--text-muted)] mt-1">novo custo médio</p>
                        </div>

                        <!-- Custo total do lote -->
                        <div class="text-center rounded-xl bg-green-500/5 border border-green-500/20 p-3">
                            <p class="text-[9px] font-black uppercase tracking-widest text-green-600">Total do Lote</p>
                            <p class="text-lg font-black text-green-600 mt-1 leading-none">
                                R$ {{ Number(formulario_entrada.custo_total_entrada || 0).toFixed(2) }}
                            </p>
                            <p class="text-[9px] font-bold text-[var(--text-muted)] mt-1">
                                {{ formulario_entrada.modo_entrada === 'compra_fornecedor'
                                    ? formulario_entrada.quantidade_comprada + ' emb. × R$ ' + Number(formulario_entrada.custo_unitario_compra || 0).toFixed(2)
                                    : formulario_entrada.unidades_entrada + ' un. × R$ ' + Number(formulario_entrada.custo_unitario_compra || 0).toFixed(2)
                                }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Rodapé fixo -->
            <div class="px-6 pb-6 flex gap-3 sticky bottom-0 bg-[var(--bg-card)] pt-3 border-t border-[var(--border-subtle)]">
                <button @click="$emit('fechar')"
                    class="flex-1 py-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card)] transition-colors">
                    Cancelar
                </button>
                <button @click="$emit('confirmar')"
                    :disabled="registrando_entrada || !entrada_pronta_para_salvar"
                    class="flex-1 py-3.5 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:bg-blue-700 transition-colors">
                    {{ registrando_entrada ? 'Lançando...' : 'Confirmar Entrada' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    formulario_entrada: { type: Object, required: true },
    registrando_entrada: { type: Boolean, required: true },
    termo_fornecedor_entrada: { type: String, required: true },
    dropdown_fornecedor_entrada_aberto: { type: Boolean, required: true },
    fornecedores_filtrados_entrada: { type: Array, required: true },
    fornecedor_entrada_vinculado: { type: Object, default: null },
    entrada_pronta_para_salvar: { type: Boolean, required: true },
    produto_entrada_possui_fornecedores_vinculados: { type: Boolean, required: true },
});

const emit = defineEmits([
    'fechar',
    'confirmar',
    'abrir-dropdown-fornecedor',
    'fechar-dropdown-fornecedor',
    'selecionar-fornecedor',
    'abrir-novo-fornecedor',
    'atualizar-modo',
    'update:termo_fornecedor_entrada',
]);

const termo_local = computed({
    get: () => props.termo_fornecedor_entrada,
    set: (v) => emit('update:termo_fornecedor_entrada', v),
});

const fechar_apos_blur = () => {
    setTimeout(() => emit('fechar-dropdown-fornecedor'), 120);
};
</script>