<template>
    <div class="flex flex-col items-center justify-center p-6 bg-white rounded-3xl relative">

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
            <div class="w-14 h-14 bg-orange-50 text-orange-500 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
                📤
            </div>
            <h3 class="text-lg font-black text-gray-800 tracking-tight">Gerar QR Sync</h3>
            <p class="text-xs text-gray-500 font-bold mt-1 mb-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
                Mostre este código para outro dispositivo ler.
            </p>

            <!-- QR com tamanho maior para facilitar leitura -->
            <div class="bg-white p-3 border-2 border-dashed border-gray-200 rounded-2xl inline-block shadow-sm">
                <QrcodeVue :value="qr_texto" :size="260" level="L" render-as="svg" />
            </div>

            <!-- Lista de itens que estão sendo enviados -->
            <div v-if="lista_itens.length > 0" class="mt-4 w-full text-left">
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Itens no QR Code:</p>
                <div class="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <div v-for="(item, i) in lista_itens" :key="i"
                         class="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 last:border-0">
                        <div class="flex items-center gap-2">
                            <span class="text-[10px] font-black text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded-md">{{ item.q }}x</span>
                            <span class="text-xs font-bold text-gray-700">{{ item.n }}</span>
                        </div>
                        <span class="text-xs font-black text-green-600">R$ {{ (item.p * item.q).toFixed(2) }}</span>
                    </div>
                </div>
            </div>

            <!-- Resumo compacto -->
            <div class="mt-3 flex gap-2">
                <div class="flex-1 bg-orange-50 rounded-xl p-2.5 border border-orange-100 text-center">
                    <p class="text-xl font-black text-orange-600">{{ total_acoes }}</p>
                    <p class="text-[9px] text-orange-400 font-bold uppercase tracking-widest">Ações</p>
                </div>
                <div class="flex-1 bg-blue-50 rounded-xl p-2.5 border border-blue-100 text-center">
                    <p class="text-xl font-black text-blue-600">{{ lista_itens.length }}</p>
                    <p class="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Itens</p>
                </div>
                <div class="flex-1 bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-center">
                    <p class="text-xl font-black text-gray-600">{{ tamanho_qr }}</p>
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Chars</p>
                </div>
            </div>

            <button @click="carregar_dados" class="mt-3 text-xs text-nitec_blue font-bold uppercase hover:bg-blue-50 py-2 px-4 rounded-lg transition-colors">
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
const lista_itens = ref([]);  // Lista legível para exibir no modal
const tamanho_qr = ref(0);    // Tamanho em caracteres do payload — útil para debug

// 🔑 Protocolo P2P v3: chaves minificadas para reduzir o QR ao máximo
// Mapeamento de método: 1=POST, 2=DELETE (idêntico ao LeitorQrOffline)
const METODO_ID = { 'POST': 1, 'DELETE': 2 };

/**
 * Minifica um item de comanda para o menor formato possível no QR:
 * { produto_id, nome_produto, quantidade, preco_unitario, uuid_operacao }
 * vira → [produto_id, nome_curto, qtd, preco, uuid_curto]
 * 
 * uuid é cortado para 8 chars — suficiente para deduplicação P2P local
 */
const minificar_item = (item) => ({
    i: item.produto_id,                              // i = produto_id
    n: item.nome_produto || `#${item.produto_id}`,   // n = nome
    q: item.quantidade,                              // q = quantidade
    p: Number(item.preco_unitario ?? item.preco_venda ?? 0),  // p = preço unitário
    u: (item.uuid_operacao || '').slice(0, 8)        // u = uuid (primeiros 8 chars)
});

/**
 * Minifica uma ação da fila vendas_pendentes:
 * { url_destino, metodo, payload_venda: { itens: [...], uuid_operacao } }
 * vira → [url_comprimida, metodo_id, itens_minificados, uuid_curto]
 * 
 * A URL é comprimida removendo prefixos repetitivos comuns.
 */
const minificar_acao = (acao) => {
    const metodo_id = METODO_ID[acao.metodo?.toUpperCase()] ?? 1;
    const payload = acao.payload_venda || {};

    // Comprime a URL removendo padrões comuns
    const url = acao.url_destino
        .replace('/adicionar-itens-comanda/', 'aic/')
        .replace('/alterar-quantidade-item/', 'aqi/')
        .replace('/remover-item-comanda/', 'ric/')
        .replace('/fechar-comanda/', 'fc/')
        .replace('/abrir-comanda', 'ac')
        .replace('/venda-balcao', 'vb');

    // Minifica os itens dentro do payload (se existirem)
    const itens_min = (payload.itens || []).map(minificar_item);
    const uuid_curto = (payload.uuid_operacao || '').slice(0, 8);

    return [url, metodo_id, itens_min, uuid_curto];
};

const carregar_dados = async () => {
    carregando.value = true;
    qr_texto.value = '';
    lista_itens.value = [];
    try {
        const acoes_brutas = await db.vendas_pendentes.toArray();
        const estados = await db.estado_comandas_local.toArray();

        total_acoes.value = acoes_brutas.length;

        if (acoes_brutas.length === 0 && estados.length === 0) return;

        // Monta lista legível de itens para exibir no modal
        const todos_itens = [];
        for (const estado of estados) {
            for (const item of (estado.itens || [])) {
                const existente = todos_itens.find(i => i.i === item.produto_id);
                if (existente) {
                    existente.q += item.quantidade;
                } else {
                    todos_itens.push(minificar_item(item));
                }
            }
        }
        lista_itens.value = todos_itens;

        // Protocolo v3 — tudo minificado
        const pacote = {
            v: 3,
            t: (localStorage.getItem('nitec_tenant_id') || '').slice(0, 12), // tenant truncado
            // snap: estado legível por mesa (apenas o necessário)
            s: estados.map(e => ({
                c: e.comanda_id,                // c = comanda_id
                m: e.mesa_id,                   // m = mesa_id
                i: (e.itens || []).map(minificar_item)
            })),
            // acoes: fila para o servidor (minificada)
            a: acoes_brutas.map(minificar_acao)
        };

        const json_final = JSON.stringify(pacote);
        tamanho_qr.value = json_final.length;
        qr_texto.value = json_final;

    } catch (e) {
        console.error("Erro ao gerar QR Sync:", e);
    } finally {
        carregando.value = false;
    }
};

const ao_voltar_online = () => emit('fechar');

onMounted(() => {
    carregar_dados();
    window.addEventListener('online', ao_voltar_online);
});

onUnmounted(() => {
    window.removeEventListener('online', ao_voltar_online);
});
</script>