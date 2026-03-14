// C:\PDP\NITEC_APP\app_desktop.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const servidor_local = require('./servidor_local.cjs');

app.disableHardwareAcceleration();

let janela_pdv;
let info_servidor_local = null;
let intervalo_sync_vps  = null;

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
    const caminho_dados = app.getPath('userData');
    const caminho_dist  = app.isPackaged
        ? path.join(__dirname, 'dist')       // produção: dist/ ao lado do .exe
        : path.join(__dirname, 'dist');      // dev: mesmo caminho (rode npm run build primeiro)

    try {
        info_servidor_local = await servidor_local.iniciar(caminho_dados, caminho_dist);
        console.log(`[App] Servidor local: http://${info_servidor_local.ip}:${info_servidor_local.porta}`);
        console.log(`[App] App Vue acessível em: http://${info_servidor_local.ip}:${info_servidor_local.porta}`);
    } catch (e) {
        console.error('[App] Falha ao iniciar servidor local:', e.message);
    }

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