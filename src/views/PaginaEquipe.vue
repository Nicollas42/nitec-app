<template>
    <div class="p-6 bg-gray-50 h-full overflow-y-auto font-sans relative">
        
        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div>
                <h1 class="text-2xl font-black text-gray-800 tracking-tight">Gestão de Equipe</h1>
                <p class="text-xs text-gray-500 mt-1 font-bold">Gira os acessos de funcionários fixos e temporários (freelancers).</p>
            </div>
            
            <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div class="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 w-full md:w-64 focus-within:border-blue-400 transition-colors">
                    <span class="text-gray-400 mr-2">🔍</span>
                    <input type="text" v-model="termo_pesquisa" placeholder="Buscar funcionário..." class="bg-transparent text-xs font-bold outline-none text-gray-700 w-full placeholder:font-medium">
                </div>

                <button @click="mostrar_demitidos = !mostrar_demitidos" 
                    :class="mostrar_demitidos ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'"
                    class="px-4 py-2.5 rounded-xl border transition-all font-black text-[10px] uppercase tracking-widest flex-1 md:flex-none text-center shadow-sm">
                    {{ mostrar_demitidos ? '👁️ Ocultar Demitidos' : '🗑️ Ver Demitidos' }}
                </button>

                <button @click="abrir_modal_novo" class="bg-nitec_blue hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-md transition-all font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 active:scale-95 flex-1 md:flex-none">
                    <span>➕</span> Novo Registo
                </button>
            </div>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-gray-400 mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-bold animate-pulse">A carregar equipa...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            <div v-for="func in funcionarios_filtrados" :key="func.id" 
                class="rounded-[2rem] p-6 border transition-all flex flex-col relative group"
                :class="{
                    'order-first bg-purple-50 border-purple-200 shadow-md': func.tipo_usuario === 'dono',
                    'bg-white border-gray-200 shadow-sm hover:shadow-md': func.status_conta === 'ativo' && func.tipo_usuario !== 'dono',
                    'bg-red-50/40 border-red-100': func.status_conta === 'inativo' && func.tipo_usuario !== 'dono',
                    'bg-gray-100 border-gray-300 opacity-70 grayscale hover:grayscale-0': func.status_conta === 'demitido' && func.tipo_usuario !== 'dono'
                }">
                
                <div class="absolute top-5 right-5 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button v-if="func.status_conta !== 'demitido'" 
                            @click="abrir_modal_edicao(func)" 
                            class="text-gray-400 hover:text-blue-500 transition-colors bg-white hover:bg-blue-50 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border border-gray-100" 
                            title="Editar Funcionário">
                        ✏️
                    </button>
                    <button v-if="func.status_conta !== 'demitido' && func.tipo_usuario !== 'dono'" 
                            @click="pedir_confirmacao('demitir', func.id)" 
                            class="text-gray-400 hover:text-red-500 transition-colors bg-white hover:bg-red-50 h-8 w-8 rounded-full flex items-center justify-center shadow-sm border border-gray-100" 
                            title="Demitir Funcionário">
                        🗑️
                    </button>
                </div>

                <div class="flex justify-between items-start mb-4 pr-16">
                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                        :class="func.tipo_usuario === 'dono' ? 'bg-purple-100 text-purple-700' : (func.tipo_usuario === 'gerente' ? 'bg-indigo-100 text-indigo-700' : (func.tipo_usuario === 'caixa' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'))">
                        {{ func.tipo_usuario }}
                    </span>
                    
                    <span class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                        :class="func.status_conta === 'ativo' ? 'text-green-500' : (func.status_conta === 'inativo' ? 'text-red-500' : 'text-gray-500')">
                        <span v-if="func.status_conta === 'ativo'" class="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                        <span v-else class="h-2 w-2 rounded-full bg-current"></span>
                        {{ func.status_conta }}
                    </span>
                </div>

                <div class="flex flex-col items-center text-center mb-4">
                    <div class="h-16 w-16 rounded-full flex items-center justify-center text-xl font-black mb-3 shadow-inner border-2"
                        :class="func.status_conta === 'ativo' ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-red-50 text-red-300 border-red-100'">
                        {{ func.name.substring(0, 2).toUpperCase() }}
                    </div>
                    <h3 class="font-black text-gray-800 text-lg leading-tight" :class="{'line-through text-gray-500': func.status_conta === 'demitido'}">{{ func.name }}</h3>
                    <p class="text-[10px] text-gray-400 font-bold mt-1 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">{{ func.email }}</p>
                    
                    <div class="flex items-center gap-1 mt-2 text-[10px] text-gray-500 font-bold" v-if="func.telefone">
                        <span>📱</span> {{ func.telefone }}
                    </div>
                </div>

                <div class="mt-auto pt-4 border-t" :class="func.status_conta === 'ativo' ? 'border-gray-100' : 'border-gray-200'">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Contrato:</span>
                        <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                            :class="func.tipo_contrato === 'fixo' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'">
                            {{ func.tipo_contrato === 'fixo' ? '🏢 Fixo' : '⏳ Temporário' }}
                        </span>
                    </div>

                    <button v-if="func.status_conta !== 'demitido'" @click="alternar_status(func.id)" 
                        class="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm border"
                        :class="func.status_conta === 'ativo' ? 'bg-white border-red-200 text-red-500 hover:bg-red-50' : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'">
                        {{ func.status_conta === 'ativo' ? 'Desativar Acesso' : 'Ativar Acesso' }}
                    </button>
                    
                    <button v-else @click="pedir_confirmacao('readmitir', func.id)" 
                        class="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm border bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100">
                        🔄 Readmitir
                    </button>
                </div>
            </div>

            <div v-if="funcionarios_filtrados.length === 0" class="col-span-full py-10 text-center bg-white rounded-[2rem] border border-gray-100 shadow-sm text-gray-400 italic text-sm">
                Nenhum funcionário encontrado.
            </div>
        </div>

        <div v-if="modal_aberto" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div class="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h2 class="text-lg font-black uppercase tracking-tight text-gray-800">
                        {{ modo_edicao ? 'Editar Funcionário' : 'Novo Funcionário' }}
                    </h2>
                    <button @click="fechar_modal" class="text-gray-400 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
                </div>
                
                <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nome Completo</label>
                        <input type="text" v-model="form.name" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: João Silva">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">E-mail de Login</label>
                            <input type="email" v-model="form.email" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" placeholder="joao@email.com">
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">WhatsApp / Celular</label>
                            <input type="tel" v-model="form.telefone" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" placeholder="(00) 90000-0000">
                        </div>
                    </div>

                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">
                            Senha {{ modo_edicao ? '(Deixe em branco para não alterar)' : '(Mín. 6 caracteres)' }}
                        </label>
                        <input type="password" v-model="form.password" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" :placeholder="modo_edicao ? '•••••••• (Inalterada)' : '••••••••'">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cargo / Permissão</label>
                            <select v-model="form.tipo_usuario" :disabled="form.tipo_usuario === 'dono' && modo_edicao" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed">
                                <option value="garcom">Garçom</option>
                                <option value="caixa">Caixa</option>
                                <option value="gerente">Gerente</option>
                                <option value="dono">Dono (Admin)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Vínculo</label>
                            <select v-model="form.tipo_contrato" :disabled="form.tipo_usuario === 'dono' && modo_edicao" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed" :class="form.tipo_contrato === 'temporario' ? 'text-orange-600' : ''">
                                <option value="fixo">Fixo</option>
                                <option value="temporario">Temporário</option>
                            </select>
                        </div>
                    </div>

                    <div v-if="form.tipo_contrato === 'temporario'" class="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1 flex items-center gap-1">
                            <span>⏳</span> {{ modo_edicao ? 'Adicionar Tempo de Acesso' : 'Timer de Autodestruição' }}
                        </label>
                        <p class="text-xs text-orange-500 font-medium mb-3">O acesso deste funcionário será bloqueado automaticamente após:</p>
                        <select v-model="form.horas_validade" class="w-full bg-white border border-orange-200 text-sm font-bold rounded-xl p-3 outline-none text-orange-700">
                            <option :value="4">4 Horas (Meio Turno)</option>
                            <option :value="8">8 Horas (Turno Completo)</option>
                            <option :value="12">12 Horas (Turno Duplo)</option>
                            <option :value="24">24 Horas (Diária inteira)</option>
                        </select>
                    </div>
                </div>

                <div class="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button @click="fechar_modal" class="px-5 py-2.5 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-gray-700 transition-colors">Cancelar</button>
                    <button @click="salvar_funcionario" :disabled="salvando" class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2.5 rounded-xl shadow-md transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50">
                        {{ salvando ? 'A salvar...' : (modo_edicao ? 'Salvar Edição' : 'Registar') }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="modal_confirmacao.aberto" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex justify-center items-center p-4 animate-in fade-in duration-200">
            <div class="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col text-center p-8">
                <div class="mx-auto w-20 h-20 rounded-full flex items-center justify-center mb-5 border-4"
                     :class="modal_confirmacao.acao === 'demitir' ? 'bg-red-50 text-red-500 border-red-100' : 'bg-blue-50 text-blue-500 border-blue-100'">
                    <span class="text-4xl">{{ modal_confirmacao.acao === 'demitir' ? '⚠️' : '🔄' }}</span>
                </div>
                
                <h2 class="text-xl font-black uppercase tracking-tight text-gray-800 mb-3">{{ modal_confirmacao.titulo }}</h2>
                <p class="text-sm text-gray-500 font-medium mb-8 leading-relaxed">{{ modal_confirmacao.mensagem }}</p>
                
                <div class="flex gap-3 w-full">
                    <button @click="fechar_confirmacao" class="flex-1 py-3.5 bg-gray-100 text-gray-500 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 hover:text-gray-700 transition-colors">
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
    pedir_confirmacao, fechar_confirmacao, executar_confirmacao
} = useLogicaEquipe();
</script>