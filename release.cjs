/**
 * release.cjs
 * Script de release completo do Nitec System.
 * Uso: npm run release
 *
 * Passos:
 * 1. Incrementa versão no package.json
 * 2. Git add + commit + push
 * 3. Build Vue
 * 4. Gera .exe e sobe para o GitHub Releases (electron-builder)
 * 5. Gera APK Android
 * 6. Faz upload do APK na release via GitHub API (automático)
 */

const { execSync } = require('child_process');
const fs           = require('fs');
const path         = require('path');
const https        = require('https');

// ─── Cores ────────────────────────────────────────────────────────────────────
const verde    = (t) => `\x1b[32m${t}\x1b[0m`;
const amarelo  = (t) => `\x1b[33m${t}\x1b[0m`;
const vermelho = (t) => `\x1b[31m${t}\x1b[0m`;
const ciano    = (t) => `\x1b[36m${t}\x1b[0m`;
const negrito  = (t) => `\x1b[1m${t}\x1b[0m`;

const log   = (msg) => console.log(verde('✅ ') + msg);
const info  = (msg) => console.log(ciano('ℹ️  ') + msg);
const aviso = (msg) => console.log(amarelo('⚠️  ') + msg);
const erro  = (msg) => console.log(vermelho('❌ ') + msg);
const sep   = ()    => console.log(negrito(ciano('\n══════════════════════════════════════')));

const executar = (cmd, opcoes = {}) => execSync(cmd, { stdio: 'inherit', ...opcoes });

// ─── Configurações ────────────────────────────────────────────────────────────
const GH_TOKEN     = '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';
const GH_OWNER     = 'Nicollas42';
const GH_REPO      = 'nitec-atualizacoes';
const JAVA_HOME    = 'C:\\Program Files\\Android\\Android Studio\\jbr';

// ─── Utilitários GitHub API ───────────────────────────────────────────────────

/**
 * Faz uma requisição HTTPS para a GitHub API.
 * @param {string} metodo
 * @param {string} caminho
 * @param {object|null} corpo
 * @param {object} headers_extras
 * @returns {Promise<object>}
 */
const github_api = (metodo, caminho, corpo = null, headers_extras = {}) => {
    return new Promise((resolve, reject) => {
        const dados = corpo ? JSON.stringify(corpo) : null;
        const opcoes = {
            hostname: 'api.github.com',
            path    : caminho,
            method  : metodo,
            headers : {
                'Authorization': `Bearer ${GH_TOKEN}`,
                'Accept'       : 'application/vnd.github+json',
                'User-Agent'   : 'nitec-release-script',
                'X-GitHub-Api-Version': '2022-11-28',
                ...headers_extras,
                ...(dados ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(dados) } : {})
            }
        };

        const req = https.request(opcoes, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); } 
                catch { resolve(body); }
            });
        });

        req.on('error', reject);
        if (dados) req.write(dados);
        req.end();
    });
};

/**
 * Faz upload de um arquivo binário para um release do GitHub.
 * @param {string} upload_url  URL de upload da release (vem do electron-builder)
 * @param {string} caminho_arquivo
 * @param {string} nome_arquivo
 * @returns {Promise<object>}
 */
const upload_asset_github = (upload_url, caminho_arquivo, nome_arquivo) => {
    return new Promise((resolve, reject) => {
        const conteudo = fs.readFileSync(caminho_arquivo);
        const tamanho  = conteudo.length;

        // upload_url vem no formato: https://uploads.github.com/repos/.../assets{?name,label}
        // Precisamos remover o {?name,label} e adicionar ?name=arquivo.apk
        const url_base = upload_url.replace(/\{.*\}/, '');
        const url      = new URL(`${url_base}?name=${encodeURIComponent(nome_arquivo)}`);

        const opcoes = {
            hostname: url.hostname,
            path    : url.pathname + url.search,
            method  : 'POST',
            headers : {
                'Authorization': `Bearer ${GH_TOKEN}`,
                'Accept'       : 'application/vnd.github+json',
                'User-Agent'   : 'nitec-release-script',
                'Content-Type' : 'application/vnd.android.package-archive',
                'Content-Length': tamanho,
            }
        };

        const req = https.request(opcoes, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try { resolve(JSON.parse(body)); }
                catch { resolve(body); }
            });
        });

        req.on('error', reject);
        req.write(conteudo);
        req.end();
    });
};

/**
 * Busca a release mais recente do repositório pelo nome da tag.
 * @param {string} tag  Ex: 'v1.1.7'
 * @returns {Promise<object|null>}
 */
const buscar_release_por_tag = async (tag) => {
    try {
        // Busca em /releases para encontrar também as releases em Draft
        // O endpoint /releases/tags/{tag} ignora drafts
        const lista = await github_api('GET', `/repos/${GH_OWNER}/${GH_REPO}/releases?per_page=10`);
        if (!Array.isArray(lista)) return null;
        const release = lista.find(r => r.tag_name === tag);
        return release?.id ? release : null;
    } catch {
        return null;
    }
};

/**
 * Aguarda até a release aparecer no GitHub (o electron-builder pode demorar alguns segundos).
 * @param {string} tag
 * @param {number} tentativas
 * @returns {Promise<object|null>}
 */
const aguardar_release = async (tag, tentativas = 12) => {
    for (let i = 0; i < tentativas; i++) {
        const release = await buscar_release_por_tag(tag);
        if (release) return release;
        info(`Aguardando a release ${tag} aparecer no GitHub... (${i + 1}/${tentativas})`);
        await new Promise(r => setTimeout(r, 5000)); // Espera 5s entre tentativas
    }
    return null;
};

// ─── Funções principais ───────────────────────────────────────────────────────

const incrementar_versao = () => {
    const caminho = path.join(__dirname, 'package.json');
    const pkg     = JSON.parse(fs.readFileSync(caminho, 'utf8'));
    const antiga  = pkg.version;
    const partes  = antiga.split('.').map(Number);
    partes[2]++;
    pkg.version   = partes.join('.');
    fs.writeFileSync(caminho, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    return { versao_antiga: antiga, versao_nova: pkg.version };
};

const configurar_java = () => {
    if (fs.existsSync(JAVA_HOME)) {
        process.env.JAVA_HOME = JAVA_HOME;
        process.env.PATH      = `${JAVA_HOME}\\bin;${process.env.PATH}`;
        log('JAVA_HOME configurado.');
    } else {
        aviso('Android Studio JBR não encontrado. Build Android pode falhar.');
    }
};

// ─── EXECUÇÃO ─────────────────────────────────────────────────────────────────

(async () => {
    console.log('\n' + negrito('🚀 NITEC SYSTEM — RELEASE AUTOMÁTICO'));
    console.log('══════════════════════════════════════\n');

    process.env.GH_TOKEN = GH_TOKEN;

    // PASSO 1 — Versão
    sep();
    info('PASSO 1/6 — Incrementando versão...');
    const { versao_antiga, versao_nova } = incrementar_versao();
    log(`Versão: ${versao_antiga} → ${versao_nova}`);
    const tag_nova = `v${versao_nova}`;

    // PASSO 2 — Git
    sep();
    info('PASSO 2/6 — Enviando código para o GitHub...');
    try {
        executar('git add .');
        executar(`git commit -m "release: ${tag_nova}"`);
        executar('git push');
        log('Código enviado para o GitHub.');
    } catch {
        aviso('Nada novo para commitar ou push falhou. Continuando...');
    }

    // PASSO 3 — Build Vue
    sep();
    info('PASSO 3/6 — Compilando Vue...');
    executar('npx vite build');
    log('Build Vue concluído.');

    // PASSO 4 — .exe + GitHub Release
    sep();
    info('PASSO 4/6 — Gerando .exe e criando release no GitHub...');
    executar('npx electron-builder --win -p always');
    log('.exe enviado para o GitHub Releases.');

    // PASSO 5 — APK Android
    sep();
    info('PASSO 5/6 — Gerando APK Android...');
    configurar_java();

    const android_dir  = path.join(__dirname, 'android');
    const caminho_apk  = path.join(android_dir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk');
    let apk_disponivel = false;

    if (!fs.existsSync(android_dir)) {
        aviso('Pasta android/ não encontrada. Pulando build Android.');
    } else {
        try {
            executar('npx cap sync android');
            executar('.\\gradlew assembleRelease', { cwd: android_dir });
            if (fs.existsSync(caminho_apk)) {
                log('APK gerado com sucesso.');
                apk_disponivel = true;
            } else {
                aviso('APK não encontrado após o build.');
            }
        } catch (e) {
            erro('Build Android falhou: ' + e.message);
        }
    }

    // PASSO 6 — Upload do APK no GitHub
    sep();
    info('PASSO 6/6 — Fazendo upload do APK no GitHub...');

    if (!apk_disponivel) {
        aviso('APK não disponível. Pulando upload.');
    } else {
        // Aguarda a release aparecer no GitHub (criada pelo electron-builder)
        const release = await aguardar_release(tag_nova);

        if (!release) {
            erro(`Release ${tag_nova} não encontrada no GitHub após várias tentativas.`);
            aviso(`Faça o upload manual do APK em: github.com/${GH_OWNER}/${GH_REPO}/releases`);
        } else {
            try {
                info(`Upload do APK para a release ${tag_nova}...`);
                const nome_apk = `NitecSystem-${versao_nova}.apk`;
                const resultado = await upload_asset_github(release.upload_url, caminho_apk, nome_apk);

                if (resultado?.browser_download_url) {
                    log(`APK enviado: ${resultado.browser_download_url}`);

                    // Publica a release (tira do estado Draft)
                    await github_api('PATCH', `/repos/${GH_OWNER}/${GH_REPO}/releases/${release.id}`, { draft: false });
                    log('Release publicada automaticamente.');
                } else {
                    aviso('Upload do APK retornou resposta inesperada.');
                    aviso('Verifique manualmente em: github.com/' + GH_OWNER + '/' + GH_REPO + '/releases');
                }
            } catch (e) {
                erro('Erro no upload do APK: ' + e.message);
                aviso(`Faça o upload manual: ${caminho_apk}`);
            }
        }
    }

    // ─── RESUMO FINAL ─────────────────────────────────────────────────────────
    console.log('\n' + negrito(verde('══════════════════════════════════════')));
    console.log(negrito(verde(`🎉 RELEASE ${tag_nova} CONCLUÍDA!`)));
    console.log(negrito(verde('══════════════════════════════════════')));
    console.log(verde(`\n   ✅ Código no GitHub`));
    console.log(verde(`   ✅ .exe no GitHub Releases`));
    console.log(verde(`   ✅ APK no GitHub Releases`));
    console.log(verde(`   ✅ Release publicada`));
    console.log(ciano(`\n   🔗 github.com/${GH_OWNER}/${GH_REPO}/releases\n`));
})();
