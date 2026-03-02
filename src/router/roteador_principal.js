import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth_store.js';
import PaginaLogin from '../views/PaginaLogin.vue';
import PaginaDashboard from '../views/PaginaDashboard.vue';
import AdminEstabelecimentos from '../views/AdminEstabelecimentos.vue';

/**
 * Array central de rotas do Front-end Nitec.
 * @type {Array<Object>}
 */
const rotas_do_aplicativo = [
    {
        path: '/login',
        name: 'rota_login',
        component: PaginaLogin,
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
        meta: { requer_auth: true, apenas_admin: true }
    },
    {
        path: '/mapa-mesas',
        name: 'gestao_mesas',
        component: () => import('../views/PaginaMesas.vue'),
        meta: { requer_auth: true }
    },
    {
        path: '/pdv-caixa',
        name: 'pdv_frente_caixa',
        component: () => import('../views/PaginaPdv.vue'),
        meta: { requer_auth: true }
    },
    {
        path: '/produtos',
        name: 'gestao_produtos',
        component: () => import('../views/PaginaProdutos.vue'),
        meta: { requer_auth: true }
    },
    {
        path: '/mesa/:id_mesa/detalhes',
        name: 'detalhes_mesa',
        component: () => import('../views/PaginaMesaDetalhes.vue'),
        meta: { requer_auth: true }
    },
    {
        path: '/gestao-comandas',
        name: 'gestao_comandas',
        component: () => import('../views/PaginaComandas.vue'),
        meta: { requer_auth: true }
    },
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    }
];

/**
 * Instância principal do roteador Vue.
 */
const roteador_principal = createRouter({
    history: createWebHistory(),
    routes: rotas_do_aplicativo
});

/**
 * Guarda de Navegação: Protege as rotas e processa a autenticação automática via token de suporte.
 * * @param {Object} to Rota de destino.
 * @param {Object} from Rota de origem.
 * @param {Function} next Função para prosseguir ou redirecionar.
 */
roteador_principal.beforeEach((to, from, next) => {
    const loja_auth = useAuthStore();

    // 1. Interceção do Token de Suporte SaaS
    // Verifica se a URL contém um parâmetro '?token=' vindo do painel de administração central
    const token_suporte = to.query.token;
    
    if (token_suporte) {
        // Salva a credencial temporária para que o axios (api_cliente) a utilize
        localStorage.setItem('nitec_token', token_suporte);
        loja_auth.token_acesso = token_suporte;

        // Limpa a URL removendo o token visível para não comprometer a segurança da sessão
        const query_limpa = { ...to.query };
        delete query_limpa.token;

        // Redireciona de volta para a mesma rota, mas com a URL limpa
        return next({ path: to.path, query: query_limpa });
    }

    const esta_autenticado = !!loja_auth.token_acesso || !!localStorage.getItem('nitec_token');

    // 2. Proteção de Autenticação Padrão
    if (to.meta.requer_auth && !esta_autenticado) {
        return next('/login');
    }

    // 3. Proteção de Nível Admin (Acesso exclusivo para gestão do SaaS)
    if (to.meta.apenas_admin) {
        const eh_admin = loja_auth.usuario_logado?.tipo_usuario === 'admin';
        if (!eh_admin) {
            return next('/painel-central');
        }
    }

    next();
});

export default roteador_principal;