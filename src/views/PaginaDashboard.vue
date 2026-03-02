<template>
    <div class="painel_principal flex flex-col h-screen bg-gray-100 font-sans">
        
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
                
                <button 
                    v-if="eh_super_admin && !em_modo_suporte" 
                    @click="ir_para('/admin-estabelecimentos')" 
                    class="card_modulo bg-nitec_dark p-8 rounded-3xl shadow-sm hover:shadow-xl border border-nitec_blue/30 transition-all flex flex-col items-center group active:scale-95"
                >
                    <div class="icone_fundo bg-nitec_blue/10 p-6 rounded-2xl mb-4 group-hover:bg-nitec_blue transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🏢</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-nitec_blue uppercase italic">Gestão SaaS</h3>
                    <p class="desc_card text-[10px] text-gray-400 mt-2 text-center uppercase tracking-tighter">Administrar Bares e Clientes</p>
                </button>

                <button @click="ir_para('/mapa-mesas')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-orange-50 p-6 rounded-2xl mb-4 group-hover:bg-orange-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">🍽️</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Mesas</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Gerir ocupação e comandas</p>
                </button>

                <button @click="ir_para('/pdv-caixa')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-green-50 p-6 rounded-2xl mb-4 group-hover:bg-green-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">💰</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Frente de Caixa</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Vendas rápidas e recebimentos</p>
                </button>

                <button @click="ir_para('/produtos')" class="card_modulo bg-white p-8 rounded-3xl shadow-sm hover:shadow-xl border border-gray-200 transition-all flex flex-col items-center group active:scale-95">
                    <div class="icone_fundo bg-blue-50 p-6 rounded-2xl mb-4 group-hover:bg-blue-500 transition-colors">
                        <span class="text-5xl group-hover:filter group-hover:brightness-0 group-hover:invert">📦</span>
                    </div>
                    <h3 class="titulo_card text-xl font-black text-gray-800 uppercase italic">Produtos</h3>
                    <p class="desc_card text-sm text-gray-500 mt-2 text-center">Estoque e cardápio digital</p>
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

/**
 * Desestruturação da lógica profissional importada.
 */
const { 
    usuario_nome, 
    usuario_cargo, 
    eh_super_admin, 
    em_modo_suporte,
    nome_cliente,
    ir_para, 
    realizar_logout,
    encerrar_suporte
} = useLogicaDashboard();
</script>