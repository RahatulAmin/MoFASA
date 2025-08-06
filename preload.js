const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('electronAPI', {
  getProjects: () => ipcRenderer.invoke('get-projects'),
  saveProjects: (projects) => ipcRenderer.invoke('save-projects', projects),
  importProject: (project) => ipcRenderer.invoke('import-project', project),
  updateParticipantInterview: (projectId, participantId, interviewText) => 
    ipcRenderer.invoke('update-participant-interview', projectId, participantId, interviewText),
  updateParticipantAnswers: (projectId, participantId, answers) => 
    ipcRenderer.invoke('update-participant-answers', projectId, participantId, answers),
  updateParticipantSummary: (projectId, participantId, summary) => 
    ipcRenderer.invoke('update-participant-summary', projectId, participantId, summary),
  // File download API
  downloadFile: (fileName) => ipcRenderer.invoke('download-file', fileName),
  // Llama3 LLM functionality
      generateWithLlama: (prompt) => ipcRenderer.invoke('generate-with-llama', prompt),
    generateWithLlamaStream: (prompt) => ipcRenderer.invoke('generate-with-llama-stream', prompt),
    onGenerationProgress: (callback) => ipcRenderer.on('generation-progress', callback),
    removeGenerationProgressListener: (callback) => ipcRenderer.removeListener('generation-progress', callback),
  getLlamaStatus: () => ipcRenderer.invoke('get-llama-status'),
  // Settings API
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  testLLMConnection: (url) => ipcRenderer.invoke('test-llm-connection', url),
  // Questionnaire management API
  getAllQuestions: () => ipcRenderer.invoke('get-all-questions'),
  updateQuestionStatus: (questionId, isEnabled) => ipcRenderer.invoke('update-question-status', questionId, isEnabled),
  updateQuestionText: (questionId, questionText) => ipcRenderer.invoke('update-question-text', questionId, questionText),
  addQuestion: (section, questionId, questionText, questionType, options, orderIndex) => 
    ipcRenderer.invoke('add-question', section, questionId, questionText, questionType, options, orderIndex),
  deleteQuestion: (questionId) => ipcRenderer.invoke('delete-question', questionId),
  // Project-specific question management API
  getProjectQuestions: (projectId) => ipcRenderer.invoke('get-project-questions', projectId),
  updateProjectQuestionStatus: (projectId, questionId, isEnabled) => 
    ipcRenderer.invoke('update-project-question-status', projectId, questionId, isEnabled),
  getEnabledProjectQuestions: (projectId) => ipcRenderer.invoke('get-enabled-project-questions', projectId),
  testProjectQuestionSettings: (projectId) => ipcRenderer.invoke('test-project-question-settings', projectId),
  // Factor management API
  getFactorDetails: (factorName) => ipcRenderer.invoke('get-factor-details', factorName),
  getAllFactors: () => ipcRenderer.invoke('get-all-factors'),
  getQuestionFactors: (questionId) => ipcRenderer.invoke('get-question-factors', questionId),
  updateQuestionFactorMappings: () => ipcRenderer.invoke('update-question-factor-mappings'),
  updateFactorsWithSections: () => ipcRenderer.invoke('update-factors-with-sections'),
  forceDatabaseUpdate: () => ipcRenderer.invoke('force-database-update'),
  // Undesirable rules management API
  getUndesirableRules: (scopeId) => ipcRenderer.invoke('get-undesirable-rules', scopeId),
  saveUndesirableRules: (scopeId, rules) => ipcRenderer.invoke('save-undesirable-rules', scopeId, rules),
  addUndesirableRule: (scopeId, rule) => ipcRenderer.invoke('add-undesirable-rule', scopeId, rule),
  removeUndesirableRule: (scopeId, rule) => ipcRenderer.invoke('remove-undesirable-rule', scopeId, rule)
});