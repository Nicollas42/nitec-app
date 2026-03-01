<template>
    <div class="tela_gestao_comandas p-8 bg-gray-100 min-h-screen font-sans flex flex-col">
        
        <header class="cabecalho_pagina flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div>
                <h1 class="titulo_pagina text-2xl font-black text-gray-800 uppercase tracking-tight">Gestão de Comandas</h1>
                <p class="subtitulo_pagina text-sm text-gray-500">Histórico e controle de contas do estabelecimento</p>
            </div>
            
            <div class="filtros_status flex gap-2 bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button @click="alterar_filtro('todas')" :class="['px-4 py-2 rounded-lg font-bold text-sm transition-all', filtro_status === 'todas' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:text-gray-800']">Todas</button>
                <button @click="alterar_filtro('aberta')" :class="['px-4 py-2 rounded-lg font-bold text-sm transition-all', filtro_status === 'aberta' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500 hover:text-blue-600']">Abertas</button>
                <button @click="alterar_filtro('fechada')" :class="['px-4 py-2 rounded-lg font-bold text-sm transition-all', filtro_status === 'fechada' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500 hover:text-green-600']">Fechadas</button>
            </div>

            <button @click="voltar_painel" class="botao_voltar bg-gray-800 hover:bg-black text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md">
                ⬅ Voltar
            </button>
        </header>

        <main class="area_principal bg-white p-8 rounded-3xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
            <div class="tabela_container overflow-y-auto pr-2">
                <table class="tabela_comandas w-full text-left border-collapse">
                    <thead class="sticky top-0 bg-white z-10 border-b-2 border-gray-100">
                        <tr class="cabecalho_tabela text-gray-400 text-xs uppercase tracking-widest">
                            <th class="p-4 font-black">ID</th>
                            <th class="p-4 font-black">Mesa/Origem</th>
                            <th class="p-4 font-black">Cliente</th>
                            <th class="p-4 font-black">Status</th>
                            <th class="p-4 font-black text-right">Total (R$)</th>
                            <th class="p-4 font-black text-center">Ação</th>
                        </tr>
                    </thead>
                    <tbody class="corpo_tabela divide-y divide-gray-50">
                        <tr v-if="comandas_filtradas.length === 0">
                            <td colspan="6" class="p-8 text-center text-gray-400 font-medium italic">Nenhuma comanda encontrada neste status.</td>
                        </tr>
                        <tr v-for="comanda in comandas_filtradas" :key="comanda.id" class="linha_comanda hover:bg-gray-50 transition-colors group">
                            <td class="p-4 font-black text-gray-800">#{{ comanda.id }}</td>
                            <td class="p-4 font-bold text-gray-600">
                                {{ comanda.buscar_mesa ? comanda.buscar_mesa.nome_mesa : 'Venda de Balcão' }}
                            </td>
                            <td class="p-4 text-gray-600 font-medium">
                                {{ comanda.buscar_cliente ? comanda.buscar_cliente.nome_cliente : 'Conta Geral' }}
                            </td>
                            <td class="p-4">
                                <span :class="['status_badge px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest', comanda.status_comanda === 'aberta' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700']">
                                    {{ comanda.status_comanda }}
                                </span>
                            </td>
                            <td class="p-4 text-right font-black text-gray-800">
                                R$ {{ comanda.valor_total }}
                            </td>
                            <td class="p-4 text-center">
                                <button @click="abrir_detalhes(comanda)" class="botao_acao bg-gray-100 hover:bg-blue-600 text-gray-600 hover:text-white px-4 py-2 rounded-lg font-bold text-sm transition-all active:scale-95">
                                    Acessar ➔
                                </button>
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