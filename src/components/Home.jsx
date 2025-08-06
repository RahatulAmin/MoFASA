import React, { useState } from 'react';

const Home = () => {
  const [selectedSection, setSelectedSection] = useState('');

  const renderRightContent = () => {
    switch (selectedSection) {
      case 'LLM-configuration':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>LLM Configuration for Optional Summary Generation</h2>
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
                  <code style={{ fontFamily: 'monospace', color: '#3498db', fontSize: '1.2em', fontWeight: 'bold' }}>ollama run llama3:8b</code>
                  <br />
                  This will download and launch the <strong>Llama3:8B</strong> AI model on your machine.
                </p>
              </div>

              <div>
                <h3 style={{ color: '#34495e', marginBottom: '10px' }}>Step 3: Link the Model in MoFASA</h3>
                <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                  Next, open a web browser and go to: <br />
                  <a href="http://127.0.0.1:11434/api/tags" target="_blank" rel="noopener noreferrer" style={{ color: '#3498db' }}>http://127.0.0.1:11434/api/tags</a>
                  <br />
                  You'll see a list of installed models. Copy the exact name of the model (e.g., <code>llama3:8b</code>).
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
              <img src={require('../images/1.png')} alt="Add Project First Page" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              Then, let the app know how many participants are involved, what type of robot you're working with, and the nature of your study. When you're ready, click <strong>Next</strong>.
            </p>
            <br />
            <p>
              Now comes the question selection step. You'll be shown a list of MoFASA questions — you need to select at least one for each section, but we suggest choosing as many as you think are relevant. The more thoughtful your selection, the deeper your analysis can be later on.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/2.png')} alt="Add Project Second Page - Question Selection" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>2. Viewing Your Project</h3>
            <p>
              Once your project is created, it will show up as a card on the Projects page. Each card gives you a quick overview of the project, along with buttons to export, edit, or delete it if needed.
            </p>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/12.png')} alt="Project Cards" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            <p>
              Clicking on the card will open the detailed project page where the real work begins.
            </p>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/3.png')} alt="Project Page " style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
           

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>3. Adding Participant Observations</h3>
            <p>
              On the project details page, you'll see all your defined scopes and participants listed. To start adding observations, just click on a scope (like "Scope 1"), then select a participant (like "P1").
              This will take you to the participant entry page, where you can answer MoFASA questions specific to that scope and person. The associated factors will be displayed below the questions.
              You can click on the factors to see more information about them.
            </p>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/4.png')} alt="Participant Q/A Page" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>          
            
            <p>
              The questions are grouped into three sections: <strong>Situation</strong>, <strong>Identity</strong>, and <strong>Definition of the Situation</strong>.
              As you write your answers, they'll appear in the framework box on the right, helping you keep everything organized visually.
            </p>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/5.png')} alt="Right Panel" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            
            
            <p>
              After answering the situation questions, you'll define the participant's decision — this is the rule or behavior you observed. You can either select an existing rule from the list or create a new one. Once a rule is added, it becomes available for all participants.
            </p>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/6.png')} alt="Rule Selection" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <p>
              After that, continue with the Identity section, which helps you describe who the participant is in this scenario. 
              These answers will make it easier to complete the final part: how this person interprets the situation (the "definition of the situation").
            </p>


            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>4. Summarizing What Happened (Optional)</h3>
            <p>
              Once you've completed all the questions, you can either write a short summary of the participant's experience based on your answers, or you can click <strong>"Generate Summary using LLM"</strong> 
              to let the app help you write one using a large language model.
              If you're using this option for the first time, make sure to follow the LLM setup instructions in the Settings menu. 
              You can also customize the LLM prompt there to better fit your project needs.
            </p>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/7.png')} alt="Summary" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            
      
            
            <p>
              When you're done with one participant, you can repeat the same process for others and for different scopes if you have them.
            </p>

            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>5. Exploring Your Data</h3>
            <p>
              Once all your observations are entered, return to the project details page. You'll see three useful tools there:
            </p>
        
            <strong>Personae Mapping</strong> – View participants' summaries and framework responses in a single place.
            <br />
            <strong>Behavioral Diversity</strong> – Explore what kinds of rules were generated and sort them by age, gender, or other traits to look for patterns.
            <br />
                          

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/8.png')} alt="Behavioral Diversity View 1" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/9.png')} alt="Behavioral Diversity View 2 - Stats" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>

            <strong>Situation Design</strong> – Focus on the rules you want to change. Sort participants by desirable or undesirable outcomes, and brainstorm changes to robot behavior or the environment to help shift future outcomes.
        
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/10.png')} alt="Situation Design View 1" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/11.png')} alt="Situation Design View 2" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>


            <h3 style={{ marginTop: '32px', fontSize: '20px' }}>6. Exporting Your Report</h3>
            <p>
              When your analysis is complete, you can click <strong>"Download Project Report"</strong> to generate a complete report of the project. This can be helpful for sharing your findings with your team or saving for future reference.
            </p>

            <div style={{ 
              marginTop: '32px', 
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: 'white',
           
            }}>
              <p style={{ color: '#2c3e50', lineHeight: '1.6', marginBottom: '16px' }}>
                <strong>Complete a practice project to understand MoFASA Tools more deeply.</strong>
              </p>
              
              <button
                onClick={() => {
                  setSelectedSection('practice-mofasa');
                  // Scroll to top of the right panel after a short delay to ensure content is rendered
                  setTimeout(() => {
                    const rightPanel = document.querySelector('.right-panel');
                    if (rightPanel) {
                      rightPanel.scrollTop = 0;
                    }
                  });
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1em',
                  transition: 'all 0.2s ease',
                  marginLeft: '10px', 
                  marginRight: '10px',
                  
                }}
                
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#2980b9';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#3498db';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Practice MoFASA Tools
              </button>
            </div>
          </div>
        );



             case 'practice-mofasa':
          return (
            <div style={{ padding: '24px' }}>
             <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>Learn how to use MoFASA Tools by analyzing a practice project</h2>
             <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '24px' }}>
               Click the button below to download the MoFASA practice study document. 
               In this document you will find a simple HRI project and 12 participant interview data. 
               You can follow the steps in the tutorial to analyze this project.
             </p>
             <div style={{ 
               background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
               padding: '24px', 
               borderRadius: '12px', 
               boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
               textAlign: 'center',
               marginBottom: '20px'
             }}>
               <h3 style={{ color: 'white', marginBottom: '16px', fontSize: '18px' }}>MoFASA Practice Study</h3>
               <p style={{ color: 'rgba(255,255,255,0.9)', marginBottom: '20px', fontSize: '14px' }}>
                 Contains: 1 HRI project with 12 participant interviews
               </p>
               
               <button 
                 onClick={async () => {
                   try {
                     const result = await window.electronAPI.downloadFile('MoFASA_practice_study.pdf');
                     if (result.success) {
                       console.log('File downloaded successfully to:', result.filePath);
                     } else if (result.canceled) {
                       console.log('Download canceled by user');
                     } else {
                       console.error('Download failed:', result.error);
                       alert('Failed to download file. Please try again.');
                     }
                   } catch (error) {
                     console.error('Download error:', error);
                     alert('Failed to download file. Please try again.');
                   }
                 }}
                 style={{
                   background: 'white',
                   color: '#667eea',
                   border: 'none',
                   padding: '12px 24px',
                   borderRadius: '8px',
                   fontSize: '16px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseOver={(e) => {
                   e.target.style.transform = 'translateY(-2px)';
                   e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                 }}
                 onMouseOut={(e) => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                 }}
               >
                 📄 Download MoFASA Practice Study PDF Document
               </button>
               <button 
                 onClick={async () => {
                   try {
                     const result = await window.electronAPI.downloadFile('MoFASA_practice_study_data.json');
                     if (result.success) {
                       console.log('File downloaded successfully to:', result.filePath);
                     } else if (result.canceled) {
                       console.log('Download canceled by user');
                     } else {
                       console.error('Download failed:', result.error);
                       alert('Failed to download file. Please try again.');
                     }
                   } catch (error) {
                     console.error('Download error:', error);
                     alert('Failed to download file. Please try again.');
                   }
                 }}
                 style={{
                   background: 'white',
                   color: '#667eea',
                   marginTop: '20px',
                   border: 'none',
                   padding: '12px 24px',
                   borderRadius: '8px',
                   fontSize: '16px',
                   fontWeight: '600',
                   cursor: 'pointer',
                   boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                   transition: 'all 0.3s ease'
                 }}
                 onMouseOver={(e) => {
                   e.target.style.transform = 'translateY(-2px)';
                   e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                 }}
                 onMouseOut={(e) => {
                   e.target.style.transform = 'translateY(0)';
                   e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
                 }}
               >
                 📄 Download MoFASA Practice Study Data File (JSON) 
               </button>
             </div>
             <div style={{ 
               background: '#f8f9fa', 
               padding: '20px', 
               borderRadius: '8px', 
               border: '1px solid #e9ecef',
               marginTop: '20px'
             }}>
               <h4 style={{ color: '#495057', marginBottom: '12px', fontSize: '16px' }}>How to use this practice study:</h4>
               <ol style={{ color: '#6c757d', lineHeight: '1.6', paddingLeft: '20px' }}>
                 <li>Download the MoFASA practice study document to view the project and the participant interview data.</li>
                 <li>Download the MoFASA practice study data file (JSON) to import the data into MoFASA Tools.</li>
                 <li>Head to the Project tab and import the JSON file.</li>
                 <li>Click the Light Bulb on the Bottom Right corner of the screen to follow the tutorial steps and analyze the practice data.</li> 
               </ol>
             </div>
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

      case 'what-is-mofasa':
        return (
          <div style={{ padding: '24px' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px' }}>🧠 What is MoFASA?</h2>
            
            <div style={{ color: '#2c3e50', lineHeight: '1.6' }}>
            <p><strong>Imagine this:</strong></p>
              <p>A delivery robot rolls into a crowded university café during the morning rush. Three students encounter it:</p>

              <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <img src={require('../images/home_image_2.jpg')} alt="robot entering a busy university café" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              </div>

              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Marcus</strong> smiles and waves and says "Hi, Robot!"</li>
                <li><strong>Emilia</strong> frowns, mutters “this is creepy”, and kicks it on her way out.</li>
                <li><strong>Tony</strong> glances briefly, then returns to scrolling his phone.</li>
              </ul>
              <br />
              <p>Same robot. Same place. Completely different behaviors.</p>
              <br />
              <p><strong>So what's going on here?</strong></p>
              <br />
              <p>Why did Marcus engage positively, while Emilia reacted with hostility?</p>
              <br />
              <p>And more importantly - could we have designed the situation differently to prevent Emilia’s response?</p>             
              <br />
              <p>That is exactly what the MoFASA Framework helps you explore. It is a tool for HRI researchers and designers to break down how a person's identity, and their 
                interpretation of the situation, influence how they behave toward robots. MoFASA goes further by showing how you can shape the situation differently to reduce 
                undesirable interactions and encourage more thoughtful, safe, and meaningful human-robot encounters.
                </p>
              <br />
              <p>Let's dive deeper into the MoFASA Framework and see how it can help you understand and improve human-robot interactions.</p>
              <br />
              
              
              
              
              <h3 style={{ marginTop: '24px' }}>🤖 What is the MoFASA Framework?</h3>
              <p><strong>MoFASA</strong>, short for <strong>Modified Factors of Social Appropriateness</strong>, is a human-centered framework designed for HRI practitioners who 
              want to understand the <em>why</em> behind human behavior in human-robot interaction. MoFASA helps you analyze the <em>social and contextual logic</em> that drives 
              people's reactions. It is built on and extends two existing models from social science: <strong>FASA</strong> (Five Factors of Social Appropriateness) developed by 
              Wullenkord et. al. and <strong>LOA</strong> (Logic of Appropriateness) by Weber et. al. MoFASA translates these theoretical models into a streamlined, HRI-focused 
              framework for analyzing the diversity of human behaviours toward robots.</p>
              <br />
              <p>At the heart of MoFASA are three key analytical lenses:</p>
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Situation</strong> - External context (location, timing, setting, etc.)</li>
                <li><strong>Identity</strong> - Internal context (a person's background, role, social motives, etc.)</li>
                <li><strong>Definition of the Situation</strong> - Interpretation of the moment (the person's own framing of the situation, uncertainty, consequences, etc.)</li>
              </ul>
              <br />

              <p>Below diagram illustrates the MoFASA Framework, by mapping out Emma's behavior. The researchers collected a bit more information about Emma by doing a post-interaction interview with her.</p>
               
              <div style={{ textAlign: 'center', margin: '20px 0' }}> 
                <img src={require('../images/Emma.jpg')} alt="MoFASA Framework in use" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
              </div>
             
              <div style={{ margin: '20px 0' }}>  
                
                This illustration shows the MoFASA framework in action. The connections show you how Emma's identity and interpretation of the situation influenced her behavior.<br />
                <br />
                

                
                 
                  <h4 style={{ 
                    marginBottom: '12px',
                    color: '#2c3e50',
                    fontFamily: 'Lexend, sans-serif'
                  }}>Framework Line Connections:</h4>
                  <div style={{ 
                    display: 'grid',
                    gap: '12px',
                    fontSize: '0.95em',
                    color: '#34495e'
                  }}>
                    <p>The MoFASA framework is built around a question - “What would a person like me (Identity) do (Rule Selection) in a situation like this (Definition of the Situation)?” 
                  These different sections are represented using the framework view connections:</p>
                 
                    
                    <div><strong>Connection A:</strong> The situation is perceived by the individual's identity. Emma’s identity shaped how she saw the situation. 
                    As a 1st-year introverted student with negative views of robots (influenced by movies and social media), she didn’t just see a delivery robot - 
                    she saw a symbol of technological intrusion and job loss.</div>
                    <div><strong>Connection B + C:</strong> Connection B and C work together to define the situation. Her identity also shaped how she made sense of the situation. 
                    She framed the robot’s presence not as helpful or harmless, but as unnecessary and even threatening. To Emma, the robot didn’t belong in her space, and it reminded 
                    her of automation’s negative impact.</div>
                    
                    <div><strong>Connection D + E:</strong> Connection D and E work together to determine which rules or norms individuals choose to follow. Based on that framing, Emma 
                    decided which actions were even worth considering. She didn’t think of saying hi or ignoring it as reasonable. Her interpretation led her to feel justified in kicking the
                    robot - she believed it couldn’t respond and wouldn’t matter.
                    </div>
                    
                    <div><strong>Connection F:</strong> The selected rules guide the final decision or course of action.  Emma acted on that decision. In a moment of stress, with the robot 
                    blocking her path, she kicked it — expressing frustration both at the situation and what the robot represented to her.</div>
                  </div>
                
              </div>

              <p>These connections show why Emma reacted with aggression, while someone like Tony might have ignored the robot, or Marcus might have waved at it. 
                MoFASA helps surface these different perspectives by breaking down how identity and perception shape behavior.</p>
              <br />
              <p>MoFASA goes further by offering three practical affordances to guide design and reflection:</p>
              <br />
              <ul style={{ paddingLeft: '20px' }}>
                <li><strong>Personae Mapping</strong> - Understand how someone like Emma sees herself in the interaction. She views herself as a student under pressure, navigating a space that should be hers — and the robot feels like an intruder.</li>
                <li><strong>Behavioral Diversity</strong> - Emma’s reaction is one of many. MoFASA allows designers to map a range of behaviors that could emerge in this same café scenario: curiosity, indifference, hostility, playfulness — and consider how design might influence those paths.</li>
                <li><strong>Situation Design</strong> - This is where designers can intervene. Emma's story suggests several touchpoints for situation design:</li>
              </ul>
              <br />
              <img src={require('../images/Emma2.png')} alt="MoFASA Framework in use" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
            </div>
            <br/>       
            <p>By analyzing Emma's case through the MoFASA lens, you can start to see how the framework helps uncover the reasons behind different human-robot interactions - and how to potentially improve them.</p>
            <br />
            <p> You now have an even more clear idea about what happened at that moment with Emma, what factors influenced her behavior, and how you can potentially avoid such undesirable interactions. 
              While Emma's case provides a single perspective, collecting data from more individuals allows us to identify patterns in undesirable behavior. With these patterns, we can begin to 
              explore solutions at a broader, more systemic level.</p>
            <br />
            <p>Now that you have a basic understanding of the MoFASA Framework, let's explore MoFASA Tools and see how it can help you analyze your own Human-Robot Interaction data. </p>            
            <br />
            
      
            <div style={{ 
              marginTop: '32px', 
              textAlign: 'center',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              borderRadius: '8px',
              padding: '16px',
              backgroundColor: 'white',
           
            }}>
              <p style={{ color: '#2c3e50', lineHeight: '1.6', marginBottom: '16px' }}>
                <strong>Get started by exploring our interactive tutorial by importing a practice project.</strong>
              </p>
              <button
                onClick={() => {
                  setSelectedSection('practice-mofasa');
                  // Scroll to top of the right panel after a short delay to ensure content is rendered
                  setTimeout(() => {
                    const rightPanel = document.querySelector('.right-panel');
                    if (rightPanel) {
                      rightPanel.scrollTop = 0;
                    }
                  });
                }}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1em',
                  transition: 'all 0.2s ease',
                  
                  
                }}
                
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#2980b9';
                  e.target.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#3498db';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Practice MoFASA Tools
              </button>

              
            </div>
          </div>
        );
        
      case 'about-us':
        return (
          <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <h2 style={{ color: '#2c3e50', marginBottom: '20px', textAlign: 'center' }}>About Us</h2>
            
            
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid #e9ecef',
              marginBottom: '24px'
            }}>
              <h3 style={{ color: '#34495e', marginBottom: '16px' }}>MoFASA Tools Development</h3>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '16px' }}>
                MoFASA Tools is developed by the RAISE (Responsible Autonomy and Intelligent Systems Ethics) Lab at McGill University. 
                Our research focuses on understanding and improving human-robot interactions (HRI) in real-world settings.
              </p>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                The MoFASA framework and this desktop application are designed to help HRI practitioners 
                systematically analyze social behavior in HRI studies, making it easier to 
                identify patterns and generate insights that can inform HRI design and deployment.
              </p>
            </div>
            
            <div style={{ 
              background: '#f8f9fa', 
              padding: '24px', 
              borderRadius: '12px', 
              border: '1px solid #e9ecef'
            }}>
              <h3 style={{ color: '#34495e', marginBottom: '16px' }}>Contact Information</h3>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '8px' }}>
                <strong>RAISE Lab</strong><br />
                McGill University<br />
                Montreal, Quebec, Canada
              </p>
              <p style={{ color: '#7f8c8d', lineHeight: '1.6' }}>
                For more information about our research and the MoFASA framework, 
                please visit our lab website: 
                <a href="https://www.raiselab.ca/" target="_blank" style={{ color: '#3498db', textDecoration: 'underline' }}> https://www.raiselab.ca/</a>
              </p>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center', 
              gap: '40px', 
              marginTop: '30px',
              marginBottom: '30px',
              flexWrap: 'wrap'
            }}>
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={require('../images/raise_logo.png')} 
                  alt="RAISE Lab Logo" 
                  style={{ 
                    maxWidth: '200px', 
                    height: 'auto',
                    marginBottom: '10px'
                  }} 
                />
                
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <img 
                  src={require('../images/mcgill_logo.png')} 
                  alt="McGill University Logo" 
                  style={{ 
                    maxWidth: '200px', 
                    height: 'auto',
                    marginBottom: '10px'
                  }} 
                />
                
              </div>
            </div>
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
          <p style={{ color: '#2c3e50', lineHeight: '1.6', marginBottom: '16px' }}>
            <strong>MoFASA Tools</strong> is a desktop application designed to help Human-Robot Interaction (HRI) practitioners make sense of social behavior in HRI studies. 
            Grounded in the <strong>MoFASA (Modified Factors of Social Appropriateness)</strong> framework, 
            the tool guides you through the structured analysis of participant data in real-world or experimental settings.
          </p>
          
          {/* <p style={{ color: '#7f8c8d', lineHeight: '1.6', marginBottom: '16px' }}>
            With MoFASA Tools, you can:
          </p>
          
          <ul style={{ color: '#7f8c8d', lineHeight: '1.6', marginLeft: '20px', marginBottom: '16px' }}>
            <li>Create and manage HRI study projects with multiple scopes.</li>
            <li>Add participants and document their observations across different situations. </li>
            <li>Organize responses using the MoFASA framework: Situation, Identity, and Definition of the Situation.</li>
            <li>Identify recurring behavioral patterns and decision-making rules.</li>
            <li>Generate summaries manually or with the help of a built-in LLM integration.</li>
          </ul> */}
          
          <p style={{ color: '#2c3e50', lineHeight: '1.6' }}>
            To get started, click the <strong>"What is MoFASA?"</strong> button below to know more about the framework. Then click the <strong>"Getting Started with MoFASA"</strong> button to start analyzing your first project.
          </p>
        </div>

        <div className="left-panel-container" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
          
          
          <button
            onClick={() => setSelectedSection(selectedSection === 'what-is-mofasa' ? '' : 'what-is-mofasa')}
            className={`left-panel-button ${selectedSection === 'what-is-mofasa' ? 'selected' : ''}`}
          >
            What is MoFASA?
          </button>

          {/* <button
            onClick={() => setSelectedSection(selectedSection === 'MoFASA-Tools-tutorial' ? '' : 'MoFASA-Tools-tutorial')}
            className={`left-panel-button ${selectedSection === 'MoFASA-Tools-tutorial' ? 'selected' : ''}`}
          >
            Getting Started with MoFASA
          </button> */}

          <button
            onClick={() => setSelectedSection(selectedSection === 'practice-mofasa' ? '' : 'practice-mofasa')}
            className={`left-panel-button ${selectedSection === 'practice-mofasa' ? 'selected' : ''}`}
          >
            Practice MoFASA Tools
          </button>

          

          <button
            onClick={() => setSelectedSection(selectedSection === 'research-paper' ? '' : 'research-paper')}
            className={`left-panel-button ${selectedSection === 'research-paper' ? 'selected' : ''}`}
          >
            Research Paper on MoFASA
          </button>

          <button
            onClick={() => setSelectedSection(selectedSection === 'LLM-configuration' ? '' : 'LLM-configuration')}
            className={`left-panel-button ${selectedSection === 'LLM-configuration' ? 'selected' : ''}`}
          >
            LLM Configuration
          </button>
          
          <button
            onClick={() => setSelectedSection(selectedSection === 'about-us' ? '' : 'about-us')}
            className={`left-panel-button ${selectedSection === 'about-us' ? 'selected' : ''}`}
          >
            About Us
          </button>

          
        </div>

        {/* Thin line */}
        <div style={{ borderBottom: '1px solid #dcdde1', margin: '24px 0 16px 0' }}></div>

        {/* Projects Section */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ 
            color: '#2c3e50', 
            marginBottom: '16px', 
            fontSize: '1.2em',
            fontWeight: '600',
            fontFamily: 'Lexend, sans-serif'
          }}>
            Projects
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
            gap: '12px',
            marginBottom: '16px',
          }}>
            <button
              onClick={() => {
                // Navigate to projects page
                window.location.hash = '#/projects';
              }}
              style={{
                padding: '16px 12px',
                backgroundColor: '#f8f9fa',
                color: '#7f8c8d',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '500',
                fontSize: '0.9em',
                fontFamily: 'Lexend, sans-serif',
                transition: 'all 0.2s ease',
                boxShadow: '0 2px 4px rgba(151, 151, 151, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px',
                minHeight: '80px',
                justifyContent: 'center'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#e6e6e6';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 8px rgba(151, 151, 151, 0.3)';
                e.target.style.color = '#000000';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#f8f9fa';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 2px 4px rgba(151, 151, 151, 0.2)';
                e.target.style.color = '#7f8c8d';
              }}
            >
              <span style={{fontSize: '1.5em', margin: 0, padding: 0, pointerEvents: 'none'}}>📁</span>
              Open Project 
            </button>

            
          </div>
        </div>
      </div>
      <div className="right-panel" style={{ flex: 1, borderLeft: '1px solid #e9ecef', overflowY: 'auto' }}>
        {renderRightContent()}
      </div>
    </div>
  );
};

export default Home; 