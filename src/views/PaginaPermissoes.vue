<template>
    <div class="p-6 bg-gray-50 h-full overflow-y-auto font-sans relative">

        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <div>
                <h1 class="text-2xl font-black text-gray-800 tracking-tight">Gestão de Permissões</h1>
                <p class="text-xs text-gray-500 mt-1 font-bold">Defina o que cada cargo pode aceder ou modificar dentro do sistema.</p>
            </div>
            
            <div class="flex items-center gap-4">
                <button @click="salvar_permissoes" class="bg-nitec_blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2">
                    <span>💾</span> Salvar Alterações
                </button>
            </div>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-gray-400 mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-bold animate-pulse">A carregar matriz de acessos...</p>
        </div>

        <div v-else-if="matriz_permissoes.length > 0" class="overflow-x-auto rounded-[2rem] border border-gray-100 shadow-sm bg-white pb-4 mb-20">
            <table class="w-full text-left">
                <thead class="bg-gray-50 text-gray-600 font-black uppercase text-[10px] tracking-widest border-b border-gray-100">
                    <tr>
                        <th class="p-6 w-1/3 rounded-tl-[2rem]">Módulo / Ação</th>
                        <th v-for="perfil in perfis" :key="perfil" class="p-6 text-center">
                            <span class="px-3 py-1.5 rounded-md"
                                  :class="perfil === 'gerente' ? 'bg-indigo-100 text-indigo-700' : (perfil === 'caixa' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700')">
                                {{ perfil }}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 text-sm font-bold text-gray-700">
                    <tr v-for="modulo in modulos" :key="modulo.chave" class="hover:bg-gray-50/50 transition-colors group">
                        <td class="p-4 px-6 flex items-center gap-3">
                            <span class="text-xl bg-gray-50 p-2 rounded-xl group-hover:bg-white transition-colors border border-gray-100 shadow-sm">{{ modulo.icone }}</span>
                            <span class="tracking-tight">{{ modulo.nome }}</span>
                        </td>
                        
                        <td v-for="perfil in perfis" :key="perfil" class="p-4 text-center">
                            <label class="cursor-pointer relative inline-flex items-center active:scale-95 transition-transform">
                                <input type="checkbox" 
                                       v-model="matriz_permissoes.find(p => p.perfil === perfil)[modulo.chave]" 
                                       class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                            </label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200 md:relative md:bg-transparent md:border-0 md:p-0 md:mt-6 z-10">
            <div class="bg-blue-50 border border-blue-100 p-5 rounded-2xl flex gap-3 shadow-sm items-center">
                <span class="text-2xl animate-bounce">💡</span>
                <p class="text-xs text-blue-800 font-medium">
                    <strong class="font-black uppercase tracking-wider">Nota de Segurança:</strong> O utilizador <em class="not-italic font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">Admin Master</em> e o <em class="not-italic font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">Dono</em> possuem acesso total e irrestrito ao sistema por padrão, não podendo ser limitados por esta matriz.
                </p>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaPermissoes } from './pagina_permissoes_logica.js';
const { carregando, matriz_permissoes, perfis, modulos, salvar_permissoes } = useLogicaPermissoes();
</script>