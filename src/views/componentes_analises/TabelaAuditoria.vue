<template>
    <div class="bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-[70vh]">
        
        <div class="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 rounded-t-[2rem] shrink-0">
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
                    <input :value="filtro_texto" @input="$emit('update:filtro_texto', $event.target.value)" type="text" placeholder="Buscar cliente, comanda, item..." class="bg-transparent text-xs font-bold outline-none text-gray-700 w-full placeholder:font-medium">
                </div>
            </div>
        </div>

        <div class="overflow-y-auto flex-1 rounded-b-[2rem] relative custom-scrollbar" @scroll="aoRolar">
            <table class="w-full text-left text-xs">
                <thead class="bg-white text-gray-400 sticky top-0 z-10 border-b border-gray-200 shadow-sm whitespace-nowrap">
                    <tr>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-32">Data / Hora</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-28">Operação</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-36">Responsável</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px]">Ação Executada / Detalhes</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50 bg-white">
                    <tr v-if="!log_exibido || log_exibido.length === 0">
                        <td colspan="4" class="p-10 text-center text-gray-400 font-medium italic text-sm">Nenhum evento corresponde a esta pesquisa.</td>
                    </tr>
                    
                    <tr v-for="(evento, idx) in log_exibido" :key="idx" class="hover:bg-blue-50/40 transition-colors group">
                        <td class="py-4 px-6 text-[11px] font-black text-gray-500 whitespace-nowrap">{{ formatarDataLog(evento.data_hora) }}</td>
                        
                        <td class="py-4 px-6 whitespace-nowrap">
                            <span class="px-2 py-1.5 rounded-md font-black uppercase tracking-widest text-[9px]"
                                  :class="{
                                    'bg-blue-50 text-blue-600 border border-blue-100': evento.tipo_evento === 'entrada',
                                    'bg-red-50 text-red-600 border border-red-100': evento.tipo_evento === 'perda',
                                    'bg-green-50 text-green-600 border border-green-100': evento.tipo_evento === 'venda'
                                  }">
                                {{ evento.tipo_evento === 'venda' ? '💰 Venda' : (evento.tipo_evento === 'perda' ? '📉 Baixa' : '📦 Entrada') }}
                            </span>
                        </td>
                        
                        <td class="py-4 px-6 font-black text-gray-700 truncate max-w-[120px]">{{ evento.usuario }}</td>
                        
                        <td class="py-4 px-6 whitespace-normal min-w-[300px]">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <p class="leading-tight">
                                        <span class="font-black text-gray-800">{{ evento.titulo }}</span>
                                        <span class="text-gray-500 font-medium ml-2">{{ evento.descricao }}</span>
                                    </p>
                                    <div class="flex items-center gap-2 flex-wrap mt-1">
                                        <span v-if="evento.detalhes_extras" class="inline-block w-fit px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-bold border border-gray-200">
                                            {{ evento.detalhes_extras }}
                                        </span>
                                        <span v-if="evento.cliente" class="inline-block w-fit px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold border border-blue-100 uppercase tracking-widest">
                                            👤 Cliente: {{ evento.cliente }}
                                        </span>
                                    </div>
                                </div>

                                <button v-if="evento.tipo_evento === 'venda'" 
                                        @click="$emit('abrir-recibo', evento)" 
                                        class="opacity-0 group-hover:opacity-100 transition-opacity bg-white border border-gray-200 text-nitec_blue hover:bg-blue-50 hover:border-blue-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm shrink-0">
                                    📄 Ver Recibo
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div v-if="limite_exibicao < log_filtrado.length" class="py-6 text-center text-[10px] font-black uppercase tracking-widest text-blue-500 bg-gray-50 animate-pulse border-t border-gray-100">
                A carregar histórico...
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({ log_filtrado: Array, filtro_tipo: String, filtro_texto: String, formatarDataLog: Function });
defineEmits(['update:filtro_tipo', 'update:filtro_texto', 'abrir-recibo']);

const limite_exibicao = ref(100);

const log_exibido = computed(() => {
    if (!props.log_filtrado) return [];
    return props.log_filtrado.slice(0, limite_exibicao.value);
});

watch(() => [props.filtro_texto, props.filtro_tipo, props.log_filtrado], () => {
    limite_exibicao.value = 100;
});

const aoRolar = (e) => {
    const { scrollTop, clientHeight, scrollHeight } = e.target;
    if (scrollTop + clientHeight >= scrollHeight - 50) {
        if (limite_exibicao.value < props.log_filtrado.length) {
            limite_exibicao.value += 100;
        }
    }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 6px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
.custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
</style>