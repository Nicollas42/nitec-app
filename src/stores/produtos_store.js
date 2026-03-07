import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js'; 

export const useProdutosStore = defineStore('produtos_store', () => {
    const lista_produtos = ref([]);
    const modo_offline = ref(false); 

    const buscar_produtos = async (forcar_atualizacao = false) => {
        // 🟢 VACINA ANTI-ADMIN: O Admin Master não tem produtos. 
        // Abortamos a busca antes de gerar um Erro 500 na VPS!
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (usuario_raw) {
            const usuario = JSON.parse(usuario_raw);
            if (usuario.tipo_usuario === 'admin_master') {
                lista_produtos.value = [];
                return; 
            }
        }

        const produtos_atuais = lista_produtos.value || [];

        if (produtos_atuais.length > 0 && !forcar_atualizacao) {
            return; 
        }

        try {
            const timestamp = new Date().getTime();
            const resposta = await api_cliente.get(`/listar-produtos?_t=${timestamp}`);
            
            const produtos_recebidos = resposta.data.produtos || [];
            lista_produtos.value = produtos_recebidos;
            
            await db.produtos.clear(); 
            await db.produtos.bulkAdd(produtos_recebidos); 
            
            modo_offline.value = false; 
            
        } catch (erro) {
            console.error("Erro ao carregar catálogo da VPS:", erro);
            
            if (erro.response && erro.response.status === 401) {
                alert("A sua sessão expirou ou o Token é inválido. Por favor, faça login novamente.");
                localStorage.removeItem('nitec_token');
                localStorage.removeItem('nitec_usuario');
                window.location.href = '/#/login';
                window.location.reload();
                return; 
            }

            console.warn("🔴 Ativando Modo Offline! Buscando produtos do Dexie...");
            modo_offline.value = true;
            
            const produtos_salvos = await db.produtos.toArray();
            
            if (produtos_salvos.length > 0) {
                lista_produtos.value = produtos_salvos;
                console.log("⚡ Catálogo carregado com sucesso do modo offline!");
            } else {
                lista_produtos.value = []; 
                // O alerta só vai disparar agora para clientes reais que realmente ficaram sem net
                alert("Você está offline e infelizmente não há produtos salvos no computador.");
            }
        }
    };

    return { 
        lista_produtos,
        modo_offline, 
        buscar_produtos 
    };
});