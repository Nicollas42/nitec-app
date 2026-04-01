<template>
    <div :style="estilo_cardapio" class="cardapio-page min-h-dvh overflow-x-hidden text-slate-50">

        <!-- Fundo aurora -->
        <div class="pointer-events-none fixed inset-0 overflow-hidden">
            <div class="aurora aurora-primary"></div>
            <div class="aurora aurora-accent"></div>
        </div>

        <!-- Toast de feedback -->
        <transition name="toast">
            <div
                v-if="feedback?.mensagem"
                class="fixed right-4 top-4 z-50 max-w-[calc(100vw-2rem)] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl"
                :class="classes_feedback"
            >
                <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Aviso</p>
                <p class="mt-1 text-sm font-bold leading-relaxed">{{ feedback.mensagem }}</p>
            </div>
        </transition>

        <!-- Loading skeleton -->
        <section v-if="carregando_inicial" class="relative z-10 space-y-4 p-4 pt-6">
            <div class="shell p-6">
                <div class="cardapio-skeleton h-6 w-32 rounded-full"></div>
                <div class="cardapio-skeleton mt-4 h-8 w-full max-w-xs rounded-xl"></div>
                <div class="cardapio-skeleton mt-3 h-4 w-full rounded-lg"></div>
                <div class="cardapio-skeleton mt-6 h-12 w-full rounded-2xl"></div>
            </div>
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div v-for="i in 4" :key="i" class="cardapio-skeleton h-64 rounded-[2rem]"></div>
            </div>
        </section>

        <!-- Erro -->
        <section v-else-if="erro_carregamento" class="relative z-10 flex min-h-dvh items-center justify-center p-6">
            <div class="shell max-w-md p-8 text-center">
                <p class="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">Erro ao carregar</p>
                <h1 class="mt-4 text-2xl font-black text-white">{{ erro_carregamento }}</h1>
                <button
                    type="button"
                    class="cta mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-950"
                    @click="recarregar_pagina"
                >
                    Tentar novamente
                </button>
            </div>
        </section>

        <!-- Conteúdo principal -->
        <template v-else>

            <!-- Header fixo -->
            <header class="header-app fixed left-0 right-0 top-0 z-20">
                <div class="flex items-center justify-between gap-3 px-4 py-3">
                    <div class="flex min-w-0 items-center gap-3">
                        <div class="logo-box shrink-0">
                            <img v-if="config.logo_url" :src="config.logo_url" :alt="config.nome_exibicao" class="h-full w-full object-cover" />
                            <span v-else class="text-xs font-black uppercase tracking-wider text-white">M</span>
                        </div>
                        <div class="min-w-0">
                            <h1 class="truncate text-sm font-black text-white leading-tight">{{ config.nome_exibicao }}</h1>
                            <p class="text-[10px] font-bold text-slate-400">{{ mesa_label }}</p>
                        </div>
                    </div>

                    <div class="flex shrink-0 items-center gap-2">
                        <span v-if="tem_sessao" class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] font-black text-white sm:flex">
                            <span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            {{ cliente_label }}
                        </span>
                        <span v-if="carregando_comanda" class="text-[10px] font-bold text-slate-500">↻</span>
                    </div>
                </div>

                <!-- Tabs principais -->
                <div class="flex border-b border-white/8 px-4">
                    <button
                        type="button"
                        class="main-tab"
                        :class="aba_ativa === 'cardapio' ? 'main-tab-active' : ''"
                        @click="aba_ativa = 'cardapio'"
                    >
                        ◫ Cardápio
                    </button>
                    <button
                        type="button"
                        class="main-tab"
                        :class="aba_ativa === 'comanda' ? 'main-tab-active' : ''"
                        :disabled="!tem_sessao"
                        @click="tem_sessao ? (aba_ativa = 'comanda') : null"
                    >
                        ≣ Comanda
                        <span v-if="total_itens_comanda && tem_sessao" class="badge-counter ml-1">{{ total_itens_comanda }}</span>
                    </button>
                </div>

                <!-- Faixa de categorias (apenas na aba cardápio) -->
                <transition name="fade-strip">
                    <div
                        v-if="aba_ativa === 'cardapio' && produtos_por_categoria_filtrados.length"
                        class="category-strip-bar overflow-x-auto px-4 py-2"
                    >
                        <div class="flex gap-2">
                            <button
                                v-for="(grupo, i) in produtos_por_categoria_filtrados"
                                :key="grupo.categoria"
                                :id="`cat-pill-${i}`"
                                type="button"
                                class="category-pill whitespace-nowrap"
                                :class="i === indice_pagina_atual ? 'category-pill-active' : ''"
                                @click="mudar_para_categoria(i)"
                            >
                                <span>{{ emoji_categoria(grupo.categoria) }}</span>
                                <span>{{ grupo.categoria }}</span>
                                <span class="text-[9px] opacity-50">{{ grupo.produtos.length }}</span>
                            </button>
                        </div>
                    </div>
                </transition>
            </header>

            <!-- Espaçador dinâmico para o header fixo -->
            <div :style="{ height: altura_header + 'px' }" ref="spacer_ref"></div>
            <!-- Header observer (invisível, mede altura) -->
            <div ref="header_measure_ref" class="pointer-events-none fixed left-0 right-0 top-0 z-[-1] opacity-0">
                <div class="px-4 py-3">
                    <div class="h-8"></div>
                </div>
                <div class="h-10"></div>
                <div v-if="aba_ativa === 'cardapio'" class="h-12"></div>
            </div>

            <!-- Conteúdo: Cardápio com páginas deslizantes -->
            <main
                v-if="aba_ativa === 'cardapio'"
                class="relative z-10 pb-28"
                @touchstart.passive="ao_iniciar_toque"
                @touchend.passive="ao_soltar_toque"
            >
                <!-- Barra de pesquisa -->
                <div class="px-4 pb-2 pt-3">
                    <label class="search-box flex items-center gap-3 rounded-2xl border border-white/10 px-4 py-2.5">
                        <span class="text-base text-white/40">⌕</span>
                        <input
                            v-model="termo_busca"
                            type="text"
                            placeholder="Buscar produtos..."
                            class="w-full bg-transparent text-sm font-semibold text-white outline-none placeholder:text-slate-400/60"
                        />
                        <button v-if="termo_busca" type="button" class="text-sm text-white/30 hover:text-white/60" @click="termo_busca = ''">×</button>
                    </label>
                </div>

                <!-- Sem resultados -->
                <div v-if="!produtos_por_categoria_filtrados.length" class="px-4 py-16 text-center">
                    <p class="text-4xl">🔍</p>
                    <h3 class="mt-4 text-lg font-black text-white">Sem resultados</h3>
                    <p class="mt-2 text-sm text-slate-400">Tente outra busca ou limpe o filtro.</p>
                    <button type="button" class="mt-5 text-sm font-bold underline" :style="{ color: 'var(--cardapio-accent)' }" @click="termo_busca = ''">
                        Limpar busca
                    </button>
                </div>

                <!-- Book pages -->
                <div v-else class="relative overflow-hidden">
                    <transition :name="`page-${direcao_transicao}`" mode="out-in">
                        <div :key="indice_pagina_atual" class="px-4 pt-2">

                            <!-- Cabeçalho da categoria + paginação -->
                            <div class="mb-4 flex items-center justify-between gap-4">
                                <div class="flex min-w-0 items-center gap-3">
                                    <span class="text-2xl leading-none">{{ emoji_categoria(grupo_atual.categoria) }}</span>
                                    <div class="min-w-0">
                                        <h2 class="truncate text-lg font-black text-white">{{ grupo_atual.categoria }}</h2>
                                        <p class="text-[11px] text-slate-500">{{ grupo_atual.produtos.length }} produto(s)</p>
                                    </div>
                                </div>

                                <div class="flex shrink-0 items-center gap-2">
                                    <button
                                        type="button"
                                        class="page-arrow"
                                        :disabled="indice_pagina_atual === 0"
                                        @click="mudar_pagina(-1)"
                                    >‹</button>
                                    <span class="min-w-[2.5rem] text-center text-[11px] font-black text-slate-400">
                                        {{ indice_pagina_atual + 1 }}/{{ produtos_por_categoria_filtrados.length }}
                                    </span>
                                    <button
                                        type="button"
                                        class="page-arrow"
                                        :disabled="indice_pagina_atual >= produtos_por_categoria_filtrados.length - 1"
                                        @click="mudar_pagina(1)"
                                    >›</button>
                                </div>
                            </div>

                            <!-- Dots de página -->
                            <div v-if="produtos_por_categoria_filtrados.length > 1" class="mb-4 flex justify-center gap-1.5">
                                <button
                                    v-for="(_, i) in produtos_por_categoria_filtrados"
                                    :key="i"
                                    type="button"
                                    class="page-dot transition-all duration-200"
                                    :class="i === indice_pagina_atual ? 'page-dot-active' : ''"
                                    @click="mudar_para_categoria(i)"
                                ></button>
                            </div>

                            <!-- Grid de produtos -->
                            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                <article
                                    v-for="produto in grupo_atual.produtos"
                                    :key="produto.id"
                                    class="produto-card overflow-hidden rounded-[1.8rem] border border-white/10 bg-slate-950/28 backdrop-blur-sm"
                                >
                                    <div class="relative h-44 overflow-hidden">
                                        <img
                                            v-if="produto.foto_produto_url"
                                            :src="produto.foto_produto_url"
                                            :alt="produto.nome_produto"
                                            class="h-full w-full object-cover transition duration-500"
                                            loading="lazy"
                                        />
                                        <div v-else class="fallback-cover flex h-full w-full items-center justify-center text-5xl">
                                            {{ emoji_categoria(grupo_atual.categoria) }}
                                        </div>
                                        <div class="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent"></div>
                                        <div
                                            v-if="obter_quantidade_selecionada(produto.id)"
                                            class="absolute right-3 top-3 rounded-full border px-2.5 py-1 text-[10px] font-black"
                                            :style="{ borderColor: 'color-mix(in srgb, var(--cardapio-accent) 50%, transparent)', color: 'var(--cardapio-accent)', background: 'color-mix(in srgb, var(--cardapio-accent) 18%, transparent)' }"
                                        >
                                            {{ obter_quantidade_selecionada(produto.id) }}×
                                        </div>
                                    </div>

                                    <div class="space-y-3 p-4">
                                        <div class="flex items-start justify-between gap-3">
                                            <div class="min-w-0">
                                                <h3 class="font-black leading-tight text-white">{{ produto.nome_produto }}</h3>
                                                <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-400">{{ descricao_produto(produto, grupo_atual.categoria) }}</p>
                                            </div>
                                            <p class="shrink-0 font-black" :style="{ color: 'var(--cardapio-accent)' }">{{ formatar_moeda(produto.preco_venda) }}</p>
                                        </div>

                                        <div class="flex items-center justify-between gap-3">
                                            <span
                                                v-if="produto.unidade_medida"
                                                class="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                                            >{{ produto.unidade_medida }}</span>
                                            <div class="ml-auto flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1">
                                                <button
                                                    type="button"
                                                    class="flex h-8 w-8 items-center justify-center rounded-full text-base font-black text-white transition hover:bg-white/10 disabled:opacity-30"
                                                    :disabled="!obter_quantidade_selecionada(produto.id)"
                                                    @click="ajustar_quantidade_solicitacao(produto, -1)"
                                                >−</button>
                                                <span class="min-w-[2rem] text-center text-sm font-black text-white">{{ obter_quantidade_selecionada(produto.id) || 0 }}</span>
                                                <button
                                                    type="button"
                                                    class="flex h-8 w-8 items-center justify-center rounded-full text-base font-black text-slate-950 transition hover:scale-105"
                                                    :style="{ background: 'var(--cardapio-accent)' }"
                                                    @click="ajustar_quantidade_solicitacao(produto, 1)"
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                </article>
                            </div>

                            <!-- Navegação inferior entre categorias -->
                            <div class="mt-5 mb-1 flex items-stretch gap-3">
                                <button
                                    type="button"
                                    class="page-nav-btn flex-1 text-left"
                                    :disabled="indice_pagina_atual === 0"
                                    @click="mudar_pagina(-1)"
                                >
                                    <span class="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Anterior</span>
                                    <span class="block truncate font-black text-white/70 mt-0.5">
                                        {{ indice_pagina_atual > 0 ? produtos_por_categoria_filtrados[indice_pagina_atual - 1]?.categoria : '—' }}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    class="page-nav-btn flex-1 text-right"
                                    :disabled="indice_pagina_atual >= produtos_por_categoria_filtrados.length - 1"
                                    @click="mudar_pagina(1)"
                                >
                                    <span class="block text-[9px] text-slate-500 uppercase tracking-widest font-bold">Próxima</span>
                                    <span class="block truncate font-black text-white/70 mt-0.5">
                                        {{ indice_pagina_atual < produtos_por_categoria_filtrados.length - 1 ? produtos_por_categoria_filtrados[indice_pagina_atual + 1]?.categoria : '—' }}
                                    </span>
                                </button>
                            </div>

                        </div>
                    </transition>
                </div>

                <!-- Debug -->
                <div v-if="modo_debug" class="mt-4 px-4">
                    <details class="shell p-4">
                        <summary class="cursor-pointer text-xs font-black uppercase tracking-wider text-slate-400">Debug</summary>
                        <pre class="mt-3 overflow-x-auto rounded-xl bg-slate-950/60 p-3 text-[10px] text-emerald-300">{{ debug_serializado }}</pre>
                    </details>
                </div>
            </main>

            <!-- Conteúdo: Comanda -->
            <main v-else class="relative z-10 pb-28 pt-3">
                <div class="px-4">
                    <div class="shell p-5">
                        <div class="flex items-start justify-between gap-4">
                            <div>
                                <p class="text-[10px] font-black uppercase tracking-[0.35em]" :style="{ color: 'var(--cardapio-accent)' }">Minha Comanda</p>
                                <h2 class="mt-2 text-2xl font-black text-white">{{ comanda?.nome_cliente || cliente_label }}</h2>
                                <p class="mt-1 text-xs text-slate-400">{{ comanda?.telefone || cadastro.telefone || '' }}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Total</p>
                                <p class="mt-1 text-2xl font-black" :style="{ color: 'var(--cardapio-accent)' }">{{ formatar_moeda(total_comanda) }}</p>
                            </div>
                        </div>

                        <div class="mt-5">
                            <div v-if="comanda?.itens?.length" class="space-y-2">
                                <article
                                    v-for="item in comanda.itens"
                                    :key="item.id"
                                    class="rounded-[1.4rem] border border-white/8 bg-white/4 p-4"
                                >
                                    <div class="flex items-start justify-between gap-3">
                                        <div class="min-w-0">
                                            <p class="font-black text-white">{{ item.nome_produto }}</p>
                                            <p class="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ item.quantidade }} × {{ formatar_moeda(item.preco_unitario) }}</p>
                                        </div>
                                        <p class="shrink-0 font-black" :style="{ color: 'var(--cardapio-accent)' }">{{ formatar_moeda(item.subtotal) }}</p>
                                    </div>
                                </article>
                            </div>
                            <div v-else class="rounded-[1.4rem] border border-dashed border-white/12 p-8 text-center">
                                <p class="text-3xl">🧾</p>
                                <p class="mt-3 font-black text-white">Comanda vazia</p>
                                <p class="mt-2 text-sm leading-relaxed text-slate-400">Os itens aparecem aqui quando a equipe registrar seus pedidos.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <!-- FAB carrinho -->
            <button
                v-if="aba_ativa === 'cardapio'"
                type="button"
                class="fab"
                :class="lista_solicitacao.length ? 'fab-pulse' : ''"
                @click="abrir_modal_solicitacao"
            >
                <span class="text-lg font-black leading-none">{{ total_itens_solicitacao }}</span>
                <span class="text-[9px] font-black uppercase tracking-[0.2em]">Pedido</span>
            </button>

            <!-- Bottom nav -->
            <nav class="bottom-nav">
                <button
                    type="button"
                    class="bottom-nav-item"
                    :class="aba_ativa === 'cardapio' ? 'bottom-nav-item-active' : ''"
                    @click="aba_ativa = 'cardapio'"
                >◫ Cardápio</button>
                <button
                    type="button"
                    class="bottom-nav-item"
                    :class="aba_ativa === 'comanda' ? 'bottom-nav-item-active' : ''"
                    :disabled="!tem_sessao"
                    @click="tem_sessao ? (aba_ativa = 'comanda') : null"
                >
                    ≣ Comanda
                    <span v-if="total_itens_comanda && tem_sessao" class="badge-counter ml-1">{{ total_itens_comanda }}</span>
                </button>
            </nav>
        </template>

        <!-- ===== MODAL DE CADASTRO (OBRIGATÓRIO) ===== -->
        <transition name="modal-entry">
            <div
                v-if="modal_cadastro_visivel"
                class="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/80 backdrop-blur-sm sm:items-center sm:p-6"
            >
                <div class="modal-sheet w-full max-w-lg rounded-t-[2rem] p-6 sm:rounded-[2rem] sm:p-8">
                    <!-- Handle bar mobile -->
                    <div class="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/12 sm:hidden"></div>

                    <div class="mb-6 flex items-start gap-4">
                        <div class="logo-box shrink-0">
                            <img v-if="config.logo_url" :src="config.logo_url" :alt="config.nome_exibicao" class="h-full w-full object-cover" />
                            <span v-else class="text-xs font-black uppercase tracking-wider text-white">M</span>
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.35em]" :style="{ color: 'var(--cardapio-accent)' }">Bem-vindo</p>
                            <h2 class="mt-1 text-xl font-black text-white">Entrar na mesa</h2>
                            <p class="mt-1 text-xs leading-relaxed text-slate-400">{{ config.mensagem_boas_vindas }}</p>
                        </div>
                    </div>

                    <form class="space-y-3" @submit.prevent="registrar_cliente">
                        <label class="block">
                            <span class="mb-1.5 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Nome</span>
                            <input
                                v-model="cadastro.nome"
                                type="text"
                                placeholder="Ex: João Silva"
                                autocomplete="name"
                                class="menu-input"
                            />
                        </label>
                        <label class="block">
                            <span class="mb-1.5 block text-[10px] font-black uppercase tracking-[0.28em] text-slate-400">Telefone</span>
                            <input
                                v-model="cadastro.telefone"
                                type="tel"
                                placeholder="(11) 99999-0000"
                                autocomplete="tel"
                                class="menu-input"
                            />
                        </label>
                        <button
                            type="submit"
                            :disabled="enviando_cadastro"
                            class="cta mt-2 w-full rounded-full py-4 text-sm font-black uppercase tracking-[0.28em] text-slate-950 disabled:opacity-60"
                        >
                            {{ enviando_cadastro ? 'Entrando...' : 'Entrar no Cardápio' }}
                        </button>
                    </form>

                    <p class="mt-4 text-center text-[10px] leading-relaxed text-slate-600">
                        Seus dados ficam vinculados apenas a esta mesa e sessão.
                    </p>
                </div>
            </div>
        </transition>

        <!-- ===== MODAL DE SOLICITAÇÃO ===== -->
        <transition name="sheet">
            <div
                v-if="modal_solicitacao_aberto"
                class="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 p-0 sm:items-center sm:p-6"
            >
                <div class="absolute inset-0" @click="fechar_modal_solicitacao"></div>
                <div class="modal-sheet relative z-10 w-full max-w-lg rounded-t-[2rem] p-5 sm:rounded-[2rem] sm:p-6 shadow-[0_-32px_90px_rgba(2,6,23,0.55)]">
                    <div class="mx-auto mb-5 h-1.5 w-12 rounded-full bg-white/12 sm:hidden"></div>

                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.35em]" :style="{ color: 'var(--cardapio-accent)' }">Solicitar atendimento</p>
                            <h3 class="mt-2 text-xl font-black text-white">Confirmar pedido ao garçom</h3>
                            <p class="mt-1 text-xs leading-relaxed text-slate-400">O garçom recebe alerta e já sabe o que você quer.</p>
                        </div>
                        <button
                            type="button"
                            class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl text-white hover:bg-white/10"
                            @click="fechar_modal_solicitacao"
                        >×</button>
                    </div>

                    <div class="mt-5 max-h-[40vh] space-y-2 overflow-y-auto">
                        <article
                            v-for="item in lista_solicitacao"
                            :key="`sheet-${item.id}`"
                            class="rounded-[1.4rem] border border-white/8 bg-white/4 p-4"
                        >
                            <div class="flex items-start justify-between gap-3">
                                <div class="min-w-0">
                                    <p class="text-sm font-black text-white">{{ item.nome_produto }}</p>
                                    <p class="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">{{ item.quantidade }} × {{ formatar_moeda(item.preco_venda) }}</p>
                                </div>
                                <p class="shrink-0 text-sm font-black" :style="{ color: 'var(--cardapio-accent)' }">{{ formatar_moeda(item.preco_venda * item.quantidade) }}</p>
                            </div>
                        </article>
                    </div>

                    <div class="mt-5 flex items-center justify-between gap-4 rounded-[1.6rem] border border-white/8 bg-white/4 px-4 py-3">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Total estimado</p>
                            <p class="mt-1 text-lg font-black" :style="{ color: 'var(--cardapio-accent)' }">{{ formatar_moeda(total_solicitacao) }}</p>
                        </div>
                        <button
                            type="button"
                            class="cta rounded-full px-5 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-950 disabled:opacity-60"
                            :disabled="enviando_solicitacao"
                            @click="enviar_solicitacao_atendimento"
                        >
                            {{ enviando_solicitacao ? 'Enviando...' : 'Confirmar' }}
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useLogicaCardapioCliente } from './pagina_cardapio_cliente_logica.js';

const rota_atual = useRoute();

const {
    carregando_inicial,
    carregando_comanda,
    enviando_cadastro,
    enviando_solicitacao,
    modal_solicitacao_aberto,
    aba_ativa,
    config,
    mesa,
    comanda,
    cadastro,
    feedback,
    erro_carregamento,
    tem_sessao,
    modo_debug,
    debug_publico,
    estilo_cardapio,
    produtos_por_categoria,
    lista_solicitacao,
    total_itens_solicitacao,
    total_solicitacao,
    total_comanda,
    registrar_cliente,
    obter_quantidade_selecionada,
    ajustar_quantidade_solicitacao,
    abrir_modal_solicitacao,
    fechar_modal_solicitacao,
    enviar_solicitacao_atendimento,
} = useLogicaCardapioCliente();

// Estado local
const termo_busca = ref('');
const indice_pagina_atual = ref(0);
const direcao_transicao = ref('frente');
const touch_x_inicio = ref(0);
const altura_header = ref(148);

// Modal de cadastro obrigatório — sem como fechar
const modal_cadastro_visivel = computed(() => !tem_sessao.value && !carregando_inicial.value);

// Formatação
const formatador_moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const formatar_moeda = (valor) => formatador_moeda.format(Number(valor || 0));

const emoji_categoria = (categoria = '') => {
    const v = String(categoria || '').toLowerCase();
    if (v.includes('alcool') || v.includes('cervej') || v.includes('vinho')) return '🍺';
    if (v.includes('drink') || v.includes('coquet') || v.includes('gin')) return '🍸';
    if (v.includes('nao alcool') || v.includes('refrigerante') || v.includes('suco')) return '🥤';
    if (v.includes('entrada') || v.includes('petisc')) return '🍟';
    if (v.includes('sobrem')) return '🍰';
    if (v.includes('cafe')) return '☕';
    return '✨';
};

const descricao_produto = (produto, categoria = '') => {
    const nome = String(produto?.nome_produto || '').toLowerCase();
    const cat = String(categoria || produto?.categoria || '').toLowerCase();
    const un = produto?.unidade_medida ? ` Disponível em ${produto.unidade_medida}.` : '';
    if (cat.includes('drink') || cat.includes('coquet') || nome.includes('gin')) return 'Preparo autoral servido gelado, apresentado pelo garçom na mesa.';
    if (cat.includes('alcool') || cat.includes('cervej')) return `Rótulo servido no clima de bar.${un}`;
    if (cat.includes('nao alcool') || cat.includes('refrigerante')) return `Opção refrescante para acompanhar a experiência.${un}`;
    if (cat.includes('entrada') || cat.includes('petisc')) return 'Porção para compartilhar enquanto conversa com a equipe.';
    if (cat.includes('sobrem')) return 'Final doce para completar a experiência.';
    return `Item em destaque no cardápio.${un}`;
};

// Produtos filtrados por busca
const termo_busca_normalizado = computed(() => termo_busca.value.trim().toLowerCase());

const produtos_por_categoria_filtrados = computed(() => {
    if (!termo_busca_normalizado.value) return produtos_por_categoria.value;
    return produtos_por_categoria.value
        .map((grupo) => ({
            ...grupo,
            produtos: grupo.produtos.filter((p) =>
                [p.nome_produto, grupo.categoria, p.unidade_medida]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(termo_busca_normalizado.value)
            ),
        }))
        .filter((g) => g.produtos.length > 0);
});

const grupo_atual = computed(
    () => produtos_por_categoria_filtrados.value[indice_pagina_atual.value] || { categoria: '', produtos: [] }
);

// Helpers computados
const total_itens_comanda = computed(() =>
    (comanda.value?.itens || []).reduce((acc, item) => acc + Number(item.quantidade || 0), 0)
);
const mesa_label = computed(() => mesa.value?.nome_mesa || `Mesa ${rota_atual.params.id_mesa}`);
const cliente_label = computed(() => comanda.value?.nome_cliente || cadastro.nome || 'Cliente');
const debug_serializado = computed(() => JSON.stringify(debug_publico.value, null, 2));
const classes_feedback = computed(() => {
    const t = feedback.value?.tipo;
    if (t === 'erro') return 'border-rose-400/40 bg-rose-500/15 text-rose-50';
    if (t === 'aviso') return 'border-amber-400/40 bg-amber-500/15 text-amber-50';
    return 'border-emerald-400/40 bg-emerald-500/15 text-emerald-50';
});

// Navegação entre páginas/categorias
const mudar_para_categoria = (indice) => {
    if (indice === indice_pagina_atual.value) return;
    direcao_transicao.value = indice > indice_pagina_atual.value ? 'frente' : 'tras';
    indice_pagina_atual.value = indice;
    // Scroll a pill ativa para o centro da faixa
    nextTick(() => {
        const pill = document.getElementById(`cat-pill-${indice}`);
        if (pill) pill.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
};

const mudar_pagina = (delta) => {
    const novo = indice_pagina_atual.value + delta;
    if (novo < 0 || novo >= produtos_por_categoria_filtrados.value.length) return;
    mudar_para_categoria(novo);
};

// Swipe touch
const ao_iniciar_toque = (e) => {
    touch_x_inicio.value = e.touches[0].clientX;
};
const ao_soltar_toque = (e) => {
    const delta = e.changedTouches[0].clientX - touch_x_inicio.value;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) mudar_pagina(1);
    else mudar_pagina(-1);
};

// Manter índice dentro dos limites quando filtro muda
watch(produtos_por_categoria_filtrados, (grupos) => {
    if (indice_pagina_atual.value >= grupos.length) {
        indice_pagina_atual.value = Math.max(0, grupos.length - 1);
    }
});

// Calcular altura do header fixo para o espaçador
const atualizar_altura_header = () => {
    const el = document.querySelector('.header-app');
    if (el) altura_header.value = el.offsetHeight;
};

watch(aba_ativa, () => nextTick(atualizar_altura_header));

onMounted(() => {
    nextTick(atualizar_altura_header);
    window.addEventListener('resize', atualizar_altura_header);
});
onUnmounted(() => {
    window.removeEventListener('resize', atualizar_altura_header);
});

const recarregar_pagina = () => window.location.reload();
</script>

<style scoped>
/* ===== Base ===== */
.cardapio-page {
    background:
        radial-gradient(circle at top left, color-mix(in srgb, var(--cardapio-primary) 18%, transparent), transparent 32%),
        radial-gradient(circle at bottom right, color-mix(in srgb, var(--cardapio-accent) 12%, transparent), transparent 28%),
        linear-gradient(180deg, color-mix(in srgb, var(--cardapio-bg) 12%, #020617) 0%, #04101d 40%, #020617 100%);
}

/* ===== Aurora ===== */
.aurora { position: absolute; border-radius: 9999px; filter: blur(72px); opacity: 0.16; }
.aurora-primary { width: 22rem; height: 22rem; left: -4rem; top: 2rem; background: color-mix(in srgb, var(--cardapio-primary) 70%, transparent); }
.aurora-accent  { width: 26rem; height: 26rem; right: -6rem; bottom: 15%; background: color-mix(in srgb, var(--cardapio-accent) 70%, transparent); }

/* ===== Header ===== */
.header-app {
    background: rgba(2, 6, 23, 0.92);
    backdrop-filter: blur(22px);
    -webkit-backdrop-filter: blur(22px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

/* ===== Tabs ===== */
.main-tab {
    position: relative;
    padding: 0.75rem 1rem;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.45);
    border-bottom: 2px solid transparent;
    transition: 160ms ease;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
}
.main-tab-active {
    color: white;
    border-bottom-color: var(--cardapio-accent);
}
.main-tab:disabled { opacity: 0.28; cursor: not-allowed; }

/* ===== Category strip ===== */
.category-strip-bar {
    scrollbar-width: none;
}
.category-strip-bar::-webkit-scrollbar { display: none; }

/* ===== Category pills ===== */
.category-pill {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.4rem;
    white-space: nowrap;
    border-radius: 9999px;
    padding: 0.55rem 0.85rem;
    font-size: 0.73rem;
    font-weight: 800;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.65);
    transition: 160ms ease;
}
.category-pill-active {
    color: white;
    border-color: color-mix(in srgb, var(--cardapio-accent) 50%, transparent);
    background: linear-gradient(135deg,
        color-mix(in srgb, var(--cardapio-accent) 28%, transparent),
        color-mix(in srgb, var(--cardapio-primary) 20%, transparent));
}

/* ===== Shell ===== */
.shell {
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.09);
    background: linear-gradient(180deg, rgba(15, 23, 42, 0.92), rgba(2, 6, 23, 0.82));
    box-shadow: 0 20px 60px rgba(2, 6, 23, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(18px);
    border-radius: 1.75rem;
}

/* ===== Logo box ===== */
.logo-box,
.fallback-cover {
    background: linear-gradient(135deg,
        color-mix(in srgb, var(--cardapio-primary) 80%, #020617),
        color-mix(in srgb, var(--cardapio-accent) 70%, #111827));
}
.logo-box {
    display: flex; align-items: center; justify-content: center;
    width: 2.5rem; height: 2.5rem;
    overflow: hidden; border-radius: 0.8rem;
    border: 1px solid rgba(255, 255, 255, 0.14);
    box-shadow: 0 8px 20px rgba(2, 6, 23, 0.25);
}

/* ===== Search box ===== */
.search-box {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
}

/* ===== Menu input ===== */
.menu-input {
    display: block;
    width: 100%;
    border-radius: 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.06);
    padding: 0.85rem 1rem;
    font-size: 0.9rem;
    font-weight: 700;
    color: white;
    outline: none;
    transition: 160ms ease;
}
.menu-input::placeholder { color: rgba(226, 232, 240, 0.42); }
.menu-input:focus {
    border-color: color-mix(in srgb, var(--cardapio-accent) 55%, transparent);
    background: rgba(255, 255, 255, 0.08);
}

/* ===== CTA ===== */
.cta {
    background: linear-gradient(135deg, var(--cardapio-accent), color-mix(in srgb, var(--cardapio-accent) 65%, white));
    box-shadow: 0 14px 40px color-mix(in srgb, var(--cardapio-accent) 24%, transparent);
    display: inline-flex; align-items: center; justify-content: center;
    transition: 160ms ease;
}
.cta:hover:not(:disabled) { filter: brightness(1.06); transform: translateY(-1px); }

/* ===== Page arrows ===== */
.page-arrow {
    display: flex; align-items: center; justify-content: center;
    width: 2rem; height: 2rem;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.05);
    font-size: 1rem; font-weight: 900; color: white;
    transition: 140ms ease;
}
.page-arrow:hover:not(:disabled) { background: rgba(255, 255, 255, 0.12); }
.page-arrow:disabled { opacity: 0.22; cursor: default; }

/* ===== Page dots ===== */
.page-dot {
    height: 5px; width: 5px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.2);
    cursor: pointer;
}
.page-dot-active {
    width: 18px;
    background: var(--cardapio-accent);
}

/* ===== Page nav buttons (bottom) ===== */
.page-nav-btn {
    border-radius: 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(255, 255, 255, 0.04);
    padding: 0.7rem 1rem;
    transition: 160ms ease;
    overflow: hidden;
}
.page-nav-btn:hover:not(:disabled) { background: rgba(255, 255, 255, 0.08); }
.page-nav-btn:disabled { opacity: 0.2; cursor: default; }

/* ===== Badge counter ===== */
.badge-counter {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 1.2rem; height: 1.2rem;
    border-radius: 9999px;
    background: var(--cardapio-accent);
    color: #020617;
    font-size: 0.58rem; font-weight: 900;
    padding: 0 0.22rem;
}

/* ===== Produto card ===== */
.produto-card {
    box-shadow: 0 14px 36px rgba(2, 6, 23, 0.2);
    transition: 200ms ease;
}
.produto-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 255, 255, 0.16);
}

/* ===== FAB ===== */
.fab {
    position: fixed;
    right: 1rem;
    bottom: 5rem;
    z-index: 30;
    display: inline-flex;
    min-width: 4.5rem;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.1rem;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: linear-gradient(135deg, var(--cardapio-accent), color-mix(in srgb, var(--cardapio-primary) 46%, white));
    padding: 0.85rem 1rem;
    color: #020617;
    box-shadow: 0 16px 40px rgba(2, 6, 23, 0.4);
}
@keyframes fab-pulse {
    0%, 100% { box-shadow: 0 16px 40px rgba(2,6,23,0.4); }
    50% { box-shadow: 0 16px 40px rgba(2,6,23,0.4), 0 0 0 7px color-mix(in srgb, var(--cardapio-accent) 28%, transparent); }
}
.fab-pulse { animation: fab-pulse 2.2s infinite; }

/* ===== Bottom nav ===== */
.bottom-nav {
    position: fixed;
    bottom: 0; left: 0; right: 0;
    z-index: 25;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
    border-top: 1px solid rgba(255, 255, 255, 0.07);
    background: rgba(2, 6, 23, 0.96);
    padding: 0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom));
    backdrop-filter: blur(22px);
}
.bottom-nav-item {
    border-radius: 1rem;
    padding: 0.8rem;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.55);
    transition: 160ms ease;
}
.bottom-nav-item-active {
    color: white;
    border-color: color-mix(in srgb, var(--cardapio-accent) 45%, transparent);
    background: linear-gradient(135deg,
        color-mix(in srgb, var(--cardapio-accent) 28%, transparent),
        color-mix(in srgb, var(--cardapio-primary) 20%, transparent));
}
.bottom-nav-item:disabled { opacity: 0.28; cursor: not-allowed; }

/* ===== Modal sheet ===== */
.modal-sheet {
    background: linear-gradient(180deg, rgba(10, 18, 38, 0.99), rgba(2, 6, 23, 0.99));
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(24px);
}

/* ===== Skeleton ===== */
.cardapio-skeleton {
    background: linear-gradient(90deg,
        rgba(255,255,255,0.04) 0%,
        rgba(255,255,255,0.09) 50%,
        rgba(255,255,255,0.04) 100%);
    background-size: 200% 100%;
    animation: shimmer 1.6s infinite;
}
@keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* ===== Book page transitions ===== */
.page-frente-enter-active,
.page-frente-leave-active,
.page-tras-enter-active,
.page-tras-leave-active {
    transition: opacity 220ms ease, transform 280ms cubic-bezier(0.4, 0, 0.2, 1);
}
.page-frente-enter-from { opacity: 0; transform: translateX(52px) scale(0.98); }
.page-frente-leave-to  { opacity: 0; transform: translateX(-52px) scale(0.98); }
.page-tras-enter-from  { opacity: 0; transform: translateX(-52px) scale(0.98); }
.page-tras-leave-to    { opacity: 0; transform: translateX(52px) scale(0.98); }

/* ===== Toast ===== */
.toast-enter-active, .toast-leave-active { transition: all 220ms ease; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translateY(-8px) scale(0.95); }

/* ===== Modal de cadastro ===== */
.modal-entry-enter-active { transition: opacity 300ms ease; }
.modal-entry-leave-active { transition: opacity 220ms ease; }
.modal-entry-enter-from, .modal-entry-leave-to { opacity: 0; }
.modal-entry-enter-active .modal-sheet { animation: sheet-slide-up 300ms cubic-bezier(0.34, 1.3, 0.64, 1) forwards; }
.modal-entry-leave-active .modal-sheet { animation: sheet-slide-down 200ms ease forwards; }
@keyframes sheet-slide-up   { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
@keyframes sheet-slide-down { from { transform: translateY(0); opacity: 1; } to { transform: translateY(32px); opacity: 0; } }

/* ===== Sheet de solicitação ===== */
.sheet-enter-active, .sheet-leave-active { transition: all 240ms ease; }
.sheet-enter-from, .sheet-leave-to { opacity: 0; transform: translateY(28px); }

/* ===== Category strip fade ===== */
.fade-strip-enter-active, .fade-strip-leave-active { transition: opacity 160ms ease; }
.fade-strip-enter-from, .fade-strip-leave-to { opacity: 0; }
</style>
