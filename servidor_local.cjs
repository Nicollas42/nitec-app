/**
 * servidor_local.cjs
 * Servidor HTTP local embutido no Electron.
 * Roda na porta 3737, serve o app Vue completo (dist/) e as rotas da API.
 * Anuncia-se via mDNS (Bonjour) para descoberta automática na rede local.
 */

const express     = require('express');
const cors        = require('cors');
const http        = require('http');
const path        = require('path');
const fs          = require('fs');
const os          = require('os');
const { Bonjour } = require('bonjour-service');

const PORTA = 3737;
let servidor_http = null;
let bonjour       = null;
let servico_mdns  = null;
let data_dir      = null;
let app_dir       = null; // Caminho do dist/ do Vue
let tenant_id_ativo = null; // Tenant do dono logado — validado no ping

// ─── Utilitários de armazenamento JSON ───────────────────────────────────────

const garantir_dir = (caminho) => {
    if (!fs.existsSync(caminho)) fs.mkdirSync(caminho, { recursive: true });
};

const ler_json = (nome, padrao = []) => {
    const caminho = path.join(data_dir, nome);
    if (!fs.existsSync(caminho)) return padrao;
    try { return JSON.parse(fs.readFileSync(caminho, 'utf8')); } catch { return padrao; }
};

const salvar_json = (nome, dados) => {
    fs.writeFileSync(path.join(data_dir, nome), JSON.stringify(dados, null, 2), 'utf8');
};

const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

// ─── Fila de sincronização com VPS ───────────────────────────────────────────

const enfileirar_sync = (metodo, url, payload) => {
    const fila = ler_json('sync_queue.json', []);
    fila.push({ id: uuid(), metodo, url, payload, criado_em: new Date().toISOString() });
    salvar_json('sync_queue.json', fila);
};

// ─── Utilitário: libera mesa se não houver mais comandas abertas ─────────────

const liberar_mesa_se_vazia = (mesa_id, comandas) => {
    if (!mesa_id) return;
    const ainda_abertas = comandas.filter(
        c => c.mesa_id === mesa_id && c.status_comanda === 'aberta'
    );
    if (ainda_abertas.length === 0) {
        const mesas = ler_json('mesas.json', []);
        const idx   = mesas.findIndex(m => m.id === mesa_id);
        if (idx >= 0) {
            mesas[idx].status_mesa = 'livre';
            salvar_json('mesas.json', mesas);
        }
    }
};

// ─── Rotas da API ─────────────────────────────────────────────────────────────

const configurar_rotas = (app_express) => {

    // Ping — descoberta de serviço
    app_express.get('/api/ping', (req, res) => {
        res.json({ ok: true, servidor: 'nitec_local', porta: PORTA, tenant: tenant_id_ativo });
    });

    // ── Mesas ────────────────────────────────────────────────────────────────

    app_express.get('/api/listar-mesas', (req, res) => {
        const mesas = ler_json('mesas.json', []);
        res.json({ sucesso: true, dados: mesas });
    });

    app_express.get('/api/detalhes-mesa/:id_mesa', (req, res) => {
        const id_mesa  = Number(req.params.id_mesa);
        const mesas    = ler_json('mesas.json', []);
        const comandas = ler_json('comandas.json', []);
        const itens    = ler_json('itens.json', []); // Todos os itens gravados no PC

        let mesa = mesas.find(m => m.id === id_mesa);

        if (!mesa) {
            const tem_comanda = comandas.some(c => c.mesa_id === id_mesa && c.status_comanda === 'aberta');
            if (!tem_comanda) return res.status(404).json({ sucesso: false, mensagem: 'Mesa não encontrada.' });
            mesa = { id: id_mesa, nome_mesa: `Mesa ${id_mesa}`, status_mesa: 'ocupada' };
        }

        const comandas_da_mesa = comandas
            .filter(c => c.mesa_id === id_mesa && c.status_comanda === 'aberta')
            .map(c => {
                const itens_desta_comanda = itens.filter(i => String(i.comanda_id) === String(c.id));
                return {
                    ...c,
                    buscar_cliente: c.buscar_cliente || (c.nome_cliente ? { nome_cliente: c.nome_cliente } : null),
                    buscar_mesa   : { nome_mesa: mesa.nome_mesa },
                    listar_itens  : itens_desta_comanda.map(i => ({ ...i, buscar_produto: i.buscar_produto || { nome_produto: i.nome_produto } }))
                };
            });

        res.json({
            sucesso: true,
            dados  : {
                nome_mesa      : mesa.nome_mesa,
                status_mesa    : mesa.status_mesa,
                listar_comandas: comandas_da_mesa
            }
        });
    });

    // ── Produtos ─────────────────────────────────────────────────────────────

    app_express.get('/api/listar-produtos', (req, res) => {
        const produtos = ler_json('produtos_cache.json', []);
        res.json({ sucesso: true, produtos });
    });

    // ── Comandas ─────────────────────────────────────────────────────────────

    app_express.get('/api/listar-comandas', (req, res) => {
        const comandas = ler_json('comandas.json', []);
        const mesas    = ler_json('mesas.json', []);
        const itens    = ler_json('itens.json', []);

        const comandas_enriquecidas = comandas.map(c => {
            const mesa = mesas.find(m => m.id === c.mesa_id);
            return {
                ...c,
                buscar_cliente : c.buscar_cliente  || (c.nome_cliente ? { nome_cliente: c.nome_cliente } : null),
                buscar_mesa    : c.buscar_mesa     || (mesa ? { nome_mesa: mesa.nome_mesa } : null),
                buscar_usuario : c.buscar_usuario  || null,
                listar_itens   : itens
                    .filter(i => String(i.comanda_id) === String(c.id))
                    .map(i => ({ ...i, buscar_produto: i.buscar_produto || { nome_produto: i.nome_produto } }))
            };
        });

        res.json({ status: true, comandas: comandas_enriquecidas });
    });

    app_express.get('/api/buscar-comanda/:id', (req, res) => {
        const id_buscado = req.params.id;
        const comandas   = ler_json('comandas.json', []);
        const itens      = ler_json('itens.json', []);
        
        const comanda = comandas.find(c => String(c.id) === String(id_buscado));
        
        if (!comanda) {
            return res.status(404).json({ sucesso: false, mensagem: "Comanda não encontrada localmente." });
        }

        const itens_filtrados = itens.filter(i => String(i.comanda_id) === String(comanda.id));

        res.json({
            sucesso: true,
            dados: {
                ...comanda,
                listar_itens: itens_filtrados.map(i => ({ 
                    ...i, 
                    buscar_produto: i.buscar_produto || { nome_produto: i.nome_produto } 
                }))
            }
        });
    });

    app_express.post('/api/abrir-comanda', (req, res) => {
        const { mesa_id, nome_cliente, tipo_conta, data_hora_abertura, uuid_operacao } = req.body;
        const comandas = ler_json('comandas.json', []);
        const mesas    = ler_json('mesas.json', []);

        const existente = comandas.find(c => c.uuid_abertura === uuid_operacao);
        if (existente) return res.status(201).json({ sucesso: true, mensagem: 'Comanda aberta!', comanda: existente });

        const mesa_info = mesas.find(m => m.id === Number(mesa_id));
        const nova = {
            id: `local_${uuid()}`, mesa_id: Number(mesa_id),
            nome_cliente: nome_cliente || null, tipo_conta: tipo_conta || 'geral',
            status_comanda: 'aberta', valor_total: 0,
            data_hora_abertura: data_hora_abertura || new Date().toISOString(),
            data_hora_fechamento: null, uuid_abertura: uuid_operacao, origem: 'local',
            buscar_cliente : nome_cliente ? { nome_cliente } : null,
            buscar_mesa    : mesa_info ? { nome_mesa: mesa_info.nome_mesa } : null,
            buscar_usuario : null,
        };

        comandas.push(nova);
        salvar_json('comandas.json', comandas);

        const idx = mesas.findIndex(m => m.id === Number(mesa_id));
        if (idx >= 0) { mesas[idx].status_mesa = 'ocupada'; salvar_json('mesas.json', mesas); }

        enfileirar_sync('POST', '/abrir-comanda', req.body);
        res.status(201).json({ sucesso: true, mensagem: 'Comanda aberta!', comanda: nova });
    });

    app_express.post('/api/adicionar-itens-comanda/:id', (req, res) => {
        const { itens, uuid_operacao } = req.body;
        const comandas    = ler_json('comandas.json', []);
        const todos_itens = ler_json('itens.json', []);
        const produtos    = ler_json('produtos_cache.json', []);

        const comanda = comandas.find(c => String(c.id) === String(req.params.id));
        if (!comanda) return res.status(404).json({ status: false });

        if (todos_itens.some(i => i.uuid_operacao === uuid_operacao)) {
            return res.json({ status: true, mensagem: 'Itens já lançados!' });
        }

        let total = 0;
        for (const item of (itens || [])) {
            const prod = produtos.find(p => p.id === item.produto_id);
            todos_itens.push({
                id: `local_item_${uuid()}`, comanda_id: comanda.id,
                produto_id: item.produto_id,
                nome_produto: prod?.nome_produto || `Produto #${item.produto_id}`,
                quantidade: item.quantidade, preco_unitario: item.preco_unitario,
                uuid_operacao
            });
            total += item.quantidade * item.preco_unitario;
        }

        comanda.valor_total = (comanda.valor_total || 0) + total;
        salvar_json('itens.json', todos_itens);
        salvar_json('comandas.json', comandas);

        enfileirar_sync('POST', `/adicionar-itens-comanda/${req.params.id}`, req.body);
        res.json({ status: true, mensagem: 'Itens lançados!', comanda });
    });

    app_express.post('/api/alterar-quantidade-item/:id_item', (req, res) => {
        const { acao } = req.body;
        const todos_itens = ler_json('itens.json', []);
        const comandas    = ler_json('comandas.json', []);
        const item = todos_itens.find(i => String(i.id) === String(req.params.id_item));
        if (!item) return res.status(404).json({ status: false });

        if (acao === 'incrementar') { item.quantidade++; }
        else if (acao === 'decrementar') {
            item.quantidade--;
            if (item.quantidade <= 0) todos_itens.splice(todos_itens.indexOf(item), 1);
        }

        const comanda = comandas.find(c => String(c.id) === String(item.comanda_id));
        if (comanda) {
            comanda.valor_total = todos_itens
                .filter(i => String(i.comanda_id) === String(comanda.id))
                .reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0);
        }

        salvar_json('itens.json', todos_itens);
        salvar_json('comandas.json', comandas);
        enfileirar_sync('POST', `/alterar-quantidade-item/${req.params.id_item}`, req.body);
        res.json({ status: true });
    });

    app_express.delete('/api/remover-item-comanda/:id_item', (req, res) => {
        const todos_itens = ler_json('itens.json', []);
        const comandas    = ler_json('comandas.json', []);
        const idx  = todos_itens.findIndex(i => String(i.id) === String(req.params.id_item));
        if (idx >= 0) {
            const item    = todos_itens[idx];
            const comanda = comandas.find(c => String(c.id) === String(item.comanda_id));
            todos_itens.splice(idx, 1);
            if (comanda) {
                comanda.valor_total = todos_itens
                    .filter(i => String(i.comanda_id) === String(comanda.id))
                    .reduce((acc, i) => acc + (i.quantidade * i.preco_unitario), 0);
            }
            salvar_json('itens.json', todos_itens);
            salvar_json('comandas.json', comandas);
        }
        enfileirar_sync('DELETE', `/remover-item-comanda/${req.params.id_item}`, req.body || {});
        res.json({ status: true });
    });

    app_express.post('/api/fechar-comanda/:id', (req, res) => {
        const { data_hora_fechamento, desconto } = req.body;
        const comandas    = ler_json('comandas.json', []);
        const mesas       = ler_json('mesas.json', []);
        const todos_itens = ler_json('itens.json', []);
        const comanda = comandas.find(c => String(c.id) === String(req.params.id));
        if (!comanda) return res.status(404).json({ sucesso: false });

        if (!todos_itens.some(i => String(i.comanda_id) === String(comanda.id))) {
            // Conta vazia — cancela e libera a mesa se não houver outras abertas
            comanda.status_comanda = 'cancelada';
            salvar_json('comandas.json', comandas);
            liberar_mesa_se_vazia(comanda.mesa_id, comandas);
            enfileirar_sync('POST', `/fechar-comanda/${req.params.id}`, req.body);
            return res.json({ sucesso: true, mensagem: '✔️ Conta vazia anulada e descartada!' });
        }

        comanda.status_comanda       = 'fechada';
        comanda.data_hora_fechamento = data_hora_fechamento || new Date().toISOString();
        comanda.desconto             = desconto || 0;
        // Aplica desconto no valor_total — alinhado com ComandaService.fechar_pagamento()
        comanda.valor_total          = Math.max(0, (comanda.valor_total || 0) - (desconto || 0));
        salvar_json('comandas.json', comandas);
        liberar_mesa_se_vazia(comanda.mesa_id, comandas);

        enfileirar_sync('POST', `/fechar-comanda/${req.params.id}`, req.body);
        res.json({ sucesso: true, mensagem: '💳 Pagamento confirmado!' });
    });

    app_express.post('/api/fechar-comanda/cancelar/:id', (req, res) => {
        const comandas = ler_json('comandas.json', []);
        const comanda  = comandas.find(c => String(c.id) === String(req.params.id));
        if (comanda) {
            comanda.status_comanda = 'cancelada';
            salvar_json('comandas.json', comandas);
            liberar_mesa_se_vazia(comanda.mesa_id, comandas);
        }
        enfileirar_sync('POST', `/fechar-comanda/cancelar/${req.params.id}`, req.body);
        res.json({ sucesso: true, mensagem: 'Comanda cancelada!' });
    });

    app_express.post('/api/venda-balcao', (req, res) => {
        enfileirar_sync('POST', '/venda-balcao', req.body);
        res.json({ sucesso: true, mensagem: 'Venda Balcão registada localmente!' });
    });

    app_express.post('/api/reabrir-comanda/:id', (req, res) => {
        const comandas = ler_json('comandas.json', []);
        const mesas    = ler_json('mesas.json', []);
        const comanda  = comandas.find(c => String(c.id) === String(req.params.id));
        if (!comanda) return res.status(404).json({ sucesso: false });
        comanda.status_comanda       = 'aberta';
        comanda.data_hora_fechamento = null;
        salvar_json('comandas.json', comandas);
    
        if (comanda.mesa_id) {
            const idx = mesas.findIndex(m => m.id === comanda.mesa_id);
            if (idx >= 0) { mesas[idx].status_mesa = 'ocupada'; salvar_json('mesas.json', mesas); }
        }
        enfileirar_sync('POST', `/reabrir-comanda/${req.params.id}`, req.body);
        res.json({ sucesso: true, mensagem: 'Comanda reaberta!' });
    });

    // ── Autenticação local ────────────────────────────────────────────────────
    app_express.post('/api/realizar-login', (req, res) => {
        const { email, password } = req.body;
        const usuarios = ler_json('usuarios_cache.json', []);
        const usuario  = usuarios.find(u => u.email === email);
        if (!usuario) return res.status(401).json({ mensagem: 'Usuário não encontrado no cache local.' });
        res.json({ token: usuario.token_cache || 'local_token', usuario });
    });

    // ── Cache de produtos, mesas e usuários (recebe do cliente Vue) ───────────
    app_express.post("/api/sync-produtos", (req, res) => {
        const { produtos, mesas, usuarios, comandas, itens } = req.body;
        
        if (produtos) salvar_json('produtos_cache.json', produtos);
        if (usuarios) salvar_json('usuarios_cache.json', usuarios);

        // ── MERGE PROTEGIDO DE COMANDAS ────────────────────────────────────────
        // Regra: comandas locais já fechadas/canceladas NÃO podem ser revertidas
        // para "aberta" por dados desatualizados vindos do cache do store.
        // Elimina a race condition: fechar-comanda é chamado, mas o sync-produtos
        // disparado ANTES do fechamento chega DEPOIS e reverte o estado.
        if (comandas && Array.isArray(comandas)) {
            const cmd_locais  = ler_json('comandas.json', []);
            const locais_map  = {};
            for (const c of cmd_locais) locais_map[String(c.id)] = c;

            const ids_novas    = new Set(comandas.map(c => String(c.id)));
            const cmd_resultado = [];

            // Mantém comandas criadas localmente (offline) que não vêm no payload
            for (const c of cmd_locais) {
                if (!ids_novas.has(String(c.id))) cmd_resultado.push(c);
            }

            // Mescla as novas, mas nunca reverte estado local mais avançado
            for (const nova of comandas) {
                const local = locais_map[String(nova.id)];
                const local_mais_avancado =
                    local &&
                    nova.status_comanda === 'aberta' &&
                    (local.status_comanda === 'fechada' || local.status_comanda === 'cancelada');
                cmd_resultado.push(local_mais_avancado ? local : nova);
            }

            salvar_json('comandas.json', cmd_resultado);

            // ── RECONCILIAÇÃO DE MESAS ─────────────────────────────────────────
            // Recalcula status de cada mesa a partir das comandas reais — evita
            // sobrescrever mesas.json com estado desatualizado vindo do store.
            const mesas_local = ler_json('mesas.json', []);
            let houve_mudanca = false;
            for (const mesa of mesas_local) {
                const tem_aberta   = cmd_resultado.some(c => c.mesa_id === mesa.id && c.status_comanda === 'aberta');
                const status_certo = tem_aberta ? 'ocupada' : 'livre';
                if (mesa.status_mesa !== status_certo) {
                    mesa.status_mesa = status_certo;
                    houve_mudanca    = true;
                }
            }
            if (houve_mudanca) salvar_json('mesas.json', mesas_local);

        } else if (mesas) {
            // Payload sem comandas — sobrescreve mesas normalmente
            salvar_json('mesas.json', mesas);
        }

        // ── MERGE PROTEGIDO DE ITENS ───────────────────────────────────────────
        if (itens && Array.isArray(itens) && comandas && Array.isArray(comandas)) {
            let it_existentes = ler_json('itens.json', []);
            const ids_cmd_novas = comandas.map(c => String(c.id));
            it_existentes = it_existentes.filter(i => !ids_cmd_novas.includes(String(i.comanda_id)));
            salvar_json('itens.json', [...it_existentes, ...itens]);
        }

        res.json({ ok: true });
    });

    // ── Serve o app Vue completo (DEVE ser a última rota) ─────────────────────
    if (app_dir && fs.existsSync(app_dir)) {
        app_express.use(express.static(app_dir));
        app_express.get('/{*path}', (req, res) => {
            if (req.path.startsWith('/api/')) return res.status(404).json({ erro: 'Rota não encontrada.' });
            res.sendFile(path.join(app_dir, 'index.html'));
        });
        console.log(`[Nitec Local] App Vue servido de: ${app_dir}`);
    } else {
        console.warn('[Nitec Local] dist/ não encontrado — app Vue não será servido pelo servidor local.');
    }
};

// ─── Sincronização com VPS ────────────────────────────────────────────────────

const sincronizar_com_vps = async (url_base, token) => {
    const fila = ler_json('sync_queue.json', []);
    if (fila.length === 0) return { ok: 0, falha: 0 };

    let ok = 0, falha = 0;
    const fila_restante = [];

    for (const item of fila) {
        try {
            const resp = await fetch(url_base + item.url, {
                method : item.metodo,
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'Authorization': `Bearer ${token}` },
                body   : JSON.stringify(item.payload)
            });
            if (resp.ok || resp.status === 409) { ok++; }
            else { fila_restante.push(item); falha++; }
        } catch {
            fila_restante.push(item);
            falha++;
        }
    }

    salvar_json('sync_queue.json', fila_restante);
    return { ok, falha };
};

const obter_ip_local = () => {
    const interfaces = os.networkInterfaces();
    for (const nome of Object.keys(interfaces)) {
        for (const iface of interfaces[nome]) {
            if (iface.family === 'IPv4' && !iface.internal) return iface.address;
        }
    }
    return '127.0.0.1';
};

// ─── API pública ──────────────────────────────────────────────────────────────

const iniciar = (caminho_dados, caminho_app = null, tenant_id = null) => {
    return new Promise((resolve, reject) => {
        data_dir = path.join(caminho_dados, 'nitec_local');
        app_dir  = caminho_app; // Caminho do dist/ do Vue
        tenant_id_ativo = tenant_id; // Tenant do dono — usado no /api/ping
        garantir_dir(data_dir);

        const app_express = express();
        app_express.use(cors());
        app_express.use(express.json({ limit: '10mb' }));

        configurar_rotas(app_express);

        servidor_http = http.createServer(app_express);
        servidor_http.listen(PORTA, '0.0.0.0', () => {
            const ip = obter_ip_local();
            console.log(`[Nitec Local] Servidor rodando em http://${ip}:${PORTA}`);

            try {
                bonjour      = new Bonjour();
                servico_mdns = bonjour.publish({
                    name: `NitecLocal_${ip.replace(/\./g, '_')}`,
                    type: 'nitec',
                    port: PORTA,
                    txt : { ip, porta: String(PORTA) }
                });
                console.log(`[Nitec Local] mDNS anunciado como _nitec._tcp na porta ${PORTA}`);
            } catch (e) {
                console.warn('[Nitec Local] mDNS não disponível:', e.message);
            }

            resolve({ porta: PORTA, ip });
        });

        servidor_http.on('error', reject);
    });
};

const parar = () => {
    if (servico_mdns) { servico_mdns.stop(); servico_mdns = null; }
    if (bonjour)      { bonjour.destroy(); bonjour      = null; }
    if (servidor_http){ servidor_http.close(); servidor_http = null; }
    console.log('[Nitec Local] Servidor encerrado.');
};

module.exports = { iniciar, parar, sincronizar_com_vps, obter_ip_local, PORTA };