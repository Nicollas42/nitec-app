import { createRouter, createWebHashHistory } from 'vue-router';
import { h } from 'vue'; 
import { useAuthStore } from '../stores/auth_store.js';
import PaginaLogin from '../views/PaginaLogin.vue';
import PaginaDashboard from '../views/PaginaDashboard.vue';
import AdminEstabelecimentos from '../views/AdminEstabelecimentos.vue';
import RedefinirSenha from '../views/RedefinirSenha.vue'; 

const rotas_do_aplicativo = [
    { path: '/', redirect: '/login' },
    { path: '/login', name: 'rota_login', component: PaginaLogin, meta: { requer_auth: false } },
    { path: '/redefinir-senha', name: 'redefinir_senha', component: RedefinirSenha, meta: { requer_auth: false } },
    {
        path: '/cardapio/mesa/:id_mesa',
        name: 'cardapio_cliente_publico',
        component: () => import('../views/PaginaCardapioCliente.vue'),
        meta: { requer_auth: false }
    },
    
    {
        path: '/app',
        component: PaginaDashboard,
        meta: { requer_auth: true },
        children: [
            {
                path: '/painel-central',
                name: 'painel_dashboard',
                component: { render: () => h('div', { class: 'hidden md:flex justify-center items-center h-full text-gray-400 font-bold text-xl uppercase tracking-widest mt-20' }, '👆 Selecione uma opção no menu acima') }
            },
            {
                path: '/pdv-caixa',
                name: 'pdv_frente_caixa',
                component: () => import('../views/PaginaPdv.vue'),
                meta: { permissao_necessaria: 'acessar_pdv' } 
            },
            {
                path: '/mapa-mesas',
                name: 'gestao_mesas',
                component: () => import('../views/PaginaMesas.vue'),
                meta: { permissao_necessaria: 'acessar_mesas' }
            },
            {
                path: '/mesa/:id_mesa/detalhes',
                name: 'detalhes_mesa',
                component: () => import('../views/PaginaMesaDetalhes.vue'),
                meta: { permissao_necessaria: 'acessar_mesas' }
            },
            {
                path: '/cozinha',
                name: 'painel_cozinha',
                component: () => import('../views/PaginaCozinha.vue'),
                meta: { permissao_necessaria: 'acessar_cozinha' }
            },
            {
                path: '/comandas',
                name: 'gestao_comandas',
                component: () => import('../views/PaginaComandas.vue'),
                meta: { permissao_necessaria: 'acessar_comandas' }
            },
            {
                path: '/produtos',
                name: 'gestao_produtos',
                component: () => import('../views/PaginaProdutos.vue'),
                meta: { permissao_necessaria: 'gerenciar_produtos' } 
            },
            {
                path: '/equipe',
                name: 'gestao_equipe',
                component: () => import('../views/PaginaEquipe.vue'),
                meta: { permissao_necessaria: 'gerenciar_equipe' } 
            },
            {
                path: '/analises',
                name: 'gestao_analises',
                component: () => import('../views/PaginaAnalises.vue'),
                meta: { permissao_necessaria: 'ver_analises' }
            },
            {
                path: '/cardapio-admin',
                name: 'gestao_cardapio_admin',
                component: () => import('../views/PaginaCardapioAdmin.vue'),
                meta: { permissao_necessaria: 'gerenciar_cardapio' }
            },
            {
                path: '/permissoes',
                name: 'gestao_permissoes',
                component: () => import('../views/PaginaPermissoes.vue'),
                meta: { papeis_permitidos: ['admin_master', 'dono'] }
            },
            {
                path: '/admin-estabelecimentos',
                name: 'admin_central',
                component: AdminEstabelecimentos,
                meta: { papeis_permitidos: ['admin_master'] }
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
    
    const token_url   = to.query.token;
    const usuario_url = to.query.usuario;
    const tenant_url  = to.query.tenant;

    if (token_url && to.path !== '/redefinir-senha') {
        // Salva o token
        localStorage.setItem('nitec_token', token_url);
        loja_auth.token_acesso = token_url;

        // 🟢 Salva dados do usuário vindos da URL (login automático no servidor local)
        if (usuario_url) {
            try {
                const usuario_obj = JSON.parse(decodeURIComponent(usuario_url));
                localStorage.setItem('nitec_usuario', JSON.stringify(usuario_obj));
                loja_auth.usuario_logado = usuario_obj;
            } catch (e) {
                console.warn('[Router] Erro ao parsear usuario_url:', e.message);
            }
        }

        // 🟢 Salva tenant vindo da URL
        if (tenant_url) {
            localStorage.setItem('nitec_tenant_id', tenant_url);
        }

        // Remove parâmetros sensíveis da URL após salvar
        const query_limpa = { ...to.query };
        delete query_limpa.token;
        delete query_limpa.usuario;
        delete query_limpa.tenant;
        return { path: to.path, query: query_limpa };
    }

    const esta_autenticado = !!loja_auth.token_acesso || !!localStorage.getItem('nitec_token');

    if (to.meta.requer_auth && !esta_autenticado) {
        return '/login';
    }

    if (to.meta.papeis_permitidos && esta_autenticado) {
        const usuario = loja_auth.usuario_logado || JSON.parse(localStorage.getItem('nitec_usuario'));

        if (!usuario || (!to.meta.papeis_permitidos.includes(usuario.tipo_usuario) && usuario.tipo_usuario !== 'admin_master')) {
            alert(`Acesso negado. O seu perfil (${usuario?.tipo_usuario || 'desconhecido'}) não tem permissão para acessar esta área.`);
            return '/painel-central';
        }
    }

    if (to.meta.permissao_necessaria && esta_autenticado) {
        const usuario = loja_auth.usuario_logado || JSON.parse(localStorage.getItem('nitec_usuario'));

        if (!usuario || (usuario.tipo_usuario !== 'admin_master' && usuario.tipo_usuario !== 'dono')) {
            const permissoes = usuario?.permissoes || {};
            if (!permissoes[to.meta.permissao_necessaria]) {
                alert(`Acesso restrito. O seu perfil não possui a permissão '${to.meta.permissao_necessaria}'.`);
                return '/painel-central';
            }
        }
    }

    return true; 
});

export default roteador_principal;
