<template>
    <div class="painel_principal flex flex-col h-screen bg-gray-100 font-sans relative">
        
        <div v-if="em_modo_suporte" class="bg-red-600 text-white p-3 flex justify-between items-center shadow-md z-50 rounded-b-lg mb-2">
            <div class="flex items-center gap-3">
                <span class="text-xl">⚠️</span>
                <p class="text-sm font-bold uppercase tracking-wider">
                    Modo de Suporte Ativo: 122Visualizando dados de <span class="text-yellow-300">{{ nome_cliente }}</span>
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

                <template v-if="['admin_master', 'dono', 'caixa', 'garcom'].includes(auth_store.usuario_logado?.tipo_usuario) || em_modo_suporte">
                    
                    <button @click="ir_para('/mapa-mesas')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                        <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-500 transition-colors">
                            <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🪑</span>
                        </div>
                        <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Mapa de Mesas</h3>
                        <p class="desc_card text-sm text-gray-500 mt-2 text-center">Gestão de ocupação e comandas</p>
                    </button>

                    <button v-if="['admin_master', 'dono', 'caixa'].includes(auth_store.usuario_logado?.tipo_usuario) || em_modo_suporte" @click="ir_para('/pdv-caixa')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                        <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-500 transition-colors">
                            <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">💰</span>
                        </div>
                        <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Frente de Caixa</h3>
                        <p class="desc_card text-sm text-gray-500 mt-2 text-center">Vendas rápidas e recebimentos</p>
                    </button>

                    <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario) || em_modo_suporte" @click="ir_para('/produtos')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                        <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-500 transition-colors">
                            <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">📦</span>
                        </div>
                        <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Produtos</h3>
                        <p class="desc_card text-sm text-gray-500 mt-2 text-center">Estoque e cardápio digital</p>
                    </button>

                </template>

                <button @click="abrir_modal_atualizacoes" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95 relative overflow-hidden">
                    
                    <span v-if="tem_atualizacao_nova" class="absolute top-4 left-4 flex h-5 w-5 z-10">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-5 w-5 bg-red-500 border-2 border-white"></span>
                    </span>

                    <div class="icone_fundo bg-green-50 p-6 rounded-2xl mb-4 group-hover:bg-green-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🔄</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Atualizações</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">
                        {{ tem_atualizacao_nova ? 'Novidade disponível!' : 'Versão e novidades do sistema' }}
                    </p>
                    
                    <span class="absolute top-4 right-4 bg-gray-100 text-gray-600 text-[11px] font-black uppercase px-2 py-1 rounded-md border border-gray-300">
                        v{{ versao_atual }}
                    </span>
                </button>

            </div>
        </main>

        <div v-if="modal_visivel" class="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md border-t-4 border-green-500 flex flex-col max-h-[90vh]">
                
                <div class="text-center mb-4 shrink-0">
                    <span class="text-6xl mb-2 block">🚀</span>
                    <h2 class="text-2xl font-black text-gray-800 uppercase italic">Central de Atualização</h2>
                </div>

                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4 text-center min-h-[80px] flex flex-col justify-center shrink-0">
                    <p class="text-sm font-bold" :class="status_erro ? 'text-red-500' : 'text-gray-700'">{{ mensagem_status }}</p>
                    <div v-if="progresso > 0 && progresso < 100" class="w-full bg-gray-200 rounded-full h-2.5 mt-4 overflow-hidden">
                        <div class="bg-green-500 h-2.5 rounded-full transition-all duration-300" :style="`width: ${progresso}%`"></div>
                    </div>
                </div>

                <div class="flex flex-col gap-3 shrink-0">
                    <button v-if="estado_atualizacao === 'parado' || estado_atualizacao === 'atualizado'" @click="checar_atualizacoes" class="w-full bg-nitec_dark hover:bg-black text-white font-black py-3 rounded-xl shadow-lg transition-all uppercase text-sm">
                        🔍 Procurar Novidades
                    </button>
                    <button v-if="estado_atualizacao === 'disponivel'" @click="baixar_atualizacao" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-lg transition-all uppercase text-sm animate-pulse">
                        ⬇️ Instalar Versão {{ versao_nova }}
                    </button>
                    <button v-if="estado_atualizacao === 'pronto'" @click="instalar_atualizacao" class="w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-lg transition-all uppercase text-sm animate-pulse">
                        🔄 Reiniciar e Atualizar
                    </button>
                </div>

                <div class="mt-6 border-t border-gray-200 pt-4 flex-1 overflow-hidden flex flex-col">
                    <h3 class="text-xs font-black text-gray-400 uppercase mb-3 flex items-center justify-between">
                        <span>Histórico de Lançamentos</span>
                        <span v-if="carregando_historico" class="animate-spin">⏳</span>
                    </h3>
                    
                    <div class="overflow-y-auto pr-2 space-y-2 pb-2">
                        <div v-for="versao in historico_versoes" :key="versao.id" class="flex justify-between items-center bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-gray-300 transition-all">
                            <div>
                                <span class="font-black text-sm text-gray-800">{{ versao.tag_name }}</span>
                                <span v-if="versao.tag_name === 'v' + versao_atual" class="ml-2 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-md font-black uppercase">Instalada</span>
                            </div>
                            
                            <button v-if="versao.tag_name !== 'v' + versao_atual && versao.assets.length > 0" 
                                    @click="baixar_versao_antiga(versao.assets[0].browser_download_url)" 
                                    class="text-[10px] text-nitec_blue hover:bg-blue-50 font-black px-3 py-1.5 border border-gray-200 rounded-lg transition-colors uppercase">
                                Baixar
                            </button>
                        </div>
                    </div>
                </div>

                <button @click="fechar_modal" class="text-xs text-gray-400 font-bold uppercase hover:text-red-500 transition-colors mt-4 text-center w-full shrink-0">
                    Fechar Janela
                </button>
            </div>
        </div>
        
        <footer class="rodape_infos bg-white border-t border-gray-200 p-4 text-center">
            <p class="copyright_texto text-[10px] text-gray-400 uppercase tracking-widest font-bold">Nitec Tecnologia &copy; 2026 - Todos os direitos reservados</p>
        </footer>
    </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth_store.js'; 
import { useLogicaDashboard } from './pagina_dashboard_logica.js';

const auth_store = useAuthStore(); 

const { 
    nome_cliente, em_modo_suporte, ir_para, sair, encerrar_suporte,
    versao_atual, modal_visivel, estado_atualizacao, mensagem_status, 
    progresso, versao_nova, status_erro, tem_atualizacao_nova, historico_versoes, carregando_historico,
    abrir_modal_atualizacoes, fechar_modal, checar_atualizacoes, 
    baixar_atualizacao, instalar_atualizacao, baixar_versao_antiga
} = useLogicaDashboard();
</script>