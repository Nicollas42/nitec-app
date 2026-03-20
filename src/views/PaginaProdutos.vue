<template>
    <div class="pagina_produtos p-6 md:p-8 bg-[var(--bg-page)] h-full overflow-y-auto font-sans flex flex-col gap-6">
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Gestao de Produtos</h1>
                <p class="text-sm text-[var(--text-muted)] mt-1">Catalogo, aliases de codigo de barras, estoque e fornecedores.</p>
            </div>

            <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button @click="voltar_painel" class="lg:hidden px-5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all flex-1 shadow-sm">
                    Voltar
                </button>

                <input v-model="termo_pesquisa" type="text" placeholder="Nome, codigo interno ou alias..." class="w-full md:w-72 p-3 bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue placeholder:text-[var(--text-muted)]">

                <button @click="abrir_modal_novo" class="px-6 py-3 bg-nitec_blue text-white rounded-xl hover:bg-blue-700 text-xs font-black uppercase tracking-widest shadow-sm transition-all">
                    Novo Produto
                </button>
            </div>
        </header>

        <section class="bg-[var(--bg-card)] rounded-[2rem] shadow-sm border border-[var(--border-subtle)] overflow-hidden">
            <div v-if="!produtos_filtrados || produtos_filtrados.length === 0" class="p-10 text-center text-[var(--text-muted)] font-medium italic">
                Nenhum produto encontrado.
            </div>

            <div v-else class="divide-y divide-[var(--border-subtle)]">
                <article v-for="produto in produtos_filtrados" :key="produto.id" class="p-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between hover:bg-[var(--bg-card-hover)] transition-colors">
                    <div class="space-y-2">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="text-sm font-black text-[var(--text-primary)]">{{ produto.nome_produto }}</h2>
                            <span class="px-2 py-1 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">
                                {{ produto.categoria || 'Geral' }}
                            </span>
                            <span v-if="produto.data_validade" class="px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-[10px] font-black uppercase tracking-widest text-orange-500">
                                {{ new Date(produto.data_validade).toLocaleDateString() }}
                            </span>
                        </div>

                        <div class="text-[11px] font-mono text-[var(--text-muted)] space-y-1">
                            <p>INT: {{ produto.codigo_interno || 'Sem codigo interno' }}</p>
                            <p>Principal: {{ produto.codigo_barras_principal || 'Sem alias principal' }}</p>
                        </div>

                        <div v-if="produto.codigos_barras && produto.codigos_barras.length > 0" class="flex flex-wrap gap-2">
                            <span v-for="codigo_barras in produto.codigos_barras" :key="codigo_barras" class="px-2 py-1 rounded-lg bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-mono text-[var(--text-muted)]">
                                {{ codigo_barras }}
                            </span>
                        </div>
                    </div>

                    <div class="flex flex-col md:items-end gap-3">
                        <div class="text-sm font-black text-[var(--text-primary)]">
                            <p class="text-green-500">Venda: R$ {{ Number(produto.preco_venda).toFixed(2) }}</p>
                            <p class="text-red-400 text-xs uppercase tracking-widest">Custo medio: R$ {{ Number(produto.preco_custo_medio || 0).toFixed(2) }}</p>
                            <p class="text-xs mt-2 px-3 py-1 rounded-lg border" :class="produto.estoque_atual <= 0 ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-[var(--bg-page)] border-[var(--border-subtle)]'">
                                {{ produto.estoque_atual }} un.
                            </p>
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <button @click="abrir_modal_edicao(produto)" class="px-4 py-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:text-blue-500 hover:border-blue-500/30">
                                Editar
                            </button>
                            <button @click="abrir_modal_entrada(produto)" class="px-4 py-2 rounded-xl border border-blue-500/20 bg-blue-500/10 text-[10px] font-black uppercase tracking-widest text-blue-500 hover:bg-blue-600 hover:text-white">
                                Entrada
                            </button>
                            <button @click="abrir_modal_perda(produto)" class="px-4 py-2 rounded-xl border border-red-500/20 bg-red-500/10 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500 hover:text-white">
                                Baixa
                            </button>
                        </div>
                    </div>
                </article>
            </div>
        </section>

        <div v-if="modal_novo_produto" class="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <div class="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-[2rem] bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 space-y-6">
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <h2 class="text-lg font-black text-[var(--text-primary)]">{{ modo_edicao ? 'Editar Produto' : 'Novo Produto' }}</h2>
                        <p class="text-xs font-bold text-[var(--text-muted)]">Codigo interno, aliases e vinculos por fornecedor.</p>
                    </div>
                    <button @click="modal_novo_produto = false" class="h-8 w-8 rounded-full bg-[var(--bg-page)] text-[var(--text-muted)] text-xl leading-none">&times;</button>
                </div>

                <div v-if="carregando_produto" class="p-8 text-center text-[var(--text-muted)] font-bold">Carregando produto...</div>

                <form v-else @submit.prevent="salvar_produto" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input v-model="formulario_dados.nome_produto" type="text" placeholder="Nome do produto" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                        <input v-model="formulario_dados.codigo_interno" type="text" placeholder="Codigo interno" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] font-mono text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <select v-model="formulario_dados.categoria" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                            <option value="Geral">Geral</option>
                            <option value="Bebidas (Nao Alcoolicas)">Bebidas (Nao Alcoolicas)</option>
                            <option value="Bebidas (Alcoolicas)">Bebidas (Alcoolicas)</option>
                            <option value="Pratos Principais">Pratos Principais</option>
                            <option value="Entradas / Petiscos">Entradas / Petiscos</option>
                            <option value="Sobremesas">Sobremesas</option>
                            <option value="Lanches">Lanches</option>
                        </select>
                        <input v-model="formulario_dados.preco_custo_medio" type="number" min="0" step="0.01" placeholder="Custo medio" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                        <input v-model="formulario_dados.preco_venda" type="number" min="0" step="0.01" placeholder="Preco venda" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                        <input v-model="formulario_dados.estoque_atual" type="number" min="0" placeholder="Estoque" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                        <input v-model="formulario_dados.data_validade" type="date" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                    </div>

                    <section class="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-4">
                        <div class="flex items-center justify-between gap-3">
                            <div>
                                <h3 class="text-sm font-black text-[var(--text-primary)]">Aliases de Codigo de Barras</h3>
                                <p class="text-[11px] text-[var(--text-muted)]">Um produto pode ter varios codigos vinculados.</p>
                            </div>
                            <button type="button" @click="adicionar_alias_codigo_barras" class="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">+ Alias</button>
                        </div>

                        <div v-for="(codigo_barras, indice_codigo_barras) in formulario_dados.codigos_barras_adicionais" :key="'alias_'+indice_codigo_barras" class="grid grid-cols-1 md:grid-cols-[1.2fr,1fr,auto] gap-3">
                            <input v-model="codigo_barras.codigo_barras" type="text" placeholder="Codigo de barras" class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                            <input v-model="codigo_barras.descricao_variacao" type="text" placeholder="Descricao da variacao" class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                            <button type="button" @click="remover_alias_codigo_barras(indice_codigo_barras)" class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">Remover</button>
                        </div>
                    </section>

                    <section class="space-y-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-4">
                        <div class="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 class="text-sm font-black text-[var(--text-primary)]">Fornecedores Vinculados</h3>
                                <p class="text-[11px] text-[var(--text-muted)]">Opcional. Use apenas quando o produto for comprado de terceiros.</p>
                            </div>
                            <div class="flex gap-2">
                                <button type="button" @click="abrir_modal_novo_fornecedor('produto')" class="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">+ Novo Fornecedor</button>
                                <button type="button" @click="adicionar_vinculo_fornecedor" class="px-4 py-2 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)]">+ Vinculo</button>
                            </div>
                        </div>

                        <div v-if="formulario_dados.fornecedores_vinculados.length === 0" class="rounded-xl border border-dashed border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-xs font-bold text-[var(--text-muted)]">
                            Este produto nao possui fornecedor vinculado. Isso e valido para itens produzidos internamente ou insumos sem controle de compra por fornecedor.
                        </div>

                        <div v-for="(fornecedor_vinculado, indice_fornecedor) in formulario_dados.fornecedores_vinculados" :key="'fornecedor_'+indice_fornecedor" class="grid grid-cols-1 md:grid-cols-[1.2fr,1fr,0.7fr,0.8fr,auto] gap-3">
                            <select v-model="fornecedor_vinculado.fornecedor_id" class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                                <option :value="null">Selecione um fornecedor</option>
                                <option v-for="fornecedor in lista_fornecedores" :key="'fornecedor_item_'+fornecedor.id" :value="fornecedor.id">
                                    {{ fornecedor.nome_fantasia }}{{ fornecedor.vendedor ? ` | ${fornecedor.vendedor}` : '' }}
                                </option>
                            </select>
                            <input v-model="fornecedor_vinculado.codigo_sku_fornecedor" type="text" placeholder="SKU na NF" class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                            <input v-model="fornecedor_vinculado.fator_conversao" type="number" min="1" placeholder="Fator" class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                            <input v-model="fornecedor_vinculado.ultimo_preco_compra" type="number" min="0" step="0.01" placeholder="Ultimo preco" class="w-full p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-nitec_blue">
                            <button type="button" @click="remover_vinculo_fornecedor(indice_fornecedor)" class="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">Remover</button>
                        </div>
                    </section>

                    <div class="flex gap-3">
                        <button type="button" @click="modal_novo_produto = false" class="flex-1 py-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cancelar</button>
                        <button type="submit" :disabled="salvando" class="flex-1 py-3 rounded-xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50">
                            {{ salvando ? 'Salvando...' : 'Salvar Produto' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <div v-if="modal_perda" class="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <div class="w-full max-w-sm rounded-[2rem] bg-[var(--bg-card)] border border-red-500/20 p-8 space-y-5">
                <h2 class="text-xl font-black text-center text-[var(--text-primary)]">Registrar Baixa</h2>
                <p class="text-center text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-lg p-2">{{ formulario_perda.nome_produto }}</p>
                <input v-model="formulario_perda.quantidade" type="number" min="1" class="w-full p-3 rounded-xl bg-red-500/5 border border-red-500/20 text-center text-lg font-black text-red-500 outline-none">
                <select v-model="formulario_perda.motivo" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none">
                    <option value="Quebra / Dano">Quebra / Dano</option>
                    <option value="Vencimento / Estragou">Vencimento / Estragou</option>
                    <option value="Consumo Interno (Staff)">Consumo Interno (Staff)</option>
                    <option value="Perda por Erro de Cozinha">Erro de Cozinha</option>
                </select>
                <div class="flex gap-3">
                    <button @click="modal_perda = false" class="flex-1 py-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cancelar</button>
                    <button @click="registrar_perda" :disabled="registrando_perda" class="flex-1 py-3 rounded-xl bg-red-500 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50">{{ registrando_perda ? 'Aguarde...' : 'Confirmar Baixa' }}</button>
                </div>
            </div>
        </div>

        <div v-if="modal_entrada" class="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <div class="w-full max-w-2xl rounded-[2rem] bg-[var(--bg-card)] border border-blue-500/20 p-8 space-y-5">
                <div>
                    <h2 class="text-xl font-black text-center text-[var(--text-primary)]">Nova Compra / Entrada</h2>
                    <p class="text-center text-xs font-bold text-[var(--text-muted)] bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-lg p-2 mt-2">{{ formulario_entrada.nome_produto }}</p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <select v-model="formulario_entrada.modo_entrada" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                        <option value="ajuste_manual">Entrada Manual / Producao Interna</option>
                        <option value="compra_fornecedor" :disabled="!produto_entrada_possui_fornecedores_vinculados">Compra por Fornecedor</option>
                    </select>
                    <div v-if="formulario_entrada.modo_entrada !== 'compra_fornecedor'" class="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] p-3 text-xs font-bold text-[var(--text-muted)]">
                        Use este modo para produtos fabricados internamente, receitas, pratos, bebidas preparadas na casa ou itens sem fornecedor cadastrado.
                    </div>
                    <div v-else class="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 text-xs font-bold text-blue-600">
                        A compra por fornecedor usa o fator de conversao e o SKU vinculados ao produto.
                    </div>
                </div>

                <div v-if="formulario_entrada.modo_entrada === 'compra_fornecedor'" class="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-3">
                    <div class="relative">
                        <input v-model="termo_fornecedor_entrada" type="text" placeholder="Pesquisar fornecedor..." class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500" @focus="dropdown_fornecedor_entrada_aberto = true" @blur="setTimeout(fechar_dropdown_fornecedor_entrada, 120)">
                        <div v-if="dropdown_fornecedor_entrada_aberto" class="absolute z-[120] mt-1 w-full max-h-52 overflow-y-auto rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] shadow-2xl">
                            <button v-for="fornecedor in fornecedores_filtrados_entrada" :key="'entrada_'+fornecedor.id" type="button" class="w-full text-left p-3 border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-card-hover)]" @mousedown.prevent="selecionar_fornecedor_entrada(fornecedor)">
                                <div class="text-xs font-bold text-[var(--text-primary)]">{{ fornecedor.nome_fantasia }}</div>
                                <div class="text-[10px] font-mono text-[var(--text-muted)] mt-1">{{ fornecedor.cnpj }}</div>
                                <div v-if="fornecedor.vendedor || fornecedor.contato_vendedor" class="text-[10px] text-[var(--text-muted)] mt-1">
                                    {{ fornecedor.vendedor || 'Sem vendedor' }}{{ fornecedor.contato_vendedor ? ` • ${fornecedor.contato_vendedor}` : '' }}
                                </div>
                            </button>
                            <div v-if="fornecedores_filtrados_entrada.length === 0" class="p-3 text-xs italic text-[var(--text-muted)] text-center">Nenhum fornecedor encontrado.</div>
                        </div>
                    </div>
                    <button type="button" @click="abrir_modal_novo_fornecedor('entrada')" class="px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">+ Novo</button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input v-model="formulario_entrada.quantidade_comprada" type="number" min="1" placeholder="Quantidade comprada" class="w-full p-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-center text-lg font-black text-blue-500 outline-none">
                    <input v-model="formulario_entrada.custo_unitario_compra" type="number" min="0" step="0.01" placeholder="Custo da embalagem" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-center text-lg font-black text-[var(--text-primary)] outline-none">
                </div>

                <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <input :value="formulario_entrada.modo_entrada === 'compra_fornecedor' ? (formulario_entrada.codigo_sku_fornecedor || 'Fornecedor nao vinculado') : 'Entrada manual'" type="text" readonly class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] font-mono text-sm font-bold text-[var(--text-primary)]">
                    <input :value="formulario_entrada.fator_conversao" type="number" readonly class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-center text-sm font-bold text-[var(--text-primary)]">
                    <input :value="formulario_entrada.unidades_entrada" type="number" readonly class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-center text-sm font-bold text-[var(--text-primary)]">
                    <input :value="Number(formulario_entrada.custo_total_entrada || 0).toFixed(2)" type="text" readonly class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-center text-sm font-bold text-[var(--text-primary)]">
                </div>

                <div v-if="formulario_entrada.modo_entrada === 'compra_fornecedor' && formulario_entrada.fornecedor_id && !fornecedor_entrada_vinculado" class="rounded-xl border border-orange-500/20 bg-orange-500/10 p-3 text-xs font-bold text-orange-500">
                    O fornecedor selecionado existe no banco, mas ainda nao esta vinculado a este produto. Cadastre o vinculo na edicao do produto para usar a compra por embalagem.
                </div>

                <div class="flex gap-3">
                    <button @click="modal_entrada = false" class="flex-1 py-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cancelar</button>
                    <button @click="registrar_entrada" :disabled="registrando_entrada || !entrada_pronta_para_salvar" class="flex-1 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50">{{ registrando_entrada ? 'Aguarde...' : 'Lancar Estoque' }}</button>
                </div>
            </div>
        </div>

        <div v-if="modal_novo_fornecedor" class="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm p-4 flex items-center justify-center">
            <div class="w-full max-w-xl rounded-[2rem] bg-[var(--bg-card)] border border-blue-500/20 p-8 space-y-5">
                <div class="flex items-center justify-between gap-4">
                    <div>
                        <h2 class="text-lg font-black text-[var(--text-primary)]">Novo Fornecedor</h2>
                        <p class="text-xs font-bold text-[var(--text-muted)]">Cadastro rapido sem sair da tela atual.</p>
                    </div>
                    <button @click="modal_novo_fornecedor = false" class="h-8 w-8 rounded-full bg-[var(--bg-page)] text-[var(--text-muted)] text-xl leading-none">&times;</button>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input v-model="formulario_fornecedor.nome_fantasia" type="text" placeholder="Nome fantasia" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                    <input v-model="formulario_fornecedor.razao_social" type="text" placeholder="Razao social" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                    <input v-model="formulario_fornecedor.cnpj" type="text" placeholder="CNPJ" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] font-mono text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                    <input v-model="formulario_fornecedor.telefone" type="text" placeholder="Telefone" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                    <input v-model="formulario_fornecedor.email" type="email" placeholder="Email" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                    <input v-model="formulario_fornecedor.vendedor" type="text" placeholder="Nome do vendedor" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                    <input v-model="formulario_fornecedor.contato_vendedor" type="text" placeholder="Contato do vendedor" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                    <select v-model="formulario_fornecedor.status_fornecedor" class="w-full p-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] outline-none focus:border-blue-500">
                        <option value="ativo">Ativo</option>
                        <option value="inativo">Inativo</option>
                    </select>
                </div>

                <div class="flex gap-3">
                    <button @click="modal_novo_fornecedor = false" class="flex-1 py-3 rounded-xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Cancelar</button>
                    <button @click="salvar_fornecedor" :disabled="salvando_fornecedor" class="flex-1 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest disabled:opacity-50">{{ salvando_fornecedor ? 'Salvando...' : 'Salvar Fornecedor' }}</button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { use_logica_produtos } from './pagina_produtos_logica.js';

const {
    produtos_filtrados,
    termo_pesquisa,
    voltar_painel,
    modal_novo_produto,
    carregando_produto,
    formulario_dados,
    salvar_produto,
    salvando,
    modo_edicao,
    abrir_modal_novo,
    abrir_modal_edicao,
    adicionar_alias_codigo_barras,
    remover_alias_codigo_barras,
    adicionar_vinculo_fornecedor,
    remover_vinculo_fornecedor,
    lista_fornecedores,
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
    termo_fornecedor_entrada,
    dropdown_fornecedor_entrada_aberto,
    fornecedores_filtrados_entrada,
    selecionar_fornecedor_entrada,
    fornecedor_entrada_vinculado,
    entrada_pronta_para_salvar,
    produto_entrada_possui_fornecedores_vinculados,
    fechar_dropdown_fornecedor_entrada,
    modal_novo_fornecedor,
    formulario_fornecedor,
    abrir_modal_novo_fornecedor,
    salvar_fornecedor,
    salvando_fornecedor,
} = use_logica_produtos();
</script>
