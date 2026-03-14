<template>
    <div class="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
        
        <!-- Cabeçalho -->
        <div class="bg-nitec_blue p-5 flex justify-between items-center">
            <div>
                <h2 class="text-white font-black text-lg tracking-tight">📥 Ler QR Sync</h2>
                <p class="text-blue-200 text-xs font-bold mt-0.5">Aponte a câmera para o QR de outro dispositivo</p>
            </div>
            <button @click="$emit('fechar')" class="text-white/70 hover:text-white transition-colors text-2xl font-light leading-none">×</button>
        </div>

        <!-- Câmera -->
        <div class="relative bg-black aspect-square overflow-hidden">

            <QrcodeStream
                v-if="camera_ativa && !resultado"
                camera="rear"
                @detect="ao_detectar_qr"
                @error="ao_dar_erro"
                @camera-on="ao_camera_ligar"
                class="w-full h-full object-cover"
            />

            <!-- Aguardando câmera ligar -->
            <div v-if="camera_ativa && !camera_ligada && !resultado" class="absolute inset-0 bg-black flex flex-col items-center justify-center gap-3">
                <svg class="animate-spin h-8 w-8 text-white/50" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-white/50 font-bold text-xs uppercase tracking-widest">A iniciar câmera...</p>
            </div>

            <!-- Mira animada -->
            <div v-if="camera_ativa && camera_ligada && !processando && !resultado"
                 class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <div class="w-52 h-52 relative">
                    <div class="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-white rounded-tl-lg"></div>
                    <div class="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-white rounded-tr-lg"></div>
                    <div class="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-white rounded-bl-lg"></div>
                    <div class="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-white rounded-br-lg"></div>
                    <div class="absolute left-0 right-0 h-0.5 bg-nitec_blue/80 shadow-[0_0_8px_2px_rgba(59,130,246,0.6)] scanner-line"></div>
                </div>
                <p class="absolute bottom-4 text-white/60 text-xs font-bold">Aponte para o QR Code</p>
            </div>

            <!-- Processando -->
            <div v-if="processando" class="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
                <svg class="animate-spin h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p class="text-white font-bold text-sm">Mesclando dados...</p>
            </div>

            <!-- Resultado -->
            <div v-if="resultado" class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-5 overflow-y-auto"
                 :class="resultado.erro ? 'bg-red-900/95' : 'bg-green-900/95'">
                <span class="text-4xl shrink-0">{{ resultado.erro ? '❌' : '✅' }}</span>
                <p class="text-white font-black text-base text-center">{{ resultado.mensagem }}</p>

                <!-- Lista de itens recebidos -->
                <div v-if="!resultado.erro && resultado.itens_recebidos?.length" class="w-full mt-1">
                    <p class="text-white/60 text-[10px] font-black uppercase tracking-widest mb-2 text-center">Itens recebidos:</p>
                    <div class="bg-white/10 rounded-xl overflow-hidden max-h-40 overflow-y-auto">
                        <div v-for="(item, i) in resultado.itens_recebidos" :key="i"
                             class="flex justify-between items-center px-3 py-2 border-b border-white/10 last:border-0">
                            <div class="flex items-center gap-2">
                                <span class="text-[10px] font-black text-orange-300 bg-white/10 px-1.5 py-0.5 rounded">{{ item.q }}x</span>
                                <span class="text-xs font-bold text-white">{{ item.n }}</span>
                            </div>
                            <span class="text-xs font-black text-green-300">R$ {{ (item.p * item.q).toFixed(2) }}</span>
                        </div>
                    </div>
                </div>

                <!-- Contadores -->
                <div v-if="!resultado.erro" class="grid grid-cols-2 gap-2 w-full mt-1">
                    <div class="bg-white/10 rounded-xl p-2.5 text-center">
                        <p class="text-white font-black text-lg">{{ resultado.itens_novos }}</p>
                        <p class="text-white/60 text-[9px] font-bold uppercase">Itens novos</p>
                    </div>
                    <div class="bg-white/10 rounded-xl p-2.5 text-center">
                        <p class="text-white font-black text-lg">{{ resultado.acoes_novas }}</p>
                        <p class="text-white/60 text-[9px] font-bold uppercase">Ações importadas</p>
                    </div>
                </div>

                <button @click="$emit('fechar')"
                        class="mt-2 bg-white/20 hover:bg-white/30 text-white font-black text-sm px-6 py-2 rounded-xl transition-all shrink-0">
                    Fechar
                </button>
            </div>

            <!-- Câmera inativa por erro -->
            <div v-if="!camera_ativa && !resultado" class="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3 p-6">
                <span class="text-5xl opacity-30">📷</span>
                <p class="text-gray-400 font-bold text-sm text-center">{{ erro_camera }}</p>
                <p class="text-gray-600 text-xs text-center font-bold mt-1">Verifique se o browser tem permissão para usar a câmera.</p>
            </div>
        </div>

        <div class="p-3 bg-gray-50 border-t border-gray-100">
            <p class="text-center text-[10px] text-gray-400 font-bold">
                🔒 Só aceita QR Codes deste estabelecimento
            </p>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { QrcodeStream } from 'vue-qrcode-reader';
import { db } from '../../banco_local/db.js';
import { useMesasStore } from '../../stores/mesas_store.js';

const emit = defineEmits(['fechar', 'sucesso']);

const loja_mesas = useMesasStore();
const camera_ativa  = ref(true);
const camera_ligada = ref(false);
const processando   = ref(false);
const resultado     = ref(null);
const erro_camera   = ref('');

// 🔑 Protocolo P2P: 1=POST, 2=DELETE — idêntico ao GeradorQrOffline
const ID_PARA_METODO = { 1: 'POST', 2: 'DELETE' };

// Dicionário inverso de URLs comprimidas (v3)
const URL_EXPAND = {
    'aic/': '/adicionar-itens-comanda/',
    'aqi/': '/alterar-quantidade-item/',
    'ric/': '/remover-item-comanda/',
    'fc/' : '/fechar-comanda/',
    'ac'  : '/abrir-comanda',
    'vb'  : '/venda-balcao'
};

/**
 * Descomprime uma URL minificada de volta para o formato da API.
 */
const expandir_url = (url_min) => {
    for (const [curta, completa] of Object.entries(URL_EXPAND)) {
        if (url_min.startsWith(curta)) {
            return completa + url_min.slice(curta.length);
        }
    }
    return url_min; // já estava no formato completo (v1/v2)
};

/**
 * Expande um item minificado {i,n,q,p,u} de volta para o formato completo.
 */
const expandir_item = (item_min) => ({
    produto_id    : item_min.i,
    nome_produto  : item_min.n,
    quantidade    : item_min.q,
    preco_unitario: item_min.p,
    uuid_operacao : item_min.u || null
});

const ao_camera_ligar = () => { camera_ligada.value = true; };

const ao_detectar_qr = async (codigos) => {
    if (processando.value || resultado.value || !codigos?.length) return;
    processando.value = true;

    try {
        const pacote = JSON.parse(codigos[0].rawValue);

        // Aceita v1, v2 e v3
        if (!pacote.v || ![1, 2, 3].includes(pacote.v)) {
            throw new Error("Formato de QR Code não reconhecido.");
        }

        // Validação de tenant (v3 trunca para 12 chars, compara parcialmente)
        const tenant_local = (localStorage.getItem('nitec_tenant_id') || '');
        const tenant_qr    = pacote.t || '';
        if (!tenant_local.startsWith(tenant_qr) && !tenant_qr.startsWith(tenant_local.slice(0, 12))) {
            throw new Error("QR Code de outro estabelecimento. Recusado por segurança.");
        }

        let itens_novos    = 0;
        let acoes_novas    = 0;
        const itens_recebidos = [];

        // ── PROTOCOLO v3: s (snap minificado) + a (acoes minificadas) ───────
        if (pacote.v === 3) {
            const snaps = pacote.s || [];

            for (const entry of snaps) {
                const comanda_id = entry.c;
                const mesa_id    = entry.m;
                const itens_min  = entry.i || [];
                const itens_exp  = itens_min.map(expandir_item);

                const estado_existente = await db.estado_comandas_local.get(String(comanda_id));

                if (!estado_existente) {
                    await db.estado_comandas_local.put({
                        comanda_id: String(comanda_id),
                        mesa_id,
                        tenant_id: tenant_local,
                        itens: itens_exp,
                        atualizado_em: new Date().toISOString()
                    });
                    itens_novos += itens_exp.length;
                } else {
                    // Merge por uuid_operacao (8 chars) — deduplicação
                    const uuids_ok = new Set(
                        estado_existente.itens.map(i => i.uuid_operacao).filter(Boolean)
                    );
                    const novos = itens_exp.filter(i => !i.uuid_operacao || !uuids_ok.has(i.uuid_operacao));
                    if (novos.length > 0) {
                        await db.estado_comandas_local.put({
                            ...estado_existente,
                            itens: [...estado_existente.itens, ...novos],
                            atualizado_em: new Date().toISOString()
                        });
                        itens_novos += novos.length;
                    }
                }

                // Popula a lista visível de itens recebidos
                itens_exp.forEach(i => itens_recebidos.push({ n: i.nome_produto, q: i.quantidade, p: i.preco_unitario }));

                // Marca mesa como ocupada no Dexie local
                if (mesa_id) {
                    await db.mesas.update(Number(mesa_id), { status_mesa: 'ocupada' });
                }
            }

            // Processa ações minificadas
            const acoes_min = pacote.a || [];
            const todas_vendas = await db.vendas_pendentes.toArray();
            const uuids_locais = new Set(todas_vendas.map(v => v.uuid_operacao).filter(Boolean));

            for (const acao_min of acoes_min) {
                const [url_min, metodo_id, itens_min, uuid_curto] = acao_min;
                const url    = expandir_url(url_min);
                const metodo = ID_PARA_METODO[metodo_id] || 'POST';

                // Deduplicação por uuid (8 chars)
                if (uuid_curto && uuids_locais.has(uuid_curto)) continue;

                // Reconstrói payload completo
                const itens_exp = (itens_min || []).map(expandir_item);
                const payload   = itens_exp.length > 0
                    ? { itens: itens_exp.map(i => ({ produto_id: i.produto_id, quantidade: i.quantidade, preco_unitario: i.preco_unitario })), uuid_operacao: uuid_curto }
                    : { uuid_operacao: uuid_curto };

                await db.vendas_pendentes.add({
                    tenant_id    : tenant_local,
                    data_venda   : new Date().toISOString(),
                    valor_total  : 0,
                    url_destino  : url,
                    metodo,
                    payload_venda: payload,
                    uuid_operacao: uuid_curto || null
                });

                if (uuid_curto) uuids_locais.add(uuid_curto);
                acoes_novas++;
            }

            await loja_mesas.buscar_mesas(true);
        }

        // ── PROTOCOLO v1 e v2 (retrocompatibilidade) ────────────────────────
        if (pacote.v === 1 || pacote.v === 2) {
            // snap v2
            const snaps_v2 = pacote.snap || [];
            for (const entry of snaps_v2) {
                const estado_existente = await db.estado_comandas_local.get(entry.comanda_id);
                if (!estado_existente) {
                    await db.estado_comandas_local.put({
                        comanda_id: entry.comanda_id, mesa_id: entry.mesa_id,
                        tenant_id: tenant_local, itens: entry.itens || [],
                        atualizado_em: new Date().toISOString()
                    });
                    itens_novos += entry.itens?.length || 0;
                }
                if (entry.mesa_id) await db.mesas.update(Number(entry.mesa_id), { status_mesa: 'ocupada' });
            }

            // acoes v1/v2
            const acoes_v = pacote.acoes || pacote.d || [];
            const todas_vendas = await db.vendas_pendentes.toArray();
            const uuids_locais = new Set(todas_vendas.map(v => v.uuid_operacao).filter(Boolean));
            for (const acao of acoes_v) {
                const [url, metodo_id, payload] = acao;
                const uuid = payload?.uuid_operacao;
                if (uuid && uuids_locais.has(uuid)) continue;
                await db.vendas_pendentes.add({
                    tenant_id: tenant_local, data_venda: new Date().toISOString(),
                    valor_total: 0, url_destino: url,
                    metodo: ID_PARA_METODO[metodo_id] || 'POST',
                    payload_venda: payload || {}, uuid_operacao: uuid || null
                });
                if (uuid) uuids_locais.add(uuid);
                acoes_novas++;
            }
            await loja_mesas.buscar_mesas(true);
        }

        resultado.value = {
            erro: false,
            mensagem: itens_novos + acoes_novas > 0 ? 'Sincronização concluída!' : 'Já estava tudo atualizado.',
            itens_novos,
            acoes_novas,
            itens_recebidos
        };

        emit('sucesso');

    } catch (e) {
        console.error("Erro no LeitorQrOffline:", e);
        resultado.value = { erro: true, mensagem: e.message || "Falha ao processar QR Code." };
    } finally {
        processando.value = false;
    }
};

const ao_dar_erro = (e) => {
    console.error("Erro de câmera:", e);
    erro_camera.value = e.name === 'NotAllowedError' ? 'Permissão de câmera negada.'
        : e.name === 'NotFoundError' ? 'Nenhuma câmera encontrada.'
        : `Erro: ${e.message || e.name}`;
    camera_ativa.value = false;
};
</script>

<style scoped>
@keyframes scan {
    0%   { top: 10%; }
    50%  { top: 85%; }
    100% { top: 10%; }
}
.scanner-line { animation: scan 2s ease-in-out infinite; }
</style>