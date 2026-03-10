<template>
    <div class="bg-white rounded-3xl shadow-sm border border-gray-100 flex flex-col relative transition-all mb-10">
        
        <div class="p-6 bg-gray-50 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 rounded-t-3xl">
            <div class="flex items-center gap-2">
                <h2 class="text-sm font-black text-gray-800 uppercase">Desempenho da Equipa</h2>
                <div class="relative group">
                    <span class="cursor-pointer text-gray-400 hover:text-blue-500 bg-white border border-gray-200 rounded-full h-5 w-5 flex items-center justify-center font-bold text-[10px] shadow-sm">ℹ️</span>
                    <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-64 bg-gray-800 text-white text-xs p-4 rounded-2xl shadow-xl z-[150] font-normal">
                        <p>Mede a produtividade de cada funcionário. Compare quem atende mais mesas, gera mais receita e vende mais itens.</p>
                        <div class="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                    </div>
                </div>
            </div>

            <div class="flex gap-2 w-full md:w-auto">
                <select v-model="filtro_status" class="bg-white border border-gray-200 text-[10px] font-black text-gray-600 uppercase tracking-widest rounded-xl px-4 py-2.5 outline-none shadow-sm focus:border-blue-400 transition-colors">
                    <option value="ativos">Apenas Equipa Ativa</option>
                    <option value="todos">Exibir Todos (Inc. Inativos/Demitidos)</option>
                </select>
            </div>
        </div>

        <div class="overflow-x-auto rounded-b-3xl">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-white text-gray-400 border-b border-gray-100">
                    <tr>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider">Membro da Equipa</th>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center">Atendimentos</th>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center">Ticket Médio</th>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-center">Volume Físico</th>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-left">Produto Campeão</th>
                        <th class="py-4 px-6 font-bold uppercase text-[9px] tracking-wider text-right text-green-600">Performance Real</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-50">
                    <tr v-for="(garcom, index) in equipe_filtrada" :key="garcom.name" class="hover:bg-blue-50 transition-colors group">
                        
                        <td class="py-4 px-6">
                            <div class="flex items-center gap-3">
                                <span class="w-6 h-6 rounded bg-gray-100 text-[10px] font-bold text-gray-400 flex items-center justify-center shadow-inner">{{ index + 1 }}º</span>
                                <div class="flex flex-col">
                                    <div class="flex items-center gap-2">
                                        <span class="font-black text-gray-800">{{ garcom.name }}</span>
                                        <span v-if="garcom.status_conta !== 'ativo'" class="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-100">
                                            {{ garcom.status_conta }}
                                        </span>
                                    </div>
                                    <span class="text-[9px] font-bold uppercase tracking-widest mt-0.5 flex items-center gap-1">
                                        <span :class="garcom.tipo_contrato === 'temporario' ? 'text-orange-500' : 'text-blue-500'">
                                            {{ garcom.tipo_contrato === 'temporario' ? '⏳ Temporário' : '📄 Fixo' }}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </td>
                        
                        <td class="py-4 px-6 text-center">
                            <div class="flex flex-col">
                                <span class="font-bold text-gray-700">{{ garcom.total_mesas }} mesas</span>
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">~{{ garcom.tempo_medio_minutos }} min/mesa</span>
                            </div>
                        </td>

                        <td class="py-4 px-6 text-center font-bold text-gray-600">
                            R$ {{ garcom.total_mesas > 0 ? (Number(garcom.total_vendas) / Number(garcom.total_mesas)).toFixed(2) : '0.00' }}
                        </td>
                        
                        <td class="py-4 px-6 text-center">
                            <div class="flex flex-col">
                                <span class="font-bold text-gray-700">{{ garcom.itens_servidos }} Itens</span>
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Servidos</span>
                            </div>
                        </td>

                        <td class="py-4 px-6">
                            <div class="flex flex-col">
                                <span class="font-bold text-orange-600 truncate max-w-[150px]" :title="garcom.produto_campeao">{{ garcom.produto_campeao }}</span>
                                <span class="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{{ garcom.qtd_campeao }}x vendidos</span>
                            </div>
                        </td>
                        
                        <td class="py-4 px-6 text-right">
                            <div class="flex flex-col items-end">
                                <span class="font-black text-green-600 text-base">R$ {{ Number(garcom.total_vendas).toFixed(2) }}</span>
                                <span class="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Lucro: R$ {{ Number(garcom.lucro_gerado).toFixed(2) }}</span>
                            </div>
                        </td>
                    </tr>
                    
                    <tr v-if="!equipe_filtrada || equipe_filtrada.length === 0">
                        <td colspan="6" class="p-10 text-center text-xs text-gray-400 font-medium italic">Nenhum membro da equipa atende a estes critérios de pesquisa.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({ equipe: { type: Array, default: () => [] } });

const filtro_status = ref('ativos');

const equipe_filtrada = computed(() => {
    if (!props.equipe) return [];
    return props.equipe.filter(membro => {
        if (filtro_status.value === 'ativos') {
            return membro.status_conta === 'ativo';
        }
        return true; // Se for 'todos', mostra tudo
    });
});
</script>