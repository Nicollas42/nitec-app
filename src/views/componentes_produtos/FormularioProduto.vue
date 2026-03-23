<template>
    <section class="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-subtle)] shadow-sm overflow-hidden">

        <!-- Cabeçalho -->
        <header class="px-7 pt-6 pb-5 border-b border-[var(--border-subtle)]">
            <div class="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 class="text-xl font-black text-[var(--text-primary)]">
                        {{ modo_edicao ? 'Editar Item' : 'Novo Item no Catálogo' }}
                    </h2>
                    <p class="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                        O cadastro é sempre na base da unidade. Fornecedor e fator de conversão orientam o custo real.
                    </p>
                </div>
                <button type="button" @click="$emit('cancelar')"
                    class="px-5 py-2.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                    ← Voltar
                </button>
            </div>

            <!-- Tipo do item -->
            <div class="mt-4 grid grid-cols-2 gap-2 p-1 bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)]">
                <button v-for="tipo in tipos_item" :key="tipo.valor" type="button"
                    @click="formulario_dados.tipo_item = tipo.valor; ao_mudar_tipo(tipo.valor)"
                    class="flex items-center gap-3 py-3 px-4 rounded-xl transition-all"
                    :class="formulario_dados.tipo_item === tipo.valor
                        ? 'bg-[var(--bg-card)] shadow-sm border border-[var(--border-subtle)]'
                        : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'">
                    <span class="text-xl leading-none flex-none">{{ tipo.icone }}</span>
                    <div class="text-left">
                        <p class="text-[11px] font-black uppercase tracking-widest leading-tight"
                            :class="formulario_dados.tipo_item === tipo.valor ? 'text-nitec_blue' : ''">
                            {{ tipo.label }}
                        </p>
                        <p class="text-[10px] font-bold text-[var(--text-muted)] leading-tight mt-0.5">{{ tipo.descricao }}</p>
                    </div>
                </button>
            </div>
        </header>

        <div v-if="carregando_produto" class="p-10 text-center text-[var(--text-muted)] font-bold animate-pulse">
            Carregando dados do item...
        </div>

        <form v-else @submit.prevent="$emit('salvar')" class="divide-y divide-[var(--border-subtle)]">

            <!-- ── PASSO 1: Identidade ── -->
            <div class="p-6 space-y-4">
                <div class="flex items-center gap-2">
                    <span class="flex-none h-6 w-6 rounded-full bg-nitec_blue text-white text-[10px] font-black flex items-center justify-center">1</span>
                    <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Identidade do Item</h3>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome *</label>
                        <input v-model="formulario_dados.nome_produto" type="text" required
                            :placeholder="placeholder_nome"
                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                    </div>
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Categoria</label>
                            <button type="button" @click="modal_categorias_visivel = true"
                                class="text-[10px] font-black text-nitec_blue hover:underline tracking-widest uppercase">
                                + Gerenciar
                            </button>
                        </div>
                        <SelectPesquisavel
                            :model-value="formulario_dados.categoria"
                            :opcoes="opcoes_categoria"
                            chave_valor="valor"
                            chave_rotulo="label"
                            placeholder="Pesquisar categoria..."
                            texto_vazio="Nenhuma categoria encontrada."
                            @update:model-value="formulario_dados.categoria = $event"
                        />
                    </div>
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Unidade de Venda</label>
                        <select v-model="formulario_dados.unidade_medida"
                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors">
                            <option v-for="u in unidades_opcoes" :key="u.valor" :value="u.valor">
                                {{ u.valor }} — {{ u.descricao }}
                            </option>
                        </select>
                    </div>
                </div>

                <!-- Código interno + aliases -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Código Interno *</label>
                        <input v-model="formulario_dados.codigo_interno" type="text"
                            placeholder="Ex: CERV-HNK-330, DOSE-WKY"
                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] font-mono outline-none focus:border-nitec_blue transition-colors" />
                    </div>
                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                Códigos de Barras <span class="font-normal">(EAN/GTIN — opcional)</span>
                            </label>
                            <button type="button" @click="$emit('adicionar-alias')"
                                class="text-[10px] font-black text-nitec_blue hover:underline">
                                + Adicionar
                            </button>
                        </div>
                        <div v-if="formulario_dados.codigos_barras_adicionais.length === 0"
                            class="p-3 rounded-xl border border-dashed border-[var(--border-subtle)] text-[11px] font-bold text-[var(--text-muted)] text-center">
                            Nenhum código de barras. Clique em "+ Adicionar".
                        </div>
                        <div v-else class="space-y-2">
                            <div v-for="(cb, idx) in formulario_dados.codigos_barras_adicionais" :key="'cb_'+idx"
                                class="flex gap-2">
                                <input v-model="cb.codigo_barras" type="text" :placeholder="'EAN ' + (idx + 1)"
                                    class="flex-1 p-2.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] font-mono outline-none focus:border-nitec_blue transition-colors" />
                                <input v-model="cb.descricao_variacao" type="text" placeholder="Variação"
                                    class="flex-1 p-2.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                                <button type="button" @click="$emit('remover-alias', idx)"
                                    class="flex-none h-10 w-10 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 transition-colors text-sm">
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Requer Cozinha -->
                <div class="flex items-center justify-between py-3 px-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)]">
                    <div>
                        <p class="text-sm font-bold text-[var(--text-primary)]">Passa pela cozinha</p>
                        <p class="text-[11px] font-bold text-[var(--text-muted)] mt-0.5">Item entra no painel da cozinha ao ser pedido</p>
                    </div>
                    <div @click="formulario_dados.requer_cozinha = !formulario_dados.requer_cozinha"
                        class="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
                        :class="formulario_dados.requer_cozinha ? 'bg-orange-500' : 'bg-[var(--border-subtle)]'">
                        <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                            :class="formulario_dados.requer_cozinha ? 'translate-x-5' : 'translate-x-0'"></span>
                    </div>
                </div>

                <!-- Grupos de Adicionais -->
                <div v-if="lista_grupos_adicionais.length > 0" class="space-y-2">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Grupos de Adicionais</label>
                        <p class="text-[11px] font-bold text-[var(--text-muted)] mt-0.5">
                            Vincule os grupos de adicionais disponíveis para este produto
                        </p>
                    </div>
                    <div class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3 space-y-1.5">
                        <label v-for="grupo in lista_grupos_adicionais" :key="grupo.id"
                            class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[var(--bg-card)] transition-colors cursor-pointer">
                            <input type="checkbox"
                                :value="grupo.id"
                                v-model="formulario_dados.grupos_adicionais_ids"
                                class="flex-none h-4 w-4 rounded accent-blue-600" />
                            <span class="text-sm font-bold text-[var(--text-primary)]">
                                {{ grupo.nome }}
                                <span class="text-[var(--text-muted)] font-normal">({{ (grupo.itens || []).length }} {{ (grupo.itens || []).length === 1 ? 'item' : 'itens' }})</span>
                            </span>
                        </label>
                    </div>
                </div>
            </div>

            <!-- ── PASSO 2: Fornecedores (só para "comprado") ── -->
            <div v-if="formulario_dados.tipo_item === 'comprado'" class="p-6 space-y-4">
                <div class="flex items-center justify-between gap-3">
                    <div class="flex items-center gap-2">
                        <span class="flex-none h-6 w-6 rounded-full bg-nitec_blue text-white text-[10px] font-black flex items-center justify-center">2</span>
                        <div>
                            <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Fornecedores e Embalagem</h3>
                            <p class="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                                Clique em um card para ativá-lo e calcular a precificação por aquele fornecedor.
                            </p>
                        </div>
                    </div>
                    <div class="flex flex-wrap gap-2 flex-none">
                        <button type="button" @click="$emit('abrir-novo-fornecedor')"
                            class="px-3 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-500/20 transition-colors">
                            + Novo Fornecedor
                        </button>
                        <button type="button" @click="adicionar_e_ativar_vinculo"
                            class="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                            + Vincular
                        </button>
                    </div>
                </div>

                <!-- Estado vazio -->
                <div v-if="!formulario_dados.fornecedores_vinculados.length"
                    class="rounded-xl border border-dashed border-[var(--border-subtle)] p-5 text-center space-y-1">
                    <p class="text-xs font-black text-[var(--text-muted)]">Nenhum fornecedor vinculado.</p>
                    <p class="text-[11px] font-bold text-[var(--text-muted)]">
                        Clique em "+ Vincular" para associar um fornecedor e definir a embalagem de compra.
                    </p>
                </div>

                <!-- Cards de fornecedor vinculado -->
                <div v-else class="space-y-3">
                    <article
                        v-for="(fv, idx) in formulario_dados.fornecedores_vinculados"
                        :key="'fv_'+idx"
                        class="rounded-2xl border overflow-hidden transition-all cursor-pointer"
                        :class="idx_fornecedor_ativo === idx
                            ? 'border-blue-500/40 shadow-sm'
                            : 'border-[var(--border-subtle)] opacity-50 hover:opacity-80'"
                        @click="ativar_fornecedor(idx)">

                        <!-- Cabeçalho do card -->
                        <div class="flex items-center justify-between gap-3 px-4 py-3 border-b"
                            :class="idx_fornecedor_ativo === idx
                                ? 'bg-blue-500/5 border-blue-500/20'
                                : 'bg-[var(--bg-card)] border-[var(--border-subtle)]'">
                            <div class="flex items-center gap-2">
                                <!-- Indicador de ativo -->
                                <div class="flex-none h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all"
                                    :class="idx_fornecedor_ativo === idx
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-[var(--border-subtle)] bg-[var(--bg-page)]'">
                                    <div v-if="idx_fornecedor_ativo === idx" class="h-1.5 w-1.5 rounded-full bg-white"></div>
                                </div>
                                <span class="text-[10px] font-black uppercase tracking-widest"
                                    :class="idx_fornecedor_ativo === idx ? 'text-blue-500' : 'text-[var(--text-muted)]'">
                                    Fornecedor {{ idx + 1 }}
                                    <span v-if="fv.fornecedor_id && nome_fornecedor(fv.fornecedor_id)"
                                        class="text-[var(--text-primary)] ml-1">— {{ nome_fornecedor(fv.fornecedor_id) }}</span>
                                </span>
                            </div>
                            <button type="button"
                                @click.stop="$emit('remover-vinculo', idx); corrigir_ativo_apos_remocao(idx)"
                                class="px-2.5 py-1 rounded-lg border border-red-500/20 bg-red-500/10 text-[10px] font-black text-red-500 hover:bg-red-500 hover:text-white transition-colors">
                                Remover
                            </button>
                        </div>

                        <!-- Corpo do card — campos -->
                        <div class="p-4 space-y-4 bg-[var(--bg-page)]">

                            <!-- Fornecedor + SKU -->
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div class="space-y-1.5">
                                    <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fornecedor</label>
                                    <div @mousedown.stop @click.stop>
                                        <SelectPesquisavel
                                            :model-value="fv.fornecedor_id"
                                            :opcoes="opcoes_fornecedor"
                                            chave_valor="id"
                                            chave_rotulo="label"
                                            placeholder="Buscar fornecedor..."
                                            texto_vazio="Nenhum fornecedor encontrado."
                                            @update:model-value="atualizar_fornecedor_vinculado(idx, $event)"
                                        />
                                    </div>
                                </div>
                                <div class="space-y-1.5">
                                    <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                        Código SKU *
                                    </label>
                                    <input v-model="fv.codigo_sku_fornecedor" type="text"
                                        placeholder="Ex: HEINEKEN-LN-330"
                                        class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] font-mono outline-none focus:border-nitec_blue transition-colors" />
                                </div>
                            </div>

                            <!-- Embalagem -->
                            <div class="rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-4 space-y-4">
                                <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Embalagem de Compra</p>

                                <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div class="space-y-1.5">
                                        <label class="block text-[10px] font-bold text-[var(--text-muted)]">Fornecedor vende em</label>
                                        <select v-model="fv.unidade_embalagem"
                                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors">
                                            <option value="UN">Unidade (UN)</option>
                                            <option value="CX">Caixa (CX)</option>
                                            <option value="FD">Fardo (FD)</option>
                                            <option value="PCT">Pacote (PCT)</option>
                                            <option value="KG">Quilograma (KG)</option>
                                            <option value="LT">Litro (LT)</option>
                                            <option value="BAR">Barril (BAR)</option>
                                        </select>
                                    </div>

                                    <div class="space-y-1.5">
                                        <label class="block text-[10px] font-bold text-[var(--text-muted)]">
                                            {{ formulario_dados.unidade_medida }} por embalagem
                                        </label>
                                        <input v-model="fv.fator_conversao" type="number" min="1" step="1"
                                            @input="ao_mudar_embalagem(idx)"
                                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-blue-500/30 bg-blue-500/5 text-center text-xl font-black text-blue-500 outline-none focus:border-blue-500 transition-colors" />
                                    </div>

                                    <div class="space-y-1.5">
                                        <label class="block text-[10px] font-bold text-[var(--text-muted)]">
                                            Custo da embalagem (R$)
                                        </label>
                                        <input v-model="fv.custo_embalagem" type="number" min="0" step="0.01"
                                            placeholder="0,00"
                                            @input="ao_mudar_embalagem(idx)"
                                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                                    </div>
                                </div>

                                <!-- Resultado da equação -->
                                <div v-if="Number(fv.fator_conversao) >= 1 && Number(fv.custo_embalagem) > 0"
                                    class="grid grid-cols-2 gap-3">
                                    <div class="rounded-xl bg-blue-500/5 border border-blue-500/20 p-3 text-center">
                                        <p class="text-[9px] font-black uppercase tracking-widest text-blue-500 mb-1">Conversão</p>
                                        <p class="text-sm font-black text-[var(--text-primary)]">
                                            1 {{ fv.unidade_embalagem || 'emb.' }}
                                            <span class="text-[var(--text-muted)] mx-1">=</span>
                                            {{ fv.fator_conversao }} {{ formulario_dados.unidade_medida }}
                                        </p>
                                    </div>
                                    <div class="rounded-xl bg-green-500/5 border border-green-500/20 p-3 text-center">
                                        <p class="text-[9px] font-black uppercase tracking-widest text-green-600 mb-1">
                                            Custo por {{ formulario_dados.unidade_medida }}
                                        </p>
                                        <p class="text-sm font-black text-green-600">
                                            R$ {{ custo_unitario_calculado(fv) }}
                                        </p>
                                        <p class="text-[9px] font-bold text-[var(--text-muted)] mt-0.5">
                                            R$ {{ Number(fv.custo_embalagem || 0).toFixed(2) }} ÷ {{ fv.fator_conversao }} = R$ {{ custo_unitario_calculado(fv) }}/UN
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </article>
                </div>

                <!-- Dica quando há mais de um fornecedor -->
                <p v-if="formulario_dados.fornecedores_vinculados.length > 1"
                    class="text-[10px] font-bold text-[var(--text-muted)] text-center">
                    A precificação abaixo usa os dados do fornecedor destacado ({{ nome_fornecedor_ativo }}).
                    Clique em outro card para comparar.
                </p>
            </div>

            <!-- Passo 2 para "fabricado" -->
            <div v-else class="p-6">
                <div class="flex items-center gap-2 mb-3">
                    <span class="flex-none h-6 w-6 rounded-full bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black flex items-center justify-center text-[var(--text-muted)]">2</span>
                    <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-muted)]">Fornecedores — não aplicável</h3>
                </div>
                <div class="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs font-bold text-amber-700">
                    Produção própria — sem fornecedor externo. O custo será informado diretamente na precificação abaixo.
                </div>
            </div>

            <!-- ── PASSO 3: Precificação ── -->
            <div class="p-6 space-y-4">
                <div class="flex items-center gap-2">
                    <span class="flex-none h-6 w-6 rounded-full bg-nitec_blue text-white text-[10px] font-black flex items-center justify-center">3</span>
                    <div>
                        <h3 class="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">Precificação</h3>
                        <p class="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">
                            <template v-if="formulario_dados.tipo_item === 'comprado' && nome_fornecedor_ativo">
                                Calculando com base no fornecedor ativo:
                                <span class="text-[var(--text-primary)]">{{ nome_fornecedor_ativo }}</span>
                            </template>
                            <template v-else>
                                Todos os valores são por unidade de venda ({{ formulario_dados.unidade_medida || 'UN' }}).
                            </template>
                        </p>
                    </div>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">

                    <div class="space-y-1.5">
                        <div class="flex items-center justify-between gap-1">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                Custo / {{ formulario_dados.unidade_medida || 'UN' }} (R$)
                            </label>
                            <span v-if="custo_preenchido_automaticamente"
                                class="text-[9px] font-black text-blue-500 bg-blue-500/10 px-1.5 py-0.5 rounded-md flex-none">
                                auto
                            </span>
                        </div>
                        <!-- :value exibe arredondado a 2 casas; @change salva o valor digitado -->
                        <!-- Quando é automático, o valor real (4 casas) fica em preco_custo_medio -->
                        <input
                            :value="custo_preenchido_automaticamente
                                ? Number(formulario_dados.preco_custo_medio || 0).toFixed(2)
                                : formulario_dados.preco_custo_medio"
                            @change="formulario_dados.preco_custo_medio = Number($event.target.value || 0)"
                            type="number" min="0" step="0.01"
                            placeholder="0,00"
                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                        <p v-if="custo_preenchido_automaticamente" class="text-[9px] font-bold text-[var(--text-muted)]">
                            Exibido arredondado. Valor real ({{ Number(formulario_dados.preco_custo_medio || 0).toFixed(4) }}) salvo no banco.
                        </p>
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Margem (%)</label>
                        <input v-model="formulario_dados.margem_lucro_percentual" type="number" min="0" step="1"
                            placeholder="0"
                            class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Preço Sugerido</label>
                        <div class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-black text-[var(--text-muted)] cursor-default select-none flex items-center justify-between gap-2">
                            <span>R$ {{ preco_sugerido_formatado }}</span>
                            <button v-if="Number(preco_sugerido_formatado) > 0" type="button"
                                @click="formulario_dados.preco_venda = preco_sugerido_formatado"
                                class="text-[9px] font-black text-nitec_blue hover:underline flex-none">
                                Usar ↗
                            </button>
                        </div>
                    </div>

                    <div class="space-y-1.5">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-nitec_blue">
                            Preço de Venda (R$) *
                        </label>
                        <input v-model="formulario_dados.preco_venda" type="number" min="0" step="0.01"
                            placeholder="0,00"
                            class="w-full p-3 rounded-xl bg-blue-500/5 border border-blue-500/30 text-sm font-black text-nitec_blue outline-none focus:border-blue-500 transition-colors" />
                    </div>
                </div>

                <!-- Resumo de margem real -->
                <div v-if="resumo_margem_real"
                    class="rounded-xl border p-3 grid grid-cols-2 md:grid-cols-4 gap-3 transition-all"
                    :class="resumo_margem_real.positivo ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'">
                    <div class="text-center">
                        <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Custo / UN</p>
                        <p class="text-sm font-black text-red-400 mt-0.5">R$ {{ Number(formulario_dados.preco_custo_medio || 0).toFixed(2) }}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Preço de Venda</p>
                        <p class="text-sm font-black text-nitec_blue mt-0.5">R$ {{ Number(formulario_dados.preco_venda || 0).toFixed(2) }}</p>
                    </div>
                    <div class="text-center">
                        <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Margem Real</p>
                        <p class="text-lg font-black mt-0.5" :class="resumo_margem_real.positivo ? 'text-green-500' : 'text-red-500'">
                            {{ resumo_margem_real.texto }}
                        </p>
                    </div>
                    <div class="text-center">
                        <p class="text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Lucro / UN</p>
                        <p class="text-lg font-black mt-0.5" :class="resumo_margem_real.positivo ? 'text-green-500' : 'text-red-500'">
                            R$ {{ resumo_margem_real.lucro_unitario }}
                        </p>
                    </div>
                </div>
            </div>

            <!-- Rodapé -->
            <div class="p-6 flex flex-col sm:flex-row gap-3">
                <button type="button" @click="$emit('cancelar')"
                    class="flex-1 py-3.5 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card)] transition-colors">
                    Cancelar
                </button>
                <button type="submit"
                    :disabled="salvando || !formulario_dados.nome_produto || !formulario_dados.codigo_interno"
                    class="flex-1 py-3.5 rounded-xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity">
                    {{ salvando ? 'Salvando...' : (modo_edicao ? 'Salvar Alterações' : 'Criar Item') }}
                </button>
            </div>

        </form>
    </section>

    <!-- Modal: Gerenciamento de Categorias -->
    <Teleport to="body">
        <div v-if="modal_categorias_visivel"
            class="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            @click.self="modal_categorias_visivel = false">
            <div class="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-subtle)] shadow-2xl w-full max-w-md overflow-hidden">

                <div class="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                        <h3 class="text-base font-black text-[var(--text-primary)]">Categorias de Produto</h3>
                        <p class="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 uppercase tracking-widest">Adicione ou remova categorias do catálogo</p>
                    </div>
                    <button type="button" @click="modal_categorias_visivel = false"
                        class="h-9 w-9 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">✕</button>
                </div>

                <div class="p-6 space-y-4">
                    <div class="flex gap-2">
                        <input v-model="nova_categoria_input" type="text"
                            :disabled="salvando_categoria"
                            placeholder="Nome da nova categoria..."
                            @keydown.enter.prevent="adicionar_categoria"
                            class="flex-1 p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                        <button type="button" @click="adicionar_categoria"
                            :disabled="salvando_categoria || !nova_categoria_input.trim()"
                            class="px-4 rounded-xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 disabled:opacity-40 transition-colors">
                            {{ salvando_categoria && categoria_processando_nome === nova_categoria_input.trim() ? 'Salvando...' : '+ Adicionar' }}
                        </button>
                    </div>

                    <p v-if="carregando_categorias" class="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Carregando categorias do tenant...
                    </p>

                    <div class="max-h-72 overflow-y-auto space-y-1.5 pr-0.5">
                        <div v-for="cat in categorias_opcoes" :key="cat"
                            class="flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-page)] border transition-colors"
                            :class="formulario_dados.categoria === cat ? 'border-nitec_blue/40 bg-blue-500/5' : 'border-[var(--border-subtle)]'">
                            <span class="text-sm font-bold text-[var(--text-primary)] truncate">{{ cat }}</span>
                            <div class="flex items-center gap-2 flex-none">
                                <span v-if="cat === 'Geral'" class="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest px-2 py-0.5 bg-[var(--bg-card)] rounded-lg border border-[var(--border-subtle)]">padrão</span>
                                <button v-else type="button" @click="remover_categoria(cat)"
                                    class="h-6 w-6 flex items-center justify-center rounded-lg border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors text-xs flex-none">✕</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="px-6 pb-6">
                    <button type="button" @click="modal_categorias_visivel = false"
                        class="w-full py-3 rounded-xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import SelectPesquisavel from '../componentes_analises/SelectPesquisavel.vue';
import api_cliente from '../../servicos/api_cliente.js';

const props = defineProps({
    carregando_produto: { type: Boolean, required: true },
    modo_edicao: { type: Boolean, required: true },
    formulario_dados: { type: Object, required: true },
    lista_fornecedores: { type: Array, required: true },
    lista_grupos_adicionais: { type: Array, default: () => [] },
    salvando: { type: Boolean, required: true },
});

const emit = defineEmits([
    'salvar',
    'cancelar',
    'adicionar-alias',
    'remover-alias',
    'adicionar-vinculo',
    'remover-vinculo',
    'abrir-novo-fornecedor',
]);

// ─── Tipos de item ────────────────────────────────────────────────────────────

const tipos_item = [
    { valor: 'comprado', icone: '📦', label: 'Comprado de Fornecedor', descricao: 'Cerveja, destilado, insumo — vem em embalagem' },
    { valor: 'fabricado', icone: '🍹', label: 'Produção Própria', descricao: 'Drink, prato, item feito no bar' },
];

const ao_mudar_tipo = (tipo) => {
    if (tipo !== 'comprado') {
        props.formulario_dados.fornecedores_vinculados = [];
        idx_fornecedor_ativo.value = 0;
    }
};

const placeholder_nome = computed(() =>
    props.formulario_dados.tipo_item === 'comprado'
        ? 'Ex: Cerveja Heineken Long Neck 330ml'
        : 'Ex: Caipirinha de Limão, Porção de Calabresa'
);

// ─── Categorias com persistência em localStorage ──────────────────────────────

const CATEGORIAS_PADRAO = [
    'Geral', 'Cervejas', 'Drinks e Coquetéis', 'Destilados', 'Vinhos e Espumantes',
    'Bebidas Não Alcoólicas', 'Pratos Principais', 'Entradas e Petiscos',
    'Sobremesas', 'Lanches', 'Insumos de Bar', 'Descartáveis',
];

const categorias_opcoes = ref([...CATEGORIAS_PADRAO]);
const carregando_categorias = ref(false);
const salvando_categoria = ref(false);
const categoria_processando_nome = ref('');
const modal_categorias_visivel = ref(false);
const nova_categoria_input = ref('');

const comparar_categoria = (a, b) =>
    String(a || '').localeCompare(String(b || ''), 'pt-BR', { sensitivity: 'base' }) === 0;

const ordenar_categorias = (categorias) =>
    [...categorias].sort((a, b) => {
        if (comparar_categoria(a, 'Geral')) return -1;
        if (comparar_categoria(b, 'Geral')) return 1;
        return String(a).localeCompare(String(b), 'pt-BR', { sensitivity: 'base' });
    });

const montar_lista_categorias = (categorias = []) => {
    const categorias_unicas = [];

    [...categorias, props.formulario_dados.categoria]
        .map((categoria) => String(categoria || '').trim())
        .filter(Boolean)
        .forEach((categoria) => {
            if (!categorias_unicas.some((item) => comparar_categoria(item, categoria))) {
                categorias_unicas.push(categoria);
            }
        });

    if (!categorias_unicas.some((categoria) => comparar_categoria(categoria, 'Geral'))) {
        categorias_unicas.push('Geral');
    }

    return ordenar_categorias(categorias_unicas);
};

const sincronizar_categorias = (categorias = []) => {
    categorias_opcoes.value = montar_lista_categorias(categorias);
};

const carregar_categorias = async ({ silencioso = false } = {}) => {
    carregando_categorias.value = true;

    try {
        const resposta = await api_cliente.get('/produtos/categorias');
        sincronizar_categorias(resposta.data?.categorias || []);
    } catch (erro) {
        sincronizar_categorias(CATEGORIAS_PADRAO);
        if (!silencioso) {
            alert(erro.response?.data?.mensagem || 'Erro ao carregar as categorias do tenant.');
        }
    } finally {
        carregando_categorias.value = false;
    }
};

const adicionar_categoria = async () => {
    const nome = nova_categoria_input.value.trim();
    if (!nome) return;

    const categoria_existente = categorias_opcoes.value.find((categoria) => comparar_categoria(categoria, nome));
    if (categoria_existente) {
        props.formulario_dados.categoria = categoria_existente;
        nova_categoria_input.value = '';
        return;
    }

    salvando_categoria.value = true;
    categoria_processando_nome.value = nome;

    try {
        await api_cliente.post('/produtos/categorias', { nome });
        await carregar_categorias({ silencioso: true });
        props.formulario_dados.categoria =
            categorias_opcoes.value.find((categoria) => comparar_categoria(categoria, nome)) || nome;
        nova_categoria_input.value = '';
    } catch (erro) {
        alert(erro.response?.data?.mensagem || 'Erro ao salvar a categoria.');
    } finally {
        salvando_categoria.value = false;
        categoria_processando_nome.value = '';
    }
};

const remover_categoria = async (cat) => {
    if (cat === 'Geral') return;

    if (!window.confirm(`Deseja remover a categoria "${cat}" deste tenant?`)) return;

    salvando_categoria.value = true;
    categoria_processando_nome.value = cat;

    try {
        await api_cliente.delete(`/produtos/categorias/${encodeURIComponent(cat)}`);
        if (comparar_categoria(props.formulario_dados.categoria, cat)) {
            props.formulario_dados.categoria = 'Geral';
        }
        await carregar_categorias({ silencioso: true });
    } catch (erro) {
        alert(erro.response?.data?.mensagem || 'Erro ao remover a categoria.');
    } finally {
        salvando_categoria.value = false;
        categoria_processando_nome.value = '';
    }
};

const unidades_opcoes = [
    { valor: 'UN', descricao: 'Unidade' },
    { valor: 'KG', descricao: 'Quilograma' },
    { valor: 'LT', descricao: 'Litro' },
    { valor: 'CX', descricao: 'Caixa' },
];

// ─── Fornecedor ativo — controla qual card orienta a precificação ─────────────

/**
 * Índice do card de fornecedor que está "ativo" para fins de precificação.
 * Quando o usuário clica em um card, o cálculo de custo/UN usa esse fornecedor.
 * Quando há apenas um, é sempre 0.
 */
const idx_fornecedor_ativo = ref(0);

const ativar_fornecedor = (idx) => {
    idx_fornecedor_ativo.value = idx;
    recalcular_custo_do_ativo();
};

const adicionar_e_ativar_vinculo = () => {
    emit('adicionar-vinculo');
    // Após adicionar (próximo tick), ativa o último card
    const novo_idx = props.formulario_dados.fornecedores_vinculados.length; // length ainda não atualizado
    setTimeout(() => {
        idx_fornecedor_ativo.value = props.formulario_dados.fornecedores_vinculados.length - 1;
    }, 50);
};

const corrigir_ativo_apos_remocao = (idx_removido) => {
    // Ajusta o índice ativo se o card removido era o ativo ou estava antes dele
    if (idx_fornecedor_ativo.value >= idx_removido) {
        idx_fornecedor_ativo.value = Math.max(0, idx_fornecedor_ativo.value - 1);
    }
};

// Garante que o idx_ativo nunca ultrapasse o tamanho da lista
watch(
    () => props.formulario_dados.fornecedores_vinculados.length,
    (novo_len) => {
        if (idx_fornecedor_ativo.value >= novo_len) {
            idx_fornecedor_ativo.value = Math.max(0, novo_len - 1);
        }
    }
);

const nome_fornecedor_ativo = computed(() => {
    const fv = props.formulario_dados.fornecedores_vinculados[idx_fornecedor_ativo.value];
    if (!fv?.fornecedor_id) return '';
    return nome_fornecedor(fv.fornecedor_id);
});

// ─── Fornecedores ─────────────────────────────────────────────────────────────

const opcoes_fornecedor = computed(() =>
    props.lista_fornecedores.map((f) => ({
        id: f.id,
        label: [f.nome_fantasia, f.vendedor, f.cnpj].filter(Boolean).join(' | '),
    }))
);

const opcoes_categoria = computed(() =>
    categorias_opcoes.value.map((categoria) => ({
        valor: categoria,
        label: categoria,
    }))
);

const nome_fornecedor = (id) => {
    const f = props.lista_fornecedores.find((f) => Number(f.id) === Number(id));
    return f?.nome_fantasia || '';
};

const atualizar_fornecedor_vinculado = (idx, fornecedor_id) => {
    props.formulario_dados.fornecedores_vinculados[idx].fornecedor_id = fornecedor_id || null;
};

// ─── Cálculo de custo ─────────────────────────────────────────────────────────

const custo_unitario_calculado = (fv) => {
    const custo = Number(fv.custo_embalagem || 0);
    const fator = Number(fv.fator_conversao || 1);
    if (!custo || fator <= 0) return '—';
    // Exibe 2 casas decimais. O valor salvo em preco_custo_medio tem 4 casas.
    return (custo / fator).toFixed(2);
};

/**
 * Chamado quando fator ou custo_embalagem mudam em qualquer card.
 * Só atualiza preco_custo_medio se o card editado for o ativo.
 */
const ao_mudar_embalagem = (idx) => {
    if (idx === idx_fornecedor_ativo.value) {
        recalcular_custo_do_ativo();
    }
};

/**
 * Lê o fornecedor ativo e preenche preco_custo_medio com custo_embalagem ÷ fator.
 */
const recalcular_custo_do_ativo = () => {
    const fv = props.formulario_dados.fornecedores_vinculados[idx_fornecedor_ativo.value];
    if (!fv) return;
    const custo = Number(fv.custo_embalagem || 0);
    const fator = Number(fv.fator_conversao || 1);
    if (custo > 0 && fator > 0) {
        props.formulario_dados.preco_custo_medio = Number((custo / fator).toFixed(4));
    }
};

const custo_preenchido_automaticamente = computed(() => {
    if (props.formulario_dados.tipo_item !== 'comprado') return false;
    const fv = props.formulario_dados.fornecedores_vinculados[idx_fornecedor_ativo.value];
    return !!fv && Number(fv.custo_embalagem) > 0 && Number(fv.fator_conversao) >= 1;
});

// ─── Precificação ─────────────────────────────────────────────────────────────

const preco_sugerido_formatado = computed(() => {
    const custo = Number(props.formulario_dados.preco_custo_medio || 0);
    const margem = Number(props.formulario_dados.margem_lucro_percentual || 0);
    return (custo + (custo * margem) / 100).toFixed(2);
});

const resumo_margem_real = computed(() => {
    const venda = Number(props.formulario_dados.preco_venda || 0);
    if (!venda) return null;
    const custo = Number(props.formulario_dados.preco_custo_medio || 0);
    const lucro = venda - custo;
    const margem_real = custo > 0 ? ((lucro / custo) * 100).toFixed(1) : '—';
    const positivo = lucro >= 0;
    return {
        positivo,
        texto: custo > 0 ? (positivo ? `+${margem_real}%` : `${margem_real}%`) : '—',
        lucro_unitario: lucro.toFixed(2),
    };
});

watch(
    () => props.formulario_dados.categoria,
    () => {
        sincronizar_categorias(categorias_opcoes.value);
    },
    { immediate: true }
);

watch(
    modal_categorias_visivel,
    (visivel) => {
        if (visivel) {
            carregar_categorias({ silencioso: true });
        }
    }
);

onMounted(() => {
    carregar_categorias({ silencioso: true });
});
</script>
