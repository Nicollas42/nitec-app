import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { PageFlip } from 'page-flip';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import api_cardapio from '../servicos/api_cardapio.js';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

const criar_config_padrao = () => ({
    nome_exibicao: 'Nosso Cardapio',
    subtitulo: '',
    mensagem_boas_vindas: 'Cadastre-se para chamar o garcom e visualizar a comanda.',
    cor_primaria: '#0F766E',
    cor_destaque: '#F59E0B',
    cor_fundo: '#FFF7ED',
    logo_url: '',
});

const aplicar_modo_publico_cardapio = () => {
    document.body.classList.add('nitec-cardapio-publico');
    document.getElementById('app')?.classList.add('nitec-cardapio-publico');
};

const remover_modo_publico_cardapio = () => {
    document.body.classList.remove('nitec-cardapio-publico');
    document.getElementById('app')?.classList.remove('nitec-cardapio-publico');
};

const adicionar_listener_media = (media_query, listener) => {
    if (typeof media_query.addEventListener === 'function') {
        media_query.addEventListener('change', listener);
        return () => media_query.removeEventListener('change', listener);
    }

    media_query.addListener(listener);
    return () => media_query.removeListener(listener);
};

export function useLogicaCardapioCliente() {
    const rota_atual = useRoute();
    const roteador = useRouter();
    const media_mobile = window.matchMedia('(max-width: 767px)');

    const carregando_inicial = ref(true);
    const erro_carregamento = ref('');
    const config = ref(criar_config_padrao());
    const pdfs = ref([]);
    const pdf_ativo_id = ref(null);
    const renderizando_pdf = ref(false);
    const mesa = ref(null);
    const comanda = ref(null);
    const sessao_cliente = ref(null);

    const modal_cadastro_visivel = ref(false);
    const modo_modal = ref('login'); // 'login' | 'cadastro'
    const modal_comanda_visivel = ref(false);
    const modal_encerramento_visivel = ref(false);
    const encerramento = ref(null); // { nome, itens, valor_total, desconto, cancelada }
    const sessao_encerrada = ref(false); // true após encerramento — exibe banner de re-entrada
    const enviando_cadastro = ref(false);
    const enviando_chamada = ref(false);
    const carregando_comanda = ref(false);
    const aguardando_aprovacao = ref(false);
    let polling_aprovacao = null;
    let polling_comanda_ativa = null;

    const cadastro = reactive({ nome: '', telefone: '', cpf: '' });
    const feedback = ref({ tipo: '', mensagem: '' });

    const flipbook_container = ref(null);
    const flipbook_stage = ref(null);
    const eh_mobile_view = ref(media_mobile.matches);
    const modo_tela_cheia_mobile = ref(false);
    const pagina_atual = ref(0);
    const total_paginas = ref(0);
    const orientacao_flipbook = ref('landscape');
    let instancia_flipbook = null;
    let timeout_feedback = null;
    let timeout_rerender = null;
    let observador_resize = null;
    let token_renderizacao = 0;
    let chave_ultimo_render = '';
    let remover_listener_media_mobile = null;
    let arraste_miolo_ativo = null;

    const id_mesa = computed(() => Number(rota_atual.params.id_mesa));
    const token_na_url = computed(() => rota_atual.params.token_cliente || null);
    const chave_sessao = computed(() => `nitec_cardapio_sessao:${window.location.host}:mesa:${rota_atual.params.id_mesa}`);
    const tem_sessao = computed(() => !!sessao_cliente.value?.comanda_id);

    const pdf_ativo = computed(() => {
        if (!pdfs.value.length) return null;
        return pdfs.value.find((pdf) => pdf.id === pdf_ativo_id.value) || pdfs.value[0];
    });

    const estilo_cardapio = computed(() => ({
        '--cardapio-primary': config.value.cor_primaria || '#0F766E',
        '--cardapio-accent': config.value.cor_destaque || '#F59E0B',
        '--cardapio-bg': config.value.cor_fundo || '#FFF7ED',
    }));

    const classes_feedback = computed(() => {
        const tipo = feedback.value?.tipo || 'info';
        if (tipo === 'erro') return 'border-rose-400/60 bg-rose-500/15 text-rose-100';
        if (tipo === 'sucesso') return 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100';
        return 'border-sky-400/60 bg-sky-500/15 text-sky-100';
    });

    const pode_ir_pagina_anterior = computed(() => pagina_atual.value > 0);
    const pode_ir_pagina_proxima = computed(() => pagina_atual.value < Math.max(total_paginas.value - 1, 0));
    const mostrar_controles_mobile = computed(() => eh_mobile_view.value && total_paginas.value > 1);
    const mostrar_alcas_miolo = computed(() => !eh_mobile_view.value && orientacao_flipbook.value === 'landscape');

    const notificar = (mensagem, tipo = 'info') => {
        feedback.value = { mensagem, tipo };
        if (timeout_feedback) clearTimeout(timeout_feedback);
        timeout_feedback = window.setTimeout(() => {
            feedback.value = { tipo: '', mensagem: '' };
        }, 4500);
    };

    const validar_cpf = (cpf) => {
        const limpo = cpf.replace(/\D/g, '');
        if (limpo.length !== 11) return false;
        if (/^(\d)\1{10}$/.test(limpo)) return false;

        for (let t = 9; t < 11; t++) {
            let soma = 0;
            for (let i = 0; i < t; i++) {
                soma += Number(limpo[i]) * ((t + 1) - i);
            }
            let resto = (soma * 10) % 11;
            if (resto === 10) resto = 0;
            if (Number(limpo[t]) !== resto) return false;
        }
        return true;
    };

    const formatar_cpf = (valor) => {
        const digitos = valor.replace(/\D/g, '').slice(0, 11);
        if (digitos.length <= 3) return digitos;
        if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
        if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
    };

    const ao_digitar_cpf = (evento) => {
        const formatado = formatar_cpf(evento.target.value);
        cadastro.cpf = formatado;
        evento.target.value = formatado;
    };

    const alternar_modo_modal = () => {
        modo_modal.value = modo_modal.value === 'login' ? 'cadastro' : 'login';
    };

    const restaurar_sessao = () => {
        try {
            const salvo = sessionStorage.getItem(chave_sessao.value);
            if (!salvo) return;

            const dados = JSON.parse(salvo);
            sessao_cliente.value = dados;
            cadastro.nome = dados.nome || '';
            cadastro.cpf = dados.cpf ? formatar_cpf(dados.cpf) : '';
        } catch {
            // ignore
        }
    };

    const salvar_sessao = () => {
        if (!sessao_cliente.value) return;
        sessionStorage.setItem(chave_sessao.value, JSON.stringify(sessao_cliente.value));
    };

    /**
     * Encerra a sessão local sem apagar o sessionStorage imediatamente —
     * mantém o usuário em modo leitura do cardápio.
     * O sessionStorage é marcado como 'encerrada' para que ao recarregar
     * a página o cliente veja o popup novamente SE a comanda ainda existir,
     * mas não entre no fluxo de polling.
     */
    const encerrar_sessao_local = (dados_encerramento) => {
        parar_polling_aprovacao();
        parar_polling_comanda_ativa();
        modal_comanda_visivel.value = false;

        encerramento.value = dados_encerramento;
        modal_encerramento_visivel.value = true;
        sessao_encerrada.value = true;

        // Remove a sessão do storage — próximo reload entra em modo leitura
        sessionStorage.removeItem(chave_sessao.value);
        sessao_cliente.value = null;
        comanda.value = null;
    };

    const fechar_modal_encerramento = () => {
        modal_encerramento_visivel.value = false;
        encerramento.value = null;
        // Não limpa sessao_encerrada — o banner de re-entrada permanece visível
    };

    const iniciar_polling_aprovacao = () => {
        parar_polling_aprovacao();
        aguardando_aprovacao.value = true;

        polling_aprovacao = window.setInterval(async () => {
            if (!sessao_cliente.value?.comanda_id) return;

            try {
                const { data } = await api_cardapio.get(
                    `/cardapio/comanda/${sessao_cliente.value.comanda_id}/status`,
                );

                if (data.status === 'aberta') {
                    sessao_cliente.value.status = 'aberta';
                    // Completa o telefone e token caso tenha vindo do polling
                    if (data.telefone && !sessao_cliente.value.telefone) {
                        sessao_cliente.value.telefone = data.telefone;
                    }
                    if (data.token_cliente && !sessao_cliente.value.token_cliente) {
                        sessao_cliente.value.token_cliente = data.token_cliente;
                    }
                    salvar_sessao();
                    parar_polling_aprovacao();
                    
                    // Transita para a URL de sessão se possível
                    if (sessao_cliente.value.token_cliente) {
                        navegar_para_url_sessao(sessao_cliente.value.token_cliente);
                    }

                    notificar('Comanda aprovada! Bem-vindo(a).', 'sucesso');
                    await carregar_comanda_atual();
                    // Inicia monitoramento contínuo da comanda já aprovada
                    iniciar_polling_comanda_ativa();
                } else if (data.status === 'rejeitada' || !data.status) {
                    sessao_cliente.value = null;
                    sessionStorage.removeItem(chave_sessao.value);
                    parar_polling_aprovacao();
                    modal_cadastro_visivel.value = true;
                    notificar('Entrada nao aprovada. Tente novamente ou chame o garcom.', 'erro');
                } else if (data.status === 'fechada' || data.status === 'cancelada') {
                    parar_polling_aprovacao();
                    encerrar_sessao_local({
                        nome: data.nome || sessao_cliente.value?.nome || 'Cliente',
                        itens: data.itens || [],
                        valor_total: data.valor_total ?? 0,
                        desconto: data.desconto ?? 0,
                        cancelada: data.status === 'cancelada',
                    });
                }
            } catch {
                // ignore — retry no próximo tick
            }
        }, 5000);
    };

    const parar_polling_aprovacao = () => {
        aguardando_aprovacao.value = false;
        if (polling_aprovacao) {
            clearInterval(polling_aprovacao);
            polling_aprovacao = null;
        }
    };

    /**
     * Polling contínuo para comandas já aprovadas (status 'aberta').
     * Detecta quando o garçom fecha ou cancela a conta e dispara o popup de despedida.
     * Intervalo mais espaçado (8s) para não sobrecarregar o servidor.
     */
    const iniciar_polling_comanda_ativa = () => {
        parar_polling_comanda_ativa();
        if (!sessao_cliente.value?.comanda_id) return;

        polling_comanda_ativa = window.setInterval(async () => {
            if (!sessao_cliente.value?.comanda_id) return;

            try {
                const { data } = await api_cardapio.get(
                    `/cardapio/comanda/${sessao_cliente.value.comanda_id}/status`,
                );

                if (data.status === 'fechada' || data.status === 'cancelada') {
                    encerrar_sessao_local({
                        nome: data.nome || sessao_cliente.value?.nome || 'Cliente',
                        itens: data.itens || [],
                        valor_total: data.valor_total ?? 0,
                        desconto: data.desconto ?? 0,
                        cancelada: data.status === 'cancelada',
                    });
                }
            } catch {
                // ignore — retry no próximo tick
            }
        }, 8000);
    };

    const parar_polling_comanda_ativa = () => {
        if (polling_comanda_ativa) {
            clearInterval(polling_comanda_ativa);
            polling_comanda_ativa = null;
        }
    };

    const esperar = (tempo_ms) => new Promise((resolve) => {
        window.setTimeout(resolve, tempo_ms);
    });

    const atualizar_estado_flipbook = (instancia = instancia_flipbook) => {
        if (!instancia) {
            pagina_atual.value = 0;
            total_paginas.value = 0;
            orientacao_flipbook.value = eh_mobile_view.value ? 'portrait' : 'landscape';
            return;
        }

        pagina_atual.value = instancia.getCurrentPageIndex();
        total_paginas.value = instancia.getPageCount();
        orientacao_flipbook.value = instancia.getOrientation();
    };

    const obter_dimensoes_container = () => {
        if (!flipbook_container.value) {
            return { largura: 0, altura: 0 };
        }

        const { width, height } = flipbook_container.value.getBoundingClientRect();
        return {
            largura: Math.round(width),
            altura: Math.round(height),
        };
    };

    const criar_host_flipbook = ({ largura, altura }) => {
        if (!flipbook_container.value) return null;

        const host = document.createElement('div');
        host.className = 'flipbook-host';
        host.style.width = `${largura}px`;
        host.style.height = `${altura}px`;
        host.style.maxWidth = '100%';
        host.style.maxHeight = '100%';
        host.style.display = 'flex';
        host.style.alignItems = 'center';
        host.style.justifyContent = 'center';
        flipbook_container.value.replaceChildren(host);
        return host;
    };

    const calcular_dimensoes_livro = ({
        dimensoes_container,
        largura_pagina_base,
        altura_pagina_base,
        eh_mobile,
    }) => {
        const folga = eh_mobile ? 8 : 24;
        const largura_disponivel = Math.max(140, dimensoes_container.largura - folga);
        const altura_disponivel = Math.max(220, dimensoes_container.altura - folga);
        const largura_espalhada = eh_mobile ? largura_pagina_base : largura_pagina_base * 2;

        const escala = Math.min(
            largura_disponivel / largura_espalhada,
            altura_disponivel / altura_pagina_base,
            1,
        );

        const largura_pagina = Math.max(140, Math.round(largura_pagina_base * escala));
        const altura_pagina = Math.max(220, Math.round(altura_pagina_base * escala));

        return {
            largura_host: eh_mobile ? largura_pagina : largura_pagina * 2,
            altura_host: altura_pagina,
            largura_pagina,
            altura_pagina,
        };
    };

    const esperar_container_pronto = async (tentativas = 24) => {
        await nextTick();

        for (let tentativa = 0; tentativa < tentativas; tentativa += 1) {
            const dimensoes = obter_dimensoes_container();
            if (dimensoes.largura >= 240 && dimensoes.altura >= 240) {
                return dimensoes;
            }

            await new Promise((resolve) => window.requestAnimationFrame(resolve));
        }

        await esperar(60);
        return obter_dimensoes_container();
    };

    const carregar_dados_iniciais = async () => {
        carregando_inicial.value = true;
        erro_carregamento.value = '';

        try {
            const [resp_config, resp_mesa] = await Promise.all([
                api_cardapio.get('/cardapio/config'),
                api_cardapio.get(`/cardapio/mesa/${id_mesa.value}`),
            ]);

            config.value = { ...criar_config_padrao(), ...(resp_config.data?.config || {}) };
            pdfs.value = resp_config.data?.pdfs || [];
            pdf_ativo_id.value = pdfs.value[0]?.id || null;

            mesa.value = resp_mesa.data?.mesa || null;

            // ─ Prioridade 1: URL já contém o token de sessão ─────────────────────────────
            // Quando o cliente acessa o seu link pessoal (#/cardapio/mesa/1/s/{token}),
            // restauramos a sessão diretamente pelo backend sem precisar de CPF ou sessionStorage.
            if (token_na_url.value) {
                try {
                    const { data: sessao_data } = await api_cardapio.get(
                        `/cardapio/sessao/${token_na_url.value}`,
                    );

                    if (sessao_data.status === 'fechada' || sessao_data.status === 'cancelada') {
                        // Conta já encerrada — exibe popup de despedida e limpa a sessão
                        encerrar_sessao_local({
                            nome:        sessao_data.nome || 'Cliente',
                            itens:       sessao_data.itens || [],
                            valor_total: sessao_data.valor_total ?? 0,
                            desconto:    sessao_data.desconto ?? 0,
                            cancelada:   sessao_data.status === 'cancelada',
                        });
                        // Redireciona para o link cru para não expor o token de sessão encerrada
                        roteador.replace({
                            name: 'cardapio_cliente_publico',
                            params: { id_mesa: rota_atual.params.id_mesa },
                        });
                    } else {
                        // Sessão ativa (aberta ou pendente) — restaura sem pedir CPF
                        sessao_cliente.value = {
                            comanda_id:    sessao_data.comanda_id,
                            nome:          sessao_data.nome,
                            cpf:           sessao_data.cpf,
                            telefone:      sessao_data.telefone,
                            sessao_uuid:   sessao_data.sessao_uuid,
                            token_cliente: sessao_data.token_cliente,
                            status:        sessao_data.status,
                        };
                        salvar_sessao();

                        if (sessao_data.status === 'pendente') {
                            iniciar_polling_aprovacao();
                        } else {
                            await carregar_comanda_atual();
                            iniciar_polling_comanda_ativa();
                        }
                    }
                } catch {
                    // Token inválido / não encontrado → redireciona para link cru
                    roteador.replace({
                        name: 'cardapio_cliente_publico',
                        params: { id_mesa: rota_atual.params.id_mesa },
                    });
                    modal_cadastro_visivel.value = true;
                }
                return; // Sai cedo — restauração por token terminou (sucesso ou erro)
            }

            // ─ Prioridade 2: sessionStorage (link cru com sessão salva no tab) ──────────
            restaurar_sessao();

            // Invalida se cliente tem uuid E (mesa não tem OR uuids diferentes).
            // Cobre o caso crítico: mesa foi liberada (sessao_uuid=null) mas o
            // sessionStorage ainda guarda o uuid da sessão anterior.
            const cliente_uuid = sessao_cliente.value?.sessao_uuid;
            const mesa_uuid = mesa.value?.sessao_uuid;
            if (cliente_uuid && cliente_uuid !== mesa_uuid) {
                sessao_cliente.value = null;
                sessionStorage.removeItem(chave_sessao.value);
            }

            // Evita "sessão fantasma": sessionStorage com comanda já fechada/cancelada.
            // Isso ocorre quando o cliente recarrega a página via link cru sem ter o token na URL.
            if (tem_sessao.value) {
                try {
                    const { data: status_check } = await api_cardapio.get(
                        `/cardapio/comanda/${sessao_cliente.value.comanda_id}/status`,
                    );

                    if (status_check.status === 'fechada' || status_check.status === 'cancelada') {
                        sessao_cliente.value = null;
                        sessionStorage.removeItem(chave_sessao.value);
                    } else if (status_check.status === 'rejeitada' || !status_check.status) {
                        sessao_cliente.value = null;
                        sessionStorage.removeItem(chave_sessao.value);
                    } else {
                        sessao_cliente.value.status = status_check.status;
                        if (status_check.telefone && !sessao_cliente.value.telefone) {
                            sessao_cliente.value.telefone = status_check.telefone;
                        }
                        // Navega para URL de sessão se o token estiver disponível
                        if (status_check.token_cliente) {
                            sessao_cliente.value.token_cliente = status_check.token_cliente;
                            navegar_para_url_sessao(status_check.token_cliente);
                        }
                        salvar_sessao();
                    }
                } catch {
                    // Falha de rede — continua com dados locais (polling corrigirá após)
                }
            }

            if (!tem_sessao.value) {
                modal_cadastro_visivel.value = true;
            } else if (sessao_cliente.value?.status === 'pendente') {
                iniciar_polling_aprovacao();
            } else {
                await carregar_comanda_atual();
                // Monitora ativamente para detectar fechamento pelo garçom
                iniciar_polling_comanda_ativa();
            }
        } catch {
            erro_carregamento.value = 'Nao foi possivel carregar o cardapio. Verifique sua conexao.';
        } finally {
            carregando_inicial.value = false;
        }
    };


    /**
     * Navega para a URL de sessão pessoal do cliente após autenticar.
     * Preserva id_mesa e injeta o token_cliente no path.
     */
    const navegar_para_url_sessao = (token_cliente) => {
        if (!token_cliente) return;
        // Evita navegação redundante se já está na URL correta
        if (rota_atual.params.token_cliente === token_cliente) return;
        roteador.replace({
            name: 'cardapio_cliente_sessao',
            params: { id_mesa: rota_atual.params.id_mesa, token_cliente },
        });
    };

    const processar_resposta_auth = (data) => {
        sessao_cliente.value = {
            comanda_id:    data.comanda_id,
            nome:          data.nome,
            cpf:           data.cpf,
            telefone:      data.telefone,
            sessao_uuid:   data.sessao_uuid,
            token_cliente: data.token_cliente,
            status:        data.status,
        };
        salvar_sessao();
        modal_cadastro_visivel.value = false;

        // Atualiza a URL para a sessão pessoal do cliente
        navegar_para_url_sessao(data.token_cliente);

        if (data.status === 'pendente') {
            notificar('Aguardando aprovacao do garcom...', 'info');
            iniciar_polling_aprovacao();
        } else {
            notificar(`Bem-vindo(a), ${data.nome}!`, 'sucesso');
            carregar_comanda_atual();
            iniciar_polling_comanda_ativa();
        }
    };

    const login_por_cpf = async () => {
        const cpf_limpo = cadastro.cpf.replace(/\D/g, '');
        if (!validar_cpf(cpf_limpo)) {
            notificar('CPF invalido. Verifique os digitos.', 'erro');
            return;
        }

        enviando_cadastro.value = true;
        try {
            const { data } = await api_cardapio.post('/cardapio/login', {
                mesa_id: id_mesa.value,
                cpf: cpf_limpo,
                sessao_uuid: mesa.value?.sessao_uuid || null,
            });

            processar_resposta_auth(data);
        } catch (erro) {
            const resp = erro.response?.data;
            if (resp?.nao_encontrado) {
                notificar('CPF nao cadastrado. Realize o cadastro.', 'erro');
                modo_modal.value = 'cadastro';
            } else {
                notificar(resp?.mensagem || 'Erro ao fazer login. Tente novamente.', 'erro');
            }
        } finally {
            enviando_cadastro.value = false;
        }
    };

    const confirmar_cadastro = async () => {
        const cpf_limpo = cadastro.cpf.replace(/\D/g, '');

        if (!cadastro.nome.trim() || !cadastro.telefone.trim()) {
            notificar('Preencha nome e telefone.', 'erro');
            return;
        }
        if (!validar_cpf(cpf_limpo)) {
            notificar('CPF invalido. Verifique os digitos.', 'erro');
            return;
        }

        enviando_cadastro.value = true;
        try {
            const { data } = await api_cardapio.post('/cardapio/registrar', {
                mesa_id: id_mesa.value,
                nome: cadastro.nome.trim(),
                telefone: cadastro.telefone.trim(),
                cpf: cpf_limpo,
                sessao_uuid: mesa.value?.sessao_uuid || null,
            });

            processar_resposta_auth(data);
        } catch (erro) {
            const resp = erro.response?.data;
            if (resp?.ja_cadastrado) {
                notificar('CPF ja cadastrado. Use o login.', 'erro');
                modo_modal.value = 'login';
            } else {
                notificar(resp?.mensagem || 'Erro ao registrar. Tente novamente.', 'erro');
            }
        } finally {
            enviando_cadastro.value = false;
        }
    };

    const chamar_garcom = async () => {
        if (!tem_sessao.value) {
            modal_cadastro_visivel.value = true;
            return;
        }

        // Usa o telefone da sessão, depois o da comanda atual carregada, e como fallback, o formulário.
        const telefone_envio = sessao_cliente.value?.telefone?.trim()
            || comanda.value?.telefone?.trim()
            || cadastro.telefone?.trim()
            || null;

        enviando_chamada.value = true;
        try {
            await api_cardapio.post('/cardapio/solicitar-atendimento', {
                mesa_id: id_mesa.value,
                nome_cliente: sessao_cliente.value.nome,
                telefone: telefone_envio,
            });

            // Persiste o telefone na sessão caso tenha vindo do fallback
            if (!sessao_cliente.value.telefone) {
                sessao_cliente.value.telefone = telefone_envio;
                salvar_sessao();
            }

            notificar('Garcom notificado! Aguarde no seu lugar.', 'sucesso');
        } catch (erro) {
            notificar(erro.response?.data?.mensagem || 'Nao foi possivel chamar o garcom.', 'erro');
        } finally {
            enviando_chamada.value = false;
        }
    };

    const carregar_comanda_atual = async () => {
        if (!tem_sessao.value) return;

        carregando_comanda.value = true;
        try {
            const { data } = await api_cardapio.get(
                `/cardapio/mesa/${id_mesa.value}?comanda_id=${sessao_cliente.value.comanda_id}`,
            );
            comanda.value = data?.comanda || null;
        } catch {
            // ignore
        } finally {
            carregando_comanda.value = false;
        }
    };

    const abrir_modal_comanda = async () => {
        if (!tem_sessao.value) {
            modal_cadastro_visivel.value = true;
            return;
        }

        modal_comanda_visivel.value = true;
        await carregar_comanda_atual();
    };

    const fechar_modal_comanda = () => {
        modal_comanda_visivel.value = false;
    };

    const ativar_tela_cheia_mobile = () => {
        if (!eh_mobile_view.value || modo_tela_cheia_mobile.value) return;
        modo_tela_cheia_mobile.value = true;
        reagendar_renderizacao(true);
    };

    const desativar_tela_cheia_mobile = () => {
        if (!modo_tela_cheia_mobile.value) return;
        modo_tela_cheia_mobile.value = false;
        reagendar_renderizacao(true);
    };

    const alternar_tela_cheia_mobile = () => {
        if (modo_tela_cheia_mobile.value) {
            desativar_tela_cheia_mobile();
            return;
        }

        ativar_tela_cheia_mobile();
    };

    const destruir_flipbook = () => {
        if (instancia_flipbook) {
            try {
                instancia_flipbook.destroy();
            } catch {
                // ignore
            }
            instancia_flipbook = null;
        }

        if (flipbook_container.value) {
            flipbook_container.value.replaceChildren();
        }

        chave_ultimo_render = '';
        atualizar_estado_flipbook(null);
    };

    const iniciar_arraste_miolo = (direcao, canto, evento) => {
        if (!instancia_flipbook || eh_mobile_view.value) return;

        const rect = instancia_flipbook.getRender().getRect();
        const margem = 12;
        const ponto_inicial = {
            x: direcao === 'prev' ? margem : rect.width - margem,
            y: canto === 'top' ? 2 : rect.height - 2,
        };

        arraste_miolo_ativo = {
            direcao,
            canto,
            inicio_cliente_x: evento.clientX,
            inicio_cliente_y: evento.clientY,
            ponto_inicial,
            ultimo_ponto: ponto_inicial,
        };

        instancia_flipbook.startUserTouch(ponto_inicial);
        if (evento.currentTarget?.setPointerCapture) {
            evento.currentTarget.setPointerCapture(evento.pointerId);
        }
    };

    const mover_arraste_miolo = (evento) => {
        if (!arraste_miolo_ativo || !instancia_flipbook) return;

        const rect = instancia_flipbook.getRender().getRect();
        const deslocamento_x = evento.clientX - arraste_miolo_ativo.inicio_cliente_x;
        const deslocamento_y = evento.clientY - arraste_miolo_ativo.inicio_cliente_y;
        const limite_x_min = -rect.pageWidth;
        const limite_x_max = rect.width + rect.pageWidth;
        const ponto = {
            x: Math.max(
                limite_x_min,
                Math.min(limite_x_max, arraste_miolo_ativo.ponto_inicial.x + deslocamento_x),
            ),
            y: Math.max(2, Math.min(rect.height - 2, arraste_miolo_ativo.ponto_inicial.y + deslocamento_y)),
        };

        arraste_miolo_ativo.ultimo_ponto = ponto;
        instancia_flipbook.userMove(ponto, evento.pointerType === 'touch');

        if (evento.cancelable) {
            evento.preventDefault();
        }
    };

    const encerrar_arraste_miolo = (evento) => {
        if (!arraste_miolo_ativo || !instancia_flipbook) return;

        const ponto_final = arraste_miolo_ativo.ultimo_ponto || arraste_miolo_ativo.ponto_inicial;
        instancia_flipbook.userStop(ponto_final, false);
        arraste_miolo_ativo = null;

        if (evento?.cancelable) {
            evento.preventDefault();
        }
    };

    const renderizar_pdf_no_flipbook = async (url, opcoes = {}) => {
        if (!flipbook_container.value || !url) return;

        const { forcar = false } = opcoes;
        const token_atual = ++token_renderizacao;
        renderizando_pdf.value = true;

        try {
            const dimensoes_container = await esperar_container_pronto();
            if (token_atual !== token_renderizacao) return;

            if (dimensoes_container.largura < 240 || dimensoes_container.altura < 240) {
                // Container ainda não tem tamanho suficiente — agenda uma re-tentativa
                // em vez de exibir erro ao usuário.
                renderizando_pdf.value = false;
                reagendar_renderizacao(true);
                return;
            }

            const eh_mobile = media_mobile.matches;
            const chave_render = [
                url,
                eh_mobile ? 'mobile' : 'desktop',
                dimensoes_container.largura,
                dimensoes_container.altura,
            ].join('|');

            if (!forcar && instancia_flipbook && chave_ultimo_render === chave_render) {
                return;
            }

            destruir_flipbook();

            const pdf = await pdfjsLib.getDocument({ url, withCredentials: false }).promise;
            if (token_atual !== token_renderizacao) return;

            // Escala menor no mobile para economizar memória (A4 x9 páginas em scale 2 = ~72MB de canvas).
            const escala_render = eh_mobile ? 1.5 : 2;
            const imagens = [];
            for (let indice = 1; indice <= pdf.numPages; indice += 1) {
                const pagina = await pdf.getPage(indice);
                const viewport = pagina.getViewport({ scale: escala_render });

                const canvas = document.createElement('canvas');
                canvas.width = viewport.width;
                canvas.height = viewport.height;

                await pagina.render({ canvas, viewport }).promise;
                imagens.push(canvas.toDataURL('image/jpeg', 0.85));

                if (token_atual !== token_renderizacao) return;
            }

            const primeira_imagem = imagens[0];
            const img_temp = new Image();
            await new Promise((resolve) => {
                img_temp.onload = resolve;
                img_temp.src = primeira_imagem;
            });

            if (token_atual !== token_renderizacao) return;

            const largura_base = Math.max(220, Math.round(img_temp.width / 2));
            const altura_base = Math.max(320, Math.round(img_temp.height / 2));
            const dimensoes_livro = calcular_dimensoes_livro({
                dimensoes_container,
                largura_pagina_base: largura_base,
                altura_pagina_base: altura_base,
                eh_mobile,
            });

            const host_flipbook = criar_host_flipbook({
                largura: dimensoes_livro.largura_host,
                altura: dimensoes_livro.altura_host,
            });
            if (!host_flipbook) return;

            instancia_flipbook = new PageFlip(host_flipbook, {
                width: dimensoes_livro.largura_pagina,
                height: dimensoes_livro.altura_pagina,
                size: 'fixed',
                autoSize: false,
                maxWidth: dimensoes_livro.largura_pagina,
                maxHeight: dimensoes_livro.altura_pagina,
                maxShadowOpacity: eh_mobile ? 0.3 : 0.5,
                showCover: pdf.numPages > 2 && !eh_mobile,
                mobileScrollSupport: false,
                drawShadow: !eh_mobile,
                usePortrait: eh_mobile,
                flippingTime: 600,
                useMouseEvents: true,
                showPageCorners: !eh_mobile,
                swipeDistance: eh_mobile ? 12 : 30,
            });

            instancia_flipbook.on('init', ({ data }) => {
                pagina_atual.value = Number(data?.page || 0);
                orientacao_flipbook.value = data?.mode || instancia_flipbook.getOrientation();
                total_paginas.value = instancia_flipbook.getPageCount();
            });
            instancia_flipbook.on('flip', ({ data }) => {
                pagina_atual.value = Number(data || 0);
            });
            instancia_flipbook.on('changeOrientation', ({ data }) => {
                orientacao_flipbook.value = String(data || instancia_flipbook.getOrientation());
            });

            instancia_flipbook.loadFromImages(imagens);
            atualizar_estado_flipbook(instancia_flipbook);
            chave_ultimo_render = chave_render;
        } catch {
            if (token_atual === token_renderizacao) {
                destruir_flipbook();
                notificar('Nao foi possivel exibir este cardapio.', 'erro');
            }
        } finally {
            if (token_atual === token_renderizacao) {
                renderizando_pdf.value = false;
            }
        }
    };

    const reagendar_renderizacao = (forcar = false) => {
        const url = pdf_ativo.value?.arquivo_url;
        if (!url || carregando_inicial.value) return;

        if (timeout_rerender) clearTimeout(timeout_rerender);
        timeout_rerender = window.setTimeout(() => {
            renderizar_pdf_no_flipbook(url, { forcar });
        }, 180);
    };

    const ao_mudar_viewport = () => {
        reagendar_renderizacao();
    };

    const ao_mudar_breakpoint_mobile = () => {
        eh_mobile_view.value = media_mobile.matches;
        if (!eh_mobile_view.value) {
            modo_tela_cheia_mobile.value = false;
        }
        ao_mudar_viewport();
    };

    const ir_pagina_anterior = () => {
        if (!instancia_flipbook || !pode_ir_pagina_anterior.value) return;
        instancia_flipbook.flipPrev();
    };

    const ir_pagina_proxima = () => {
        if (!instancia_flipbook || !pode_ir_pagina_proxima.value) return;
        instancia_flipbook.flipNext();
    };

    const selecionar_pdf = async (id) => {
        if (id === pdf_ativo_id.value) return;
        pdf_ativo_id.value = id;
    };

    watch(
        [() => pdf_ativo.value?.arquivo_url, carregando_inicial],
        async ([url, loading]) => {
            if (!url || loading) return;
            await renderizar_pdf_no_flipbook(url);
        },
        { flush: 'post' },
    );

    // Conecta o ResizeObserver ao container quando ele aparece no DOM.
    // No mount, carregando_inicial=true, então o ref é null — precisamos do watch.
    if (typeof ResizeObserver === 'function') {
        observador_resize = new ResizeObserver(() => {
            ao_mudar_viewport();
        });
    }

    watch(flipbook_container, (novo, antigo) => {
        if (antigo && observador_resize) observador_resize.unobserve(antigo);
        if (novo && observador_resize) observador_resize.observe(novo);
    });

    onMounted(async () => {
        aplicar_modo_publico_cardapio();

        remover_listener_media_mobile = adicionar_listener_media(media_mobile, ao_mudar_breakpoint_mobile);
        window.addEventListener('orientationchange', ao_mudar_viewport);
        window.addEventListener('pointermove', mover_arraste_miolo, { passive: false });
        window.addEventListener('pointerup', encerrar_arraste_miolo, { passive: false });
        window.addEventListener('pointercancel', encerrar_arraste_miolo, { passive: false });

        await carregar_dados_iniciais();
    });

    onBeforeUnmount(() => {
        destruir_flipbook();
        parar_polling_aprovacao();
        parar_polling_comanda_ativa();
        if (timeout_feedback) clearTimeout(timeout_feedback);
        if (timeout_rerender) clearTimeout(timeout_rerender);
        observador_resize?.disconnect();
        remover_listener_media_mobile?.();
        window.removeEventListener('orientationchange', ao_mudar_viewport);
        window.removeEventListener('pointermove', mover_arraste_miolo);
        window.removeEventListener('pointerup', encerrar_arraste_miolo);
        window.removeEventListener('pointercancel', encerrar_arraste_miolo);
        remover_modo_publico_cardapio();
    });

    return {
        carregando_inicial,
        erro_carregamento,
        config,
        pdfs,
        pdf_ativo,
        pdf_ativo_id,
        renderizando_pdf,
        mesa,
        comanda,
        sessao_cliente,
        tem_sessao,
        cadastro,
        feedback,
        classes_feedback,
        estilo_cardapio,
        eh_mobile_view,
        modo_tela_cheia_mobile,
        pagina_atual,
        total_paginas,
        pode_ir_pagina_anterior,
        pode_ir_pagina_proxima,
        mostrar_controles_mobile,
        mostrar_alcas_miolo,
        aguardando_aprovacao,
        modo_modal,

        modal_cadastro_visivel,
        modal_comanda_visivel,
        modal_encerramento_visivel,
        encerramento,
        sessao_encerrada,
        enviando_cadastro,
        enviando_chamada,
        carregando_comanda,

        flipbook_container,
        flipbook_stage,

        confirmar_cadastro,
        login_por_cpf,
        alternar_modo_modal,
        ao_digitar_cpf,
        chamar_garcom,
        abrir_modal_comanda,
        fechar_modal_comanda,
        fechar_modal_encerramento,
        selecionar_pdf,
        alternar_tela_cheia_mobile,
        desativar_tela_cheia_mobile,
        ir_pagina_anterior,
        ir_pagina_proxima,
        iniciar_arraste_miolo,
    };
}
