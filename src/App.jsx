import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import ParticipantPage from './components/ParticipantPage';
import Settings from './components/Settings';
import About from './components/About';
import SplashScreen from './components/SplashScreen';
import DeepSeekStatus from './components/DeepSeekStatus';
import { getProjects, saveProjects } from './store';
import '../styles.css';

const App = () => {
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
    const timer = setTimeout(() => setShowSplash(false), 1000);
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
  };

  const deleteProject = async (index) => {
    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
    await saveProjects(newProjects);
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
  };

  const updateProjectRules = async (projectIdx, rules) => {
    const newProjects = projects.map((p, i) =>
      i === projectIdx ? {
        ...p,
        rules,
        updatedAt: new Date().toISOString()
      } : p
    );
    setProjects(newProjects);
    await saveProjects(newProjects);
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
  };

  function SidebarLinks() {
    const navigate = useNavigate();
    const location = useLocation();
    return (
      <>
        <Link to="/" className="sidebar-item">Home</Link>
        <Link to="/projects" className="sidebar-item" style={{marginTop: 5}}>Projects</Link>
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
          <div className="sidebar-bottom">
            <DeepSeekStatus />
            <Link to="/settings" className="sidebar-item">Settings</Link>
            <Link to="/about" className="sidebar-item">About MoFASA</Link>
          </div>
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