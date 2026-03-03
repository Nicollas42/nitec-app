// C:\PDP\NITEC_APP\src\router\roteador_principal.js
import { createRouter, createWebHashHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';
import PaginaLogin from '../views/PaginaLogin.vue';
import PaginaDashboard from '../views/PaginaDashboard.vue';
import AdminEstabelecimentos from '../views/AdminEstabelecimentos.vue';
import RedefinirSenha from '../views/RedefinirSenha.vue'; // <-- Importação da nova tela

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
        // <-- NOVA ROTA AQUI
        path: '/redefinir-senha',
        name: 'redefinir_senha',
        component: RedefinirSenha,
        meta: { requer_auth: false } 
    },
    {
        path: '/painel-central',
        name: 'painel_dashboard',
        component: PaginaDashboard,
        meta: { requer_auth: true } 
    },
    {
        path: '/admin-estabelecimentos',
        name: 'admin_central',
        component: AdminEstabelecimentos,
        meta: { requer_auth: true, papeis_permitidos: ['admin_master'] }
    },
    {
        path: '/mapa-mesas',
        name: 'gestao_mesas',
        component: () => import('../views/PaginaMesas.vue'),
        meta: { requer_auth: true, papeis_permitidos: ['dono', 'caixa', 'garcom'] }
    },
    {
        path: '/pdv-caixa',
        name: 'pdv_frente_caixa',
        component: () => import('../views/PaginaPdv.vue'),
        meta: { requer_auth: true, papeis_permitidos: ['dono', 'caixa'] } 
    },
    {
        path: '/produtos',
        name: 'gestao_produtos',
        component: () => import('../views/PaginaProdutos.vue'),
        meta: { requer_auth: true, papeis_permitidos: ['dono'] } 
    },
    {
        path: '/comandas',
        name: 'gestao_comandas',
        component: () => import('../views/PaginaComandas.vue'),
        meta: { requer_auth: true, papeis_permitidos: ['dono', 'caixa', 'garcom'] }
    }
];

const roteador_principal = createRouter({
    history: createWebHashHistory(),
    routes: rotas_do_aplicativo
});

roteador_principal.beforeEach((to, from, next) => {
    const loja_auth = useAuthStore();
    
    // 1. Interceção do Token de Suporte SaaS
    const token_suporte = to.query.token;
    
    // O PULO DO GATO: Se a rota for de redefinir senha, deixa o token em paz!
    if (token_suporte && to.path !== '/redefinir-senha') {
        localStorage.setItem('nitec_token', token_suporte);
        loja_auth.token_acesso = token_suporte;
        
        const query_limpa = { ...to.query };
        delete query_limpa.token;
        return next({ path: to.path, query: query_limpa });
    }

    const esta_autenticado = !!loja_auth.token_acesso || !!localStorage.getItem('nitec_token');

    // 2. Proteção de Autenticação Básica
    if (to.meta.requer_auth && !esta_autenticado) {
        return next('/login');
    }

    // 3. Controle de Acesso Baseado em Perfis (RBAC)
    if (to.meta.papeis_permitidos && esta_autenticado) {
        const usuario = loja_auth.usuario_logado || JSON.parse(localStorage.getItem('nitec_usuario'));

        if (!usuario || !to.meta.papeis_permitidos.includes(usuario.tipo_usuario)) {
            alert('Acesso negado. O seu perfil ('+ (usuario?.tipo_usuario || 'desconhecido') +') não tem permissão para acessar esta área.');
            return next('/painel-central');
        }
    }

    next();
});

export default roteador_principal;