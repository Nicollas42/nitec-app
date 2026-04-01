<template>
    <div class="p-6 md:p-8 bg-[var(--bg-page)] h-full overflow-y-auto font-sans transition-colors duration-300">
        <header class="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[2rem] p-6 shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
                <p class="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-600">Cardapio Digital</p>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight mt-2">Personalizacao por mesa e QR Code</h1>
                <p class="text-sm font-bold text-[var(--text-muted)] mt-2 max-w-3xl">
                    Escolha os produtos visiveis no cardapio, estilize a experiencia do cliente e gere os QR Codes de cada mesa.
                </p>
            </div>
            <div class="flex gap-2 w-full lg:w-auto">
                <button
                    @click="voltar_painel"
                    class="lg:hidden flex-1 px-5 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-primary)] text-xs font-black uppercase tracking-widest hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                    Voltar
                </button>
                <button
                    @click="salvar_config"
                    :disabled="salvando_config"
                    class="flex-1 lg:flex-none px-6 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors"
                >
                    {{ salvando_config ? 'Salvando...' : 'Salvar Cardapio' }}
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

        <div v-else class="mt-6 grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
            <section class="bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[2rem] p-6 shadow-sm">
                <div class="flex items-start justify-between gap-4 mb-6">
                    <div>
                        <h2 class="text-lg font-black text-[var(--text-primary)]">Identidade visual</h2>
                        <p class="text-xs font-bold text-[var(--text-muted)] mt-1">As cores e textos abaixo aparecem na pagina publica do cliente.</p>
                    </div>
                    <span class="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                        {{ total_produtos_visiveis }} itens visiveis
                    </span>
                </div>

                <form class="grid grid-cols-1 md:grid-cols-2 gap-4" @submit.prevent="salvar_config">
                    <label class="flex flex-col gap-2 md:col-span-2">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome de exibicao</span>
                        <input v-model="configuracao.nome_exibicao" type="text" class="w-full p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500" />
                    </label>

                    <label class="flex flex-col gap-2 md:col-span-2">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Subtitulo</span>
                        <input v-model="configuracao.subtitulo" type="text" class="w-full p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500" />
                    </label>

                    <label class="flex flex-col gap-2 md:col-span-2">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Mensagem de boas-vindas</span>
                        <textarea v-model="configuracao.mensagem_boas_vindas" rows="4" class="w-full p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500 resize-none"></textarea>
                    </label>

                    <label class="flex flex-col gap-2">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cor primaria</span>
                        <div class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)]">
                            <input v-model="configuracao.cor_primaria" type="color" class="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer" />
                            <input v-model="configuracao.cor_primaria" type="text" class="flex-1 bg-transparent outline-none text-sm font-black text-[var(--text-primary)] uppercase" />
                        </div>
                    </label>

                    <label class="flex flex-col gap-2">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cor destaque</span>
                        <div class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)]">
                            <input v-model="configuracao.cor_destaque" type="color" class="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer" />
                            <input v-model="configuracao.cor_destaque" type="text" class="flex-1 bg-transparent outline-none text-sm font-black text-[var(--text-primary)] uppercase" />
                        </div>
                    </label>

                    <label class="flex flex-col gap-2 md:col-span-2">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cor de fundo</span>
                        <div class="flex items-center gap-3 p-3 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)]">
                            <input v-model="configuracao.cor_fundo" type="color" class="w-12 h-12 rounded-xl bg-transparent border-0 cursor-pointer" />
                            <input v-model="configuracao.cor_fundo" type="text" class="flex-1 bg-transparent outline-none text-sm font-black text-[var(--text-primary)] uppercase" />
                        </div>
                    </label>

                    <label class="flex flex-col gap-2 md:col-span-2">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Logo URL</span>
                        <input v-model="configuracao.logo_url" type="url" placeholder="https://..." class="w-full p-4 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-emerald-500" />
                    </label>
                </form>
            </section>

            <section class="rounded-[2rem] overflow-hidden border border-[var(--border-subtle)] shadow-sm" :style="preview_style">
                <div class="p-6 sm:p-7 min-h-full bg-[var(--cardapio-bg)] relative">
                    <div class="absolute inset-0 opacity-80 pointer-events-none" style="background: radial-gradient(circle at top right, color-mix(in srgb, var(--cardapio-accent) 26%, transparent), transparent 35%), radial-gradient(circle at bottom left, color-mix(in srgb, var(--cardapio-primary) 20%, transparent), transparent 35%);"></div>
                    <div class="relative z-10 flex flex-col gap-5">
                        <div class="flex items-start justify-between gap-4">
                            <div class="flex items-center gap-4">
                                <div v-if="configuracao.logo_url" class="w-16 h-16 rounded-[1.5rem] bg-white/90 shadow-sm overflow-hidden border border-white/70">
                                    <img :src="configuracao.logo_url" alt="Logo do cardapio" class="w-full h-full object-cover" />
                                </div>
                                <div v-else class="w-16 h-16 rounded-[1.5rem] bg-white text-slate-800 shadow-sm flex items-center justify-center text-xl font-black border border-white/70">
                                    MENU
                                </div>
                                <div>
                                    <p class="text-[10px] font-black uppercase tracking-[0.35em]" style="color: var(--cardapio-primary);">Preview</p>
                                    <h2 class="text-2xl font-black text-slate-900 mt-2">{{ configuracao.nome_exibicao || 'Nosso Cardapio' }}</h2>
                                    <p class="text-sm font-bold text-slate-500 mt-1">{{ configuracao.subtitulo || 'Sabores especiais para a experiencia na mesa.' }}</p>
                                </div>
                            </div>
                            <span class="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm" style="background: var(--cardapio-primary);">
                                Mesa Digital
                            </span>
                        </div>

                        <div class="rounded-[2rem] bg-white/85 backdrop-blur-md p-5 border border-white/60 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
                            <p class="text-sm font-bold leading-relaxed text-slate-700">
                                {{ configuracao.mensagem_boas_vindas || 'Explore o cardapio, acompanhe sua comanda e chame o garcom quando quiser.' }}
                            </p>
                            <div class="mt-5 grid grid-cols-2 gap-3">
                                <div class="rounded-[1.5rem] bg-white border border-slate-100 p-4 shadow-sm">
                                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Aba ativa</p>
                                    <p class="text-lg font-black mt-2" style="color: var(--cardapio-primary);">Cardapio</p>
                                </div>
                                <div class="rounded-[1.5rem] bg-slate-900 text-white p-4 shadow-sm">
                                    <p class="text-[10px] font-black uppercase tracking-widest text-white/60">Acao rapida</p>
                                    <p class="text-lg font-black mt-2" style="color: var(--cardapio-accent);">Solicitar atendimento</p>
                                </div>
                            </div>
                            <div class="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div class="rounded-[1.5rem] bg-white p-4 border border-slate-100 shadow-sm">
                                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Produto exemplo</p>
                                    <p class="text-base font-black text-slate-900 mt-2">Gin Tonica Citrus</p>
                                    <p class="text-xs font-bold text-slate-500 mt-1">Botanicos frescos, gelo premium e toque de lima.</p>
                                    <p class="text-lg font-black mt-3" style="color: var(--cardapio-primary);">R$ 29,90</p>
                                </div>
                                <div class="rounded-[1.5rem] p-4 shadow-sm text-slate-900" style="background: color-mix(in srgb, var(--cardapio-accent) 16%, white); border: 1px solid color-mix(in srgb, var(--cardapio-accent) 30%, white);">
                                    <p class="text-[10px] font-black uppercase tracking-widest text-slate-500">Minha comanda</p>
                                    <p class="text-base font-black mt-2">Cliente identificado</p>
                                    <p class="text-xs font-bold text-slate-600 mt-1">Joana · (11) 99999-0000</p>
                                    <p class="text-lg font-black mt-3" style="color: var(--cardapio-primary);">R$ 76,40</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section class="xl:col-span-2 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-[2rem] p-6 shadow-sm">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
                    <div>
                        <h2 class="text-lg font-black text-[var(--text-primary)]">Produtos visiveis no cardapio</h2>
                        <p class="text-xs font-bold text-[var(--text-muted)] mt-1">Ative apenas os itens que devem aparecer para o cliente na pagina publica.</p>
                    </div>
                    <div class="px-4 py-2 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                        {{ total_produtos_visiveis }} de {{ produtos_por_categoria.reduce((acc, grupo) => acc + grupo.produtos.length, 0) }} ativos
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <section
                        v-for="grupo in produtos_por_categoria"
                        :key="grupo.categoria"
                        class="rounded-[1.75rem] border border-[var(--border-subtle)] bg-[var(--bg-page)] overflow-hidden"
                    >
                        <div class="px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
                            <div>
                                <h3 class="text-sm font-black text-[var(--text-primary)]">{{ grupo.categoria }}</h3>
                                <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">{{ grupo.produtos.length }} produto(s)</p>
                            </div>
                        </div>

                        <div class="p-3 flex flex-col gap-2">
                            <article
                                v-for="produto in grupo.produtos"
                                :key="produto.id"
                                class="rounded-[1.25rem] bg-[var(--bg-card)] border border-[var(--border-subtle)] px-4 py-3 flex items-center justify-between gap-4"
                                :class="produto.visivel_cardapio ? 'shadow-sm border-emerald-500/20' : ''"
                            >
                                <div class="min-w-0">
                                    <p class="text-sm font-black text-[var(--text-primary)] truncate">{{ produto.nome_produto }}</p>
                                    <p class="text-[10px] font-bold uppercase tracking-widest text-[var(--text-muted)] mt-1">
                                        R$ {{ Number(produto.preco_venda || 0).toFixed(2) }}
                                    </p>
                                </div>

                                <button
                                    @click="alternar_visibilidade(produto)"
                                    :disabled="produto_processando === produto.id"
                                    class="relative inline-flex h-8 w-16 items-center rounded-full transition-colors"
                                    :class="produto.visivel_cardapio ? 'bg-emerald-500' : 'bg-slate-300'"
                                >
                                    <span
                                        class="inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform"
                                        :class="produto.visivel_cardapio ? 'translate-x-9' : 'translate-x-1'"
                                    ></span>
                                    <span class="absolute inset-0 flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-white/90">
                                        {{ produto_processando === produto.id ? '...' : (produto.visivel_cardapio ? 'On' : 'Off') }}
                                    </span>
                                </button>
                            </article>
                        </div>
                    </section>
                </div>
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
    salvando_config,
    produto_processando,
    configuracao,
    produtos_por_categoria,
    total_produtos_visiveis,
    preview_style,
    lista_mesas,
    voltar_painel,
    salvar_config,
    alternar_visibilidade,
} = useLogicaCardapioAdmin();
</script>
