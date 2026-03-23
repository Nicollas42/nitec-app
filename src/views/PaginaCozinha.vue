<template>
    <div class="min-h-screen bg-[var(--bg-page)] p-3 sm:p-6">
        <!-- Cabeçalho -->
        <header class="flex items-center justify-between mb-6">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Cozinha</h1>
                <p class="text-sm text-[var(--text-muted)] mt-1">
                    Painel de preparo —
                    <span v-if="total_pendentes > 0" class="text-red-500 font-black">{{ total_pendentes }} pendente{{ total_pendentes > 1 ? 's' : '' }}</span>
                    <span v-else class="text-green-500 font-black">tudo em dia</span>
                </p>
            </div>
            <div class="flex items-center gap-3">
                <span class="text-[10px] text-[var(--text-muted)] font-bold">atualiza em {{ contador_refresh }}s</span>
                <button @click="carregar_pedidos"
                    class="flex items-center justify-center h-9 w-9 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4" :class="carregando ? 'animate-spin' : ''">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </header>

        <!-- Estado vazio -->
        <div v-if="!carregando && mesas.length === 0"
            class="bg-[var(--bg-card)] rounded-2xl border border-dashed border-[var(--border-subtle)] p-16 text-center">
            <div class="text-4xl mb-4">🍳</div>
            <p class="text-[var(--text-primary)] font-black text-lg">Nenhum pedido pendente</p>
            <p class="text-[var(--text-muted)] font-bold text-sm mt-1">Os pedidos aparecerão aqui assim que forem lançados</p>
        </div>

        <!-- Grid de pedidos por mesa -->
        <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <section v-for="mesa in mesas" :key="mesa.mesa_id ?? 'balcao'"
                class="bg-[var(--bg-card)] rounded-2xl border shadow-sm overflow-hidden"
                :class="mesa.pedidos.some(p => p.status === 'pendente') ? 'border-red-500/50' : 'border-amber-500/50'">

                <!-- Cabeçalho da mesa -->
                <div class="px-5 py-3 flex items-center justify-between border-b border-[var(--border-subtle)]"
                    :class="mesa.pedidos.some(p => p.status === 'pendente') ? 'bg-red-500/5' : 'bg-amber-500/5'">
                    <span class="text-sm font-black text-[var(--text-primary)]">{{ mesa.mesa_nome }}</span>
                    <div class="flex items-center gap-2">
                        <span v-if="mesa.pedidos.some(p => p.status === 'pendente')"
                            class="px-2 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black animate-pulse">
                            PENDENTE
                        </span>
                        <span v-else
                            class="px-2 py-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black">
                            EM PREPARO
                        </span>
                    </div>
                </div>

                <!-- Itens -->
                <div class="divide-y divide-[var(--border-subtle)]">
                    <div v-for="pedido in mesa.pedidos" :key="pedido.id"
                        class="px-5 py-4">
                        <div class="flex items-start justify-between gap-3 mb-3">
                            <div class="min-w-0">
                                <p class="text-sm font-black text-[var(--text-primary)]">
                                    {{ pedido.quantidade }}x {{ pedido.produto_nome }}
                                </p>
                                <p v-if="pedido.adicionais_texto"
                                    class="text-[11px] font-bold text-nitec_blue mt-0.5">
                                    + {{ pedido.adicionais_texto }}
                                </p>
                                <p class="text-[10px] text-[var(--text-muted)] font-bold mt-1">{{ pedido.criado_em }}</p>
                            </div>
                            <span class="flex-none px-2 py-0.5 rounded-full text-[9px] font-black uppercase"
                                :class="{
                                    'bg-red-100 text-red-600': pedido.status === 'pendente',
                                    'bg-amber-100 text-amber-600': pedido.status === 'em_preparacao',
                                }">
                                {{ pedido.status === 'pendente' ? 'Fila' : 'Preparando' }}
                            </span>
                        </div>

                        <!-- Ações -->
                        <div class="flex gap-2">
                            <button v-if="pedido.status === 'pendente'"
                                @click="atualizar_status(pedido.id, 'em_preparacao')"
                                :disabled="atualizando_id === pedido.id"
                                class="flex-1 py-2 rounded-lg bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors disabled:opacity-50">
                                ⚡ Em Preparação
                            </button>
                            <button
                                @click="atualizar_status(pedido.id, 'finalizado')"
                                :disabled="atualizando_id === pedido.id"
                                class="flex-1 py-2 rounded-lg bg-green-500 text-white text-[10px] font-black uppercase tracking-widest hover:bg-green-600 transition-colors disabled:opacity-50">
                                ✓ Finalizado
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

const mesas = ref([]);
const carregando = ref(false);
const atualizando_id = ref(null);
const contador_refresh = ref(5);
let intervalo_poll = null;
let intervalo_contador = null;

// IDs dos pedidos conhecidos (para detectar novos)
const ids_conhecidos = ref(new Set());

const total_pendentes = computed(() =>
    mesas.value.reduce((acc, m) => acc + m.pedidos.filter(p => p.status === 'pendente').length, 0)
);

// ── Som de novo pedido (Web Audio API) ───────────────────────────────────────
const tocar_som_novo_pedido = () => {
    try {
        const ctx = new AudioContext();
        [0, 0.15].forEach(delay => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0, ctx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.4);
        });
    } catch (_) { /* silencioso se Web Audio não disponível */ }
};

// ── Carregar pedidos ──────────────────────────────────────────────────────────
const carregar_pedidos = async () => {
    carregando.value = true;
    try {
        const resp = await api_cliente.get('/cozinha/pedidos');
        const novas_mesas = resp.data.mesas || [];

        // Detectar novos pedidos
        const novos_ids = new Set();
        novas_mesas.forEach(m => m.pedidos.forEach(p => novos_ids.add(p.id)));
        const tem_novos = [...novos_ids].some(id => !ids_conhecidos.value.has(id));
        if (tem_novos && ids_conhecidos.value.size > 0) {
            tocar_som_novo_pedido();
        }
        ids_conhecidos.value = novos_ids;
        mesas.value = novas_mesas;
    } catch (e) {
        console.error('Erro ao carregar cozinha:', e);
    } finally {
        carregando.value = false;
        contador_refresh.value = 5;
    }
};

// ── Atualizar status ──────────────────────────────────────────────────────────
const atualizar_status = async (id, novo_status) => {
    atualizando_id.value = id;
    try {
        await api_cliente.put(`/cozinha/pedido/${id}/status`, { status: novo_status });
        await carregar_pedidos();
    } catch (e) {
        console.error('Erro ao atualizar status:', e);
    } finally {
        atualizando_id.value = null;
    }
};

// ── Polling ───────────────────────────────────────────────────────────────────
onMounted(() => {
    carregar_pedidos();
    intervalo_poll = setInterval(carregar_pedidos, 5000);
    intervalo_contador = setInterval(() => {
        contador_refresh.value = Math.max(0, contador_refresh.value - 1);
    }, 1000);
});

onUnmounted(() => {
    clearInterval(intervalo_poll);
    clearInterval(intervalo_contador);
});
</script>
