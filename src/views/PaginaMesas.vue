<template>
    <div class="tela_mesas p-6 bg-gray-50 h-full font-sans flex flex-col relative overflow-y-auto">
        
        <header class="cabecalho_pagina flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 shrink-0">
            <div>
                <h1 class="titulo_pagina text-2xl lg:text-3xl font-black text-gray-800 uppercase tracking-tighter">Mapa de Mesas</h1>
                <p class="subtitulo_pagina text-sm text-gray-500 font-medium">Controle de salão e comandas em tempo real</p>
            </div>
            
            <form @submit.prevent="adicionar_nova_mesa" class="formulario_mesa flex gap-3">
                <input v-model="input_nome_mesa" type="text" placeholder="Criar nova mesa..." class="campo_texto w-40 md:w-64 p-3 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-inner" required>
                <button type="submit" class="botao_add_mesa bg-blue-600 text-white px-5 py-3 rounded-xl font-black hover:bg-blue-700 transition-colors shadow-md transform active:scale-95">
                    + CADASTRAR
                </button>
            </form>

            <button @click="voltar_painel" class="md:hidden botao_voltar bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md ml-6">
                ⬅ Voltar
            </button>
        </header>

        <main class="area_principal flex flex-col gap-6 flex-1">
            <section class="secao_balcao flex justify-center">
                <button @click="iniciar_venda_balcao" class="botao_balcao w-full max-w-3xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white p-6 rounded-3xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-6 border border-blue-400">
                    <span class="icone_balcao text-5xl filter drop-shadow-md">🚶</span>
                    <div class="texto_botao text-left">
                        <h2 class="titulo_balcao text-2xl font-black uppercase tracking-widest text-white">Venda de Balcão (Caixa Rápido)</h2>
                        <p class="desc_balcao text-blue-100 text-sm font-medium">Iniciar venda direta sem vincular a uma mesa.</p>
                    </div>
                </button>
            </section>
            
            <div class="divisor border-t-2 border-dashed border-gray-200 w-full max-w-5xl mx-auto my-2 shrink-0"></div>
            
            <section class="secao_grelha_mesas flex-1">
                <div class="grelha_layout grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 pb-6">
                    <button v-for="mesa in lista_mesas" :key="mesa.id" @click="selecionar_mesa(mesa)" :class="['cartao_mesa p-6 rounded-3xl shadow-sm hover:shadow-xl border-b-[6px] flex flex-col items-center justify-center transition-all transform active:scale-95 bg-white relative overflow-hidden', mesa.status_mesa === 'livre' ? 'border-green-500 hover:border-green-600 group' : 'border-red-500 hover:border-red-600 opacity-90']">
                        <div class="indicador_topo absolute top-0 left-0 w-full h-1" :class="mesa.status_mesa === 'livre' ? 'bg-green-500' : 'bg-red-500'"></div>
                        
                        <svg v-if="mesa_carregando === mesa.id" class="animate-spin h-10 w-10 text-red-500 mb-3 mt-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span v-else class="icone_mesa text-5xl mb-3 transition-transform" :class="mesa.status_mesa === 'livre' ? 'text-green-500 group-hover:scale-110' : 'text-red-500'">🍽️</span>
                        
                        <span class="nome_mesa text-lg font-black text-gray-800 text-center leading-tight">{{ mesa.nome_mesa }}</span>
                        <span class="status_texto text-[10px] uppercase font-black mt-3 px-4 py-1.5 rounded-full tracking-widest border" :class="mesa.status_mesa === 'livre' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'">{{ mesa.status_mesa }}</span>
                    </button>
                </div>
            </section>
        </main>

        <div v-if="modal_visivel" class="modal_backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
            <div class="modal_conteudo bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl transform scale-100 transition-transform">
                <div class="modal_cabecalho text-center mb-6">
                    <div class="icone_modal text-6xl mb-2">🍽️</div>
                    <h2 class="titulo_modal text-2xl font-black text-gray-800 uppercase tracking-tight">
                        Abrir {{ mesa_em_abertura?.nome_mesa }}
                    </h2>
                    <p class="subtitulo_modal text-sm text-gray-500 mt-1">Iniciar atendimento e criar primeira comanda</p>
                </div>
                <div class="modal_corpo flex flex-col gap-4">
                    <label class="rotulo block text-sm font-bold text-gray-700">Nome do Cliente (Opcional)</label>
                    <input v-model="input_nome_cliente" type="text" placeholder="Ex: João Silva" class="campo_texto w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 focus:bg-white transition-colors text-lg font-medium" @keyup.enter="confirmar_abertura_comanda">
                </div>
                <div class="modal_rodape flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
                    <button @click="fechar_modal" class="botao_cancelar w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button @click="confirmar_abertura_comanda" class="botao_confirmar w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-transform transform active:scale-95 uppercase tracking-wider flex items-center justify-center gap-2">
                        <span>🚀</span> Iniciar Mesa
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useLogicaMesas } from './pagina_mesas_logica.js';
const { lista_mesas, input_nome_mesa, adicionar_nova_mesa, selecionar_mesa, iniciar_venda_balcao, voltar_painel, modal_visivel, mesa_em_abertura, input_nome_cliente, fechar_modal, confirmar_abertura_comanda, mesa_carregando } = useLogicaMesas();
</script>