import React, { useState, useRef, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import editIcon from '../images/edit.png';
import deleteIcon from '../images/trash.png';
import PersonaeFramework from './PersonaeFramework';
import PersonaeMappingView from './PersonaeMappingView';
import BehavioralDiversityView from './BehavioralDiversityView';
import SituationDesignView from './SituationDesignView';
import FactorDetailsModal from './FactorDetailsModal';
import InfoModal from './InfoModal';
import InfoButton from './InfoButton';
import { handleFactorClick, parseFactors } from '../utils/factorUtils';
import { SECTIONS, connectionPairs } from '../constants/frameAnalysis';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { getProjects, saveProjects } from '../store';
import ProjectReport from './ProjectReport';
import { CurrentViewContext } from '../App';

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Other'];

const ProjectDetails = ({ projects, updateProjectDescription, editProject, deleteProject }) => {
  const { projectId } = useParams();
  const idx = parseInt(projectId, 10);
  const project = projects[idx];
  const navigate = useNavigate();
  
  // Get the context for updating global currentView
  const { setCurrentView: setGlobalCurrentView } = useContext(CurrentViewContext);

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
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    scopes: true,
    participants: true,
    questionsAndAnswers: true,
    frameworkView: true,
    summaryView: true,
    behavioralDiversity: true,
    situationDesign: true
  });
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [questions, setQuestions] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState(true);
  const [showFactorDetails, setShowFactorDetails] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [showSituationInfoModal, setShowSituationInfoModal] = useState(false);
  const [showPersonaeInfoModal, setShowPersonaeInfoModal] = useState(false);
  const [showBehavioralInfoModal, setShowBehavioralInfoModal] = useState(false);
  const [showHtmlReportModal, setShowHtmlReportModal] = useState(false);
  const [executiveSummary, setExecutiveSummary] = useState("");

  // Load questions from database
  React.useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const questionsData = await window.electronAPI.getEnabledProjectQuestions(project.id);
        
        // Format them for the component
        const formattedQuestions = {};
        Object.keys(questionsData).forEach(section => {
          formattedQuestions[section] = questionsData[section].map(q => {
            if (q.questionType === 'dropdown') {
              return {
                id: q.questionId,
                text: q.questionText,
                type: 'dropdown',
                options: q.options,
                factors: q.factors
              };
            } else {
              return {
                text: q.questionText,
                factors: q.factors
              };
            }
          });
        });
        
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        // Set empty questions if database fails
        setQuestions({});
      } finally {
        setQuestionsLoading(false);
      }
    };
    
    if (project?.id) {
      loadQuestions();
    }
  }, [project?.id]);

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

  // Update global currentView when local currentView changes
  useEffect(() => {
    if (setGlobalCurrentView) {
      setGlobalCurrentView(currentView);
    }
  }, [currentView, setGlobalCurrentView]);

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
      
      // For framework view, ensure SVG elements are properly positioned
      if (currentView === 'personae' && personaeView === 'framework') {
        // Find and fix SVG positioning
        const svgElements = clone.querySelectorAll('svg');
        svgElements.forEach(svg => {
          // Ensure SVG is positioned correctly relative to its container
          const container = svg.closest('[style*="position: relative"]') || svg.parentElement;
          if (container) {
            const containerRect = container.getBoundingClientRect();
            svg.style.position = 'absolute';
            svg.style.top = '0';
            svg.style.left = '0';
            svg.style.width = '100%';
            svg.style.height = '100%';
          }
        });
      }
      
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

      // Ensure SVG elements are properly rendered before capture
      if (currentView === 'personae' && personaeView === 'framework') {
        // Force a reflow to ensure SVG elements are positioned correctly
        wrapper.offsetHeight;
        
        // Wait a bit for any dynamic positioning to complete
        await new Promise(resolve => setTimeout(resolve, 100));
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

  const handleFactorClickLocal = (question, factor) => {
    handleFactorClick(question, factor, setSelectedFactor, setShowFactorDetails);
  };

  const generateProjectReport = async () => {
    setIsGeneratingReport(true);
    try {
      const pdf = new jsPDF('p', 'pt', 'a4');
      let yPosition = 40;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 40;
      const contentWidth = pageWidth - (2 * margin);
      
      // Helper function to add text with word wrapping
      const addWrappedText = (text, y, fontSize = 12, fontStyle = 'normal') => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', fontStyle);
        
        const lines = pdf.splitTextToSize(text, contentWidth);
        if (y + (lines.length * fontSize * 1.2) > pdf.internal.pageSize.getHeight() - margin) {
          pdf.addPage();
          y = 40;
        }
        
        pdf.text(lines, margin, y);
        return y + (lines.length * fontSize * 1.2) + 10;
      };

      // Helper function to add section header
      const addSectionHeader = (title, y) => {
        y = addWrappedText(title, y, 16, 'bold');
        y = addWrappedText('', y, 12, 'normal'); // Add some space
        return y;
      };

      // Project Title
      yPosition = addWrappedText(project.name, yPosition, 20, 'bold');
      yPosition = addWrappedText('', yPosition, 12, 'normal');

      // Project Description
      if (project.description) {
        yPosition = addWrappedText('Project Description:', yPosition, 14, 'bold');
        yPosition = addWrappedText(project.description, yPosition, 12, 'normal');
        yPosition = addWrappedText('', yPosition, 12, 'normal');
      }

      // Scopes
      if (reportOptions.scopes && project.scopes) {
        yPosition = addSectionHeader('Project Scopes', yPosition);
        project.scopes.forEach((scope, index) => {
          yPosition = addWrappedText(`Scope ${scope.scopeNumber}:`, yPosition, 14, 'bold');
          if (scope.scopeText) {
            yPosition = addWrappedText(scope.scopeText, yPosition, 12, 'normal');
          }
          yPosition = addWrappedText('', yPosition, 12, 'normal');
        });
      }

      // Participants
      if (reportOptions.participants && project.scopes) {
        yPosition = addSectionHeader('Participants', yPosition);
        project.scopes.forEach((scope, scopeIndex) => {
          if (scope.participants && scope.participants.length > 0) {
            yPosition = addWrappedText(`Scope ${scope.scopeNumber} Participants:`, yPosition, 14, 'bold');
            scope.participants.forEach(participant => {
              yPosition = addWrappedText(`• ${participant.name}`, yPosition, 12, 'normal');
            });
            yPosition = addWrappedText('', yPosition, 12, 'normal');
          }
        });
      }

      // Questions and Answers
      if (reportOptions.questionsAndAnswers && project.scopes) {
        yPosition = addSectionHeader('Questions and Answers', yPosition);
        project.scopes.forEach((scope, scopeIndex) => {
          if (scope.participants && scope.participants.length > 0) {
            yPosition = addWrappedText(`Scope ${scope.scopeNumber}:`, yPosition, 14, 'bold');
            
            scope.participants.forEach(participant => {
              yPosition = addWrappedText(`${participant.name}:`, yPosition, 12, 'bold');
              
              if (participant.answers) {
                Object.entries(participant.answers).forEach(([section, data]) => {
                  if (section !== 'Rule Selection' && data && typeof data === 'object') {
                    Object.entries(data).forEach(([question, answer]) => {
                      if (question !== 'selectedRules' && answer && answer.trim()) {
                        yPosition = addWrappedText(`  ${question}: ${answer}`, yPosition, 11, 'normal');
                      }
                    });
                  }
                });
              }
              yPosition = addWrappedText('', yPosition, 12, 'normal');
            });
          }
        });
      }

      // Framework View
      if (reportOptions.frameworkView && project.scopes) {
        yPosition = addSectionHeader('Framework Analysis', yPosition);
        project.scopes.forEach((scope, scopeIndex) => {
          if (scope.participants && scope.participants.length > 0) {
            yPosition = addWrappedText(`Scope ${scope.scopeNumber}:`, yPosition, 14, 'bold');
            
            scope.participants.forEach(participant => {
              yPosition = addWrappedText(`${participant.name}:`, yPosition, 12, 'bold');
              
              // Get framework data
              const answers = participant.answers || {};
              const situation = answers['Situation'] || {};
              const identity = answers['Identity'] || {};
              const definition = answers['Definition of the Situation'] || {};
              const decision = answers['Decision'] || {};
              
              if (Object.keys(situation).length > 0) {
                yPosition = addWrappedText('  Situation:', yPosition, 11, 'bold');
                Object.entries(situation).forEach(([key, value]) => {
                  if (value && value.trim()) {
                    yPosition = addWrappedText(`    ${key}: ${value}`, yPosition, 10, 'normal');
                  }
                });
              }
              
              if (Object.keys(identity).length > 0) {
                yPosition = addWrappedText('  Identity:', yPosition, 11, 'bold');
                Object.entries(identity).forEach(([key, value]) => {
                  if (value && value.trim()) {
                    yPosition = addWrappedText(`    ${key}: ${value}`, yPosition, 10, 'normal');
                  }
                });
              }
              
              if (Object.keys(definition).length > 0) {
                yPosition = addWrappedText('  Definition of the Situation:', yPosition, 11, 'bold');
                Object.entries(definition).forEach(([key, value]) => {
                  if (value && value.trim()) {
                    yPosition = addWrappedText(`    ${key}: ${value}`, yPosition, 10, 'normal');
                  }
                });
              }
              
              if (Object.keys(decision).length > 0) {
                yPosition = addWrappedText('  Decision:', yPosition, 11, 'bold');
                Object.entries(decision).forEach(([key, value]) => {
                  if (value && value.trim()) {
                    yPosition = addWrappedText(`    ${key}: ${value}`, yPosition, 10, 'normal');
                  }
                });
              }
              
              yPosition = addWrappedText('', yPosition, 12, 'normal');
            });
          }
        });
      }

      // Summary View
      if (reportOptions.summaryView && project.scopes) {
        yPosition = addSectionHeader('Participant Summaries', yPosition);
        project.scopes.forEach((scope, scopeIndex) => {
          if (scope.participants && scope.participants.length > 0) {
            yPosition = addWrappedText(`Scope ${scope.scopeNumber}:`, yPosition, 14, 'bold');
            
            scope.participants.forEach(participant => {
              yPosition = addWrappedText(`${participant.name}:`, yPosition, 12, 'bold');
              if (participant.summary && participant.summary.trim()) {
                yPosition = addWrappedText(participant.summary, yPosition, 11, 'normal');
              } else {
                yPosition = addWrappedText('No summary available', yPosition, 11, 'italic');
              }
              yPosition = addWrappedText('', yPosition, 12, 'normal');
            });
          }
        });
      }

      // Behavioral Diversity
      if (reportOptions.behavioralDiversity && project.scopes) {
        yPosition = addSectionHeader('Behavioral Diversity Analysis', yPosition);
        project.scopes.forEach((scope, scopeIndex) => {
          if (scope.participants && scope.participants.length > 0) {
            yPosition = addWrappedText(`Scope ${scope.scopeNumber}:`, yPosition, 14, 'bold');
            
            // Collect all rules from this scope
            const allRules = new Set();
            scope.participants.forEach(participant => {
              const selectedRules = participant.answers?.['Rule Selection']?.selectedRules || [];
              selectedRules.forEach(rule => allRules.add(rule));
            });
            
            if (allRules.size > 0) {
              yPosition = addWrappedText('Rules Generated:', yPosition, 12, 'bold');
              Array.from(allRules).forEach(rule => {
                yPosition = addWrappedText(`• ${rule}`, yPosition, 11, 'normal');
              });
              yPosition = addWrappedText('', yPosition, 12, 'normal');
            }
            
            // Participant breakdown by rules
            yPosition = addWrappedText('Participant Rule Selections:', yPosition, 12, 'bold');
            scope.participants.forEach(participant => {
              const selectedRules = participant.answers?.['Rule Selection']?.selectedRules || [];
              if (selectedRules.length > 0) {
                yPosition = addWrappedText(`${participant.name}: ${selectedRules.join(', ')}`, yPosition, 11, 'normal');
              } else {
                yPosition = addWrappedText(`${participant.name}: No rules selected`, yPosition, 11, 'normal');
              }
            });
            yPosition = addWrappedText('', yPosition, 12, 'normal');
          }
        });
      }

      // Situation Design
      if (reportOptions.situationDesign && project.scopes) {
        yPosition = addSectionHeader('Situation Design Recommendations', yPosition);
        project.scopes.forEach((scope, scopeIndex) => {
          yPosition = addWrappedText(`Scope ${scope.scopeNumber}:`, yPosition, 14, 'bold');
          
          if (scope.situationDesign) {
            if (scope.situationDesign.robotChanges && scope.situationDesign.robotChanges.trim()) {
              yPosition = addWrappedText('Robot Changes:', yPosition, 12, 'bold');
              yPosition = addWrappedText(scope.situationDesign.robotChanges, yPosition, 11, 'normal');
              yPosition = addWrappedText('', yPosition, 12, 'normal');
            }
            
            if (scope.situationDesign.environmentalChanges && scope.situationDesign.environmentalChanges.trim()) {
              yPosition = addWrappedText('Environmental Changes:', yPosition, 12, 'bold');
              yPosition = addWrappedText(scope.situationDesign.environmentalChanges, yPosition, 11, 'normal');
              yPosition = addWrappedText('', yPosition, 12, 'normal');
            }
          } else {
            yPosition = addWrappedText('No situation design recommendations available', yPosition, 11, 'italic');
          }
          yPosition = addWrappedText('', yPosition, 12, 'normal');
        });
      }

      // Save the PDF
      pdf.save(`${project.name}_Complete_Report.pdf`);
      setShowReportModal(false);
      
    } catch (error) {
      console.error('Error generating project report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Handler for generating executive summary
  const handleGenerateSummary = async () => {
    setExecutiveSummary('Generating summary...');
    // TODO: Call LLM here
    setTimeout(() => {
      setExecutiveSummary('This is a placeholder executive summary generated by the LLM.');
    }, 1200);
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
        {/* Header with Back Button and Download Report Button */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
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
          
          {/* <button
            onClick={() => setShowReportModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 400,
              fontFamily: 'Lexend, sans-serif',
              fontSize: '0.8em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2980b9';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3498db';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            📄 Download Project Report
          </button> */}
          <button
            className="check-report-btn"
            onClick={() => setShowHtmlReportModal(true)}
            style={{
              padding: '10px 20px',
              backgroundColor: '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 400,
              fontFamily: 'Lexend, sans-serif',
              fontSize: '0.8em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#219150';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#27ae60';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            📄 Check Project Report
          </button>
        </div>

        {/* Project Header Card */}
        <div 
          className="project-header-card"
          style={{
            background: '#fff',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
          }}
        >
          {/* Project Name */}
          <div className="project-name-section" style={{ marginBottom: '20px' }}>
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
              <div className="project-name-display" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 className="project-title" style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: '600',
                  fontSize: '1.5em',
                  color: '#2c3e50',
                  margin: 0
                }}>
                  {project.name}
                </h2>
                <button
                  className="edit-project-name-btn"
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

          {/* Project Details */}
          <div 
            className="project-details-section"
            style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e9ecef',
              marginBottom: '12px'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Robot Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.85em',
                  color: '#6c757d',
                  fontWeight: '600',
                  minWidth: '80px'
                }}>
                  Robot Type:
                </span>
                <span style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em',
                  color: '#2c3e50',
                  fontWeight: '500'
                }}>
                  {project.robotType || 'Not specified'}
                </span>
              </div>
              
              {/* Study Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.85em',
                  color: '#6c757d',
                  fontWeight: '600',
                  minWidth: '80px'
                }}>
                  Study Type:
                </span>
                <span style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em',
                  color: '#2c3e50',
                  fontWeight: '500'
                }}>
                  {project.studyType || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Project Description */}
          <div 
            className="project-description-section"
            style={{
              background: '#f8f9fa',
              borderRadius: '8px',
              padding: '16px',
              border: '1px solid #e9ecef'
            }}
          >
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
                className="add-description-btn"
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
          <div 
            className="scope-selection-section"
            style={{
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
            
            <div className="scope-buttons-container" style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              {project.scopes.map((scope, index) => (
                <button
                  key={`scope-${scope.scopeNumber}-${index}`}
                  className={`scope-button scope-${scope.scopeNumber}`}
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
            className="personae-mapping-button"
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
              boxShadow: currentView === 'personae' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              fontFamily: 'Lexend, sans-serif'
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
            className="behavioral-diversity-button"
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
              boxShadow: currentView === 'behavioral' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              fontFamily: 'Lexend, sans-serif'
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
            className="situation-design-button"
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
              boxShadow: currentView === 'situation' ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
              fontFamily: 'Lexend, sans-serif'
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
          <>
            {/* Behavioral Diversity Header */}
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '600',
                    fontSize: '1.1em',
                    color: '#2c3e50',
                    margin: 0
                  }}>
                    Behavioral Diversity
                  </h3>
                  <InfoButton onClick={() => setShowBehavioralInfoModal(true)} />
                </div>
              </div>
              <p style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#495057',
                margin: 0,
                fontWeight: 500
              }}>
                Current Scope: {currentScope?.scopeNumber || ''}
              </p>
            </div>
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
          </>
        ) : currentView === 'personae' ? (
          <>
            {/* Personae Mapping Header */}
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
                  background: '#2980b9',
                  borderRadius: '2px'
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '600',
                    fontSize: '1.1em',
                    color: '#2c3e50',
                    margin: 0
                  }}>
                    Personae Mapping
                  </h3>
                  <InfoButton onClick={() => setShowPersonaeInfoModal(true)} />
                </div>
              </div>
              <p style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#495057',
                margin: 0,
                fontWeight: 500
              }}>
                Current Scope: {currentScope?.scopeNumber || ''}
              </p>
            </div>
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
          </>
        ) : currentView === 'situation' ? (
          <>
            {/* Situation Design Header */}
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
                  background: '#9b59b6',
                  borderRadius: '2px'
                }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '600',
                    fontSize: '1.1em',
                    color: '#2c3e50',
                    margin: 0
                  }}>
                    Situation Design
                  </h3>
                  <InfoButton onClick={() => setShowSituationInfoModal(true)} />
                </div>
              </div>
              <p style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#495057',
                margin: 0,
                fontWeight: 500
              }}>
                Current Scope: {currentScope?.scopeNumber || ''}
              </p>
            </div>
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
              questions={questions}
            />
          </>
        ) : (
          // Regular View
          <>
        <button 
          className="add-participant-btn"
          onClick={handleAddParticipant} 
          style={{ 
            padding: '8px 16px', 
            background: '#27ae60', 
            color: '#fff', 
            border: 'none', 
            borderRadius: 4, 
            cursor: 'pointer', 
            marginBottom: 10,
            transition: 'all 0.2s ease',
            fontFamily: 'Lexend, sans-serif'
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
            
        <div className="participants-list" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {participants.map((p, i) => (
            <div key={p.id} className={`participant-item participant-${p.id}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
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
                      transition: 'all 0.2s ease',
                      fontFamily: 'Lexend, sans-serif'
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
                      transition: 'all 0.2s ease',
                      fontFamily: 'Lexend, sans-serif'
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
                      boxShadow: selectedParticipant?.id === p.id ? '0 2px 4px rgba(0,0,0,0.2)' : 'none',
                      fontFamily: 'Lexend, sans-serif'
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
                <>
                  {/* Current Scope Header - sticky */}
                  {currentScope && (
                    <div style={{
                      padding: '16px 24px',
                      backgroundColor: 'rgba(55, 70, 83, 0.95)',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                      color: 'white',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '1.1em',
                      fontWeight: '600',
                      textAlign: 'center',
                      position: 'sticky',
                      top: 0,
                      zIndex: 200,
                      backdropFilter: 'blur(10px)'
                    }}>
                      Current Scope: {currentScope.scopeNumber || 'No description'}
                    </div>
                  )}
                                     <div ref={frameworkRef}>
                     <PersonaeFramework 
                       selectedParticipant={selectedParticipant}
                       currentScope={currentScope}
                       selectedRules={selectedParticipant?.answers?.['Rule Selection']?.selectedRules || []}
                       questions={questions}
                       onFactorClick={handleFactorClickLocal}
                     />
                   </div>
                </>
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
            ) : personaeView === 'summary' ? (
              <div ref={summaryRef} style={{ height: '100%' }}>
                {(() => {
                  const participantsWithSummaries = participants.filter(p => p.summary && p.summary.trim() !== '');
                  
                  if (participantsWithSummaries.length === 0) {
                    return (
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
                          <div style={{ marginBottom: '10px' }}>📝</div>
                          No summaries available yet for the project
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {participantsWithSummaries.map((participant) => (
                          <div
                            key={participant.id}
                            style={{
                              background: 'rgba(255, 255, 255, 0.1)',
                              borderRadius: '8px',
                              padding: '20px',
                              border: '1px solid rgba(255, 255, 255, 0.2)',
                              backdropFilter: 'blur(10px)'
                            }}
                          >
                            <h3 style={{
                              margin: '0 0 15px 0',
                              fontFamily: 'Lexend, sans-serif',
                              fontSize: '1.2em',
                              color: '#fff',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                              paddingBottom: '10px'
                            }}>
                              {participant.name}
                            </h3>
                            <p style={{
                              fontFamily: 'Lexend, sans-serif',
                              fontSize: '0.95em',
                              color: 'rgba(255, 255, 255, 0.9)',
                              lineHeight: '1.6',
                              margin: 0
                            }}>
                              {participant.summary}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
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
              <div className="robot-changes-section" style={{ width: '100%', marginBottom: '24px' }}>
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
                      minHeight: '250px',
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
              <div className="environmental-changes-section" style={{ width: '100%' }}>
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
                      minHeight: '250px',
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

      {/* Report Download Modal */}
      {showReportModal && (
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
            background: '#fff',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1.5em',
                color: '#2c3e50',
                margin: 0
              }}>
                Download Project Report
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5em',
                  cursor: 'pointer',
                  color: '#7f8c8d',
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
                ×
              </button>
            </div>

            <p style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: '0.95em',
              color: '#7f8c8d',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Select the sections you want to include in your project report:
            </p>

            <div style={{ marginBottom: '24px' }}>
              {Object.entries({
                scopes: 'Project Scopes',
                participants: 'Participants List',
                questionsAndAnswers: 'Questions and Answers',
                frameworkView: 'Framework Analysis',
                summaryView: 'Participant Summaries',
                behavioralDiversity: 'Behavioral Diversity Analysis',
                situationDesign: 'Situation Design Recommendations'
              }).map(([key, label]) => (
                <div key={key} style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '12px',
                  padding: '8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                >
                  <input
                    type="checkbox"
                    id={key}
                    checked={reportOptions[key]}
                    onChange={(e) => {
                      setReportOptions(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }));
                    }}
                    style={{
                      marginRight: '12px',
                      transform: 'scale(1.2)',
                      cursor: 'pointer'
                    }}
                  />
                  <label
                    htmlFor={key}
                    style={{
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.95em',
                      color: '#2c3e50',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    {label}
                  </label>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowReportModal(false)}
                style={{
                  padding: '10px 20px',
                  background: '#95a5a6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: '500',
                  fontSize: '0.95em',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#7f8c8d';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#95a5a6';
                }}
              >
                Cancel
              </button>
              <button
                onClick={generateProjectReport}
                disabled={isGeneratingReport || Object.values(reportOptions).every(option => !option)}
                style={{
                  padding: '10px 20px',
                  background: isGeneratingReport || Object.values(reportOptions).every(option => !option) 
                    ? '#bdc3c7' 
                    : '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isGeneratingReport || Object.values(reportOptions).every(option => !option) 
                    ? 'not-allowed' 
                    : 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: '500',
                  fontSize: '0.95em',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                onMouseOver={(e) => {
                  if (!isGeneratingReport && !Object.values(reportOptions).every(option => !option)) {
                    e.target.style.backgroundColor = '#2980b9';
                  }
                }}
                onMouseOut={(e) => {
                  if (!isGeneratingReport && !Object.values(reportOptions).every(option => !option)) {
                    e.target.style.backgroundColor = '#3498db';
                  }
                }}
              >
                {isGeneratingReport ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid #fff',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modals */}
      <InfoModal 
        isOpen={showPersonaeInfoModal} 
        onClose={() => setShowPersonaeInfoModal(false)} 
        type="personaeMapping" 
      />
      <InfoModal 
        isOpen={showBehavioralInfoModal} 
        onClose={() => setShowBehavioralInfoModal(false)} 
        type="behavioralDiversity" 
      />
      <InfoModal 
        isOpen={showSituationInfoModal} 
        onClose={() => setShowSituationInfoModal(false)} 
        type="situationDesign" 
      />



      {/* Factor Details Modal */}
      {showFactorDetails && selectedFactor && (
        <FactorDetailsModal
          isOpen={showFactorDetails}
          onClose={() => setShowFactorDetails(false)}
          factorDetails={selectedFactor}
        />
      )}

      {/* HTML Report Modal */}
      {showHtmlReportModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          zIndex: 2000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '32px 24px',
          overflow: 'auto'
        }}>
          {/* Sticky Close Button positioned relative to report */}
          <button
            onClick={() => setShowHtmlReportModal(false)}
            style={{
              position: 'fixed',
              top: '50px',
              right: 'calc(50% - 440px - 60px)', // Position relative to report center
              background: '#fff',
              border: 'none',
              borderRadius: 6,
              fontSize: '1.5em',
              cursor: 'pointer',
              color: '#7f8c8d',
              padding: '8px 16px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 2001,
              transition: 'all 0.2s ease'
            }}
            onMouseOver={e => {
              e.target.style.background = '#f8f9fa';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            }}
            onMouseOut={e => {
              e.target.style.background = '#fff';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
            }}
          >
            ×
          </button>
          
          <div style={{ 
            width: '100%',
            maxWidth: '880px',
            display: 'flex',
            justifyContent: 'center',
            minHeight: 'auto', // Allow dynamic height in modal
            marginTop: '20px' // Add some space for the close button
          }}>
            <ProjectReport
              projectData={project}
              executiveSummary={executiveSummary}
              onGenerateSummary={handleGenerateSummary}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails; 