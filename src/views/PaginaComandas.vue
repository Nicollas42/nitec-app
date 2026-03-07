<template>
    <div class="tela_gestao_comandas p-6 md:p-8 bg-gray-50 h-full font-sans flex flex-col relative overflow-y-auto">
        
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 shrink-0">
            <div>
                <h1 class="text-2xl font-black text-gray-800 tracking-tight">Gestão de Comandas</h1>
                <p class="text-sm text-gray-500 mt-1">Acompanhamento e histórico de contas ativas e fechadas.</p>
            </div>
            <button @click="voltar_painel" class="md:hidden w-full px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-bold transition-all">
                Voltar
            </button>
        </header>

        <main class="flex-1 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            
            <div class="flex border-b border-gray-200 bg-gray-50/50 overflow-x-auto shrink-0 hide-scrollbar">
                <button @click="alterar_filtro('todas')" :class="filtro_status === 'todas' ? 'border-b-2 border-gray-800 text-gray-800 bg-white' : 'text-gray-500 hover:text-gray-700'" class="px-6 py-4 text-sm font-bold transition-all whitespace-nowrap">
                    Todas
                </button>
                <button @click="alterar_filtro('aberta')" :class="filtro_status === 'aberta' ? 'border-b-2 border-blue-500 text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'" class="px-6 py-4 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap">
                    <span class="w-2 h-2 rounded-full" :class="filtro_status === 'aberta' ? 'bg-blue-500' : 'bg-gray-300'"></span>Abertas
                </button>
                <button @click="alterar_filtro('fechada')" :class="filtro_status === 'fechada' ? 'border-b-2 border-green-500 text-green-600 bg-white' : 'text-gray-500 hover:text-gray-700'" class="px-6 py-4 text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap">
                    <span class="w-2 h-2 rounded-full" :class="filtro_status === 'fechada' ? 'bg-green-500' : 'bg-gray-300'"></span>Fechadas
                </button>
            </div>

            <div class="overflow-x-auto flex-1">
                <table class="w-full text-left whitespace-nowrap text-sm">
                    <thead class="bg-gray-50 text-gray-500 sticky top-0 z-10 border-b border-gray-100">
                        <tr>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Identificação</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Cliente / Conta</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-center">Status</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-right">Total</th>
                            <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        <tr v-if="comandas_filtradas.length === 0">
                            <td colspan="5" class="p-10 text-center text-gray-400 font-medium italic">Nenhuma comanda encontrada nesta categoria.</td>
                        </tr>
                        <tr v-for="comanda in comandas_filtradas" :key="comanda.id" class="hover:bg-gray-50 transition-colors group cursor-pointer" @click="abrir_detalhes(comanda)">
                            <td class="py-4 px-6">
                                <p class="font-black text-gray-800">#{{ comanda.id }}</p>
                                <p class="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-0.5">{{ comanda.buscar_mesa ? comanda.buscar_mesa.nome_mesa : 'Balcão Livre' }}</p>
                            </td>
                            <td class="py-4 px-6 font-bold text-gray-600">
                                {{ comanda.buscar_cliente ? comanda.buscar_cliente.nome_cliente : 'Conta Geral' }}
                            </td>
                            <td class="py-4 px-6 text-center">
                                <span :class="comanda.status_comanda === 'aberta' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-green-50 text-green-600 border-green-100'" class="px-3 py-1 rounded-md text-[10px] uppercase font-black tracking-widest border">
                                    {{ comanda.status_comanda }}
                                </span>
                            </td>
                            <td class="py-4 px-6 text-right font-black text-gray-800">
                                R$ {{ comanda.valor_total }}
                            </td>
                            <td class="py-4 px-6 text-right">
                                <button class="text-nitec_blue text-xs font-bold hover:underline opacity-50 group-hover:opacity-100 transition-opacity">Abrir &rarr;</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    </div>
</template>

<script setup>
import { useLogicaComandas } from './pagina_comandas_logica.js';
const { filtro_status, comandas_filtradas, alterar_filtro, abrir_detalhes, voltar_painel } = useLogicaComandas();
</script>
<style scoped>
.hide-scrollbar::-webkit-scrollbar { display: none; }
.hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>