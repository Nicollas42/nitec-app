<template>
    <div class="tela_login flex h-screen bg-[var(--bg-page)] items-center justify-center font-sans transition-colors duration-300">
        <div class="caixa_login bg-[var(--bg-card)] p-10 rounded-2xl shadow-2xl w-full max-w-md border-t-4 border-nitec_blue transition-colors duration-300">
            
            <div class="cabecalho_login text-center mb-8">
                <h1 class="titulo_sistema text-3xl font-black text-[var(--text-primary)] tracking-tight">NitecSystem</h1>
                <p class="subtitulo_sistema text-sm text-[var(--text-muted)] mt-2">Painel de Gestão e PDV</p>
            </div>

            <form @submit.prevent="processar_formulario" class="formulario_login flex flex-col gap-5">
                
                <div class="grupo_input">
                    <label class="rotulo_campo block text-sm font-bold text-[var(--text-primary)] mb-1">E-mail</label>
                    <input v-model="email_input" type="email" placeholder="ex: caixa@loja.com" class="input-padrao w-full p-3 rounded-lg" required>
                </div>

                <div class="grupo_input">
                    <div class="flex justify-between items-end mb-1">
                        <label class="rotulo_campo block text-sm font-bold text-[var(--text-primary)]">Senha</label>
                        <a href="#" @click.prevent="esqueci_senha" class="text-xs text-nitec_blue hover:text-blue-500 hover:underline font-bold transition-colors">
                            Esqueci minha senha
                        </a>
                    </div>
                    <input v-model="senha_input" type="password" placeholder="••••••••" class="input-padrao w-full p-3 rounded-lg" required>
                </div>

                <div class="grupo_input">
                    <label class="rotulo_campo block text-sm font-bold text-[var(--text-primary)] mb-1">Código da Loja (Subdomínio)</label>
                    <input v-model="codigo_loja_input" type="text" placeholder="ex: dubai (ou master)" class="input-padrao w-full p-3 rounded-lg" required>
                </div>

                <div class="flex items-center justify-between mt-1 mb-2">
                    <label class="flex items-center gap-2 text-sm text-[var(--text-muted)] cursor-pointer transition-colors hover:text-[var(--text-primary)]">
                        <input v-model="lembrar_credenciais" type="checkbox" class="w-4 h-4 text-nitec_blue focus:ring-nitec_blue border-[var(--border-subtle)] bg-[var(--bg-page)] rounded cursor-pointer">
                        <span class="font-medium">Lembrar meus dados</span>
                    </label>
                </div>
                <button type="submit" class="botao_entrar w-full bg-nitec_blue hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg shadow-md transition-all active:scale-95 mt-2">
                    ACESSAR O SISTEMA
                </button>
            </form>

            <div class="rodape_login mt-6 text-center text-xs text-[var(--text-muted)]">
                <p>Nitec Tecnologia &copy; 2026</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useLogicaLogin } from './pagina_login_logica.js';

const { 
    codigo_loja_input, 
    email_input, 
    senha_input, 
    lembrar_credenciais, 
    processar_formulario,
    esqueci_senha
} = useLogicaLogin();
</script>