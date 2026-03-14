<template>
    <div class="flex flex-col items-center justify-center p-8 bg-white rounded-3xl relative">

        <!-- Carregando -->
        <div v-if="carregando" class="flex flex-col items-center gap-3 py-10">
            <svg class="animate-spin h-10 w-10 text-orange-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-500 font-bold text-sm">A preparar dados...</p>
        </div>

        <!-- QR pronto -->
        <div v-else-if="qr_texto" class="text-center w-full">
            <div class="w-16 h-16 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-3">
                📤
            </div>
            <h3 class="text-xl font-black text-gray-800 tracking-tight">Gerar QR Sync</h3>
            <p class="text-xs text-gray-500 font-bold mt-1 mb-5 bg-gray-50 p-2 rounded-xl border border-gray-100">
                Mostre este código para outro dispositivo ler.
            </p>

            <div class="bg-white p-4 border-2 border-dashed border-gray-200 rounded-3xl inline-block shadow-sm">
                <QrcodeVue :value="qr_texto" :size="220" level="M" render-as="svg" />
            </div>
            
            <!-- Resumo do conteúdo do QR -->
            <div class="mt-5 grid grid-cols-2 gap-2 text-center">
                <div class="bg-orange-50 rounded-xl p-3 border border-orange-100">
                    <p class="text-2xl font-black text-orange-600">{{ total_acoes }}</p>
                    <p class="text-[10px] text-orange-400 font-bold uppercase tracking-widest">Ações p/ Servidor</p>
                </div>
                <div class="bg-blue-50 rounded-xl p-3 border border-blue-100">
                    <p class="text-2xl font-black text-blue-600">{{ total_itens }}</p>
                    <p class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Itens Visíveis</p>
                </div>
            </div>

            <button @click="carregar_dados" class="mt-4 text-xs text-nitec_blue font-bold uppercase hover:bg-blue-50 py-2 px-4 rounded-lg transition-colors">
                ↻ Recarregar QR
            </button>
        </div>

        <!-- Sem dados pendentes -->
        <div v-else class="text-center py-10">
            <div class="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">
                ✔️
            </div>
            <h3 class="text-lg font-black text-gray-800">Nada para Sincronizar</h3>
            <p class="text-xs text-gray-400 mt-2 font-medium">Não há dados offline neste dispositivo.</p>
        </div>

    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { db } from '../../banco_local/db.js';

const emit = defineEmits(['fechar']);

const carregando = ref(true);
const qr_texto = ref('');
const total_acoes = ref(0);
const total_itens = ref(0);

// 🔑 Protocolo P2P v2: 1 = POST, 2 = DELETE
const METODO_PARA_ID = { 'POST': 1, 'DELETE': 2 };

const carregar_dados = async () => {
    carregando.value = true;
    qr_texto.value = '';
    try {
        const acoes_brutas = await db.vendas_pendentes.toArray();
        const estados = await db.estado_comandas_local.toArray();

        total_acoes.value = acoes_brutas.length;
        total_itens.value = estados.reduce((acc, e) => acc + (e.itens?.length || 0), 0);

        // Nada a fazer se não há dados
        if (acoes_brutas.length === 0 && estados.length === 0) return;

        // 1. Snapshot legível (para o receptor exibir os itens na tela)
        const snap = estados.map(e => ({
            comanda_id: e.comanda_id,
            mesa_id: e.mesa_id,
            nome_cliente: e.nome_cliente || null,
            itens: e.itens || []
        }));

        // 2. Ações para o servidor (comprimidas)
        const acoes = acoes_brutas.map(a => [
            a.url_destino,
            METODO_PARA_ID[a.metodo?.toUpperCase()] ?? 1,
            a.payload_venda || {}
        ]);

        const pacote = {
            v: 2,                                           // versão do protocolo
            t: localStorage.getItem('nitec_tenant_id'),    // segurança por tenant
            snap,
            acoes
        };

        qr_texto.value = JSON.stringify(pacote);
    } catch (e) {
        console.error("Erro ao gerar QR Sync:", e);
    } finally {
        carregando.value = false;
    }
};

// Fecha automaticamente se a internet voltar — o sync normal assume
const ao_voltar_online = () => emit('fechar');

onMounted(() => {
    carregar_dados();
    window.addEventListener('online', ao_voltar_online);
});

onUnmounted(() => {
    window.removeEventListener('online', ao_voltar_online);
});
</script>