import { db } from '../banco_local/db.js';

export const sessionManager = {
    /**
     * Limpa de forma atómica e recursiva todo o rasto do utilizador anterior.
     * Varre tanto o banco local (Dexie) quanto o LocalStorage sensível.
     */
    async limparSessaoCompleta() {
        try {
            // 🛡️ LIMPEZA UNIVERSAL: Limpa todas as tabelas do Dexie sem precisar de nomes
            // Isso garante que tabelas criadas no futuro também sejam apagadas.
            await db.transaction('rw', db.tables, async () => {
                for (const tabela of db.tables) {
                    await tabela.clear();
                }
            });

            // Remove chaves de segurança e contexto
            const chaves = [
                'nitec_token', 
                'nitec_usuario',
                'nitec_token_admin', 
                'nitec_modo_suporte', 
                'nitec_api_tenant',
                'nitec_nome_cliente', 
                'nitec_usuario_admin'
            ];
            chaves.forEach(k => localStorage.removeItem(k));
            
            console.log("🧹 Sessão e Banco Local limpos com sucesso.");
        } catch (erro) {
            console.error("Erro crítico ao limpar sessão:", erro);
        }
    }
};