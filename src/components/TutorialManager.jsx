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
    const currentPageTutorial = getCurrentPageTutorial();
    
    const getTutorialTitle = (tutorialType) => {
      const titles = {
        'gettingStarted': 'Getting Started Guide',
        'projectsOverview': 'Projects Overview',
        'projectDetails': 'Project Overview',
        'participantInterview': 'Interview Guide',
        'personaeMapping': 'Personae Mapping Guide',
        'behavioralDiversity': 'Behavioral Diversity Guide',
        'situationDesign': 'Situation Design Guide'
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