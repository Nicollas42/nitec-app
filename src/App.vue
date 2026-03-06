<template>
  <router-view></router-view>
</template>

<script setup>
import { onMounted } from 'vue';
import { db } from './banco_local/db.js';
import api_cliente from './servicos/api_cliente.js';

// --- FASE 4: O CARTEIRO (Background Sync) ---
const sincronizar_vendas_pendentes = async () => {
    // Se o PC/Celular do cliente diz que está sem Wi-Fi, abortamos silenciosamente.
    if (!navigator.onLine) return;

    try {
        // Busca tudo que está "preso" no cofre do Dexie
        const vendas_presas = await db.vendas_pendentes.toArray();

        // Se a fila estiver vazia, encerra e volta a dormir
        if (vendas_presas.length === 0) return; 

        console.log(`🔄 Encontradas ${vendas_presas.length} vendas offline. Iniciando envio para a VPS...`);

        // Tenta enviar uma por uma
        for (const venda of vendas_presas) {
            try {
                // Dispara o JSON exato para a URL exata (A mágica que preparamos na Fase 3!)
                await api_cliente.post(venda.url_destino, venda.payload_venda);
                
                // Se o Laravel devolver Status 200 (Sucesso), apagamos do computador do cliente
                await db.vendas_pendentes.delete(venda.id_local);
                console.log(`✅ Pedido Offline #${venda.id_local} sincronizado com sucesso e apagado do PC!`);
                
            } catch (erro_req) {
                // Se falhar (ex: VPS engasgou), ele pula esta venda, deixa ela no Dexie e tenta de novo daqui a 30s
                console.error(`Falha ao sincronizar pedido #${venda.id_local}:`, erro_req);
            }
        }
    } catch (erro_geral) {
        console.error("Erro crítico no ciclo de sincronização:", erro_geral);
    }
};

onMounted(() => {
    // 1. Tenta sincronizar assim que o aplicativo abre
    // (Útil se a energia caiu ontem à noite e eles só reabriram o PC hoje de manhã)
    sincronizar_vendas_pendentes();

    // 2. Fica vigiando a cada 30 segundos, de forma silenciosa
    setInterval(sincronizar_vendas_pendentes, 30000);

    // 3. A cereja do bolo: o navegador avisa o Vue assim que o Wi-Fi conecta!
    window.addEventListener('online', () => {
        console.log("🟢 O Wi-Fi voltou! Acordando o carteiro...");
        sincronizar_vendas_pendentes();
    });
});

// --- VACINAS DO PWA (Mantidas do seu código original) ---
window.addEventListener('click', (evento) => {
    if (evento.target.tagName === 'INPUT' || evento.target.tagName === 'TEXTAREA') {
        window.focus(); 
        evento.target.focus(); 
    }
});

window.addEventListener('focus', () => {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) {
        document.activeElement.blur();
    }
});
</script>