<template>
  <div class="admin_container h-screen overflow-y-auto bg-gray-100 font-sans p-8">
    <header class="flex justify-between items-center mb-8 bg-nitec_dark p-6 rounded-2xl shadow-lg">
        <div>
            <h2 class="text-2xl font-black text-nitec_blue uppercase tracking-tighter">Gestão SaaS</h2>
            <p class="text-xs text-gray-400 uppercase font-bold">Painel de Controle Central Nitec</p>
        </div>
        <button @click="$router.push('/painel-central')" class="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all text-sm uppercase font-bold">
            Voltar ao Dashboard
        </button>
    </header>

    <section class="card_cadastro bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8">
        <h3 class="text-xl font-black text-gray-800 uppercase italic mb-6">Provisionar Novo Cliente SaaS</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            <div class="flex flex-col">
                <label class="text-xs font-bold text-gray-500 mb-1 ml-1">ID do Tenant</label>
                <input v-model="novo_bar.id_do_bar" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="ex: bardoval" />
            </div>

            <div class="flex flex-col">
                <label class="text-xs font-bold text-gray-500 mb-1 ml-1">Domínio</label>
                <div class="flex">
                    <input v-model="dominio_prefixo" class="p-4 bg-gray-50 border border-gray-200 rounded-l-xl outline-none focus:ring-2 focus:ring-nitec_blue w-full text-right font-bold text-nitec_blue" placeholder="ex: bardoval" />
                    <span class="bg-gray-200 border border-l-0 border-gray-300 rounded-r-xl p-4 text-gray-500 font-bold text-sm flex items-center">.{{ dominio_base }}</span>
                </div>
            </div>

            <div class="flex flex-col">
                <label class="text-xs font-bold text-gray-500 mb-1 ml-1">Nome do Proprietário</label>
                <input v-model="novo_bar.nome_dono" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="Ex: João da Silva" />
            </div>
            
            <div class="flex flex-col">
                <label class="text-xs font-bold text-gray-500 mb-1 ml-1">E-mail</label>
                <input v-model="novo_bar.email_dono" type="email" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="joao@email.com" />
            </div>
            
            <div class="flex flex-col">
                <label class="text-xs font-bold text-gray-500 mb-1 ml-1">Senha Inicial</label>
                <input v-model="novo_bar.senha_dono" type="password" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="••••••••" />
            </div>
            
            <div class="flex flex-col">
                <label class="text-xs font-bold text-gray-500 mb-1 ml-1">CPF ou CNPJ</label>
                <input v-model="novo_bar.cnpj" @input="formatarDocumento" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue font-mono" placeholder="000.000.000-00 ou 00.000.000/0001-00" />
            </div>
            
            <div class="flex flex-col">
                <label class="text-xs font-bold text-gray-500 mb-1 ml-1">Telefone / WhatsApp</label>
                <input v-model="novo_bar.telefone" @input="formatarTelefone" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue font-mono" placeholder="+55 (00) 00000-0000" />
            </div>
            
            <button @click="registrar_estabelecimento" class="col-span-1 md:col-span-2 lg:col-span-2 bg-nitec_blue hover:bg-blue-700 text-white font-black uppercase rounded-xl transition-all shadow-lg p-4 mt-5">
                Criar Estabelecimento
            </button>
        </div>
    </section>

    <section class="lista_estabelecimentos bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8 border-t-4 border-t-green-500">
        <h3 class="text-xl font-black text-gray-800 uppercase italic mb-6">🟢 Clientes Ativos</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left whitespace-nowrap">
                <thead>
                    <tr class="border-b border-gray-100">
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">ID / Tenant</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">Domínio</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">Contato (Nome/Tel)</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">E-mail</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">Senha</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">CPF/CNPJ</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="bar in estabelecimentos_ativos" :key="bar.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td class="py-4 px-2 font-bold text-gray-700">{{ bar.id }}</td>
                        <td class="py-4 px-2 text-blue-600 font-medium text-sm">http://{{ bar.domains?.[0]?.domain }}:5173</td>
                        <td class="py-4 px-2">
                            <p class="text-sm font-bold text-gray-800">{{ bar.nome_dono || 'N/A' }}</p>
                            <p class="text-xs text-gray-500 font-mono mt-1">{{ bar.telefone || 'Sem telefone' }}</p>
                        </td>
                        <td class="py-4 px-2 text-sm font-bold text-gray-700">{{ bar.email_dono || 'Sem e-mail' }}</td>
                        <td class="py-4 px-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 min-w-[70px] text-center border border-gray-200">
                                    {{ senhas_visiveis[bar.id] ? (bar.senha_inicial || '***') : '••••••••' }}
                                </span>
                                <button @click="alternar_senha(bar.id)" class="text-gray-400 hover:text-gray-700 transition-colors outline-none">
                                    {{ senhas_visiveis[bar.id] ? '🙈' : '👁️' }}
                                </button>
                            </div>
                        </td>
                        <td class="py-4 px-2 text-sm text-gray-600 font-mono">{{ bar.cnpj || 'Não informado' }}</td>
                        <td class="py-4 px-2 text-right flex justify-end gap-2 items-center">
                            <button @click="acessar_suporte(bar.id)" class="bg-gray-800 hover:bg-black text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-colors">
                                Suporte
                            </button>
                            <button @click="alternar_status(bar.id)" class="bg-red-500 hover:bg-red-700 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg transition-colors">
                                Desativar
                            </button>
                        </td>
                    </tr>
                    <tr v-if="estabelecimentos_ativos.length === 0">
                        <td colspan="7" class="text-center py-6 text-gray-400 text-sm">Nenhum cliente ativo no momento.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>

    <section class="lista_estabelecimentos bg-white p-8 rounded-3xl shadow-sm border border-gray-200 border-t-4 border-t-red-500 opacity-90">
        <h3 class="text-xl font-black text-gray-800 uppercase italic mb-6">🔴 Clientes Inativos (Bloqueados)</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left whitespace-nowrap">
                <thead>
                    <tr class="border-b border-gray-100">
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">ID / Tenant</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">Domínio</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">Contato (Nome/Tel)</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">E-mail</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">Senha</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">CPF/CNPJ</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="bar in estabelecimentos_inativos" :key="bar.id" class="border-b border-gray-50 opacity-70 hover:bg-red-50 transition-colors">
                        <td class="py-4 px-2 font-bold text-gray-400 line-through">{{ bar.id }}</td>
                        <td class="py-4 px-2 text-blue-400 font-medium text-sm line-through">http://{{ bar.domains?.[0]?.domain }}:5173</td>
                        <td class="py-4 px-2">
                            <p class="text-sm font-bold text-gray-500">{{ bar.nome_dono || 'N/A' }}</p>
                            <p class="text-xs text-gray-400 font-mono mt-1">{{ bar.telefone || 'Sem telefone' }}</p>
                        </td>
                        <td class="py-4 px-2 text-sm font-bold text-gray-500">{{ bar.email_dono || 'Sem e-mail' }}</td>
                        <td class="py-4 px-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-400 min-w-[70px] text-center border border-gray-200">
                                    {{ senhas_visiveis[bar.id] ? (bar.senha_inicial || '***') : '••••••••' }}
                                </span>
                                <button @click="alternar_senha(bar.id)" class="text-gray-300 hover:text-gray-500 transition-colors outline-none">
                                    {{ senhas_visiveis[bar.id] ? '🙈' : '👁️' }}
                                </button>
                            </div>
                        </td>
                        <td class="py-4 px-2 text-sm text-gray-400 font-mono">{{ bar.cnpj || 'Não informado' }}</td>
                        <td class="py-4 px-2 text-right flex justify-end gap-2 items-center">
                            <button @click="alternar_status(bar.id)" class="bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg shadow-md transition-colors">
                                Reativar
                            </button>
                            <button @click="excluir_cliente(bar.id)" class="bg-red-600 hover:bg-red-800 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg shadow-md transition-colors">
                                🗑️ Excluir
                            </button>
                        </td>
                    </tr>
                    <tr v-if="estabelecimentos_inativos.length === 0">
                        <td colspan="7" class="text-center py-6 text-gray-400 text-sm">Nenhum cliente inativo.</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </section>
  </div>
</template>

<script setup>
import { useAdminEstabelecimentos } from './AdminEstabelecimentos.js';

// Importa e desestrutura tudo o que precisamos do ficheiro de lógica
const {
    estabelecimentos_ativos,
    estabelecimentos_inativos,
    novo_bar,
    senhas_visiveis,
    dominio_base,
    dominio_prefixo,
    alternar_senha,
    formatarTelefone,
    formatarDocumento,
    registrar_estabelecimento,
    alternar_status,
    excluir_cliente,
    acessar_suporte
} = useAdminEstabelecimentos();
</script>