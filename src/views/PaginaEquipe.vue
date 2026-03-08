<template>
    <div class="p-6 bg-gray-50 h-full overflow-y-auto font-sans relative">
        
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div>
                <h1 class="text-2xl font-black text-gray-800 tracking-tight">Gestão de Equipa</h1>
                <p class="text-xs text-gray-500 mt-1 font-bold">Gira os acessos de funcionários fixos e temporários (freelancers).</p>
            </div>
            <button @click="abrir_modal" class="bg-nitec_blue hover:bg-blue-700 text-white px-6 py-3 rounded-xl shadow-md transition-all font-black uppercase tracking-widest text-xs flex items-center gap-2 active:scale-95">
                <span>➕</span> Novo Registo
            </button>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-gray-400 mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-bold animate-pulse">A carregar equipa...</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
            <div v-for="func in funcionarios" :key="func.id" 
                class="bg-white rounded-[2rem] p-6 border transition-all flex flex-col relative"
                :class="func.status_conta === 'ativo' ? 'border-gray-200 shadow-sm hover:shadow-md' : 'border-red-100 opacity-75 bg-red-50/30'">
                
                <div class="flex justify-between items-start mb-4">
                    <span class="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                        :class="func.tipo_usuario === 'dono' ? 'bg-purple-100 text-purple-700' : (func.tipo_usuario === 'caixa' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')">
                        {{ func.tipo_usuario }}
                    </span>
                    
                    <span class="text-[9px] font-black uppercase tracking-widest flex items-center gap-1"
                        :class="func.status_conta === 'ativo' ? 'text-green-500' : 'text-red-500'">
                        <span class="h-2 w-2 rounded-full" :class="func.status_conta === 'ativo' ? 'bg-green-500 animate-pulse' : 'bg-red-500'"></span>
                        {{ func.status_conta }}
                    </span>
                </div>

                <div class="flex flex-col items-center text-center mb-6">
                    <div class="h-16 w-16 rounded-full flex items-center justify-center text-xl font-black mb-3 shadow-inner border-2"
                        :class="func.status_conta === 'ativo' ? 'bg-gray-50 text-gray-400 border-gray-100' : 'bg-red-50 text-red-300 border-red-100'">
                        {{ func.name.substring(0, 2).toUpperCase() }}
                    </div>
                    <h3 class="font-black text-gray-800 text-lg leading-tight">{{ func.name }}</h3>
                    <p class="text-xs text-gray-400 font-bold mt-1">{{ func.email }}</p>
                </div>

                <div class="mt-auto pt-4 border-t" :class="func.status_conta === 'ativo' ? 'border-gray-100' : 'border-red-100'">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">Contrato:</span>
                        <span class="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md"
                            :class="func.tipo_contrato === 'fixo' ? 'bg-gray-100 text-gray-600' : 'bg-orange-100 text-orange-600'">
                            {{ func.tipo_contrato === 'fixo' ? '🏢 Fixo' : '⏳ Temporário' }}
                        </span>
                    </div>

                    <button @click="alternar_status(func.id)" 
                        class="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors shadow-sm border"
                        :class="func.status_conta === 'ativo' ? 'bg-white border-red-200 text-red-500 hover:bg-red-50' : 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'">
                        {{ func.status_conta === 'ativo' ? 'Desativar Acesso' : 'Reativar Acesso' }}
                    </button>
                </div>
            </div>
        </div>

        <div v-if="modal_aberto" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
                <div class="p-6 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                    <h2 class="text-lg font-black uppercase tracking-tight text-gray-800">Novo Funcionário</h2>
                    <button @click="fechar_modal" class="text-gray-400 hover:text-red-500 font-bold text-2xl transition-colors">&times;</button>
                </div>
                
                <div class="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Nome Completo</label>
                        <input type="text" v-model="form.name" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" placeholder="Ex: João Silva">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">E-mail de Login</label>
                        <input type="email" v-model="form.email" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" placeholder="joao@restaurante.com">
                    </div>
                    <div>
                        <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Senha (Mín. 6 caracteres)</label>
                        <input type="password" v-model="form.password" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500 transition-colors" placeholder="••••••••">
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Cargo / Permissão</label>
                            <select v-model="form.tipo_usuario" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500">
                                <option value="garcom">Garçom</option>
                                <option value="caixa">Caixa</option>
                                <option value="dono">Dono (Admin)</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Vínculo</label>
                            <select v-model="form.tipo_contrato" class="w-full bg-gray-50 border border-gray-200 text-sm font-bold rounded-xl p-3 outline-none focus:border-blue-500" :class="form.tipo_contrato === 'temporario' ? 'text-orange-600' : ''">
                                <option value="fixo">Fixo</option>
                                <option value="temporario">Temporário</option>
                            </select>
                        </div>
                    </div>

                    <div v-if="form.tipo_contrato === 'temporario'" class="bg-orange-50 p-4 rounded-xl border border-orange-100 animate-in fade-in slide-in-from-top-2">
                        <label class="block text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1 flex items-center gap-1">
                            <span>⏳</span> Timer de Autodestruição
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
                    <button @click="salvar_funcionario" :disabled="salvando" class="bg-green-500 hover:bg-green-600 text-white px-6 py-2.5 rounded-xl shadow-md transition-all font-black uppercase tracking-widest text-xs disabled:opacity-50">
                        {{ salvando ? 'A salvar...' : 'Registar' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useLogicaEquipe } from './pagina_equipe_logica.js';

const { 
    carregando, funcionarios, modal_aberto, salvando, form,
    abrir_modal, fechar_modal, salvar_funcionario, alternar_status
} = useLogicaEquipe();
</script>