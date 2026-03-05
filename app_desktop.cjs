// C:\PDP\NITEC_APP\app_desktop.cjs
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

app.disableHardwareAcceleration();

let janela_pdv;

const criar_janela_principal = () => {
    janela_pdv = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, 
        }
    });

    if (app.isPackaged) {
        // MODO PRODUÇÃO (.exe)
        janela_pdv.loadFile(path.join(__dirname, 'dist', 'index.html'));
    } else {
        // MODO DESENVOLVIMENTO
        janela_pdv.loadURL('http://localhost:5173');
    }
};

app.whenReady().then(() => {
    criar_janela_principal();

    // CONFIGURAÇÃO DO UPDATER
    autoUpdater.allowDowngrade = true; 
    autoUpdater.autoDownload = false; // Não baixa sozinho, espera o usuário clicar
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ==========================================
// COMUNICAÇÃO: VUE <--> ELECTRON (ATUALIZAÇÕES)
// ==========================================

// 1. O Vue pede para checar atualizações
ipcMain.on('checar-atualizacoes', () => {
    if (!app.isPackaged) {
        // Se estiver no ambiente de dev, simula o aviso no ecrã para você ver funcionando
        janela_pdv.webContents.send('status-atualizacao', { status: 'erro', mensagem: 'O Updater real só roda no .exe final.' });
        return;
    }
    autoUpdater.checkForUpdates();
});

// 2. O Vue pede para iniciar o download
ipcMain.on('baixar-atualizacao', () => {
    if (app.isPackaged) autoUpdater.downloadUpdate();
});

// 3. O Vue pede para instalar e reiniciar
ipcMain.on('instalar-atualizacao', () => {
    if (app.isPackaged) autoUpdater.quitAndInstall();
});

// ==========================================
// RETORNO DO ELECTRON -> VUE
// ==========================================
autoUpdater.on('checking-for-update', () => {
    if (janela_pdv) janela_pdv.webContents.send('status-atualizacao', { status: 'buscando', mensagem: 'Procurando atualizações...' });
});

autoUpdater.on('update-available', (info) => {
    if (janela_pdv) janela_pdv.webContents.send('status-atualizacao', { status: 'disponivel', versao: info.version, mensagem: `Versão ${info.version} disponível!` });
});

autoUpdater.on('update-not-available', (info) => {
    if (janela_pdv) janela_pdv.webContents.send('status-atualizacao', { status: 'atualizado', versao: info.version, mensagem: 'Você já está na versão mais recente.' });
});

autoUpdater.on('download-progress', (progressObj) => {
    // Envia a % exata para a barra de progresso do Vue
    if (janela_pdv) janela_pdv.webContents.send('progresso-download', progressObj.percent);
});

autoUpdater.on('update-downloaded', () => {
    if (janela_pdv) janela_pdv.webContents.send('status-atualizacao', { status: 'pronto', mensagem: 'Download concluído! Pronto para instalar.' });
});

autoUpdater.on('error', (err) => {
    if (janela_pdv) janela_pdv.webContents.send('status-atualizacao', { status: 'erro', mensagem: 'Erro na atualização: ' + err.message });
});