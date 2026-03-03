<template>
    <div class="tela_login flex h-screen bg-gray-200 items-center justify-center font-sans">
        <div class="caixa_login bg-white p-10 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-nitec_blue">
            
            <div class="cabecalho_login text-center mb-8">
                <h1 class="titulo_sistema text-3xl font-black text-gray-800 tracking-tight">NitecSystem</h1>
                <p class="subtitulo_sistema text-sm text-gray-500 mt-2">Painssel de Gestão e PDV</p>
            </div>

            <form @submit.prevent="processar_formulario" class="formulario_login flex flex-col gap-5">
                
                <div class="grupo_input">
                    <label class="rotulo_campo block text-sm font-bold text-gray-700 mb-1">E-mail</label>
                    <input v-model="email_input" type="email" placeholder="ex: caixa@loja.com" class="campo_texto w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nitec_blue outline-none transition-all" required>
                </div>

                <div class="grupo_input">
                    <label class="rotulo_campo block text-sm font-bold text-gray-700 mb-1">Senha</label>
                    <input v-model="senha_input" type="password" placeholder="••••••••" class="campo_texto w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-nitec_blue outline-none transition-all" required>
                </div>

                <button type="submit" class="botao_entrar w-full bg-nitec_blue hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-colors mt-2">
                    ACESSAR O SISTEMA
                </button>
            </form>

            <div class="rodape_login mt-6 text-center text-xs text-gray-400">
                <p>Nitec Tecnologia &copy; 2026</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useLogicaLogin } from './pagina_login_logica.js';

// Desestruturação da lógica profissional
const { email_input, senha_input, processar_formulario } = useLogicaLogin();
</script>