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

            <!-- 🟢 v5: usa camera="rear" em vez de :constraints -->
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
            
            <!-- Mira animada — só aparece quando câmera está ligada -->
            <div v-if="camera_ativa && camera_ligada && !processando && !resultado" class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
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

            <!-- Resultado do merge -->
            <div v-if="resultado" class="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6"
                 :class="resultado.erro ? 'bg-red-900/90' : 'bg-green-900/90'">
                <span class="text-5xl">{{ resultado.erro ? '❌' : '✅' }}</span>
                <p class="text-white font-black text-base text-center">{{ resultado.mensagem }}</p>
                <div v-if="!resultado.erro" class="grid grid-cols-2 gap-3 w-full mt-2">
                    <div class="bg-white/10 rounded-xl p-3 text-center">
                        <p class="text-white font-black text-xl">{{ resultado.itens_novos }}</p>
                        <p class="text-white/70 text-[10px] font-bold uppercase">Itens recebidos</p>
                    </div>
                    <div class="bg-white/10 rounded-xl p-3 text-center">
                        <p class="text-white font-black text-xl">{{ resultado.acoes_novas }}</p>
                        <p class="text-white/70 text-[10px] font-bold uppercase">Ações importadas</p>
                    </div>
                </div>
                <button @click="$emit('fechar')" class="mt-3 bg-white/20 hover:bg-white/30 text-white font-black text-sm px-6 py-2 rounded-xl transition-all">
                    Fechar
                </button>
            </div>

            <!-- Câmera inativa por erro -->
            <div v-if="!camera_ativa && !resultado" class="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center gap-3 p-6">
                <span class="text-5xl opacity-30">📷</span>
                <p class="text-gray-400 font-bold text-sm text-center">{{ erro_camera }}</p>
                <p class="text-gray-600 text-xs text-center font-bold mt-1">Verifique se o browser tem permissão para usar a câmera nas configurações do dispositivo.</p>
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
const camera_ativa = ref(true);
const camera_ligada = ref(false);
const processando = ref(false);
const resultado = ref(null);
const erro_camera = ref('');

// 🔑 Protocolo P2P: 1 = POST, 2 = DELETE — deve ser idêntico ao GeradorQrOffline
const ID_PARA_METODO = { 1: 'POST', 2: 'DELETE' };

/** Câmera traseira iniciou — remove o spinner e mostra a mira */
const ao_camera_ligar = () => {
    camera_ligada.value = true;
};

const ao_detectar_qr = async (codigos) => {
    if (processando.value || resultado.value || !codigos?.length) return;
    processando.value = true;

    try {
        const pacote = JSON.parse(codigos[0].rawValue);

        // Validação: versão e tenant
        if (!pacote.v || ![1, 2].includes(pacote.v)) {
            throw new Error("Formato de QR Code não reconhecido.");
        }
        const tenant_local = localStorage.getItem('nitec_tenant_id');
        if (pacote.t !== tenant_local) {
            throw new Error("QR Code de outro estabelecimento. Recusado por segurança.");
        }

        let itens_novos = 0;
        let acoes_novas = 0;

        // ── PROTOCOLO v2: snap + acoes ──────────────────────────────────────
        if (pacote.v === 2 && Array.isArray(pacote.snap)) {
            for (const entry of pacote.snap) {
                const estado_existente = await db.estado_comandas_local.get(entry.comanda_id);

                if (!estado_existente) {
                    // Comanda nova — insere direto
                    await db.estado_comandas_local.put({
                        comanda_id: entry.comanda_id,
                        mesa_id: entry.mesa_id,
                        tenant_id: pacote.t,
                        nome_cliente: entry.nome_cliente,
                        itens: entry.itens || [],
                        atualizado_em: new Date().toISOString()
                    });
                    itens_novos += entry.itens?.length || 0;
                } else {
                    // Comanda existente — merge por uuid_operacao (deduplicação por lote)
                    const uuids_existentes = new Set(
                        estado_existente.itens.map(i => i.uuid_operacao).filter(Boolean)
                    );
                    const itens_a_adicionar = (entry.itens || []).filter(
                        i => !uuids_existentes.has(i.uuid_operacao)
                    );
                    if (itens_a_adicionar.length > 0) {
                        await db.estado_comandas_local.put({
                            ...estado_existente,
                            itens: [...estado_existente.itens, ...itens_a_adicionar],
                            atualizado_em: new Date().toISOString()
                        });
                        itens_novos += itens_a_adicionar.length;
                    }
                }

                // Atualiza o status da mesa no Dexie local
                // Sem isso, o receptor vê a mesa como "livre" e o click abre modal de nova comanda
                if (entry.mesa_id) {
                    await db.mesas.update(Number(entry.mesa_id), { status_mesa: 'ocupada' });
                }
            }

            // Força atualização do store de mesas para a tela refletir imediatamente
            await loja_mesas.buscar_mesas(true);
        }

        // ── PROTOCOLO v1 e v2: importar acoes para vendas_pendentes ────────
        const acoes = pacote.acoes || pacote.d || []; // 'd' = campo legado v1
        const todas_vendas = await db.vendas_pendentes.toArray();
        const uuids_locais = new Set(todas_vendas.map(v => v.uuid_operacao).filter(Boolean));

        for (const acao of acoes) {
            const [url, metodo_id, payload] = acao;
            const uuid = payload?.uuid_operacao;

            // Pula se já temos esta ação — deduplicação local
            if (uuid && uuids_locais.has(uuid)) continue;

            await db.vendas_pendentes.add({
                tenant_id: pacote.t,
                data_venda: new Date().toISOString(),
                valor_total: 0,
                url_destino: url,
                metodo: ID_PARA_METODO[metodo_id] || 'POST',
                payload_venda: payload || {},
                uuid_operacao: uuid || null
            });
            if (uuid) uuids_locais.add(uuid);
            acoes_novas++;
        }

        resultado.value = {
            erro: false,
            mensagem: itens_novos + acoes_novas > 0
                ? 'Sincronização concluída!'
                : 'Já estava tudo atualizado.',
            itens_novos,
            acoes_novas
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
    if (e.name === 'NotAllowedError') {
        erro_camera.value = 'Permissão de câmera negada.';
    } else if (e.name === 'NotFoundError') {
        erro_camera.value = 'Nenhuma câmera encontrada neste dispositivo.';
    } else if (e.name === 'NotSupportedError') {
        erro_camera.value = 'Câmera não suportada neste browser.';
    } else {
        erro_camera.value = `Erro ao iniciar câmera: ${e.message || e.name || 'desconhecido'}`;
    }
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