import { createRouter, createWebHistory } from 'vue-router';
import PaginaLogin from '../views/PaginaLogin.vue';
import PaginaDashboard from '../views/PaginaDashboard.vue';

/**
 * Array central de rotas do Front-end Nitec.
 * URLs em kebab-case e componentes em PascalCase.
 * * @type {Array<Object>}
 */
const rotas_do_aplicativo = [
    {
        path: '/login',
        name: 'rota_login',
        component: PaginaLogin
    },
    {
        path: '/painel-central',
        name: 'painel_dashboard',
        component: PaginaDashboard
    },
    {
        path: '/mapa-mesas',
        name: 'gestao_mesas',
        // Componente do mapa visual das mesas (Verde/Vermelho)
        component: () => import('../views/PaginaMesas.vue')
    },
    {
        path: '/pdv-caixa',
        name: 'pdv_frente_caixa',
        component: () => import('../views/PaginaPdv.vue')
    },
    {
        path: '/produtos',
        name: 'gestao_produtos',
        component: () => import('../views/PaginaProdutos.vue')
    },
    {
        path: '/',
        redirect: '/login'
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/login'
    },

    {
        path: '/mesa/:id_mesa/detalhes',
        name: 'detalhes_mesa',
        component: () => import('../views/PaginaMesaDetalhes.vue')
    },

    {
    path: '/gestao-comandas',
    name: 'gestao_comandas',
    component: () => import('../views/PaginaComandas.vue')
    },
];

const roteador_principal = createRouter({
    history: createWebHistory(),
    routes: rotas_do_aplicativo
});

export default roteador_principal;