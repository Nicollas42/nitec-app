<template>
  <div class="admin_container h-full overflow-y-auto bg-gray-50 font-sans p-6 md:p-10">
    
    <header class="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
            <h2 class="text-2xl font-black text-gray-800 tracking-tight">Gestão de Clientes SaaS</h2>
            <p class="text-sm text-gray-500 mt-1">Gerencie locatários, acesse suportes e monitore instâncias.</p>
        </div>
        <div class="flex gap-3 w-full md:w-auto">
            <button @click="$router.push('/painel-central')" class="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 text-sm font-bold transition-all flex-1 md:flex-none">
                Voltar
            </button>
            <button @click="modal_novo_cliente = true" class="px-5 py-2.5 bg-nitec_blue text-white rounded-lg hover:bg-blue-700 text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 flex-1 md:flex-none">
                <span>➕</span> Novo Cliente
            </button>
        </div>
    </header>

    <section class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div class="flex border-b border-gray-200 bg-gray-50/50">
            <button @click="aba_atual = 'ativos'" 
                    :class="aba_atual === 'ativos' ? 'border-b-2 border-nitec_blue text-nitec_blue bg-white' : 'text-gray-500 hover:text-gray-700'"
                    class="px-6 py-4 text-sm font-bold transition-all flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="aba_atual === 'ativos' ? 'bg-green-500' : 'bg-gray-300'"></span>
                Ativos ({{ estabelecimentos_ativos.length }})
            </button>
            <button @click="aba_atual = 'inativos'" 
                    :class="aba_atual === 'inativos' ? 'border-b-2 border-red-500 text-red-600 bg-white' : 'text-gray-500 hover:text-gray-700'"
                    class="px-6 py-4 text-sm font-bold transition-all flex items-center gap-2">
                <span class="w-2 h-2 rounded-full" :class="aba_atual === 'inativos' ? 'bg-red-500' : 'bg-gray-300'"></span>
                Inativos ({{ estabelecimentos_inativos.length }})
            </button>
        </div>

        <div class="overflow-x-auto">
            <table class="w-full text-left whitespace-nowrap text-sm">
                <thead class="bg-gray-50 text-gray-500">
                    <tr>
                        <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Tenant / Status</th>
                        <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Domínio</th>
                        <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Contato Responsável</th>
                        <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider">Credencial Base</th>
                        <th class="py-3 px-6 font-bold uppercase text-[10px] tracking-wider text-right">Ações de Gestão</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                    <tr v-for="bar in (aba_atual === 'ativos' ? estabelecimentos_ativos : estabelecimentos_inativos)" :key="bar.id" 
                        class="hover:bg-gray-50 transition-colors group"
                        :class="aba_atual === 'inativos' ? 'opacity-75' : ''">
                        
                        <td class="py-4 px-6">
                            <div class="flex items-center gap-3">
                                <span class="w-2 h-2 rounded-full shrink-0" :class="aba_atual === 'ativos' ? 'bg-green-500' : 'bg-red-500'"></span>
                                <span class="font-bold text-gray-800">{{ bar.id }}</span>
                            </div>
                        </td>
                        
                        <td class="py-4 px-6 text-gray-600 font-mono text-xs">
                            {{ bar.domains?.[0]?.domain }}<span class="text-gray-300">.{{ dominio_base }}</span>
                        </td>
                        
                        <td class="py-4 px-6">
                            <p class="font-bold text-gray-800">{{ bar.nome_dono || 'N/A' }}</p>
                            <p class="text-xs text-gray-500">{{ bar.email_dono || 'Sem e-mail' }} • {{ bar.telefone || 'Sem telefone' }}</p>
                        </td>
                        
                        <td class="py-4 px-6">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 min-w-[70px] text-center border border-gray-200">
                                    {{ senhas_visiveis[bar.id] ? (bar.senha_inicial || '***') : '••••••••' }}
                                </span>
                                <button @click="alternar_senha(bar.id)" class="text-gray-400 hover:text-gray-700 outline-none">
                                    {{ senhas_visiveis[bar.id] ? '🙈' : '👁️' }}
                                </button>
                            </div>
                        </td>
                        
                        <td class="py-4 px-6 text-right flex justify-end gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <template v-if="aba_atual === 'ativos'">
                                <button @click="acessar_suporte(bar.id)" class="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-md transition-colors border border-gray-200">
                                    Acessar Suporte
                                </button>
                                <button @click="alternar_status(bar.id)" class="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold px-3 py-1.5 rounded-md transition-colors border border-red-100">
                                    Bloquear
                                </button>
                            </template>
                            <template v-else>
                                <button @click="alternar_status(bar.id)" class="bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold px-3 py-1.5 rounded-md transition-colors border border-green-200">
                                    Reativar Acesso
                                </button>
                                <button @click="excluir_cliente(bar.id)" class="bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold px-3 py-1.5 rounded-md transition-colors border border-red-200">
                                    Excluir Base
                                </button>
                            </template>
                        </td>
                    </tr>
                    
                    <tr v-if="(aba_atual === 'ativos' && estabelecimentos_ativos.length === 0) || (aba_atual === 'inativos' && estabelecimentos_inativos.length === 0)">
                        <td colspan="5" class="text-center py-10 text-gray-400 text-sm">
                            Nenhum cliente {{ aba_atual === 'ativos' ? 'ativo' : 'inativo' }} encontrado nesta lista.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <div v-if="modal_novo_cliente" class="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div class="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                <div>
                    <h3 class="text-lg font-black text-gray-800">Novo Cliente SaaS</h3>
                    <p class="text-xs text-gray-500">Provisionamento de nova instância e banco de dados.</p>
                </div>
                <button @click="modal_novo_cliente = false" class="text-gray-400 hover:text-red-500 font-bold text-xl transition-colors">&times;</button>
            </div>
            
            <div class="p-6 overflow-y-auto">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div class="flex flex-col">
                        <label class="text-xs font-bold text-gray-600 mb-1">ID do Tenant</label>
                        <input v-model="novo_bar.id_do_bar" class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue" placeholder="ex: cantina_silva" />
                    </div>

                    <div class="flex flex-col">
                        <label class="text-xs font-bold text-gray-600 mb-1">Subdomínio</label>
                        <div class="flex">
                            <input v-model="dominio_prefixo" class="px-3 py-2 bg-white border border-gray-300 border-r-0 rounded-l-lg text-sm outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue w-full text-right font-bold text-nitec_blue" placeholder="cantinasilva" />
                            <span class="bg-gray-100 border border-gray-300 rounded-r-lg px-3 py-2 text-gray-500 text-sm flex items-center">.{{ dominio_base }}</span>
                        </div>
                    </div>

                    <div class="flex flex-col">
                        <label class="text-xs font-bold text-gray-600 mb-1">Nome do Proprietário</label>
                        <input v-model="novo_bar.nome_dono" class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue" placeholder="João da Silva" />
                    </div>
                    
                    <div class="flex flex-col">
                        <label class="text-xs font-bold text-gray-600 mb-1">E-mail Administrativo</label>
                        <input v-model="novo_bar.email_dono" type="email" class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue" placeholder="joao@email.com" />
                    </div>
                    
                    <div class="flex flex-col">
                        <label class="text-xs font-bold text-gray-600 mb-1">CPF ou CNPJ</label>
                        <input v-model="novo_bar.cnpj" @input="formatarDocumento" class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue font-mono" placeholder="000.000.000-00" />
                    </div>
                    
                    <div class="flex flex-col">
                        <label class="text-xs font-bold text-gray-600 mb-1">Telefone (WhatsApp)</label>
                        <input v-model="novo_bar.telefone" @input="formatarTelefone" class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue font-mono" placeholder="+55 (00) 00000-0000" />
                    </div>

                    <div class="flex flex-col md:col-span-2">
                        <label class="text-xs font-bold text-gray-600 mb-1">Senha Inicial de Acesso</label>
                        <input v-model="novo_bar.senha_dono" type="password" class="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-nitec_blue focus:border-nitec_blue" placeholder="Mínimo 8 caracteres" />
                    </div>
                </div>
            </div>
            
            <div class="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button @click="modal_novo_cliente = false" class="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
                <button @click="registrar_estabelecimento" class="px-6 py-2 bg-nitec_blue hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition-all">
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