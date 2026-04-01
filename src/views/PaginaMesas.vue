<template>
    <div class="tela_mesas p-6 md:p-8 bg-[var(--bg-page)] h-full font-sans flex flex-col relative overflow-y-auto transition-colors duration-300">
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Mapa de Mesas</h1>
                <p class="text-sm text-[var(--text-muted)] mt-1">Gestao de salao, QR Codes e chamados de atendimento em tempo real.</p>
            </div>

            <div class="flex gap-2 w-full md:w-auto">
                <button
                    @click="voltar_painel"
                    class="md:hidden px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-card-hover)] text-sm font-bold transition-all flex-1"
                >
                    Voltar
                </button>
                <button
                    @click="modal_qr_mesas = true"
                    class="px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <span>📲</span>
                    <span class="hidden sm:inline">QR Mesas</span>
                </button>
                <button
                    @click="abrir_modal_grade"
                    class="px-4 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                >
                    <span>⊞</span>
                    <span class="hidden sm:inline">Grade</span>
                    <span class="text-[10px] font-black text-nitec_blue">{{ grade_colunas }}×{{ grade_linhas || '∞' }}</span>
                </button>
                <button
                    @click="modal_nova_mesa = true"
                    class="px-4 py-2.5 bg-nitec_blue text-white rounded-lg hover:bg-blue-600 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none"
                >
                    <span>➕</span> Nova Mesa
                </button>
            </div>
        </header>

        <main class="area_principal flex flex-col gap-6 flex-1">
            <section class="secao_grelha_mesas flex-1">
                <div class="grid gap-2 pb-6" :style="`grid-template-columns: repeat(${grade_colunas}, minmax(0, 1fr))`">
                    <button
                        v-for="mesa in (grade_linhas > 0 ? lista_mesas.slice(0, grade_colunas * grade_linhas) : lista_mesas)"
                        :key="mesa.id"
                        @click="selecionar_mesa(mesa)"
                        class="p-2.5 rounded-xl transition-all transform active:scale-95 bg-[var(--bg-card)] relative flex flex-col items-start justify-between group border min-h-[4.8rem]"
                        :class="[
                            mesa.solicitando_atendimento
                                ? 'border-violet-500 bg-violet-500/10 shadow-[0_0_24px_rgba(139,92,246,0.22)] animate-pulse'
                                : mesa.status_mesa === 'livre'
                                    ? 'border-[var(--border-subtle)] hover:border-green-500 shadow-sm hover:shadow-md'
                                    : status_cozinha_mesas[String(mesa.id)]?.tem_finalizado_nao_visto && !status_cozinha_mesas[String(mesa.id)]?.tem_pendente && !status_cozinha_mesas[String(mesa.id)]?.tem_em_preparacao
                                        ? 'border-green-500 bg-green-500/10 shadow-sm animate-pulse'
                                        : status_cozinha_mesas[String(mesa.id)]?.tem_em_preparacao && !status_cozinha_mesas[String(mesa.id)]?.tem_pendente
                                            ? 'border-amber-500 bg-amber-500/5 shadow-sm animate-pulse'
                                            : 'border-red-500/40 bg-red-500/5 shadow-sm'
                        ]"
                    >
                        <div class="w-full flex justify-between items-center mb-1">
                            <span
                                class="w-2 h-2 rounded-full flex-shrink-0"
                                :class="mesa.solicitando_atendimento
                                    ? 'bg-violet-500 animate-ping'
                                    : mesa.status_mesa === 'livre'
                                        ? 'bg-green-500'
                                        : status_cozinha_mesas[String(mesa.id)]?.tem_finalizado_nao_visto && !status_cozinha_mesas[String(mesa.id)]?.tem_pendente && !status_cozinha_mesas[String(mesa.id)]?.tem_em_preparacao
                                            ? 'bg-green-500 animate-ping'
                                            : status_cozinha_mesas[String(mesa.id)]?.tem_em_preparacao && !status_cozinha_mesas[String(mesa.id)]?.tem_pendente
                                                ? 'bg-amber-500 animate-ping'
                                                : 'bg-red-500 animate-pulse'"
                            ></span>
                            <svg v-if="mesa_carregando === mesa.id" class="animate-spin h-3.5 w-3.5 text-nitec_blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>

                        <div class="w-full">
                            <p class="text-xs font-black text-[var(--text-primary)] leading-tight truncate w-full">{{ mesa.nome_mesa }}</p>
                            <p
                                v-if="mesa.solicitando_atendimento"
                                class="text-[9px] font-black uppercase tracking-widest text-violet-600 mt-1"
                            >
                                Solicitando atendimento
                            </p>
                            <template v-else-if="mesa.status_mesa !== 'livre' && info_por_mesa[String(mesa.id)]">
                                <p class="text-[9px] font-bold text-red-500 mt-0.5 leading-tight">
                                    {{ info_por_mesa[String(mesa.id)].count }} cmd
                                </p>
                                <p class="text-[9px] font-black text-[var(--text-primary)] leading-tight">
                                    R$ {{ info_por_mesa[String(mesa.id)].total.toFixed(2) }}
                                </p>
                            </template>
                            <template v-else>
                                <p class="text-[9px] uppercase font-bold tracking-wider mt-0.5" :class="mesa.status_mesa === 'livre' ? 'text-[var(--text-muted)]' : 'text-red-500'">
                                    {{ mesa.status_mesa === 'livre' ? 'livre' : 'ocupada' }}
                                </p>
                            </template>
                        </div>
                    </button>
                </div>
            </section>
        </main>

        <div v-if="modal_nova_mesa" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div class="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl">
                <div class="flex justify-between items-center mb-5">
                    <h2 class="text-lg font-black text-gray-800">Nova Mesa</h2>
                    <button @click="modal_nova_mesa = false" class="text-gray-400 hover:text-red-500 font-bold text-xl">&times;</button>
                </div>
                <form @submit.prevent="adicionar_nova_mesa" class="flex flex-col gap-4">
                    <input v-model="input_nome_mesa" type="text" placeholder="Ex: Mesa 10, Bistro..." class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" required autofocus>
                    <button type="submit" class="w-full bg-nitec_blue hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-sm transition-all text-sm">
                        Criar Mesa
                    </button>
                </form>
            </div>
        </div>

        <div v-if="modal_visivel" class="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div class="bg-white w-full max-w-sm p-6 rounded-3xl shadow-2xl">
                <div class="mb-5">
                    <h2 class="text-lg font-black text-gray-800">Iniciar Atendimento</h2>
                    <p class="text-xs text-gray-500 mt-1">Mesa selecionada: <span class="font-bold text-nitec_blue">{{ mesa_em_abertura?.nome_mesa }}</span></p>
                </div>
                <div class="flex flex-col gap-4">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-bold text-gray-600">Nome do Cliente (opcional)</label>
                        <input v-model="input_nome_cliente" type="text" placeholder="Ex: Joao Silva" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" @keyup.enter="confirmar_abertura_comanda">
                    </div>
                    <div class="flex gap-3 mt-2">
                        <button @click="fechar_modal" class="flex-1 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors">Cancelar</button>
                        <button @click="confirmar_abertura_comanda" class="flex-1 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold shadow-sm transition-all text-sm">
                            Iniciar Mesa
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="modal_grade" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-[var(--bg-card)] w-full max-w-sm p-6 rounded-3xl shadow-2xl border border-[var(--border-subtle)]">
                <div class="flex justify-between items-center mb-5">
                    <h2 class="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">⊞ Configurar Grade</h2>
                    <button @click="modal_grade = false" class="text-[var(--text-muted)] hover:text-red-500 font-bold text-xl">×</button>
                </div>

                <div class="flex flex-col gap-5">
                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Colunas (X)</label>
                            <span class="text-xl font-black text-nitec_blue">{{ grade_colunas_temp }}</span>
                        </div>
                        <input v-model.number="grade_colunas_temp" type="range" min="1" max="20" step="1" class="w-full h-2 rounded-full accent-blue-600 cursor-pointer">
                        <div class="flex justify-between text-[9px] font-bold text-[var(--text-muted)] mt-1">
                            <span>1</span><span>5</span><span>10</span><span>15</span><span>20</span>
                        </div>
                    </div>

                    <div>
                        <div class="flex justify-between items-center mb-2">
                            <label class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">Linhas (Y)</label>
                            <span class="text-xl font-black text-nitec_blue">{{ grade_linhas_temp === 0 ? '∞' : grade_linhas_temp }}</span>
                        </div>
                        <input v-model.number="grade_linhas_temp" type="range" min="0" max="20" step="1" class="w-full h-2 rounded-full accent-blue-600 cursor-pointer">
                        <div class="flex justify-between text-[9px] font-bold text-[var(--text-muted)] mt-1">
                            <span>∞</span><span>5</span><span>10</span><span>15</span><span>20</span>
                        </div>
                        <p class="text-[10px] text-[var(--text-muted)] font-bold mt-1.5">0 = sem limite (mostra todas as mesas)</p>
                    </div>

                    <div class="bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] p-4 text-center">
                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-1">Previa</p>
                        <p class="text-3xl font-black text-[var(--text-primary)]">{{ grade_colunas_temp }} × {{ grade_linhas_temp || '∞' }}</p>
                        <p class="text-[10px] font-bold text-[var(--text-muted)] mt-0.5">
                            {{ grade_linhas_temp > 0 ? `max ${grade_colunas_temp * grade_linhas_temp} mesas visiveis` : 'todas as mesas' }}
                        </p>
                    </div>

                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] mb-2">Presets rapidos</p>
                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="p in [{c:4,l:3},{c:5,l:4},{c:6,l:0},{c:8,l:0},{c:10,l:0}]"
                                :key="`${p.c}x${p.l}`"
                                @click="grade_colunas_temp = p.c; grade_linhas_temp = p.l"
                                class="px-3 py-1.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-colors"
                                :class="grade_colunas_temp===p.c && grade_linhas_temp===p.l ? 'bg-nitec_blue text-white border-nitec_blue' : 'border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-nitec_blue hover:text-nitec_blue bg-[var(--bg-page)]'"
                            >
                                {{ p.c }}×{{ p.l || '∞' }}
                            </button>
                        </div>
                    </div>

                    <div class="flex gap-3 pt-2 border-t border-[var(--border-subtle)]">
                        <button
                            @click="modal_grade = false"
                            class="flex-1 py-3 rounded-xl border border-[var(--border-subtle)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            @click="salvar_grade(grade_colunas_temp, grade_linhas_temp)"
                            class="flex-[2] py-3 rounded-xl bg-nitec_blue text-white text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity shadow-sm"
                        >
                            Aplicar Grade
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div v-if="modal_qr_mesas" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4" @click.self="modal_qr_mesas = false">
            <div class="w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-[2rem] border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl p-6">
                <div class="flex items-center justify-between gap-3 mb-6">
                    <div>
                        <h2 class="text-xl font-black text-[var(--text-primary)]">QR Codes das Mesas</h2>
                        <p class="text-xs font-bold text-[var(--text-muted)] mt-1">Imprima ou compartilhe os links publicos do cardapio digital por mesa.</p>
                    </div>
                    <button @click="modal_qr_mesas = false" class="w-11 h-11 rounded-2xl bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xl font-black hover:text-red-500 transition-colors">
                        ×
                    </button>
                </div>

                <GaleriaQrMesas :mesas="lista_mesas" :mostrar_cabecalho="false" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useLogicaMesas } from './pagina_mesas_logica.js';
import { useCozinhaPolling } from '../composables/useCozinhaPolling.js';
import GaleriaQrMesas from './componentes_mesa_caixa/GaleriaQrMesas.vue';

const {
    lista_mesas,
    input_nome_mesa,
    adicionar_nova_mesa,
    selecionar_mesa,
    voltar_painel,
    modal_visivel,
    modal_qr_mesas,
    modal_nova_mesa,
    mesa_em_abertura,
    input_nome_cliente,
    fechar_modal,
    confirmar_abertura_comanda,
    mesa_carregando,
    info_por_mesa,
    grade_colunas,
    grade_linhas,
    modal_grade,
    salvar_grade,
} = useLogicaMesas();

const grade_colunas_temp = ref(5);
const grade_linhas_temp = ref(0);

const abrir_modal_grade = () => {
    grade_colunas_temp.value = grade_colunas.value;
    grade_linhas_temp.value = grade_linhas.value;
    modal_grade.value = true;
};

const { status_por_mesa: status_cozinha_mesas } = useCozinhaPolling();
</script>
