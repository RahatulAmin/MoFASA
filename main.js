const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const axios = require('axios');
const fs = require('fs');
const database = require('./src/utils/database');

// Default settings
const defaultSettings = {
  llmUrl: 'http://127.0.0.1:11434',
  modelName: 'llama3:8b',
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
ipcMain.handle('import-project', async (_e, project) => database.importProject(project));
ipcMain.handle('update-participant-interview', async (_e, projectId, participantId, interviewText) => {
  database.updateParticipantInterview(projectId, participantId, interviewText);
});
ipcMain.handle('update-participant-answers', async (_e, projectId, participantId, answers) => {
  database.updateParticipantAnswers(projectId, participantId, answers);
});
ipcMain.handle('update-participant-summary', async (_e, projectId, participantId, summary) => {
  database.updateParticipantSummary(projectId, participantId, summary);
});

// File download handler
ipcMain.handle('download-file', async (event, fileName) => {
  try {
    // Get the source file path
    const isDev = !app.isPackaged;
    let sourcePath;
    
    if (isDev) {
      // In development, use the src directory
      sourcePath = path.join(__dirname, 'src', fileName);
    } else {
      // In production, use the extraResources path
      sourcePath = path.join(process.resourcesPath, fileName);
    }
    
    // Check if file exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`File not found: ${sourcePath}`);
    }
    
    // Show save dialog
    const result = await dialog.showSaveDialog({
      title: 'Save File',
      defaultPath: fileName,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });
    
    if (!result.canceled && result.filePath) {
      // Copy the file to the selected location
      fs.copyFileSync(sourcePath, result.filePath);
      return { success: true, filePath: result.filePath };
    } else {
      return { success: false, canceled: true };
    }
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('force-database-update', async () => {
  try {
    console.log('Forcing database update...');
    database.updateQuestionFactorMappings();
    database.updateFactorsWithSections();
    console.log('Database update completed');
    return true;
  } catch (error) {
    console.error('Database update failed:', error);
    return false;
  }
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

ipcMain.handle('generate-with-llama', async (_e, prompt) => {
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

ipcMain.handle('generate-with-llama-stream', async (event, prompt) => {
  const settings = loadSettings();
  return new Promise((resolve, reject) => {
    try {
      let fullResponse = '';
      let wordCount = 0;

      const request = axios.post(`${settings.llmUrl}/api/generate`, {
        model: settings.modelName,
        prompt,
        stream: true
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000,
        responseType: 'stream'
      });

      request.then(response => {
        response.data.on('data', (chunk) => {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              if (data.response) {
                fullResponse += data.response;
                
                // Count words to estimate progress more accurately
                const newWordCount = fullResponse.split(/\s+/).length;
                if (newWordCount > wordCount + 5) { // Update every 5 words
                  wordCount = newWordCount;
                  // Estimate progress based on expected summary length (100-150 words)
                  const estimatedProgress = Math.min(90, Math.floor((wordCount / 120) * 100));
                  
                  // Send progress update to renderer
                  event.sender.send('generation-progress', {
                    progress: estimatedProgress,
                    currentText: fullResponse.length > 100 ? fullResponse.substring(0, 100) + '...' : fullResponse
                  });
                }
              }
              
              if (data.done) {
                const cleanResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
                event.sender.send('generation-progress', { progress: 100, currentText: cleanResponse });
                resolve(cleanResponse);
              }
            } catch (parseErr) {
              // Ignore JSON parsing errors for partial chunks
            }
          }
        });

        response.data.on('error', (error) => {
          console.error('Stream error:', error);
          reject(new Error(`Stream error: ${error.message}`));
        });

        response.data.on('end', () => {
          if (fullResponse) {
            const cleanResponse = fullResponse.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
            resolve(cleanResponse);
          }
        });

      }).catch(err => {
        console.error('Generate stream error:', err.message);
        if (['ECONNREFUSED', 'ECONNRESET'].includes(err.code)) {
          reject(new Error('Cannot connect to Ollama. Please ensure Ollama is running (ollama serve)'));
        } else if (err.code === 'ETIMEDOUT') {
          reject(new Error('Connection to Ollama timed out.'));
        } else {
          reject(new Error(`Failed to generate response: ${err.message}`));
        }
      });

    } catch (err) {
      reject(err);
    }
  });
});

ipcMain.handle('get-llama-status', async () => {
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
ipcMain.handle('update-question-factors', async (_e, questionId, factors) => {
  database.updateQuestionFactors(questionId, factors);
});

ipcMain.handle('get-factor-details', async (_e, factorName) => {
  return database.getFactorDetails(factorName);
});

ipcMain.handle('get-all-factors', async () => {
  return database.getAllFactors();
});

ipcMain.handle('get-question-factors', async (_e, questionId) => {
  return database.getQuestionFactors(questionId);
});

ipcMain.handle('update-question-factor-mappings', async () => {
  // This will update the existing database to use the correct factor names
  database.updateQuestionFactorMappings();
  return true;
});

ipcMain.handle('update-factors-with-sections', async () => {
  // This will update the existing database to include section information for factors
  database.updateFactorsWithSections();
  return true;
});



ipcMain.handle('add-question', async (_e, section, questionId, questionText, questionType, options, factors, orderIndex) => {
  database.addQuestion(section, questionId, questionText, questionType, options, factors, orderIndex);
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

ipcMain.handle('test-project-question-settings', async (_e, projectId) => {
  return database.testProjectQuestionSettings(projectId);
});

// Undesirable rules management handlers
ipcMain.handle('get-undesirable-rules', async (_e, scopeId) => {
  return database.getUndesirableRules(scopeId);
});

ipcMain.handle('save-undesirable-rules', async (_e, scopeId, rules) => {
  database.saveUndesirableRules(scopeId, rules);
  return { success: true };
});

ipcMain.handle('add-undesirable-rule', async (_e, scopeId, rule) => {
  database.addUndesirableRule(scopeId, rule);
  return { success: true };
});

ipcMain.handle('remove-undesirable-rule', async (_e, scopeId, rule) => {
  database.removeUndesirableRule(scopeId, rule);
  return { success: true };
});
