import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

export const useProdutosStore = defineStore('produtos_store', () => {
    const lista_produtos = ref([]);

    const buscar_produtos = async (forcar_atualizacao = false) => {
        const produtos_atuais = lista_produtos.value || [];

        if (produtos_atuais.length > 0 && !forcar_atualizacao) {
            return; 
        }

        try {
            const timestamp = new Date().getTime();
            const resposta = await api_cliente.get(`/listar-produtos?_t=${timestamp}`);
            
            console.log("DADOS REAIS DA API:", resposta.data); 
            
            lista_produtos.value = resposta.data.produtos || [];
            
        } catch (erro) {
            console.error("Erro ao carregar catálogo:", erro);
            lista_produtos.value = []; 
            
            // NOVIDADE: Agora o sistema não esconde mais o erro!
            alert("Ops! O produto foi salvo, mas houve uma falha ao atualizar a tabela de exibição. Erro: " + (erro.response?.data?.mensagem || erro.message));
            
            if (erro.response && erro.response.status === 401) {
                alert("A sua sessão expirou ou o Token é inválido. Por favor, faça login novamente.");
                localStorage.removeItem('nitec_token');
                localStorage.removeItem('nitec_usuario');
                window.location.href = '/#/login';
                window.location.reload();
            }
        }
    };

    return { 
        lista_produtos, 
        buscar_produtos 
    };
});