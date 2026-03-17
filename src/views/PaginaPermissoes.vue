<template>
    <div class="p-6 bg-[var(--bg-page)] h-full overflow-y-auto font-sans relative transition-colors duration-300">

        <header class="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 bg-[var(--bg-card)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)] transition-colors duration-300">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Gestão de Permissões</h1>
                <p class="text-xs text-[var(--text-muted)] mt-1 font-bold">Defina o que cada cargo pode aceder ou modificar dentro do sistema.</p>
            </div>
            
            <div class="flex items-center gap-2 w-full lg:w-auto mt-4 lg:mt-0">
                <button @click="voltar_painel" class="lg:hidden px-5 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all shadow-sm flex-1 flex items-center justify-center">
                    Voltar
                </button>
                <button @click="salvar_permissoes" class="bg-nitec_blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 flex-1 lg:flex-none">
                    <span>💾</span> Salvar Alterações
                </button>
            </div>
        </header>

        <div v-if="carregando" class="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] mt-20">
            <svg class="animate-spin h-10 w-10 text-nitec_blue mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p class="text-sm font-bold animate-pulse">A carregar matriz de acessos...</p>
        </div>

        <div v-else-if="matriz_permissoes.length > 0" class="overflow-x-auto rounded-[2rem] border border-[var(--border-subtle)] shadow-sm bg-[var(--bg-card)] pb-4 mb-20 transition-colors duration-300">
            <table class="w-full text-left min-w-[600px]">
                <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] font-black uppercase text-[10px] tracking-widest border-b border-[var(--border-subtle)] transition-colors duration-300">
                    <tr>
                        <th class="p-6 w-1/3 rounded-tl-[2rem]">Módulo / Ação</th>
                        <th v-for="perfil in perfis" :key="perfil" class="p-6 text-center">
                            <span class="px-3 py-1.5 rounded-md"
                                  :class="perfil === 'gerente' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : (perfil === 'caixa' ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20')">
                                {{ perfil }}
                            </span>
                        </th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border-subtle)] text-sm font-bold text-[var(--text-primary)] transition-colors duration-300">
                    <tr v-for="modulo in modulos" :key="modulo.chave" class="hover:bg-[var(--bg-card-hover)] transition-colors group">
                        <td class="p-4 px-6 flex items-center gap-3 w-max">
                            <span class="text-xl bg-[var(--bg-page)] p-2 rounded-xl group-hover:bg-[var(--bg-card)] transition-colors border border-[var(--border-subtle)] shadow-sm">{{ modulo.icone }}</span>
                            <span class="tracking-tight whitespace-nowrap">{{ modulo.nome }}</span>
                        </td>
                        
                        <td v-for="perfil in perfis" :key="perfil" class="p-4 text-center">
                            <label class="cursor-pointer relative inline-flex items-center active:scale-95 transition-transform">
                                <input type="checkbox" 
                                       v-model="matriz_permissoes.find(p => p.perfil === perfil)[modulo.chave]" 
                                       class="sr-only peer">
                                <div class="w-11 h-6 bg-gray-300 dark:bg-[var(--border-subtle)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                            </label>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="fixed bottom-0 left-0 right-0 p-4 bg-[var(--bg-page)]/90 backdrop-blur-md border-t border-[var(--border-subtle)] md:relative md:bg-transparent md:border-0 md:p-0 md:mt-6 z-10 transition-colors duration-300">
            <div class="bg-blue-500/5 border border-blue-500/20 p-5 rounded-2xl flex flex-col md:flex-row gap-3 shadow-sm md:items-center">
                <span class="text-2xl animate-bounce">💡</span>
                <p class="text-xs text-[var(--text-primary)] font-medium">
                    <strong class="font-black uppercase tracking-wider text-blue-500 block md:inline mb-1 md:mb-0">Nota de Segurança:</strong> O utilizador <em class="not-italic font-black text-purple-500 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">Admin Master</em> e o <em class="not-italic font-black text-purple-500 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-md">Dono</em> possuem acesso total e irrestrito ao sistema por padrão, não podendo ser limitados por esta matriz.
                </p>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaPermissoes } from './pagina_permissoes_logica.js';
const { carregando, matriz_permissoes, perfis, modulos, salvar_permissoes, voltar_painel } = useLogicaPermissoes();
</script>