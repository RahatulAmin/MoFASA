import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';
import { RULE_SELECTION } from '../constants/labels';

const Tutorial = ({ tutorialType, onComplete, isActive }) => {
  const [tutorialState, setTutorialState] = useState({
    run: false,
    stepIndex: 0,
    steps: []
  });

  // Tutorial steps for different flows
  const tutorialSteps = {
    // Getting started tutorial for new users
    gettingStarted: [
      {
        target: 'body', // Target the body to center the modal
        content: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              color: '#2c3e50',
              fontSize: '1.8em',
              fontWeight: '600'
            }}>
              Welcome to MoFASA! 🎉
            </h3>
            <p style={{ 
              margin: '0 0 20px 0', 
              lineHeight: 1.6,
              fontSize: '1.1em',
              color: '#495057'
            }}>
              This tool helps you conduct personae mapping studies 
              for human-robot interaction research.
            </p>
          </div>
        ),
        disableBeacon: true,
        placement: 'center',
        styles: {
          options: {
            width: 450,
            height: 300
          },
          buttonNext: {
            backgroundColor: '#3498db',
            borderRadius: '4px',
            fontFamily: 'Lexend, sans-serif',
            fontWeight: '500',
            fontSize: '14px',
            padding: '8px 16px',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            marginLeft: '10px',
            display: 'block',
            margin: '0 auto',
            minWidth: '120px',
          },
          buttonBack: {
            backgroundColor: '#95a5a6',
            borderRadius: '4px',
            fontFamily: 'Lexend, sans-serif',
            fontWeight: '500',
            fontSize: '14px',
            padding: '8px 16px',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            transition: 'background-color 0.2s ease',
            marginRight: '8px'
          },
          buttonSkip: {
            color: '#7f8c8d',
            fontFamily: 'Lexend, sans-serif',
            fontWeight: '500',
            fontSize: '14px',
            cursor: 'pointer',
            transition: 'color 0.2s ease'
          }
        }
      }
         ],

     // Projects overview tutorial
     projectsOverview: [
       {
         target: '.projects-title',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Projects Dashboard</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Welcome to your projects dashboard! Here you can manage all your MoFASA research projects.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.add-project-button',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Create New Project</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Click "Add Project" to create a new research study. You'll be able to set up project details, 
               scopes, and configure your questionnaire.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.import-project-button',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Import Projects</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Use "Import Project" to load previously exported project files. This is useful for sharing 
               projects or backing up your work.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.projects-grid',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Project Cards</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Your projects are displayed as cards here. Click on any project card to open it and start 
               working with participants and data analysis.
             </p>
           </div>
         ),
         placement: 'top'
       },
       {
         target: '.project-card',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Project Information</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Each card shows key project details: situation description, robot type, study type, 
               number of scopes, and participant count. You can also export, edit, or delete projects.
             </p>
           </div>
         ),
         placement: 'left'
       },
       {
        target: '.export-project-button',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Export Project</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can export your project to a JSON file. This is useful for sharing projects or 
              backing up your work.
            </p>
          </div>
        ),
        placement: 'bottom'
       },
       {
         target: '.sidebar-project',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Quick Navigation</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Use the sidebar to quickly navigate between projects. Click on any project name to 
               jump directly to that project's details page.
             </p>
           </div>
         ),
         placement: 'right'
       }
     ],

     // Project details tutorial
     projectDetails: [
       {
         target: '.left-panel',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Project Information</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Here you can see your project details and add participants.
             </p>
           </div>
         ),
         placement: 'right'
       },
       {
         target: ' .project-header-card',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Project Details</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Here you can see your project details and add project description.
             </p>
           </div>
         ),
         placement: 'right'
       },
       {
        target: ' .scope-selection-section',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Project Scopes</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can view and select specific project scopes.
            </p>
          </div>
        ),
        placement: 'right'
       },
       {
        target: ' .add-participant-btn',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Add Participants</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can add participants to your project.
            </p>
          </div>
        ),
        placement: 'bottom'
       },
       {
        target: ' .participants-list',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Participants List</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can see the list of participants in your project. 
              You can edit and delete participants here. Clicking on a 
              participant will open the interview questions. 
            </p>
          </div>
        ),
        placement: 'bottom'
       },
       {
        target: ' .personae-mapping-button',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Personae Mapping View</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can see the personae mapping view - which can be viewed from the framework view 
              as well as a summary view.
            </p>
          </div>
        ),
        placement: 'bottom'
       },
       {
        target: ' .behavioral-diversity-button',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Behavioral Diversity View</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can see the behavioral diversity view.
            </p>
          </div>
        ),
        placement: 'bottom'
       },
       {
        target: ' .situation-design-button',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Situation Design View</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can see the situation design view.
            </p>
          </div>
        ),
        placement: 'bottom'
       },
       {
        target: ' .check-report-btn',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Check ProjectReport</h3>
            <p style={{ margin: 0, lineHeight: 1.5 }}>
              Here you can check the report of your project and download a PDF report.
            </p>
          </div>
        ),
        placement: 'bottom'
       }
     ],

             // Participant interview tutorial
    participantInterview: [
      {
        target: 'body',
        content: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              color: '#2c3e50',
              fontSize: '1.6em',
              fontWeight: '600'
            }}>
              Participant Interview Guide 📋
            </h3>
            <p style={{ 
              margin: '0 0 16px 0', 
              lineHeight: 1.6,
              fontSize: '1em',
              color: '#495057'
            }}>
              Follow these steps to complete the participant analysis workflow.
            </p>
            <p style={{ 
              margin: 0, 
              lineHeight: 1.5,
              fontSize: '0.9em',
              color: '#7f8c8d',
              fontStyle: 'italic'
            }}>
              This tutorial will guide you through the complete process.
            </p>
          </div>
        ),
        disableBeacon: true,
        placement: 'center',
        styles: {
          options: { width: 450, height: 320 }
        }
      },
      {
        target: '.left-panel',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Left Panel - Interview Workflow</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              The left panel contains your interview workflow with multiple steps to complete the participant analysis.
            </p>
            <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9em', color: '#7f8c8d' }}>
              Let's go through each step in detail.
            </p>
          </div>
        ),
        placement: 'right'
      },
      {
        target: '.left-panel',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Step 1: Extract Data from Interview</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>📝 Look for the "Extract Data from Interview" section</strong> in the left panel. You may need to toggle it open first.
            </p>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              Paste your interview transcript there and use the LLM feature to automatically extract relevant information.
            </p>
            <div style={{ 
              background: '#fff3cd', 
              border: '1px solid #ffeaa7', 
              borderRadius: '4px', 
              padding: '8px', 
              margin: '8px 0',
              fontSize: '0.9em',
              color: '#856404'
            }}>
              <strong>⚠️ Important:</strong> Do not blindly use the AI extraction. Always double-check the extracted data for accuracy.
            </div>
          </div>
        ),
        placement: 'right'
      },
      {
        target: '.left-panel',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Step 2: Fill Questionnaire</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>📋 Complete the questionnaire</strong> using one of two methods:
            </p>
            <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', lineHeight: 1.4 }}>
              <li><strong>Manual:</strong> Fill out each question based on your interview notes</li>
              <li><strong>AI-Assisted:</strong> Use the AI feature to auto-fill based on the interview text</li>
            </ul>
            <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9em', color: '#7f8c8d' }}>
              You can mix both approaches as needed for different questions.
            </p>
          </div>
        ),
        placement: 'right'
      },
      {
        target: 'factor-button',
        content: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Step 3: Learn About Factors 💡</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>Click on factor names or info buttons</strong> throughout the questionnaire to learn more about what each factor represents in the MoFASA framework.
            </p>
            <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9em', color: '#7f8c8d' }}>
              Understanding these factors helps you provide better answers and analysis. Look for clickable factor names and info icons (ℹ️) next to questions.
            </p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
        styles: {
          options: { width: 450, height: 280 }
        }
      },
      {
        target: '.rule-selection-section',
        content: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Step 4: {RULE_SELECTION} 🎯</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>Select or add interaction rules</strong> for this participant:
            </p>
            <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', lineHeight: 1.4, textAlign: 'left' }}>
              <li><strong>Select existing rules:</strong> Choose from rules already defined for this project scope</li>
              <li><strong>Add new rules:</strong> Create new rules based on participant behavior</li>
            </ul>
            <div style={{ 
              background: '#e3f2fd', 
              border: '1px solid #bbdefb', 
              borderRadius: '4px', 
              padding: '8px', 
              margin: '8px 0',
              fontSize: '0.9em',
              color: '#1565c0'
            }}>
              <strong>ℹ️ Note:</strong> Rules are shared across all participants in the same project scope.
            </div>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
        styles: {
          options: { width: 450, height: 320 }
        }
      },
      {
        target: '.left-panel',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Step 5: Generate Summary 📄</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>Look for the "Generate Summary" section</strong> in the left panel. You may need to scroll down and toggle it open.
            </p>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>Create a participant summary</strong> using one of two methods:
            </p>
            <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', lineHeight: 1.4 }}>
              <li><strong>Manual:</strong> Write your own summary of the participant interaction</li>
              <li><strong>AI-Generated:</strong> Use AI to generate a summary based on the interview and answers</li>
            </ul>
            <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9em', color: '#7f8c8d' }}>
              This summary will be used in reports and analysis views.
            </p>
          </div>
        ),
        placement: 'right'
      },
      {
        target: '.right-panel',
        content: (
          <div>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Right Panel - MoFASA Framework</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>🎨 Visual Framework Representation:</strong> The boxes represent each section of the MoFASA framework.
            </p>
            <ul style={{ margin: '0 0 12px 0', paddingLeft: '20px', lineHeight: 1.4 }}>
              <li><strong>Boxes:</strong> Each section (Situation, Identity, Definition of Situation, etc.)</li>
              <li><strong>Arrows & Lines:</strong> Show connections between framework elements</li>
              <li><strong>Line Text:</strong> Click on text along the lines to get more detailed information</li>
            </ul>
            <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9em', color: '#7f8c8d' }}>
              This visual helps you understand how all elements connect in the research framework.
            </p>
          </div>
        ),
        placement: 'left'
      },
      {
        target: 'body',
        content: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Interactive Framework Elements 🔗</h3>
            <p style={{ margin: '0 0 12px 0', lineHeight: 1.5 }}>
              <strong>Click on line texts and connection labels</strong> in the right panel to learn more about the connections between different framework sections.
            </p>
            <p style={{ margin: 0, lineHeight: 1.5, fontSize: '0.9em', color: '#7f8c8d' }}>
              These interactions provide deeper insights into the theoretical foundations of MoFASA. Look for clickable text elements along the connecting lines in the visual framework.
            </p>
          </div>
        ),
        placement: 'center',
        disableBeacon: true,
        styles: {
          options: { width: 450, height: 300 }
        }
      },
      {
        target: 'body',
        content: (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              color: '#27ae60',
              fontSize: '1.6em',
              fontWeight: '600'
            }}>
              🎉 Tutorial Complete!
            </h3>
            <p style={{ 
              margin: '0 0 16px 0', 
              lineHeight: 1.6,
              fontSize: '1em',
              color: '#495057'
            }}>
              You now know how to complete the full participant analysis workflow.
            </p>
            <div style={{ 
              background: '#d4edda', 
              border: '1px solid #c3e6cb', 
              borderRadius: '4px', 
              padding: '12px', 
              margin: '12px 0',
              fontSize: '0.9em',
              color: '#155724'
            }}>
              <strong>💡 Pro Tip:</strong> Review AI-generated content before finalizing.
            </div>
          </div>
        ),
        disableBeacon: true,
        placement: 'center',
        styles: {
          options: { width: 450, height: 350 }
        }
      }
    ],

     // Personae Mapping tutorial
     personaeMapping: [
       {
         target: '.framework-view-button',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Framework View</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Click this button to view the personae framework. This shows the visual representation 
               of how participant responses connect to create a comprehensive profile.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.summary-view-button',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Summary View</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Switch to summary view to see participant summaries in a clean, readable format. 
               This is useful for reviewing key insights from each participant.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.sort-by-selector',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Sort Participants</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Use this dropdown to sort participants by different criteria like name, age, or gender. 
               This helps you organize and analyze your data more effectively.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.download-pdf-button',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Download as PDF</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Export the current view as a PDF file. This is useful for sharing results, 
               creating reports, or archiving your analysis.
             </p>
           </div>
         ),
         placement: 'bottom'
       }
     ],

     // Behavioral Diversity tutorial
     behavioralDiversity: [
       {
         target: '.sort-by-selector',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Sort Options</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Use this dropdown to sort behavioral data by different criteria. This helps you 
               identify patterns and trends in participant behavior.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.participant-grid',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Participant Grid</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               This grid shows all participants and their behavioral data. Each row represents 
               a participant and their responses across different behavioral dimensions.
             </p>
           </div>
         ),
         placement: 'top'
       },
       {
         target: '.participant-card',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Participant Cards</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Individual participant cards show detailed behavioral information. Click on any card 
               to see more detailed analysis for that participant.
             </p>
           </div>
         ),
         placement: 'left'
       },
       {
         target: '.statistics-panel',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Statistics</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               View statistical summaries of behavioral patterns across all participants. 
               This includes charts and metrics that help identify overall trends.
             </p>
           </div>
         ),
         placement: 'left'
       }
     ],

     // Situation Design tutorial
     situationDesign: [
       {
         target: '.generated-rules',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Generated Rules</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               These are the behavioral rules automatically generated from participant responses. 
               They represent patterns identified in your data analysis.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.label-undesirable-rules',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Label Undesirable Rules</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Mark rules that represent problematic or undesirable behaviors. This helps you 
               identify areas that need improvement in your robot interaction design.
             </p>
           </div>
         ),
         placement: 'bottom'
       },
       {
         target: '.robot-changes-section',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Robot Changes</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Suggest modifications to the robot's behavior, appearance, or capabilities. 
               These changes should address issues identified in your behavioral analysis.
             </p>
           </div>
         ),
         placement: 'left'
       },
       {
         target: '.environmental-changes-section',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Environmental Changes</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Suggest modifications to the physical space, context, or setting of the interaction. 
               These changes can improve the overall user experience and interaction outcomes.
             </p>
           </div>
         ),
         placement: 'left'
       }
     ],

     // Add Project Modal tutorial
     addProjectModal: [
       {
         target: 'body',
         content: (
           <div style={{ textAlign: 'center', padding: '20px' }}>
             <h3 style={{ 
               margin: '0 0 16px 0', 
               color: '#2c3e50',
               fontSize: '1.6em',
               fontWeight: '600'
             }}>
               Create New Project 📋
             </h3>
             <p style={{ 
               margin: '0 0 20px 0', 
               lineHeight: 1.6,
               fontSize: '1.1em',
               color: '#495057'
             }}>
               Let's set up your new research project. You'll need to provide basic project details 
               and configure your questionnaire settings.
             </p>
           </div>
         ),
         disableBeacon: true,
         placement: 'center',
         styles: {
           options: {
             width: 450,
             height: 280
           }
         }
       },
               {
          target: '.project-name-input',
          content: (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Project Name</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Start by entering a descriptive name for your project. This will help you identify 
                your research study later.
              </p>
            </div>
          ),
          placement: 'bottom'
        },
               {
          target: '.scope-input',
          content: (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Project Scopes</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Define the different phases or contexts of your study. Each scope represents a 
                different situation or condition you want to investigate. You can add up to 5 scopes.
              </p>
            </div>
          ),
          placement: 'bottom'
        },
               {
          target: '.participants-input',
          content: (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Number of Participants</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Specify how many participants you plan to recruit for your study. This will create 
                participant slots that you can fill in later.
              </p>
            </div>
          ),
          placement: 'bottom'
        },
               {
          target: '.robot-type-input',
          content: (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Robot Type</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Describe the type of robot you're studying (e.g., "Social robot", "Service robot", 
                "Industrial robot"). This helps categorize your research.
              </p>
            </div>
          ),
          placement: 'bottom'
        },
               {
          target: '.study-type-select',
          content: (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Study Type</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Choose the type of study you're conducting. This helps define the research context 
                and methodology.
              </p>
            </div>
          ),
          placement: 'bottom'
        },
               {
          target: '.next-to-questionnaire-btn',
          content: (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Next Step</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Click "Next" to proceed to questionnaire configuration, where you can customize 
                which questions to include in your study.
              </p>
            </div>
          ),
          placement: 'top'
        }
     ],

     // Questionnaire Configuration tutorial
     questionnaireConfiguration: [
       {
         target: 'body',
         content: (
           <div style={{ textAlign: 'center', padding: '20px' }}>
             <h3 style={{ 
               margin: '0 0 16px 0', 
               color: '#2c3e50',
               fontSize: '1.6em',
               fontWeight: '600'
             }}>
               Configure Questionnaire ⚙️
             </h3>
             <p style={{ 
               margin: '0 0 20px 0', 
               lineHeight: 1.6,
               fontSize: '1.1em',
               color: '#495057'
             }}>
               Customize which questions to include in your study. You can enable or disable 
               questions based on your research needs.
             </p>
           </div>
         ),
         disableBeacon: true,
         placement: 'center',
         styles: {
           options: {
             width: 450,
             height: 280
           }
         }
       },
       {
         target: '.question-section',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Question Sections</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Questions are organized by MoFASA dimensions: Situation, Identity, Definition of 
               Situation, Rule Selection, and Decision. Each section focuses on different aspects 
               of human-robot interaction.
             </p>
           </div>
         ),
         placement: 'left'
       },
       {
         target: 'input[type="checkbox"]',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Toggle Questions</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Use the toggle switches to enable or disable specific questions. At least one 
               question per section must remain enabled.
             </p>
           </div>
         ),
         placement: 'right'
       },
       {
         target: '.factor-tag',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>MoFASA Factors</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               These blue tags show the MoFASA factors associated with each question. Click on 
               them to learn more about specific factors.
             </p>
           </div>
         ),
         placement: 'left'
       },
               {
          target: '.create-project-btn',
          content: (
            <div>
              <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Create Project</h3>
              <p style={{ margin: 0, lineHeight: 1.5 }}>
                Once you've configured your questionnaire, click "Create Project" to finalize 
                your project setup and start working with participants.
              </p>
            </div>
          ),
          placement: 'top'
        }
     ],

     // Questionnaire Settings tutorial
     questionnaireSettings: [
       {
         target: 'body',
         content: (
           <div style={{ textAlign: 'center', padding: '20px' }}>
             <h3 style={{ 
               margin: '0 0 16px 0', 
               color: '#2c3e50',
               fontSize: '1.6em',
               fontWeight: '600'
             }}>
               Questionnaire Settings ⚙️
             </h3>
             <p style={{ 
               margin: '0 0 20px 0', 
               lineHeight: 1.6,
               fontSize: '1.1em',
               color: '#495057'
             }}>
               Customize which questions to include in your study for this specific project. 
               You can enable or disable questions based on your research needs.
             </p>
           </div>
         ),
         disableBeacon: true,
         placement: 'center',
         styles: {
           options: {
             width: 450,
             height: 280
           }
         }
       },
       {
         target: '.question-section',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Question Sections</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Questions are organized by MoFASA dimensions: Situation, Identity, Definition of 
               Situation, Rule Selection, and Decision. Each section focuses on different aspects 
               of human-robot interaction.
             </p>
           </div>
         ),
         placement: 'left'
       },
       {
         target: 'input[type="checkbox"]',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Toggle Questions</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Use the toggle switches to enable or disable specific questions for this project. 
               At least one question per section must remain enabled.
             </p>
           </div>
         ),
         placement: 'right'
       },
       {
         target: '.factor-tag',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>MoFASA Factors</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               These blue tags show the MoFASA factors associated with each question. Click on 
               them to learn more about specific factors.
             </p>
           </div>
         ),
         placement: 'left'
       }
     ],

     // Edit Summary Prompt tutorial
     editSummaryPrompt: [
       {
         target: 'body',
         content: (
           <div style={{ textAlign: 'center', padding: '20px' }}>
             <h3 style={{ 
               margin: '0 0 16px 0', 
               color: '#2c3e50',
               fontSize: '1.6em',
               fontWeight: '600'
             }}>
               Edit Summary Prompt 📝
             </h3>
             <p style={{ 
               margin: '0 0 20px 0', 
               lineHeight: 1.6,
               fontSize: '1.1em',
               color: '#495057'
             }}>
               Customize the prompt used to generate participant summaries for this project. 
               This prompt will guide the AI in creating consistent and relevant summaries.
             </p>
           </div>
         ),
         disableBeacon: true,
         placement: 'center',
         styles: {
           options: {
             width: 450,
             height: 280
           }
         }
       },
       {
         target: 'textarea',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Prompt Template</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               This text area contains the prompt template that will be used to generate 
               participant summaries. You can modify it to better suit your research needs.
             </p>
           </div>
         ),
         placement: 'top'
       },
       {
         target: 'button',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Save Changes</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Click "Save Changes" to update the prompt template for this project. 
               The new prompt will be used for all future summary generations.
             </p>
           </div>
         ),
         placement: 'top'
       }
     ],

    
  };

  // Check if target elements exist
  const validateTargets = (steps) => {
    return steps.filter(step => {
      try {
        const element = document.querySelector(step.target);
        if (!element) {
          console.warn('Tutorial target not found:', step.target);
          return false;
        }
        return true;
      } catch (error) {
        console.error('Invalid CSS selector:', step.target, error);
        return false;
      }
    });
  };

  // Initialize tutorial when type changes
  useEffect(() => {
    if (isActive && tutorialType && tutorialSteps[tutorialType]) {
      // Add a small delay to ensure DOM elements are rendered
      const timer = setTimeout(() => {
        const allSteps = tutorialSteps[tutorialType];
        const validSteps = validateTargets(allSteps);
        
        if (validSteps.length > 0) {
          setTutorialState({
            run: true,
            stepIndex: 0,
            steps: validSteps
          });
        } else {
          console.warn('No valid tutorial targets found for:', tutorialType);
          setTutorialState(prev => ({ ...prev, run: false }));
        }
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setTutorialState(prev => ({ ...prev, run: false }));
    }
  }, [tutorialType, isActive]);

  // Add hover effects to tutorial buttons
  useEffect(() => {
    if (tutorialState.run) {
      const addHoverEffects = () => {
        // Try multiple selectors to find the buttons
        const selectors = [
          '.react-joyride__button',
          '.react-joyride__tooltip button',
          '[data-testid="tooltip"] button',
          '.custom-joyride button'
        ];
        
        let buttons = [];
        selectors.forEach(selector => {
          const found = document.querySelectorAll(selector);
          if (found.length > 0) {
            buttons = found;
            console.log('Found buttons with selector:', selector, found.length);
          }
        });
        
        buttons.forEach(button => {
          console.log('Adding hover effects to button:', button.className);
          
          const mouseenterHandler = (e) => {
            console.log('Mouse enter on button:', e.target.className);
            if (e.target.classList.contains('react-joyride__button--next') || 
                e.target.textContent.includes('Next') || 
                e.target.textContent.includes('Get Started')) {
              e.target.style.backgroundColor = '#2980b9';
              console.log('Applied next button hover');
            } else if (e.target.classList.contains('react-joyride__button--back') || 
                       e.target.textContent.includes('Previous')) {
              e.target.style.backgroundColor = '#7f8c8d';
              console.log('Applied back button hover');
            } else if (e.target.classList.contains('react-joyride__button--skip') || 
                       e.target.textContent.includes('Skip')) {
              e.target.style.backgroundColor = '#5a6c7d';
              e.target.style.color = '#ffffff';
              console.log('Applied skip button hover');
            } else if (e.target.classList.contains('react-joyride__button--close') || 
                       e.target.textContent.includes('×') || 
                       e.target.textContent.includes('Close')) {
              e.target.style.backgroundColor = '#e74c3c';
              e.target.style.color = '#ffffff';
              e.target.style.borderRadius = '50%';
              e.target.style.transform = 'scale(1.1)';
              e.target.style.boxShadow = '0 2px 8px rgba(231, 76, 60, 0.3)';
              console.log('Applied close button hover');
            }
          };
          
          const mouseleaveHandler = (e) => {
            console.log('Mouse leave on button:', e.target.className);
            if (e.target.classList.contains('react-joyride__button--next') || 
                e.target.textContent.includes('Next') || 
                e.target.textContent.includes('Get Started')) {
              e.target.style.backgroundColor = '#3498db';
            } else if (e.target.classList.contains('react-joyride__button--back') || 
                       e.target.textContent.includes('Previous')) {
              e.target.style.backgroundColor = '#95a5a6';
            } else if (e.target.classList.contains('react-joyride__button--skip') || 
                       e.target.textContent.includes('Skip')) {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#7f8c8d';
            } else if (e.target.classList.contains('react-joyride__button--close') || 
                       e.target.textContent.includes('×') || 
                       e.target.textContent.includes('Close')) {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#7f8c8d';
              e.target.style.borderRadius = '50%';
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = 'none';
            }
          };
          
          button.addEventListener('mouseenter', mouseenterHandler);
          button.addEventListener('mouseleave', mouseleaveHandler);
        });
      };

      // Add a delay to ensure buttons are rendered
      const timer = setTimeout(addHoverEffects, 500);
      return () => clearTimeout(timer);
    }
  }, [tutorialState.run]);

  // Handle tutorial events
  const handleJoyrideCallback = (data) => {
    const { status, type, index, action } = data;

    if (type === EVENTS.TARGET_NOT_FOUND) {
      console.warn('Tutorial target not found, skipping step:', tutorialState.steps[index]?.target);
      // Skip to next step if target not found
      const nextStepIndex = index + 1;
      if (nextStepIndex < tutorialState.steps.length) {
        setTutorialState(prev => ({ ...prev, stepIndex: nextStepIndex }));
      } else {
        // End tutorial if no more steps
        setTutorialState(prev => ({ ...prev, run: false }));
        if (onComplete) {
          onComplete();
        }
      }
    } else if (type === EVENTS.STEP_AFTER) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setTutorialState(prev => ({ ...prev, stepIndex: nextStepIndex }));
    } else if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setTutorialState(prev => ({ ...prev, run: false }));
      if (onComplete) {
        onComplete();
      }
    } else if (status === STATUS.ERROR) {
      console.error('Tutorial error, stopping tutorial');
      setTutorialState(prev => ({ ...prev, run: false }));
    }
  };

  // Custom tutorial styles to match app theme
  const tutorialStyles = {
    options: {
      primaryColor: '#3498db',
      textColor: '#2c3e50',
      backgroundColor: '#ffffff',
      overlayColor: 'rgba(0, 0, 0, 0.6)',
      spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
      zIndex: 10000,
    },
    tooltip: {
      fontFamily: 'Lexend, sans-serif',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
      maxWidth: '500px',
      border: '1px solid rgba(52, 152, 219, 0.1)'
    },
    tooltipTitle: {
      fontFamily: 'Lexend, sans-serif',
      fontWeight: '600',
      fontSize: '1.1em'
    },
    tooltipContent: {
      fontFamily: 'Lexend, sans-serif',
      fontSize: '0.95em',
      lineHeight: '1.5'
    },
    buttonNext: {
      backgroundColor: '#3498db',
      borderRadius: '4px',
      fontFamily: 'Lexend, sans-serif',
      fontWeight: '500',
      fontSize: '14px',
      padding: '8px 16px',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      marginLeft: '10px'
    },
    buttonBack: {
      backgroundColor: '#95a5a6',
      borderRadius: '4px',
      fontFamily: 'Lexend, sans-serif',
      fontWeight: '500',
      fontSize: '14px',
      padding: '8px 16px',
      border: 'none',
      color: '#ffffff',
      cursor: 'pointer',
      transition: 'background-color 0.2s ease',
      marginRight: '8px'
    },
    buttonSkip: {
      color: '#7f8c8d',
      fontFamily: 'Lexend, sans-serif',
      fontWeight: '500',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'color 0.2s ease'
    },
    buttonClose: {
      backgroundColor: 'transparent',
      borderRadius: '50%',
      fontFamily: 'Lexend, sans-serif',
      fontWeight: '500',
      fontSize: '16px',
      padding: '6px',
      border: 'none',
      color: '#7f8c8d',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      width: '16px',
      height: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '8px',
      boxShadow: 'none'
    }
  };

  const locale = {
    back: 'Previous',
    close: 'Close',
    last: tutorialType === 'gettingStarted' ? 'Get Started' : 'Finish',
    next: 'Next',
    skip: tutorialType === 'gettingStarted' ? 'Skip Welcome' : 'Skip Tour'
  };

  // Don't render if no valid steps
  if (!tutorialState.run || tutorialState.steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous={true}
      run={tutorialState.run}
      stepIndex={tutorialState.stepIndex}
      steps={tutorialState.steps}
      styles={tutorialStyles}
      locale={locale}
      showProgress={true}
      showSkipButton={true}
      spotlightClicks={false}
      disableOverlayClose={true}
      hideCloseButton={false}
      scrollToFirstStep={true}
      scrollDuration={300}
      disableScrollParentFix={true}
      debug={false}
      disableBeacon={true}
      className="custom-joyride"
    />
  );
};

export default Tutorial; 