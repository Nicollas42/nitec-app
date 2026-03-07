import { defineStore } from 'pinia';
import { ref } from 'vue';
import api_cliente from '../servicos/api_cliente.js';
import { db } from '../banco_local/db.js'; 

export const useMesasStore = defineStore('mesas_store', () => {
    const lista_mesas = ref([]);

    const buscar_mesas = async (forcar_atualizacao = false) => {
        // 🟢 VACINA ANTI-ADMIN: O Admin Master não tem mesas. 
        // Abortamos a busca para não dar Erro 500 na VPS e não ativar o modo offline falso.
        const usuario_raw = localStorage.getItem('nitec_usuario');
        if (usuario_raw) {
            const usuario = JSON.parse(usuario_raw);
            if (usuario.tipo_usuario === 'admin_master') {
                lista_mesas.value = [];
                return; 
            }
        }

        const mesas_atuais = lista_mesas.value || [];

        if (mesas_atuais.length > 0 && !forcar_atualizacao) {
            return; 
        }

        try {
            const resposta = await api_cliente.get('/listar-mesas');
            const mesas_oficiais = resposta.data.dados || resposta.data.mesas || [];
            
            // Busca mesas criadas offline (se houver)
            const cadastros_pendentes = await db.cadastros_pendentes.where('tipo').equals('mesa').toArray();
            const mesas_temporarias = cadastros_pendentes.map(cad => cad.payload);

            lista_mesas.value = [...mesas_oficiais, ...mesas_temporarias];
            
            await db.mesas.clear();
            await db.mesas.bulkAdd(mesas_oficiais);
            
        } catch (erro) {
            console.warn("🔴 Sem internet! Carregando mesas do banco local (Dexie)...");
            const mesas_salvas = await db.mesas.toArray();
            const cadastros_pendentes = await db.cadastros_pendentes.where('tipo').equals('mesa').toArray();
            const mesas_temporarias = cadastros_pendentes.map(cad => cad.payload);
            lista_mesas.value = [...mesas_salvas, ...mesas_temporarias];
        }
    };

    const criar_mesa_offline = async (nome_mesa) => {
        const nova_mesa_temp = {
            id: `temp_${Date.now()}`, 
            nome_mesa: nome_mesa,
            status_mesa: 'livre',
            capacidade_pessoas: 4,
            is_temp: true 
        };

        lista_mesas.value.push(nova_mesa_temp);

        await db.cadastros_pendentes.add({
            tipo: 'mesa',
            url_destino: '/cadastrar-mesa',
            payload: nova_mesa_temp,
            data_criacao: new Date().toISOString()
        });

        return nova_mesa_temp;
    };

    return { 
        lista_mesas, 
        buscar_mesas,
        criar_mesa_offline
    };
});