<template>
  <div class="admin_container h-full overflow-y-auto bg-[var(--bg-page)] font-sans p-6 md:p-10 transition-colors duration-300">
    
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 bg-[var(--bg-card)] p-6 rounded-3xl shadow-sm border border-[var(--border-subtle)] transition-colors duration-300">
        <div>
            <h2 class="text-2xl font-black text-[var(--text-primary)] tracking-tight">Gestão de Clientes SaaS</h2>
            <p class="text-sm text-[var(--text-muted)] mt-1">Gerencie locatários, acesse suportes e monitore instâncias.</p>
        </div>
        <div class="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
            <button @click="$router.push('/painel-central')" class="px-5 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] text-[var(--text-primary)] rounded-xl hover:bg-[var(--bg-card-hover)] text-xs font-black uppercase tracking-widest transition-all shadow-sm flex-1 md:flex-none">
                Voltar
            </button>
            <button @click="modal_novo_cliente = true" class="px-5 py-3 bg-nitec_blue text-white rounded-xl hover:bg-blue-700 text-xs font-black uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 flex-1 md:flex-none active:scale-95">
                <span>➕</span> Novo Cliente
            </button>
        </div>
    </header>

    <section class="bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--border-subtle)] overflow-hidden transition-colors duration-300">
        
        <div class="flex border-b border-[var(--border-subtle)] bg-[var(--bg-page)]">
            <button @click="aba_atual = 'ativos'" 
                    :class="aba_atual === 'ativos' ? 'border-b-2 border-nitec_blue text-nitec_blue bg-[var(--bg-card)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
                    class="px-6 py-4 text-xs tracking-widest uppercase font-black transition-all flex items-center justify-center gap-2 flex-1 md:flex-none">
                <span class="w-2 h-2 rounded-full" :class="aba_atual === 'ativos' ? 'bg-green-500' : 'bg-gray-400'"></span>
                Ativos ({{ estabelecimentos_ativos.length }})
            </button>
            <button @click="aba_atual = 'inativos'" 
                    :class="aba_atual === 'inativos' ? 'border-b-2 border-red-500 text-red-500 bg-[var(--bg-card)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'"
                    class="px-6 py-4 text-xs tracking-widest uppercase font-black transition-all flex items-center justify-center gap-2 flex-1 md:flex-none">
                <span class="w-2 h-2 rounded-full" :class="aba_atual === 'inativos' ? 'bg-red-500' : 'bg-gray-400'"></span>
                Inativos ({{ estabelecimentos_inativos.length }})
            </button>
        </div>

        <!-- Visão Desktop: Tabela -->
        <div class="hidden lg:block overflow-x-auto">
            <table class="w-full text-left whitespace-nowrap text-sm">
                <thead class="bg-[var(--bg-page)] text-[var(--text-muted)] transition-colors duration-300 border-b border-[var(--border-subtle)]">
                    <tr>
                        <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">Tenant / Status</th>
                        <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">Domínio</th>
                        <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">Contato Responsável</th>
                        <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-widest">Credencial Base</th>
                        <th class="py-4 px-6 font-bold uppercase text-[10px] tracking-widest text-right">Ações de Gestão</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-[var(--border-subtle)] text-[var(--text-primary)] transition-colors duration-300">
                    <tr v-for="bar in (aba_atual === 'ativos' ? estabelecimentos_ativos : estabelecimentos_inativos)" :key="bar.id" 
                        class="hover:bg-[var(--bg-card-hover)] transition-colors group"
                        :class="aba_atual === 'inativos' ? 'opacity-75' : ''">
                        
                        <td class="py-4 px-6">
                            <div class="flex items-center gap-3">
                                <span class="w-2 h-2 rounded-full shrink-0 shadow-sm" :class="aba_atual === 'ativos' ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'"></span>
                                <span class="font-black tracking-tight text-[var(--text-primary)]">{{ bar.id }}</span>
                            </div>
                        </td>
                        
                        <td class="py-4 px-6 font-mono text-xs text-[var(--text-primary)]">
                            {{ bar.domains?.[0]?.domain }}<span class="text-[var(--text-muted)]">.{{ dominio_base }}</span>
                        </td>
                        
                        <td class="py-4 px-6">
                            <p class="font-bold text-[var(--text-primary)]">{{ bar.nome_dono || 'N/A' }}</p>
                            <p class="text-[10px] uppercase tracking-widest text-[var(--text-muted)] mt-1">{{ bar.email_dono || 'Sem e-mail' }} • {{ bar.telefone || 'Sem telefone' }}</p>
                        </td>
                        
                        <td class="py-4 px-6">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono bg-[var(--bg-page)] px-3 py-1.5 rounded-lg text-[var(--text-primary)] min-w-[80px] text-center border border-[var(--border-subtle)] shadow-inner">
                                    {{ senhas_visiveis[bar.id] ? (bar.senha_inicial || '***') : '••••••••' }}
                                </span>
                                <button @click="alternar_senha(bar.id)" class="text-[var(--text-muted)] hover:text-[var(--text-primary)] outline-none text-lg transition-colors">
                                    {{ senhas_visiveis[bar.id] ? '🙈' : '👁️' }}
                                </button>
                            </div>
                        </td>
                        
                        <td class="py-4 px-6 text-right flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <template v-if="aba_atual === 'ativos'">
                                <button @click="acessar_suporte(bar.id)" class="bg-[var(--bg-page)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-[10px] uppercase tracking-widest font-black px-4 py-2 rounded-lg transition-colors border border-[var(--border-subtle)] shadow-sm">
                                    Suporte
                                </button>
                                <button @click="alternar_status(bar.id)" class="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-black px-4 py-2 rounded-lg transition-colors border border-red-500/20 shadow-sm">
                                    Bloquear
                                </button>
                            </template>
                            <template v-else>
                                <button @click="alternar_status(bar.id)" class="bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[10px] uppercase tracking-widest font-black px-4 py-2 rounded-lg transition-colors border border-green-500/20 shadow-sm">
                                    Reativar
                                </button>
                                <button @click="excluir_cliente(bar.id)" class="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-black px-4 py-2 rounded-lg transition-colors border border-red-500/20 shadow-sm">
                                    Excluir Base
                                </button>
                            </template>
                        </td>
                    </tr>
                    
                    <tr v-if="(aba_atual === 'ativos' && estabelecimentos_ativos.length === 0) || (aba_atual === 'inativos' && estabelecimentos_inativos.length === 0)">
                        <td colspan="5" class="text-center py-12 text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest">
                            Nenhum cliente {{ aba_atual === 'ativos' ? 'ativo' : 'inativo' }} encontrado nesta lista.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Visão Mobile: Cards -->
        <div class="lg:hidden flex flex-col divide-y divide-[var(--border-subtle)] transition-colors duration-300">
            <div v-for="bar in (aba_atual === 'ativos' ? estabelecimentos_ativos : estabelecimentos_inativos)" :key="bar.id" 
                class="p-5 flex flex-col gap-4 bg-[var(--bg-card)] transition-colors"
                :class="aba_atual === 'inativos' ? 'opacity-75' : ''">
                
                <div class="flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" :class="aba_atual === 'ativos' ? 'bg-green-500 shadow-green-500/50' : 'bg-red-500 shadow-red-500/50'"></span>
                        <span class="font-black text-lg tracking-tight text-[var(--text-primary)]">{{ bar.id }}</span>
                    </div>
                    <span class="font-mono text-[10px] text-[var(--text-muted)] bg-[var(--bg-page)] px-2 py-1 rounded border border-[var(--border-subtle)] shadow-inner">
                        {{ bar.domains?.[0]?.domain }}.{{ dominio_base }}
                    </span>
                </div>
                
                <div class="bg-[var(--bg-page)] p-3 rounded-xl border border-[var(--border-subtle)] flex flex-col gap-1 shadow-sm">
                    <p class="font-bold text-[var(--text-primary)] text-sm">{{ bar.nome_dono || 'N/A' }}</p>
                    <p class="text-[10px] uppercase tracking-widest text-[var(--text-muted)]">{{ bar.email_dono || 'Sem e-mail' }} • {{ bar.telefone || 'Sem telefone' }}</p>
                </div>

                <div class="flex justify-between items-center bg-[var(--bg-page)] p-3 rounded-xl border border-[var(--border-subtle)] shadow-sm">
                    <span class="text-[10px] uppercase font-black tracking-widest text-[var(--text-muted)]">Senha Base:</span>
                    <div class="flex items-center gap-2">
                        <span class="text-xs font-mono font-black text-[var(--text-primary)]">
                            {{ senhas_visiveis[bar.id] ? (bar.senha_inicial || '***') : '••••••••' }}
                        </span>
                        <button @click="alternar_senha(bar.id)" class="text-[var(--text-muted)] hover:text-[var(--text-primary)] outline-none text-base">
                            {{ senhas_visiveis[bar.id] ? '🙈' : '👁️' }}
                        </button>
                    </div>
                </div>
                
                <div class="flex gap-2 mt-2">
                    <template v-if="aba_atual === 'ativos'">
                        <button @click="acessar_suporte(bar.id)" class="flex-1 bg-[var(--bg-page)] hover:bg-[var(--bg-card-hover)] text-[var(--text-primary)] text-[10px] uppercase tracking-widest font-black py-3 rounded-xl transition-colors border border-[var(--border-subtle)] shadow-sm">
                            Suporte
                        </button>
                        <button @click="alternar_status(bar.id)" class="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-black py-3 rounded-xl transition-colors border border-red-500/20 shadow-sm">
                            Bloquear
                        </button>
                    </template>
                    <template v-else>
                        <button @click="alternar_status(bar.id)" class="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-500 text-[10px] uppercase tracking-widest font-black py-3 rounded-xl transition-colors border border-green-500/20 shadow-sm">
                            Reativar
                        </button>
                        <button @click="excluir_cliente(bar.id)" class="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] uppercase tracking-widest font-black py-3 rounded-xl transition-colors border border-red-500/20 shadow-sm">
                            Excluir Base
                        </button>
                    </template>
                </div>
            </div>

            <div v-if="(aba_atual === 'ativos' && estabelecimentos_ativos.length === 0) || (aba_atual === 'inativos' && estabelecimentos_inativos.length === 0)" class="p-10 text-center text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">
                Nenhum cliente {{ aba_atual === 'ativos' ? 'ativo' : 'inativo' }} encontrado nesta lista.
            </div>
        </div>
    </section>

    <div v-if="modal_novo_cliente" class="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div class="bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh] border border-[var(--border-subtle)] transition-colors duration-300">
            
            <div class="p-8 border-b border-[var(--border-subtle)] flex justify-between items-start bg-[var(--bg-page)]">
                <div>
                    <h3 class="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight italic">Novo Cliente SaaS</h3>
                    <p class="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-1">Provisionamento de nova instância e banco de dados.</p>
                </div>
                <button @click="modal_novo_cliente = false" class="text-[var(--text-muted)] hover:text-red-500 font-bold text-2xl transition-colors leading-none">&times;</button>
            </div>
            
            <div class="p-8 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">ID do Tenant</label>
                        <input v-model="novo_bar.id_do_bar" class="px-4 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue transition-all shadow-inner" placeholder="ex: cantina_silva" style="color-scheme: dark;" />
                    </div>

                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">Subdomínio</label>
                        <div class="flex">
                            <input v-model="dominio_prefixo" class="px-4 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] border-r-0 rounded-l-2xl text-sm font-black outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue w-full text-right text-nitec_blue transition-all shadow-inner" placeholder="cantinasilva" style="color-scheme: dark;" />
                            <span class="bg-[var(--bg-card)] border border-[var(--border-subtle)] border-l-0 rounded-r-2xl px-4 py-3 text-[var(--text-muted)] text-sm font-bold flex items-center transition-all shadow-inner">.{{ dominio_base }}</span>
                        </div>
                    </div>

                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">Nome do Proprietário</label>
                        <input v-model="novo_bar.nome_dono" class="px-4 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue transition-all shadow-inner" placeholder="João da Silva" style="color-scheme: dark;" />
                    </div>
                    
                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">E-mail Administrativo</label>
                        <input v-model="novo_bar.email_dono" type="email" class="px-4 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue transition-all shadow-inner" placeholder="joao@email.com" style="color-scheme: dark;" />
                    </div>
                    
                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">CPF ou CNPJ</label>
                        <input v-model="novo_bar.cnpj" @input="formatarDocumento" class="px-4 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-2xl text-sm font-mono font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue transition-all shadow-inner" placeholder="000.000.000-00" style="color-scheme: dark;" />
                    </div>
                    
                    <div class="flex flex-col">
                        <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">Telefone (WhatsApp)</label>
                        <input v-model="novo_bar.telefone" @input="formatarTelefone" class="px-4 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-2xl text-sm font-mono font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue transition-all shadow-inner" placeholder="+55 (00) 00000-0000" style="color-scheme: dark;" />
                    </div>

                    <div class="flex flex-col md:col-span-2">
                        <label class="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2 pl-2">Senha Inicial de Acesso</label>
                        <input v-model="novo_bar.senha_dono" type="password" class="px-4 py-3 bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-2xl text-sm font-bold text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue transition-all shadow-inner" placeholder="Mínimo 8 caracteres" style="color-scheme: dark;" />
                    </div>
                </div>
            </div>
            
            <div class="p-6 border-t border-[var(--border-subtle)] bg-[var(--bg-page)] flex flex-col md:flex-row justify-end gap-3">
                <button @click="modal_novo_cliente = false" class="px-6 py-4 md:py-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)] hover:text-[var(--text-primary)] rounded-xl transition-colors border border-[var(--border-subtle)] bg-[var(--bg-page)] md:bg-transparent md:border-transparent w-full md:w-auto">Cancelar</button>
                <button @click="registrar_estabelecimento" class="px-8 py-4 md:py-3 bg-nitec_blue hover:bg-blue-700 text-white text-[10px] uppercase tracking-widest font-black rounded-xl shadow-md transition-all active:scale-95 w-full md:w-auto">
                    Criar Instância
                </button>
            </div>
        </div>
    </div>

  </div>
</template>

<script setup>
import { useAdminEstabelecimentos } from './AdminEstabelecimentos.js';
const {
    estabelecimentos_ativos, estabelecimentos_inativos, novo_bar,
    senhas_visiveis, dominio_base, dominio_prefixo, alternar_senha,
    formatarTelefone, formatarDocumento, registrar_estabelecimento,
    alternar_status, excluir_cliente, acessar_suporte,
    aba_atual, modal_novo_cliente // Variáveis recebidas do JS
} = useAdminEstabelecimentos();
</script>