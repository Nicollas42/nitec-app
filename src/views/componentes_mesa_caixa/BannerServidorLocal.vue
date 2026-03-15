<template>
    <Teleport to="body">
        <Transition
            enter-active-class="transition duration-500 ease-out"
            enter-from-class="opacity-0 -translate-y-full"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-300 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 -translate-y-full">

            <!-- Banner do PC (Electron) — é o servidor, informa o IP -->
            <div v-if="visivel && eh_electron_ref"
                 class="fixed top-0 left-0 right-0 z-[9999] bg-green-600 text-white px-4 py-3 shadow-lg">
                <div class="max-w-3xl mx-auto flex items-center justify-between gap-3">
                    <div class="flex items-center gap-3">
                        <span class="text-2xl shrink-0">🖥️</span>
                        <div>
                            <p class="font-black text-sm uppercase tracking-wide">Modo Offline — Servidor Local Ativo</p>
                            <p class="text-green-100 text-xs font-bold mt-0.5">
                                Garçons devem acessar o app — a rede local está funcionando normalmente
                            </p>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <span class="bg-white/20 text-white font-black text-xs px-3 py-2 rounded-lg font-mono">
                            {{ ip_servidor }}:3737
                        </span>
                        <button @click="visivel = false"
                                class="text-white/70 hover:text-white font-black text-xl leading-none px-2">×</button>
                    </div>
                </div>
            </div>

            <!-- Banner do Celular/PWA — conecta ao servidor local -->
            <div v-else-if="visivel && !eh_electron_ref"
                 class="fixed top-0 left-0 right-0 z-[9999] bg-orange-500 text-white px-4 py-3 shadow-lg">
                <div class="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">

                    <div class="flex items-center gap-3">
                        <span class="text-2xl shrink-0">📡</span>
                        <div>
                            <p class="font-black text-sm uppercase tracking-wide">
                                {{ conectado ? 'Modo Offline Ativo' : 'Servidor principal indisponível' }}
                            </p>
                            <p class="text-orange-100 text-xs font-bold mt-0.5">
                                <span v-if="buscando">Procurando servidor local na rede Wi-Fi...</span>
                                <span v-else-if="conectado">Usando servidor local — dados preservados</span>
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

                        <button v-if="servidor_encontrado && !conectado && !buscando"
                                @click="conectar_servidor_local"
                                class="bg-white text-orange-600 font-black text-xs px-4 py-2 rounded-xl hover:bg-orange-50 transition-all active:scale-95 uppercase tracking-wide shadow-sm">
                            Conectar
                        </button>

                        <span v-if="conectado"
                              class="bg-white/20 text-white font-black text-xs px-3 py-2 rounded-lg">
                            ✅ Offline local
                        </span>

                        <button v-if="!conectado" @click="visivel = false"
                                class="text-white/70 hover:text-white font-black text-xl leading-none px-2">×</button>
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
const ip_servidor         = ref('');
const eh_electron_ref     = ref(false);

let intervalo_ping = null;

const eh_desenvolvimento = import.meta.env.DEV;

const detectar_electron = () => {
    try { return !!(window?.require && window.require('electron')); }
    catch { return false; }
};

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
        if (erro.response) return true;
        return false;
    }
};

const ao_detectar_vps_offline = async () => {
    if (visivel.value) return;
    visivel.value = true;

    if (eh_electron_ref.value) {
        try {
            const { ipcRenderer } = window.require('electron');
            const info = await ipcRenderer.invoke('obter-servidor-local');
            ip_servidor.value = info?.ip || '192.168.x.x';
        } catch { ip_servidor.value = '192.168.x.x'; }
        return;
    }

    buscando.value            = true;
    servidor_encontrado.value = false;

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
    visivel.value  = false;
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
 * Conecta ao servidor local.
 * 🟢 NÃO força busca imediata — apenas salva o endereço no localStorage.
 * O interceptor do api_cliente vai redirecionar automaticamente nas próximas
 * requisições. Os dados persistidos no localStorage continuam disponíveis.
 */
const conectar_servidor_local = () => {
    const url = url_servidor_local.value;
    if (!url) return;

    localStorage.setItem('nitec_servidor_local', url);
    conectado.value = true;

    // Não chama buscar_mesas nem buscar_produtos aqui
    // Os dados já estão no localStorage via pinia-plugin-persistedstate
    // O interceptor do api_cliente vai usar o servidor local automaticamente
    // nas próximas requisições naturais do app
};

const ao_ficar_offline_nativo = () => {
    vps_estava_online.value = false;
    ao_detectar_vps_offline();
};

onMounted(() => {
    eh_electron_ref.value = detectar_electron();

    if (eh_desenvolvimento) {
        console.log('[Banner] Modo desenvolvimento — ping desativado.');
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