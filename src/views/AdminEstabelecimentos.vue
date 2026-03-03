<template>
  <div class="admin_container min-h-screen bg-gray-100 font-sans p-8">
    <header class="flex justify-between items-center mb-8 bg-nitec_dark p-6 rounded-2xl shadow-lg">
        <div>
            <h2 class="text-2xl font-black text-nitec_blue uppercase tracking-tighter">Gestão22 de Estabelecimentos (SaaS)</h2>
            <p class="text-xs text-gray-400 uppercase font-bold">Painel de Controle Central Nitec</p>
        </div>
        <button @click="$router.push('/painel-central')" class="text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all text-sm uppercase font-bold">
            Voltar ao Dashboard
        </button>
    </header>

    <section class="card_cadastro bg-white p-8 rounded-3xl shadow-sm border border-gray-200 mb-8">
        <h3 class="text-xl font-black text-gray-800 uppercase italic mb-6">Provisionar Novo Cliente SaaS</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input v-model="novo_bar.id_do_bar" class="p-4 bg-gray-50 border border-gray-200 rounded-xl" placeholder="ID do Tenant (ex: bar_nicolas)" />
            <input v-model="novo_bar.dominio" class="p-4 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Domínio (ex: bar.localhost)" />
            
            <input v-model="novo_bar.nome_dono" class="p-4 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Nome do Cliente/Dono" />
            <input v-model="novo_bar.email_dono" class="p-4 bg-gray-50 border border-gray-200 rounded-xl" placeholder="E-mail de Acesso" />
            <input v-model="novo_bar.senha_dono" type="password" class="p-4 bg-gray-50 border border-gray-200 rounded-xl" placeholder="Senha Inicial" />

            <button @click="registrar_estabelecimento" class="bg-nitec_blue hover:bg-blue-600 text-white font-black uppercase rounded-xl transition-all h-full">
                Criar Empresa e Banco
            </button>
        </div>
    </section>

    <div class="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
        <table class="w-full text-left border-collapse">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="p-6 text-xs font-black uppercase text-gray-400">ID do Cliente</th>
              <th class="p-6 text-xs font-black uppercase text-gray-400">Domínio Ativo</th>
              <th class="p-6 text-xs font-black uppercase text-gray-400">Data de Criação</th>
              <th class="p-6 text-xs font-black uppercase text-gray-400 text-right">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="bar in lista_de_estabelecimentos" :key="bar.id" class="hover:bg-gray-50 transition-colors">
              <td class="p-6 font-bold text-gray-700">{{ bar.id }}</td>
              <td class="p-6 text-nitec_blue font-mono text-sm">{{ bar.domains[0]?.domain }}</td>
              <td class="p-6 text-gray-500 text-sm">{{ bar.created_at }}</td>
              <td class="p-6 text-right">
                <button @click="acessar_suporte(bar.id)" class="bg-nitec_dark hover:bg-black text-nitec_blue px-4 py-2 rounded-lg text-xs font-black uppercase transition-all">
                  Acesso Suporte
                </button>
              </td>
            </tr>
          </tbody>
        </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api_cliente from '../servicos/api_cliente.js';

const lista_de_estabelecimentos = ref([]);
const novo_bar = ref({ 
    id_do_bar: '', 
    dominio: '',
    nome_dono: '',
    email_dono: '',
    senha_dono: ''
});

const carregar_dados = async () => {
  try {
    const resposta = await api_cliente.get('/admin/listar-estabelecimentos');
    lista_de_estabelecimentos.value = resposta.data.dados || [];
  } catch (erro) {
    console.error("Erro ao carregar bares:", erro);
  }
};

const registrar_estabelecimento = async () => {
  if(!novo_bar.value.id_do_bar || !novo_bar.value.dominio) return alert("Preencha todos os campos.");
  
  try {
    await api_cliente.post('/admin/cadastrar-novo-bar', novo_bar.value);
    novo_bar.value = { id_do_bar: '', dominio: '', nome_dono: '', email_dono: '', senha_dono: '' };
    carregar_dados();
    alert("Bar provisionado com sucesso!");
  } catch (erro) {
    alert("Erro ao registrar bar.");
  }
};

const acessar_suporte = async (tenant_id) => {
  try {
    const resposta = await api_cliente.get(`/admin/gerar-acesso-suporte/${tenant_id}`);
    if (resposta.data.sucesso) {
      // 1. Guarda a sessão do Super Admin
      const token_original = localStorage.getItem('nitec_token');
      localStorage.setItem('nitec_token_admin', token_original);
      
      // 2. Define o contexto do cliente
      localStorage.setItem('nitec_token', resposta.data.token);
      localStorage.setItem('nitec_modo_suporte', 'ativo');
      localStorage.setItem('nitec_api_tenant', resposta.data.api_url);
      localStorage.setItem('nitec_nome_cliente', resposta.data.nome_dono);

      // 3. Força um reload local para limpar a memória da store e aplicar a nova base URL no Axios
      window.location.href = '/painel-central';
    }
  } catch (erro) {
    alert("Erro: " + (erro.response?.data?.erro || "Falha ao aceder ao suporte."));
  }
};

onMounted(carregar_dados);
</script>