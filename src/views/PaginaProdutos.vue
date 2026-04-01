<template>
    <div class="pagina_produtos bg-[var(--bg-page)] h-full overflow-y-auto font-sans flex flex-col">

        <!-- FormularioProduto ocupa a página inteira quando ativo -->
        <div v-if="aba_ativa === 'formulario_produto'" class="p-3 sm:p-6 md:p-8">
            <FormularioProduto
                :carregando_produto="carregando_produto"
                :modo_edicao="modo_edicao"
                :formulario_dados="formulario_dados"
                :lista_fornecedores="lista_fornecedores"
                :lista_grupos_adicionais="lista_grupos_adicionais"
                :salvando="salvando"
                @salvar="salvar_produto"
                @cancelar="cancelar_formulario_produto"
                @adicionar-alias="adicionar_alias_codigo_barras"
                @remover-alias="remover_alias_codigo_barras"
                @adicionar-vinculo="adicionar_vinculo_fornecedor"
                @remover-vinculo="remover_vinculo_fornecedor"
                @abrir-novo-fornecedor="abrir_modal_novo_fornecedor('produto')"
            />
        </div>

        <!-- Formulário de fornecedor (aba fornecedores) -->
        <div v-else-if="aba_ativa === 'fornecedores'" class="p-3 sm:p-6 md:p-8 flex flex-col gap-6">

            <!-- Cabeçalho da aba -->
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <button @click="abrir_aba_estoque"
                        class="flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 class="text-2xl font-black text-[var(--text-primary)]">Fornecedores</h1>
                        <p class="text-sm text-[var(--text-muted)] mt-1">Gerencie os fornecedores cadastrados.</p>
                    </div>
                </div>
            </header>

            <!-- Formulário fixo de fornecedor -->
            <section class="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-subtle)] shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between gap-3">
                    <div>
                        <h2 class="text-base font-black text-[var(--text-primary)]">
                            {{ modo_edicao_fornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor' }}
                        </h2>
                    </div>
                    <button @click="alternar_formulario_fornecedor_minimizado"
                        class="px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors">
                        {{ formulario_fornecedor_minimizado ? 'Expandir' : 'Minimizar' }}
                    </button>
                </div>

                <div v-if="!formulario_fornecedor_minimizado" class="p-6 space-y-5">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Nome Fantasia *</label>
                            <input v-model="formulario_fornecedor.nome_fantasia" type="text"
                                placeholder="Ex: Distribuidora Santos"
                                class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Razão Social *</label>
                            <input v-model="formulario_fornecedor.razao_social" type="text"
                                placeholder="Razão Social Ltda."
                                class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                        </div>
                        <div class="space-y-1.5">
                            <div class="flex items-center justify-between">
                                <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">CNPJ / CPF *</label>
                                <span v-if="formulario_fornecedor.cnpj" class="text-[9px] font-black uppercase tracking-widest"
                                    :class="validar_cnpj_cpf(formulario_fornecedor.cnpj) ? 'text-green-500' : 'text-red-500'">
                                    {{ validar_cnpj_cpf(formulario_fornecedor.cnpj) ? '✓ Válido' : '✗ Inválido' }}
                                </span>
                            </div>
                            <input v-model="formulario_fornecedor.cnpj" type="text"
                                placeholder="00.000.000/0000-00 ou 000.000.000-00"
                                maxlength="18"
                                @blur="formatar_cnpj_ao_sair($event, formulario_fornecedor)"
                                :class="cls_campo(formulario_fornecedor.cnpj, validar_cnpj_cpf)"
                                class="w-full p-3 rounded-xl bg-[var(--bg-page)] border text-sm font-bold text-[var(--text-primary)] outline-none transition-colors font-mono" />
                        </div>
                        <div class="space-y-1.5">
                            <div class="flex items-center justify-between">
                                <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Telefone</label>
                                <span v-if="formulario_fornecedor.telefone" class="text-[9px] font-black uppercase tracking-widest"
                                    :class="validar_telefone_br(formulario_fornecedor.telefone) ? 'text-green-500' : 'text-red-500'">
                                    {{ validar_telefone_br(formulario_fornecedor.telefone) ? '✓ Válido' : '✗ Formato inválido' }}
                                </span>
                            </div>
                            <input v-model="formulario_fornecedor.telefone" type="text"
                                placeholder="(00) 99999-9999"
                                maxlength="16"
                                @blur="formatar_tel_ao_sair($event, formulario_fornecedor)"
                                :class="cls_campo(formulario_fornecedor.telefone, validar_telefone_br)"
                                class="w-full p-3 rounded-xl bg-[var(--bg-page)] border text-sm font-bold text-[var(--text-primary)] outline-none transition-colors" />
                        </div>
                        <div class="space-y-1.5">
                            <div class="flex items-center justify-between">
                                <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">E-mail</label>
                                <span v-if="formulario_fornecedor.email" class="text-[9px] font-black uppercase tracking-widest"
                                    :class="validar_email_simples(formulario_fornecedor.email) ? 'text-green-500' : 'text-red-500'">
                                    {{ validar_email_simples(formulario_fornecedor.email) ? '✓ Válido' : '✗ E-mail inválido' }}
                                </span>
                            </div>
                            <input v-model="formulario_fornecedor.email" type="text"
                                placeholder="vendas@fornecedor.com"
                                :class="cls_campo(formulario_fornecedor.email, validar_email_simples)"
                                class="w-full p-3 rounded-xl bg-[var(--bg-page)] border text-sm font-bold text-[var(--text-primary)] outline-none transition-colors" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Representante / Vendedor</label>
                            <input v-model="formulario_fornecedor.vendedor" type="text"
                                placeholder="Nome do vendedor"
                                class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Contato do Vendedor</label>
                            <input v-model="formulario_fornecedor.contato_vendedor" type="text"
                                placeholder="WhatsApp ou ramal"
                                class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors" />
                        </div>
                        <div class="space-y-1.5">
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Status</label>
                            <select v-model="formulario_fornecedor.status_fornecedor" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue transition-colors">
                                <option value="ativo">Ativo</option>
                                <option value="inativo">Inativo</option>
                            </select>
                        </div>
                    </div>

                    <div class="flex flex-col sm:flex-row gap-3 pt-2 border-t border-[var(--border-subtle)]">
                        <button @click="cancelar_formulario_fornecedor"
                            class="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card)] transition-colors">
                            Cancelar
                        </button>
                        <button @click="salvar_fornecedor" :disabled="salvando_fornecedor"
                            class="flex-1 py-3 rounded-xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-40 hover:opacity-90 transition-opacity">
                            {{ salvando_fornecedor ? 'Salvando...' : (modo_edicao_fornecedor ? 'Salvar Alterações' : 'Cadastrar Fornecedor') }}
                        </button>
                    </div>
                </div>
            </section>

            <!-- Listagem de fornecedores -->
            <section v-if="fornecedores_filtrados.length" class="space-y-3">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <h3 class="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">
                        {{ fornecedores_filtrados.length }} fornecedor{{ fornecedores_filtrados.length !== 1 ? 'es' : '' }}
                    </h3>
                    <SelectPesquisavel
                        :model-value="filtro_fornecedor_id"
                        :opcoes="opcoes_filtro_fornecedor"
                        chave_valor="id"
                        chave_rotulo="label"
                        placeholder="Filtrar fornecedor..."
                        texto_vazio="Nenhum encontrado."
                        class="w-64"
                        @update:model-value="filtro_fornecedor_id = $event"
                    />
                </div>

                <article v-for="fornecedor in fornecedores_filtrados" :key="fornecedor.id"
                    class="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-5">
                    <div class="flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <div class="flex items-center gap-2">
                                <p class="text-sm font-black text-[var(--text-primary)]">{{ fornecedor.nome_fantasia }}</p>
                                <span class="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest"
                                    :class="fornecedor.status_fornecedor === 'ativo'
                                        ? 'bg-green-500/10 text-green-600 border border-green-500/20'
                                        : 'bg-[var(--bg-page)] text-[var(--text-muted)] border border-[var(--border-subtle)]'">
                                    {{ fornecedor.status_fornecedor }}
                                </span>
                            </div>
                            <p class="text-[11px] text-[var(--text-muted)] font-bold mt-0.5">{{ fornecedor.razao_social }}</p>
                        </div>
                        <div class="flex gap-2">
                            <button @click="abrir_edicao_fornecedor(fornecedor)"
                                class="px-3 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:text-blue-500 hover:border-blue-500/30 transition-colors">
                                Editar
                            </button>
                            <button @click="excluir_fornecedor(fornecedor)"
                                :disabled="fornecedor_excluindo_id === fornecedor.id"
                                class="px-3 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white disabled:opacity-40 transition-colors">
                                Excluir
                            </button>
                        </div>
                    </div>
                    <div class="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-[11px] font-bold text-[var(--text-muted)]">
                        <p><span class="text-[var(--text-primary)]">CNPJ:</span> {{ fornecedor.cnpj || '—' }}</p>
                        <p><span class="text-[var(--text-primary)]">Tel:</span> {{ fornecedor.telefone || '—' }}</p>
                        <p><span class="text-[var(--text-primary)]">Vendedor:</span> {{ fornecedor.vendedor || '—' }}</p>
                        <p><span class="text-[var(--text-primary)]">Contato:</span> {{ fornecedor.contato_vendedor || '—' }}</p>
                    </div>
                </article>
            </section>

            <div v-else class="bg-[var(--bg-card)] rounded-2xl border border-dashed border-[var(--border-subtle)] p-10 text-center text-[var(--text-muted)] font-bold italic text-sm">
                Nenhum fornecedor cadastrado ainda.
            </div>
        </div>

        <!-- Aba de Adicionais -->
        <div v-else-if="aba_ativa === 'adicionais'" class="p-3 sm:p-6 md:p-8 flex flex-col gap-6">
            <header class="flex flex-wrap items-center justify-between gap-4">
                <div class="flex items-center gap-3">
                    <button @click="voltar_aba_um_nivel"
                        class="flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 class="text-2xl font-black text-[var(--text-primary)]">Adicionais</h1>
                        <p class="text-sm text-[var(--text-muted)] mt-1">Gerencie grupos de sabores e itens extras.</p>
                    </div>
                </div>
                <button @click="cancelar_edicao_grupo(false); mostrando_form_grupo = true"
                    class="px-5 py-2.5 bg-nitec_blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-colors">
                    + Novo Grupo
                </button>
            </header>

            <!-- Formulário criar/editar grupo -->
            <section v-if="mostrando_form_grupo" class="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] p-5 shadow-sm">
                <h3 class="text-xs font-black text-[var(--text-primary)] uppercase tracking-widest mb-4">
                    {{ grupo_em_edicao ? 'Editar Grupo' : 'Novo Grupo' }}
                </h3>
                <div class="flex flex-col sm:flex-row gap-3">
                    <input v-model="input_nome_grupo" type="text" placeholder="Nome do grupo (ex: Sabores de Pastel)"
                        class="flex-1 p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue placeholder:text-[var(--text-muted)]" />
                    <input v-model.number="input_maximo_selecoes" type="number" min="0" placeholder="Máx seleções (0=∞)"
                        class="w-full sm:w-40 p-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue placeholder:text-[var(--text-muted)]" />
                </div>
                <p class="text-[10px] text-[var(--text-muted)] font-bold mt-1.5">Máximo de seleções: 0 = ilimitado</p>
                <div class="flex gap-2 mt-4">
                    <button @click="salvar_grupo"
                        class="px-5 py-2.5 bg-nitec_blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">
                        {{ grupo_em_edicao ? 'Salvar' : 'Criar Grupo' }}
                    </button>
                    <button @click="mostrando_form_grupo = false; cancelar_edicao_grupo()"
                        class="px-5 py-2.5 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors">
                        Cancelar
                    </button>
                </div>
            </section>

            <!-- Lista de grupos -->
            <div v-if="lista_grupos_adicionais.length === 0 && !mostrando_form_grupo"
                class="bg-[var(--bg-card)] rounded-2xl border border-dashed border-[var(--border-subtle)] p-10 text-center text-[var(--text-muted)] font-bold italic text-sm">
                Nenhum grupo de adicionais cadastrado ainda.
            </div>

            <section v-for="grupo in lista_grupos_adicionais" :key="grupo.id"
                class="bg-[var(--bg-card)] rounded-2xl border border-[var(--border-subtle)] shadow-sm overflow-hidden">

                <!-- Cabeçalho do grupo (clicável para expandir) -->
                <div @click="alternar_grupo_expandido(grupo.id)"
                    class="px-5 py-4 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-card-hover)] transition-colors">
                    <div class="flex items-center gap-3">
                        <span class="text-sm font-black text-[var(--text-primary)]">{{ grupo.nome }}</span>
                        <span class="px-2 py-0.5 rounded-full bg-nitec_blue/10 text-nitec_blue text-[10px] font-black">
                            {{ (grupo.itens || []).length }} itens
                        </span>
                        <span v-if="grupo.maximo_selecoes > 0" class="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500 text-[10px] font-black">
                            máx {{ grupo.maximo_selecoes }}
                        </span>
                    </div>
                    <div class="flex items-center gap-2">
                        <button @click.stop="abrir_edicao_grupo(grupo); mostrando_form_grupo = true"
                            class="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[10px] font-black text-[var(--text-muted)] hover:text-nitec_blue hover:border-nitec_blue transition-colors">
                            Editar
                        </button>
                        <button @click.stop="excluir_grupo(grupo.id)"
                            class="px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] text-[10px] font-black text-[var(--text-muted)] hover:text-red-500 hover:border-red-500 transition-colors">
                            Excluir
                        </button>
                        <svg :class="grupo_expandido === grupo.id ? 'rotate-180' : ''" class="w-4 h-4 text-[var(--text-muted)] transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>

                <!-- Itens do grupo (expandido) -->
                <div v-if="grupo_expandido === grupo.id" class="border-t border-[var(--border-subtle)]">
                    <div v-if="(grupo.itens || []).length === 0" class="p-5 text-center text-[var(--text-muted)] text-xs font-bold italic">
                        Nenhum item neste grupo.
                    </div>

                    <div v-for="item in (grupo.itens || [])" :key="item.id"
                        class="px-5 py-3 flex items-center justify-between border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors">
                        <div>
                            <span class="text-xs font-bold text-[var(--text-primary)]">{{ item.nome }}</span>
                            <span class="ml-2 text-xs font-black" :class="Number(item.preco) > 0 ? 'text-green-500' : 'text-[var(--text-muted)]'">
                                {{ Number(item.preco) > 0 ? 'R$ ' + Number(item.preco).toFixed(2) : 'Grátis' }}
                            </span>
                        </div>
                        <div class="flex gap-2">
                            <button @click="abrir_edicao_item(item)"
                                class="text-[10px] font-black text-[var(--text-muted)] hover:text-nitec_blue transition-colors">Editar</button>
                            <button @click="excluir_item(item.id)"
                                class="text-[10px] font-black text-[var(--text-muted)] hover:text-red-500 transition-colors">Excluir</button>
                        </div>
                    </div>

                    <!-- Formulário adicionar/editar item -->
                    <div class="px-5 py-4 bg-[var(--bg-page)] border-t border-[var(--border-subtle)]">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">
                            {{ item_em_edicao ? 'Editar Item' : 'Adicionar Item' }}
                        </p>
                        <div class="flex gap-2">
                            <input v-model="input_nome_item" type="text" placeholder="Nome do item"
                                class="flex-1 p-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-xs font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue placeholder:text-[var(--text-muted)]" />
                            <input v-model="input_preco_item" type="number" min="0" step="0.01" placeholder="Preço"
                                class="w-28 p-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-lg text-xs font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue placeholder:text-[var(--text-muted)]" />
                            <button @click="salvar_item(grupo.id)"
                                class="px-4 py-2.5 bg-nitec_blue text-white rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-colors">
                                {{ item_em_edicao ? 'Salvar' : '+ Add' }}
                            </button>
                            <button v-if="item_em_edicao" @click="cancelar_edicao_item"
                                class="px-3 py-2.5 border border-[var(--border-subtle)] rounded-lg text-[10px] font-black text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>

        <!-- Aba: Triagem de Cozinha -->
        <div v-else-if="aba_ativa === 'cozinha_triagem'" class="p-3 sm:p-6 md:p-8 flex flex-col gap-6">
            <header class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                    <button @click="voltar_aba_um_nivel"
                        class="flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div>
                        <h1 class="text-2xl font-black text-[var(--text-primary)]">Triagem de Cozinha</h1>
                        <p class="text-sm text-[var(--text-muted)] mt-1">Ative os produtos que devem passar pelo preparo da cozinha.</p>
                    </div>
                </div>
            </header>

            <section class="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-subtle)] shadow-sm overflow-hidden">
                <div v-if="!lista_produtos.length" class="p-10 text-center text-[var(--text-muted)] font-bold italic text-sm">
                    Nenhum produto cadastrado.
                </div>
                <div v-for="(produto, idx) in lista_produtos" :key="produto.id"
                    class="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)] last:border-b-0 hover:bg-[var(--bg-card-hover)] transition-colors">
                    <div class="flex items-center gap-3 min-w-0">
                        <div class="h-11 w-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] overflow-hidden flex-none">
                            <img v-if="produto.foto_produto_url" :src="produto.foto_produto_url" :alt="produto.nome_produto" class="w-full h-full object-cover" />
                            <div v-else class="w-full h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">IMG</div>
                        </div>
                        <div class="min-w-0">
                            <p class="text-sm font-bold text-[var(--text-primary)] truncate">{{ produto.nome_produto }}</p>
                            <p class="text-[11px] text-[var(--text-muted)] font-bold mt-0.5 truncate">{{ produto.categoria }}</p>
                        </div>
                    </div>
                    <label class="flex items-center gap-2 cursor-pointer select-none">
                        <span class="text-[10px] font-black uppercase tracking-widest"
                            :class="produto.requer_cozinha ? 'text-orange-500' : 'text-[var(--text-muted)]'">
                            {{ produto.requer_cozinha ? 'Cozinha' : 'Direto' }}
                        </span>
                        <div @click="alternar_requer_cozinha(produto.id, !produto.requer_cozinha)"
                            class="relative w-10 h-5 rounded-full transition-colors cursor-pointer"
                            :class="produto.requer_cozinha ? 'bg-orange-500' : 'bg-[var(--border-subtle)]'">
                            <span class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
                                :class="produto.requer_cozinha ? 'translate-x-5' : 'translate-x-0'"></span>
                        </div>
                    </label>
                </div>
            </section>
        </div>

        <!-- Aba principal de estoque -->
        <div v-else class="p-3 sm:p-6 md:p-8 flex flex-col gap-6">

            <!-- Cabeçalho -->
            <header class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3 min-w-0">
                    <button @click="voltar_aba_um_nivel"
                        class="md:hidden flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div class="min-w-0">
                        <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Estoque</h1>
                        <p class="text-sm text-[var(--text-muted)] mt-1 hidden sm:block">Catálogo de itens, lotes e fornecedores do bar.</p>
                    </div>
                </div>
                <div class="flex flex-shrink-0 gap-2">
                    <button @click="abrir_aba_fornecedores"
                        class="px-3 sm:px-5 py-2.5 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                        Fornecedores
                    </button>
                    <button @click="abrir_aba_adicionais"
                        class="px-3 sm:px-5 py-2.5 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                        Adicionais
                    </button>
                    <button @click="abrir_aba_cozinha"
                        class="px-3 sm:px-5 py-2.5 border border-[var(--border-subtle)] bg-[var(--bg-card)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                        Cozinha
                    </button>
                    <button @click="abrir_modal_novo"
                        class="px-3 sm:px-5 py-2.5 bg-nitec_blue text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-colors">
                        + Novo
                    </button>
                </div>
            </header>

            <!-- Barra de pesquisa -->
            <input v-model="termo_pesquisa" type="text"
                placeholder="Buscar por nome, código interno ou EAN..."
                class="w-full md:w-96 p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue placeholder:text-[var(--text-muted)]" />

            <!-- Tabela de produtos -->
            <section class="bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-subtle)] shadow-sm overflow-hidden">
                <div v-if="!produtos_filtrados.length" class="p-10 text-center text-[var(--text-muted)] font-bold italic">
                    Nenhum item encontrado.
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="min-w-full text-left">
                        <thead class="border-b border-[var(--border-subtle)] bg-[var(--bg-page)] sticky top-0 z-10">
                            <tr>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Item</th>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hidden md:table-cell">Categoria</th>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hidden xl:table-cell">Código</th>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hidden lg:table-cell">Validade</th>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] hidden lg:table-cell text-right">Custo Médio</th>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Preço Venda</th>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] text-center">Estoque</th>
                                <th class="px-5 py-3.5 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)] text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-[var(--border-subtle)]">
                            <template v-for="produto in produtos_filtrados" :key="produto.id">
                                <tr class="hover:bg-[var(--bg-card-hover)] transition-colors align-middle">

                                    <!-- Nome + expansão de lotes -->
                                    <td class="px-3 sm:px-5 py-4">
                                        <div class="flex items-center gap-2 sm:gap-3">
                                            <button v-if="produto_tem_detalhamento_fornecedor(produto)"
                                                @click="alternar_expansao_produto(produto.id)"
                                                class="flex-none h-7 w-7 flex items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30 transition-all"
                                                :title="produto_esta_expandido(produto.id) ? 'Ocultar lotes' : 'Ver lotes'">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-3.5 h-3.5 transition-transform" :class="produto_esta_expandido(produto.id) ? 'rotate-180' : ''">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 9l6 6 6-6" />
                                                </svg>
                                            </button>
                                            <div v-else class="flex-none h-7 w-7 rounded-lg border border-dashed border-[var(--border-subtle)]"></div>
                                            <div class="h-11 w-11 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] overflow-hidden flex-none">
                                                <img v-if="produto.foto_produto_url" :src="produto.foto_produto_url" :alt="produto.nome_produto" class="w-full h-full object-cover" />
                                                <div v-else class="w-full h-full flex items-center justify-center text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">IMG</div>
                                            </div>
                                            <div class="min-w-0">
                                                <p class="text-sm font-black text-[var(--text-primary)] truncate">{{ produto.nome_produto }}</p>
                                                <p v-if="produto_tem_detalhamento_fornecedor(produto)"
                                                    class="text-[10px] font-bold text-blue-500 mt-0.5">
                                                    {{ produto.estoque_por_fornecedor.length }} lote{{ produto.estoque_por_fornecedor.length !== 1 ? 's' : '' }}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td class="px-5 py-4 hidden md:table-cell">
                                        <span class="inline-flex px-2 py-1 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                            {{ produto.categoria || 'Geral' }}
                                        </span>
                                    </td>

                                    <td class="px-5 py-4 hidden xl:table-cell text-[11px] font-mono text-[var(--text-muted)]">
                                        {{ produto.codigo_interno || '—' }}
                                    </td>

                                    <td class="px-5 py-4 hidden lg:table-cell">
                                        <span v-if="produto.data_validade"
                                            class="inline-flex px-2 py-1 rounded-lg border border-amber-500/20 bg-amber-500/10 text-[10px] font-bold text-amber-600">
                                            {{ formatar_data_tabela(produto.data_validade) }}
                                        </span>
                                        <span v-else class="text-[11px] text-[var(--text-muted)] font-bold">—</span>
                                    </td>

                                    <td class="px-5 py-4 hidden lg:table-cell text-sm font-black text-right text-red-400">
                                        R$ {{ Number(produto.preco_custo_medio || 0).toFixed(2) }}
                                    </td>

                                    <td class="px-5 py-4 text-sm font-black text-right text-green-500">
                                        R$ {{ Number(produto.preco_venda).toFixed(2) }}
                                    </td>

                                    <td class="px-5 py-4 text-center">
                                        <span class="inline-flex items-center px-3 py-1 rounded-lg border text-xs font-black"
                                            :class="produto.estoque_atual <= 0
                                                ? 'bg-red-500/10 border-red-500/20 text-red-500'
                                                : produto.estoque_atual <= 5
                                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                                                    : 'bg-[var(--bg-page)] border-[var(--border-subtle)] text-[var(--text-primary)]'">
                                            {{ produto.estoque_atual }} {{ produto.unidade_medida || 'un' }}
                                        </span>
                                    </td>

                                    <!-- Ações -->
                                    <td class="px-3 sm:px-5 py-4">
                                        <div class="flex items-center justify-end gap-1">
                                            <button @click="abrir_modal_edicao(produto)"
                                                class="h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[10px] font-black uppercase text-[var(--text-muted)] hover:text-blue-500 hover:border-blue-500/30 transition-colors"
                                                title="Editar produto">
                                                <svg class="sm:hidden w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                                <span class="hidden sm:inline">Editar</span>
                                            </button>
                                            <button @click="abrir_modal_entrada(produto)"
                                                class="h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center rounded-xl border border-blue-500/20 bg-blue-500/10 text-[10px] font-black uppercase text-blue-500 hover:bg-blue-600 hover:text-white transition-colors"
                                                title="Registrar entrada de estoque">
                                                <svg class="sm:hidden w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12l7 7 7-7"/></svg>
                                                <span class="hidden sm:inline">+&nbsp;Entrada</span>
                                            </button>
                                            <button @click="abrir_modal_perda(produto)"
                                                class="h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-[10px] font-black uppercase text-orange-500 hover:bg-orange-500 hover:text-white transition-colors"
                                                title="Registrar baixa de estoque">
                                                <svg class="sm:hidden w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 5v14M5 12l7-7 7 7"/></svg>
                                                <span class="hidden sm:inline">Baixa</span>
                                            </button>
                                            <button @click="excluir_produto(produto)"
                                                :disabled="produto_excluindo_id === produto.id"
                                                class="h-8 w-8 flex items-center justify-center rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[var(--text-muted)] hover:text-red-500 hover:border-red-500/30 disabled:opacity-40 transition-colors"
                                                title="Excluir item">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" class="w-3.5 h-3.5">
                                                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>

                                <!-- Expansão de lotes por fornecedor -->
                                <tr v-if="produto_esta_expandido(produto.id)" class="bg-[var(--bg-page)]">
                                    <td colspan="8" class="px-5 py-4">
                                        <div class="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
                                            <table class="min-w-full text-left">
                                                <thead>
                                                    <tr class="border-b border-[var(--border-subtle)]">
                                                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Fornecedor / Origem</th>
                                                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Saldo</th>
                                                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Custo Médio</th>
                                                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">Validade</th>
                                                        <th class="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-[var(--text-muted)]">1ª Entrada</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="divide-y divide-[var(--border-subtle)]">
                                                    <tr v-for="lote in produto.estoque_por_fornecedor" :key="lote.lote_id"
                                                        class="hover:bg-[var(--bg-page)] transition-colors">
                                                        <td class="px-4 py-3 text-xs font-bold text-[var(--text-primary)]">
                                                            {{ lote.nome_exibicao }}
                                                        </td>
                                                        <td class="px-4 py-3 text-xs font-black text-blue-500">
                                                            {{ lote.quantidade_atual }} un.
                                                        </td>
                                                        <td class="px-4 py-3 text-xs font-bold text-red-400">
                                                            R$ {{ Number(lote.preco_custo_medio || 0).toFixed(2) }}
                                                        </td>
                                                        <td class="px-4 py-3 text-xs font-bold text-[var(--text-muted)]">
                                                            <span v-if="lote.data_validade"
                                                                class="px-2 py-0.5 rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-600">
                                                                {{ formatar_data_tabela(lote.data_validade) }}
                                                            </span>
                                                            <span v-else>—</span>
                                                        </td>
                                                        <td class="px-4 py-3 text-[10px] font-mono text-[var(--text-muted)]">
                                                            {{ lote.primeira_entrada_em ? new Date(lote.primeira_entrada_em).toLocaleDateString('pt-BR') : '—' }}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </section>
        </div>

        <!-- Modais -->
        <ModalPerdaEstoque
            v-if="modal_perda"
            :formulario_perda="formulario_perda"
            :registrando_perda="registrando_perda"
            @fechar="modal_perda = false"
            @confirmar="registrar_perda"
        />

        <ModalEntradaEstoque
            v-if="modal_entrada"
            :formulario_entrada="formulario_entrada"
            :registrando_entrada="registrando_entrada"
            :termo_fornecedor_entrada="termo_fornecedor_entrada"
            :dropdown_fornecedor_entrada_aberto="dropdown_fornecedor_entrada_aberto"
            :fornecedores_filtrados_entrada="fornecedores_filtrados_entrada"
            :fornecedor_entrada_vinculado="fornecedor_entrada_vinculado"
            :entrada_pronta_para_salvar="entrada_pronta_para_salvar"
            :produto_entrada_possui_fornecedores_vinculados="produto_entrada_possui_fornecedores_vinculados"
            @fechar="modal_entrada = false"
            @confirmar="registrar_entrada"
            @atualizar-modo="atualizar_modo_entrada"
            @abrir-dropdown-fornecedor="dropdown_fornecedor_entrada_aberto = true"
            @fechar-dropdown-fornecedor="fechar_dropdown_fornecedor_entrada"
            @selecionar-fornecedor="selecionar_fornecedor_entrada"
            @abrir-novo-fornecedor="abrir_modal_novo_fornecedor('entrada')"
            @update:termo_fornecedor_entrada="termo_fornecedor_entrada = $event"
        />
    </div>
</template>

<script setup>
import SelectPesquisavel from './componentes_analises/SelectPesquisavel.vue';
import FormularioProduto from './componentes_produtos/FormularioProduto.vue';
import ModalEntradaEstoque from './componentes_produtos/ModalEntradaEstoque.vue';
import ModalPerdaEstoque from './componentes_produtos/ModalPerdaEstoque.vue';
import { use_logica_produtos } from './pagina_produtos_logica.js';
import { onMounted, onUnmounted } from 'vue';

// ─── Validação do formulário de fornecedor ────────────────────────────────────

const validar_cnpj_cpf = (valor) => {
    const n = (valor || '').replace(/\D/g, '');
    if (n.length === 11) {
        if (/^(\d)\1+$/.test(n)) return false;
        let s = 0; for (let i = 0; i < 9; i++) s += +n[i] * (10 - i);
        const d1 = s % 11 < 2 ? 0 : 11 - s % 11;
        s = 0; for (let i = 0; i < 10; i++) s += +n[i] * (11 - i);
        const d2 = s % 11 < 2 ? 0 : 11 - s % 11;
        return +n[9] === d1 && +n[10] === d2;
    }
    if (n.length === 14) {
        if (/^(\d)\1+$/.test(n)) return false;
        let s = 0, p = 2;
        for (let i = 11; i >= 0; i--) { s += +n[i] * p; p = p === 9 ? 2 : p + 1; }
        const d1 = s % 11 < 2 ? 0 : 11 - s % 11;
        s = 0; p = 2;
        for (let i = 12; i >= 0; i--) { s += +n[i] * p; p = p === 9 ? 2 : p + 1; }
        const d2 = s % 11 < 2 ? 0 : 11 - s % 11;
        return +n[12] === d1 && +n[13] === d2;
    }
    return false;
};

const validar_telefone_br = (valor) => {
    const n = (valor || '').replace(/\D/g, '');
    return n.length === 10 || n.length === 11;
};

const validar_email_simples = (valor) => !valor || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

const cls_campo = (valor, fn) => {
    if (!valor) return '';
    return fn(valor)
        ? 'border-green-500/40 bg-green-500/5 focus:border-green-500'
        : 'border-red-500/40 bg-red-500/5 focus:border-red-500';
};

const formatar_cnpj_ao_sair = (e, formulario) => {
    const n = e.target.value.replace(/\D/g, '');
    if (n.length === 11) formulario.cnpj = n.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    else if (n.length === 14) formulario.cnpj = n.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

const formatar_tel_ao_sair = (e, formulario) => {
    const n = e.target.value.replace(/\D/g, '').slice(0, 11);
    if (n.length === 11) formulario.telefone = n.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    else if (n.length === 10) formulario.telefone = n.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
};

const {
    aba_ativa,
    lista_produtos,
    produtos_filtrados,
    fornecedores_filtrados,
    termo_pesquisa,
    filtro_fornecedor_id,
    abrir_aba_estoque,
    abrir_aba_fornecedores,
    alternar_formulario_fornecedor_minimizado,
    formulario_fornecedor_minimizado,
    produto_tem_detalhamento_fornecedor,
    produto_esta_expandido,
    alternar_expansao_produto,
    formatar_data_tabela,
    carregando_produto,
    formulario_dados,
    salvar_produto,
    excluir_produto,
    cancelar_formulario_produto,
    salvando,
    produto_excluindo_id,
    modo_edicao,
    abrir_modal_novo,
    abrir_modal_edicao,
    adicionar_alias_codigo_barras,
    remover_alias_codigo_barras,
    adicionar_vinculo_fornecedor,
    remover_vinculo_fornecedor,
    lista_fornecedores,
    opcoes_filtro_fornecedor,
    modal_perda,
    formulario_perda,
    abrir_modal_perda,
    registrar_perda,
    registrando_perda,
    modal_entrada,
    formulario_entrada,
    abrir_modal_entrada,
    registrar_entrada,
    registrando_entrada,
    atualizar_modo_entrada,
    termo_fornecedor_entrada,
    dropdown_fornecedor_entrada_aberto,
    fornecedores_filtrados_entrada,
    selecionar_fornecedor_entrada,
    fornecedor_entrada_vinculado,
    entrada_pronta_para_salvar,
    produto_entrada_possui_fornecedores_vinculados,
    fechar_dropdown_fornecedor_entrada,
    formulario_fornecedor,
    abrir_modal_novo_fornecedor,
    abrir_edicao_fornecedor,
    salvar_fornecedor,
    excluir_fornecedor,
    cancelar_formulario_fornecedor,
    salvando_fornecedor,
    fornecedor_excluindo_id,
    modo_edicao_fornecedor,
    voltar_aba_um_nivel,
    manejar_popstate_produtos,
    lista_grupos_adicionais,
    grupo_em_edicao,
    input_nome_grupo,
    input_maximo_selecoes,
    input_nome_item,
    input_preco_item,
    grupo_expandido,
    item_em_edicao,
    mostrando_form_grupo,
    abrir_aba_adicionais,
    salvar_grupo,
    excluir_grupo,
    abrir_edicao_grupo,
    cancelar_edicao_grupo,
    alternar_grupo_expandido,
    salvar_item,
    excluir_item,
    abrir_edicao_item,
    cancelar_edicao_item,
    abrir_aba_cozinha,
    alternar_requer_cozinha,
} = use_logica_produtos();

onMounted(() => window.addEventListener('popstate', manejar_popstate_produtos));
onUnmounted(() => window.removeEventListener('popstate', manejar_popstate_produtos));
</script>
