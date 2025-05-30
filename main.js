const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

let store;

// Default settings
const defaultSettings = {
  llmUrl: 'http://127.0.0.1:11434',
  modelName: 'deepseek-r1:8b',
  maxTokens: 2048,
  temperature: 0.7,
  topP: 0.9,
  frequencyPenalty: 0,
  presencePenalty: 0
};

const SETTINGS_FILE = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) {
      fs.mkdirSync(path.dirname(SETTINGS_FILE), { recursive: true });
      fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
    }
    const settingsData = fs.readFileSync(SETTINGS_FILE, 'utf8');
    return JSON.parse(settingsData);
  } catch (err) {
    console.error('Failed to load settings:', err);
    return defaultSettings;
  }
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // 👈 Prevent flicker
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    frame: true,
    resizable: true,
    autoHideMenuBar: true
  });

  mainWindow.maximize();
  mainWindow.loadFile('index.html');

  // 👇 Only show when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();

    if (process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });
}

app.whenReady().then(async () => {
  const Store = (await import('electron-store')).default;
  store = new Store();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS ---

ipcMain.handle('get-projects', async () => store.get('projects', []));
ipcMain.handle('save-projects', async (_e, projects) => store.set('projects', projects));

ipcMain.handle('get-settings', async () => loadSettings());

ipcMain.handle('save-settings', async (_e, newSettings) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(newSettings, null, 2));
    return true;
  } catch (err) {
    console.error('Error saving settings:', err);
    return false;
  }
});

ipcMain.handle('generate-with-deepseek', async (_e, prompt) => {
  const settings = loadSettings();
  try {
    const response = await axios.post(`${settings.llmUrl}/api/generate`, {
      model: settings.modelName,
      prompt,
      stream: false
    }, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    const result = response.data.response;
    if (typeof result !== 'string') {
      throw new Error('Invalid response format from Ollama');
    }

    return result.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
  } catch (err) {
    console.error('Generate error:', err.message);
    if (['ECONNREFUSED', 'ECONNRESET'].includes(err.code)) {
      throw new Error('Cannot connect to Ollama. Please ensure Ollama is running (ollama serve)');
    }
    if (err.code === 'ETIMEDOUT') {
      throw new Error('Connection to Ollama timed out.');
    }
    throw new Error(`Failed to generate response: ${err.message}`);
  }
});

ipcMain.handle('get-deepseek-status', async () => {
  const settings = loadSettings();
  try {
    const { data } = await axios.get(`${settings.llmUrl}/api/tags`, {
      timeout: 5000
    });

    const models = data.models || [];
    const found = models.some(m => m.name === settings.modelName);
    return found
      ? { status: 'connected' }
      : { status: 'disconnected', error: `Model "${settings.modelName}" not found. Run: ollama pull ${settings.modelName}` };
  } catch (err) {
    return {
      status: 'disconnected',
      error: ['ECONNREFUSED', 'ECONNRESET'].includes(err.code)
        ? 'Cannot connect to Ollama. Please ensure it is running.'
        : err.message
    };
  }
});

ipcMain.handle('test-llm-connection', async (_e, url) => {
  try {
    const { data } = await axios.get(`${url}/api/tags`, { timeout: 5000 });
    const settings = loadSettings();
    const models = data.models || [];
    const found = models.some(m => m.name === settings.modelName);

    return found
      ? { status: true }
      : { status: false, error: `Model "${settings.modelName}" not found. Run: ollama pull ${settings.modelName}` };
  } catch (err) {
    return {
      status: false,
      error: ['ECONNREFUSED', 'ECONNRESET'].includes(err.code)
        ? 'Cannot connect to Ollama. Please ensure it is running.'
        : err.message
    };
  }
});
