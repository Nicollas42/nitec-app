<template>
    <section class="flex flex-col gap-5">
        <div v-if="mostrar_cabecalho" class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div>
                <h3 class="text-lg font-black text-[var(--text-primary)] tracking-tight">{{ titulo }}</h3>
                <p v-if="subtitulo" class="text-xs font-bold text-[var(--text-muted)] mt-1">{{ subtitulo }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
                <button
                    v-if="mesas_ordenadas.length > 0"
                    @click="imprimir_todas"
                    class="px-4 py-2.5 rounded-xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-blue-700 transition-colors"
                >
                    Imprimir Tudo
                </button>
            </div>
        </div>

        <div v-if="mesas_ordenadas.length === 0" class="rounded-[2rem] border border-dashed border-[var(--border-subtle)] bg-[var(--bg-page)] p-8 text-center">
            <p class="text-sm font-black text-[var(--text-primary)]">Nenhuma mesa cadastrada.</p>
            <p class="text-xs font-bold text-[var(--text-muted)] mt-2">Cadastre mesas para gerar os QR Codes do cardapio digital.</p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <article
                v-for="mesa in mesas_ordenadas"
                :key="mesa.id"
                class="rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 shadow-sm flex flex-col gap-4"
            >
                <div
                    :ref="(el) => registrar_ref_qr(mesa.id, el)"
                    class="rounded-[1.5rem] border border-[var(--border-subtle)] bg-white p-5 flex flex-col items-center text-center gap-3"
                >
                    <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center text-lg font-black">
                        QR
                    </div>
                    <div>
                        <p class="text-sm font-black text-slate-800">{{ mesa.nome_mesa }}</p>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">Mesa #{{ mesa.id }}</p>
                    </div>
                    <div class="p-3 rounded-2xl border-2 border-dashed border-slate-200">
                        <QrcodeVue :value="obter_url_mesa(mesa.id)" :size="tamanho_qr" level="M" render-as="svg" />
                    </div>
                    <p class="text-[10px] font-bold text-slate-500 break-all">{{ obter_url_mesa(mesa.id) }}</p>
                </div>

                <div class="flex gap-2">
                    <button
                        @click="copiar_url_mesa(mesa.id)"
                        class="flex-1 px-3 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-page)] text-[10px] font-black uppercase tracking-widest text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-colors"
                    >
                        Copiar Link
                    </button>
                    <button
                        @click="imprimir_mesa(mesa.id, mesa.nome_mesa)"
                        class="flex-1 px-3 py-2.5 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-700 text-[10px] font-black uppercase tracking-widest hover:bg-violet-500/20 transition-colors"
                    >
                        Imprimir
                    </button>
                </div>
            </article>
        </div>
    </section>
</template>

<script setup>
import { computed } from 'vue';
import QrcodeVue from 'qrcode.vue';
import { obter_url_publica_cardapio_mesa } from '../../servicos/api_cardapio.js';

const props = defineProps({
    mesas: {
        type: Array,
        default: () => [],
    },
    titulo: {
        type: String,
        default: 'QR Codes das Mesas',
    },
    subtitulo: {
        type: String,
        default: '',
    },
    mostrar_cabecalho: {
        type: Boolean,
        default: true,
    },
    tamanho_qr: {
        type: Number,
        default: 170,
    },
});

const refs_qr = new Map();

const mesas_ordenadas = computed(() => {
    return [...props.mesas].sort((a, b) => {
        return String(a?.nome_mesa || '').localeCompare(String(b?.nome_mesa || ''), 'pt-BR', {
            numeric: true,
            sensitivity: 'base',
        });
    });
});

const obter_url_mesa = (mesa_id) => obter_url_publica_cardapio_mesa(mesa_id);

const registrar_ref_qr = (mesa_id, elemento) => {
    if (elemento) refs_qr.set(mesa_id, elemento);
    else refs_qr.delete(mesa_id);
};

const abrir_janela_impressao = (conteudo_html, titulo) => {
    const popup = window.open('', '_blank', 'width=960,height=720');
    if (!popup) return;

    popup.document.write(`
        <!DOCTYPE html>
        <html lang="pt-BR">
            <head>
                <meta charset="UTF-8" />
                <title>${titulo}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 24px; color: #0f172a; }
                    h1 { font-size: 18px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: .08em; }
                    .grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
                    .card { border: 1px solid #cbd5e1; border-radius: 24px; padding: 20px; break-inside: avoid; }
                    .card svg { width: 180px; height: 180px; }
                    .card p { margin: 8px 0 0; font-size: 12px; word-break: break-all; }
                </style>
            </head>
            <body>
                <h1>${titulo}</h1>
                <div class="grid">${conteudo_html}</div>
            </body>
        </html>
    `);

    popup.document.close();
    popup.focus();
    popup.onload = () => popup.print();
};

const imprimir_mesa = (mesa_id, nome_mesa = 'Mesa') => {
    const elemento = refs_qr.get(mesa_id);
    if (!elemento) return;
    abrir_janela_impressao(`<div class="card">${elemento.innerHTML}</div>`, `QR ${nome_mesa}`);
};

const imprimir_todas = () => {
    const html = mesas_ordenadas.value
        .map((mesa) => {
            const elemento = refs_qr.get(mesa.id);
            return elemento ? `<div class="card">${elemento.innerHTML}</div>` : '';
        })
        .join('');

    if (!html) return;
    abrir_janela_impressao(html, 'QR Codes das Mesas');
};

const copiar_url_mesa = async (mesa_id) => {
    const url = obter_url_mesa(mesa_id);
    try {
        await navigator.clipboard.writeText(url);
    } catch (_) {
        /* silencioso */
    }
};
</script>
