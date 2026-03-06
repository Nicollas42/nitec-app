import { createRouter, createWebHashHistory } from 'vue-router';
import { h } from 'vue'; 
import { useAuthStore } from '../stores/auth_store.js';
import PaginaLogin from '../views/PaginaLogin.vue';
import PaginaDashboard from '../views/PaginaDashboard.vue';
import AdminEstabelecimentos from '../views/AdminEstabelecimentos.vue';
import RedefinirSenha from '../views/RedefinirSenha.vue'; 

const rotas_do_aplicativo = [
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'rota_login',
        component: PaginaLogin,
        meta: { requer_auth: false }
    },
    {
        path: '/redefinir-senha',
        name: 'redefinir_senha',
        component: RedefinirSenha,
        meta: { requer_auth: false } 
    },
    // ==========================================
    // ROTA PAI: O DASHBOARD COM AS ABAS
    // ==========================================
    {
        path: '/app',
        component: PaginaDashboard,
        meta: { requer_auth: true },
        children: [
            {
                path: '/painel-central',
                name: 'painel_dashboard',
                // Tela vazia no PC dizendo para escolher uma aba
                component: { 
                    render: () => h('div', { class: 'hidden md:flex justify-center items-center h-full text-gray-400 font-bold text-xl uppercase tracking-widest mt-20' }, '👆 Selecione uma opção no menu acima') 
                }
            },
            {
                path: '/admin-estabelecimentos',
                name: 'admin_central',
                component: AdminEstabelecimentos,
                meta: { papeis_permitidos: ['admin_master'] }
            },
            {
                path: '/mapa-mesas',
                name: 'gestao_mesas',
                component: () => import('../views/PaginaMesas.vue'),
                meta: { papeis_permitidos: ['admin_master', 'dono', 'caixa', 'garcom'] }
            },
            {
                // 👇 A ROTA DA COMANDA DA MESA FICA AQUI DENTRO!
                path: '/mesa/:id_mesa/detalhes',
                name: 'detalhes_mesa',
                component: () => import('../views/PaginaMesaDetalhes.vue'),
                meta: { papeis_permitidos: ['admin_master', 'dono', 'caixa', 'garcom'] }
            },
            {
                path: '/pdv-caixa',
                name: 'pdv_frente_caixa',
                component: () => import('../views/PaginaPdv.vue'),
                meta: { papeis_permitidos: ['admin_master', 'dono', 'caixa'] } 
            },
            {
                path: '/produtos',
                name: 'gestao_produtos',
                component: () => import('../views/PaginaProdutos.vue'),
                meta: { papeis_permitidos: ['admin_master', 'dono'] } 
            },
            {
                path: '/comandas',
                name: 'gestao_comandas',
                component: () => import('../views/PaginaComandas.vue'),
                meta: { papeis_permitidos: ['admin_master', 'dono', 'caixa', 'garcom'] }
            },
            {
                path: '/permissoes',
                name: 'gestao_permissoes',
                component: () => import('../views/PaginaPermissoes.vue'),
                meta: { papeis_permitidos: ['admin_master', 'dono'] }
            }
        ]
    }
];

const roteador_principal = createRouter({
    history: createWebHashHistory(),
    routes: rotas_do_aplicativo
});

roteador_principal.beforeEach((to, from) => {
    const loja_auth = useAuthStore();
    
    // 1. Interceção do Token de Suporte SaaS
    const token_suporte = to.query.token;
    if (token_suporte && to.path !== '/redefinir-senha') {
        localStorage.setItem('nitec_token', token_suporte);
        loja_auth.token_acesso = token_suporte;
        const query_limpa = { ...to.query };
        delete query_limpa.token;
        return { path: to.path, query: query_limpa };
    }

    const esta_autenticado = !!loja_auth.token_acesso || !!localStorage.getItem('nitec_token');

    // 2. Proteção de Autenticação Básica
    if (to.meta.requer_auth && !esta_autenticado) {
        return '/login';
    }

    // 3. Controle de Acesso Baseado em Perfis (RBAC)
    if (to.meta.papeis_permitidos && esta_autenticado) {
        const usuario = loja_auth.usuario_logado || JSON.parse(localStorage.getItem('nitec_usuario'));

        // Se o usuário não tiver permissão E não for admin_master, barra o acesso.
        if (!usuario || (!to.meta.papeis_permitidos.includes(usuario.tipo_usuario) && usuario.tipo_usuario !== 'admin_master')) {
            alert(`Acesso negado. O seu perfil (${usuario?.tipo_usuario || 'desconhecido'}) não tem permissão para acessar esta área.`);
            return '/painel-central';
        }
    }

    return true; 
});

export default roteador_principal;