import React, { useState, useEffect } from 'react';
import ProjectQuestionnaireSettings from './ProjectQuestionnaireSettings';

const Settings = ({ projects }) => {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects' or 'tech'
  const [settings, setSettings] = useState({
    llmUrl: 'http://127.0.0.1:11434',
    modelName: 'deepseek-coder',
    maxTokens: 2048
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [editingProject, setEditingProject] = useState(null);
  const [editPrompt, setEditPrompt] = useState('');
  const [selectedProjectForQuestionnaire, setSelectedProjectForQuestionnaire] = useState(null);

  // Function to check connection status
  const checkConnectionStatus = async () => {
    try {
      const result = await window.electronAPI.testLLMConnection(settings.llmUrl);
      setIsConnected(result.status);
      setConnectionError(result.error || null);
      if (!result.status) {
        setSaveStatus({ 
          type: 'error', 
          message: result.error || 'LLM connection lost. Please ensure Ollama is running.' 
        });
      } else {
        setSaveStatus(null);
      }
    } catch (error) {
      setIsConnected(false);
      setConnectionError('Failed to check connection status');
      setSaveStatus({ 
        type: 'error', 
        message: 'LLM connection error. Please ensure Ollama is running.' 
      });
    }
  };

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const savedSettings = await window.electronAPI.getSettings();
        if (savedSettings) {
          setSettings(savedSettings);
        }
        // Check initial connection status
        await checkConnectionStatus();
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };
    loadData();
  }, []); // Only run on mount

  // Separate effect for connection status check
  useEffect(() => {
    const intervalId = setInterval(checkConnectionStatus, 5000);
    return () => clearInterval(intervalId);
  }, [settings.llmUrl]); // Re-check when URL changes

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    try {
      await window.electronAPI.saveSettings(settings);
      setSaveStatus({ type: 'success', message: 'Settings saved successfully!' });
      await checkConnectionStatus();
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus({ type: 'error', message: 'Failed to save settings. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      const result = await window.electronAPI.testLLMConnection(settings.llmUrl);
      setIsConnected(result.status);
      setConnectionError(result.error || null);
      setSaveStatus({ 
        type: result.status ? 'success' : 'error', 
        message: result.status ? 'Connection successful!' : (result.error || 'Connection failed. Please check your settings.')
      });
    } catch (error) {
      setIsConnected(false);
      setConnectionError('Failed to test connection');
      setSaveStatus({ type: 'error', message: 'Connection test failed. Please check your settings.' });
    }
  };

  const handleEditProject = (project) => {
    const defaultPrompt = `You are an expert in analyzing human-robot interaction through the lens of the MOFASA (Modified Factors of Social Appropriateness) framework.

Your task is to summarize a participant's interaction experience by explicitly identifying:
1. Who they are (Identity),
2. What decision or judgment they made,
3. What situation they were in,
4. How their identity shaped their definition of the situation,
5. And what social expectations or rules emerged.

Context:
- The study investigates how humans interact with robots in social or task-based scenarios.
- The participant ({participant.name}) has provided structured responses across various stages of the interaction.
- These responses reveal their social reasoning, expectations, and interpretations of the robot's behavior.

Participant Responses:
{allAnswers.join('\n\n')}

Instructions for writing the summary:
- **Start by describing the participant's identity** (e.g., role, experience, self-view) as revealed through their responses.
- **Then describe their key decisions or judgments** made during the interaction (e.g., whether to comply, cooperate, trust, withdraw, etc.).
- **Next, explain the situation they were responding to**, including any relevant environmental, social, or task-specific details.
- **Describe how their identity influenced their definition of the situation** (i.e., how they interpreted what the robot was doing or what the situation required).
- **Conclude by highlighting any implicit or explicit social rules, norms, or expectations** that were applied or formed based on this interaction.

Guidelines:
- Be precise, grounded in the participant's actual responses, and avoid speculation.
- Use professional, accessible language.
- The final output should be one clear and coherent paragraph that reflects the participant's social interpretation and behavioral reasoning.`;

    setEditingProject(project);
    setEditPrompt(project.summaryPrompt || defaultPrompt);
  };

  const handleSaveProjectPrompt = async () => {
    if (!editingProject) return;

    try {
      const projectIndex = projects.findIndex(p => p === editingProject);
      if (projectIndex === -1) {
        throw new Error('Project not found');
      }

      const updatedProjects = [...projects];
      updatedProjects[projectIndex] = {
        ...updatedProjects[projectIndex],
        summaryPrompt: editPrompt
      };
      
      await window.electronAPI.saveProjects(updatedProjects);
      setEditingProject(null);
      setEditPrompt('');
      setSaveStatus({ type: 'success', message: 'Project prompt updated successfully!' });
    } catch (error) {
      console.error('Failed to update project prompt:', error);
      setSaveStatus({ type: 'error', message: 'Failed to update project prompt. Please try again.' });
    }
  };

  const renderProjectsSettings = () => (
    <div>
      <h2>Projects</h2>
      <div style={{ marginTop: 20 }}>
        {projects.length === 0 ? (
          <p style={{ color: '#666' }}>No projects available.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {projects.map((project, index) => (
              <div
                key={index}
                style={{
                  padding: 16,
                  border: '1px solid #ddd',
                  borderRadius: 8,
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <h3 style={{ margin: '0 0 8px 0' }}>{project.name}</h3>
                    <p style={{ margin: '0 0 8px 0', color: '#666' }}>
                      {project.description || 'No description available'}
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <span style={{ 
                        padding: '4px 8px', 
                        backgroundColor: '#e8f5e9', 
                        color: '#2e7d32',
                        borderRadius: 4,
                        fontSize: '0.9em'
                      }}>
                        {project.participants?.length || 0} Participants
                      </span>
                      {/* <span style={{ 
                        padding: '4px 8px', 
                        backgroundColor: '#e3f2fd', 
                        color: '#1565c0',
                        borderRadius: 4,
                        fontSize: '0.9em'
                      }}>
                        {project.sections?.length || 0} Sections
                      </span> */}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => setSelectedProjectForQuestionnaire(project)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#f39c12',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      Questionnaire
                    </button>
                    <button
                      onClick={() => handleEditProject(project)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3498db',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '0.9em'
                      }}
                    >
                      Edit Prompt
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Project Prompt Edit Modal */}
      {editingProject && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '800px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Edit Project Prompt</h3>
            <p style={{ marginBottom: '16px', color: '#666' }}>
              This prompt will be used to generate summaries for participants in this project.
            </p>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              style={{
                width: '100%',
                minHeight: '300px',
                padding: '12px',
                borderRadius: 4,
                border: '1px solid #ccc',
                fontSize: '1em',
                fontFamily: 'Lexend, sans-serif',
                marginBottom: '16px',
                resize: 'vertical'
              }}
              placeholder="Enter the prompt template for generating participant summaries..."
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  setEditingProject(null);
                  setEditPrompt('');
                }}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProjectPrompt}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2ecc71',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Project Questionnaire Modal */}
      {selectedProjectForQuestionnaire && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            width: '1000px',
            maxWidth: '95%',
            maxHeight: '95vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            <div style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'white',
              padding: '20px 24px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              zIndex: 1
            }}>
              <h3 style={{ margin: 0, color: '#2c3e50' }}>
                Questionnaire Settings - {selectedProjectForQuestionnaire.name}
              </h3>
              <button
                onClick={() => setSelectedProjectForQuestionnaire(null)}
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: '0.9em'
                }}
              >
                Close
              </button>
            </div>
            <div style={{ padding: '0 24px 24px 24px' }}>
              <ProjectQuestionnaireSettings 
                projectId={selectedProjectForQuestionnaire.id} 
                projectName={selectedProjectForQuestionnaire.name} 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTechSettings = () => (
    <div>
      <h2>Technical Settings</h2>
      <div style={{ marginTop: 20 }}>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>LLM URL</label>
          <input
            type="text"
            value={settings.llmUrl}
            onChange={(e) => setSettings({ ...settings, llmUrl: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontSize: '1em',
              fontFamily: 'Lexend, sans-serif'
            }}
            placeholder="Enter LLM URL (e.g., http://127.0.0.1:11434)"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Model Name</label>
          <input
            type="text"
            value={settings.modelName}
            onChange={(e) => setSettings({ ...settings, modelName: e.target.value })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontSize: '1em',
              fontFamily: 'Lexend, sans-serif'
            }}
            placeholder="Enter model name (e.g., deepseek-coder)"
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8 }}>Max Tokens</label>
          <input
            type="number"
            value={settings.maxTokens}
            onChange={(e) => setSettings({ ...settings, maxTokens: parseInt(e.target.value) || 2048 })}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 4,
              border: '1px solid #ddd',
              fontSize: '1em',
              fontFamily: 'Lexend, sans-serif'
            }}
            placeholder="Enter max tokens (e.g., 2048)"
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: isSaving ? 'not-allowed' : 'pointer',
              opacity: isSaving ? 0.7 : 1,
              fontSize: '1em',
              fontFamily: 'Lexend, sans-serif'
            }}
          >
            {isSaving ? 'Saving...' : 'Save Settings'}
          </button>

          <button
            onClick={handleTestConnection}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2ecc71',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '1em',
              fontFamily: 'Lexend, sans-serif'
            }}
          >
            Test Connection
          </button>
        </div>

        {saveStatus && (
          <div
            style={{
              marginTop: 16,
              padding: '12px',
              borderRadius: 4,
              backgroundColor: saveStatus.type === 'success' ? '#d4edda' : '#f8d7da',
              color: saveStatus.type === 'success' ? '#155724' : '#721c24',
              fontFamily: 'Lexend, sans-serif'
            }}
          >
            {saveStatus.message}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div className="left-panel" style={{ width: '30%', padding: '20px', borderRight: '1px solid #ddd' }}>
        <h2>Settings</h2>
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setActiveTab('projects')}
            style={{
              width: '100%',
              padding: '12px',
              marginBottom: 8,
              background: activeTab === 'projects' ? '#3498db' : '#f8f9fa',
              color: activeTab === 'projects' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1em'
            }}
          >
            Projects Settings
          </button>
          <button
            onClick={() => setActiveTab('tech')}
            style={{
              width: '100%',
              padding: '12px',
              background: activeTab === 'tech' ? '#3498db' : '#f8f9fa',
              color: activeTab === 'tech' ? '#fff' : '#333',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1em'
            }}
          >
            Technical Settings
          </button>
        </div>
      </div>
      <div className="right-panel" style={{ width: '70%', padding: '20px' }}>
        {activeTab === 'projects' ? renderProjectsSettings() : renderTechSettings()}
      </div>
    </div>
  );
};

export default Settings; 