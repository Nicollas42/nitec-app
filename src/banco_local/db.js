import Dexie from 'dexie';

export const db = new Dexie('NitecPDV_Local');

// Versão 3 — mantida para compatibilidade com dados existentes
db.version(3).stores({
    produtos: 'id, nome, categoria_id, preco',
    categorias: 'id, nome',
    mesas: 'id, nome_mesa, status_mesa',
    vendas_pendentes: '++id_local, tenant_id, data_venda, valor_total, url_destino, metodo',
    cadastros_pendentes: '++id_local, tipo, url_destino, data_criacao'
});

// Versão 4 — Adiciona:
// • uuid_operacao como campo de topo em vendas_pendentes (para deduplicação no merge P2P)
// • estado_comandas_local: snapshot legível das comandas offline (base do QR Sync)
db.version(4).stores({
    produtos: 'id, nome, categoria_id, preco',
    categorias: 'id, nome',
    mesas: 'id, nome_mesa, status_mesa',

    // uuid_operacao agora é índice de topo — permite WHERE eficiente no merge P2P
    vendas_pendentes: '++id_local, tenant_id, data_venda, valor_total, url_destino, metodo, uuid_operacao',

    cadastros_pendentes: '++id_local, tipo, url_destino, data_criacao',

    // NOVA TABELA: Estado legível das comandas criadas/modificadas offline
    // comanda_id é a chave primária — permite put() idempotente (upsert)
    // Guarda: { comanda_id, mesa_id, tenant_id, nome_cliente, itens: [...], atualizado_em }
    estado_comandas_local: 'comanda_id, mesa_id, tenant_id'
}).upgrade(tx => {
    // Migração: popula uuid_operacao nos registos já existentes sem o campo
    return tx.table('vendas_pendentes').toCollection().modify(venda => {
        if (!venda.uuid_operacao) {
            venda.uuid_operacao = venda.payload_venda?.uuid_operacao || null;
        }
    });
});

db.on('ready', () => {
    console.log("🛡️ Banco Local (Dexie) v4 pronto — QR Sync P2P ativo!");
});