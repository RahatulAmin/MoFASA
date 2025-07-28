import React, { useState, useEffect } from 'react';
import Joyride, { STATUS, EVENTS, ACTIONS } from 'react-joyride';

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
         target: '.left-panel',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Interview Questions</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               Fill out these questions based on your interview with the participant.
             </p>
           </div>
         ),
         placement: 'right'
       },
       {
         target: '.right-panel',
         content: (
           <div>
             <h3 style={{ margin: '0 0 12px 0', color: '#2c3e50' }}>Visual Framework</h3>
             <p style={{ margin: 0, lineHeight: 1.5 }}>
               This shows how the answers connect to create a participant profile.
             </p>
           </div>
         ),
         placement: 'left'
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