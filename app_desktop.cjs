const { app, BrowserWindow } = require('electron');

app.disableHardwareAcceleration();

/**
 * Cria e configura a janela principal do sistema Desktop.
 * * @return {void}
 */
const criar_janela_principal = () => {
    const janela_pdv = new BrowserWindow({
        width: 1280,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            nodeIntegration: true,
        }
    });

    // Em ambiente de desenvolvimento, lê a porta padrão do Vite
    janela_pdv.loadURL('http://localhost:5173');
};

app.whenReady().then(criar_janela_principal);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});