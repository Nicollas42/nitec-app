import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { sincronizar_cache_para_local } from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js'; 

export const useProdutosStore = defineStore('produtos_store', () => {
    const lista_produtos = ref([]);
    const modo_offline = ref(false); 

    const buscar_produtos = async (forcar_atualizacao = false) => {
        // Admin Master não tem produtos
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (usuario_raw) {
            const usuario = JSON.parse(usuario_raw);
            if (usuario.tipo_usuario === 'admin_master') {
                lista_produtos.value = [];
                return; 
            }
        }

        if ((lista_produtos.value || []).length > 0 && !forcar_atualizacao) return; 

        try {
            const timestamp = new Date().getTime();
            const resposta = await api_cliente.get(`/listar-produtos?_t=${timestamp}`);
            
            const produtos_recebidos = resposta.data.produtos || [];
            lista_produtos.value = produtos_recebidos;
            
            await db.produtos.clear(); 
            await db.produtos.bulkAdd(produtos_recebidos); 
            
            modo_offline.value = false;

            // 🟢 Envia cache de produtos para o servidor local silenciosamente
            // O servidor local precisa disso para retornar nomes corretos quando a VPS cair
            sincronizar_cache_para_local(produtos_recebidos, null).catch(() => {});
            
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
                console.log("⚡ Catálogo carregado do modo offline!");
            } else {
                lista_produtos.value = []; 
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