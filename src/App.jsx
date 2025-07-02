import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import ParticipantPage from './components/ParticipantPage';
import Settings from './components/Settings';
import About from './components/About';
import SplashScreen from './components/SplashScreen';
import LLMStatus from './components/LLMStatus';
import { getProjects, saveProjects } from './store';
import '../styles.css';

const App = () => {
  // Configuration - Change this to control splash screen duration
  const SPLASH_SCREEN_DURATION = 2000; // milliseconds (1 second)
  
  const [showSplash, setShowSplash] = useState(true);
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      const userProjects = await getProjects();
      setProjects(userProjects);
      setIsLoading(false);
    };
    loadProjects();
    // Hide splash screen after 1 second
    // Change the number below to control duration:
    // 500 = 0.5 seconds, 1000 = 1 second, 2000 = 2 seconds, 3000 = 3 seconds
    const timer = setTimeout(() => setShowSplash(false), SPLASH_SCREEN_DURATION);
    return () => clearTimeout(timer);
  }, []);

  const addProject = async (projectData) => {
    const newProject = {
      ...projectData,
      createdAt: new Date().toISOString(),
      rules: projectData.rules || []
    };
    const newProjects = [...projects, newProject];
    setProjects(newProjects);
    await saveProjects(newProjects);
    
    // Reload projects from database to get proper IDs
    const updatedProjects = await getProjects();
    setProjects(updatedProjects);
  };

  const editProject = async (index, projectData) => {
    const newProjects = [...projects];
    newProjects[index] = {
      ...newProjects[index],
      ...projectData,
      updatedAt: new Date().toISOString()
    };
    setProjects(newProjects);
    await saveProjects(newProjects);
    
    // Reload projects from database to get proper IDs
    const updatedProjects = await getProjects();
    setProjects(updatedProjects);
  };

  const deleteProject = async (index) => {
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
    await saveProjects(newProjects);
    
    // Reload projects from database to get proper IDs
    const updatedProjects = await getProjects();
    setProjects(updatedProjects);
  };

  const updateProjectDescription = async (index, description) => {
    const newProjects = projects.map((p, i) =>
      i === index ? {
        ...p,
        description,
        updatedAt: new Date().toISOString()
      } : p
    );
    setProjects(newProjects);
    await saveProjects(newProjects);
    
    // Reload projects from database to get proper IDs
    const updatedProjects = await getProjects();
    setProjects(updatedProjects);
  };

  const updateProjectRules = async (projectIdx, updatedScopes) => {
    const newProjects = projects.map((p, i) =>
      i === projectIdx ? {
        ...p,
        scopes: updatedScopes,
        updatedAt: new Date().toISOString()
      } : p
    );
    
    setProjects(newProjects);
    await saveProjects(newProjects);
    
    // Do NOT reload projects from the database here to preserve scope-level rules
    // The database stores rules at project level, but we want to keep scope-level rules in memory
  };

  const updateParticipantAnswers = async (projectIdx, participantId, section, question, value) => {
    const newProjects = projects.map((p, i) => {
      if (i !== projectIdx) return p;
      
      // Get the selected scope index from localStorage
      const getSelectedScopeIndex = () => {
        try {
          const stored = localStorage.getItem(`project_${projectIdx}_selected_scope`);
          return stored ? parseInt(stored, 10) : 0;
        } catch (error) {
          return 0;
        }
      };
      
      const selectedScopeIndex = getSelectedScopeIndex();
      
      // Update participants in the selected scope
      const updatedScopes = [...(p.scopes || [])];
      if (updatedScopes.length > selectedScopeIndex) {
        const updatedParticipants = (updatedScopes[selectedScopeIndex].participants || []).map(part => {
          if (part.id !== participantId) return part;
          const answers = { ...part.answers };
          if (!answers[section]) answers[section] = {};
          answers[section][question] = value;
          return { ...part, answers };
        });
        
        updatedScopes[selectedScopeIndex] = {
          ...updatedScopes[selectedScopeIndex],
          participants: updatedParticipants
        };
      }
      
      return {
        ...p,
        scopes: updatedScopes,
        updatedAt: new Date().toISOString()
      };
    });
    setProjects(newProjects);
    await saveProjects(newProjects);
    // Do NOT reload projects from the database here!
  };

  const updateParticipantSummary = async (projectIdx, participantId, summary) => {
    const newProjects = projects.map((p, i) => {
      if (i !== projectIdx) return p;
      
      // Get the selected scope index from localStorage
      const getSelectedScopeIndex = () => {
        try {
          const stored = localStorage.getItem(`project_${projectIdx}_selected_scope`);
          return stored ? parseInt(stored, 10) : 0;
        } catch (error) {
          return 0;
        }
      };
      
      const selectedScopeIndex = getSelectedScopeIndex();
      
      // Update participants in the selected scope
      const updatedScopes = [...(p.scopes || [])];
      if (updatedScopes.length > selectedScopeIndex) {
        const updatedParticipants = (updatedScopes[selectedScopeIndex].participants || []).map(part => {
          if (part.id !== participantId) return part;
          return { ...part, summary };
        });
        
        updatedScopes[selectedScopeIndex] = {
          ...updatedScopes[selectedScopeIndex],
          participants: updatedParticipants
        };
      }
      
      return {
        ...p,
        scopes: updatedScopes,
        updatedAt: new Date().toISOString()
      };
    });
    setProjects(newProjects);
    await saveProjects(newProjects);
    
    // Reload projects from database to get proper IDs
    const updatedProjects = await getProjects();
    setProjects(updatedProjects);
  };

  function SidebarLinks() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
      <>
        <Link 
          to="/" 
          className="sidebar-item"
          style={{ background: location.pathname === "/" ? '#34495e' : undefined }}
        >
          Home
        </Link>
        <Link 
          to="/projects" 
          className="sidebar-item" 
          style={{
            marginTop: 5, 
            background: location.pathname === "/projects" ? '#34495e' : undefined
          }}
        >
          Projects
        </Link>
        {projects.length === 0 && (
          <div style={{ color: '#aaa', fontSize: '.95em', marginLeft: '10px' }}>No projects</div>
        )}
        {projects.map((project, idx) => (
          <div
            key={idx}
            className="sidebar-item"
            style={{ paddingLeft: 30, background: location.pathname === `/projects/${idx}` ? '#34495e' : undefined, cursor: 'pointer' }}
            onClick={() => navigate(`/projects/${idx}`)}
          >
            {project.name}
          </div>
        ))}
      </>
    );
  }

  function SidebarBottom() {
    const location = useLocation();
    return (
      <div className="sidebar-bottom">
        <LLMStatus />
        <Link 
          to="/settings" 
          className="sidebar-item"
          style={{ background: location.pathname === "/settings" ? '#34495e' : undefined }}
        >
          Settings
        </Link>
        <Link 
          to="/about" 
          className="sidebar-item"
          style={{ background: location.pathname === "/about" ? '#34495e' : undefined }}
        >
          About MoFASA
        </Link>
      </div>
    );
  }

  if (showSplash) {
    return <SplashScreen />;
  }

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="app">
        <div className="sidebar">
          <h2>MoFASA Tools</h2>
          <div className="sidebar-menu">
            <SidebarLinks />
          </div>
          <SidebarBottom />
        </div>
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={
              <Projects
                projects={projects}
                addProject={addProject}
                editProject={editProject}
                deleteProject={deleteProject}
              />
            } />
            <Route path="/projects/:projectId" element={
              <ProjectDetails
                projects={projects}
                updateProjectDescription={updateProjectDescription}
                editProject={editProject}
                deleteProject={deleteProject}
                updateProjectRules={updateProjectRules}
              />
            } />
            <Route path="/projects/:projectId/participants/:participantId" element={
              <ParticipantPage
                projects={projects}
                updateParticipantAnswers={updateParticipantAnswers}
                updateParticipantSummary={updateParticipantSummary}
                updateProjectRules={updateProjectRules}
              />
            } />
            <Route path="/settings" element={<Settings projects={projects} />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App; 