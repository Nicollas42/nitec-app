import Dexie from 'dexie';

// 1. Criamos a base de dados chamada "NitecPDV_Local"
export const db = new Dexie('NitecPDV_Local');

// 👇 CORREÇÃO: Mudamos de version(1) para version(2) para o Dexie atualizar o banco
db.version(2).stores({
    // --- CÓPIAS DA VPS (Apenas leitura no modo offline) ---
    produtos: 'id, nome, categoria_id, preco',
    categorias: 'id, nome',
    mesas: 'id, nome_mesa, status_mesa', // Ajustado para as colunas reais do Laravel

    // --- FILA DE AÇÕES (Criados offline para enviar depois) ---
    vendas_pendentes: '++id_local, tenant_id, data_venda, valor_total, payload_venda',
    
    // 🟢 A NOVA TABELA PARA CRIAR MESAS E COMANDAS SEM INTERNET
    cadastros_pendentes: '++id_local, tipo, url_destino, data_criacao' 
});

// Mensagem de sucesso para o console
db.on('ready', () => {
    console.log("🛡️ Banco Local (Dexie) atualizado para a Versão 2!");
});