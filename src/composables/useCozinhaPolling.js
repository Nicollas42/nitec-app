import { ref, onMounted, onUnmounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

/**
 * Composable de polling do status da cozinha.
 * Usado em PaginaMesas e PaginaDashboard para manter os cards de mesa
 * atualizados e tocar sons quando o status de um item muda.
 */
export function useCozinhaPolling() {
    const status_por_mesa = ref({});

    // Guarda os status conhecidos para detectar mudanças
    let status_anterior = {};

    // ── Sons ─────────────────────────────────────────────────────────────────

    const tocar_som = (frequencia, vezes = 1, intervalo_ms = 150) => {
        try {
            const ctx = new AudioContext();
            for (let i = 0; i < vezes; i++) {
                const delay = i * intervalo_ms / 1000;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = frequencia;
                gain.gain.setValueAtTime(0, ctx.currentTime + delay);
                gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + delay + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.4);
                osc.start(ctx.currentTime + delay);
                osc.stop(ctx.currentTime + delay + 0.45);
            }
        } catch (_) { /* silencioso */ }
    };

    // Som grave duplo: pedido finalizado (para garçom ir buscar)
    const tocar_som_pronto = () => tocar_som(440, 2, 200);

    // ── Polling ───────────────────────────────────────────────────────────────

    const verificar_mudancas_e_tocar_som = (novo_status) => {
        for (const [mesa_id, estado] of Object.entries(novo_status)) {
            const anterior = status_anterior[mesa_id];
            if (!anterior) continue;

            // Mesa passou a ter pedido finalizado não visto → som para garçom
            if (!anterior.tem_finalizado_nao_visto && estado.tem_finalizado_nao_visto) {
                tocar_som_pronto();
                break;
            }
        }
    };

    let intervalo = null;

    const carregar = async () => {
        try {
            const resp = await api_cliente.get('/cozinha/status-mesas');
            const novo = resp.data.status_por_mesa || {};
            verificar_mudancas_e_tocar_som(novo);
            status_anterior = { ...novo };
            status_por_mesa.value = novo;
        } catch (_) { /* silencioso */ }
    };

    onMounted(() => {
        carregar();
        intervalo = setInterval(carregar, 5000);
    });

    onUnmounted(() => clearInterval(intervalo));

    return { status_por_mesa };
}
