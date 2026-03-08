<template>
    <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-[70vh]">
        
        <div class="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 rounded-t-[2rem]">
            <div>
                <h2 class="text-lg font-black text-gray-800 tracking-tight">Rastreio de Operações</h2>
                <p class="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Extrato completo do sistema</p>
            </div>

            <div class="flex gap-2 w-full md:w-auto">
                <select :value="filtro_tipo" @change="$emit('update:filtro_tipo', $event.target.value)" class="bg-white border border-gray-200 text-xs font-black text-gray-700 uppercase tracking-widest rounded-xl px-4 py-2 outline-none shadow-sm focus:border-blue-400 transition-colors">
                    <option value="todos">📋 Tudo</option>
                    <option value="venda">💰 Vendas</option>
                    <option value="perda">📉 Baixas/Perdas</option>
                    <option value="entrada">📦 Entradas</option>
                </select>
                
                <div class="flex items-center bg-white border border-gray-200 rounded-xl px-4 py-2 w-full md:w-64 focus-within:border-blue-400 shadow-sm transition-colors">
                    <span class="text-gray-400 text-xs mr-2">🔍</span>
                    <input :value="filtro_texto" @input="$emit('update:filtro_texto', $event.target.value)" type="text" placeholder="Buscar comanda, item, garçom..." class="bg-transparent text-xs font-bold outline-none text-gray-700 w-full placeholder:font-medium">
                </div>
            </div>
        </div>

        <div class="overflow-y-auto flex-1 rounded-b-[2rem]">
            <table class="w-full text-left whitespace-nowrap text-xs">
                <thead class="bg-white text-gray-400 sticky top-0 z-10 border-b border-gray-200 shadow-sm">
                    <tr>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-32">Data / Hora</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-28">Operação</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-36">Responsável</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px]">Ação Executada / Detalhes</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 bg-white">
                    <tr v-if="!log_filtrado || log_filtrado.length === 0">
                        <td colspan="4" class="p-10 text-center text-gray-400 font-medium italic text-sm">Nenhum evento corresponde a esta pesquisa.</td>
                    </tr>
                    
                    <tr v-for="(evento, idx) in log_filtrado" :key="idx" class="hover:bg-blue-50/50 transition-colors group">
                        <td class="py-3 px-6 text-[11px] font-black text-gray-500">{{ formatarDataLog(evento.data_hora) }}</td>
                        
                        <td class="py-3 px-6">
                            <span class="px-2 py-1 rounded-md font-black uppercase tracking-widest text-[9px]"
                                  :class="{
                                    'bg-blue-50 text-blue-600 border border-blue-100': evento.tipo_evento === 'entrada',
                                    'bg-red-50 text-red-600 border border-red-100': evento.tipo_evento === 'perda',
                                    'bg-green-50 text-green-600 border border-green-100': evento.tipo_evento === 'venda'
                                  }">
                                {{ evento.tipo_evento === 'venda' ? '💰 Venda' : (evento.tipo_evento === 'perda' ? '📉 Baixa' : '📦 Entrada') }}
                            </span>
                        </td>
                        
                        <td class="py-3 px-6 font-black text-gray-700 truncate max-w-[120px]">{{ evento.usuario }}</td>
                        
                        <td class="py-3 px-6 truncate max-w-[400px]">
                            <span class="font-black text-gray-800">{{ evento.titulo }}</span>
                            <span class="text-gray-500 font-medium ml-2">{{ evento.descricao }}</span>
                            
                            <span v-if="evento.detalhes_extras" class="ml-2 px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200">
                                {{ evento.detalhes_extras }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
defineProps({
    log_filtrado: Array,
    filtro_tipo: String,
    filtro_texto: String,
    formatarDataLog: Function
});

defineEmits(['update:filtro_tipo', 'update:filtro_texto']);
</script>