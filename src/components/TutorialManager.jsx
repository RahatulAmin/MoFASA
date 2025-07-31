import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Tutorial from './Tutorial';
import TutorialErrorBoundary from './TutorialErrorBoundary';

const TutorialManager = ({ children, currentView = null }) => {
  const location = useLocation();
  const [currentTutorial, setCurrentTutorial] = useState(null);
  const [tutorialProgress, setTutorialProgress] = useState({});

  // Load tutorial progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('mofasa_tutorial_progress');
    if (savedProgress) {
      try {
        setTutorialProgress(JSON.parse(savedProgress));
      } catch (error) {
        console.error('Error loading tutorial progress:', error);
      }
    }
  }, []);

  // Save tutorial progress to localStorage
  const saveTutorialProgress = (newProgress) => {
    const updatedProgress = { ...tutorialProgress, ...newProgress };
    setTutorialProgress(updatedProgress);
    localStorage.setItem('mofasa_tutorial_progress', JSON.stringify(updatedProgress));
  };

  // Check if user is new (no tutorials completed)
  const isNewUser = () => {
    return Object.keys(tutorialProgress).length === 0;
  };

  // Start a specific tutorial with safety checks
  const startTutorial = (tutorialType) => {
    // Add a small delay to ensure page has fully loaded
    setTimeout(() => {
      setCurrentTutorial(tutorialType);
    }, 200);
  };

  // Complete a tutorial
  const completeTutorial = (tutorialType) => {
    setCurrentTutorial(null);
    if (tutorialType) {
      saveTutorialProgress({ [tutorialType]: { completed: true, completedAt: new Date().toISOString() } });
    }
  };

  // Get appropriate tutorial for current page and view
  const getCurrentPageTutorial = () => {
    const path = location.pathname;
    
    // Check if questionnaire settings modal is open
    const questionnaireSettingsModal = document.querySelector('[style*="position: fixed"][style*="z-index: 1000"]')?.querySelector('h3')?.textContent?.includes('Questionnaire Settings');
    
    if (questionnaireSettingsModal) {
      return 'questionnaireSettings';
    }
    
    // Check if edit summary prompt modal is open
    const editSummaryPromptModal = document.querySelector('[style*="position: fixed"][style*="z-index: 1000"]')?.querySelector('h3')?.textContent?.includes('Edit Project Prompt');
    
    if (editSummaryPromptModal) {
      return 'editSummaryPrompt';
    }
    
    // Check if add project modal is open by looking for the modal in DOM
    // Use multiple selectors to be more reliable
    const addProjectModal = document.querySelector('[style*="position: fixed"][style*="z-index: 1000"]') ||
                           document.querySelector('[style*="background-color: rgba(0, 0, 0, 0.5)"]') ||
                           document.querySelector('.project-details-step')?.closest('[style*="position: fixed"]') ||
                           document.querySelector('.questionnaire-step')?.closest('[style*="position: fixed"]');
    
    if (addProjectModal) {
      // Check if we're in questionnaire step by looking for the questionnaire step class
      const questionnaireStep = addProjectModal.querySelector('.questionnaire-step');
      const projectDetailsStep = addProjectModal.querySelector('.project-details-step');
      
      if (questionnaireStep) {
        return 'questionnaireConfiguration';
      } else if (projectDetailsStep) {
        return 'addProjectModal';
      } else {
        // Fallback: if modal is open but we can't determine the step, default to add project
        return 'addProjectModal';
      }
    }
    
    // If we're on a project details page and have a current view, show view-specific tutorial
    if (path.match(/^\/projects\/\d+$/) && currentView) {
      switch (currentView) {
        case 'personae':
          return 'personaeMapping';
        case 'behavioral':
          return 'behavioralDiversity';
        case 'situation':
          return 'situationDesign';
        default:
          return 'projectDetails';
      }
    }
    
    // Otherwise, use path-based tutorials
    if (path === '/') {
      return 'gettingStarted';
    } else if (path === '/projects') {
      return 'projectsOverview';
    } else if (path.match(/^\/projects\/\d+$/)) {
      return 'projectDetails';
    } else if (path.match(/^\/projects\/\d+\/participants\/\w+$/)) {
      return 'participantInterview';
    } else {
      return null; // No tutorial for other pages
    }
  };

  // Auto-start getting started tutorial for new users
  useEffect(() => {
    // Only auto-start if user is new and we're on the home page
    if (isNewUser() && location.pathname === '/') {
      // Longer delay to ensure elements are fully rendered
      const timer = setTimeout(() => {
        // Double-check we're still on home page before starting
        if (location.pathname === '/') {
          startTutorial('gettingStarted');
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [tutorialProgress, location.pathname]);

  // Clean up tutorial when route changes
  useEffect(() => {
    // Stop any running tutorial when the route changes
    if (currentTutorial) {
      setCurrentTutorial(null);
    }
  }, [location.pathname]);

  // Tutorial button component
  const TutorialButton = () => {
    const [currentPageTutorial, setCurrentPageTutorial] = useState(null);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [showCompletion, setShowCompletion] = useState(false);
    
    // Use useEffect to detect tutorial with a small delay to ensure DOM is ready
    useEffect(() => {
      const detectTutorial = () => {
        const detectedTutorial = getCurrentPageTutorial();
        setCurrentPageTutorial(detectedTutorial);
      };
      
      // Initial detection
      detectTutorial();
      
      // Set up multiple checks to ensure we catch DOM changes
      const timer1 = setTimeout(detectTutorial, 50);
      const timer2 = setTimeout(detectTutorial, 200);
      const timer3 = setTimeout(detectTutorial, 500);
      
      // Set up MutationObserver to watch for DOM changes
      const observer = new MutationObserver(() => {
        detectTutorial();
      });
      
      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class']
      });
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        observer.disconnect();
      };
    }, [location.pathname, currentView]);

    // Trigger animation when tutorial becomes available
    useEffect(() => {
      if (currentPageTutorial && !tutorialProgress[currentPageTutorial]?.completed) {
        setShouldAnimate(true);
        // Stop animation after 3 seconds
        const timer = setTimeout(() => setShouldAnimate(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [currentPageTutorial, tutorialProgress]);

    // Show completion animation when tutorial is completed
    useEffect(() => {
      if (currentPageTutorial && tutorialProgress[currentPageTutorial]?.completed) {
        setShowCompletion(true);
        const timer = setTimeout(() => setShowCompletion(false), 2000);
        return () => clearTimeout(timer);
      }
    }, [currentPageTutorial, tutorialProgress]);
    
    const getTutorialTitle = (tutorialType) => {
      const titles = {
        'gettingStarted': 'Getting Started Guide',
        'projectsOverview': 'Projects Overview',
        'projectDetails': 'Project Overview',
        'participantInterview': 'Interview Guide',
        'personaeMapping': 'Personae Mapping Guide',
        'behavioralDiversity': 'Behavioral Diversity Guide',
        'situationDesign': 'Situation Design Guide',
        'addProjectModal': 'Add Project Guide',
        'questionnaireConfiguration': 'Questionnaire Configuration Guide',
        'questionnaireSettings': 'Questionnaire Settings Guide',
        'editSummaryPrompt': 'Edit Summary Prompt Guide'
      };
      return titles[tutorialType] || 'Tutorial';
    };

    // Don't show tutorial button if no tutorial is available for current page
    // Also don't show on home page
    if (!currentPageTutorial || location.pathname === '/') {
      return null;
    }

    return (
      <button
        onClick={() => startTutorial(currentPageTutorial)}
        className={`${shouldAnimate ? 'tutorial-button-animate' : ''} ${showCompletion ? 'tutorial-button-complete' : ''} ${!tutorialProgress[currentPageTutorial]?.completed ? 'tutorial-button-available' : ''}`}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          fontSize: '1.5em',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(52, 152, 219, 0.3)',
          transition: 'all 0.3s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseOver={(e) => {
          e.target.style.backgroundColor = '#2980b9';
          e.target.style.transform = 'scale(1.1)';
        }}
        onMouseOut={(e) => {
          e.target.style.backgroundColor = '#3498db';
          e.target.style.transform = 'scale(1)';
        }}
        title={`Start ${getTutorialTitle(currentPageTutorial)}`}
      >
        💡
      </button>
    );
  };



  return (
    <>
      {children}
      <TutorialErrorBoundary tutorialType={currentTutorial}>
        <Tutorial
          tutorialType={currentTutorial}
          onComplete={() => completeTutorial(currentTutorial)}
          isActive={!!currentTutorial}
        />
      </TutorialErrorBoundary>
      <TutorialButton />
    </>
  );
};

export default TutorialManager; 