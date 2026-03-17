<template>
    <div class="p-6 bg-[var(--bg-page)] h-full overflow-y-auto font-sans relative transition-colors duration-300">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-[var(--bg-card)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)] transition-colors duration-300">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Gestão de Equipe</h1>
                <p class="text-xs text-[var(--text-muted)] mt-1 font-bold">Gira os acessos de funcionários fixos e temporários (freelancers).</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <button @click="voltar_painel" class="lg:hidden px-5 py-2.5 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all flex-1 shadow-sm">
                    Voltar
                </button>
            
                <div class="flex items-center bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-xl px-4 py-2.5 w-full md:w-64 focus-within:border-nitec_blue transition-colors shadow-sm">
                    <span class="text-[var(--text-muted)] mr-2">🔍</span>
                    <input type="text" v-model="termo_pesquisa" placeholder="Buscar funcionário..." class="bg-transparent text-xs font-bold outline-none text-[var(--text-primary)] w-full placeholder:font-medium placeholder:text-[var(--text-muted)]">
                </div>

                <button @click="mostrar_demitidos = !mostrar_demitidos" 
                    :class="mostrar_demitidos ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-[var(--bg-page)] text-[var(--text-muted)] border-[var(--border-subtle)] hover:text-[var(--text-primary)]'"
                    class="px-4 py-2.5 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest flex-1 md:flex-none text-center shadow-sm">
                    {{ mostrar_demitidos ? '👁️ Ocultar Demitidos' : '🗑️ Ver Demitidos' }}
                </button>

                <button @click="abrir_modal_novo" class="bg-nitec_blue hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-md transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 flex-1 md:flex-none">
                    <span>➕</span> Novo Registo
                </button>
            </div>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-bold animate-pulse">A carregar equipa...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            <div v-for="func in funcionarios_filtrados" :key="func.id" 
                class="rounded-[2rem] p-6 border transition-all flex flex-col relative group"
                :class="{
                    'order-first bg-purple-500/10 border-purple-500/30 shadow-md': func.tipo_usuario === 'dono',
                    'bg-[var(--bg-card)] border-[var(--border-subtle)] shadow-sm hover:bg-[var(--bg-card-hover)]': func.status_conta === 'ativo' && func.tipo_usuario !== 'dono',
                    'bg-red-500/5 border-red-500/20': func.status_conta === 'inativo' && func.tipo_usuario !== 'dono',
                    'bg-[var(--bg-page)] border-[var(--border-subtle)] opacity-70 grayscale hover:grayscale-0': func.status_conta === 'demitido' && func.tipo_usuario !== 'dono'
                }">
                
                <div class="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button v-if="func.status_conta !== 'demitido'" 
                            @click="abrir_modal_edicao(func)" 
                            class="text-[var(--text-muted)] hover:text-blue-500 transition-colors bg-[var(--bg-page)] hover:bg-blue-500/10 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border border-[var(--border-subtle)]" 
                            title="Editar Funcionário">
                        ✏️
                    </button>
                    <button v-if="func.status_conta !== 'demitido' && func.tipo_usuario !== 'dono'" 
                            @click="pedir_confirmacao('demitir', func.id)" 
                            class="text-[var(--text-muted)] hover:text-red-500 transition-colors bg-[var(--bg-page)] hover:bg-red-500/10 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border border-[var(--border-subtle)]" 
                            title="Demitir Funcionário">
                        🗑️
                    </button>
                </div>

                <div class="flex justify-between items-start mb-4 pr-16">
                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                        :class="func.tipo_usuario === 'dono' ? 'bg-purple-500/20 text-purple-500' : (func.tipo_usuario === 'gerente' ? 'bg-indigo-500/20 text-indigo-500' : (func.tipo_usuario === 'caixa' ? 'bg-green-500/20 text-green-500' : 'bg-blue-500/20 text-blue-500'))">
                        {{ func.tipo_usuario }}
                    </span>
                    
                    <span class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                        :class="func.status_conta === 'ativo' ? 'text-green-500' : (func.status_conta === 'inativo' ? 'text-red-500' : 'text-[var(--text-muted)]')">
                        <span v-if="func.status_conta === 'ativo'" class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span v-else class="h-2 w-2 rounded-full bg-current"></span>
                        {{ func.status_conta }}
                    </span>
                </div>

                <div class="flex flex-col items-center text-center mb-4">
                    <div class="h-16 w-16 rounded-full flex items-center justify-center text-xl font-black mb-3 shadow-inner border-2"
                        :class="func.status_conta === 'ativo' ? 'bg-[var(--bg-page)] text-[var(--text-muted)] border-[var(--border-subtle)]' : 'bg-red-500/10 text-red-500 border-red-500/20'">
                        {{ func.name.substring(0, 2).toUpperCase() }}
                    </div>
                    <h3 class="font-black text-[var(--text-primary)] text-lg leading-tight" :class="{'line-through text-[var(--text-muted)]': func.status_conta === 'demitido'}">{{ func.name }}</h3>
                    <p class="text-[10px] text-[var(--text-muted)] font-bold mt-1 bg-[var(--bg-page)] px-2 py-0.5 rounded-md border border-[var(--border-subtle)]">{{ func.email }}</p>
                    
                    <div class="flex items-center gap-1 mt-2 text-[10px] text-[var(--text-muted)] font-bold" v-if="func.telefone">
                        <span>📱</span> {{ func.telefone }}
                    </div>
                </div>

                <div class="mt-auto pt-4 border-t border-[var(--border-subtle)]">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Contrato:</span>
                        <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                            :class="func.tipo_contrato === 'fixo' ? 'bg-[var(--bg-page)] text-[var(--text-primary)] border border-[var(--border-subtle)]' : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'">
                            {{ func.tipo_contrato === 'fixo' ? '🏢 Fixo' : '⏳ Temporário' }}
                        </span>
                    </div>

                    <button v-if="func.status_conta !== 'demitido'" @click="alternar_status(func.id)" 
                        class="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm border"
                        :class="func.status_conta === 'ativo' ? 'bg-[var(--bg-page)] border-red-500/30 text-red-500 hover:bg-red-500/10' : 'bg-[var(--bg-page)] border-green-500/30 text-green-500 hover:bg-green-500/10'">
                        {{ func.status_conta === 'ativo' ? 'Desativar Acesso' : 'Ativar Acesso' }}
                    </button>
                    
                    <button v-else @click="pedir_confirmacao('readmitir', func.id)" 
                        class="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm border border-blue-500/30 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
                        🔄 Readmitir
                    </button>
                </div>
            </div>

            <div v-if="funcionarios_filtrados.length === 0" class="col-span-full py-10 text-center bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-subtle)] shadow-sm text-[var(--text-muted)] italic text-sm">
                Nenhum funcionário encontrado.
            </div>
        </div>

        <div v-if="modal_aberto" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div class="bg-[var(--bg-card)] rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col border border-[var(--border-subtle)]">
                <div class="p-6 bg-[var(--bg-page)] border-b border-[var(--border-subtle)] flex justify-between items-center">
                    <h2 class="text-lg font-black uppercase tracking-tight text-[var(--text-primary)]">
                        {{ modo_edicao ? 'Editar Funcionário' : 'Novo Funcionário' }}
                    </h2>
                    <button @click="fechar_modal" class="text-[var(--text-muted)] hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
                </div>
                
                <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Nome Completo</label>
                        <input type="text" v-model="form.name" class="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl p-3 outline-none focus:border-nitec_blue transition-colors placeholder:text-[var(--text-muted)]" placeholder="Ex: João Silva">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">E-mail de Login</label>
                            <input type="email" v-model="form.email" class="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl p-3 outline-none focus:border-nitec_blue transition-colors placeholder:text-[var(--text-muted)]" placeholder="joao@email.com">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">WhatsApp / Celular</label>
                            <input type="tel" v-model="form.telefone" class="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl p-3 outline-none focus:border-nitec_blue transition-colors placeholder:text-[var(--text-muted)]" placeholder="(00) 90000-0000">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">
                            Senha {{ modo_edicao ? '(Deixe em branco para não alterar)' : '(Mín. 6 caracteres)' }}
                        </label>
                        <input type="password" v-model="form.password" class="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl p-3 outline-none focus:border-nitec_blue transition-colors placeholder:text-[var(--text-muted)]" :placeholder="modo_edicao ? '•••••••• (Inalterada)' : '••••••••'">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Cargo / Permissão</label>
                            <select v-model="form.tipo_usuario" :disabled="form.tipo_usuario === 'dono' && modo_edicao" class="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl p-3 outline-none focus:border-nitec_blue disabled:opacity-50 disabled:cursor-not-allowed">
                                <option value="garcom">Garçom</option>
                                <option value="caixa">Caixa</option>
                                <option value="gerente">Gerente</option>
                                <option value="dono">Dono (Admin)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Vínculo</label>
                            <select v-model="form.tipo_contrato" :disabled="form.tipo_usuario === 'dono' && modo_edicao" class="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-sm font-bold rounded-xl p-3 outline-none focus:border-nitec_blue disabled:opacity-50 disabled:cursor-not-allowed" :class="form.tipo_contrato === 'temporario' ? 'text-orange-500' : ''">
                                <option value="fixo">Fixo</option>
                                <option value="temporario">Temporário</option>
                            </select>
                        </div>
                    </div>

                    <div v-if="form.tipo_contrato === 'temporario'" class="bg-orange-500/10 p-4 rounded-xl border border-orange-500/20 animate-in fade-in slide-in-from-top-2">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1 flex items-center gap-1">
                            <span>⏳</span> {{ modo_edicao ? 'Adicionar Tempo de Acesso' : 'Timer de Autodestruição' }}
                        </label>
                        <p class="text-xs text-orange-400 font-medium mb-3">O acesso deste funcionário será bloqueado automaticamente após:</p>
                        <select v-model="form.horas_validade" class="w-full bg-[var(--bg-card)] border border-orange-500/30 text-sm font-bold rounded-xl p-3 outline-none text-orange-500">
                            <option :value="4">4 Horas (Meio Turno)</option>
                            <option :value="8">8 Horas (Turno Completo)</option>
                            <option :value="12">12 Horas (Turno Duplo)</option>
                            <option :value="24">24 Horas (Diária inteira)</option>
                        </select>
                    </div>
                </div>

                <div class="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-page)] flex justify-end gap-3">
                    <button @click="fechar_modal" class="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border-subtle)] rounded-xl bg-[var(--bg-card)]">Cancelar</button>
                    <button @click="salvar_funcionario" :disabled="salvando" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-md transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50">
                        {{ salvando ? 'A salvar...' : (modo_edicao ? 'Salvar Edição' : 'Registar') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="modal_confirmacao.aberto" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div class="bg-[var(--bg-card)] rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center p-8 border border-[var(--border-subtle)]">
                <div class="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 border-4"
                     :class="modal_confirmacao.acao === 'demitir' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'">
                    <span class="text-4xl">{{ modal_confirmacao.acao === 'demitir' ? '⚠️' : '🔄' }}</span>
                </div>
                
                <h2 class="text-xl font-black uppercase tracking-tight text-[var(--text-primary)] mb-3">{{ modal_confirmacao.titulo }}</h2>
                <p class="text-sm text-[var(--text-muted)] font-medium mb-8 leading-relaxed">{{ modal_confirmacao.mensagem }}</p>
                
                <div class="flex gap-3 w-full">
                    <button @click="fechar_confirmacao" class="flex-1 py-3.5 bg-[var(--bg-page)] text-[var(--text-muted)] border border-[var(--border-subtle)] rounded-xl font-black uppercase tracking-widest text-[10px] hover:text-[var(--text-primary)] transition-colors">
                        Cancelar
                    </button>
                    <button @click="executar_confirmacao" 
                            class="flex-1 py-3.5 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-md transition-all active:scale-95"
                            :class="modal_confirmacao.cor_botao">
                        {{ modal_confirmacao.texto_botao }}
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaEquipe } from './pagina_equipe_logica.js';

const { 
    carregando, funcionarios_filtrados, modal_aberto, salvando, form,
    termo_pesquisa, mostrar_demitidos, modal_confirmacao, modo_edicao,
    abrir_modal_novo, abrir_modal_edicao, fechar_modal, salvar_funcionario, alternar_status, 
    pedir_confirmacao, fechar_confirmacao, executar_confirmacao, voltar_painel
} = useLogicaEquipe();
</script>