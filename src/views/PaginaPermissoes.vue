<template>
    <div class="p-6 bg-white h-full overflow-y-auto rounded-2xl shadow-sm border border-gray-100 flex flex-col">
        
        <div class="flex justify-between items-center mb-6 border-b border-gray-100 pb-4 shrink-0">
            <div>
                <h2 class="text-2xl font-black text-gray-800 uppercase tracking-tight italic">🔐 Gestão de Permissões</h2>
                <p class="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Defina o que cada funcionário pode fazer no sistema</p>
            </div>
            
            <div class="flex items-center gap-4">
                <span v-if="status_salvamento" :class="status_salvamento.includes('Erro') ? 'text-red-500' : 'text-green-500'" class="text-xs font-bold uppercase transition-all">
                    {{ status_salvamento }}
                </span>
                <button @click="salvar_permissoes" class="bg-nitec_blue hover:bg-blue-600 text-white font-black uppercase text-xs px-6 py-3 rounded-xl shadow-lg transition-all active:scale-95">
                    💾 Salvar Alterações
                </button>
            </div>
        </div>

        <div v-if="carregando" class="text-center py-10 text-gray-400 font-bold flex-1">Carregando matriz...</div>

        <div v-else-if="matriz_permissoes.length > 0" class="overflow-x-auto rounded-xl border border-gray-200 flex-1">
            <table class="w-full text-left bg-white">
                <thead class="bg-gray-50 text-gray-600 font-black uppercase text-[10px] tracking-widest border-b border-gray-200">
                    <tr>
                        <th class="p-4 w-1/3">Módulo / Ação</th>
                        <th v-for="perfil in perfis" :key="perfil" class="p-4 text-center">{{ perfil }}</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 text-sm font-medium text-gray-700">
                    <tr v-for="modulo in modulos" :key="modulo.chave" class="hover:bg-gray-50 transition-colors">
                        <td class="p-4 flex items-center gap-2">
                            <span class="text-blue-500">🛡️</span> {{ modulo.nome }}
                        </td>
                        
                        <td v-for="perfil in perfis" :key="perfil" class="p-4 text-center">
                            <label class="cursor-pointer relative inline-flex items-center">
                                <input type="checkbox" 
                                       v-model="matriz_permissoes.find(p => p.perfil === perfil)[modulo.chave]" 
                                       class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                            </label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 shrink-0 mb-4">
            <span class="text-xl">💡</span>
            <p class="text-xs text-blue-800">
                <strong>Dica:</strong> O usuário <em>Admin Master</em> e o dono original do bar possuem acesso total e irrestrito ao sistema por padrão.
            </p>
        </div>

    </div>
</template>

<script setup>
import { useLogicaPermissoes } from './pagina_permissoes_logica.js';
const { carregando, matriz_permissoes, perfis, modulos, salvar_permissoes, status_salvamento } = useLogicaPermissoes();
</script>