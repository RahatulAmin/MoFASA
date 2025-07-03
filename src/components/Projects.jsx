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
  const [scopes, setScopes] = useState([{ scopeNumber: 1, scopeText: '' }]);
  const [editingProject, setEditingProject] = useState(null);
  const [editName, setEditName] = useState('');
  const [editScopes, setEditScopes] = useState([{ scopeNumber: 1, scopeText: '' }]);
  const [importError, setImportError] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importedProjectData, setImportedProjectData] = useState(null);
  const [importProjectName, setImportProjectName] = useState('');
  
  // Questionnaire configuration state
  const [showQuestionnaireStep, setShowQuestionnaireStep] = useState(false);
  const [questions, setQuestions] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [questionnaireError, setQuestionnaireError] = useState(null);
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  const handleAddScope = () => {
    if (scopes.length < 5) {
      setScopes([...scopes, { scopeNumber: scopes.length + 1, scopeText: '' }]);
    }
  };

  const handleRemoveScope = (index) => {
    if (scopes.length > 1) {
      const newScopes = scopes.filter((_, i) => i !== index);
      // Renumber scopes
      const renumberedScopes = newScopes.map((scope, i) => ({
        ...scope,
        scopeNumber: i + 1
      }));
      setScopes(renumberedScopes);
    }
  };

  const handleScopeChange = (index, value) => {
    const newScopes = [...scopes];
    newScopes[index].scopeText = value;
    setScopes(newScopes);
  };

  const handleEditScopeChange = (index, value) => {
    const newEditScopes = [...editScopes];
    newEditScopes[index].scopeText = value;
    setEditScopes(newEditScopes);
  };

  const handleEditAddScope = () => {
    if (editScopes.length < 5) {
      setEditScopes([...editScopes, { scopeNumber: editScopes.length + 1, scopeText: '' }]);
    }
  };

  const handleEditRemoveScope = (index) => {
    if (editScopes.length > 1) {
      const newEditScopes = editScopes.filter((_, i) => i !== index);
      // Renumber scopes
      const renumberedEditScopes = newEditScopes.map((scope, i) => ({
        ...scope,
        scopeNumber: i + 1
      }));
      setEditScopes(renumberedEditScopes);
    }
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const targetParticipants = parseInt(newProjectParticipants) || 0;
      
      // Create scopes with participants
      const projectScopes = scopes.map(scope => ({
        ...scope,
        participants: Array.from({ length: targetParticipants }, (_, index) => ({
          id: `P${index + 1}`,
          participantId: `P${index + 1}`, // Add participantId field for consistency
          name: `P${index + 1}`,
          answers: {},
          summary: ''
        })),
        isActive: scope.scopeNumber === 1 // First scope is active by default
      }));

      addProject({
        name: newProjectName,
        description: newProjectDescription,
        targetParticipants,
        robotType: newProjectRobotType,
        studyType: newProjectStudyType,
        scopes: projectScopes,
        rules: []
      });

      setNewProjectName('');
      setNewProjectDescription('');
      setNewProjectParticipants('');
      setNewProjectRobotType('');
      setNewProjectStudyType('');
      setScopes([{ scopeNumber: 1, scopeText: '' }]);
      setIsAddProjectOpen(false);
    }
  };

  const handleEditProject = (index) => {
    setEditingProject(index);
    setEditName(projects[index].name);
    setNewProjectDescription(projects[index].description || '');
    setNewProjectRobotType(projects[index].robotType || '');
    setNewProjectStudyType(projects[index].studyType || '');
    
    // Load existing scopes
    const existingScopes = projects[index].scopes || [];
    if (existingScopes.length > 0) {
      setEditScopes(existingScopes.map(scope => ({
        scopeNumber: scope.scopeNumber,
        scopeText: scope.scopeText || ''
      })));
    } else {
      setEditScopes([{ scopeNumber: 1, scopeText: '' }]);
    }
  };

  const handleSaveEdit = (index) => {
    if (editName.trim()) {
      // Get the target participants count from the original project
      // Try multiple sources to get the participant count
      let targetParticipants = projects[index].targetParticipants || 0;
      
      // If targetParticipants is 0, try to get it from existing scopes
      if (targetParticipants === 0 && projects[index].scopes && projects[index].scopes.length > 0) {
        const existingScope = projects[index].scopes[0]; // Use first scope as reference
        targetParticipants = existingScope.participants ? existingScope.participants.length : 0;
      }
      
      // Create updated scopes with participants preserved or created
      const updatedScopes = editScopes.map(editScope => {
        // Find the existing scope with the same scope number
        const existingScope = projects[index].scopes?.find(s => s.scopeNumber === editScope.scopeNumber);
        
        if (existingScope) {
          // Preserve existing scope with its participants
          const preservedParticipants = (existingScope.participants || []).map(participant => ({
            ...participant,
            id: participant.id || participant.participantId, // Ensure id field exists
            participantId: participant.participantId || participant.id // Ensure participantId field exists
          }));
          
          return {
            ...editScope,
            participants: preservedParticipants,
            isActive: existingScope.isActive || editScope.scopeNumber === 1
          };
        } else {
          // Create new scope with new participants
          const newParticipants = Array.from({ length: targetParticipants }, (_, participantIndex) => ({
            id: `P${participantIndex + 1}`,
            participantId: `P${participantIndex + 1}`, // Add participantId field for consistency
            name: `P${participantIndex + 1}`,
            answers: {},
            summary: ''
          }));
          
          return {
            ...editScope,
            participants: newParticipants,
            isActive: editScope.scopeNumber === 1 // First scope is active by default
          };
        }
      });

      editProject(index, {
        ...projects[index],
        name: editName.trim(),
        description: newProjectDescription,
        robotType: newProjectRobotType,
        studyType: newProjectStudyType,
        scopes: updatedScopes
      });
      setEditingProject(null);
      setEditName('');
      setNewProjectDescription('');
      setNewProjectRobotType('');
      setNewProjectStudyType('');
      setEditScopes([{ scopeNumber: 1, scopeText: '' }]);
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
        
        // Validate imported data - check for both old and new format
        if (!importedData.name) {
          throw new Error('Invalid project data format: missing project name');
        }

        // Check if it's the new scope-based format or old format
        const hasScopes = importedData.scopes && Array.isArray(importedData.scopes) && importedData.scopes.length > 0;
        const hasOldParticipants = importedData.participants && Array.isArray(importedData.participants);
        
        if (!hasScopes && !hasOldParticipants) {
          throw new Error('Invalid project data format: missing scopes or participants');
        }

        // Convert old format to new format if needed
        let convertedData = importedData;
        if (hasOldParticipants && !hasScopes) {
          console.log('Converting old format to new scope-based format');
          convertedData = {
            ...importedData,
            scopes: [{
              scopeNumber: 1,
              scopeText: 'Imported scope',
              isActive: true,
              participants: importedData.participants.map(p => ({
                ...p,
                id: p.id || p.participantId,
                participantId: p.participantId || p.id
              })),
              rules: importedData.rules || [],
              situationDesign: importedData.situationDesign || null
            }],
            // Remove old fields
            participants: undefined,
            rules: undefined,
            situationDesign: undefined
          };
        }

        // Always show the import dialog with the original name as default
        setImportedProjectData(convertedData);
        setImportProjectName(convertedData.name);
        setImportDialogOpen(true);
      } catch (error) {
        console.error('Error importing project:', error);
        setImportError(`Failed to import project: ${error.message}`);
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

  // Load questions for questionnaire configuration
  const loadQuestionsForConfiguration = async () => {
    try {
      setQuestionsLoading(true);
      setQuestionnaireError(null);
      const questionsData = await window.electronAPI.getAllQuestions();
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      setQuestionnaireError('Failed to load questions');
    } finally {
      setQuestionsLoading(false);
    }
  };

  // Handle next button click to show questionnaire step
  const handleNextToQuestionnaire = () => {
    if (newProjectName.trim()) {
      setShowQuestionnaireStep(true);
      loadQuestionsForConfiguration();
    }
  };

  // Handle back button click to return to project details
  const handleBackToProjectDetails = () => {
    setShowQuestionnaireStep(false);
    setQuestions({});
    setQuestionnaireError(null);
  };

  // Handle questionnaire toggle
  const handleQuestionnaireToggle = (questionId, currentStatus) => {
    console.log('Toggling question:', questionId, 'from', currentStatus, 'to', !currentStatus);
    
    // Clear any validation errors when user makes changes
    setQuestionnaireError(null);
    
    // Check if this would disable the last question in a section
    if (currentStatus) { // If we're about to disable a question
      const questionSection = Object.keys(questions).find(section => 
        questions[section].some(q => q.questionId === questionId)
      );
      
      if (questionSection) {
        const enabledQuestionsInSection = questions[questionSection].filter(q => 
          q.questionId !== questionId && q.isEnabled !== false
        );
        
        console.log(`Section ${questionSection}: ${enabledQuestionsInSection.length} questions would remain enabled`);
        
        if (enabledQuestionsInSection.length === 0) {
          const errorMsg = `Cannot disable the last question in ${questionSection} section. At least one question must remain enabled.`;
          console.log('Validation error:', errorMsg);
          setQuestionnaireError(errorMsg);
          return;
        }
      }
    }
    
    setQuestions(prevQuestions => {
      const updated = { ...prevQuestions };
      Object.keys(updated).forEach(section => {
        updated[section] = updated[section].map(q => 
          q.questionId === questionId ? { ...q, isEnabled: !currentStatus } : q
        );
      });
      console.log('Updated questions state:', updated);
      return updated;
    });
  };

  // Handle final project creation with questionnaire settings
  const handleCreateProjectWithQuestionnaire = async () => {
    if (newProjectName.trim()) {
      console.log('Starting project creation with questionnaire settings...');
      console.log('Questions state:', questions);
      
      // Validate that at least one question per section is enabled
      const validationErrors = [];
      for (const [sectionName, sectionQuestions] of Object.entries(questions)) {
        const enabledQuestions = sectionQuestions.filter(q => q.isEnabled !== false);
        console.log(`Section ${sectionName}: ${enabledQuestions.length} enabled questions out of ${sectionQuestions.length} total`);
        if (enabledQuestions.length === 0) {
          validationErrors.push(`${sectionName} section must have at least one enabled question`);
        }
      }
      
      if (validationErrors.length > 0) {
        console.log('Validation errors:', validationErrors);
        setQuestionnaireError(validationErrors.join('. '));
        return;
      }

      setIsCreatingProject(true);
      setQuestionnaireError(null);

      try {
        const targetParticipants = parseInt(newProjectParticipants) || 0;
        
        // Create scopes with participants
        const projectScopes = scopes.map(scope => ({
          ...scope,
          participants: Array.from({ length: targetParticipants }, (_, index) => ({
            id: `P${index + 1}`,
            participantId: `P${index + 1}`, // Add participantId field for consistency
            name: `P${index + 1}`,
            answers: {},
            summary: ''
          })),
          isActive: scope.scopeNumber === 1 // First scope is active by default
        }));

        // Create the project first
        const newProject = {
          name: newProjectName,
          description: newProjectDescription,
          targetParticipants,
          robotType: newProjectRobotType,
          studyType: newProjectStudyType,
          scopes: projectScopes,
          rules: []
        };

        console.log('Creating project:', newProject.name);
        
        // Add the project and wait for it to complete
        await addProject(newProject);
        
        console.log('Project created, now getting updated projects list...');
        
        // Now get the updated projects list to find the new project
        const updatedProjects = await window.electronAPI.getProjects();
        const newProjectData = updatedProjects.find(p => p.name === newProjectName);
        
        if (newProjectData && newProjectData.id) {
          console.log('Found new project with ID:', newProjectData.id);
          
          // Save questionnaire settings for the new project
          let disabledCount = 0;
          for (const [section, sectionQuestions] of Object.entries(questions)) {
            for (const question of sectionQuestions) {
              if (question.isEnabled === false) {
                console.log('Disabling question:', question.questionId, 'for project:', newProjectData.id);
                await window.electronAPI.updateProjectQuestionStatus(
                  newProjectData.id, 
                  question.questionId, 
                  false
                );
                disabledCount++;
              }
            }
          }
          console.log(`Questionnaire settings saved successfully. Disabled ${disabledCount} questions.`);
        } else {
          console.error('Could not find new project after creation');
        }

        // Reset form
        setNewProjectName('');
        setNewProjectDescription('');
        setNewProjectParticipants('');
        setNewProjectRobotType('');
        setNewProjectStudyType('');
        setScopes([{ scopeNumber: 1, scopeText: '' }]);
        setShowQuestionnaireStep(false);
        setQuestions({});
        setQuestionnaireError(null);
        setIsAddProjectOpen(false);
      } catch (error) {
        console.error('Error during project creation:', error);
        setQuestionnaireError('Failed to create project. Please try again.');
      } finally {
        setIsCreatingProject(false);
      }
    }
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
            width: showQuestionnaireStep ? '800px' : '500px',
            maxWidth: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            {!showQuestionnaireStep ? (
              // Project Details Step
              <>
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
                
                {/* Scope Fields */}
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Scopes:</label>
                  {scopes.map((scope, index) => (
                    <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ 
                        minWidth: '60px', 
                        fontWeight: 'bold', 
                        color: '#2c3e50',
                        fontSize: '0.9em'
                      }}>
                        Scope {scope.scopeNumber}:
                      </span>
                      <input
                        type="text"
                        value={scope.scopeText}
                        onChange={(e) => handleScopeChange(index, e.target.value)}
                        placeholder="Enter scope description..."
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '4px',
                          border: '1px solid #ddd',
                          fontSize: '0.9em'
                        }}
                      />
                      {scopes.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveScope(index)}
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.8em'
                          }}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {scopes.length < 5 && (
                    <button
                      type="button"
                      onClick={handleAddScope}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        marginTop: '5px'
                      }}
                    >
                      + Add New Scope
                    </button>
                  )}
                  {scopes.length >= 5 && (
                    <p style={{ 
                      color: '#7f8c8d', 
                      fontSize: '0.8em', 
                      marginTop: '5px',
                      fontStyle: 'italic'
                    }}>
                      Maximum 5 scopes allowed
                    </p>
                  )}
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
                    onClick={handleNextToQuestionnaire}
                    disabled={!newProjectName.trim()}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: newProjectName.trim() ? 'pointer' : 'not-allowed',
                      opacity: newProjectName.trim() ? 1 : 0.6
                    }}
                  >
                    Next
                  </button>
                </div>
              </>
            ) : (
              // Questionnaire Configuration Step
              <>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ marginBottom: '8px' }}>Configure Questionnaire</h3>
                  <p style={{ color: '#7f8c8d', fontSize: '0.9em', margin: 0 }}>
                    Enable or disable questions for <strong>{newProjectName}</strong>. At least one question per section must remain enabled.
                  </p>
                </div>

                {questionnaireError && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#fee',
                    color: '#e74c3c',
                    borderRadius: '6px',
                    border: '1px solid #fcc',
                    fontSize: '0.9em'
                  }}>
                    {questionnaireError}
                  </div>
                )}

                {isCreatingProject && (
                  <div style={{
                    marginBottom: '16px',
                    padding: '12px 16px',
                    backgroundColor: '#e8f5e8',
                    color: '#27ae60',
                    borderRadius: '6px',
                    border: '1px solid #c3e6cb',
                    fontSize: '0.9em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #27ae60',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }}></div>
                    Creating project and saving questionnaire settings...
                  </div>
                )}

                {questionsLoading ? (
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'center', 
                    alignItems: 'center', 
                    height: '200px',
                    fontFamily: 'Lexend, sans-serif'
                  }}>
                    Loading questions...
                  </div>
                ) : (
                  <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '20px' }}>
                    {Object.entries(questions)
                      .sort(([a], [b]) => {
                        // Define the correct order
                        const order = ['Situation', 'Identity', 'Definition of Situation', 'Rule Selection', 'Decision'];
                        const aIndex = order.indexOf(a);
                        const bIndex = order.indexOf(b);
                        return aIndex - bIndex;
                      })
                      .map(([sectionName, sectionQuestions]) => {
                        const enabledQuestions = sectionQuestions.filter(q => q.isEnabled !== false);
                        const hasValidationError = enabledQuestions.length === 0;
                      
                      return (
                        <div key={sectionName} style={{ marginBottom: '20px' }}>
                          <h4 style={{ 
                            fontSize: '1.1em', 
                            color: hasValidationError ? '#e74c3c' : '#2c3e50', 
                            marginBottom: '10px',
                            fontWeight: '600',
                            padding: '6px 10px',
                            backgroundColor: hasValidationError ? '#fee' : '#f8f9fa',
                            borderRadius: '4px',
                            border: `1px solid ${hasValidationError ? '#fcc' : '#e9ecef'}`
                          }}>
                            {sectionName}
                            {hasValidationError && (
                              <span style={{ 
                                fontSize: '0.8em', 
                                color: '#e74c3c', 
                                marginLeft: '8px',
                                fontWeight: 'normal'
                              }}>
                                (At least one question must be enabled)
                              </span>
                            )}
                          </h4>
                          
                          <div style={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '4px', 
                            border: `1px solid ${hasValidationError ? '#fcc' : '#e0e0e0'}`,
                            overflow: 'hidden'
                          }}>
                            {sectionQuestions.map((question, index) => (
                              <div key={question.questionId} style={{
                                padding: '10px 14px',
                                borderBottom: index < sectionQuestions.length - 1 ? '1px solid #f0f0f0' : 'none',
                                backgroundColor: question.isEnabled !== false ? '#fff' : '#f8f9fa',
                                opacity: question.isEnabled !== false ? 1 : 0.7,
                                transition: 'all 0.2s ease'
                              }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                  {/* Toggle Switch */}
                                  <label style={{ 
                                    position: 'relative',
                                    display: 'inline-block',
                                    width: '40px',
                                    height: '18px',
                                    flexShrink: 0,
                                    marginTop: '2px'
                                  }}>
                                    <input
                                      type="checkbox"
                                      checked={question.isEnabled !== false}
                                      onChange={() => handleQuestionnaireToggle(question.questionId, question.isEnabled !== false)}
                                      style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                      position: 'absolute',
                                      cursor: 'pointer',
                                      top: 0,
                                      left: 0,
                                      right: 0,
                                      bottom: 0,
                                      backgroundColor: question.isEnabled !== false ? '#27ae60' : '#ccc',
                                      transition: '.3s',
                                      borderRadius: '18px'
                                    }}>
                                      <span style={{
                                        position: 'absolute',
                                        content: '""',
                                        height: '14px',
                                        width: '14px',
                                        left: '2px',
                                        bottom: '2px',
                                        backgroundColor: 'white',
                                        transition: '.3s',
                                        borderRadius: '50%',
                                        transform: question.isEnabled !== false ? 'translateX(22px)' : 'translateX(0)'
                                      }} />
                                    </span>
                                  </label>

                                  {/* Question Content */}
                                  <div style={{ flex: 1 }}>
                                    <p style={{ 
                                      fontSize: '0.85em', 
                                      color: '#2c3e50', 
                                      lineHeight: '1.4',
                                      margin: '0 0 4px 0'
                                    }}>
                                      {question.questionText}
                                    </p>
                                    
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      <span style={{ 
                                        fontSize: '0.7em', 
                                        color: '#7f8c8d',
                                        backgroundColor: '#ecf0f1',
                                        padding: '1px 4px',
                                        borderRadius: '8px'
                                      }}>
                                        {question.questionType}
                                      </span>
                                      
                                      {question.options && (
                                        <span style={{ 
                                          fontSize: '0.7em', 
                                          color: '#7f8c8d',
                                          backgroundColor: '#e8f5e8',
                                          padding: '1px 4px',
                                          borderRadius: '8px'
                                        }}>
                                          {question.options.length} options
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary of enabled/disabled questions */}
                {/* {!questionsLoading && Object.keys(questions).length > 0 && (
                  <div style={{ 
                    marginBottom: '20px', 
                    padding: '12px 16px', 
                    backgroundColor: '#f8f9fa', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef'
                  }}>
                    <h5 style={{ 
                      fontSize: '0.9em', 
                      color: '#2c3e50', 
                      marginBottom: '8px',
                      fontWeight: '600'
                    }}>
                      Question Summary
                    </h5>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                      {Object.entries(questions).map(([sectionName, sectionQuestions]) => {
                        const enabledCount = sectionQuestions.filter(q => q.isEnabled !== false).length;
                        const totalCount = sectionQuestions.length;
                        const disabledCount = totalCount - enabledCount;
                        
                        return (
                          <div key={sectionName} style={{
                            padding: '6px 10px',
                            backgroundColor: enabledCount === 0 ? '#fee' : '#e8f5e8',
                            borderRadius: '4px',
                            border: `1px solid ${enabledCount === 0 ? '#fcc' : '#c3e6cb'}`
                          }}>
                            <span style={{ 
                              fontSize: '0.8em', 
                              fontWeight: '600',
                              color: enabledCount === 0 ? '#e74c3c' : '#27ae60'
                            }}>
                              {sectionName}:
                            </span>
                            <span style={{ 
                              fontSize: '0.8em', 
                              color: '#7f8c8d',
                              marginLeft: '4px'
                            }}>
                              {enabledCount} enabled, {disabledCount} disabled
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )} */}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    onClick={handleBackToProjectDetails}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Back
                  </button>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => setIsAddProjectOpen(false)}
                      disabled={isCreatingProject}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isCreatingProject ? 'not-allowed' : 'pointer',
                        opacity: isCreatingProject ? 0.6 : 1
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateProjectWithQuestionnaire}
                      disabled={isCreatingProject}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2ecc71',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isCreatingProject ? 'not-allowed' : 'pointer',
                        opacity: isCreatingProject ? 0.6 : 1
                      }}
                    >
                      {isCreatingProject ? 'Creating Project...' : 'Create Project'}
                    </button>
                  </div>
                </div>
              </>
            )}
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
            
            {/* Scope Fields */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Scopes:</label>
              {editScopes.map((scope, index) => (
                <div key={index} style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ 
                    minWidth: '60px', 
                    fontWeight: 'bold', 
                    color: '#2c3e50',
                    fontSize: '0.9em'
                  }}>
                    Scope {scope.scopeNumber}:
                  </span>
                  <input
                    type="text"
                    value={scope.scopeText}
                    onChange={(e) => handleEditScopeChange(index, e.target.value)}
                    placeholder="Enter scope description..."
                    style={{
                      flex: 1,
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ddd',
                      fontSize: '0.9em'
                    }}
                  />
                  {editScopes.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleEditRemoveScope(index)}
                      style={{
                        padding: '4px 8px',
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.8em'
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {editScopes.length < 5 && (
                <button
                  type="button"
                  onClick={handleEditAddScope}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    marginTop: '5px'
                  }}
                >
                  + Add New Scope
                </button>
              )}
              {editScopes.length >= 5 && (
                <p style={{ 
                  color: '#7f8c8d', 
                  fontSize: '0.8em', 
                  marginTop: '5px',
                  fontStyle: 'italic'
                }}>
                  Maximum 5 scopes allowed
                </p>
              )}
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
                Note: Participant count cannot be changed from here. You can modify scopes and their descriptions.
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
              <p style={{ color: '#7f8c8d', fontSize: '0.9em', marginBottom: '5px' }}>
                <strong>Scopes:</strong> {project.scopes?.length || 0}
              </p>
              <p style={{ color: '#7f8c8d', fontSize: '0.9em' }}>
                <strong>Participants:</strong> {project.scopes?.[0]?.participants?.length || 0}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects; 