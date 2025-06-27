import React, { useState } from 'react';

const Home = () => {
  const [selectedSection, setSelectedSection] = useState('getting-started');

  const renderRightContent = () => {
    switch (selectedSection) {
      case 'getting-started':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Getting Started with MoFASA Tools</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>Step 1: Install Ollama</h3>
                <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                  First, download and install <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>Ollama</a> on your computer.
                  <br />
                  After installing it, make sure the Ollama service is running. This service is needed for MoFASA to use AI features.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>Step 2: Install a Language Model</h3>
                <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                  Open your Terminal (on Mac, press ⌘ + Space and search for "Terminal").
                  <br />
                  Then, type the command below to install a recommended model:
                  <br />
                  <code style={{ fontFamily: 'monospace', color: '#3498db', fontSize: '1.2em', fontWeight: 'bold' }}>ollama run deepseek-r1:8b</code>
                  <br />
                  This will download and launch the <strong>DeepSeek R1:8B</strong> AI model on your machine.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>Step 3: Link the Model in MoFASA</h3>
                <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                  Next, open a web browser and go to: <br />
                  <a href="http://127.0.0.1:11434/api/tags" target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>http://127.0.0.1:11434/api/tags</a>
                  <br />
                  You’ll see a list of installed models. Copy the exact name of the model (e.g., <code>deepseek-r1:8b</code>).
                  <br />
                  Now go to the <strong>Settings</strong> page in MoFASA and paste that model name into the LLM field.
                  <br />
                  Click "Test Connection" to make sure everything is working.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>Step 4: Create Your Project and Start Analyzing</h3>
                <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                  You’re all set! Head to MoFASA and create a new project. You can add participants and get started with your analysis right away.
                  Go to your project dashboard, select participants, and start filling in your analysis sections.
                  <br />
                  Use the AI features to generate insights, summaries, or reports. You can also download your analysis as a PDF.
                </p>
              </div>
            </div>
          </div>
        );
        
        case 'MoFASA-Tools tutorial':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>MoFASA-Tools Tutorial</h2>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
              Information about the MoFASA-Tools tutorial will be added soon.
            </p>
          </div>
        );

      case 'quick-tips':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Quick Tips</h2>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
              Information about quick tips will be added soon.
            </p>
          </div>
        );
      case 'research-paper':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Research Paper on MoFASA</h2>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
              Information about the research paper will be added soon.
            </p>
          </div>
        );
      case 'about-us':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>About Us</h2>
            <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
              Information about the team will be added soon.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div className="left-panel" style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
        <div style={{ marginBottom: '30px' }}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>Welcome to MoFASA Tools</h2>
          <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
            <strong>MoFASA Tools</strong> is a platform designed to support the structured analysis of human social behavior in human-robot interaction (HRI) scenarios. 
            Built on the <strong>MOFASA (Modified Factors of Social Appropriateness)</strong> framework, this suite of tools enables you to:
          </p>
          <ul style={{ color: '#7f8c8d', lineHeight: '1.6', marginLeft: '20px' }}>
            <li>Create and manage projects.</li>
            <li>Add and organize participant data.</li>
            <li>Analyze social behaviors using a consistent, research-backed approach.</li>
          </ul>
          <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
            To learn more about the underlying MOFASA framework, click the <strong>"Getting Started with MoFASA"</strong> button and follow the guided steps below. 
            Use the navigation options to explore each section and get the most out of MoFASA Tools.
          </p>
        </div>

        <div className="left-panel-container">
          <button
            onClick={() => setSelectedSection('getting-started')}
            className={`left-panel-button ${selectedSection === 'getting-started' ? 'selected' : ''}`}
          >
            Getting Started with MoFASA
          </button>

          <button
            onClick={() => setSelectedSection('MoFASA Tools tutorial')}
            className={`left-panel-button ${selectedSection === 'MoFASA Tools tutorial' ? 'selected' : ''}`}
          >
            MoFASA Tools Tutorial
          </button>

          <button
            onClick={() => setSelectedSection('quick-tips')}
            className={`left-panel-button ${selectedSection === 'quick-tips' ? 'selected' : ''}`}
          >
            Quick Tips
          </button>

          <button
            onClick={() => setSelectedSection('research-paper')}
            className={`left-panel-button ${selectedSection === 'research-paper' ? 'selected' : ''}`}
          >
            Research Paper on MoFASA
          </button>

          <button
            onClick={() => setSelectedSection('about-us')}
            className={`left-panel-button ${selectedSection === 'about-us' ? 'selected' : ''}`}
          >
            About Us
          </button>
        </div>
      </div>
      <div className="right-panel" style={{ flex: 1, borderLeft: '1px solid #e9ecef', overflowY: 'auto' }}>
        {renderRightContent()}
      </div>
    </div>
  );
};

export default Home; 