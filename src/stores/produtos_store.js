import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js'; // 🛡️ Importamos o Cérebro Local

export const useProdutosStore = defineStore('produtos_store', () => {
    const lista_produtos = ref([]);
    
    // 🟢 Novidade: Uma flag para sabermos se estamos trabalhando sem internet
    const modo_offline = ref(false); 

    const buscar_produtos = async (forcar_atualizacao = false) => {
        const produtos_atuais = lista_produtos.value || [];

        // Se não forçarmos a atualização e já tivermos produtos na memória, não faz nada
        if (produtos_atuais.length > 0 && !forcar_atualizacao) {
            return; 
        }

        try {
            const timestamp = new Date().getTime();
            const resposta = await api_cliente.get(`/listar-produtos?_t=${timestamp}`);
            
            console.log("DADOS REAIS DA API:", resposta.data); 
            
            const produtos_recebidos = resposta.data.produtos || [];
            lista_produtos.value = produtos_recebidos;
            
            // 🚀 O ESPELHO: A API funcionou! Vamos salvar/atualizar a cópia no PC do cliente
            await db.produtos.clear(); // Limpa a tabela antiga
            await db.produtos.bulkAdd(produtos_recebidos); // Salva os novos
            
            modo_offline.value = false; // Sinal verde, estamos online!
            console.log("📦 Produtos sincronizados com o banco local (Dexie)!");
            
        } catch (erro) {
            console.error("Erro ao carregar catálogo da VPS:", erro);
            
            // 🛑 O erro é de autenticação? Então não é problema de internet.
            if (erro.response && erro.response.status === 401) {
                alert("A sua sessão expirou ou o Token é inválido. Por favor, faça login novamente.");
                localStorage.removeItem('nitec_token');
                localStorage.removeItem('nitec_usuario');
                window.location.href = '/#/login';
                window.location.reload();
                return; // Para a execução aqui
            }

            // 🛡️ O ESCUDO: Se não for 401, a internet caiu ou a VPS deu erro.
            console.warn("🔴 Ativando Modo Offline! Buscando produtos do Dexie...");
            modo_offline.value = true;
            
            // Vai no banco local e puxa o que tem lá
            const produtos_salvos = await db.produtos.toArray();
            
            if (produtos_salvos.length > 0) {
                lista_produtos.value = produtos_salvos;
                console.log("⚡ Catálogo carregado com sucesso do modo offline!");
            } else {
                lista_produtos.value = []; 
                alert("Você está offline e infelizmente não há produtos salvos no computador.");
            }
        }
    };

    return { 
        lista_produtos,
        modo_offline, // Exportamos para você poder mostrar um ícone "Sem Internet" na tela depois
        buscar_produtos 
    };
});