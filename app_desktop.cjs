// C:\PDP\NITEC_APP\app_desktop.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const servidor_local = require('./servidor_local.cjs');

app.disableHardwareAcceleration();

let janela_pdv;
let info_servidor_local = null;
let intervalo_sync_vps  = null;
let servidor_iniciado   = false;

/**
 * Verifica se o usuário logado é DONO ou ADMIN_MASTER.
 * Só o DONO é o servidor principal — outros PCs são clientes.
 * @returns {boolean}
 */
const usuario_e_dono = () => {
    try {
        const Storage = require('electron-store') || null;
        // Lê diretamente do localStorage via webContents seria mais fácil
        // mas aqui usamos uma flag salva via IPC quando o login acontece
        return servidor_iniciado; // Controlado pelo IPC 'definir-tipo-usuario'
    } catch { return false; }
};

const criar_janela_principal = () => {
    janela_pdv = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration  : true,
            contextIsolation : false,
        }
    });

    if (app.isPackaged) {
        janela_pdv.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        janela_pdv.loadURL('http://localhost:5173');
    }
};

const iniciar_sync_automatico = () => {
    if (intervalo_sync_vps) return;
    intervalo_sync_vps = setInterval(() => {
        janela_pdv?.webContents?.send('pedir-credenciais-sync');
    }, 30000);
};

app.whenReady().then(async () => {

    // 🟢 Passa o caminho do dist/ para o servidor local servir o app Vue
    // Servidor local não inicia aqui — só inicia após login do DONO (via IPC 'notificar-login')
    criar_janela_principal();
    iniciar_sync_automatico();

    autoUpdater.allowDowngrade = true;
    autoUpdater.autoDownload   = false;

    ipcMain.on('pedir-versao', (event) => {
        event.sender.send('resposta-versao', app.isPackaged ? app.getVersion() : 'Dev');
    });
});

app.on('window-all-closed', () => {
    servidor_local.parar();
    if (intervalo_sync_vps) { clearInterval(intervalo_sync_vps); intervalo_sync_vps = null; }
    if (process.platform !== 'darwin') app.quit();
});

// ─── IPC: Servidor Local ─────────────────────────────────────────────────────

// 🟢 O Vue notifica quando o usuário faz login — decide se inicia o servidor
// Só DONO e ADMIN_MASTER sobem o servidor local
ipcMain.handle('notificar-login', async (event, { tipo_usuario, tenant_id }) => {
    const e_dono = ['dono', 'admin_master'].includes(tipo_usuario);

    if (e_dono && !info_servidor_local) {
        // Inicia o servidor se ainda não está rodando
        try {
            const caminho_dados = app.getPath('userData');
            const caminho_dist  = path.join(__dirname, 'dist');
            info_servidor_local = await servidor_local.iniciar(caminho_dados, caminho_dist, tenant_id);
            servidor_iniciado = true;
            console.log(`[App] Servidor local iniciado para tenant: ${tenant_id}`);
        } catch (e) {
            console.error('[App] Falha ao iniciar servidor local:', e.message);
        }
    } else if (!e_dono && info_servidor_local) {
        // Para o servidor se um não-dono está logado neste PC
        servidor_local.parar();
        info_servidor_local = null;
        servidor_iniciado = false;
        console.log('[App] Servidor local parado — usuário não é dono.');
    }

    return { servidor_ativo: !!info_servidor_local };
});

ipcMain.handle('obter-servidor-local', () => {
    if (!info_servidor_local) return null;
    return {
        url  : `http://${info_servidor_local.ip}:${info_servidor_local.porta}`,
        ip   : info_servidor_local.ip,
        porta: info_servidor_local.porta
    };
});

ipcMain.handle('sincronizar-fila-local', async (event, { url_base, token }) => {
    if (!url_base || !token) return { ok: 0, falha: 0, erro: 'Credenciais ausentes.' };
    try {
        return await servidor_local.sincronizar_com_vps(url_base, token);
    } catch (e) {
        return { ok: 0, falha: 0, erro: e.message };
    }
});

// ─── IPC: Auto-Updater ───────────────────────────────────────────────────────

ipcMain.on('checar-atualizacoes', () => {
    if (!app.isPackaged) {
        janela_pdv.webContents.send('status-atualizacao', { status: 'erro', mensagem: 'O Updater real só roda no .exe final.' });
        return;
    }
    autoUpdater.checkForUpdates();
});

ipcMain.on('baixar-atualizacao',   () => { if (app.isPackaged) autoUpdater.downloadUpdate(); });
ipcMain.on('instalar-atualizacao', () => { if (app.isPackaged) autoUpdater.quitAndInstall(); });

autoUpdater.on('checking-for-update', () => {
    janela_pdv?.webContents.send('status-atualizacao', { status: 'buscando', mensagem: 'Procurando atualizações...' });
});
autoUpdater.on('update-available', (info) => {
    janela_pdv?.webContents.send('status-atualizacao', { status: 'disponivel', versao: info.version, mensagem: `Versão ${info.version} disponível!` });
});
autoUpdater.on('update-not-available', (info) => {
    janela_pdv?.webContents.send('status-atualizacao', { status: 'atualizado', versao: info.version, mensagem: 'Você já está na versão mais recente.' });
});
autoUpdater.on('download-progress', (progressObj) => {
    janela_pdv?.webContents.send('progresso-download', progressObj.percent);
});
autoUpdater.on('update-downloaded', () => {
    janela_pdv?.webContents.send('status-atualizacao', { status: 'pronto', mensagem: 'Download concluído! Pronto para instalar.' });
});
autoUpdater.on('error', (err) => {
    janela_pdv?.webContents.send('status-atualizacao', { status: 'erro', mensagem: 'Erro na atualização: ' + err.message });
});
