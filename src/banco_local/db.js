import Dexie from 'dexie';

// 1. Criamos a base de dados chamada "NitecPDV_Local"
export const db = new Dexie('NitecPDV_Local');

// 2. Definimos as tabelas e os campos que podemos pesquisar (índices)
db.version(1).stores({
    // --- CÓPIAS DA VPS (Apenas leitura no modo offline) ---
    // 'id' é a chave primária que vem da VPS
    produtos: 'id, nome, categoria_id, preco',
    categorias: 'id, nome',
    mesas: 'id, numero, status',

    // --- FILA DE AÇÃO (Criados offline para enviar depois) ---
    // '++id_local' diz ao Dexie para gerar um ID automático (1, 2, 3...) enquanto estivermos sem internet
    vendas_pendentes: '++id_local, tenant_id, data_venda, valor_total, payload_venda'
});

// Mensagem de sucesso para o console
db.on('ready', () => {
    console.log("🛡️ Banco Local (Dexie) pronto e blindado!");
});