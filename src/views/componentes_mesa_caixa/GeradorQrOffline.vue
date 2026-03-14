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

            <div class="bg-white p-3 border-2 border-dashed border-gray-200 rounded-2xl inline-block shadow-sm">
                <QrcodeVue :value="qr_texto" :size="260" level="L" render-as="svg" />
            </div>

            <!-- Lista de itens contidos no QR -->
            <div v-if="lista_display.length > 0" class="mt-4 w-full text-left">
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Itens no QR Code:</p>
                <div class="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden">
                    <div v-for="(item, i) in lista_display" :key="i"
                         class="flex justify-between items-center px-4 py-2.5 border-b border-gray-100 last:border-0">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="text-[10px] font-black text-orange-400 bg-orange-50 px-1.5 py-0.5 rounded-md shrink-0">{{ item.q }}x</span>
                            <span class="text-xs font-bold text-gray-700 truncate">{{ item.nome }}</span>
                        </div>
                        <span class="text-xs font-black text-green-600 shrink-0 ml-2">R$ {{ (item.p * item.q).toFixed(2) }}</span>
                    </div>
                </div>
            </div>

            <!-- Resumo: ações | itens | tamanho payload -->
            <div class="mt-3 flex gap-2">
                <div class="flex-1 bg-orange-50 rounded-xl p-2.5 border border-orange-100 text-center">
                    <p class="text-xl font-black text-orange-600">{{ total_acoes }}</p>
                    <p class="text-[9px] text-orange-400 font-bold uppercase tracking-widest">Ações</p>
                </div>
                <div class="flex-1 bg-blue-50 rounded-xl p-2.5 border border-blue-100 text-center">
                    <p class="text-xl font-black text-blue-600">{{ lista_display.length }}</p>
                    <p class="text-[9px] text-blue-400 font-bold uppercase tracking-widest">Itens</p>
                </div>
                <div class="flex-1 bg-gray-50 rounded-xl p-2.5 border border-gray-100 text-center">
                    <p class="text-xl font-black text-gray-600">{{ tamanho_payload }}</p>
                    <p class="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Chars</p>
                </div>
            </div>

            <button @click="carregar_dados" class="mt-3 text-xs text-nitec_blue font-bold uppercase hover:bg-blue-50 py-2 px-4 rounded-lg transition-colors">
                ↻ Recarregar QR
            </button>
        </div>

        <!-- Sem dados -->
        <div v-else class="text-center py-10">
            <div class="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-3xl mx-auto mb-4 shadow-inner">✔️</div>
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

const carregando    = ref(true);
const qr_texto      = ref('');
const total_acoes   = ref(0);
const lista_display = ref([]); // só para exibição — nomes vêm do Dexie local, não vão no QR
const tamanho_payload = ref(0);

// 🔑 Protocolo P2P v5
//
// Snap (s): por mesa → [ mesa_id, [ [prod_id, qtd, uuid8], ... ] ]
//   comanda_id é derivado no receptor como "off_" + mesa_id — não precisa viajar
//
// Ações (a): por ação → [ url_curta, metodo_id, [ [prod_id, qtd], ... ], uuid8 ]
//   nome e preço do produto são buscados no db.produtos do receptor
//
// Método: 1=POST, 2=DELETE

const METODO_ID = { 'POST': 1, 'DELETE': 2 };

const URL_CURTA = {
    '/adicionar-itens-comanda/': 'aic/',
    '/alterar-quantidade-item/': 'aqi/',
    '/remover-item-comanda/'   : 'ric/',
    '/fechar-comanda/'         : 'fc/',
    '/abrir-comanda'           : 'ac',
    '/venda-balcao'            : 'vb',
};

/**
 * Comprime URL da API para versão curta.
 * @param {string} url
 * @returns {string}
 */
const comprimir_url = (url) => {
    for (const [longa, curta] of Object.entries(URL_CURTA)) {
        if (url.startsWith(longa)) return curta + url.slice(longa.length);
    }
    return url;
};

const carregar_dados = async () => {
    carregando.value = true;
    qr_texto.value   = '';
    lista_display.value = [];

    try {
        const acoes_brutas = await db.vendas_pendentes.toArray();
        const estados      = await db.estado_comandas_local.toArray();

        total_acoes.value = acoes_brutas.length;

        if (acoes_brutas.length === 0 && estados.length === 0) return;

        // Mapa de produtos para montar a lista de exibição (não vai no QR)
        const produtos_map = {};
        for (const p of await db.produtos.toArray()) produtos_map[p.id] = p;

        // Lista de exibição — agrupada por produto_id
        const display = [];
        for (const estado of estados) {
            for (const item of (estado.itens || [])) {
                const prod     = produtos_map[item.produto_id];
                const existente = display.find(d => d.produto_id === item.produto_id);
                if (existente) {
                    existente.q += item.quantidade;
                } else {
                    display.push({
                        produto_id: item.produto_id,
                        nome: prod?.nome_produto || `Produto #${item.produto_id}`,
                        q   : item.quantidade,
                        p   : item.preco_unitario ?? prod?.preco_venda ?? 0,
                    });
                }
            }
        }
        lista_display.value = display;

        // ── Protocolo v5: payload mínimo ───────────────────────────────────
        //
        // snap: [ [mesa_id, [ [prod_id, qtd, uuid8], ... ]], ... ]
        //   comanda_id removido — o receptor deriva "off_" + mesa_id
        //
        const s = estados.map(e => [
            e.mesa_id,
            (e.itens || []).map(i => [
                i.produto_id,
                i.quantidade,
                (i.uuid_operacao || '').slice(0, 8)
            ])
        ]);

        // acoes: [ [url_curta, metodo_id, [ [prod_id, qtd], ... ], uuid8], ... ]
        //   preco_unitario removido — o receptor busca no db.produtos local
        //
        const a = acoes_brutas.map(acao => {
            const payload = acao.payload_venda || {};
            const itens   = (payload.itens || []).map(i => [i.produto_id, i.quantidade]);
            const uuid8   = (payload.uuid_operacao || '').slice(0, 8);
            return [comprimir_url(acao.url_destino), METODO_ID[acao.metodo?.toUpperCase()] ?? 1, itens, uuid8];
        });

        // Tenant truncado a 8 chars
        const t = (localStorage.getItem('nitec_tenant_id') || '').slice(0, 8);

        const pacote = { v: 5, t, s, a };
        const json   = JSON.stringify(pacote);

        tamanho_payload.value = json.length;
        qr_texto.value        = json;

    } catch (e) {
        console.error("Erro ao gerar QR Sync v5:", e);
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