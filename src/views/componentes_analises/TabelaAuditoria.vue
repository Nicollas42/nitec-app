<template>
    <div class="bg-[var(--bg-card)] rounded-[2rem] shadow-sm border border-[var(--border-subtle)] flex flex-col h-[70vh] transition-colors duration-300">
        
        <div class="p-6 border-b border-[var(--border-subtle)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[var(--bg-page)] rounded-t-[2rem] shrink-0 transition-colors duration-300">
            <div>
                <h2 class="text-lg font-black text-[var(--text-primary)] tracking-tight">Rastreio de Operações</h2>
                <p class="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Extrato completo do sistema</p>
            </div>

            <div class="flex gap-2 w-full md:w-auto">
                <select :value="filtro_tipo" @change="$emit('update:filtro_tipo', $event.target.value)" class="bg-[var(--bg-card)] border border-[var(--border-subtle)] text-xs font-black text-[var(--text-primary)] uppercase tracking-widest rounded-xl px-4 py-3 outline-none shadow-sm focus:border-blue-400 transition-colors" style="color-scheme: dark;">
                    <option value="todos">📋 Tudo</option>
                    <option value="venda">💰 Vendas</option>
                    <option value="perda">📉 Baixas/Perdas</option>
                    <option value="entrada">📦 Entradas</option>
                </select>
                
                <div class="flex items-center bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-xl px-4 py-2 w-full md:w-64 focus-within:border-blue-500 shadow-sm transition-colors">
                    <span class="text-[var(--text-muted)] text-xs mr-2">🔍</span>
                    <input :value="filtro_texto" @input="$emit('update:filtro_texto', $event.target.value)" type="text" placeholder="Buscar cliente, comanda, item..." class="bg-transparent text-xs font-bold outline-none text-[var(--text-primary)] w-full placeholder:font-medium placeholder-[var(--text-muted)]">
                </div>
            </div>
        </div>

        <div class="overflow-y-auto flex-1 rounded-b-[2rem] relative custom-scrollbar" @scroll="aoRolar">
            <table class="w-full text-left text-xs">
                <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] sticky top-0 z-10 border-b border-[var(--border-subtle)] shadow-sm whitespace-nowrap transition-colors duration-300">
                    <tr>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-32">Data / Hora</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-28">Operação</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px] w-36">Responsável</th>
                        <th class="py-2.5 px-6 font-black uppercase tracking-widest text-[9px]">Ação Executada / Detalhes</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border-subtle)] bg-[var(--bg-card)] transition-colors duration-300">
                    <tr v-if="!log_exibido || log_exibido.length === 0">
                        <td colspan="4" class="p-10 text-center text-[var(--text-muted)] font-medium italic text-[10px] tracking-widest uppercase">Nenhum evento corresponde a esta pesquisa.</td>
                    </tr>
                    
                    <tr v-for="(evento, idx) in log_exibido" :key="idx" class="hover:bg-[var(--bg-card-hover)] transition-colors group">
                        <td class="py-4 px-6 text-[11px] font-black text-[var(--text-muted)] whitespace-nowrap">{{ formatarDataLog(evento.data_hora) }}</td>
                        
                        <td class="py-4 px-6 whitespace-nowrap">
                            <span class="px-2 py-1.5 rounded-md font-black uppercase tracking-widest text-[9px]"
                                  :class="{
                                    'bg-blue-500/10 text-blue-500 border border-blue-500/20': evento.tipo_evento === 'entrada',
                                    'bg-red-500/10 text-red-500 border border-red-500/20': evento.tipo_evento === 'perda',
                                    'bg-green-500/10 text-green-500 border border-green-500/20': evento.tipo_evento === 'venda'
                                  }">
                                {{ evento.tipo_evento === 'venda' ? '💰 Venda' : (evento.tipo_evento === 'perda' ? '📉 Baixa' : '📦 Entrada') }}
                            </span>
                        </td>
                        
                        <td class="py-4 px-6 font-black text-[var(--text-primary)] truncate max-w-[120px]">{{ evento.usuario }}</td>
                        
                        <td class="py-4 px-6 whitespace-normal min-w-[300px]">
                            <div class="flex items-start justify-between gap-4">
                                <div class="flex flex-col gap-1.5">
                                    <p class="leading-tight">
                                        <span class="font-black text-[var(--text-primary)]">{{ evento.titulo }}</span>
                                        <span class="text-[var(--text-muted)] font-medium ml-2">{{ evento.descricao }}</span>
                                    </p>
                                    <div class="flex items-center gap-2 flex-wrap mt-1">
                                        <span v-if="evento.detalhes_extras" class="inline-block w-fit px-2 py-0.5 rounded bg-[var(--bg-page)] text-[var(--text-muted)] text-[10px] font-bold border border-[var(--border-subtle)]">
                                            {{ evento.detalhes_extras }}
                                        </span>
                                        <span v-if="evento.cliente" class="inline-block w-fit px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[10px] font-bold border border-blue-500/20 uppercase tracking-widest">
                                            👤 Cliente: {{ evento.cliente }}
                                        </span>
                                    </div>
                                </div>

                                <button v-if="evento.tipo_evento === 'venda'" 
                                        @click="$emit('abrir-recibo', evento)" 
                                        class="opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--bg-card)] border border-[var(--border-subtle)] text-nitec_blue hover:bg-[var(--bg-page)] hover:border-blue-500/50 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm shrink-0">
                                    📄 Ver Recibo
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            
            <div v-if="limite_exibicao < log_filtrado.length" class="py-6 text-center text-[10px] font-black uppercase tracking-widest text-blue-500 bg-[var(--bg-page)] animate-pulse border-t border-[var(--border-subtle)]">
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