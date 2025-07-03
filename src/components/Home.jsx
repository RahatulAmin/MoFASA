import React, { useState } from 'react';

const Home = () => {
  const [selectedSection, setSelectedSection] = useState('MoFASA-Tools-tutorial');

  const renderRightContent = () => {
    switch (selectedSection) {
      case 'LLM-configuration':
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
                  You'll see a list of installed models. Copy the exact name of the model (e.g., <code>deepseek-r1:8b</code>).
                  <br />
                  Now go to the <strong>Settings</strong> page in MoFASA and paste that model name into the LLM field.
                  <br />
                  Click "Test Connection" to make sure everything is working.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>Step 4: Create Your Project and Start Analyzing</h3>
                <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                  You're all set! Head to MoFASA and create a new project. You can add participants and get started with your analysis right away.
                  Go to your project dashboard, select participants, and start filling in your analysis sections.
                  <br />
                  Use the AI features to generate insights, summaries, or reports. You can also download your analysis as a PDF.
                </p>
              </div>
            </div>
          </div>
        );
        
        case 'MoFASA-Tools-tutorial':
        return (
          <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto', lineHeight: '1.7', color: '#2c3e50' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>📘 Welcome to the MoFASA Tools Tutorial</h2>

            <p style={{ marginBottom: '20px', color: '#7f8c8d' }}>
              This short guide will walk you through how to use the MoFASA Tools desktop app to set up a project, input participant data, and analyze your findings.
              You don't need to know anything technical — just follow along and take your time.
            </p>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>1. Starting a New Project</h3>
            <p>
              To begin, head over to the "Projects" tab from the left sidebar and click on the <strong>Add Project</strong> button.
              You'll be asked to give your project a name and a short description of the situation you're analyzing.
              If your scenario includes multiple distinct parts (like different tasks or environments), you can add additional scopes — each one will represent a separate focus area within your project.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/1.png')} alt="Add Project Button" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              Then, let the app know how many participants are involved, what type of robot you're working with, and the nature of your study. When you're ready, click <strong>Next</strong>.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/2.png')} alt="Project Details Form" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              Now comes the question selection step. You'll be shown a list of MoFASA questions — you need to select at least one, but we suggest choosing as many as you think are relevant. The more thoughtful your selection, the deeper your analysis can be later on.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/3.png')} alt="Question Selection" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>2. Viewing Your Project</h3>
            <p>
              Once your project is created, it will show up as a card on the Projects page. Each card gives you a quick overview of the project, along with buttons to export, edit, or delete it if needed.
              Clicking on the card will open the detailed project page where the real work begins.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/4.png')} alt="Project Cards" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>3. Adding Participant Observations</h3>
            <p>
              On the project details page, you'll see all your defined scopes and participants listed. To start adding observations, just click on a scope (like "Scope 1"), then select a participant (like "P1").
              This will take you to the participant entry page, where you can answer MoFASA questions specific to that scope and person.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/5.png')} alt="Project Details Page" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              The questions are grouped into three sections: <strong>Situation</strong>, <strong>Identity</strong>, and <strong>Definition of the Situation</strong>.
              As you write your answers, they'll appear in the framework box on the right, helping you keep everything organized visually.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/6.png')} alt="Participant Page with Framework" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              After answering the situation questions, you'll define the participant's decision — this is the rule or behavior you observed. You can either select an existing rule from the list or create a new one. Once a rule is added, it becomes available for all participants.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/7.png')} alt="Rule Selection" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              After that, continue with the Identity section, which helps you describe who the participant is in this scenario. These answers will make it easier to complete the final part: how this person interprets the situation (the "definition of the situation").
            </p>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>4. Summarizing What Happened</h3>
            <p>
              Once you've completed all the questions, you have two options. You can write a short summary of the participant's experience based on your answers, or you can click <strong>"Generate Summary using LLM"</strong> to let the app help you write one using a large language model.
              If you're using this option for the first time, make sure to follow the LLM setup instructions in the Settings menu. You can also customize the LLM prompt there to better fit your project needs.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/8.png')} alt="Summary Generation" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              When you're done with one participant, you can repeat the same process for others and for different scopes if you have them.
            </p>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>5. Exploring Your Data</h3>
            <p>
              Once all your observations are entered, return to the project details page. You'll see three useful tools there:
            </p>
            <ul style={{ paddingLeft: '20px', marginBottom: '16px' }}>
              <li><strong>Personae Mapping</strong> – View participants' summaries and framework responses in a single place.</li>
              <li><strong>Behavioral Diversity</strong> – Explore what kinds of rules were generated and sort them by age, gender, or other traits to look for patterns.</li>
              <li><strong>Situation Design</strong> – Focus on the rules you want to change. Sort participants by desirable or undesirable outcomes, and brainstorm changes to robot behavior or the environment to help shift future outcomes.</li>
            </ul>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/9.png')} alt="Personae Mapping View" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/10.png')} alt="Behavioral Diversity View" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/11.png')} alt="Situation Design View" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>6. Exporting Your Report</h3>
            <p>
              When your analysis is complete, you can click <strong>"Download as PDF"</strong> to generate a complete report of the project. This can be helpful for sharing your findings with your team or saving for future reference.
            </p>

            <p style={{ marginTop: '40px', fontStyle: 'italic', color: '#7f8c8d' }}>
              That's it! Take your time, experiment, and don't worry about making everything perfect right away. MoFASA Tools is here to support thoughtful, reflective research — and you're already doing great by being here.
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
            onClick={() => setSelectedSection('MoFASA-Tools-tutorial')}
            className={`left-panel-button ${selectedSection === 'MoFASA-Tools-tutorial' ? 'selected' : ''}`}
          >
            Getting Started with MoFASA
          </button>

          <button
            onClick={() => setSelectedSection('LLM-configuration')}
            className={`left-panel-button ${selectedSection === 'LLM-configuration' ? 'selected' : ''}`}
          >
            LLM Configuration
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