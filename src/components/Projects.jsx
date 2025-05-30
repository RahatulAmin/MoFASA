import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import editIcon from '../images/edit.png';
import deleteIcon from '../images/trash.png';
import { encryptData, decryptData } from '../utils/crypto';

const Projects = ({ addProject, projects, editProject, deleteProject }) => {
  const navigate = useNavigate();
  const [isAddProjectOpen, setIsAddProjectOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [newProjectParticipants, setNewProjectParticipants] = useState('');
  const [newProjectRobotType, setNewProjectRobotType] = useState('');
  const [newProjectStudyType, setNewProjectStudyType] = useState('');
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [importError, setImportError] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedProjectData, setImportedProjectData] = useState(null);
  const [importProjectName, setImportProjectName] = useState('');

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const targetParticipants = parseInt(newProjectParticipants) || 0;
      const participants = Array.from({ length: targetParticipants }, (_, index) => ({
        id: `P${index + 1}`,
        name: `P${index + 1}`,
        answers: {},
        summary: ''
      }));

      addProject({
        name: newProjectName,
        description: newProjectDescription,
        targetParticipants,
        robotType: newProjectRobotType,
        studyType: newProjectStudyType,
        participants,
        rules: []
      });

      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectParticipants('');
      setNewProjectRobotType('');
      setNewProjectStudyType('');
      setIsAddProjectOpen(false);
    }
  };

  const handleEditProject = (index) => {
    setEditingProject(index);
    setEditName(projects[index].name);
    setNewProjectDescription(projects[index].description || '');
    setNewProjectRobotType(projects[index].robotType || '');
    setNewProjectStudyType(projects[index].studyType || '');
  };

  const handleSaveEdit = (index) => {
    if (editName.trim()) {
      editProject(index, {
        ...projects[index],
        name: editName.trim(),
        description: newProjectDescription,
        robotType: newProjectRobotType,
        studyType: newProjectStudyType
      });
      setEditingProject(null);
      setEditName('');
      setNewProjectDescription('');
      setNewProjectRobotType('');
      setNewProjectStudyType('');
    }
  };

  const handleDeleteProject = (index) => {
    setProjectToDelete(index);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (projectToDelete !== null) {
      deleteProject(projectToDelete);
      setIsDeleteConfirmOpen(false);
      setProjectToDelete(null);
      setImportError('');
    }
  };

  const cancelDelete = () => {
    setIsDeleteConfirmOpen(false);
    setProjectToDelete(null);
  };

  // Function to handle project export
  const handleExportProject = async (project, index) => {
    try {
      const projectData = {
        ...project,
        rules: project.rules || [],
        exportDate: new Date().toISOString(),
        exportVersion: '1.0'
      };
      
      // Encrypt the project data
      const encryptedData = await encryptData(projectData);
      
      const blob = new Blob([JSON.stringify(encryptedData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.encrypted.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting project:', error);
      alert('Failed to export project. Please try again.');
    }
  };

  // Function to handle project import
  const handleImportProject = (event) => {
    setImportError('');
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const encryptedData = JSON.parse(e.target.result);
        
        // Decrypt the imported data
        const importedData = await decryptData(encryptedData);
        
        // Validate imported data
        if (!importedData.name || !importedData.participants) {
          throw new Error('Invalid project data format');
        }

        // Always show the import dialog with the original name as default
        setImportedProjectData(importedData);
        setImportProjectName(importedData.name);
        setImportDialogOpen(true);
      } catch (error) {
        console.error('Error importing project:', error);
        setImportError('Failed to import project. Please check if the file is a valid encrypted project file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImportConfirm = () => {
    if (!importProjectName.trim()) {
      setImportError('Project name cannot be empty');
      return;
    }

    // Check if the name is a duplicate
    const isDuplicate = projects.some(p => p.name === importProjectName);
    if (isDuplicate) {
      setImportError('A project with this name already exists. Please choose a different name.');
      return;
    }

    // Create new project data with the new name
    const renamedProjectData = {
      ...importedProjectData,
      name: importProjectName.trim()
    };

    // Add the renamed project
    addProject(renamedProjectData);
    setImportDialogOpen(false);
    setImportedProjectData(null);
    setImportProjectName('');
    setImportError('');
  };

  const handleImportCancel = () => {
    setImportDialogOpen(false);
    setImportedProjectData(null);
    setImportProjectName('');
    setImportError('');
  };

  return (
    <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Projects</h2>
        <button 
          onClick={() => setIsAddProjectOpen(true)}
          className="button-style add-project-button"
        >
          Add Project
        </button>

        <label
          onClick={() => setImportError('')}
          className="button-style import-project-button"
          style={{ display: 'inline-block' }}
        >
          Import Project
          <input
            type="file"
            accept=".json"
            onChange={handleImportProject}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {importError && (
        <div style={{
          padding: '10px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          marginBottom: '20px',
          border: '1px solid #f5c6cb'
        }}>
          {importError}
        </div>
      )}

      {isAddProjectOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Add New Project</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Project Name:</label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Brief Description of Situation:</label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Number of Participants:</label>
              <input
                type="number"
                value={newProjectParticipants}
                onChange={(e) => setNewProjectParticipants(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Type of Robot:</label>
              <input
                type="text"
                value={newProjectRobotType}
                onChange={(e) => setNewProjectRobotType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Type of Study:</label>
              <select
                value={newProjectStudyType}
                onChange={(e) => setNewProjectStudyType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="">Select Study Type</option>
                <option value="In-lab controlled">In-lab controlled</option>
                <option value="In-the-wild">In-the-wild</option>
                <option value="Mixed-method">Mixed-method</option>
                <option value="Longitudinal">Longitudinal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setIsAddProjectOpen(false)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProject}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}

      {editingProject !== null && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            width: '500px',
            maxWidth: '90%'
          }}>
            <h3 style={{ marginBottom: '20px' }}>Edit Project</h3>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Project Name:</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Brief Description of Situation:</label>
              <textarea
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd',
                  minHeight: '100px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Type of Robot:</label>
              <input
                type="text"
                value={newProjectRobotType}
                onChange={(e) => setNewProjectRobotType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Type of Study:</label>
              <select
                value={newProjectStudyType}
                onChange={(e) => setNewProjectStudyType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              >
                <option value="">Select Study Type</option>
                <option value="In-lab controlled">In-lab controlled</option>
                <option value="In-the-wild">In-the-wild</option>
                <option value="Mixed-method">Mixed-method</option>
                <option value="Longitudinal">Longitudinal</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div style={{ 
              marginBottom: '20px', 
              padding: '10px', 
              backgroundColor: '#f8f9fa', 
              borderRadius: '4px',
              border: '1px solid #e9ecef'
            }}>
              <p style={{ color: '#7f8c8d', margin: 0 }}>
                Note: Participant count cannot be changed from here.
              </p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setEditingProject(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveEdit(editingProject)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeleteConfirmOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0',
              color: '#2c3e50',
              fontSize: '1.2em',
              fontFamily: 'Lexend, sans-serif'
            }}>Delete Project</h3>
            <p style={{ 
              margin: '0 0 24px 0',
              color: '#34495e',
              fontSize: '1em',
              lineHeight: '1.5'
            }}>
              Are you sure you want to delete this project? This action cannot be undone.
            </p>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.95em',
                  transition: 'background-color 0.2s'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.95em',
                  transition: 'background-color 0.2s'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {importDialogOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '24px',
            borderRadius: '8px',
            width: '400px',
            maxWidth: '90%',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ 
              margin: '0 0 16px 0',
              color: '#2c3e50',
              fontSize: '1.2em',
              fontFamily: 'Lexend, sans-serif'
            }}>Import Project</h3>
            <p style={{ 
              margin: '0 0 16px 0',
              color: '#34495e',
              fontSize: '1em',
              lineHeight: '1.5'
            }}>
              Please enter a name for the imported project:
            </p>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                color: '#2c3e50',
                fontSize: '0.95em'
              }}>
                Project Name:
              </label>
              <input
                type="text"
                value={importProjectName}
                onChange={(e) => setImportProjectName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #dcdde1',
                  fontSize: '0.95em',
                  fontFamily: 'Lexend, sans-serif'
                }}
                autoFocus
              />
            </div>
            {importError && (
              <div style={{
                padding: '10px',
                backgroundColor: '#f8d7da',
                color: '#721c24',
                borderRadius: '4px',
                marginBottom: '16px',
                border: '1px solid #f5c6cb'
              }}>
                {importError}
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-end', 
              gap: '12px' 
            }}>
              <button
                onClick={handleImportCancel}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.95em'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleImportConfirm}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#2ecc71',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.95em'
                }}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(5, 1fr)', 
        gap: '20px',
        alignItems: 'stretch'
      }}>
        {projects.map((project, index) => (
          <div
            key={index}
            className='project-card'
            onClick={() => navigate(`/projects/${index}`)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <h3 style={{ 
                margin: 0, 
                color: '#2c3e50',
                flex: 1
              }}>
                {project.name}
              </h3>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleExportProject(project, index);
                  }}
                  className="button-style-small export-project-button"
                >
                  Export
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProject(index);
                  }}
                  className="icon-btn"
                >
                  <img 
                    src={editIcon} 
                    alt="Edit" 
                    style={{ width: '16px', height: '16px' }}
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProject(index);
                  }}
                  className="icon-btn"
                >
                  <img 
                    src={deleteIcon} 
                    alt="Delete" 
                    style={{ width: '16px', height: '16px' }}
                  />
                </button>
              </div>
            </div>
            <div style={{ marginBottom: '15px', flex: 1 }}>
              <p style={{ color: '#7f8c8d', fontSize: '0.9em', marginBottom: '5px' }}>
                <strong>Situation:</strong> {project.description || 'No description provided'}
              </p>
              <p style={{ color: '#7f8c8d', fontSize: '0.9em', marginBottom: '5px' }}>
                <strong>Robot Type:</strong> {project.robotType || 'Not specified'}
              </p>
              <p style={{ color: '#7f8c8d', fontSize: '0.9em', marginBottom: '5px' }}>
                <strong>Study Type:</strong> {project.studyType || 'Not specified'}
              </p>
              <p style={{ color: '#7f8c8d', fontSize: '0.9em' }}>
                <strong>Participants:</strong> {project.participants?.length || 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects; 