<template>
    <div class="tela_redefinir flex h-screen bg-gray-100 items-center justify-center font-sans p-4">
        <div class="caixa_redefinir bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-nitec_blue">
            
            <div class="text-center mb-8">
                <h1 class="text-2xl font-black text-gray-800 uppercase italic">Nova Senha</h1>
                <p class="text-sm text-gray-500 mt-2">Olá, {{ email }}! Por favor, confirme seus dados para prosseguir.</p>
            </div>

            <form @submit.prevent="handleReset" class="flex flex-col gap-4">
                
                <div class="grupo_input">
                    <label class="block text-xs font-black text-gray-500 uppercase mb-1 ml-1">Confirme seu CPF ou CNPJ</label>
                    <input v-model="form.documento" @input="formatarDocumento" type="text" placeholder="000.000.000-00" 
                           class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue font-mono" required>
                </div>

                <div class="grupo_input">
                    <label class="block text-xs font-black text-gray-500 uppercase mb-1 ml-1">Digite a Nova Senha</label>
                    <input v-model="form.password" type="password" placeholder="••••••••" 
                           class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" required>
                </div>

                <div class="grupo_input">
                    <label class="block text-xs font-black text-gray-500 uppercase mb-1 ml-1">Confirme a Nova Senha</label>
                    <input v-model="form.password_confirmation" type="password" placeholder="••••••••" 
                           class="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" required>
                </div>

                <button type="submit" :disabled="carregando"
                        class="w-full bg-nitec_blue hover:bg-blue-700 text-white font-black uppercase py-4 rounded-xl shadow-lg transition-all mt-4 disabled:opacity-50">
                    {{ carregando ? 'PROCESSANDO...' : 'REDEFINIR MINHA SENHA' }}
                </button>

                <button @click="$router.push('/login')" type="button" class="text-xs text-gray-400 font-bold uppercase hover:text-nitec_blue transition-colors">
                    Voltar para o Login
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import axios from 'axios';
import { configurar_url_base } from '../servicos/api_cliente.js';

const route = useRoute();
const router = useRouter();

const email = ref(route.query.email || '');
const token = ref(route.query.token || '');
const carregando = ref(false);

const form = ref({
    email: email.value,
    token: token.value,
    documento: '',
    password: '',
    password_confirmation: ''
});

onMounted(() => {
    if (!email.value || !token.value) {
        alert("Link de recuperação inválido ou incompleto.");
        router.push('/login');
    }
});

const formatarDocumento = (e) => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length <= 11) {
        v = v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
    } else {
        v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
    }
    form.value.documento = v.replace(/[-/.]*$/, '');
};

const handleReset = async () => {
    if (form.value.password !== form.value.password_confirmation) {
        return alert("As senhas não coincidem!");
    }

    carregando.value = true;
    try {
        // CORREÇÃO: Envia a nova senha sempre para o validador Central
        const url_central = configurar_url_base('master');
        const res = await axios.post(`${url_central}/admin/resetar-senha`, form.value, {
            headers: { 'Accept': 'application/json' }
        });
        
        alert(res.data.mensagem);
        router.push('/login');
    } catch (erro) {
        alert(erro.response?.data?.mensagem || "Erro ao redefinir senha.");
    } finally {
        carregando.value = false;
    }
};
</script>