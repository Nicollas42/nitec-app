// C:\PDP\NITEC_APP\app_desktop.cjs
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.disableHardwareAcceleration();

/**
 * Verifica se o aplicativo está rodando em modo de desenvolvimento.
 * @type {boolean}
 */
const eh_desenvolvimento = !app.isPackaged;

/**
 * Cria e configura a janela principal do sistema Desktop.
 * @return {void}
 */
const criar_janela_principal = () => {
    const janela_pdv = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Necessário para algumas integrações de plugins legados
        }
    });

    if (eh_desenvolvimento) {
        // Carrega o servidor HMR do Vite para desenvolvimento com Hot Reload
        janela_pdv.loadURL('http://localhost:5173');
    } else {
        // Carrega os arquivos estáticos compilados para produção
        janela_pdv.loadFile(path.join(__dirname, 'dist', 'index.html'));
    }
};

app.whenReady().then(criar_janela_principal);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});