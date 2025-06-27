import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import editIcon from '../images/edit.png';
import deleteIcon from '../images/trash.png';
import PersonaeBoxes from './PersonaeBoxes';
import { SECTIONS, connectionPairs } from '../constants/frameAnalysis';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

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
  const [connections, setConnections] = useState([]);
  const boxRefs = useRef(SECTIONS.map(() => React.createRef()));
  const [sortBy, setSortBy] = useState("");
  const [sortBehavioralBy, setSortBehavioralBy] = useState("");
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

  // Add effect for connection calculations
  useEffect(() => {
    if (selectedParticipant && currentView === 'personae') {
      calculateConnections();

      // Add resize listener
      const handleResize = () => {
        requestAnimationFrame(calculateConnections);
      };
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [selectedParticipant, currentView]);

  // Reset states when project changes
  useEffect(() => {
    setSelectedParticipant(null);
    setConnections([]);
  }, [projectId]);

  const calculateConnections = () => {
    const boxes = boxRefs.current.map(ref => ref.current?.getBoundingClientRect());
    if (!boxes.every(box => box)) return;

    const rightPanel = document.querySelector('.right-panel');
    if (!rightPanel) return;
    
    const panelRect = rightPanel.getBoundingClientRect();

    // First, calculate how many connections go to each box side
    const connectionCounts = {};
    connectionPairs.forEach(pair => {
      const toKey = `${pair.to}-${pair.toSide}`;
      connectionCounts[toKey] = (connectionCounts[toKey] || 0) + 1;
    });

    // Calculate paths with proper spacing
    const paths = connectionPairs.map((pair, index) => {
      const fromBox = boxes[pair.from];
      const toBox = boxes[pair.to];
      
      const startX = pair.fromSide === 'right' 
        ? fromBox.left - panelRect.left + fromBox.width 
        : fromBox.left - panelRect.left;
      const startY = fromBox.top - panelRect.top + (fromBox.height * 2/3); 

      const toKey = `${pair.to}-${pair.toSide}`;
      const totalConnections = connectionCounts[toKey];
      const connectionIndex = connectionPairs
        .filter((p, i) => i < index && p.to === pair.to && p.toSide === pair.toSide)
        .length;

      let endX = pair.toSide === 'left'
        ? toBox.left - panelRect.left
        : toBox.left - panelRect.left + toBox.width;

      let endY = toBox.top - panelRect.top + toBox.height / 3;
      if (totalConnections > 1) {
        const spacing = 20;
        const totalHeight = (totalConnections - 1) * spacing;
        const startOffset = -totalHeight / 2;
        endY += startOffset + (connectionIndex * spacing);
      }

      const horizontalOffset = pair.horizontalOffset || 20;

      return {
        path: `
          M ${startX} ${startY}
          ${pair.fromSide === 'right' ? 'h' : 'h -'}${horizontalOffset}
          ${Math.abs(startY - endY) > 20 ? `
          ${pair.fromSide === pair.toSide ? 
            `V ${endY}` : 
            `h ${pair.fromSide === 'right' ? horizontalOffset : -horizontalOffset}
            V ${endY}
            h ${pair.fromSide === 'right' ? -horizontalOffset : horizontalOffset}`
          }` : 
          `V ${endY}`}
          ${pair.toSide === 'right' ? 'h' : 'h -'}${horizontalOffset}
        `,
        arrow: {
          x: endX + (pair.toSide === 'right' ? -1 : 1),
          y: endY,
          direction: pair.toSide === 'right' ? 'left' : 'right'
        }
      };
    });
    
    setConnections(paths);
  };

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
    // Find the highest participant number in the current scope
    const highestNumber = participants.reduce((max, p) => {
      const match = p.name.match(/^P(\d+)(?:_\d+)?$/);
      return match ? Math.max(max, parseInt(match[1])) : max;
    }, 0);
    
    const newParticipantNumber = highestNumber + 1;
    const newParticipant = {
      id: `P${newParticipantNumber}`,
      name: `P${newParticipantNumber}`,
      answers: {},
      summary: ''
    };
    
    // Update the current scope's participants
    const updatedScopes = [...project.scopes];
    updatedScopes[selectedScope] = {
      ...updatedScopes[selectedScope],
      participants: [...participants, newParticipant]
    };
    
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
      // Check for duplicate names in the current scope
      const isDuplicate = participants.some(p => p.id !== id && p.name === participantDraft.trim());
      if (isDuplicate) {
        setNameError('A participant with this name already exists in this scope.');
        return;
      }
      
      // Update the participant in the current scope
      const updatedParticipants = participants.map(p => 
        p.id === id ? { ...p, name: participantDraft.trim() } : p
      );
      
      // Update the current scope's participants
      const updatedScopes = [...project.scopes];
      updatedScopes[selectedScope] = {
        ...updatedScopes[selectedScope],
        participants: updatedParticipants
      };
      
      // Update the project with the new scopes
      const updatedProject = {
        ...project,
        scopes: updatedScopes
      };
      
      editProject(idx, updatedProject);
      setParticipants(updatedParticipants);
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
    // Remove participant from the current scope
    const updatedParticipants = participants.filter(p => p.id !== id);
    
    // Update the current scope's participants
    const updatedScopes = [...project.scopes];
    updatedScopes[selectedScope] = {
      ...updatedScopes[selectedScope],
      participants: updatedParticipants
    };
    
    // Update the project with the new scopes
    const updatedProject = {
      ...project,
      scopes: updatedScopes
    };
    
    editProject(idx, updatedProject);
    setParticipants(updatedParticipants);
  };

  const handleParticipantClick = (id) => {
    navigate(`/projects/${idx}/participants/${id}`);
  };

  // Function to group participants by the selected criterion
  const getGroupedParticipants = () => {
    if (!participants) return {};

    if (!sortBy) {
      // Return all participants in a single group when no sorting is selected
      return { 'All Participants': participants };
    }


    if (sortBy === 'age') {
      const groups = {
        ...AGE_RANGES.reduce((acc, range) => ({ ...acc, [range]: [] }), {}),
        'Unspecified Age Range': []
      };

      participants.forEach(p => {
        const ageRange = p.answers?.Identity?.age;
        if (ageRange && AGE_RANGES.includes(ageRange)) {
          groups[ageRange].push(p);
        } else {
          groups['Unspecified Age Range'].push(p);
        }
      });

      // Remove empty groups
      return Object.fromEntries(
        Object.entries(groups).filter(([_, participants]) => participants.length > 0)
      );
    } else {
      const groups = {
        ...GENDER_OPTIONS.reduce((acc, gender) => ({ ...acc, [gender]: [] }), {}),
        'Unspecified Gender': []
      };

      participants.forEach(p => {
        const gender = p.answers?.Identity?.gender;
        if (gender && GENDER_OPTIONS.includes(gender)) {
          groups[gender].push(p);
        } else {
          groups['Unspecified Gender'].push(p);
        }
      });

      // Remove empty groups
      return Object.fromEntries(
        Object.entries(groups).filter(([_, participants]) => participants.length > 0)
      );
    }
  };

  // Function to filter participants for summary view
  const getFilteredParticipants = () => {
    if (selectedAgeRanges.length === 0 && selectedGenders.length === 0) {
      return participants;
    }

    return participants.filter(p => {
      const ageMatch = selectedAgeRanges.length === 0 || 
        (p.answers?.Identity?.age && selectedAgeRanges.includes(p.answers.Identity.age));
      const genderMatch = selectedGenders.length === 0 || 
        (p.answers?.Identity?.gender && selectedGenders.includes(p.answers.Identity.gender));
      return ageMatch && genderMatch;
    });
  };

  const handleAgeRangeToggle = (range) => {
    setSelectedAgeRanges(prev => 
      prev.includes(range) 
        ? prev.filter(r => r !== range)
        : [...prev, range]
    );
  };

  const handleGenderToggle = (gender) => {
    setSelectedGenders(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
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

  // Updated function to calculate rule usage statistics with detailed breakdowns
  const getRuleUsageStats = (sortType = '') => {
    if (!sortType) {
      // Simple counting for no sort
      const stats = {};
      (project.rules || []).forEach(rule => {
        stats[rule] = participants.filter(p => 
          p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
        ).length;
      });
      return stats;
    } else if (sortType === 'gender') {
      // Group by gender for each rule
      const stats = {};
      (project.rules || []).forEach(rule => {
        stats[rule] = {
          Male: participants.filter(p => 
            p.answers?.Identity?.gender === 'Male' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length,
          Female: participants.filter(p => 
            p.answers?.Identity?.gender === 'Female' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length,
          'Non-Binary': participants.filter(p => 
            p.answers?.Identity?.gender === 'Non-Binary' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length,
          Other: participants.filter(p => 
            p.answers?.Identity?.gender === 'Other' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length
        };
      });
      return stats;
    } else if (sortType === 'age') {
      // Group by age range for each rule
      const stats = {};
      (project.rules || []).forEach(rule => {
        stats[rule] = {};
        AGE_RANGES.forEach(range => {
          stats[rule][range] = participants.filter(p => 
            p.answers?.Identity?.age === range && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length;
        });
      });
      return stats;
    }
    return {};
  };

  // Function to get filtered participants based on sorting
  const getFilteredParticipantsForStats = () => {
    if (!sortBehavioralBy) return participants;

    if (sortBehavioralBy === 'age') {
      const selectedRange = sortBy;
      return participants.filter(p => p.answers?.Identity?.age === selectedRange);
    } else if (sortBehavioralBy === 'gender') {
      const selectedGender = sortBy;
      return participants.filter(p => p.answers?.Identity?.gender === selectedGender);
    }

    return participants;
  };

  // Updated function to get chart data based on sort type
  const getChartData = (sortType = '') => {
    const stats = getRuleUsageStats(sortType);
    
    if (sortType === 'gender') {
      return {
        labels: Object.keys(stats),
        datasets: GENDER_OPTIONS.map((gender, index) => ({
          label: gender,
          data: Object.values(stats).map(genderStats => genderStats[gender]),
          backgroundColor: ['#3498db', '#e74c3c', '#9b59b6', '#f1c40f'][index],
          borderColor: ['#2980b9', '#c0392b', '#8e44ad', '#f39c12'][index],
          borderWidth: 1
        }))
      };
    } else if (sortType === 'age') {
      return {
        labels: AGE_RANGES,
        datasets: Object.entries(stats).map(([rule, ageStats], index) => ({
          label: rule,
          data: AGE_RANGES.map(range => ageStats[range]),
          backgroundColor: `hsla(${index * (360 / Object.keys(stats).length)}, 70%, 50%, 0.7)`,
          borderColor: `hsla(${index * (360 / Object.keys(stats).length)}, 70%, 45%, 1)`,
          borderWidth: 1
        }))
      };
    } else {
      return {
        labels: Object.keys(stats),
        datasets: [{
          label: 'Number of Participants',
          data: Object.values(stats),
          backgroundColor: '#27ae60',
          borderColor: '#219a52',
          borderWidth: 1
        }]
      };
    }
  };

  // Chart options based on sort type
  const getChartOptions = (sortType = '') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              family: 'Lexend, sans-serif'
            }
          }
        },
        title: {
          display: true,
          text: 'Rule Usage Statistics',
          font: {
            family: 'Lexend, sans-serif',
            size: 16
          }
        }
      },
      scales: {
        x: {
          ticks: {
            stepSize: 1,
            font: {
              family: 'Lexend, sans-serif'
            }
          }
        },
        y: {
          ticks: {
            stepSize: 1,
            font: {
              family: 'Lexend, sans-serif'
            }
          },
        }
      }
    };

    if (sortType === 'age') {
      return {
        ...baseOptions,
        indexAxis: 'y',
        plugins: {
          ...baseOptions.plugins,
          title: {
            ...baseOptions.plugins.title,
            text: 'Rule Usage by Age Range'
          }       
        }
      };
    } else if (sortType === 'gender') {
      return {
        ...baseOptions,
        indexAxis: 'x',
        plugins: {
          ...baseOptions.plugins,
          title: {
            ...baseOptions.plugins.title,
            text: 'Rule Usage by Gender'
          }
        }
      };
    } 
    else if (sortType === '') {
      return {
        ...baseOptions,
        indexAxis: 'x',
        plugins: {
          ...baseOptions.plugins,
          title: {
            ...baseOptions.plugins.title,
            text: 'All Participants'
          }
        }
      };
    }

    return baseOptions;
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
    if (!project) return;
    const updatedRules = (project.rules || []).filter(r => r !== rule);
    
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

    // Update project with new rules and updated participants
    updateProjectRules(idx, updatedRules);
    
    // Update selected rules for current participant
    setSelectedRules(prev => prev.filter(r => r !== rule));
    
    // Close the dialog
    setRuleToDelete(null);
  };

  const handleScopeSelection = (scopeIndex) => {
    setSelectedScope(scopeIndex);
    setScopeDescEditMode(false); // Reset scope description editing when switching scopes
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {nameEditMode ? (
            <>
              <input
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                style={{ fontSize: '1.2em', fontFamily: 'Lexend, sans-serif', borderRadius: 4, border: '1px solid #ccc', padding: 4 }}
                autoFocus
              />
              <button onClick={handleNameSave} style={{ padding: '2px 8px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
              <button onClick={() => setNameEditMode(false)} style={{ padding: '2px 8px', background: '#bbb', color: '#222', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
            </>
          ) : (
            <>
              <h2 style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, fontSize: '1.3em', marginBottom: 10 }}>{project.name}</h2>
            </>
          )}
        </div>
        <div
          style={{
            border: '1px solid #dcdde1',
            borderRadius: 6,
            padding: 14,
            minHeight: 60,
            background: '#f8fafb',
            position: 'relative',
            fontFamily: 'Lexend, sans-serif',
            fontSize: '1em',
            marginBottom: 10,
            marginTop: 20
          }}
        >
          {descEditMode ? (
            <>
              <textarea
                value={descDraft}
                onChange={e => setDescDraft(e.target.value)}
                style={{ width: '100%', minHeight: 40, fontFamily: 'Lexend, sans-serif', fontSize: '1em', borderRadius: 4, border: '1px solid #ccc', resize: 'vertical' }}
                autoFocus
              />
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button onClick={handleDescSave} style={{ padding: '4px 14px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Save</button>
                <button onClick={() => setDescEditMode(false)} style={{ padding: '4px 14px', background: '#bbb', color: '#222', border: 'none', borderRadius: 4, cursor: 'pointer' }}>Cancel</button>
              </div>
            </>
          ) : project.description ? (
            <div style={{ position: 'relative' }}>
              <span>{project.description}</span>
              <img 
                src={editIcon} 
                alt="Edit" 
                className="edit-icon"
                onClick={() => { 
                  setDescDraft(project.description); 
                  setDescEditMode(true); 
                }}
              />
            </div>
          ) : (
            <button
              onClick={() => { setDescDraft(''); setDescEditMode(true); }}
              style={{ padding: '6px 16px', background: '#3498db', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: '.98em' }}
            >
              + Add Description
            </button>
          )}
        </div>
        
        {/* Scope Selection */}
        {project.scopes && project.scopes.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontFamily: 'Lexend, sans-serif', 
              fontWeight: 600, 
              fontSize: '1.1em', 
              marginBottom: '12px',
              color: '#2c3e50'
            }}>
              Scopes:
            </h3>
            <div style={{ 
              display: 'flex', 
              gap: '8px', 
              flexWrap: 'wrap',
              alignItems: 'center'
            }}>
              {project.scopes.map((scope, index) => (
                <button
                  key={scope.id}
                  onClick={() => handleScopeSelection(index)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: selectedScope === index ? '#3498db' : '#ecf0f1',
                    color: selectedScope === index ? '#fff' : '#2c3e50',
                    border: '1px solid',
                    borderColor: selectedScope === index ? '#3498db' : '#bdc3c7',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: selectedScope === index ? '600' : '500',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif',
                    transition: 'all 0.2s ease',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}
                  onMouseOver={(e) => {
                    if (selectedScope !== index) {
                      e.target.style.backgroundColor = '#d5dbdb';
                      e.target.style.borderColor = '#95a5a6';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (selectedScope !== index) {
                      e.target.style.backgroundColor = '#ecf0f1';
                      e.target.style.borderColor = '#bdc3c7';
                    }
                  }}
                >
                  Scope {scope.scopeNumber}
                </button>
              ))}
            </div>
            {currentScope && (
              <div style={{
                marginTop: '12px',
                padding: '12px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px',
                border: '1px solid #e9ecef',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#495057',
                position: 'relative'
              }}>
                {scopeDescEditMode ? (
                  <>
                    <textarea
                      value={scopeDescDraft}
                      onChange={e => setScopeDescDraft(e.target.value)}
                      style={{ 
                        width: '100%', 
                        minHeight: 40, 
                        fontFamily: 'Lexend, sans-serif', 
                        fontSize: '0.95em', 
                        borderRadius: 4, 
                        border: '1px solid #ccc', 
                        resize: 'vertical',
                        marginBottom: '8px'
                      }}
                      placeholder="Enter scope description..."
                      autoFocus
                    />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button 
                        onClick={handleScopeDescSave} 
                        style={{ 
                          padding: '4px 14px', 
                          background: '#27ae60', 
                          color: '#fff', 
                          border: 'none', 
                          borderRadius: 4, 
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                      >
                        Save
                      </button>
                      <button 
                        onClick={() => setScopeDescEditMode(false)} 
                        style={{ 
                          padding: '4px 14px', 
                          background: '#bbb', 
                          color: '#222', 
                          border: 'none', 
                          borderRadius: 4, 
                          cursor: 'pointer',
                          fontSize: '0.9em'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {currentScope.scopeText || 'No description provided'}
                    <img 
                      src={editIcon} 
                      alt="Edit" 
                      className="edit-icon"
                      onClick={() => { 
                        setScopeDescDraft(currentScope.scopeText || ''); 
                        setScopeDescEditMode(true); 
                      }}
                    />
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
            onClick={() => setCurrentView(currentView === 'behavioral' ? 'details' : 'behavioral')}
            style={{ 
              padding: '8px 16px', 
              background: currentView === 'behavioral' ? '#16a085' : '#27ae60', 
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
            onClick={() => setCurrentView(currentView === 'situation' ? 'details' : 'situation')}
            style={{ 
              padding: '8px 16px', 
              background: currentView === 'situation' ? '#8e44ad' : '#9b59b6', 
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
          // Behavioral Diversity View
          <>
            {/* Sort options and Download button */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              marginBottom: 20 
            }}>
              <div style={{ marginBottom: 0 }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: 8,
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.95em',
                  color: '#34495e'
                }}>
                  Sort by:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 4,
                    border: '1px solid #dcdde1',
                    fontSize: '0.95em',
                    fontFamily: 'Lexend, sans-serif',
                    color: '#2c3e50',
                    background: '#fff',
                    width: '200px'
                  }}
                >
                  <option value="">-No Sorting-</option>
                  <option value="age">Age Range</option>
                  <option value="gender">Gender</option>
                </select>
              </div>

              {/* PDF Download Button */}
              <button
                onClick={generatePDF}
                disabled={isPdfGenerating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: isPdfGenerating ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isPdfGenerating ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {isPdfGenerating ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    Download as PDF
                  </>
                )}
              </button>
            </div>

            {/* Wrap the entire behavioral content in a ref with max-width */}
            <div 
              ref={behavioralRef}
              style={{
                maxWidth: '100%',
                width: 'fit-content'
              }}
            >
              {/* Grouped participants */}
              {Object.entries(getGroupedParticipants()).map(([group, groupParticipants]) => (
                <div key={group} style={{ marginBottom: 20 }}>
                  <h3 style={{ 
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1em',
                    color: '#2c3e50',
                    marginBottom: 10,
                    borderBottom: '1px solid #dcdde1',
                    paddingBottom: 8
                  }}>
                    {group}
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                    {groupParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        style={{
                          flex: '0 0 calc(33.333% - 20px)',
                          background: '#fff',
                          borderRadius: 8,
                          padding: '20px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          border: '1px solid #dcdde1',
                          boxSizing: 'border-box'
                        }}
                      >
                        <h3 style={{ 
                          margin: '0 0 15px 0',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '1.1em',
                          color: '#2c3e50',
                          borderBottom: '1px solid #eee',
                          paddingBottom: 10
                        }}>
                          {participant.name}
                        </h3>
                        
                        <div style={{ marginBottom: 15 }}>
                          <h4 style={{ 
                            margin: '0 0 8px 0',
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '0.95em',
                            color: '#34495e'
                          }}>
                            Selected Rules:
                          </h4>
                          <div style={{ 
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            padding: '10px',
                            background: '#f8f9fa',
                            borderRadius: 4
                          }}>
                            {(project.rules || []).map((rule, index) => {
                              const isSelected = participant.answers?.['Rule Selection']?.selectedRules?.includes(rule);
                              return (
                                <div
                                  key={index}
                                  style={{
                                    padding: '6px 12px',
                                    background: isSelected ? '#3498db' : '#fff',
                                    color: isSelected ? '#fff' : '#2c3e50',
                                    border: '1px solid #dcdde1',
                                    borderRadius: '4px',
                                    fontSize: '0.95em',
                                    fontFamily: 'Lexend, sans-serif',
                                    transition: 'all 0.2s ease'
                                  }}
                                >
                                  {rule}
                                </div>
                              );
                            })}
                            {(project.rules || []).length === 0 && (
                              <div style={{
                                padding: '10px',
                                color: '#7f8c8d',
                                fontStyle: 'italic',
                                width: '100%',
                                textAlign: 'center'
                              }}>
                                No rules defined for this project
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Rule Usage Statistics Graph */}
              <h3 style={{ 
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1.1em',
                color: '#2c3e50',
                marginBottom: '20px'
              }}>
                Rule Usage Statistics
              </h3>
              <div style={{ 
                marginTop: '40px',
                padding: '20px',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                border: '1px solid #dcdde1'
              }}>
                

                {/* Independent Sorting Controls for Stats */}
                <div style={{ 
                  marginBottom: '20px'
                }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: '8px',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '0.95em',
                    color: '#34495e'
                  }}>
                    View Statistics By:
                  </label>
                  <select
                    value={statsSort}
                    onChange={(e) => setStatsSort(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '4px',
                      border: '1px solid #dcdde1',
                      fontSize: '0.95em',
                      fontFamily: 'Lexend, sans-serif',
                      color: '#2c3e50',
                      background: '#fff',
                      width: '150px'
                    }}
                  >
                    <option value="">All Participants</option>
                    <option value="gender">By Gender</option>
                    <option value="age">By Age Range</option>
                  </select>
                </div>

                {/* Bar Graph */}
                <div style={{ 
                  marginTop: '20px',
                  position: 'relative',
                  height: '400px',
                  padding: '20px'
                }}>
                  <Bar
                    data={getChartData(statsSort)}
                    options={getChartOptions(statsSort)}
                  />
                </div>
              </div>
            </div>
          </>
        ) : currentView === 'personae' ? (
          // Personae Mapping View
          <>
            {/* View selection buttons and PDF download */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
              <button
                onClick={() => setPersonaeView('framework')}
                style={{
                  padding: '8px 16px',
                  background: personaeView === 'framework' ? '#1a5276' : '#2980b9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Framework View
              </button>
              <button
                onClick={() => setPersonaeView('summary')}
                style={{
                  padding: '8px 16px',
                  background: personaeView === 'summary' ? '#1a5276' : '#2980b9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
              >
                Summary View
              </button>

              {/* PDF Download Button */}
              <button
                onClick={generatePDF}
                disabled={isPdfGenerating}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: isPdfGenerating ? 'wait' : 'pointer',
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  opacity: isPdfGenerating ? 0.7 : 1,
                  transition: 'opacity 0.2s'
                }}
              >
                {isPdfGenerating ? (
                  <>
                    <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
                    Generating PDF...
                  </>
                ) : (
                  <>     
                    Download as PDF
                  </>
                )}
              </button>
            </div>

            {personaeView === 'framework' ? (
              // Framework View Content
              <>
                {/* Sort options */}
                <div style={{ marginBottom: 20 }}>
                  <label style={{ 
                    display: 'block', 
                    marginBottom: 8,
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '0.95em',
                    color: '#34495e'
                  }}>
                    Sort by:
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 4,
                      border: '1px solid #dcdde1',
                      fontSize: '0.95em',
                      fontFamily: 'Lexend, sans-serif',
                      color: '#2c3e50',
                      background: '#fff',
                      width: '200px'
                    }}
                  >
                    <option value="">-No Sorting-</option>
                    <option value="age">Age Range</option>
                    <option value="gender">Gender</option>
                  </select>
                </div>

                {/* Grouped participants */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {Object.entries(getGroupedParticipants()).map(([group, groupParticipants]) => (
                    <div key={group}>
                      <h3 style={{ 
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '1em',
                        color: '#2c3e50',
                        marginBottom: 10
                      }}>
                        {group}
                      </h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {groupParticipants.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedParticipant(selectedParticipant?.id === p.id ? null : p)}
                            style={{
                              padding: '6px 12px',
                              background: selectedParticipant?.id === p.id ? '#1a5276' : '#2980b9',
                              color: '#fff',
                              border: 'none',
                              borderRadius: 4,
                              cursor: 'pointer',
                              fontSize: '.98em',
                              transition: 'all 0.2s ease',
                              opacity: selectedParticipant?.id === p.id ? 1 : 0.85,
                              transform: selectedParticipant?.id === p.id ? 'scale(1.05)' : 'scale(1)'
                            }}
                          >
                            {p.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              // Summary View Content
              <>
                {/* Filter Options */}
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ 
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1em',
                    color: '#2c3e50',
                    marginBottom: 10
                  }}>
                    Filter by Age Range:
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
                    {AGE_RANGES.map(range => (
                      <button
                        key={range}
                        onClick={() => handleAgeRangeToggle(range)}
                        style={{
                          padding: '6px 12px',
                          background: selectedAgeRanges.includes(range) ? '#1a5276' : '#2980b9',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '.9em',
                          transition: 'background-color 0.2s',
                          opacity: selectedAgeRanges.includes(range) ? 1 : 0.7
                        }}
                      >
                        {range}
                      </button>
                    ))}
                  </div>

                  <h3 style={{ 
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1em',
                    color: '#2c3e50',
                    marginBottom: 10
                  }}>
                    Filter by Gender:
                  </h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {GENDER_OPTIONS.map(gender => (
                      <button
                        key={gender}
                        onClick={() => handleGenderToggle(gender)}
                        style={{
                          padding: '6px 12px',
                          background: selectedGenders.includes(gender) ? '#1a5276' : '#2980b9',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          cursor: 'pointer',
                          fontSize: '.9em',
                          transition: 'background-color 0.2s',
                          opacity: selectedGenders.includes(gender) ? 1 : 0.7
                        }}
                      >
                        {gender}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        ) : currentView === 'situation' ? (
          // Situation Design View
          <div style={{ padding: '24px' }}>
            {/* Missing Summaries Dialog */}
            {showMissingSummariesDialog && (
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
                  }}>Missing Summaries</h3>
                  <p style={{ 
                    margin: '0 0 16px 0',
                    color: '#34495e',
                    fontSize: '1em',
                    lineHeight: '1.5',
                    fontFamily: 'Lexend, sans-serif'
                  }}>
                    Please generate or fill up summaries for the following participants:
                  </p>
                  <div style={{
                    margin: '0 0 24px 0',
                    padding: '12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef',
                    maxHeight: '150px',
                    overflowY: 'auto'
                  }}>
                    {missingSummariesList.map((participant, index) => (
                      <div
                        key={participant.id}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: index % 2 === 0 ? '#fff' : '#f8f9fa',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.95em',
                          color: '#2c3e50',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span style={{
                          width: '24px',
                          height: '24px',
                          backgroundColor: '#8e44ad',
                          color: '#fff',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8em',
                          fontWeight: 'bold'
                        }}>
                          {index + 1}
                        </span>
                        {participant.name}
                      </div>
                    ))}
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'flex-end'
                  }}>
                    <button
                      onClick={() => setShowMissingSummariesDialog(false)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#8e44ad',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.95em',
                        fontFamily: 'Lexend, sans-serif',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => e.target.style.backgroundColor = '#9b59b6'}
                      onMouseOut={(e) => e.target.style.backgroundColor = '#8e44ad'}
                    >
                      Got it
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {/* Generated Rules Section */}
              <div style={{ width: '100%' }}>
                <h3 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.2em',
                  color: '#2c3e50',
                  marginBottom: '16px'
                }}>
                  Generated Rules
                </h3>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: '8px',
                  marginBottom: '20px'
                }}>
                  {(project.rules || []).map((rule, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedRule(selectedRule === rule ? null : rule)}
                      style={{
                        padding: '8px 16px',
                        background: selectedRule === rule ? '#8e44ad' : '#95a5a6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        transition: 'all 0.2s ease',
                        opacity: selectedRule === rule ? 1 : 0.7
                      }}
                      onMouseOver={(e) => {
                        if (selectedRule !== rule) {
                          e.target.style.background = '#8e44ad';
                          e.target.style.opacity = '0.9';
                        }
                      }}
                      onMouseOut={(e) => {
                        if (selectedRule !== rule) {
                          e.target.style.background = '#95a5a6';
                          e.target.style.opacity = '0.7';
                        }
                      }}
                    >
                      {rule}
                    </button>
                  ))}
                </div>

                {/* Participant Cards for Selected Rule */}
                {selectedRule && (
                  <div style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '16px',
                    marginBottom: '24px'
                  }}>
                    {participants
                      .filter(p => p.answers?.['Rule Selection']?.selectedRules?.includes(selectedRule))
                      .map(participant => (
                        <div
                          key={participant.id}
                          style={{
                            flex: '0 0 calc(33.333% - 16px)',
                            background: '#fff',
                            borderRadius: '8px',
                            padding: '16px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            border: '1px solid #dcdde1',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            const tooltip = document.createElement('div');
                            tooltip.id = `tooltip-${participant.id}`;
                            tooltip.style.cssText = `
                              position: absolute;
                              left: 50%;
                              transform: translateX(-50%) translateY(10%);
                              bottom: -10px;
                              background: #2c3e50;
                              color: white;
                              padding: 12px 16px;
                              border-radius: 6px;
                              font-family: 'Lexend', sans-serif;
                              font-size: 0.9em;
                              line-height: 1.5;
                              width: 300px;
                              z-index: 1000;
                              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
                              white-space: pre-wrap;
                              pointer-events: none;
                            `;
                            tooltip.textContent = participant.summary || 'No Summary Available';
                            e.currentTarget.appendChild(tooltip);
                          }}
                          onMouseLeave={(e) => {
                            const tooltip = document.getElementById(`tooltip-${participant.id}`);
                            if (tooltip) {
                              tooltip.remove();
                            }
                          }}
                        >
                          <h4 style={{ 
                            margin: '0 0 8px 0',
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '1em',
                            color: '#2c3e50'
                          }}>
                            {participant.name}
                          </h4>
                          <div style={{ 
                            fontSize: '0.9em',
                            color: '#7f8c8d',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}>
                            {participant.answers?.Identity?.age && (
                              <div>Age: {participant.answers.Identity.age}</div>
                            )}
                            {participant.answers?.Identity?.gender && (
                              <div>Gender: {participant.answers.Identity.gender}</div>
                            )}
                            {participant.answers?.Identity?.nationality && (
                              <div>Nationality: {participant.answers.Identity.nationality}</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
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
                  <PersonaeBoxes 
                    selectedParticipant={selectedParticipant}
                    onConnectionsCalculated={setConnections}
                    showConnections={true}
                    project={project}
                  />

                  {/* SVG Container for Lines */}
                  <svg 
                    style={{ 
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      overflow: 'visible',
                      zIndex: 1
                    }}
                  >
                    {connections.map((connection, index) => (
                      <g key={index}>
                        <path
                          d={connection.path}
                          stroke="rgba(255, 255, 255, 0.6)"
                          strokeWidth="2"
                          fill="none"
                        />
                        <path
                          d={`M ${connection.arrow.x} ${connection.arrow.y} 
                             l ${connection.arrow.direction === 'right' ? '8' : '-8'} -4 
                             l 0 8 z`}
                          fill="rgba(255, 255, 255, 0.6)"
                        />
                      </g>
                    ))}
                  </svg>
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
            ) : (
              // Summary View Content
              <div ref={summaryRef} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {getFilteredParticipants().map(participant => (
                  <div
                    key={participant.id}
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      padding: 20,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      border: '1px solid #dcdde1'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      marginBottom: 10,
                      borderBottom: '1px solid #eee',
                      paddingBottom: 10
                    }}>
                      <h3 style={{ 
                        margin: 0,
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '1.1em',
                        color: '#2c3e50'
                      }}>
                        {participant.name}
                      </h3>
                      <div style={{ 
                        display: 'flex',
                        gap: 15,
                        fontSize: '0.9em',
                        color: '#7f8c8d'
                      }}>
                        {participant.answers?.Identity?.age && (
                          <span>Age: {participant.answers.Identity.age}</span>
                        )}
                        {participant.answers?.Identity?.gender && (
                          <span>Gender: {participant.answers.Identity.gender}</span>
                        )}
                      </div>
                    </div>
                    <p style={{ 
                      margin: 0,
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.95em',
                      color: '#737B83',
                      lineHeight: 1.5
                    }}>
                      {participant.summary || 'No summary available.'}
                    </p>
                  </div>
                ))}
              </div>
            )
          )}
          {currentView === 'situation' && (
            <div style={{ padding: '24px' }}>

            {/* Robot Changes Section */}
              <div style={{ width: '100%' }}>
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
                      const updatedProject = {
                        ...project,
                        situationDesign: {
                          ...project.situationDesign,
                          robotChanges: newValue
                        }
                      };
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
                  paddingTop: '20px',
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
                      const updatedProject = {
                        ...project,
                        situationDesign: {
                          ...project.situationDesign,
                          environmentalChanges: newValue
                        }
                      };
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

              {/* Generate Button at bottom */}
              <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                <button
                  onClick={handleGenerateSituationDesign}
                  disabled={isGeneratingSuggestions}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isGeneratingSuggestions ? '#95a5a6' : '#95a5a6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isGeneratingSuggestions ? 'wait' : 'pointer',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    opacity: isGeneratingSuggestions ? 0.7 : 0.7
                  }}
                  onMouseOver={(e) => {
                    if (!isGeneratingSuggestions) {
                      e.target.style.backgroundColor = '#8e44ad';
                      e.target.style.opacity = '1';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!isGeneratingSuggestions) {
                      e.target.style.backgroundColor = '#95a5a6';
                      e.target.style.opacity = '0.7';
                    }
                  }}
                >
                  {isGeneratingSuggestions ? 'Generating Suggestions...' : 'Generate Situation Design Suggestions Using LLM'}
                </button>

                {isGeneratingSuggestions && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '8px'
                    }}>
                      <span style={{ 
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '0.9em',
                        color: '#666'
                      }}>
                        Generating suggestions...
                      </span>
                      <span style={{ 
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '0.9em',
                        color: '#666',
                        fontWeight: 'bold'
                      }}>
                        {generationProgress}%
                      </span>
                    </div>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      backgroundColor: '#eee',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${generationProgress}%`,
                        height: '100%',
                        backgroundColor: '#8e44ad',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>  
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetails; 