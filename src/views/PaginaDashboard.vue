<template>
    <div class="painel_principal flex flex-col h-screen bg-gray-100 font-sans relative overflow-hidden">
        
        <div v-if="em_modo_suporte" class="bg-red-600 text-white p-3 flex justify-between items-center shadow-md z-50">
            <div class="flex items-center gap-3">
                <span class="text-xl">⚠️</span>
                <p class="text-sm font-bold uppercase tracking-wider">
                    Modo Suporte: <span class="text-yellow-300">{{ nome_cliente }}</span>
                </p>
            </div>
            <button @click="encerrar_suporte" class="bg-white text-red-600 hover:bg-gray-100 px-4 py-1 rounded-lg text-xs font-black uppercase shadow-sm">
                Sair
            </button>
        </div>

        <header class="barra_topo bg-nitec_dark text-white p-4 lg:p-5 flex justify-between items-center shadow-lg z-40">
            <div class="logo_secao">
                <h1 class="texto_logo text-xl lg:text-2xl font-black tracking-tighter uppercase text-nitec_blue cursor-pointer" @click="ir_para('/painel-central')">NitecSystem</h1>
                
                <div class="flex items-center gap-2 mt-1">
                    <span v-if="!esta_offline" class="flex h-2.5 w-2.5 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                    </span>
                    <span v-else class="flex h-2.5 w-2.5 relative">
                        <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                    </span>
                    <p :class="esta_offline ? 'text-red-400 animate-pulse' : 'text-green-400'" class="status_sistema text-[10px] font-bold uppercase tracking-wider">
                        {{ esta_offline ? 'Modo Offline (Gravando no PC)' : 'Sistema Online' }}
                    </p>
                </div>
            </div>
            
            <div class="perfil_usuario flex items-center gap-4 bg-white/5 p-2 px-4 rounded-2xl border border-white/10">
                <div class="info_texto text-right hidden sm:block">
                    <p class="nome_user text-sm font-black uppercase italic">{{ auth_store.usuario_logado?.nome }}</p>
                    <p class="cargo_user text-[10px] text-nitec_blue font-bold uppercase tracking-widest">{{ auth_store.usuario_logado?.tipo_usuario }}</p>
                </div>
                <button @click="sair" class="botao_sair text-red-400 hover:text-red-500 hover:bg-red-500/20 p-2 rounded-xl transition-all">
                    <span class="text-xl block">🚪</span>
                </button>
            </div>
        </header>

        <div class="hidden md:flex bg-white border-b border-gray-200 px-6 pt-4 gap-2 shadow-sm z-30 overflow-x-auto">
            
            <button @click="ir_para('/pdv-caixa')" 
                    :class="rota_atual.path.includes('/pdv-caixa') ? 'bg-blue-50 text-blue-700 border-blue-500 border-b-0' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'"
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2">
                <span>💰</span> PDV / Caixa
            </button>

            <button @click="ir_para('/mapa-mesas')" 
                    :class="rota_atual.path.includes('/mapa-mesas') || rota_atual.path.includes('/mesa') ? 'bg-blue-50 text-blue-700 border-blue-500 border-b-0' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'"
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2">
                <span>🪑</span> Mesas
            </button>
            
            <button @click="ir_para('/comandas')" 
                    :class="rota_atual.path.includes('/comandas') ? 'bg-blue-50 text-blue-700 border-blue-500 border-b-0' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'"
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2">
                <span>📝</span> Comandas
            </button>

            <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario)" @click="ir_para('/produtos')" 
                    :class="rota_atual.path.includes('/produtos') ? 'bg-blue-50 text-blue-700 border-blue-500 border-b-0' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'"
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2 ml-4">
                <span>📦</span> Produtos
            </button>

            <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario)" @click="ir_para('/equipe')" 
                    :class="rota_atual.path.includes('/equipe') ? 'bg-blue-50 text-blue-700 border-blue-500 border-b-0' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'"
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2">
                <span>👥</span> Equipa
            </button>

            <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario)" @click="ir_para('/analises')" 
                    :class="rota_atual.path.includes('/analises') ? 'bg-blue-50 text-blue-700 border-blue-500 border-b-0' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'"
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2">
                <span>📈</span> Análises
            </button>

            <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario)" @click="ir_para('/permissoes')" 
                    :class="rota_atual.path.includes('/permissoes') ? 'bg-blue-50 text-blue-700 border-blue-500 border-b-0' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'"
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2">
                <span>🔐</span> Permissões
            </button>

            <div class="flex-1"></div> 

            <button v-if="auth_store.usuario_logado?.tipo_usuario === 'admin_master'" @click="ir_para('/admin-estabelecimentos')" 
                    class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider border-t-2 border-l-2 border-r-2 transition-all flex items-center gap-2 bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 mr-2">
                <span>⚙️</span> Gestão SaaS
            </button>
            
            <button @click="abrir_modal_atualizacoes" class="px-6 py-3 rounded-t-xl font-black uppercase text-xs tracking-wider bg-gray-50 text-gray-500 hover:bg-green-50 transition-all flex items-center gap-2 relative">
                 <span v-if="tem_atualizacao_nova" class="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-ping"></span>
                <span>🔄</span>
            </button>
        </div>

        <main class="conteudo_principal flex-1 bg-gray-100 flex flex-col md:overflow-hidden overflow-y-auto">
            
            <div v-if="rota_atual.path === '/painel-central'" class="md:hidden p-4 grid grid-cols-1 sm:grid-cols-2 gap-4 shrink-0">
                <button @click="ir_para('/pdv-caixa')" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <span class="text-4xl mb-2">💰</span><h3 class="font-black text-gray-800 uppercase text-sm">PDV / Caixa</h3>
                </button>
                <button @click="ir_para('/mapa-mesas')" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <span class="text-4xl mb-2">🪑</span><h3 class="font-black text-gray-800 uppercase text-sm">Mesas</h3>
                </button>
                <button @click="ir_para('/comandas')" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <span class="text-4xl mb-2">📝</span><h3 class="font-black text-gray-800 uppercase text-sm">Comandas</h3>
                </button>
                <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario)" @click="ir_para('/produtos')" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <span class="text-4xl mb-2">📦</span><h3 class="font-black text-gray-800 uppercase text-sm">Produtos</h3>
                </button>
                <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario)" @click="ir_para('/equipe')" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <span class="text-4xl mb-2">👥</span><h3 class="font-black text-gray-800 uppercase text-sm">Equipa</h3>
                </button>
                <button v-if="['admin_master', 'dono'].includes(auth_store.usuario_logado?.tipo_usuario)" @click="ir_para('/analises')" class="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 flex flex-col items-center">
                    <span class="text-4xl mb-2">📈</span><h3 class="font-black text-gray-800 uppercase text-sm">Análises</h3>
                </button>
                
                <button v-if="auth_store.usuario_logado?.tipo_usuario === 'admin_master'" @click="ir_para('/admin-estabelecimentos')" class="bg-purple-50 p-6 rounded-2xl shadow-sm border border-purple-200 flex flex-col items-center sm:col-span-2">
                    <span class="text-4xl mb-2">⚙️</span><h3 class="font-black text-purple-800 uppercase text-sm">Gestão SaaS</h3>
                </button>
            </div>

            <div class="flex-1 w-full h-full relative">
                <router-view v-slot="{ Component }">
                    <keep-alive>
                        <component :is="Component" />
                    </keep-alive>
                </router-view>

                <div v-if="auth_store.usuario_logado?.tipo_usuario === 'admin_master' && !['/painel-central', '/admin-estabelecimentos'].includes(rota_atual.path)" 
                     class="absolute inset-0 z-50 flex items-center justify-center bg-white/40 backdrop-blur-[3px]">
                    
                    <div class="bg-white border-2 border-purple-200 p-8 rounded-3xl shadow-2xl text-center max-w-sm transform transition-all">
                        <h2 class="text-lg font-black uppercase text-purple-800 tracking-tight">Modo de Visualização</h2>
                        <p class="text-sm text-gray-500 mt-2 font-bold">A conta Admin Master não permite operação de vendas.</p>
                        <p class="text-xs text-gray-400 mt-3 bg-gray-50 py-2 rounded-lg border border-gray-100">
                            Acesse a conta de um cliente pelo Modo Suporte para interagir.
                        </p>
                    </div>

                </div>
            </div>

        </main>
        
        <footer class="rodape_infos bg-white border-t border-gray-200 p-2 text-center z-30 shrink-0">
            <p class="text-[10px] text-gray-400 uppercase font-bold">Nitec Tecnologia &copy; 2026</p>
        </footer>

        <div v-if="modal_visivel" class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-center items-center p-4">
            <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div class="p-6 bg-nitec_dark text-white flex justify-between items-center">
                    <h2 class="text-xl font-black uppercase tracking-tight">Central de Atualizações</h2>
                    <button @click="fechar_modal" class="text-gray-400 hover:text-white font-bold text-2xl transition-colors">&times;</button>
                </div>
                <div class="p-6 overflow-y-auto flex-1">
                    <div class="mb-6 p-5 rounded-2xl border" :class="status_erro ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'">
                        <p class="text-sm font-bold text-gray-700 uppercase">Versão do Sistema: <span class="text-nitec_blue font-black">{{ versao_atual }}</span></p>
                        <p class="text-xs mt-2 text-gray-600">{{ mensagem_status }}</p>
                        
                        <div v-if="estado_atualizacao === 'baixando'" class="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden">
                            <div class="bg-nitec_blue h-full rounded-full transition-all duration-300" :style="{ width: progresso + '%' }"></div>
                        </div>

                        <div class="mt-5 flex gap-3">
                            <button v-if="estado_atualizacao === 'parado' || estado_atualizacao === 'erro'" @click="checar_atualizacoes" class="bg-nitec_blue text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-blue-700 shadow-md transition-all active:scale-95">
                                Verificar Agora
                            </button>
                            <button v-if="estado_atualizacao === 'disponivel'" @click="baixar_atualizacao" class="bg-green-500 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-green-600 shadow-md transition-all active:scale-95">
                                Baixar v{{ versao_nova }}
                            </button>
                            <button v-if="estado_atualizacao === 'baixado'" @click="instalar_atualizacao" class="bg-purple-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-purple-700 shadow-md transition-all active:scale-95">
                                Reiniciar e Instalar
                            </button>
                        </div>
                    </div>

                    <h3 class="font-black text-gray-800 uppercase text-sm mb-4">Histórico de Lançamentos</h3>
                    <div v-if="carregando_historico" class="text-center py-6 text-xs text-gray-500 font-bold animate-pulse">Buscando histórico...</div>
                    <div v-else class="space-y-3">
                        <div v-for="versao in historico_versoes" :key="versao.id" class="p-4 border border-gray-100 rounded-xl flex justify-between items-center hover:bg-gray-50 transition-colors">
                            <div>
                                <p class="font-black text-sm text-gray-800">{{ versao.name || versao.tag_name }}</p>
                                <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{{ new Date(versao.published_at).toLocaleDateString() }}</p>
                            </div>
                            <button v-if="versao.assets && versao.assets.length > 0" @click="baixar_versao_antiga(obter_link_executavel(versao.assets))" class="text-[10px] text-nitec_blue hover:bg-blue-50 font-black px-4 py-2 border border-blue-100 rounded-lg transition-colors uppercase">Baixar .EXE</button>
                        </div>
                        <div v-if="historico_versoes.length === 0 && !carregando_historico" class="text-center text-xs text-gray-400 italic">Nenhum histórico disponível.</div>
                    </div>
                </div>
                <div class="p-4 border-t border-gray-100 text-center bg-gray-50">
                     <button @click="fechar_modal" class="text-xs text-gray-400 font-bold uppercase hover:text-red-500 transition-colors tracking-widest">Fechar Janela</button>
                </div>
            </div>
        </div>

        <Teleport to="body">
            <transition 
                enter-active-class="transition ease-out duration-300"
                enter-from-class="opacity-0 -translate-y-10"
                enter-to-class="opacity-100 translate-y-0"
                leave-active-class="transition ease-in duration-200"
                leave-from-class="opacity-100 translate-y-0"
                leave-to-class="opacity-0 -translate-y-10">
                
                <div v-if="toast_store.visivel" 
                     :class="toast_store.tipo === 'sucesso' ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'"
                     class="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-white/20">
                    <span class="text-2xl">{{ toast_store.tipo === 'sucesso' ? '✅' : '❌' }}</span>
                    <p class="font-black uppercase text-xs tracking-widest">{{ toast_store.mensagem }}</p>
                </div>
            </transition>
        </Teleport>

    </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth_store.js'; 
import { useLogicaDashboard } from './pagina_dashboard_logica.js';
import { useToastStore } from '../stores/toast_store.js'; 

const toast_store = useToastStore(); 
const auth_store = useAuthStore(); 
const { 
    nome_cliente, em_modo_suporte, ir_para, sair, encerrar_suporte,
    versao_atual, modal_visivel, estado_atualizacao, mensagem_status, 
    progresso, versao_nova, status_erro, tem_atualizacao_nova, historico_versoes, carregando_historico,
    abrir_modal_atualizacoes, fechar_modal, checar_atualizacoes, 
    baixar_atualizacao, instalar_atualizacao, baixar_versao_antiga,
    obter_link_executavel, // 🟢 Certificando de que está exposto
    esta_offline, rota_atual
} = useLogicaDashboard();
</script>