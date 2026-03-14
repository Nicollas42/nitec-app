import { useMesasStore } from '../stores/mesas_store.js';
import { db } from '../banco_local/db.js';
import api_cliente, { sincronizar_servidor_local_com_vps } from '../servicos/api_cliente.js';
import { useToastStore } from '../stores/toast_store.js';

let intervaloId = null;

export function iniciar_sincronizacao_de_fundo() {
    if (intervaloId) return;

    let sincronizando = false;

    intervaloId = setInterval(async () => {
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (!usuario_raw) return;
        
        const usuario = JSON.parse(usuario_raw);
        if (usuario.tipo_usuario === 'admin_master') return;

        if (navigator.onLine && !sincronizando) {
            sincronizando = true;
            try {
                // 1. Envia fila do Dexie (ações offline deste dispositivo) para a VPS
                await processar_fila_offline();

                // 2. Envia fila do servidor local (ações dos garçons) para a VPS
                // Só roda no Electron (PC do caixa que hospeda o servidor local)
                await sincronizar_servidor_local_com_vps();

                // 3. Atualiza o mapa de mesas
                const loja_mesas = useMesasStore();
                await loja_mesas.buscar_mesas(true);
            } catch (erro) {
                console.error("Erro na sincronização de fundo:", erro);
            } finally {
                sincronizando = false;
            }
        }
    }, 20000);
}

async function processar_fila_offline() {
    const toast_global = useToastStore();
    let sincronizou_algo = false;

    // Processa vendas pendentes no Dexie
    const vendas = await db.vendas_pendentes.toArray();
    
    if (vendas.length > 0) {
        for (const venda of vendas) {
            try {
                if (venda.metodo === 'POST' || !venda.metodo) {
                    await api_cliente.post(venda.url_destino, venda.payload_venda);
                } else if (venda.metodo === 'DELETE') {
                    await api_cliente.delete(venda.url_destino, { data: venda.payload_venda });
                }
                await db.vendas_pendentes.delete(venda.id_local);
                sincronizou_algo = true;
            } catch (erro) {
                console.error(`Falha ao sincronizar operação offline ID ${venda.id_local}:`, erro);
            }
        }
    }

    // Processa cadastros pendentes
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

    if (sincronizou_algo) {
        // Se a fila ficou vazia, limpa o snapshot local — VPS tem tudo agora
        const restantes = await db.vendas_pendentes.count();
        if (restantes === 0) {
            await db.estado_comandas_local.clear();
            console.log("🧹 Estado local limpo — tudo sincronizado com o servidor.");
        }

        toast_global.exibir_toast("☁️ Dados offline enviados com sucesso para o servidor!", "sucesso");
        console.log("☁️ Sincronização offline concluída com sucesso.");
    }
}

export function parar_sincronizacao_de_fundo() {
    if (intervaloId) {
        clearInterval(intervaloId);
        intervaloId = null;
    }
}