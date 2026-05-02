import { computed, onActivated, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api_cliente from '../servicos/api_cliente.js';
import { useMesasStore } from '../stores/mesas_store.js';
import { useToastStore } from '../stores/toast_store.js';

export function useLogicaCardapioAdmin() {
    const roteador = useRouter();
    const toast    = useToastStore();
    const loja_mesas = useMesasStore();

    const carregando = ref(true);

    // ── PDFs ──────────────────────────────────────────────
    const lista_pdfs    = ref([]);
    const enviando_pdf  = ref(false);
    const pdf_processando = ref(null);
    const form_pdf = ref({ nome_cardapio: '', arquivo: null });

    const voltar_painel = () => roteador.push('/painel-central');

    // ── PDFs ──────────────────────────────────────────────
    const carregar_pdfs = async () => {
        const { data } = await api_cliente.get('/cardapio/admin/pdfs');
        lista_pdfs.value = data?.pdfs || [];
    };

    const on_arquivo_selecionado = (evento) => {
        const arquivo = evento.target?.files?.[0] || null;
        form_pdf.value.arquivo = arquivo;
        if (arquivo && !form_pdf.value.nome_cardapio) {
            // Sugere um nome baseado no arquivo (sem extensão)
            form_pdf.value.nome_cardapio = arquivo.name.replace(/\.pdf$/i, '').slice(0, 100);
        }
    };

    const enviar_pdf = async () => {
        if (!form_pdf.value.arquivo) {
            toast.exibir_toast('Selecione um arquivo PDF.', 'erro');
            return;
        }
        if (!form_pdf.value.nome_cardapio?.trim()) {
            toast.exibir_toast('Informe o nome do cardapio.', 'erro');
            return;
        }

        enviando_pdf.value = true;
        try {
            const formData = new FormData();
            formData.append('nome_cardapio', form_pdf.value.nome_cardapio.trim());
            formData.append('arquivo', form_pdf.value.arquivo);

            await api_cliente.post('/cardapio/admin/pdfs', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            form_pdf.value = { nome_cardapio: '', arquivo: null };
            await carregar_pdfs();
            toast.exibir_toast('Cardapio PDF enviado!', 'sucesso');
        } catch (erro) {
            console.error(erro);
            const msg = erro.response?.data?.message
                || erro.response?.data?.mensagem
                || 'Nao foi possivel enviar o PDF.';
            toast.exibir_toast(msg, 'erro');
        } finally {
            enviando_pdf.value = false;
        }
    };

    const alternar_pdf_ativo = async (pdf) => {
        const novo_valor = !pdf.ativo;
        pdf_processando.value = pdf.id;
        try {
            await api_cliente.put(`/cardapio/admin/pdfs/${pdf.id}`, { ativo: novo_valor });
            pdf.ativo = novo_valor;
        } catch (erro) {
            console.error(erro);
            toast.exibir_toast('Nao foi possivel atualizar este cardapio.', 'erro');
        } finally {
            pdf_processando.value = null;
        }
    };

    const renomear_pdf = async (pdf, novo_nome) => {
        const nome_limpo = String(novo_nome || '').trim();
        if (!nome_limpo || nome_limpo === pdf.nome_cardapio) return;
        pdf_processando.value = pdf.id;
        try {
            await api_cliente.put(`/cardapio/admin/pdfs/${pdf.id}`, { nome_cardapio: nome_limpo });
            pdf.nome_cardapio = nome_limpo;
            toast.exibir_toast('Nome atualizado.', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast.exibir_toast('Nao foi possivel renomear.', 'erro');
        } finally {
            pdf_processando.value = null;
        }
    };

    const excluir_pdf = async (pdf) => {
        if (!confirm(`Remover o cardapio "${pdf.nome_cardapio}"?`)) return;
        pdf_processando.value = pdf.id;
        try {
            await api_cliente.delete(`/cardapio/admin/pdfs/${pdf.id}`);
            lista_pdfs.value = lista_pdfs.value.filter((p) => p.id !== pdf.id);
            toast.exibir_toast('Cardapio removido.', 'sucesso');
        } catch (erro) {
            console.error(erro);
            toast.exibir_toast('Nao foi possivel remover.', 'erro');
        } finally {
            pdf_processando.value = null;
        }
    };

    // ── Carregamento geral ────────────────────────────────
    const carregar_dados = async (forcar = true) => {
        carregando.value = true;
        try {
            await Promise.all([
                carregar_pdfs(),
                loja_mesas.buscar_mesas(forcar),
            ]);
        } catch (erro) {
            console.error(erro);
            toast.exibir_toast('Erro ao carregar o cardapio digital.', 'erro');
        } finally {
            carregando.value = false;
        }
    };

    const formatar_tamanho = (bytes) => {
        if (!bytes) return '—';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    onMounted(() => {
        carregar_dados(true);
    });

    onActivated(() => {
        carregar_dados(true);
    });

    return {
        carregando,
        lista_mesas: computed(() => loja_mesas.lista_mesas || []),
        voltar_painel,

        // pdfs
        lista_pdfs,
        form_pdf,
        enviando_pdf,
        pdf_processando,
        on_arquivo_selecionado,
        enviar_pdf,
        alternar_pdf_ativo,
        renomear_pdf,
        excluir_pdf,
        formatar_tamanho,
    };
}
