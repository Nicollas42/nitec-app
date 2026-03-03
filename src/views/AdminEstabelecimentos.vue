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
            <input v-model="novo_bar.id_do_bar" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="ID do Tenant (ex: bar1)" />
            <input v-model="novo_bar.dominio" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="Domínio (ex: bar1.nitec.localhost)" />
            <input v-model="novo_bar.nome_dono" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="Nome do Proprietário" />
            <input v-model="novo_bar.email_dono" type="email" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="E-mail de Acesso" />
            <input v-model="novo_bar.senha_dono" type="password" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="Senha Inicial" />
            <input v-model="novo_bar.cnpj" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="CNPJ (Opcional)" />
            <input v-model="novo_bar.telefone" class="p-4 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-nitec_blue" placeholder="Telefone (Opcional)" />
            
            <button @click="registrar_estabelecimento" class="col-span-1 md:col-span-2 lg:col-span-2 bg-nitec_blue hover:bg-blue-700 text-white font-black uppercase rounded-xl transition-all shadow-lg p-4">
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
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">CNPJ</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="bar in estabelecimentos_ativos" :key="bar.id" class="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td class="py-4 px-2 font-bold text-gray-700">{{ bar.id }}</td>
                        <td class="py-4 px-2 text-blue-600 font-medium text-sm">http://{{ bar.domains?.[0]?.domain }}:5173</td>
                        <td class="py-4 px-2">
                            <p class="text-sm font-bold text-gray-800">{{ bar.nome_dono || 'N/A' }}</p>
                            <p class="text-xs text-gray-500">{{ bar.telefone || 'Sem telefone' }}</p>
                        </td>
                        <td class="py-4 px-2 text-sm font-bold text-gray-700">{{ bar.email_dono || 'Sem e-mail' }}</td>
                        <td class="py-4 px-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 min-w-[70px] text-center">
                                    {{ senhas_visiveis[bar.id] ? (bar.senha_inicial || '***') : '••••••••' }}
                                </span>
                                <button @click="alternar_senha(bar.id)" class="text-gray-400 hover:text-gray-700 transition-colors outline-none">
                                    {{ senhas_visiveis[bar.id] ? '🙈' : '👁️' }}
                                </button>
                            </div>
                        </td>
                        <td class="py-4 px-2 text-sm text-gray-600">{{ bar.cnpj || 'Não informado' }}</td>
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
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400">CNPJ</th>
                        <th class="py-4 px-2 text-xs font-black uppercase text-gray-400 text-right">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="bar in estabelecimentos_inativos" :key="bar.id" class="border-b border-gray-50 opacity-70">
                        <td class="py-4 px-2 font-bold text-gray-400 line-through">{{ bar.id }}</td>
                        <td class="py-4 px-2 text-blue-400 font-medium text-sm line-through">http://{{ bar.domains?.[0]?.domain }}:5173</td>
                        <td class="py-4 px-2">
                            <p class="text-sm font-bold text-gray-800">{{ bar.nome_dono || 'N/A' }}</p>
                            <p class="text-xs text-gray-500">{{ bar.telefone || 'Sem telefone' }}</p>
                        </td>
                        <td class="py-4 px-2 text-sm font-bold text-gray-700">{{ bar.email_dono || 'Sem e-mail' }}</td>
                        <td class="py-4 px-2">
                            <div class="flex items-center gap-2">
                                <span class="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600 min-w-[70px] text-center">
                                    {{ senhas_visiveis[bar.id] ? (bar.senha_inicial || '***') : '••••••••' }}
                                </span>
                                <button @click="alternar_senha(bar.id)" class="text-gray-400 hover:text-gray-700 transition-colors outline-none">
                                    {{ senhas_visiveis[bar.id] ? '🙈' : '👁️' }}
                                </button>
                            </div>
                        </td>
                        <td class="py-4 px-2 text-sm text-gray-600">{{ bar.cnpj || 'Não informado' }}</td>
                        <td class="py-4 px-2 text-sm text-gray-400">{{ bar.data?.cnpj || 'Não informado' }}</td>
                        <td class="py-4 px-2 text-right flex justify-end gap-2 items-center">
                            <button @click="alternar_status(bar.id)" class="bg-green-500 hover:bg-green-600 text-white text-[10px] font-black uppercase px-3 py-2 rounded-lg shadow-md transition-colors">
                                Reativar Acesso
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
import { ref, onMounted } from 'vue';
import axios from 'axios';
import api_cliente, { configurar_url_base } from '../servicos/api_cliente.js';

const estabelecimentos_ativos = ref([]);
const estabelecimentos_inativos = ref([]);
const novo_bar = ref({ id_do_bar: '', dominio: '', nome_dono: '', email_dono: '', senha_dono: '', cnpj: '', telefone: '' });

// Estado para controlar a visibilidade das senhas (dicionário id -> boolean)
const senhas_visiveis = ref({});

const alternar_senha = (id) => {
    senhas_visiveis.value[id] = !senhas_visiveis.value[id];
};

const carregar_dados = async () => {
  try {
    const resposta = await api_cliente.get('/admin/listar-estabelecimentos');
    if (resposta.data.ativos || resposta.data.inativos) {
        estabelecimentos_ativos.value = resposta.data.ativos || [];
        estabelecimentos_inativos.value = resposta.data.inativos || [];
    } else {
        estabelecimentos_ativos.value = resposta.data.dados || [];
        estabelecimentos_inativos.value = [];
    }
  } catch (erro) {
    console.error("Erro ao listar:", erro);
  }
};

const registrar_estabelecimento = async () => {
  if(!novo_bar.value.id_do_bar || !novo_bar.value.dominio) return alert("Preencha ID e Domínio.");
  try {
    await api_cliente.post('/admin/cadastrar-novo-bar', novo_bar.value);
    novo_bar.value = { id_do_bar: '', dominio: '', nome_dono: '', email_dono: '', senha_dono: '', cnpj: '', telefone: '' };
    carregar_dados();
    alert("Cliente SaaS criado com sucesso!");
  } catch (erro) {
    alert("Erro ao registrar.");
  }
};

const alternar_status = async (id) => {
    if(!confirm("Deseja alterar o status de acesso deste cliente?")) return;
    try {
        const resposta = await api_cliente.put(`/admin/alternar-status-bar/${id}`);
        alert(resposta.data.mensagem);
        carregar_dados();
    } catch (erro) {
        alert("Erro ao alterar status.");
    }
};

const excluir_cliente = async (id) => {
    const confirmacao = confirm(`⚠️ ATENÇÃO EXTREMA!\n\nVocê está prestes a EXCLUIR PERMANENTEMENTE o cliente '${id}'.\nIsso apagará o banco de dados dele e todas as informações. \n\nDeseja realmente continuar?`);
    
    if(!confirmacao) return;

    try {
        const resposta = await api_cliente.delete(`/admin/excluir-bar/${id}`);
        alert(resposta.data.mensagem);
        carregar_dados(); 
    } catch (erro) {
        alert("Erro ao excluir o cliente permanentemente.");
        console.error(erro);
    }
};

const acessar_suporte = async (tenant_id) => {
  try {
    const url_central = configurar_url_base('master'); 
    
    const resposta = await axios.get(`${url_central}/admin/gerar-acesso-suporte/${tenant_id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('nitec_token')}`
        }
    });

    if (resposta.data.sucesso) {
      localStorage.setItem('nitec_token_admin', localStorage.getItem('nitec_token'));
      localStorage.setItem('nitec_usuario_admin', localStorage.getItem('nitec_usuario')); 
      
      localStorage.setItem('nitec_token', resposta.data.token);
      localStorage.setItem('nitec_modo_suporte', 'ativo');
      localStorage.setItem('nitec_api_tenant', resposta.data.api_url);
      localStorage.setItem('nitec_nome_cliente', resposta.data.nome_dono);
      localStorage.setItem('nitec_tenant_id', tenant_id); 

      localStorage.setItem('nitec_usuario', JSON.stringify({
          nome: `SUPORTE: ${resposta.data.nome_dono}`,
          tipo_usuario: 'dono' 
      }));

      window.location.hash = '/painel-central';
      window.location.reload();
    }
  } catch (erro) {
    console.error("Falha no suporte:", erro);
    alert("Erro ao conectar com a central para suporte técnico.");
  }
};

onMounted(carregar_dados);
</script>