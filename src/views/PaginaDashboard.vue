<template>
    <div class="painel_principal flex flex-col h-screen bg-gray-100 font-sans">
        
        <header class="barra_topo bg-nitec_dark text-white p-5 flex justify-between items-center shadow-lg">
            <div class="logo_secao">
                <h1 class="texto_logo text-2xl font-black tracking-tighter uppercase text-nitec_blue">NitecSystem</h1>
                <p class="status_sistema text-xs text-green-400 font-bold uppercase">● Sistema Online</p>
            </div>
            
            <div class="perfil_usuario flex items-center gap-4 bg-black/20 p-2 rounded-xl border border-white/10">
                <div class="dados_texto text-right">
                    <p class="nome_usuario font-bold">{{ usuario_nome }}</p>
                    <p class="cargo_usuario text-[10px] uppercase tracking-widest text-nitec_blue">{{ usuario_cargo }}</p>
                </div>
                <button @click="realizar_logout" class="botao_sair bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-2 rounded-lg transition-all border border-red-600/30">
                    Sair
                </button>
            </div>
        </header>

        <main class="area_central flex-1 p-8 overflow-y-auto">
            <div class="container_botoes max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                
                <button @click="ir_para('/mapa-mesas')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-orange-50 p-6 rounded-2xl mb-4 group-hover:bg-orange-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🍽️</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Mesas</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Gerir ocupação e comandas</p>
                </button>

                <button @click="ir_para('/pdv-caixa')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-600 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🛒</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Caixa Livre</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Vendas rápidas e pagamentos</p>
                </button>

                <button @click="ir_para('/produtos')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-green-50 p-6 rounded-2xl mb-4 group-hover:bg-green-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">📦</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Produtos</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Gestão de estoque e preços</p>
                </button>

                <button @click="ir_para('/financeiro')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-purple-50 p-6 rounded-2xl mb-4 group-hover:bg-purple-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">💰</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Financeiro</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Fluxo de caixa e relatórios</p>
                </button>

                <button @click="ir_para('/gestao-comandas')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-indigo-50 p-6 rounded-2xl mb-4 group-hover:bg-indigo-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">📋</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Comandas</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Histórico e auditoria de contas</p>
                </button>

            </div>
        </main>
        
        <footer class="rodape_infos bg-white border-t border-gray-200 p-4 text-center">
            <p class="copyright_texto text-[10px] text-gray-400 uppercase tracking-widest font-bold">Nitec Tecnologia &copy; 2026 - Todos os direitos reservados</p>
        </footer>
    </div>
</template>

<script setup>
import { useLogicaDashboard } from './pagina_dashboard_logica.js';
const { usuario_nome, usuario_cargo, ir_para, realizar_logout } = useLogicaDashboard();
</script>