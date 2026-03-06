<template>
    <div class="tela_detalhes_mesa p-6 bg-gray-100 h-full font-sans flex flex-col relative overflow-y-auto">
        
        <div v-if="dados_mesa" class="conteudo_mesa flex flex-col h-full">
            
            <header class="cabecalho_mesa shrink-0 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6">
                <div class="info_topo flex items-center gap-4">
                    <span class="icone_gigante text-5xl text-red-500">🍽️</span>
                    <div>
                        <h1 class="titulo_mesa text-3xl font-black text-gray-800 uppercase tracking-tighter">{{ dados_mesa.nome_mesa }}</h1>
                        <p class="status_mesa text-sm font-bold text-red-600 uppercase tracking-widest mt-1 px-3 py-1 bg-red-100 rounded-full inline-block">Mesa Ocupada</p>
                    </div>
                </div>
                
                <div class="acoes_topo flex gap-3">
                    <button @click="adicionar_novo_cliente" class="botao_add_cliente bg-blue-100 hover:bg-blue-600 hover:text-white text-blue-700 font-black px-6 py-3 rounded-xl transition-colors shadow-sm border border-blue-200 uppercase text-sm">
                        + Sub-Comanda
                    </button>
                    <button @click="voltar_mapa" class="md:hidden botao_voltar bg-gray-800 hover:bg-black text-white px-8 py-3 rounded-xl font-bold transition-all shadow-md">
                        ⬅ Voltar
                    </button>
                </div>
            </header>

            <main class="area_comandas flex-1 grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 items-start pb-6">
                
                <article 
                    v-for="(comanda, index) in dados_mesa.listar_comandas" 
                    :key="comanda.id" 
                    class="cartao_comanda bg-white p-6 rounded-3xl shadow-lg border-t-8 border-blue-500 flex flex-col"
                >
                    <div class="cabecalho_conta flex justify-between items-start mb-6 border-b pb-4 shrink-0">
                        <div>
                            <p class="numero_comanda text-xs text-gray-400 font-bold uppercase tracking-widest">Comanda #{{ comanda.id }}</p>
                            <h2 class="nome_dono text-xl font-black text-gray-800 uppercase mt-1">
                                {{ comanda.tipo_conta === 'geral' ? 'Conta Geral da Mesa' : 'Conta Individual' }}
                            </h2>
                            <p v-if="comanda.buscar_cliente" class="cliente_nome text-sm text-gray-600 font-bold mt-2 uppercase">
                                Cliente: <span class="text-blue-600">{{ comanda.buscar_cliente.nome_cliente }}</span>
                            </p>
                            <p v-else-if="index === 0" class="cliente_nome text-sm text-gray-400 font-medium mt-2 italic">
                                Cliente: Não informado
                            </p>
                            <p class="atendente_nome text-xs text-gray-500 font-bold mt-1 uppercase tracking-widest">
                                Atendente: {{ comanda.buscar_usuario ? comanda.buscar_usuario.name : 'Sistema' }}
                            </p>
                        </div>
                        <span class="valor_parcial text-2xl font-black text-blue-600">R$ {{ comanda.valor_total }}</span>
                    </div>

                    <button @click="abrir_pdv_para_comanda(comanda.id)" class="botao_lancar_pdv shrink-0 w-full bg-blue-500 hover:bg-blue-600 text-white font-black py-4 rounded-xl shadow-md transition-transform transform active:scale-95 uppercase tracking-widest mb-6 flex items-center justify-center gap-2">
                        <span>🛒</span> Lançar Produtos
                    </button>

                    <div class="lista_itens flex-1 overflow-y-auto mb-6 max-h-64 pr-2">
                        <h3 class="titulo_lista text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Itens Consumidos</h3>
                        
                        <div v-if="comanda.listar_itens.length === 0" class="itens_vazio text-center py-6 border-2 border-dashed border-gray-100 rounded-xl">
                            <p class="text-sm text-gray-400 font-medium italic">Nenhum produto lançado ainda.</p>
                        </div>

                        <div v-for="item in comanda.listar_itens" :key="item.id" class="linha_item flex flex-col py-3 border-b border-gray-100 last:border-0 group">
                            <p class="nome_produto text-sm font-black text-gray-700 mb-2">{{ item.buscar_produto.nome_produto }}</p>
                            <div class="acoes_item flex items-center justify-between">
                                <div class="controle_quantidade flex items-center bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                                    <button @click="alterar_quantidade(item.id, 'decrementar')" class="botao_menos px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black transition-colors">-</button>
                                    <span class="visor_qtd px-3 py-1 text-sm font-black text-gray-800 w-8 text-center">{{ item.quantidade }}</span>
                                    <button @click="alterar_quantidade(item.id, 'incrementar')" class="botao_mais px-4 py-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black transition-colors">+</button>
                                </div>
                                <div class="valores_finais flex items-center gap-3">
                                    <span class="subtotal_item text-sm font-black text-gray-800">R$ {{ (item.quantidade * item.preco_unitario).toFixed(2) }}</span>
                                    <button @click="remover_item_consumido(item.id)" class="botao_lixeira text-red-300 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Apagar Tudo">
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <button @click="fechar_conta_comanda(comanda.id)" class="botao_fechar_conta shrink-0 w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-xl shadow-md transition-all uppercase tracking-widest">
                        💸 Fechar Conta
                    </button>
                </article>
            </main>
        </div>

        <div v-if="modal_cliente_visivel" class="modal_backdrop fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div class="modal_conteudo bg-white w-full max-w-md p-8 rounded-3xl shadow-2xl">
                <div class="modal_cabecalho text-center mb-6">
                    <div class="icone_modal text-6xl mb-2">👤</div>
                    <h2 class="titulo_modal text-2xl font-black text-gray-800 uppercase tracking-tight">Nova Sub-Comanda</h2>
                    <p class="subtitulo_modal text-sm text-gray-500 mt-1">Separar a conta para um novo cliente na mesa</p>
                </div>
                <div class="modal_corpo flex flex-col gap-4">
                    <label class="rotulo block text-sm font-bold text-gray-700">Nome do Cliente</label>
                    <input v-model="input_novo_cliente" type="text" placeholder="Ex: Maria Souza" class="campo_texto w-full p-4 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 bg-gray-50 focus:bg-white transition-colors text-lg" @keyup.enter="confirmar_novo_cliente">
                </div>
                <div class="modal_rodape flex justify-end gap-3 mt-8">
                    <button @click="fechar_modal_cliente" class="botao_cancelar px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-100 transition-colors">Cancelar</button>
                    <button @click="confirmar_novo_cliente" class="botao_confirmar bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-transform transform active:scale-95 uppercase tracking-wider">
                        Criar Conta
                    </button>
                </div>
            </div>
        </div>

    </div>
</template>

<script setup>
import { useLogicaMesaDetalhes } from './pagina_mesa_detalhes_logica.js';
const { 
    dados_mesa, voltar_mapa, abrir_pdv_para_comanda, 
    adicionar_novo_cliente, modal_cliente_visivel, input_novo_cliente, 
    fechar_modal_cliente, confirmar_novo_cliente, alterar_quantidade, 
    remover_item_consumido, fechar_conta_comanda 
} = useLogicaMesaDetalhes();
</script>