import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import editIcon from '../images/edit.png';
import deleteIcon from '../images/trash.png';
import PersonaeFramework from './PersonaeFramework';
import PersonaeMappingView from './PersonaeMappingView';
import BehavioralDiversityView from './BehavioralDiversityView';
import SituationDesignView from './SituationDesignView';
import { SECTIONS, connectionPairs } from '../constants/frameAnalysis';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Other'];

const ProjectDetails = ({ projects, updateProjectDescription, editProject, deleteProject }) => {
  const { projectId } = useParams();
  const idx = parseInt(projectId, 10);
  const project = projects[idx];
  const navigate = useNavigate();

  const [descEditMode, setDescEditMode] = useState(false);
  const [descDraft, setDescDraft] = useState(project?.description || '');
  const [nameEditMode, setNameEditMode] = useState(false);
  const [nameDraft, setNameDraft] = useState(project?.name || '');
  const [selectedScope, setSelectedScope] = useState(0); // Index of selected scope
  const [scopeDescEditMode, setScopeDescEditMode] = useState(false);
  const [scopeDescDraft, setScopeDescDraft] = useState('');
  const [participants, setParticipants] = useState([]);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [participantDraft, setParticipantDraft] = useState('');
  const [nameError, setNameError] = useState('');
  const [currentView, setCurrentView] = useState('details'); // 'details', 'personae', 'behavioral', or 'situation'
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [sortBy, setSortBy] = useState("");
  const [statsSort, setStatsSort] = useState(""); // New state for stats sorting
  const [personaeView, setPersonaeView] = useState('framework');
  const [selectedAgeRanges, setSelectedAgeRanges] = useState([]);
  const [selectedGenders, setSelectedGenders] = useState([]);
  const [situationSuggestions, setSituationSuggestions] = useState({
    robotChanges: '',
    environmentalChanges: ''
  });
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [editingSection, setEditingSection] = useState(null); // 'robot' or 'environment' or null
  const [manualInput, setManualInput] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [showMissingSummariesDialog, setShowMissingSummariesDialog] = useState(false);
  const [missingSummariesList, setMissingSummariesList] = useState([]);
  const [isPdfGenerating, setIsPdfGenerating] = useState(false);
  const frameworkRef = useRef(null);
  const summaryRef = useRef(null);
  const behavioralRef = useRef(null);
  const [selectedRule, setSelectedRule] = useState(null);
  const [robotDraft, setRobotDraft] = useState('');
  const [environmentDraft, setEnvironmentDraft] = useState('');
  const [expandedParticipants, setExpandedParticipants] = useState(new Set());

  if (!project) {
    return <div className="left-panel"><h2>Project Not Found</h2></div>;
  }

  // Get current scope
  const currentScope = project.scopes?.[selectedScope];
  
  // Keep participants in sync with current scope
  React.useEffect(() => {
    if (currentScope) {
      setParticipants(currentScope.participants || []);
      setSituationSuggestions({
        robotChanges: currentScope.situationDesign?.robotChanges || '',
        environmentalChanges: currentScope.situationDesign?.environmentalChanges || ''
      });
      setRobotDraft(currentScope.situationDesign?.robotChanges || '');
      setEnvironmentDraft(currentScope.situationDesign?.environmentalChanges || '');
    }
  }, [currentScope]);

  // Reset selected scope when project changes
  React.useEffect(() => {
    setSelectedScope(0);
  }, [projectId]);

  // Reset states when project changes
  useEffect(() => {
    setSelectedParticipant(null);
  }, [projectId]);

  const handleDescSave = () => {
    updateProjectDescription(idx, descDraft);
    setDescEditMode(false);
  };

  const handleScopeDescSave = () => {
    if (currentScope) {
      const updatedScopes = [...project.scopes];
      updatedScopes[selectedScope] = {
        ...updatedScopes[selectedScope],
        scopeText: scopeDescDraft
      };
      
      const updatedProject = {
        ...project,
        scopes: updatedScopes
      };
      
      editProject(idx, updatedProject);
      setScopeDescEditMode(false);
    }
  };

  const handleNameSave = () => {
    if (nameDraft.trim()) {
      editProject(idx, nameDraft.trim());
      setNameEditMode(false);
    }
  };

  const handleDelete = () => {
    deleteProject(idx);
    navigate('/projects');
  };

  // Participants logic
  const handleAddParticipant = () => {
    // Find the highest participant number across all scopes
    let highestNumber = 0;
    project.scopes.forEach(scope => {
      if (scope.participants) {
        scope.participants.forEach(p => {
          const match = p.name.match(/^P(\d+)(?:_\d+)?$/);
          if (match) {
            highestNumber = Math.max(highestNumber, parseInt(match[1]));
          }
        });
      }
    });
    
    const newParticipantNumber = highestNumber + 1;
    const newParticipant = {
      id: `P${newParticipantNumber}`,
      participantId: `P${newParticipantNumber}`, // Add participantId for consistency
      name: `P${newParticipantNumber}`,
      answers: {},
      summary: ''
    };
    
    // Update all scopes to include the new participant
    const updatedScopes = project.scopes.map(scope => ({
      ...scope,
      participants: [...(scope.participants || []), newParticipant]
    }));
    
    // Update the project with the new scopes
    const updatedProject = {
      ...project,
      scopes: updatedScopes
    };
    
    editProject(idx, updatedProject);
    setParticipants([...participants, newParticipant]);
  };

  const handleEditParticipant = (id, name) => {
    setEditingParticipant(id);
    setParticipantDraft(name);
  };

  const handleSaveParticipant = (id) => {
    if (participantDraft.trim()) {
      // Check for duplicate names across all scopes
      let isDuplicate = false;
      project.scopes.forEach(scope => {
        if (scope.participants) {
          const duplicateInScope = scope.participants.some(p => p.id !== id && p.name === participantDraft.trim());
          if (duplicateInScope) {
            isDuplicate = true;
          }
        }
      });
      
      if (isDuplicate) {
        setNameError('A participant with this name already exists in this project.');
        return;
      }
      
      // Update the participant in all scopes
      const updatedScopes = project.scopes.map(scope => ({
        ...scope,
        participants: (scope.participants || []).map(p => 
          p.id === id ? { ...p, name: participantDraft.trim() } : p
        )
      }));
      
      // Update the project with the new scopes
      const updatedProject = {
        ...project,
        scopes: updatedScopes
      };
      
      editProject(idx, updatedProject);
      setParticipants(updatedScopes[selectedScope].participants || []);
      setEditingParticipant(null);
      setParticipantDraft('');
      setNameError('');
    }
  };

  const handleCancelEdit = () => {
    setEditingParticipant(null);
    setParticipantDraft('');
    setNameError('');
  };

  const handleDeleteParticipant = (id) => {
    // Remove participant from all scopes
    const updatedScopes = project.scopes.map(scope => ({
      ...scope,
      participants: (scope.participants || []).filter(p => p.id !== id)
    }));
    
    // Update the project with the new scopes
    const updatedProject = {
      ...project,
      scopes: updatedScopes
    };
    
    editProject(idx, updatedProject);
    setParticipants(updatedScopes[selectedScope].participants || []);
  };

  const handleParticipantClick = (id) => {
    navigate(`/projects/${idx}/participants/${id}`);
  };



  // Add this function to check if all participants have summaries
  const checkAllSummariesGenerated = () => {
    return participants.every(p => p.summary && p.summary.trim() !== '');
  };

  // Add this function to get participants without summaries
  const getParticipantsWithoutSummaries = () => {
    return participants.filter(p => !p.summary || p.summary.trim() === '');
  };

  // Add this function to handle situation design generation
  const handleGenerateSituationDesign = async () => {
    if (!checkAllSummariesGenerated()) {
      const missingParticipants = getParticipantsWithoutSummaries();
      setMissingSummariesList(missingParticipants);
      setShowMissingSummariesDialog(true);
      return;
    }

    setIsGeneratingSuggestions(true);
    setGenerationProgress(0);

    try {
      // Start progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Collect all summaries
      const allSummaries = participants
        .map(p => `${p.id}:\n${p.summary}`)
        .join('\n\n');

      const prompt = `Based on the following participant summaries from a human-robot interaction study, suggest specific changes that could improve the interaction scenario. Focus on two main areas:

      1. Robot Changes: Suggest modifications to the robot's behavior, appearance, or capabilities
      2. Environmental Changes: Suggest modifications to the physical space, context, or setting of the interaction

      Participant Summaries:
      ${allSummaries}

      Please provide concise, actionable suggestions in these two categories. Each suggestion should be directly tied to insights from the participant summaries.`;

      const response = await window.electronAPI.generateWithDeepSeek(prompt);
      
      // Clear the progress interval
      clearInterval(progressInterval);
      setGenerationProgress(100);

      // Parse the response into two sections
      const sections = response.split('\n\n');
      const robotChanges = sections.find(s => s.toLowerCase().includes('robot changes'))?.replace('Robot Changes:', '').trim() || '';
      const environmentalChanges = sections.find(s => s.toLowerCase().includes('environmental changes'))?.replace('Environmental Changes:', '').trim() || '';

      setSituationSuggestions({
        robotChanges,
        environmentalChanges
      });

      // Reset progress after a short delay
      setTimeout(() => {
        setGenerationProgress(0);
      }, 1000);

    } catch (error) {
      console.error('Failed to generate situation design suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
      setGenerationProgress(0);
    } finally {
      setIsGeneratingSuggestions(false);
    }
  };

  // Add this function to save situation suggestions to project
  const saveSituationSuggestions = (newSuggestions) => {
    // Update the current scope's situation design
    const updatedScopes = [...project.scopes];
    updatedScopes[selectedScope] = {
      ...updatedScopes[selectedScope],
      situationDesign: newSuggestions
    };
    
    // Update the project with the new scopes
    const updatedProject = {
      ...project,
      scopes: updatedScopes
    };
    
    editProject(idx, updatedProject);
    setSituationSuggestions(newSuggestions);
  };

  // Update the save handlers to persist data
  const handleSaveRobotChanges = () => {
    const newSuggestions = {
      ...situationSuggestions,
      robotChanges: manualInput
    };
    setSituationSuggestions(newSuggestions);
    saveSituationSuggestions(newSuggestions);
    setEditingSection(null);
    setManualInput('');
  };

  const handleSaveEnvironmentalChanges = () => {
    const newSuggestions = {
      ...situationSuggestions,
      environmentalChanges: manualInput
    };
    setSituationSuggestions(newSuggestions);
    saveSituationSuggestions(newSuggestions);
    setEditingSection(null);
    setManualInput('');
  };



  const generatePDF = async () => {
    if (currentView === 'personae' && personaeView === 'framework' && !selectedParticipant) {
      alert('Please select a participant first.');
      return;
    }

    setIsPdfGenerating(true);
    try {
      let elementToCapture;
      let fileName;
      let bgColor = '#ffffff';
      let padding = 0;

      if (currentView === 'behavioral') {
        elementToCapture = behavioralRef.current;
        fileName = `${project.name}_behavioral_diversity.pdf`;
        padding = 2; // Add padding for behavioral view
      } else if (currentView === 'personae') {
        elementToCapture = personaeView === 'framework' ? frameworkRef.current : summaryRef.current;
        fileName = personaeView === 'framework' 
          ? `${project.name}_${selectedParticipant.name}_framework.pdf`
          : `${project.name}_personae_summary.pdf`;
        if (personaeView === 'framework') {
          bgColor = '#2c3e50';
        }
      }

      // Create a wrapper div for padding
      const wrapper = document.createElement('div');
      wrapper.style.padding = `${padding}px`;
      wrapper.style.backgroundColor = bgColor;
      wrapper.style.position = 'absolute';
      wrapper.style.left = '-9999px';
      wrapper.style.top = '0';
      wrapper.style.width = `${elementToCapture.scrollWidth}px`;
      document.body.appendChild(wrapper);

      // Clone the content
      const clone = elementToCapture.cloneNode(true);
      wrapper.appendChild(clone);

      // Handle charts if in behavioral view
      if (currentView === 'behavioral') {
        const originalCanvases = elementToCapture.getElementsByTagName('canvas');
        const clonedCanvases = clone.getElementsByTagName('canvas');
        
        for (let i = 0; i < originalCanvases.length; i++) {
          const originalCanvas = originalCanvases[i];
          const clonedCanvas = clonedCanvases[i];
          
          // Copy the canvas content
          const context = clonedCanvas.getContext('2d');
          clonedCanvas.width = originalCanvas.width;
          clonedCanvas.height = originalCanvas.height;
          context.drawImage(originalCanvas, 0, 0);
        }
      }

      // Capture the content
      const canvas = await html2canvas(wrapper, {
        scale: 2,
        backgroundColor: bgColor,
        logging: false,
        useCORS: true,
        allowTaint: true
      });

      // Clean up
      document.body.removeChild(wrapper);
      
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions to fit content
      const pdfWidth = 595; // A4 width in points
      const pdfHeight = 842; // A4 height in points
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate scaling to fit within A4 with margins
      const margin = 2; // points
      const maxWidth = pdfWidth - margin;
      const maxHeight = pdfHeight - margin;
      
      let scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
      
      // Create PDF with A4 size
      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      // Calculate centered position
      const x = (pdf.internal.pageSize.getWidth() - (imgWidth * scale)) / 2;
      const y = (pdf.internal.pageSize.getHeight() - (imgHeight * scale)) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth * scale, imgHeight * scale);
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
    setIsPdfGenerating(false);
  };

  const handleDeleteRule = (rule) => {
    if (!currentScope) return;
    const updatedRules = (currentScope.rules || []).filter(r => r !== rule);
    
    // Update all participants to remove this rule from their selections and decisions
    const updatedParticipants = participants.map(p => {
      const currentRules = p.answers?.['Rule Selection']?.selectedRules || [];
      if (currentRules.includes(rule)) {
        const newSelectedRules = currentRules.filter(r => r !== rule);
        // Create a new answers object without the deleted rule's decision
        const updatedAnswers = { ...p.answers };
        if (updatedAnswers['Decision']) {
          delete updatedAnswers['Decision'][rule];
        }
        return {
          ...p,
          answers: {
            ...updatedAnswers,
            'Rule Selection': {
              ...updatedAnswers['Rule Selection'],
              selectedRules: newSelectedRules
            }
          }
        };
      }
      return p;
    });

    // Update the current scope with new rules and updated participants
    const updatedScopes = project.scopes.map((scope, scopeIndex) => 
      scopeIndex === selectedScope ? {
        ...scope,
        rules: updatedRules,
        participants: updatedParticipants
      } : scope
    );
    
    // Update project with new scopes
    updateProjectRules(idx, updatedScopes);
    
    // Close the dialog
    setRuleToDelete(null);
  };

  const handleScopeSelection = (scopeIndex) => {
    setSelectedScope(scopeIndex);
    setScopeDescEditMode(false); // Reset scope description editing when switching scopes
    
    // Check if the currently selected participant exists in the new scope
    const newScope = project.scopes[scopeIndex];
    const participantsInNewScope = newScope?.participants || [];
    
    if (selectedParticipant) {
      const participantExistsInNewScope = participantsInNewScope.some(p => p.id === selectedParticipant.id);
      if (!participantExistsInNewScope) {
        // Participant doesn't exist in new scope, but we'll keep the selection
        // The PersonaeFramework component will handle displaying the participant's data
        // even if they're from a different scope
        console.log(`Selected participant ${selectedParticipant.name} is not in scope ${scopeIndex + 1}, but keeping selection`);
      }
    }
    
    // Save selected scope to localStorage for ParticipantPage
    try {
      localStorage.setItem(`project_${idx}_selected_scope`, scopeIndex.toString());
    } catch (error) {
      console.error('Error saving selected scope:', error);
    }
  };



  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div className="left-panel" style={{ 
        width: currentView === 'behavioral' ? '100%' : '50%',
        padding: '24px', 
        overflowY: 'auto',
        borderRight: currentView !== 'behavioral' ? '1px solid #dcdde1' : 'none',
        transition: 'width 0.3s ease'
      }}>
        {/* Back Button */}
        <button
          onClick={() => navigate('/projects')}
          style={{
            padding: '8px 16px',
            backgroundColor: '#ecf0f1',
            color: '#2c3e50',
            border: '1px solid #bdc3c7',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 600,
            fontFamily: 'Lexend, sans-serif',
            fontSize: '0.95em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#dfe6e9';
            e.currentTarget.style.borderColor = '#b2bec3';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#ecf0f1';
            e.currentTarget.style.borderColor = '#bdc3c7';
          }}
        >
          <span style={{ fontSize: '1.2em' }}>←</span>
          Back to Projects
        </button>

        {/* Project Header Card */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          {/* Project Name */}
          <div style={{ marginBottom: '20px' }}>
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div style={{
                width: '3px',
                height: '16px',
                background: '#3498db',
                borderRadius: '2px'
              }} />
              <span style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.8em',
                color: '#6c757d',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Project Name
              </span>
            </div> */}
            
            {nameEditMode ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  style={{
                    fontSize: '1.5em',
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '600',
                    color: '#2c3e50',
                    border: '1px solid #dcdde1',
                    borderRadius: '6px',
                    padding: '8px 12px',
                    outline: 'none',
                    minWidth: '250px'
                  }}
                  placeholder="Enter project name..."
                  autoFocus
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3498db';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#dcdde1';
                  }}
                />
                <button 
                  key="save-name" 
                  onClick={(e) => {
                    handleNameSave();
                    // Add glowing ring effect
                    e.target.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.3)';
                    setTimeout(() => {
                      e.target.style.boxShadow = 'none';
                    }, 300);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#27ae60',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '500',
                    fontSize: '0.9em',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Save
                </button>
                <button 
                  key="cancel-name" 
                  onClick={() => setNameEditMode(false)}
                  style={{
                    padding: '6px 12px',
                    background: '#95a5a6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '500',
                    fontSize: '0.9em'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: '600',
                  fontSize: '1.5em',
                  color: '#2c3e50',
                  margin: 0
                }}>
                  {project.name}
                </h2>
                <button
                  onClick={() => setNameEditMode(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#f8f9fa';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <img 
                    src={editIcon} 
                    alt="Edit" 
                    style={{
                      width: '14px',
                      height: '14px',
                      opacity: '0.6'
                    }}
                  />
                </button>
              </div>
            )}
          </div>

          {/* Project Description */}
          <div style={{
            background: '#f8f9fa',
            borderRadius: '8px',
            padding: '16px',
            border: '1px solid #e9ecef'
          }}>
            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '2px',
                height: '12px',
                background: '#6c757d',
                borderRadius: '1px'
              }} />
              <span style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.75em',
                color: '#6c757d',
                fontWeight: '500',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                Description
              </span>
            </div> */}
            
            {descEditMode ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  value={descDraft}
                  onChange={e => setDescDraft(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '0.95em',
                    color: '#2c3e50',
                    border: '1px solid #dcdde1',
                    borderRadius: '4px',
                    padding: '8px 12px',
                    resize: 'vertical',
                    outline: 'none'
                  }}
                  placeholder="Enter project description..."
                  autoFocus
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3498db';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#dcdde1';
                  }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                  key="save-desc" 
                  onClick={(e) => {
                    handleDescSave();
                    // Add glowing ring effect
                    e.target.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.3)';
                    setTimeout(() => {
                      e.target.style.boxShadow = 'none';
                    }, 300);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: '#27ae60',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '500',
                    fontSize: '0.9em',
                    transition: 'all 0.2s ease'
                  }}
                >
                  Save
                </button>
                  <button 
                    key="cancel-desc" 
                    onClick={() => setDescEditMode(false)}
                    style={{
                      padding: '6px 12px',
                      background: '#95a5a6',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontFamily: 'Lexend, sans-serif',
                      fontWeight: '500',
                      fontSize: '0.9em'
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : project.description ? (
              <div style={{ position: 'relative' }}>
                <p style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.95em',
                  color: '#495057',
                  margin: 0,
                  lineHeight: '1.5',
                  paddingRight: '30px'
                }}>
                  {project.description}
                </p>
                <button
                  onClick={() => { 
                    setDescDraft(project.description); 
                    setDescEditMode(true); 
                  }}
                  style={{
                    position: 'absolute',
                    top: '0',
                    right: '0',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#e9ecef';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = 'transparent';
                  }}
                >
                  <img 
                    src={editIcon} 
                    alt="Edit" 
                    style={{
                      width: '12px',
                      height: '12px',
                      opacity: '0.6'
                    }}
                  />
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setDescDraft(''); setDescEditMode(true); }}
                style={{
                  padding: '8px 16px',
                  background: '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9em',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: '500'
                }}
              >
                + Add Description
              </button>
            )}
          </div>
        </div>
        
        {/* Scope Selection */}
        {project.scopes && project.scopes.length > 0 && (
          <div style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              border: '1px solid #e9ecef',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
              }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{
                width: '3px',
                height: '16px',
                background: '#27ae60',
                borderRadius: '2px'
              }} />
              <h3 style={{
                fontFamily: 'Lexend, sans-serif',
                fontWeight: '600',
                fontSize: '1.1em',
                color: '#2c3e50',
                margin: 0
              }}>
                Project Scopes
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              {project.scopes.map((scope, index) => (
                <button
                  key={`scope-${scope.scopeNumber}-${index}`}
                  onClick={(e) => {
                    handleScopeSelection(index);
                    // Add glowing ring effect
                    e.target.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.3)';
                    setTimeout(() => {
                      e.target.style.boxShadow = selectedScope === index ? '0 0 0 2px rgba(39, 174, 96, 0.2)' : 'none';
                    }, 300);
                  }}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedScope === index ? '#27ae60' : '#f8f9fa',
                    color: selectedScope === index ? '#fff' : '#2c3e50',
                    border: '1px solid',
                    borderColor: selectedScope === index ? '#27ae60' : '#e9ecef',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: selectedScope === index ? '600' : '500',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif',
                    transition: 'all 0.2s ease',
                    minWidth: '80px',
                    textAlign: 'center',
                    boxShadow: selectedScope === index ? '0 0 0 2px rgba(39, 174, 96, 0.2)' : 'none'
                  }}
                  onMouseOver={(e) => {
                    if (selectedScope !== index) {
                      e.target.style.backgroundColor = '#e9ecef';
                      e.target.style.borderColor = '#d1d5db';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedScope !== index) {
                      e.target.style.backgroundColor = '#f8f9fa';
                      e.target.style.borderColor = '#e9ecef';
                    }
                  }}
                >
                  Scope {scope.scopeNumber}
                </button>
              ))}
            </div>
            
            {currentScope && (
              <div style={{
                background: '#f8f9fa',
                borderRadius: '8px',
                padding: '16px',
                border: '1px solid #e9ecef',
                position: 'relative'
                }}>
                {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <div style={{
                    width: '2px',
                    height: '12px',
                    background: '#6c757d',
                    borderRadius: '1px'
                  }} />
                  <span style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '0.75em',
                    color: '#6c757d',
                    fontWeight: '500',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    Current Scope Description
                  </span>
                </div> */}
                
                {scopeDescEditMode ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <textarea
                      value={scopeDescDraft}
                      onChange={e => setScopeDescDraft(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '50px',
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '0.9em',
                        color: '#2c3e50',
                        border: '1px solid #dcdde1',
                        borderRadius: '4px',
                        padding: '8px 12px',
                        resize: 'vertical',
                        outline: 'none'
                      }}
                      placeholder="Enter scope description..."
                      autoFocus
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3498db';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#dcdde1';
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        key="save-scope-desc"
                        onClick={(e) => {
                          handleScopeDescSave();
                          // Add glowing ring effect
                          e.target.style.boxShadow = '0 0 0 3px rgba(39, 174, 96, 0.3)';
                          setTimeout(() => {
                            e.target.style.boxShadow = 'none';
                          }, 300);
                        }}
                        style={{
                          padding: '6px 12px',
                          background: '#27ae60',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontFamily: 'Lexend, sans-serif',
                          fontWeight: '500',
                          fontSize: '0.9em',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        Save
                      </button>
                      <button 
                        key="cancel-scope-desc"
                        onClick={() => setScopeDescEditMode(false)}
                        style={{
                          padding: '6px 12px',
                          background: '#95a5a6',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontFamily: 'Lexend, sans-serif',
                          fontWeight: '500',
                          fontSize: '0.9em'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    <p style={{
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.9em',
                      color: '#495057',
                      margin: 0,
                      lineHeight: '1.5',
                      paddingRight: '30px'
                    }}>
                      {currentScope.scopeText || 'No description provided for this scope.'}
                    </p>
                    <button
                      onClick={() => { 
                        setScopeDescDraft(currentScope.scopeText || ''); 
                        setScopeDescEditMode(true); 
                      }}
                      style={{
                        position: 'absolute',
                        top: '0',
                        right: '0',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.backgroundColor = '#e9ecef';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                      }}
                    >
                      <img 
                        src={editIcon} 
                        alt="Edit" 
                        style={{
                          width: '12px',
                          height: '12px',
                          opacity: '0.6'
                        }}
                      />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Thin line */}
        <div style={{ borderBottom: '1px solid #dcdde1', margin: '18px 0 12px 0' }}></div>
        {/* Three buttons */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <button 
            key="personae-mapping"
            onClick={() => setCurrentView(currentView === 'personae' ? 'details' : 'personae')}
            style={{ 
              padding: '8px 16px', 
              background: currentView === 'personae' ? '#1a5276' : '#2980b9', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: currentView === 'personae' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'personae') {
                e.target.style.background = '#1a5276';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'personae') {
                e.target.style.background = '#2980b9';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Personae Mapping
          </button>
          <button 
            key="behavioral-diversity"
            onClick={() => setCurrentView(currentView === 'behavioral' ? 'details' : 'behavioral')}
            style={{ 
              padding: '8px 16px', 
              background: currentView === 'behavioral' ? '#0c594a' : '#27ae60', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: currentView === 'behavioral' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'behavioral') {
                e.target.style.background = '#16a085';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'behavioral') {
                e.target.style.background = '#27ae60';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Behavioral Diversity
          </button>
          <button 
            key="situation-design"
            onClick={() => setCurrentView(currentView === 'situation' ? 'details' : 'situation')}
            style={{ 
              padding: '8px 16px', 
              background: currentView === 'situation' ? '#4c1a61' : '#9b59b6', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: currentView === 'situation' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
            }}
            onMouseOver={(e) => {
              if (currentView !== 'situation') {
                e.target.style.background = '#8e44ad';
                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
              }
            }}
            onMouseOut={(e) => {
              if (currentView !== 'situation') {
                e.target.style.background = '#9b59b6';
                e.target.style.boxShadow = 'none';
              }
            }}
          >
            Situation Design
          </button>
        </div>

        {/* Another thin line */}
        <div style={{ borderBottom: '1px solid #dcdde1', margin: '18px 0 12px 0' }}></div>
        
        {currentView === 'behavioral' ? (
          <BehavioralDiversityView
            currentScope={currentScope}
            participants={participants}
            sortBy={sortBy}
            setSortBy={setSortBy}
            statsSort={statsSort}
            setStatsSort={setStatsSort}
            isPdfGenerating={isPdfGenerating}
            generatePDF={generatePDF}
          />
        ) : currentView === 'personae' ? (
          <PersonaeMappingView
            project={project}
            currentScope={currentScope}
            participants={participants}
            selectedParticipant={selectedParticipant}
            setSelectedParticipant={setSelectedParticipant}
            sortBy={sortBy}
            setSortBy={setSortBy}
            selectedAgeRanges={selectedAgeRanges}
            setSelectedAgeRanges={setSelectedAgeRanges}
            selectedGenders={selectedGenders}
            setSelectedGenders={setSelectedGenders}
            personaeView={personaeView}
            setPersonaeView={setPersonaeView}
            isPdfGenerating={isPdfGenerating}
            generatePDF={generatePDF}
          />
        ) : currentView === 'situation' ? (
          <SituationDesignView
            currentScope={currentScope}
            participants={participants}
            robotDraft={robotDraft}
            setRobotDraft={setRobotDraft}
            environmentDraft={environmentDraft}
            setEnvironmentDraft={setEnvironmentDraft}
            project={project}
            selectedScope={selectedScope}
            editProject={editProject}
            idx={idx}
          />
        ) : (
          // Regular View
          <>
        <button 
          onClick={handleAddParticipant} 
          style={{ 
            padding: '8px 16px', 
            background: '#27ae60', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 4, 
            cursor: 'pointer', 
            marginBottom: 10,
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.background = '#16a085';
            e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
          }}
          onMouseOut={(e) => {
            e.target.style.background = '#27ae60';
            e.target.style.boxShadow = 'none';
          }}
        >
          Add Participants
        </button>
            
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {participants.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              {editingParticipant === p.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <input
                    value={participantDraft}
                    onChange={e => {
                      setParticipantDraft(e.target.value);
                      setNameError(''); // Clear error when typing
                    }}
                    style={{ 
                      fontSize: '.98em', 
                      fontFamily: 'Lexend, sans-serif', 
                      borderRadius: 4, 
                      border: nameError ? '1px solid #e74c3c' : '1px solid #ccc', 
                      padding: 2, 
                      width: 50 
                    }}
                    autoFocus
                  />
                  <button 
                    key="save-participant"
                    onClick={() => handleSaveParticipant(p.id)} 
                    style={{ 
                      padding: '2px 6px', 
                      background: '#27ae60', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      cursor: 'pointer', 
                      fontSize: '.9em',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#16a085';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#27ae60';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Save
                  </button>
                  <button 
                    key="cancel-participant"
                    onClick={handleCancelEdit} 
                    style={{ 
                      padding: '2px 6px', 
                      background: '#95a5a6', 
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      cursor: 'pointer', 
                      fontSize: '.9em',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = '#7f8c8d';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = '#95a5a6';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    Cancel
                  </button>
                  {nameError && (
                    <span style={{ 
                      color: '#e74c3c', 
                      fontSize: '.9em', 
                      fontFamily: 'Lexend, sans-serif'
                    }}>
                      {nameError}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <button 
                    onClick={() => currentView === 'personae' ? setSelectedParticipant(p) : handleParticipantClick(p.id)}
                    style={{ 
                      padding: '6px 12px', 
                      background: selectedParticipant?.id === p.id ? '#1a5276' : '#2980b9',
                      color: '#fff', 
                      border: 'none', 
                      borderRadius: 4, 
                      cursor: 'pointer', 
                      fontSize: '.98em',
                      transition: 'all 0.2s ease',
                      boxShadow: selectedParticipant?.id === p.id ? '0 2px 4px rgba(0,0,0,0.2)' : 'none'
                    }}
                    onMouseOver={(e) => {
                      if (selectedParticipant?.id !== p.id) {
                        e.target.style.background = '#1a5276';
                        e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedParticipant?.id !== p.id) {
                        e.target.style.background = '#2980b9';
                        e.target.style.boxShadow = 'none';
                      }
                    }}
                  >
                    {p.name}
                  </button>
                  <img 
                    src={editIcon} 
                    alt="Edit" 
                    className="icon-btn" 
                    onClick={() => handleEditParticipant(p.id, p.name)}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  <img 
                    src={deleteIcon} 
                    alt="Delete" 
                    className="icon-btn" 
                    onClick={() => handleDeleteParticipant(p.id)}
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      padding: '4px',
                      borderRadius: '4px'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.backgroundColor = '#f0f0f0';
                      e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.backgroundColor = 'transparent';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </>
              )}
            </div>
          ))}
        </div>
          </>
        )}
      </div>

      {currentView !== 'behavioral' && (
        <div className="right-panel" style={{ 
          width: '50%',
          background: currentView === 'personae' ? 'linear-gradient(180deg,rgb(55, 70, 83) 0%, #232b32 100%)' : '#fff',
          position: 'relative',
          overflowY: 'auto',
          padding: currentView === 'personae' && personaeView === 'summary' ? '20px' : 0
        }}>
          {currentView === 'personae' && (
            personaeView === 'framework' ? (
              selectedParticipant ? (
                <div ref={frameworkRef}>
                  <PersonaeFramework 
                    selectedParticipant={selectedParticipant}
                    currentScope={currentScope}
                    selectedRules={selectedParticipant?.answers?.['Rule Selection']?.selectedRules || []}
                  />
                </div>
              ) : (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  color: '#fff',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.1em',
                  textAlign: 'center',
                  padding: '20px'
                }}>
                  <div>
                    <div style={{ marginBottom: '10px' }}>👈</div>
                    Click a participant to show the framework view
                  </div>
                </div>
              )
            ) : null
          )}
          {currentView === 'situation' && (
            <div style={{ padding: '24px' }}>
              {/* Current Scope Header */}
              <div style={{ width: '100%', marginBottom: '8px' }}>
                <h4 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.05em',
                  color: '#34495e',
                  margin: 0,
                  fontWeight: 600,
                  textAlign: 'center'
                }}>
                  Current Scope: {currentScope?.scopeNumber || ''}
                </h4>
              </div>

              {/* Robot Changes Section */}
              <div style={{ width: '100%', marginBottom: '24px' }}>
                <h3 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.2em',
                  color: '#2c3e50',
                  marginBottom: '16px'
                }}>
                  Robot Changes
                </h3>
                <div style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #dcdde1'
                }}>
                  <textarea
                    value={robotDraft}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setRobotDraft(newValue);
                      
                      // Update the current scope's situation design
                      const updatedScopes = [...project.scopes];
                      updatedScopes[selectedScope] = {
                        ...updatedScopes[selectedScope],
                        situationDesign: {
                          ...updatedScopes[selectedScope].situationDesign,
                          robotChanges: newValue
                        }
                      };
                      
                      // Update the project with the new scopes
                      const updatedProject = {
                        ...project,
                        scopes: updatedScopes
                      };
                      
                      console.log('Saving robot changes to database:', newValue);
                      editProject(idx, updatedProject);
                    }}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px',
                      borderRadius: '4px',
                      border: '1px solid #dcdde1',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.95em',
                      resize: 'vertical'
                    }}
                    placeholder="Enter robot changes suggestions..."
                  />
                </div>
              </div>
              
              {/* Environmental Changes Section */}
              <div style={{ width: '100%' }}>
                <h3 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.2em',
                  color: '#2c3e50',
                  marginBottom: '16px'
                }}>
                  Environmental Changes
                </h3>
                <div style={{
                  background: '#fff',
                  padding: '20px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  border: '1px solid #dcdde1'
                }}>
                  <textarea
                    value={environmentDraft}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setEnvironmentDraft(newValue);
                      
                      // Update the current scope's situation design
                      const updatedScopes = [...project.scopes];
                      updatedScopes[selectedScope] = {
                        ...updatedScopes[selectedScope],
                        situationDesign: {
                          ...updatedScopes[selectedScope].situationDesign,
                          environmentalChanges: newValue
                        }
                      };
                      
                      // Update the project with the new scopes
                      const updatedProject = {
                        ...project,
                        scopes: updatedScopes
                      };
                      
                      console.log('Saving environmental changes to database:', newValue);
                      editProject(idx, updatedProject);
                    }}
                    style={{
                      width: '100%',
                      minHeight: '120px',
                      padding: '12px',
                      borderRadius: '4px',
                      border: '1px solid #dcdde1',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.95em',
                      resize: 'vertical'
                    }}
                    placeholder="Enter environmental changes suggestions..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails; 