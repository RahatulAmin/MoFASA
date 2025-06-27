const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const database = require('./src/utils/database');

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
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC HANDLERS ---

ipcMain.handle('get-projects', async () => database.getAllProjects());
ipcMain.handle('save-projects', async (_e, projects) => database.saveAllProjects(projects));
ipcMain.handle('update-participant-interview', async (_e, projectId, participantId, interviewText) => {
  database.updateParticipantInterview(projectId, participantId, interviewText);
});

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

// Questionnaire management handlers
ipcMain.handle('get-all-questions', async () => database.getAllQuestions());
ipcMain.handle('update-question-status', async (_e, questionId, isEnabled) => {
  database.updateQuestionStatus(questionId, isEnabled);
});
ipcMain.handle('update-question-text', async (_e, questionId, questionText) => {
  database.updateQuestionText(questionId, questionText);
});
ipcMain.handle('add-question', async (_e, section, questionId, questionText, questionType, options, orderIndex) => {
  database.addQuestion(section, questionId, questionText, questionType, options, orderIndex);
});
ipcMain.handle('delete-question', async (_e, questionId) => {
  database.deleteQuestion(questionId);
});

// Project-specific question management handlers
ipcMain.handle('get-project-questions', async (_e, projectId) => {
  return database.getProjectQuestions(projectId);
});
ipcMain.handle('update-project-question-status', async (_e, projectId, questionId, isEnabled) => {
  try {
    database.updateProjectQuestionStatus(projectId, questionId, isEnabled);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});
ipcMain.handle('get-enabled-project-questions', async (_e, projectId) => {
  return database.getEnabledProjectQuestions(projectId);
});
