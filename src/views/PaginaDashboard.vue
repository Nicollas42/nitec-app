<template>
    <div class="painel_principal flex flex-col h-screen bg-gray-100 font-sans relative">
        
        <div v-if="em_modo_suporte" class="bg-red-600 text-white p-3 flex justify-between items-center shadow-md z-50 rounded-b-lg mb-2">
            <div class="flex items-center gap-3">
                <span class="text-xl">⚠️</span>
                <p class="text-sm font-bold uppercase tracking-wider">
                    Modo de Suporte Ativo: Visualizando dados de <span class="text-yellow-300">{{ nome_cliente }}</span>
                </p>
            </div>
            <button @click="encerrar_suporte" class="bg-white text-red-600 hover:bg-gray-100 px-4 py-2 rounded-lg text-xs font-black uppercase transition-all shadow-sm">
                Sair do Suporte
            </button>
        </div>

        <header class="barra_topo bg-nitec_dark text-white p-5 flex justify-between items-center shadow-lg">
            <div class="logo_secao">
                <h1 class="texto_logo text-2xl font-black tracking-tighter uppercase text-nitec_blue">NitecSystem</h1>
                <p class="status_sistema text-xs text-green-400 font-bold uppercase">● Sistema Online</p>
            </div>
            
            <div class="perfil_usuario flex items-center gap-4 bg-white/5 p-2 px-4 rounded-2xl border border-white/10">
                <div class="info_texto text-right">
                    <p class="nome_user text-sm font-black uppercase italic">{{ auth_store.usuario_logado?.nome }}</p>
                    <p class="cargo_user text-[10px] text-nitec_blue font-bold uppercase tracking-widest">{{ auth_store.usuario_logado?.tipo_usuario }}</p>
                </div>
                <button @click="sair" class="botao_sair bg-red-500/20 hover:bg-red-500 p-2 rounded-xl transition-all group">
                    <span class="text-xl group-hover:scale-110 block">🚪</span>
                </button>
            </div>
        </header>

        <main class="conteudo_principal flex-1 p-8 overflow-y-auto">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                
                <button v-if="auth_store.usuario_logado?.tipo_usuario === 'admin_master'" 
                        @click="ir_para('/admin-estabelecimentos')" 
                        class="card_modulo bg-nitec_dark p-8 rounded-3xl shadow-sm hover:shadow-2xl border-2 border-nitec_blue transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-nitec_blue p-6 rounded-2xl mb-4 shadow-lg shadow-nitec_blue/20">
                        <span class="text-5xl">🏢</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-white uppercase italic">Gestão SaaS</h3>
                    <p class="desc_card text-sm text-gray-400 mt-2 text-center">Provisionar e gerir bares/quiosques</p>
                </button>

                <template v-if="['dono', 'caixa', 'garcom'].includes(auth_store.usuario_logado?.tipo_usuario) || em_modo_suporte">
                    
                    <button @click="ir_para('/mapa-mesas')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                        <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-500 transition-colors">
                            <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🪑</span>
                        </div>
                        <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Mapa de Mesas</h3>
                        <p class="desc_card text-sm text-gray-500 mt-2 text-center">Gestão de ocupação e comandas</p>
                    </button>

                    <button v-if="auth_store.usuario_logado?.tipo_usuario !== 'garcom'" @click="ir_para('/pdv-caixa')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                        <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-500 transition-colors">
                            <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">💰</span>
                        </div>
                        <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Frente de Caixa</h3>
                        <p class="desc_card text-sm text-gray-500 mt-2 text-center">Vendas rápidas e recebimentos</p>
                    </button>

                    <button v-if="auth_store.usuario_logado?.tipo_usuario === 'dono' || em_modo_suporte" @click="ir_para('/produtos')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                        <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-500 transition-colors">
                            <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">📦</span>
                        </div>
                        <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Produtos</h3>
                        <p class="desc_card text-sm text-gray-500 mt-2 text-center">Estoque e cardápio digital</p>
                    </button>

                </template>

                <button @click="abrir_modal_atualizacoes" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95 relative overflow-hidden">
                    <div class="icone_fundo bg-green-50 p-6 rounded-2xl mb-4 group-hover:bg-green-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🔄</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Atualizações</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Versão e novidades do sistema</p>
                    
                    <span class="absolute top-4 right-4 bg-gray-100 text-gray-400 text-[10px] font-black uppercase px-2 py-1 rounded-md border border-gray-200">
                        v{{ versao_atual }}
                    </span>
                </button>

            </div>
        </main>

        <div v-if="modal_visivel" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div class="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-green-500 transform transition-all">
                <div class="text-center mb-6">
                    <span class="text-6xl mb-2 block">🚀</span>
                    <h2 class="text-2xl font-black text-gray-800 uppercase italic">Central de Atualização</h2>
                    <p class="text-sm text-gray-500 mt-1">Verifique se há novas funcionalidades</p>
                </div>

                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-6 text-center min-h-[80px] flex flex-col justify-center">
                    <p class="text-sm font-bold" :class="status_erro ? 'text-red-500' : 'text-gray-700'">{{ mensagem_status }}</p>
                    
                    <div v-if="progresso > 0 && progresso < 100" class="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
                        <div class="bg-green-500 h-2.5 rounded-full transition-all duration-300" :style="`width: ${progresso}%`"></div>
                    </div>
                </div>

                <div class="flex flex-col gap-3">
                    <button v-if="estado_atualizacao === 'parado' || estado_atualizacao === 'atualizado'" @click="checar_atualizacoes" class="w-full bg-nitec_dark hover:bg-black text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase">
                        🔍 Procurar Atualizações
                    </button>

                    <button v-if="estado_atualizacao === 'disponivel'" @click="baixar_atualizacao" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase">
                        ⬇️ Baixar Versão {{ versao_nova }}
                    </button>

                    <button v-if="estado_atualizacao === 'pronto'" @click="instalar_atualizacao" class="w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase animate-pulse">
                        🔄 Reiniciar e Instalar
                    </button>

                    <button @click="fechar_modal" class="text-xs text-gray-400 font-bold uppercase hover:text-red-500 transition-colors mt-2 text-center w-full">
                        Fechar Janela
                    </button>
                </div>
            </div>
        </div>
        
        <footer class="rodape_infos bg-white border-t border-gray-200 p-4 text-center">
            <p class="copyright_texto text-[10px] text-gray-400 uppercase tracking-widest font-bold">Nitec Tecnologia &copy; 2026 - Todos os direitos reservados</p>
        </footer>
    </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth_store.js'; // ISSO FALTAVA E FAZIA OS V-IF FALHAREM
import { useLogicaDashboard } from './pagina_dashboard_logica.js';

const auth_store = useAuthStore(); // ISSO FALTAVA E FAZIA OS V-IF FALHAREM

const { 
    // Dados Gerais
    nome_cliente, em_modo_suporte, ir_para, sair, encerrar_suporte,
    
    // Dados de Atualização
    versao_atual, modal_visivel, estado_atualizacao, mensagem_status, 
    progresso, versao_nova, status_erro, 
    abrir_modal_atualizacoes, fechar_modal, checar_atualizacoes, 
    baixar_atualizacao, instalar_atualizacao
} = useLogicaDashboard();
</script>