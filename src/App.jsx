import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import ParticipantPage from './components/ParticipantPage';
import Settings from './components/Settings';
import About from './components/About';
import SplashScreen from './components/SplashScreen';
import DeepSeekStatus from './components/DeepSeekStatus';
import Login from './components/Login';
import ProtectedRoute from './components/ProtectedRoute';
import { getProjects, saveProjects } from './store';
import Register from './components/Register';
import ResetPassword from './components/ResetPassword';
import { auth } from './utils/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import '../styles.css';

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [projects, setProjects] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user);
      setIsAuthenticated(!!user);
      setUser(user);
      if (user) {
        console.log('User display name:', user.displayName);
        const userProjects = await getProjects();
        setProjects(userProjects);
      } else {
        setProjects([]);
      }
      setIsLoading(false);
    });

    // Hide splash screen after 1 second
    const timer = setTimeout(() => setShowSplash(false), 1000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setShowLogoutConfirm(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const addProject = async (projectData) => {
    if (!user) return;

    const newProject = {
      ...projectData,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      rules: projectData.rules || []
    };

    const newProjects = [...projects, newProject];
    setProjects(newProjects);
    await saveProjects(newProjects);
  };

  const editProject = async (index, projectData) => {
    if (!user) return;

    const project = projects[index];
    if (project.userId !== user.uid) {
      console.error('Unauthorized: Cannot edit another user\'s project');
      return;
    }

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
    if (!user) return;

    const project = projects[index];
    if (project.userId !== user.uid) {
      console.error('Unauthorized: Cannot delete another user\'s project');
      return;
    }

    const newProjects = projects.filter((_, i) => i !== index);
    setProjects(newProjects);
    await saveProjects(newProjects);
  };

  const updateProjectDescription = async (index, description, participants) => {
    if (!user) return;

    const project = projects[index];
    if (project.userId !== user.uid) {
      console.error('Unauthorized: Cannot update another user\'s project');
      return;
    }

    const newProjects = projects.map((p, i) =>
      i === index ? { 
        ...p, 
        description, 
        participants: participants || p.participants || [],
        updatedAt: new Date().toISOString()
      } : p
    );
    setProjects(newProjects);
    await saveProjects(newProjects);
  };

  const updateProjectRules = async (projectIdx, rules) => {
    if (!user) return;

    const project = projects[projectIdx];
    if (project.userId !== user.uid) {
      console.error('Unauthorized: Cannot update another user\'s project rules');
      return;
    }

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
    if (!user) return;

    const project = projects[projectIdx];
    if (project.userId !== user.uid) {
      console.error('Unauthorized: Cannot update another user\'s project participants');
      return;
    }

    const newProjects = projects.map((p, i) => {
      if (i !== projectIdx) return p;
      const updatedParticipants = (p.participants || []).map(part => {
        if (part.id !== participantId) return part;
        const answers = { ...part.answers };
        if (!answers[section]) answers[section] = {};
        answers[section][question] = value;
        return { ...part, answers };
      });
      return { 
        ...p, 
        participants: updatedParticipants,
        updatedAt: new Date().toISOString()
      };
    });
    setProjects(newProjects);
    await saveProjects(newProjects);
  };

  const updateParticipantSummary = async (projectIdx, participantId, summary) => {
    if (!user) return;

    const project = projects[projectIdx];
    if (project.userId !== user.uid) {
      console.error('Unauthorized: Cannot update another user\'s project participants');
      return;
    }

    const newProjects = projects.map((p, i) => {
      if (i !== projectIdx) return p;
      const updatedParticipants = (p.participants || []).map(part => {
        if (part.id !== participantId) return part;
        return { ...part, summary };
      });
      return { 
        ...p, 
        participants: updatedParticipants,
        updatedAt: new Date().toISOString()
      };
    });
    setProjects(newProjects);
    await saveProjects(newProjects);
  };

  // Custom hook to get navigation in sidebar
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
        {isAuthenticated && (
          <div className="sidebar">
            <h2>MoFASA Tools</h2>
            {user?.displayName && (
              <div className="user-welcome">
                Welcome, {user.displayName}
              </div>
            )}
            <div className="sidebar-menu">
              <SidebarLinks />
            </div>
            <div className="sidebar-bottom">
              <DeepSeekStatus />
              <Link to="/settings" className="sidebar-item">Settings</Link>
              <Link to="/about" className="sidebar-item">About MoFASA</Link>
              <button onClick={() => setShowLogoutConfirm(true)} className="sidebar-item logout-button">Logout</button>
            </div>
          </div>
        )}
        <div className={`main-content ${!isAuthenticated ? 'full-width' : ''}`}>
          <Routes>
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={isAuthenticated ? <Navigate to="/" replace /> : <Register />} 
            />
            <Route 
              path="/reset-password" 
              element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />} 
            />
            <Route path="/" element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            } />
            <Route path="/projects" element={
              <ProtectedRoute>
                <Projects
                  projects={projects}
                  addProject={addProject}
                  editProject={editProject}
                  deleteProject={deleteProject}
                />
              </ProtectedRoute>
            } />
            <Route path="/projects/:projectId" element={
              <ProtectedRoute>
                <ProjectDetails
                  projects={projects}
                  updateProjectDescription={updateProjectDescription}
                  editProject={editProject}
                  deleteProject={deleteProject}
                  updateProjectRules={updateProjectRules}
                />
              </ProtectedRoute>
            } />
            <Route path="/projects/:projectId/participants/:participantId" element={
              <ProtectedRoute>
                <ParticipantPage 
                  projects={projects} 
                  updateParticipantAnswers={updateParticipantAnswers}
                  updateParticipantSummary={updateParticipantSummary}
                  updateProjectRules={updateProjectRules}
                />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings projects={projects} />
              </ProtectedRoute>
            } />
            <Route path="/about" element={
              <ProtectedRoute>
                <About />
              </ProtectedRoute>
            } />
          </Routes>
        </div>

        {showLogoutConfirm && (
          <>
            <div className="dialog-overlay" onClick={() => setShowLogoutConfirm(false)} />
            <div className="confirmation-dialog">
              <h3>Confirm Logout</h3>
              <p>Are you sure you want to log out?</p>
              <div className="confirmation-dialog-buttons">
                <button 
                  className="cancel-button"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Router>
  );
};

export default App; 