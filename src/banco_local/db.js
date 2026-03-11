import Dexie from 'dexie';

// 1. Criamos a base de dados chamada "NitecPDV_Local"
export const db = new Dexie('NitecPDV_Local');

// 👇 MUDANÇA: Subimos a versão para 3!
db.version(3).stores({
    // --- CÓPIAS DA VPS (Apenas leitura no modo offline) ---
    produtos: 'id, nome, categoria_id, preco',
    categorias: 'id, nome',
    mesas: 'id, nome_mesa, status_mesa', 

    // 🟢 MUDANÇA: Adicionamos 'url_destino' e 'metodo' à lista de índices para permitir o .where()
    vendas_pendentes: '++id_local, tenant_id, data_venda, valor_total, url_destino, metodo',
    
    // --- FILA LEGADA (Pode ser removida no futuro, mantida por segurança) ---
    cadastros_pendentes: '++id_local, tipo, url_destino, data_criacao' 
});

// Nota Técnica do Dexie:
// Não é necessário indexar propriedades pesadas como objetos completos (ex: payload_venda).
// Indexamos apenas o que vamos usar no ".where()". O payload continua a ser guardado sem problemas!

// Mensagem de sucesso para o console
db.on('ready', () => {
    console.log("🛡️ Banco Local (Dexie) atualizado para a Versão 3 com Índices de Busca!");
});