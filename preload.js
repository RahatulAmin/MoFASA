const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  // DeepSeek LLM functionality
  generateWithDeepSeek: (prompt) => ipcRenderer.invoke('generate-with-deepseek', prompt),
  getDeepSeekStatus: () => ipcRenderer.invoke('get-deepseek-status'),
  // Settings API
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  testLLMConnection: (url) => ipcRenderer.invoke('test-llm-connection', url)
});