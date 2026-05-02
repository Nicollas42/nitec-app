<template>
    <div class="tela_detalhes_mesa p-6 md:p-8 bg-[var(--bg-page)] h-full font-sans flex flex-col relative overflow-y-auto transition-colors duration-300">
        <div v-if="dados_mesa" class="conteudo_mesa flex flex-col h-full max-w-7xl mx-auto w-full">
            <section
                v-if="dados_mesa.solicitando_atendimento && pilha_solicitacoes.length"
                class="mb-5 rounded-[2rem] border border-violet-500/25 bg-gradient-to-r from-violet-500/12 via-fuchsia-500/10 to-sky-500/10 p-5 shadow-sm"
            >
                <!-- Cabeçalho com total de pedidos e botão de resolver -->
                <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-violet-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-violet-500/25 shrink-0">
                            ✦
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.35em] text-violet-700">Clientes Chamando</p>
                            <h2 class="text-xl font-black text-[var(--text-primary)] mt-1">
                                {{ pilha_solicitacoes.length }} pedido(s) aguardando
                            </h2>
                            <p class="text-[11px] font-bold text-violet-600 mt-1">
                                Os itens serão lançados automaticamente nas comandas ao resolver.
                            </p>
                        </div>
                    </div>

                    <button
                        @click="resolver_atendimento"
                        :disabled="resolvendo_atendimento"
                        class="px-5 py-3 rounded-xl bg-violet-600 text-white text-xs font-black uppercase tracking-widest shadow-sm hover:bg-violet-700 disabled:opacity-60 transition-colors shrink-0"
                    >
                        {{ resolvendo_atendimento ? 'Lançando itens...' : `Resolver ${pilha_solicitacoes.length > 1 ? 'Todos (' + pilha_solicitacoes.length + ')' : 'Chamado'}` }}
                    </button>
                </div>

                <!-- Pedidos empilhados -->
                <div class="flex flex-col gap-3">
                    <div
                        v-for="(pedido, idx) in pilha_solicitacoes"
                        :key="idx"
                        class="rounded-[1.5rem] bg-white/70 border border-white/60 p-4"
                    >
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div>
                                <p class="text-sm font-black text-slate-800">
                                    {{ pedido.nome_cliente || 'Cliente não identificado' }}
                                    <span v-if="pedido.telefone" class="font-bold text-slate-500"> · {{ pedido.telefone }}</span>
                                </p>
                                <p class="text-[11px] font-bold text-violet-600 mt-0.5">
                                    Recebido em {{ formatar_data_hora(pedido.solicitado_em) }}
                                </p>
                            </div>
                            <span class="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-violet-500/10 text-violet-700 shrink-0">
                                Pedido {{ idx + 1 }}
                            </span>
                        </div>

                        <div
                            v-if="(pedido.produtos_desejados || []).length > 0"
                            class="grid grid-cols-1 md:grid-cols-2 gap-2"
                        >
                            <article
                                v-for="produto in pedido.produtos_desejados"
                                :key="`${idx}-${produto.produto_id}`"
                                class="rounded-[1.1rem] bg-white border border-violet-100 px-4 py-3 shadow-sm flex items-center justify-between gap-3"
                            >
                                <div class="min-w-0">
                                    <p class="text-sm font-black text-slate-800 truncate">{{ produto.nome_produto }}</p>
                                    <p class="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-0.5">
                                        {{ produto.quantidade }} un · R$ {{ Number(produto.preco_venda || 0).toFixed(2) }}
                                    </p>
                                </div>
                                <span class="px-3 py-1.5 rounded-full bg-violet-500/10 text-violet-700 text-[10px] font-black uppercase tracking-widest shrink-0">
                                    x{{ produto.quantidade }}
                                </span>
                            </article>
                        </div>
                        <p v-else class="text-sm font-bold text-[var(--text-muted)]">Chamou atendimento sem listar produtos.</p>

                        <!-- Botão de resolver apenas este pedido -->
                        <div class="flex justify-end mt-3 pt-3 border-t border-violet-100">
                            <button
                                @click="resolver_atendimento_individual(idx)"
                                :disabled="resolvendo_individual === idx || resolvendo_atendimento"
                                class="px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors flex items-center gap-2"
                            >
                                <span v-if="resolvendo_individual === idx" class="inline-block w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                                {{ resolvendo_individual === idx ? 'Lançando...' : '✓ Resolver este pedido' }}
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section
                v-if="comandas_pendentes.length"
                class="mb-5 rounded-[2rem] border border-amber-500/25 bg-gradient-to-r from-amber-500/10 via-orange-500/8 to-yellow-500/8 p-5 shadow-sm"
            >
                <div class="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-4">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-2xl shadow-lg shadow-amber-500/25 shrink-0">
                            ⏳
                        </div>
                        <div>
                            <p class="text-[10px] font-black uppercase tracking-[0.35em] text-amber-700">Aguardando Aprovacao</p>
                            <h2 class="text-xl font-black text-[var(--text-primary)] mt-1">
                                {{ comandas_pendentes.length }} cliente(s) aguardando
                            </h2>
                            <p class="text-[11px] font-bold text-amber-600 mt-1">
                                Clientes que escanearam o QR Code e solicitaram entrada.
                            </p>
                        </div>
                    </div>

                    <button
                        v-if="comandas_pendentes.length > 1"
                        @click="aprovar_todas_pendentes"
                        :disabled="processando_aprovacao === 'todas'"
                        class="px-5 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-widest shadow-sm hover:bg-emerald-700 disabled:opacity-60 transition-colors shrink-0"
                    >
                        {{ processando_aprovacao === 'todas' ? 'Aprovando...' : `Aprovar Todos (${comandas_pendentes.length})` }}
                    </button>
                </div>

                <div class="flex flex-col gap-3">
                    <div
                        v-for="comanda in comandas_pendentes"
                        :key="'pend-' + comanda.id"
                        class="rounded-[1.5rem] bg-white/70 border border-white/60 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
                    >
                        <div class="flex items-center gap-3 flex-1 min-w-0">
                            <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 text-lg font-black shrink-0">
                                {{ (comanda.buscar_cliente?.nome_cliente || '?').charAt(0).toUpperCase() }}
                            </div>
                            <div class="min-w-0">
                                <p class="text-sm font-black text-slate-800 truncate">
                                    {{ comanda.buscar_cliente?.nome_cliente || 'Cliente' }}
                                </p>
                                <p class="text-[10px] font-bold text-slate-500 mt-0.5">
                                    CPF: {{ formatar_cpf_mascarado(comanda.buscar_cliente?.cpf) }}
                                    <span v-if="comanda.buscar_cliente?.telefone"> · {{ comanda.buscar_cliente.telefone }}</span>
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-2 shrink-0">
                            <button
                                @click="aprovar_comanda(comanda.id)"
                                :disabled="processando_aprovacao === comanda.id"
                                class="px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-emerald-600 disabled:opacity-60 transition-colors"
                            >
                                {{ processando_aprovacao === comanda.id ? '...' : 'Aprovar' }}
                            </button>
                            <button
                                @click="rejeitar_comanda(comanda.id)"
                                :disabled="processando_aprovacao === comanda.id"
                                class="px-4 py-2.5 rounded-xl border border-rose-500/30 text-rose-600 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 disabled:opacity-60 transition-colors"
                            >
                                Rejeitar
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <header class="shrink-0 flex flex-col md:flex-row justify-between items-start md:items-center bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-subtle)] mb-8 gap-4 transition-colors duration-300">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 text-2xl font-black shadow-inner">
                        {{ dados_mesa.nome_mesa.charAt(0) }}
                    </div>
                    <div>
                        <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">{{ dados_mesa.nome_mesa }}</h1>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
                            <p class="text-[11px] font-black text-[var(--text-muted)] uppercase tracking-widest">Em Atendimento</p>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-3 w-full md:w-auto">
                    <div class="flex items-center justify-between bg-[var(--bg-page)] px-5 py-3 rounded-2xl border border-[var(--border-subtle)]">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Total da Mesa</span>
                        <span class="text-2xl font-black text-[var(--text-primary)] tracking-tighter ml-6">R$ {{ total_geral.toFixed(2) }}</span>
                    </div>
                    <div class="flex gap-2 w-full">
                        <button @click="voltar_mapa" class="flex-1 md:flex-none px-5 py-3 bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all">
                            Voltar
                        </button>
                        <button @click="adicionar_novo_cliente" class="flex-1 md:flex-none px-5 py-3 bg-purple-500/10 text-purple-600 border border-purple-500/20 rounded-xl hover:bg-purple-500/20 text-xs font-black uppercase tracking-widest transition-all shadow-sm">
                            ➕ Sub-Comanda
                        </button>
                        <button @click="pagar_tudo" class="flex-1 md:flex-none px-5 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-md active:scale-95">
                            💳 Cobrar Tudo
                        </button>
                    </div>
                </div>
            </header>

            <main class="flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start pb-6">
                <article
                    v-for="comanda in comandas_abertas"
                    :key="comanda.id"
                    class="bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[var(--border-subtle)] flex flex-col relative group transition-colors duration-300"
                >
                    <div class="flex justify-between items-start mb-6 border-b border-dashed border-[var(--border-subtle)] pb-5">
                        <div>
                            <span
                                class="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border mb-2 inline-block"
                                :class="comanda.tipo_conta === 'geral' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-purple-500/10 text-purple-500 border-purple-500/20'"
                            >
                                CMD #{{ comanda.id }} • {{ comanda.tipo_conta === 'geral' ? 'Principal' : 'Individual' }}
                            </span>
                            <p class="text-sm text-[var(--text-muted)] mt-1 font-medium">
                                Cliente: <span class="font-black text-[var(--text-primary)]">{{ comanda.buscar_cliente?.nome_cliente || 'Nao informado' }}</span>
                            </p>
                            <p class="text-[10px] font-bold text-[var(--text-muted)] mt-0.5 opacity-80" v-if="comanda.buscar_cliente">
                                <span v-if="comanda.buscar_cliente.cpf">CPF: {{ formatar_cpf_mascarado(comanda.buscar_cliente.cpf) }}</span>
                                <span v-if="comanda.buscar_cliente.telefone"> · Tel: {{ comanda.buscar_cliente.telefone }}</span>
                            </p>
                        </div>

                        <button @click="abrir_modal_cancelamento(comanda.id)" class="text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 h-10 w-10 rounded-xl flex items-center justify-center transition-colors text-lg" title="Cancelar comanda inteira">
                            🗑️
                        </button>
                    </div>

                    <div class="mb-6 flex flex-col gap-3">
                        <div class="flex items-end justify-between bg-[var(--bg-page)] p-4 rounded-2xl border border-[var(--border-subtle)] shadow-inner">
                            <span class="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest">Total a Pagar</span>
                            <span class="text-3xl font-black text-[var(--text-primary)] tracking-tighter">R$ {{ Number(comanda.valor_total).toFixed(2) }}</span>
                        </div>

                        <div class="flex gap-2">
                            <button @click="abrir_pdv_para_comanda(comanda.id)" class="flex-1 bg-nitec_blue hover:bg-blue-700 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-md text-[10px] flex justify-center items-center gap-2 active:scale-95">
                                <span class="text-sm">➕</span> Adicionar Produto
                            </button>
                            <button @click="fechar_conta_comanda(comanda.id)" class="flex-1 bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest py-4 rounded-xl transition-all shadow-md text-[10px] flex justify-center items-center gap-2 active:scale-95">
                                <span class="text-sm">💳</span> Cobrar Conta
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto max-h-72 custom-scrollbar pr-2">
                        <h3 class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3">Itens Lancados ({{ comanda.listar_itens.length }})</h3>

                        <div v-if="comanda.listar_itens.length === 0" class="text-center py-6 bg-[var(--bg-page)] rounded-2xl border border-dashed border-[var(--border-subtle)]">
                            <p class="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest">Comanda Vazia</p>
                        </div>

                        <div
                            v-for="item in comanda.listar_itens"
                            :key="item.id"
                            class="flex flex-col p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-sm hover:border-blue-500/50 rounded-2xl mb-2 transition-all relative"
                            :class="{ 'opacity-50 pointer-events-none grayscale': item_processando === item.id }"
                        >
                            <div class="flex justify-between items-start mb-2">
                                <div class="flex flex-col">
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <span class="font-black text-[var(--text-primary)] text-sm leading-tight">{{ item.buscar_produto.nome_produto }}</span>
                                        <span
                                            v-if="item.status_cozinha"
                                            class="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full"
                                            :class="{
                                                'bg-red-100 text-red-600': item.status_cozinha === 'pendente',
                                                'bg-amber-100 text-amber-600': item.status_cozinha === 'em_preparacao',
                                                'bg-green-100 text-green-600': item.status_cozinha === 'finalizado',
                                            }"
                                        >
                                            {{ item.status_cozinha === 'pendente' ? 'Fila' : item.status_cozinha === 'em_preparacao' ? 'Preparando' : 'Pronto ✓' }}
                                        </span>
                                    </div>
                                    <p v-if="item.adicionais && item.adicionais.length > 0" class="text-[9px] text-nitec_blue font-bold mt-0.5 leading-tight">
                                        <template v-for="(ad, idx) in item.adicionais" :key="ad.id">
                                            {{ idx > 0 ? ', ' : '' }}{{ (ad.quantidade || 1) > 1 ? (ad.quantidade || 1) + 'x ' : '' }}+ {{ ad.buscar_item_adicional?.nome || 'Adicional' }}
                                            <template v-if="Number(ad.preco_unitario) > 0"> (R$ {{ (Number(ad.preco_unitario) * (ad.quantidade || 1)).toFixed(2) }})</template>
                                        </template>
                                    </p>
                                    <span class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-0.5">R$ {{ Number(item.preco_unitario).toFixed(2) }} unid.</span>
                                </div>
                                <span class="font-black text-[var(--text-primary)] text-base tracking-tight">
                                    R$ {{ (item.quantidade * (Number(item.preco_unitario) + (item.adicionais || []).reduce((soma, ad) => soma + (Number(ad.preco_unitario) || 0) * (ad.quantidade || 1), 0))).toFixed(2) }}
                                </span>
                            </div>

                            <div class="flex items-center justify-between mt-1 pt-2 border-t border-[var(--border-subtle)]">
                                <div class="flex items-center bg-[var(--bg-page)] rounded-lg p-1 border border-[var(--border-subtle)]">
                                    <button @click="alterar_quantidade(item.id, 'decrementar')" class="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded-md shadow-sm text-[var(--text-primary)] hover:text-red-500 font-black text-lg hover:border-red-500/50 border border-transparent transition-all">-</button>
                                    <span class="w-10 text-center text-sm font-black text-[var(--text-primary)]">{{ item.quantidade }}</span>
                                    <button @click="alterar_quantidade(item.id, 'incrementar')" class="w-8 h-8 flex items-center justify-center bg-[var(--bg-card)] rounded-md shadow-sm text-[var(--text-primary)] hover:text-blue-500 font-black text-lg hover:border-blue-500/50 border border-transparent transition-all">+</button>
                                </div>
                                <button @click="remover_item_consumido(item.id)" class="text-[var(--text-muted)] hover:text-red-500 bg-[var(--bg-page)] hover:bg-red-500/10 px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest border border-transparent hover:border-red-500/30 transition-all">
                                    Remover
                                </button>
                            </div>
                        </div>
                    </div>
                </article>
            </main>
        </div>

        <div v-if="modal_cliente_visivel" class="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-[var(--bg-card)] w-full max-w-sm p-8 rounded-[2.5rem] shadow-2xl border border-[var(--border-subtle)]">
                <div class="mb-6 text-center">
                    <div class="w-16 h-16 bg-purple-500/10 text-purple-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">👥</div>
                    <h2 class="text-xl font-black text-[var(--text-primary)]">Nova Sub-Comanda</h2>
                    <p class="text-xs text-[var(--text-muted)] mt-1 font-medium">Separar a conta para um novo cliente nesta mesa.</p>
                </div>
                <div class="flex flex-col gap-4">
                    <input v-model="input_novo_cliente" type="text" placeholder="Nome do Cliente (Ex: Maria)" class="w-full p-4 bg-[var(--bg-page)] border-2 border-[var(--border-subtle)] rounded-2xl outline-none focus:border-purple-500 text-sm font-bold text-center text-[var(--text-primary)] transition-colors" @keyup.enter="confirmar_novo_cliente" autofocus>
                    <div class="flex gap-3 mt-2">
                        <button @click="fechar_modal_cliente" class="flex-1 py-4 bg-[var(--bg-page)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-2xl font-black text-[10px] uppercase tracking-widest hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">Cancelar</button>
                        <button @click="confirmar_novo_cliente" class="flex-[1.5] py-4 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md transition-all active:scale-95">Criar Conta</button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="modal_cancelamento_visivel" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div class="bg-[var(--bg-card)] w-full max-w-md p-8 rounded-[2.5rem] shadow-2xl flex flex-col text-center border-2 border-red-500/20">
                <div class="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4 shadow-inner text-3xl">🚨</div>
                <h2 class="text-xl font-black text-[var(--text-primary)] tracking-tight">Cancelar Comanda</h2>
                <p class="text-xs text-[var(--text-muted)] font-bold mt-1 mb-6 bg-[var(--bg-page)] p-3 rounded-xl border border-[var(--border-subtle)]">Esta acao fechara a conta sem pagamento e liberara a mesa.</p>

                <div class="flex flex-col gap-4 text-left">
                    <div class="flex flex-col gap-1">
                        <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] pl-2">Motivo do Cancelamento</label>
                        <select v-model="form_cancelamento.motivo_cancelamento" class="w-full p-4 bg-[var(--bg-page)] border-2 border-[var(--border-subtle)] rounded-2xl outline-none focus:border-red-500 text-sm font-bold text-[var(--text-primary)] transition-colors">
                            <option value="Erro de Digitacao / Lancamento">Erro de lancamento</option>
                            <option value="Cliente saiu sem pagar (Calote)">Cliente saiu sem pagar</option>
                            <option value="Cliente desistiu antes de consumir">Cliente desistiu antes de consumir</option>
                        </select>
                    </div>

                    <div class="bg-[var(--bg-page)] p-4 rounded-2xl border border-[var(--border-subtle)] mt-2">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-3 text-center">O que fazer com os itens lancados?</p>

                        <label class="flex items-center gap-3 cursor-pointer mb-2 p-3 bg-[var(--bg-card)] rounded-xl transition-all border border-[var(--border-subtle)] hover:border-red-500/50 shadow-sm group">
                            <input v-model="form_cancelamento.retornar_ao_estoque" type="radio" :value="false" class="w-5 h-5 text-red-500 focus:ring-red-500 bg-[var(--bg-page)] border-[var(--border-subtle)]">
                            <div>
                                <span class="block text-xs font-black text-[var(--text-primary)] group-hover:text-red-500 transition-colors">Foram consumidos (gerar perda)</span>
                                <span class="block text-[10px] text-[var(--text-muted)] font-bold">Prejuizo registrado na auditoria.</span>
                            </div>
                        </label>

                        <label class="flex items-center gap-3 cursor-pointer p-3 bg-[var(--bg-card)] rounded-xl transition-all border border-[var(--border-subtle)] hover:border-green-500/50 shadow-sm group">
                            <input v-model="form_cancelamento.retornar_ao_estoque" type="radio" :value="true" class="w-5 h-5 text-green-500 focus:ring-green-500 bg-[var(--bg-page)] border-[var(--border-subtle)]">
                            <div>
                                <span class="block text-xs font-black text-[var(--text-primary)] group-hover:text-green-500 transition-colors">Foi um erro (devolver)</span>
                                <span class="block text-[10px] text-[var(--text-muted)] font-bold">Os itens voltam para o estoque.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div class="flex gap-3 mt-6">
                    <button @click="modal_cancelamento_visivel = false" class="flex-1 py-4 bg-[var(--bg-page)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">Cancelar</button>
                    <button @click="confirmar_cancelamento" :disabled="cancelando" class="flex-[1.5] py-4 bg-red-500 hover:bg-red-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg transition-all active:scale-95 disabled:opacity-50 border border-transparent">
                        {{ cancelando ? 'Processando...' : 'Confirmar Encerramento' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useLogicaMesaDetalhes } from './pagina_mesa_detalhes_logica.js';

const {
    dados_mesa,
    voltar_mapa,
    total_geral,
    pagar_tudo,
    abrir_pdv_para_comanda,
    adicionar_novo_cliente,
    modal_cliente_visivel,
    input_novo_cliente,
    fechar_modal_cliente,
    confirmar_novo_cliente,
    alterar_quantidade,
    remover_item_consumido,
    fechar_conta_comanda,
    item_processando,
    modal_cancelamento_visivel,
    form_cancelamento,
    abrir_modal_cancelamento,
    confirmar_cancelamento,
    cancelando,
    resolver_atendimento,
    resolvendo_atendimento,
    resolver_atendimento_individual,
    resolvendo_individual,
    formatar_data_hora,
    comandas_pendentes,
    comandas_abertas,
    processando_aprovacao,
    aprovar_comanda,
    aprovar_todas_pendentes,
    rejeitar_comanda,
    formatar_cpf_mascarado,
} = useLogicaMesaDetalhes();

// Normaliza solicitacao_detalhes para sempre ser um array de pedidos
// (suporte ao formato antigo onde era um objeto único)
const pilha_solicitacoes = computed(() => {
    const detalhes = dados_mesa.value?.solicitacao_detalhes;
    if (!detalhes) return [];
    if (Array.isArray(detalhes)) return detalhes;
    return [detalhes]; // formato antigo: objeto único
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #d1d5db; }
</style>
