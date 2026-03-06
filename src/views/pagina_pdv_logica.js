import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router'; 
import { useProdutosStore } from '../stores/produtos_store.js';
import { useMesasStore } from '../stores/mesas_store.js'; // Precisamos disto para atualizar a mesa depois!
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';

export function useLogicaPdv() {
    const roteador = useRouter();
    const rota_atual = useRoute(); 
    const loja_produtos = useProdutosStore();
    const loja_mesas = useMesasStore();
    
    const carrinho_venda = ref([]);

    const id_comanda_vinculada = ref(rota_atual.query.comanda || null);
    
    // 👇 NOVA VARIÁVEL: Detecta se estamos na tela para pagar uma conta
    const id_comanda_pagamento = ref(rota_atual.query.pagamento || null);

    const adicionar_ao_carrinho = (produto_selecionado) => {
        const item_ja_na_comanda = carrinho_venda.value.find(item => item.id === produto_selecionado.id);
        if (item_ja_na_comanda) {
            item_ja_na_comanda.quantidade += 1;
        } else {
            carrinho_venda.value.push({ ...produto_selecionado, quantidade: 1 });
        }
    };

    const remover_do_carrinho = (indice_item) => {
        carrinho_venda.value.splice(indice_item, 1);
    };

    const valor_total_comanda = computed(() => {
        return carrinho_venda.value.reduce((acumulador, item) => acumulador + (item.preco_venda * item.quantidade), 0);
    });

    // 👇 NOVA FUNÇÃO: Busca os dados no Laravel e desenha o cupom na tela
    const carregar_comanda_para_pagamento = async () => {
        try {
            const resposta = await api_cliente.get(`/buscar-comanda/${id_comanda_pagamento.value}`);
            const comanda_banco = resposta.data.dados;
            
            // Transforma os itens do banco de volta para o formato visual do PDV
            carrinho_venda.value = comanda_banco.listar_itens.map(item => ({
                id: item.produto_id,
                nome_produto: item.buscar_produto.nome_produto,
                preco_venda: item.preco_unitario,
                quantidade: item.quantidade
            }));
        } catch (erro) {
            alert("Erro ao carregar a comanda para pagamento.");
            voltar_painel();
        }
    };

    const processar_acao_principal = async () => {
        if (carrinho_venda.value.length === 0) {
            alert("A comanda está vazia.");
            return;
        }

        // --- CENÁRIO 1: FECHAR A CONTA E PAGAR (NOVIDADE) ---
        if (id_comanda_pagamento.value) {
            try {
                await api_cliente.post(`/fechar-comanda/${id_comanda_pagamento.value}`);
                alert("💳 Pagamento confirmado! A comanda foi fechada.");
                
                // Força a atualização das mesas na memória, para que a mesa fique Verde (Livre) se não houver outras contas
                loja_mesas.buscar_mesas(true); 
                
                // Redireciona o caixa para o histórico de comandas
                roteador.push('/comandas'); 
            } catch (erro) {
                alert("Erro ao processar o fechamento da conta.");
            }
            return; // Encerra a função aqui
        }

        // --- CENÁRIO 2: LANÇAR MAIS ITENS NA MESA ---
        if (id_comanda_vinculada.value) {
            const payload = {
                itens: carrinho_venda.value.map(item => ({
                    produto_id: item.id,
                    quantidade: item.quantidade,
                    preco_unitario: item.preco_venda
                }))
            };

            const url_rota = `/adicionar-itens-comanda/${id_comanda_vinculada.value}`;

            try {
                await api_cliente.post(url_rota, payload);
                alert("Produtos lançados na comanda com sucesso!");
                loja_produtos.buscar_produtos(true);
                roteador.go(-1);
            } catch (erro) {
                if (!erro.response || erro.response.status >= 500) {
                    const pacote_offline = {
                        tenant_id: localStorage.getItem('nitec_tenant_id') || 'master',
                        data_venda: new Date().toISOString(),
                        valor_total: valor_total_comanda.value,
                        url_destino: url_rota, 
                        payload_venda: payload  
                    };
                    await db.vendas_pendentes.add(pacote_offline);
                    alert("⚠️ Sem conexão! O pedido foi salvo no PC e será enviado à cozinha assim que a internet voltar.");
                    roteador.go(-1);
                } else {
                    alert(erro.response?.data?.mensagem || "Erro ao lançar produtos. Verifique o pedido.");
                }
            }
        } else {
            alert("Módulo de Venda Avulsa (Em breve).");
        }
    };

    const voltar_painel = () => roteador.push('/painel-central');

    onMounted(() => {
        loja_produtos.buscar_produtos();
        
        // Se entrou para pagar, dispara o carregamento!
        if (id_comanda_pagamento.value) {
            carregar_comanda_para_pagamento();
        }
    });

    return {
        lista_produtos: computed(() => loja_produtos.lista_produtos),
        carrinho_venda, adicionar_ao_carrinho, remover_do_carrinho,
        valor_total_comanda, id_comanda_vinculada, id_comanda_pagamento, 
        processar_acao_principal, voltar_painel
    };
}