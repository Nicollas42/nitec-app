import { useMesasStore } from '../stores/mesas_store.js';
import { db } from '../banco_local/db.js';
import api_cliente from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js';

let intervaloId = null; // Armazena a referência do timer para evitar clones (Spam)

export function iniciar_sincronizacao_de_fundo() {
    // 🛑 TRAVA 1: Se já existir um cronómetro a rodar, não cria outro!
    if (intervaloId) return;

    let sincronizando = false;

    intervaloId = setInterval(async () => {
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (!usuario_raw) return;
        
        const usuario = JSON.parse(usuario_raw);
        // Não sincroniza se for Admin Master (ele não tem mesas)
        if (usuario.tipo_usuario === 'admin_master') return;

        // 🛑 TRAVA 2: Só dispara se estiver online e se a última requisição já tiver terminado
        if (navigator.onLine && !sincronizando) {
            sincronizando = true;
            try {
                // 🟢 PASSO 1: Descarregar a Fila de Vendas e Edições Offline!
                await processar_fila_offline();

                // 🟢 PASSO 2: Atualizar o Mapa de Mesas para todos verem as mudanças
                const loja_mesas = useMesasStore();
                await loja_mesas.buscar_mesas(true);
            } catch (erro) {
                console.error("Erro na sincronização de fundo:", erro);
            } finally {
                sincronizando = false; // Liberta a trava para o próximo ciclo
            }
        }
    }, 20000); // Executa a cada 20 segundos
}

// 🟢 FUNÇÃO MOTOR DO MODO OFFLINE (O Carteiro)
async function processar_fila_offline() {
    const toast_global = useToastStore();
    let sincronizou_algo = false;

    // 1. Procurar por Vendas, Lançamentos ou Pagamentos Pendentes
    const vendas = await db.vendas_pendentes.toArray();
    
    if (vendas.length > 0) {
        for (const venda of vendas) {
            try {
                // Executa o pedido que ficou retido usando o método correto
                if (venda.metodo === 'POST' || !venda.metodo) {
                    await api_cliente.post(venda.url_destino, venda.payload_venda);
                } else if (venda.metodo === 'DELETE') {
                    await api_cliente.delete(venda.url_destino);
                }
                
                // Se o servidor respondeu 200 OK, apagamos do disco local
                await db.vendas_pendentes.delete(venda.id_local);
                sincronizou_algo = true;
            } catch (erro) {
                console.error(`Falha ao sincronizar operação offline ID ${venda.id_local}:`, erro);
                // Se der erro 500 ou 400 (ex: tentar apagar algo que já não existe), o item continuará
                // na fila para tentarmos mais tarde ou ser limpo manualmente.
            }
        }
    }

    // 2. Sincronizar Cadastros Pendentes (Se usar este recurso no futuro)
    const cadastros = await db.cadastros_pendentes.toArray();
    if (cadastros.length > 0) {
        for (const cadastro of cadastros) {
            try {
                await api_cliente.post(cadastro.url_destino, cadastro.payload || {});
                await db.cadastros_pendentes.delete(cadastro.id_local);
                sincronizou_algo = true;
            } catch (erro) {
                console.error(`Falha ao sincronizar cadastro offline ID ${cadastro.id_local}:`, erro);
            }
        }
    }

    // Se a carrinha entregou as encomendas, avisa o utilizador!
    if (sincronizou_algo) {
        toast_global.exibir_toast("☁️ Registos offline enviados com sucesso para o servidor!", "sucesso");
        console.log("☁️ Sincronização offline concluída com sucesso.");
    }
}

// 🟢 Função para "matar" o cronómetro quando fizermos logout
export function parar_sincronizacao_de_fundo() {
    if (intervaloId) {
        clearInterval(intervaloId);
        intervaloId = null;
    }
}