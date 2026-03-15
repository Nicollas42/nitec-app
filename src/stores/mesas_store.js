import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente, { sincronizar_cache_para_local } from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js';

export const useMesasStore = defineStore('mesas_store', () => {
    const lista_mesas        = ref([]);
    const ultima_atualizacao = ref(null); // Timestamp da última busca na VPS

    const gerarUUID = () => {
        return typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : Date.now().toString(36) + Math.random().toString(36).substring(2);
    };

    /**
     * Busca mesas da VPS ou usa cache persistido.
     * Com persist ativo, os dados ficam no localStorage e nunca somem ao trocar de aba.
     * Só faz requisição à VPS se:
     *   - forcar_atualizacao = true
     *   - lista está vazia
     *   - última atualização foi há mais de 30s (garante frescor quando online)
     */
    const buscar_mesas = async (forcar_atualizacao = false) => {
        const usuario_raw = localStorage.getItem('nitec_usuario');

        if (usuario_raw) {
            let usuario = null;
            try { usuario = JSON.parse(usuario_raw); }
            catch (e) { console.error("localStorage corrompido."); }

            if (usuario?.tipo_usuario === 'admin_master') {
                lista_mesas.value = [];
                return;
            }
        }

        // 🟢 Usa cache se tiver dados recentes (menos de 30s) e não forçar
        const agora = Date.now();
        const cache_fresco = ultima_atualizacao.value && (agora - ultima_atualizacao.value) < 30000;
        if (lista_mesas.value.length > 0 && !forcar_atualizacao && cache_fresco) return;

        try {
            const resposta = await api_cliente.get('/listar-mesas');
            const mesas_oficiais = resposta.data.dados || resposta.data.mesas || [];

            const cadastros_pendentes = await db.vendas_pendentes
                .where('url_destino').equals('/cadastrar-mesa').toArray();
            const mesas_temporarias = cadastros_pendentes
                .map(cad => cad.payload_venda?.mesa_temp_data)
                .filter(Boolean);

            lista_mesas.value      = [...mesas_oficiais, ...mesas_temporarias];
            ultima_atualizacao.value = agora;

            // Salva no Dexie (backup offline) e envia para servidor local
            await db.mesas.bulkPut(mesas_oficiais);
            sincronizar_cache_para_local(null, mesas_oficiais).catch(() => {});

        } catch (erro) {
            console.warn("🔴 Offline: usando mesas persistidas.");

            // Se o persist já tem dados, usa sem limpar
            if (lista_mesas.value.length > 0) return;

            // Fallback final: Dexie
            const mesas_salvas = await db.mesas.toArray();
            const cadastros_pendentes = await db.vendas_pendentes
                .where('url_destino').equals('/cadastrar-mesa').toArray();
            const mesas_temporarias = cadastros_pendentes
                .map(cad => cad.payload_venda?.mesa_temp_data)
                .filter(Boolean);

            lista_mesas.value = [...mesas_salvas, ...mesas_temporarias];
        }
    };

    const criar_mesa_offline = async (nome_mesa) => {
        const uuid = gerarUUID();

        const nova_mesa_temp = {
            id: `temp_${uuid}`,
            nome_mesa,
            status_mesa      : 'livre',
            capacidade_pessoas: 4,
            is_temp          : true
        };

        lista_mesas.value.push(nova_mesa_temp);

        await db.vendas_pendentes.add({
            tenant_id  : localStorage.getItem('nitec_tenant_id'),
            data_venda : new Date().toISOString(),
            valor_total: 0,
            url_destino: '/cadastrar-mesa',
            metodo     : 'POST',
            payload_venda: {
                nome_mesa,
                uuid_operacao : uuid,
                mesa_temp_data: nova_mesa_temp
            }
        });

        return nova_mesa_temp;
    };

    return {
        lista_mesas,
        ultima_atualizacao,
        buscar_mesas,
        criar_mesa_offline
    };
}, {
    // 🟢 Persistência automática no localStorage
    // Os dados sobrevivem a: troca de aba, reload, queda de internet
    persist: {
        key     : 'nitec_mesas_store',
        storage : localStorage,
        pick    : ['lista_mesas', 'ultima_atualizacao'],
    }
});