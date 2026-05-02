<template>
    <div :style="estilo_cardapio" class="cardapio-page h-dvh flex flex-col overflow-hidden text-slate-50">
        <div class="pointer-events-none fixed inset-0 overflow-hidden -z-10">
            <div class="aurora aurora-primary"></div>
            <div class="aurora aurora-accent"></div>
        </div>

        <transition name="toast">
            <div
                v-if="feedback?.mensagem"
                class="fixed right-4 top-4 z-[60] max-w-[calc(100vw-2rem)] rounded-2xl border px-4 py-3 shadow-2xl backdrop-blur-xl"
                :class="classes_feedback"
            >
                <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Aviso</p>
                <p class="mt-1 text-sm font-bold leading-relaxed">{{ feedback.mensagem }}</p>
            </div>
        </transition>

        <section v-if="carregando_inicial" class="flex-1 flex items-center justify-center p-6">
            <div class="shell p-8 text-center">
                <div class="spinner mx-auto mb-4"></div>
                <p class="text-xs font-black uppercase tracking-[0.3em] opacity-80">Carregando cardapio...</p>
            </div>
        </section>

        <section v-else-if="erro_carregamento" class="flex-1 flex items-center justify-center p-6">
            <div class="shell max-w-md p-8 text-center">
                <p class="text-[10px] font-black uppercase tracking-[0.35em] text-rose-300">Erro</p>
                <h1 class="mt-4 text-xl font-black">{{ erro_carregamento }}</h1>
                <button
                    type="button"
                    class="cta mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-950"
                    @click="() => location.reload()"
                >
                    Tentar novamente
                </button>
            </div>
        </section>

        <template v-else>
            <section v-if="pdfs.length > 1 && !modo_tela_cheia_mobile" class="relative z-10 shrink-0 px-3 pt-3 sm:px-6 sm:pt-6">
                <div class="tabs-shell shell mx-auto max-w-5xl p-2">
                    <nav class="overflow-x-auto scrollbar-none">
                        <div class="flex min-w-max gap-2">
                            <button
                                v-for="pdf in pdfs"
                                :key="pdf.id"
                                type="button"
                                class="tab-btn rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.24em] whitespace-nowrap transition-all sm:text-[11px]"
                                :class="pdf.id === pdf_ativo_id ? 'tab-active' : 'tab-inactive'"
                                @click="selecionar_pdf(pdf.id)"
                            >
                                {{ pdf.nome_cardapio }}
                            </button>
                        </div>
                    </nav>
                </div>
            </section>

            <main class="relative z-10 flex-1 min-h-0 px-3 py-3 sm:px-6 sm:py-6" :class="{ 'px-0 py-0': modo_tela_cheia_mobile }">
                <div
                    v-if="!pdfs.length"
                    class="shell mx-auto flex h-full w-full max-w-md items-center justify-center p-8 text-center"
                >
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-[0.35em] opacity-60">Sem cardapio</p>
                        <h2 class="mt-3 text-lg font-black">Nenhum PDF foi publicado ainda</h2>
                        <p class="mt-2 text-xs font-bold opacity-80">
                            Peca ao estabelecimento para enviar o cardapio no painel administrativo.
                        </p>
                    </div>
                </div>

                <div v-else class="mx-auto flex h-full w-full max-w-[1400px] min-h-0">
                    <section
                        ref="flipbook_stage"
                        class="flipbook-stage shell relative flex h-full w-full min-h-[320px] flex-col overflow-hidden p-2 sm:min-h-[420px] sm:p-4"
                        :class="{
                            'mobile-fullscreen fixed inset-0 z-40 rounded-none border-0 p-2 sm:p-3': modo_tela_cheia_mobile,
                        }"
                    >
                        <button
                            v-if="eh_mobile_view"
                            type="button"
                            class="icon-btn absolute right-3 top-3 z-30 h-11 w-11 bg-slate-950/55 backdrop-blur-md"
                            @click="alternar_tela_cheia_mobile"
                            :aria-label="modo_tela_cheia_mobile ? 'Sair da tela cheia' : 'Abrir em tela cheia'"
                        >
                            <svg v-if="!modo_tela_cheia_mobile" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                                <path d="M16 3h3a2 2 0 0 1 2 2v3" />
                                <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                                <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M9 3H5a2 2 0 0 0-2 2v4" />
                                <path d="M15 3h4a2 2 0 0 1 2 2v4" />
                                <path d="M21 15v4a2 2 0 0 1-2 2h-4" />
                                <path d="M3 15v4a2 2 0 0 0 2 2h4" />
                                <path d="M9 9 3 3" />
                                <path d="m15 9 6-6" />
                                <path d="m9 15-6 6" />
                                <path d="m15 15 6 6" />
                            </svg>
                        </button>

                        <div
                            v-if="renderizando_pdf"
                            class="absolute inset-0 z-20 flex items-center justify-center bg-slate-950/40 backdrop-blur-sm"
                        >
                            <div class="text-center">
                                <div class="spinner mx-auto mb-3"></div>
                                <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-80">
                                    Preparando paginas...
                                </p>
                            </div>
                        </div>

                        <div
                            ref="flipbook_container"
                            class="flipbook-container h-full w-full flex-1 min-h-0"
                        ></div>

                        <template v-if="mostrar_alcas_miolo && !renderizando_pdf">
                            <button
                                type="button"
                                class="spine-handle spine-handle-prev spine-handle-top"
                                aria-label="Puxar folha anterior por cima"
                                @pointerdown.prevent="iniciar_arraste_miolo('prev', 'top', $event)"
                            ></button>
                            <button
                                type="button"
                                class="spine-handle spine-handle-prev spine-handle-bottom"
                                aria-label="Puxar folha anterior por baixo"
                                @pointerdown.prevent="iniciar_arraste_miolo('prev', 'bottom', $event)"
                            ></button>
                            <button
                                type="button"
                                class="spine-handle spine-handle-next spine-handle-top"
                                aria-label="Puxar proxima folha por cima"
                                @pointerdown.prevent="iniciar_arraste_miolo('next', 'top', $event)"
                            ></button>
                            <button
                                type="button"
                                class="spine-handle spine-handle-next spine-handle-bottom"
                                aria-label="Puxar proxima folha por baixo"
                                @pointerdown.prevent="iniciar_arraste_miolo('next', 'bottom', $event)"
                            ></button>
                        </template>

                        <div
                            v-if="mostrar_controles_mobile && !renderizando_pdf"
                            class="mobile-nav"
                            :class="{ 'mobile-nav-fullscreen': modo_tela_cheia_mobile }"
                        >
                            <button
                                type="button"
                                class="mobile-nav-btn"
                                :disabled="!pode_ir_pagina_anterior"
                                aria-label="Pagina anterior"
                                @click="ir_pagina_anterior"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m15 18-6-6 6-6" />
                                </svg>
                            </button>

                            <div class="mobile-page-indicator">
                                {{ pagina_atual + 1 }} / {{ total_paginas }}
                            </div>

                            <button
                                type="button"
                                class="mobile-nav-btn"
                                :disabled="!pode_ir_pagina_proxima"
                                aria-label="Proxima pagina"
                                @click="ir_pagina_proxima"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                    </section>
                </div>
            </main>

            <footer v-if="!modo_tela_cheia_mobile" class="relative z-10 shrink-0 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">

                <!-- Banner de re-entrada: exibido após encerramento da conta -->
                <transition name="slide-up">
                    <div
                        v-if="sessao_encerrada && !tem_sessao"
                        class="shell mx-auto mb-2 w-full max-w-3xl p-3"
                    >
                        <div class="flex items-center justify-between gap-3">
                            <div class="min-w-0">
                                <p class="text-[10px] font-black uppercase tracking-[0.25em] opacity-50 leading-none mb-0.5">Visitação livre</p>
                                <p class="text-xs font-bold opacity-75 truncate">Para entrar na mesa, informe seus dados</p>
                            </div>
                            <button
                                type="button"
                                class="action-btn-primary shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.15em]"
                                @click="modal_cadastro_visivel = true"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" y1="12" x2="3" y2="12" />
                                </svg>
                                <span>Entrar na mesa</span>
                            </button>
                        </div>
                    </div>
                </transition>

                <!-- Botões normais de sessão ativa -->
                <div class="shell mx-auto grid w-full max-w-3xl grid-cols-2 gap-2 p-2 sm:grid-cols-2">
                    <button
                        type="button"
                        class="action-btn flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] sm:px-4 sm:text-xs"
                        @click="abrir_modal_comanda"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <path d="M14 2v6h6" />
                            <path d="M16 13H8" />
                            <path d="M16 17H8" />
                        </svg>
                        <span class="leading-tight">Minha comanda</span>
                    </button>

                    <button
                        type="button"
                        class="action-btn-primary flex items-center justify-center gap-2 rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] sm:px-4 sm:text-xs"
                        :disabled="enviando_chamada"
                        @click="chamar_garcom"
                    >
                        <svg v-if="!enviando_chamada" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                        </svg>
                        <div v-else class="spinner-sm"></div>
                        <span class="leading-tight">{{ enviando_chamada ? 'Chamando...' : 'Chamar garcom' }}</span>
                    </button>
                </div>
            </footer>
        </template>

        <!-- Banner: Aguardando aprovação (não bloqueia o cardápio) -->
        <transition name="slide-down">
            <div
                v-if="aguardando_aprovacao"
                class="fixed top-0 inset-x-0 z-50 flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                style="background: rgba(0,0,0,0.82); backdrop-filter: blur(8px);"
            >
                <div class="flex items-center gap-3 min-w-0">
                    <div class="spinner shrink-0"></div>
                    <div class="min-w-0">
                        <p class="text-[10px] font-black uppercase tracking-[0.25em] opacity-60 leading-none mb-0.5">Aguardando aprovacao</p>
                        <p class="text-xs font-medium opacity-80 truncate">O garcom precisa aprovar sua entrada...</p>
                    </div>
                </div>
                <button
                    type="button"
                    class="action-btn-primary shrink-0 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.15em]"
                    :disabled="enviando_chamada"
                    @click="chamar_garcom"
                >
                    <svg v-if="!enviando_chamada" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                    <div v-else class="spinner-sm"></div>
                    <span>{{ enviando_chamada ? 'Chamando...' : 'Chamar garcom' }}</span>
                </button>
            </div>
        </transition>

        <!-- Modal: Login / Cadastro -->
        <transition name="modal">
            <div
                v-if="modal_cadastro_visivel && !aguardando_aprovacao"
                class="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop"
            >
                <div class="shell w-full max-w-md p-6 sm:p-8">
                    <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                        {{ modo_modal === 'login' ? 'Bem-vindo de volta' : 'Primeiro acesso' }}
                    </p>
                    <h2 class="mt-2 text-xl font-black">{{ config.nome_exibicao }}</h2>
                    <p class="mt-3 text-sm font-medium opacity-80 leading-relaxed">
                        {{ modo_modal === 'login'
                            ? 'Informe seu CPF para acessar sua comanda.'
                            : 'Cadastre-se para chamar o garcom e acompanhar sua comanda.'
                        }}
                    </p>

                    <!-- Login por CPF -->
                    <form v-if="modo_modal === 'login'" class="mt-5 space-y-3" @submit.prevent="login_por_cpf">
                        <label class="block">
                            <span class="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">CPF</span>
                            <input
                                :value="cadastro.cpf"
                                @input="ao_digitar_cpf"
                                type="text"
                                inputmode="numeric"
                                class="form-input mt-1 w-full"
                                placeholder="000.000.000-00"
                                maxlength="14"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            class="cta w-full rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-950 disabled:opacity-60"
                            :disabled="enviando_cadastro"
                        >
                            {{ enviando_cadastro ? 'Entrando...' : 'Entrar' }}
                        </button>

                        <p class="text-center text-xs font-bold opacity-60 mt-2">
                            Primeira vez?
                            <button type="button" class="underline opacity-100 text-white/90" @click="alternar_modo_modal">
                                Cadastre-se
                            </button>
                        </p>
                    </form>

                    <!-- Cadastro completo -->
                    <form v-else class="mt-5 space-y-3" @submit.prevent="confirmar_cadastro">
                        <label class="block">
                            <span class="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Nome</span>
                            <input
                                v-model="cadastro.nome"
                                type="text"
                                class="form-input mt-1 w-full"
                                placeholder="Como devemos te chamar?"
                                autocomplete="name"
                                required
                            />
                        </label>

                        <label class="block">
                            <span class="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">Telefone</span>
                            <input
                                v-model="cadastro.telefone"
                                type="tel"
                                class="form-input mt-1 w-full"
                                placeholder="(00) 00000-0000"
                                autocomplete="tel"
                                required
                            />
                        </label>

                        <label class="block">
                            <span class="text-[10px] font-black uppercase tracking-[0.25em] opacity-60">CPF</span>
                            <input
                                :value="cadastro.cpf"
                                @input="ao_digitar_cpf"
                                type="text"
                                inputmode="numeric"
                                class="form-input mt-1 w-full"
                                placeholder="000.000.000-00"
                                maxlength="14"
                                required
                            />
                        </label>

                        <button
                            type="submit"
                            class="cta w-full rounded-full px-6 py-3 text-xs font-black uppercase tracking-[0.28em] text-slate-950 disabled:opacity-60"
                            :disabled="enviando_cadastro"
                        >
                            {{ enviando_cadastro ? 'Cadastrando...' : 'Cadastrar e entrar' }}
                        </button>

                        <p class="text-center text-xs font-bold opacity-60 mt-2">
                            Ja possui cadastro?
                            <button type="button" class="underline opacity-100 text-white/90" @click="alternar_modo_modal">
                                Faca login
                            </button>
                        </p>
                    </form>
                </div>
            </div>
        </transition>

        <transition name="modal">
            <div
                v-if="modal_comanda_visivel"
                class="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4 backdrop"
                @click.self="fechar_modal_comanda"
            >
                <div class="shell flex max-h-[85vh] w-full flex-col rounded-b-none p-0 sm:max-w-lg sm:rounded-b-[2rem]">
                    <header class="flex items-center justify-between border-b border-white/10 p-5">
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Minha comanda</p>
                            <h2 class="text-lg font-black">{{ sessao_cliente?.nome || 'Cliente' }}</h2>
                        </div>
                        <button
                            type="button"
                            class="icon-btn"
                            @click="fechar_modal_comanda"
                            aria-label="Fechar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </header>

                    <div class="flex-1 overflow-y-auto p-5">
                        <div v-if="carregando_comanda" class="py-10 text-center">
                            <div class="spinner mx-auto mb-3"></div>
                            <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Carregando...</p>
                        </div>

                        <div v-else-if="!comanda || !comanda.itens?.length" class="py-10 text-center">
                            <p class="text-sm font-bold opacity-80">Nenhum item na sua comanda ainda.</p>
                            <p class="mt-2 text-xs opacity-60">Peca ao garcom para lancar seus itens.</p>
                        </div>

                        <ul v-else class="space-y-2">
                            <li
                                v-for="item in comanda.itens"
                                :key="item.id"
                                class="flex items-start justify-between gap-3 rounded-2xl bg-white/5 p-3"
                            >
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-black">{{ item.nome_produto }}</p>
                                    <p class="mt-0.5 text-[10px] font-bold opacity-60">
                                        {{ item.quantidade }}x R$ {{ Number(item.preco_unitario).toFixed(2) }}
                                    </p>
                                </div>
                                <p class="shrink-0 text-sm font-black">
                                    R$ {{ Number(item.subtotal).toFixed(2) }}
                                </p>
                            </li>
                        </ul>
                    </div>

                    <footer v-if="comanda?.itens?.length" class="border-t border-white/10 p-5">
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total</span>
                            <span class="text-xl font-black">
                                R$ {{ Number(comanda.valor_total).toFixed(2) }}
                            </span>
                        </div>
                    </footer>
                </div>
            </div>
        </transition>

        <!-- Modal: Encerramento de conta — despedida do cliente -->
        <transition name="modal">
            <div
                v-if="modal_encerramento_visivel"
                class="fixed inset-0 z-[70] flex items-center justify-center p-4 backdrop"
            >
                <div class="shell encerramento-shell w-full max-w-md p-0 overflow-hidden">
                    <!-- Cabeçalho comemorativo -->
                    <div class="encerramento-header px-6 pt-7 pb-5 text-center">
                        <div class="encerramento-icone mx-auto mb-4">
                            <svg v-if="!encerramento?.cancelada" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M20 12V22H4V12" />
                                <path d="M22 7H2v5h20V7z" />
                                <path d="M12 22V7" />
                                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                            </svg>
                            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <path d="M12 8v4" />
                                <path d="M12 16h.01" />
                            </svg>
                        </div>
                        <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">
                            {{ encerramento?.cancelada ? 'Conta encerrada' : 'Pagamento confirmado' }}
                        </p>
                        <h2 class="mt-2 text-2xl font-black">
                            {{ encerramento?.cancelada ? 'Ate logo!' : 'Obrigado(a)!' }}
                        </h2>
                        <p class="mt-2 text-sm font-medium opacity-75 leading-relaxed">
                            Sua conta foi encerrada.
                            <template v-if="!encerramento?.cancelada">
                                Volte sempre, {{ encerramento?.nome?.split(' ')[0] || 'cliente' }}!
                            </template>
                        </p>
                    </div>

                    <!-- Itens consumidos -->
                    <div v-if="encerramento?.itens?.length" class="border-t border-white/10">
                        <div class="px-5 pt-4 pb-1">
                            <p class="text-[10px] font-black uppercase tracking-[0.25em] opacity-50">O que voce consumiu</p>
                        </div>
                        <ul class="max-h-52 overflow-y-auto px-5 pb-3 space-y-2">
                            <li
                                v-for="(item, i) in encerramento.itens"
                                :key="i"
                                class="flex items-start justify-between gap-3 rounded-xl bg-white/5 px-3 py-2.5"
                            >
                                <div class="min-w-0">
                                    <p class="truncate text-sm font-black">{{ item.nome_produto }}</p>
                                    <p class="mt-0.5 text-[10px] font-bold opacity-55">
                                        {{ item.quantidade }}x R$ {{ Number(item.preco_unitario).toFixed(2) }}
                                    </p>
                                </div>
                                <p class="shrink-0 text-sm font-black">
                                    R$ {{ Number(item.subtotal).toFixed(2) }}
                                </p>
                            </li>
                        </ul>
                    </div>

                    <!-- Total e desconto -->
                    <div class="border-t border-white/10 px-5 py-4">
                        <div v-if="encerramento?.desconto > 0" class="flex items-center justify-between mb-1 opacity-70">
                            <span class="text-xs font-bold">Desconto</span>
                            <span class="text-xs font-bold text-emerald-400">- R$ {{ Number(encerramento.desconto).toFixed(2) }}</span>
                        </div>
                        <div class="flex items-center justify-between">
                            <span class="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total pago</span>
                            <span class="encerramento-total text-2xl font-black">R$ {{ Number(encerramento?.valor_total ?? 0).toFixed(2) }}</span>
                        </div>
                    </div>

                    <!-- Botão fechar -->
                    <div class="px-5 pb-6">
                        <button
                            type="button"
                            class="cta w-full rounded-full px-6 py-3.5 text-xs font-black uppercase tracking-[0.28em] text-slate-950"
                            @click="fechar_modal_encerramento"
                        >
                            Continuar visualizando o cardapio
                        </button>
                    </div>
                </div>
            </div>
        </transition>
    </div>
</template>

<script setup>
import { useLogicaCardapioCliente } from './pagina_cardapio_cliente_logica.js';

const {
    carregando_inicial,
    erro_carregamento,
    config,
    pdfs,
    pdf_ativo_id,
    renderizando_pdf,
    comanda,
    sessao_cliente,
    tem_sessao,
    cadastro,
    feedback,
    classes_feedback,
    estilo_cardapio,
    eh_mobile_view,
    modo_tela_cheia_mobile,
    pagina_atual,
    total_paginas,
    pode_ir_pagina_anterior,
    pode_ir_pagina_proxima,
    mostrar_controles_mobile,
    mostrar_alcas_miolo,
    aguardando_aprovacao,
    modo_modal,

    modal_cadastro_visivel,
    modal_comanda_visivel,
    modal_encerramento_visivel,
    encerramento,
    sessao_encerrada,
    enviando_cadastro,
    enviando_chamada,
    carregando_comanda,

    flipbook_container,
    flipbook_stage,

    confirmar_cadastro,
    login_por_cpf,
    alternar_modo_modal,
    ao_digitar_cpf,
    chamar_garcom,
    abrir_modal_comanda,
    fechar_modal_comanda,
    fechar_modal_encerramento,
    selecionar_pdf,
    alternar_tela_cheia_mobile,
    ir_pagina_anterior,
    ir_pagina_proxima,
    iniciar_arraste_miolo,
} = useLogicaCardapioCliente();
</script>

<style scoped>
.cardapio-page {
    background:
        radial-gradient(circle at top, rgba(15, 23, 42, 0.92) 0%, rgba(2, 6, 23, 1) 58%),
        linear-gradient(180deg, rgba(15, 23, 42, 0.96), rgba(2, 6, 23, 1));
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
}

.shell {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.04));
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 1.75rem;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    box-shadow: 0 12px 40px -12px rgba(0, 0, 0, 0.6);
}

.tabs-shell {
    border-radius: 1.4rem;
}

.flipbook-stage {
    border-radius: 2rem;
}

.mobile-fullscreen {
    background:
        radial-gradient(circle at top, rgba(15, 23, 42, 0.98) 0%, rgba(2, 6, 23, 1) 62%),
        linear-gradient(180deg, rgba(15, 23, 42, 0.99), rgba(2, 6, 23, 1));
    box-shadow: none;
}

.aurora {
    position: absolute;
    border-radius: 9999px;
    filter: blur(80px);
    opacity: 0.35;
    animation: pulso 12s ease-in-out infinite;
}

.aurora-primary {
    background: var(--cardapio-primary, #0F766E);
    width: 50vw;
    height: 50vw;
    top: -10vw;
    left: -10vw;
}

.aurora-accent {
    background: var(--cardapio-accent, #F59E0B);
    width: 40vw;
    height: 40vw;
    bottom: -10vw;
    right: -10vw;
    animation-delay: -6s;
}

@keyframes pulso {
    0%, 100% { transform: scale(1); opacity: 0.35; }
    50% { transform: scale(1.1); opacity: 0.5; }
}

.tab-btn {
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
}

.tab-active {
    background: var(--cardapio-accent, #F59E0B);
    color: #0f172a;
    border-color: transparent;
    box-shadow: 0 4px 20px -4px rgba(245, 158, 11, 0.6);
}

.tab-inactive {
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.75);
}

.tab-inactive:hover {
    background: rgba(255, 255, 255, 0.1);
}

.action-btn {
    background: rgba(255, 255, 255, 0.08);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: white;
    transition: all 0.2s;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}

.action-btn-primary {
    background: linear-gradient(135deg, var(--cardapio-accent, #F59E0B), #f97316);
    color: #0f172a;
    border: none;
    box-shadow: 0 8px 30px -8px rgba(245, 158, 11, 0.6);
    transition: all 0.2s;
}

.action-btn-primary:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 12px 35px -8px rgba(245, 158, 11, 0.8);
}

.action-btn-primary:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.cta {
    background: linear-gradient(135deg, var(--cardapio-accent, #F59E0B), #f97316);
    transition: transform 0.2s;
}

.cta:hover:not(:disabled) {
    transform: translateY(-1px);
}

.icon-btn {
    width: 40px;
    height: 40px;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    transition: background 0.2s;
}

.icon-btn:hover {
    background: rgba(255, 255, 255, 0.15);
}

.form-input {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.15);
    border-radius: 1rem;
    padding: 0.75rem 1rem;
    color: white;
    font-weight: 700;
    font-size: 0.875rem;
    outline: none;
    transition: border-color 0.2s, background 0.2s;
}

.form-input:focus {
    border-color: var(--cardapio-accent, #F59E0B);
    background: rgba(255, 255, 255, 0.1);
}

.form-input::placeholder {
    color: rgba(255, 255, 255, 0.35);
    font-weight: 500;
}

.backdrop {
    background: rgba(2, 6, 23, 0.75);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
}

.spinner {
    width: 36px;
    height: 36px;
    border: 3px solid rgba(255, 255, 255, 0.15);
    border-top-color: var(--cardapio-accent, #F59E0B);
    border-radius: 50%;
    animation: gira 0.9s linear infinite;
}

.spinner-sm {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(15, 23, 42, 0.25);
    border-top-color: #0f172a;
    border-radius: 50%;
    animation: gira 0.9s linear infinite;
}

@keyframes gira {
    to { transform: rotate(360deg); }
}

.flipbook-container,
.flipbook-host {
    display: flex;
    height: 100%;
    width: 100%;
    min-height: 0;
    align-items: center;
    justify-content: center;
}

.flipbook-container :deep(.stf__parent),
.flipbook-container :deep(.stf__wrapper) {
    margin: 0 auto;
    max-width: 100%;
    max-height: 100%;
}

.flipbook-container :deep(canvas) {
    max-width: 100%;
}

.spine-handle {
    position: absolute;
    z-index: 15;
    width: 2.75rem;
    height: 4.75rem;
    top: calc(50% - 2.375rem);
    border: 0;
    background: transparent;
    cursor: grab;
    touch-action: none;
}

.spine-handle::before {
    content: '';
    position: absolute;
    inset: 0.25rem;
    border-radius: 999px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.04));
    border: 1px solid rgba(255, 255, 255, 0.12);
    opacity: 0;
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.spine-handle:hover::before {
    opacity: 1;
    transform: scale(1.02);
}

.spine-handle-prev {
    left: calc(50% - 3.1rem);
}

.spine-handle-next {
    left: calc(50% + 0.35rem);
}

.spine-handle-top {
    top: 1rem;
}

.spine-handle-bottom {
    top: auto;
    bottom: 1rem;
}

.mobile-nav {
    position: absolute;
    right: 0.9rem;
    bottom: 0.9rem;
    left: 0.9rem;
    z-index: 25;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    pointer-events: none;
}

.mobile-nav-fullscreen {
    bottom: max(1rem, env(safe-area-inset-bottom));
}

.mobile-nav-btn,
.mobile-page-indicator {
    pointer-events: auto;
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
}

.mobile-nav-btn {
    display: inline-flex;
    height: 3.15rem;
    width: 3.15rem;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.16);
    background: rgba(2, 6, 23, 0.58);
    color: white;
    box-shadow: 0 18px 30px -18px rgba(0, 0, 0, 0.8);
    transition: transform 0.2s ease, background 0.2s ease, opacity 0.2s ease;
}

.mobile-nav-btn:active:not(:disabled) {
    transform: scale(0.96);
}

.mobile-nav-btn:disabled {
    opacity: 0.4;
}

.mobile-page-indicator {
    min-width: 5.5rem;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
    background: rgba(2, 6, 23, 0.48);
    padding: 0.7rem 1rem;
    text-align: center;
    font-size: 0.7rem;
    font-weight: 900;
    letter-spacing: 0.22em;
    text-transform: uppercase;
}

.scrollbar-none {
    scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
    display: none;
}

.toast-enter-active,
.toast-leave-active {
    transition: all 0.3s;
}

.toast-enter-from,
.toast-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

.slide-down-enter-active,
.slide-down-leave-active {
    transition: transform 0.3s ease, opacity 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
    transition: transform 0.35s ease, opacity 0.35s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
    transform: translateY(16px);
    opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
    transition: opacity 0.25s;
}

.modal-enter-from,
.modal-leave-to {
    opacity: 0;
}

.modal-enter-active .shell,
.modal-leave-active .shell {
    transition: transform 0.25s;
}

.modal-enter-from .shell {
    transform: translateY(20px);
}

.modal-leave-to .shell {
    transform: translateY(20px);
}

@media (max-width: 767px) {
    .shell {
        border-radius: 1.5rem;
    }

    .flipbook-stage {
        border-radius: 1.75rem;
    }

    .mobile-nav {
        right: 0.75rem;
        bottom: 0.75rem;
        left: 0.75rem;
    }
}
</style>

<style scoped>
/* ── Modal encerramento ───────────────────────────────────── */
.encerramento-shell {
    border-radius: 2rem;
}

.encerramento-header {
    background: linear-gradient(160deg, rgba(15, 118, 110, 0.22) 0%, rgba(245, 158, 11, 0.12) 100%);
}

.encerramento-icone {
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 9999px;
    background: linear-gradient(135deg, var(--cardapio-accent, #F59E0B), #f97316);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0f172a;
    box-shadow: 0 8px 24px -8px rgba(245, 158, 11, 0.7);
}

.encerramento-total {
    background: linear-gradient(135deg, var(--cardapio-accent, #F59E0B), #f97316);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}
</style>
