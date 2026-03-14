<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 -translate-y-full"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-300 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-full">

            <div v-if="visivel"
                 class="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 text-white px-4 py-3 shadow-lg">
                <div class="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

                    <div class="flex items-center gap-3">
                        <span class="text-2xl shrink-0">📡</span>
                        <div>
                            <p class="font-black text-sm uppercase tracking-wide">Servidor principal indisponível</p>
                            <p class="text-orange-100 text-xs font-bold mt-0.5">
                                <span v-if="buscando">Procurando servidor local na rede...</span>
                                <span v-else-if="servidor_encontrado">Servidor local encontrado: {{ url_servidor_local }}</span>
                                <span v-else>Servidor local não encontrado na rede.</span>
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-2 shrink-0">
                        <svg v-if="buscando" class="animate-spin h-5 w-5 text-white/70" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>

                        <button v-if="servidor_encontrado && !conectado"
                                @click="conectar_servidor_local"
                                class="bg-white text-orange-600 font-black text-xs px-4 py-2 rounded-xl hover:bg-orange-50 transition-all active:scale-95 uppercase tracking-wide shadow-sm">
                            Conectar
                        </button>

                        <span v-if="conectado" class="bg-green-500 text-white font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wide">
                            ✅ Conectado!
                        </span>

                        <button @click="visivel = false"
                                class="text-white/70 hover:text-white font-black text-xl leading-none px-2 transition-colors">
                            ×
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { descobrir_servidor_local } from '../../servicos/descoberta_rede.js';
import axios from 'axios';

const visivel             = ref(false);
const buscando            = ref(false);
const servidor_encontrado = ref(false);
const url_servidor_local  = ref('');
const conectado           = ref(false);
const vps_estava_online   = ref(true);

let intervalo_ping = null;

// Em desenvolvimento o Laravel roda localmente — ping sempre responde
// O banner só faz sentido em produção onde a VPS é remota
const eh_desenvolvimento = import.meta.env.DEV;

// Instância axios sem interceptors — testa APENAS a VPS, nunca redireciona para servidor local
const axios_ping = axios.create({ timeout: 5000 });

const obter_url_ping = () => {
    const tenant = localStorage.getItem('nitec_tenant_id');
    if (!tenant || tenant === 'master') return 'https://nitec.dev.br/api/ping';
    return `https://${tenant}.nitec.dev.br/api/ping`;
};

const testar_vps = async () => {
    try {
        await axios_ping.get(obter_url_ping());
        return true;
    } catch (erro) {
        if (erro.response) return true; // Recebeu resposta HTTP = VPS online
        return false;                   // Sem resposta = offline
    }
};

const ao_detectar_vps_offline = async () => {
    if (visivel.value) return;
    visivel.value  = true;
    buscando.value = true;
    servidor_encontrado.value = false;
    conectado.value = false;

    try {
        const url = await descobrir_servidor_local();
        if (url) {
            url_servidor_local.value  = url;
            servidor_encontrado.value = true;
        }
    } catch (e) {
        console.warn('[Banner] Erro na descoberta:', e.message);
    } finally {
        buscando.value = false;
    }
};

const ao_detectar_vps_online = () => {
    visivel.value   = false;
    conectado.value = false;
    localStorage.removeItem('nitec_servidor_local');
};

const iniciar_ping_periodico = () => {
    if (intervalo_ping) return;

    setTimeout(async () => {
        const online = await testar_vps();
        vps_estava_online.value = online;
        if (!online) ao_detectar_vps_offline();
    }, 5000);

    intervalo_ping = setInterval(async () => {
        const online_agora = await testar_vps();
        if (vps_estava_online.value && !online_agora) {
            vps_estava_online.value = false;
            ao_detectar_vps_offline();
        } else if (!vps_estava_online.value && online_agora) {
            vps_estava_online.value = true;
            ao_detectar_vps_online();
        }
    }, 15000);
};

/**
 * Conecta ao servidor local passando as credenciais na URL.
 * O roteador do Vue lê os parâmetros e faz login automático,
 * evitando que o garçom precise fazer login novamente.
 *
 * URL gerada: http://192.168.15.6:3737/#/painel-central?token=xxx&usuario=yyy&tenant=zzz
 */
const conectar_servidor_local = () => {
    const url_base = url_servidor_local.value;
    if (!url_base) return;

    // Lê credenciais do localStorage atual
    const token   = localStorage.getItem('nitec_token')   || '';
    const usuario = localStorage.getItem('nitec_usuario') || '';
    const tenant  = localStorage.getItem('nitec_tenant_id') || '';

    localStorage.setItem('nitec_servidor_local', url_base);
    conectado.value = true;

    // Monta URL com credenciais para login automático no servidor local
    const params = new URLSearchParams({
        token,
        usuario: encodeURIComponent(usuario),
        tenant,
    });

    // Hash router: http://192.168.15.6:3737/#/painel-central?token=...
    const url_destino = `${url_base}/#/painel-central?${params.toString()}`;

    setTimeout(() => { window.location.href = url_destino; }, 800);
};

const ao_ficar_offline_nativo = () => {
    vps_estava_online.value = false;
    ao_detectar_vps_offline();
};

onMounted(() => {
    if (eh_desenvolvimento) {
        console.log('[BannerServidorLocal] Modo desenvolvimento — ping desativado.');
        return;
    }

    window.addEventListener('offline', ao_ficar_offline_nativo);
    iniciar_ping_periodico();
});

onUnmounted(() => {
    window.removeEventListener('offline', ao_ficar_offline_nativo);
    if (intervalo_ping) { clearInterval(intervalo_ping); intervalo_ping = null; }
});
</script>