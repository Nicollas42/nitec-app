import { useMesasStore } from '../stores/mesas_store.js';

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
                const loja_mesas = useMesasStore();
                // O parâmetro 'true' força a atualização da RAM
                await loja_mesas.buscar_mesas(true);
            } catch (erro) {
                console.error("Erro na sincronização de fundo:", erro);
            } finally {
                sincronizando = false; // Liberta a trava para o próximo ciclo
            }
        }
    }, 25000); // 15 segundos exatos
}

// 🟢 Função nova para "matar" o cronómetro quando fizermos logout
export function parar_sincronizacao_de_fundo() {
    if (intervaloId) {
        clearInterval(intervaloId);
        intervaloId = null;
    }
}