<template>
    <div class="tela_mesas p-6 md:p-8 bg-[var(--bg-page)] h-full font-sans flex flex-col relative overflow-y-auto transition-colors duration-300">
        
        <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 shrink-0">
            <div>
                <h1 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Mapa de Mesas</h1>
                <p class="text-sm text-[var(--text-muted)] mt-1">Gestão de salão e comandas em tempo real.</p>
            </div>
            
            <div class="flex gap-3 w-full md:w-auto">
                <button @click="voltar_painel" class="md:hidden px-5 py-2.5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-card-hover)] text-sm font-bold transition-all flex-1">
                    Voltar
                </button>
                <button @click="modal_nova_mesa = true" class="px-5 py-2.5 bg-nitec_blue text-white rounded-lg hover:bg-blue-600 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none">
                    <span>➕</span> Nova Mesa
                </button>
            </div>
        </header>

        <main class="area_principal flex flex-col gap-6 flex-1">
            
            <section class="secao_balcao shrink-0">
                <button @click="iniciar_venda_balcao" class="w-full bg-[var(--bg-card)] border border-[var(--border-subtle)] p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-500/10 text-nitec_blue rounded-xl flex items-center justify-center text-xl font-black group-hover:scale-110 transition-transform">
                            🛒
                        </div>
                        <div class="text-left">
                            <h2 class="text-base font-black text-[var(--text-primary)] uppercase tracking-tight">Venda Balcão (Caixa Rápido)</h2>
                            <p class="text-xs text-[var(--text-muted)] font-medium mt-0.5">Lançamento direto sem vincular a uma mesa.</p>
                        </div>
                    </div>
                    <span class="text-nitec_blue font-bold text-sm hidden sm:block bg-blue-500/10 px-3 py-1 rounded-lg group-hover:bg-blue-500/20 transition-colors">Iniciar &rarr;</span>
                </button>
            </section>
            
            <section class="secao_grelha_mesas flex-1">
                <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-6">
                    <button v-for="mesa in lista_mesas" :key="mesa.id" @click="selecionar_mesa(mesa)" 
                            class="p-5 rounded-2xl transition-all transform active:scale-95 bg-[var(--bg-card)] relative flex flex-col items-start justify-between h-32 group border"
                            :class="mesa.status_mesa === 'livre' ? 'border-[var(--border-subtle)] hover:border-green-500 shadow-sm hover:shadow-md' : 'border-red-500/50 bg-red-500/5 shadow-sm opacity-95'">
                        
                        <div class="w-full flex justify-between items-center mb-2">
                            <span class="w-3 h-3 rounded-full shadow-sm" :class="mesa.status_mesa === 'livre' ? 'bg-green-500' : 'bg-red-500 animate-pulse'"></span>
                            <svg v-if="mesa_carregando === mesa.id" class="animate-spin h-5 w-5 text-nitec_blue" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        
                        <div class="text-left w-full mt-auto">
                            <h3 class="text-lg font-black text-[var(--text-primary)] leading-tight truncate">{{ mesa.nome_mesa }}</h3>
                            <p class="text-[10px] uppercase font-bold tracking-widest mt-1" :class="mesa.status_mesa === 'livre' ? 'text-[var(--text-muted)]' : 'text-red-500'">
                                {{ mesa.status_mesa === 'livre' ? 'Disponível' : 'Ocupada' }}
                            </p>
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
                    <input v-model="input_nome_mesa" type="text" placeholder="Ex: Mesa 10, Bistrô..." class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-sm" required autofocus>
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
                        <label class="text-xs font-bold text-gray-600">Nome do Cliente (Opcional)</label>
                        <input v-model="input_nome_cliente" type="text" placeholder="Ex: João Silva" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm" @keyup.enter="confirmar_abertura_comanda">
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
    </div>
</template>

<script setup>
import { useLogicaMesas } from './pagina_mesas_logica.js';
const { 
    lista_mesas, input_nome_mesa, adicionar_nova_mesa, selecionar_mesa, 
    iniciar_venda_balcao, voltar_painel, modal_visivel, modal_nova_mesa, 
    mesa_em_abertura, input_nome_cliente, fechar_modal, confirmar_abertura_comanda, mesa_carregando 
} = useLogicaMesas();
</script>