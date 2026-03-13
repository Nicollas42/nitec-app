<template>
    <div class="flex flex-col items-center justify-center p-8 bg-white rounded-3xl relative">
        
        <div v-if="quantidade_pendente > 0" class="text-center w-full">
            <div class="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 animate-pulse">
                📲
            </div>
            <h3 class="text-xl font-black text-gray-800 tracking-tight">Sincronização P2P</h3>
            <p class="text-xs text-gray-500 font-bold mt-1 mb-6 bg-gray-50 p-2 rounded-xl border border-gray-100">
                Mostre este código para a câmara do Caixa.
            </p>

            <div class="bg-white p-4 border-2 border-dashed border-gray-200 rounded-3xl inline-block shadow-sm">
                <qrcode-vue v-if="qr_texto" :value="qr_texto" :size="220" level="L" />
            </div>
            
            <div class="mt-6 flex flex-col gap-2">
                <p class="text-sm font-black text-red-600 uppercase tracking-widest">
                    {{ quantidade_pendente }} Ações Pendentes
                </p>
                <button @click="carregar_pendencias" class="mt-2 text-xs text-nitec_blue font-bold uppercase hover:bg-blue-50 py-2 rounded-lg transition-colors">
                    ↻ Recarregar QR Code
                </button>
            </div>
        </div>

        <div v-else class="text-center py-10">
            <div class="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
                ✔️
            </div>
            <h3 class="text-lg font-black text-gray-800">Tudo Sincronizado!</h3>
            <p class="text-xs text-gray-400 mt-2 font-medium">Nenhum pedido offline no momento.</p>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { db } from '../../banco_local/db.js';

const quantidade_pendente = ref(0);
const qr_texto = ref('');

// --- O COMPRESSOR DE DADOS (Minificação Extrema) ---
const comprimir_dados = (pendencias) => {
    const dados_comprimidos = pendencias.map(p => {
        const metodo_curto = p.metodo === 'POST' ? 1 : 0; 
        const url_curta = p.url_destino.replace('/api', ''); 
        return [url_curta, metodo_curto, p.payload_venda];
    });

    const pacote_final = {
        v: 1, 
        t: localStorage.getItem('nitec_tenant_id'), 
        d: dados_comprimidos
    };

    return JSON.stringify(pacote_final);
};

const carregar_pendencias = async () => {
    try {
        const pendencias_brutas = await db.vendas_pendentes.toArray();
        quantidade_pendente.value = pendencias_brutas.length;

        if (pendencias_brutas.length > 0) {
            qr_texto.value = comprimir_dados(pendencias_brutas);
        } else {
            qr_texto.value = '';
        }
    } catch (erro) {
        console.error("Erro ao gerar QR Code Offline:", erro);
    }
};

onMounted(() => {
    carregar_pendencias();
});
</script>