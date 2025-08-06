import React, { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { parseFactors } from '../utils/factorUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

const getPersonaCards = (projectData) => {
  if (!projectData?.scopes) return [];
  
  // Group participants by scope
  const scopeGroups = {};
  projectData.scopes.forEach((scope, scopeIndex) => {
    const scopeNumber = scope.scopeNumber || scopeIndex + 1;
    scopeGroups[`Scope ${scopeNumber}`] = scope.participants || [];
  });
  
  return scopeGroups;
};

const getTopCharacteristics = (answers) => {
  if (!answers) return [];
  const out = [];
  
  // Debug: log the answers structure
  console.log('Participant answers:', answers);
  
  // Try to get characteristics from various sections
  const sections = ['Situation', 'Identity', 'Definition of the Situation', 'Decision'];
  
  sections.forEach(section => {
    if (answers[section]) {
      Object.entries(answers[section]).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value.trim()) {
          // Skip selectedRules as they're handled separately
          if (key !== 'selectedRules') {
            out.push(`${key}: ${value}`);
          }
        }
      });
    }
  });
  
  // Also check for any direct properties in answers
  Object.entries(answers).forEach(([key, value]) => {
    if (value && typeof value === 'string' && value.trim() && !sections.includes(key)) {
      out.push(`${key}: ${value}`);
    }
  });
  
  return out.slice(0, 5);
};

const getRepresentativeRules = (answers) => {
  // Return up to 2 rules or quotes
  const rules = answers?.['Rule Selection']?.selectedRules || [];
  if (rules.length > 0) return rules.slice(0, 2);
  // Fallback: try to find a quote
  if (answers?.['Definition of the Situation']?.Quote) return [answers['Definition of the Situation'].Quote];
  return [];
};

const getRuleCounts = (projectData, scopeIndex = null) => {
  // Get rule selection counts for specific scope or all scopes
  const ruleCounts = {};
  if (!projectData?.scopes) return ruleCounts;
  
  if (scopeIndex !== null) {
    // Get counts for specific scope
    const scope = projectData.scopes[scopeIndex];
    if (scope?.participants) {
      scope.participants.forEach(p => {
        const rules = p.answers?.['Rule Selection']?.selectedRules || [];
        rules.forEach(rule => {
          ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
        });
      });
    }
  } else {
    // Get counts for all scopes (aggregated)
    projectData.scopes.forEach(scope => {
      (scope.participants || []).forEach(p => {
        const rules = p.answers?.['Rule Selection']?.selectedRules || [];
        rules.forEach(rule => {
          ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
        });
      });
    });
  }
  
  return ruleCounts;
};

const getSituationDesignRecommendations = (projectData) => {
  const recommendations = [];
  if (!projectData?.scopes) return recommendations;
  
  projectData.scopes.forEach((scope, scopeIndex) => {
    if (scope.situationDesign) {
      if (scope.situationDesign.robotChanges && scope.situationDesign.robotChanges.trim()) {
        recommendations.push({
          type: 'Robot Changes',
          scope: scope.scopeNumber || scopeIndex + 1,
          content: scope.situationDesign.robotChanges
        });
      }
      if (scope.situationDesign.environmentalChanges && scope.situationDesign.environmentalChanges.trim()) {
        recommendations.push({
          type: 'Environmental Changes',
          scope: scope.scopeNumber || scopeIndex + 1,
          content: scope.situationDesign.environmentalChanges
        });
      }
    }
  });
  return recommendations;
};

const getNextSteps = (projectData) => {
  const steps = [];
  if (!projectData?.scopes) return steps;
  
  // Check for situation design recommendations
  const hasSituationDesign = projectData.scopes.some(scope => 
    scope.situationDesign && 
    (scope.situationDesign.robotChanges?.trim() || scope.situationDesign.environmentalChanges?.trim())
  );
  
  if (hasSituationDesign) {
    steps.push('Implement the suggested robot and environmental changes from the Situation Design analysis');
  }
  
  // Check for rules with low selection (potential issues)
  const ruleCounts = getRuleCounts(projectData);
  const totalParticipants = Object.values(getPersonaCards(projectData)).flat().length;
  const lowSelectionRules = Object.entries(ruleCounts)
    .filter(([rule, count]) => count < Math.ceil(totalParticipants * 0.3)) // Less than 30% selection
    .map(([rule]) => rule);
  
  if (lowSelectionRules.length > 0) {
    steps.push(`Review and potentially revise rules with low adoption: ${lowSelectionRules.join(', ')}`);
  }
  
  // Check for participants without summaries
  const participantsWithoutSummaries = Object.values(getPersonaCards(projectData))
    .flat()
    .filter(p => !p.summary || !p.summary.trim());
  
  if (participantsWithoutSummaries.length > 0) {
    steps.push(`Generate summaries for ${participantsWithoutSummaries.length} participants to complete the analysis`);
  }
  
  // Default step if no specific issues found
  if (steps.length === 0) {
    steps.push('Review the behavioral diversity patterns to identify potential improvements');
    steps.push('Consider conducting follow-up interviews with participants who showed unique behavioral patterns');
  }
  
  return steps;
};

const ProjectReport = ({ projectData, executiveSummary, onGenerateSummary }) => {
  const [expandedParticipants, setExpandedParticipants] = useState(new Set());
  const [behavioralSortBy, setBehavioralSortBy] = useState("");
  const [showAllScopes, setShowAllScopes] = useState(true);
  const [selectedScopes, setSelectedScopes] = useState(new Set());
  const [undesirableRulesMap, setUndesirableRulesMap] = useState({});
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Load undesirable rules for all scopes
  useEffect(() => {
    const loadUndesirableRules = async () => {
      if (!projectData?.scopes) return;
      
      const rulesMap = {};
      
      for (const scope of projectData.scopes) {
        if (scope.id) {
          try {
            const undesirableRules = await window.electronAPI.getUndesirableRules(scope.id);
            rulesMap[scope.id] = undesirableRules || [];
          } catch (error) {
            console.error('Error loading undesirable rules for scope', scope.id, ':', error);
            rulesMap[scope.id] = [];
          }
        }
      }
      
      setUndesirableRulesMap(rulesMap);
    };

    loadUndesirableRules();
  }, [projectData]);

  // PDF download functionality
  const handleDownloadPDF = async () => {
    if (isGeneratingPDF) return; // Prevent multiple clicks
    
    setIsGeneratingPDF(true);
    
    try {
      const element = document.querySelector('.report-content');
      if (!element) {
        console.error('Report content element not found');
        return;
      }

      // Ensure element is fully expanded before capturing
      const originalOverflow = element.style.overflow;
      element.style.overflow = 'visible';
      
      // Create canvas from the content
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        height: element.scrollHeight,
        width: element.scrollWidth,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight
      });
      
      // Restore original overflow
      element.style.overflow = originalOverflow;

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions
      const pdfWidth = 595; // A4 width in points
      const pdfHeight = 842; // A4 height in points
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate how many pages we need
      const ratio = imgWidth / pdfWidth;
      const scaledHeight = imgHeight / ratio;
      const pagesNeeded = Math.ceil(scaledHeight / pdfHeight);
      
      const pdf = new jsPDF('p', 'pt', 'a4');
      
      for (let i = 0; i < pagesNeeded; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const yPosition = -(pdfHeight * i);
        pdf.addImage(imgData, 'PNG', 0, yPosition, pdfWidth, scaledHeight);
      }
      
      pdf.save(`${projectData?.name || 'Project'}_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const toggleParticipantExpansion = (participantId) => {
    setExpandedParticipants(prev => {
      const newSet = new Set(prev);
      if (newSet.has(participantId)) {
        newSet.delete(participantId);
      } else {
        newSet.add(participantId);
      }
      return newSet;
    });
  };

  // Behavioral diversity grouping functions
  const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Other'];

  const getGroupedParticipants = () => {
    const allParticipants = Object.values(getPersonaCards(projectData)).flat();
    if (!allParticipants) return {};

    if (!behavioralSortBy) {
      // Return all participants in a single group when no sorting is selected
      return { 'All Participants': allParticipants };
    }

    if (behavioralSortBy === 'age') {
      const groups = {
        ...AGE_RANGES.reduce((acc, range) => ({ ...acc, [range]: [] }), {}),
        'Unspecified Age Range': []
      };

      allParticipants.forEach(p => {
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

      allParticipants.forEach(p => {
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

  // Get all rules from all scopes
  const getAllRules = () => {
    const allRules = new Set();
    if (projectData?.scopes) {
      projectData.scopes.forEach(scope => {
        (scope.rules || []).forEach(rule => allRules.add(rule));
      });
    }
    return Array.from(allRules);
  };

  // Filter data based on scope selection
  const getFilteredScopes = () => {
    if (!projectData?.scopes) return [];
    
    if (showAllScopes) {
      return projectData.scopes;
    } else {
      return projectData.scopes.filter((_, index) => selectedScopes.has(index));
    }
  };

  const getFilteredPersonaCards = () => {
    const filteredScopes = getFilteredScopes();
    const scopeGroups = {};
    
    filteredScopes.forEach((scope, index) => {
      const scopeName = `Scope ${scope.scopeNumber}`;
      scopeGroups[scopeName] = (scope.participants || []).map(p => ({
        ...p,
        scopeIndex: index
      }));
    });
    
    return scopeGroups;
  };

  const getFilteredSituationRecommendations = () => {
    const filteredScopes = getFilteredScopes();
    const recommendations = {};
    
    filteredScopes.forEach((scope, index) => {
      const scopeName = `Scope ${scope.scopeNumber}`;
      const scopeUndesirableRules = undesirableRulesMap[scope.id] || [];
      
      recommendations[scopeName] = {
        robotChanges: scope.situationDesign?.robotChanges || '',
        environmentalChanges: scope.situationDesign?.environmentalChanges || '',
        generatedRules: scope.rules || [],
        undesirableRules: scopeUndesirableRules,
        scopeId: scope.id
      };
    });
    
    return recommendations;
  };

  const handleScopeToggle = (scopeIndex) => {
    const newSelectedScopes = new Set(selectedScopes);
    if (newSelectedScopes.has(scopeIndex)) {
      newSelectedScopes.delete(scopeIndex);
    } else {
      newSelectedScopes.add(scopeIndex);
    }
    setSelectedScopes(newSelectedScopes);
  };

  const handleShowAllScopes = () => {
    setShowAllScopes(true);
    setSelectedScopes(new Set());
  };

  const handleShowSelectedScopes = () => {
    setShowAllScopes(false);
  };

  // Persona cards grouped by scope
  const personaCardsByScope = getFilteredPersonaCards();

  // Bar chart data for rule selection
  const ruleCounts = getRuleCounts(projectData);
  const barData = {
    labels: Object.keys(ruleCounts),
    datasets: [
      {
        label: 'Participants',
        data: Object.values(ruleCounts),
        backgroundColor: '#3498db',
      },
    ],
  };

  // Pie chart data for rule selection
  const pieData = {
    labels: Object.keys(ruleCounts),
    datasets: [
      {
        data: Object.values(ruleCounts),
        backgroundColor: [
          '#3498db',
          '#e74c3c',
          '#2ecc71',
          '#f39c12',
          '#9b59b6',
          '#1abc9c',
          '#34495e',
          '#e67e22',
        ],
      },
    ],
  };

  // Situation design recommendations
  const situationRecommendations = getFilteredSituationRecommendations();

  // Next steps
  const nextSteps = getNextSteps(projectData);

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ 
        fontFamily: 'Lexend, sans-serif', 
        background: '#f7f9fa', 
        color: '#222', 
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        padding: '32px 16px',
        width: '100%',
        overflow: 'visible' // Ensure content is never clipped
      }}>
      <div className="report-content" style={{
        maxWidth: '816px', // Letter size width (8.5 inches * 96 DPI)
        width: '100%',
        background: '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        padding: '32px',
        margin: '0 auto',
        minHeight: 'auto', // Ensure no minimum height constraints
        height: 'auto' // Allow dynamic height based on content
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
          <h1 style={{ fontWeight: 700, fontSize: '2em', margin: 0 }}>{projectData?.name || 'Project Report'}</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              onClick={handleDownloadPDF} 
              disabled={isGeneratingPDF}
              style={{
                ...buttonStyle,
                backgroundColor: isGeneratingPDF ? '#95a5a6' : '#3498db',
                cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
                opacity: isGeneratingPDF ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              {isGeneratingPDF && (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #fff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
              )}
              {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
            </button>
          </div>
        </div>

        {/* Scope Selection Toggle */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '24px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <h3 style={{
            fontFamily: 'Lexend, sans-serif',
            fontWeight: '600',
            fontSize: '1.1em',
            color: '#2c3e50',
            margin: '0 0 16px 0'
          }}>
            Scope Selection
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
              <button
                onClick={handleShowAllScopes}
                style={{
                  padding: '8px 16px',
                  backgroundColor: showAllScopes ? '#3498db' : '#f8f9fa',
                  color: showAllScopes ? '#fff' : '#2c3e50',
                  border: '1px solid',
                  borderColor: showAllScopes ? '#3498db' : '#e9ecef',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: showAllScopes ? '600' : '500',
                  fontSize: '0.9em',
                  fontFamily: 'Lexend, sans-serif',
                  transition: 'all 0.2s ease'
                }}
              >
                Show All Scopes
              </button>
              <button
                onClick={handleShowSelectedScopes}
                style={{
                  padding: '8px 16px',
                  backgroundColor: !showAllScopes ? '#3498db' : '#f8f9fa',
                  color: !showAllScopes ? '#fff' : '#2c3e50',
                  border: '1px solid',
                  borderColor: !showAllScopes ? '#3498db' : '#e9ecef',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: !showAllScopes ? '600' : '500',
                  fontSize: '0.9em',
                  fontFamily: 'Lexend, sans-serif',
                  transition: 'all 0.2s ease'
                }}
              >
                Select Specific Scopes
              </button>
            </div>
            
            {!showAllScopes && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {projectData?.scopes?.map((scope, index) => (
                  <button
                    key={index}
                    onClick={() => handleScopeToggle(index)}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: selectedScopes.has(index) ? '#27ae60' : '#f8f9fa',
                      color: selectedScopes.has(index) ? '#fff' : '#2c3e50',
                      border: '1px solid',
                      borderColor: selectedScopes.has(index) ? '#27ae60' : '#e9ecef',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: selectedScopes.has(index) ? '600' : '500',
                      fontSize: '0.85em',
                      fontFamily: 'Lexend, sans-serif',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    Scope {scope.scopeNumber}
                  </button>
                ))}
              </div>
            )}
            
            <div style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: '#f8f9fa',
              borderRadius: '4px',
              fontSize: '0.85em',
              color: '#6c757d',
              fontFamily: 'Lexend, sans-serif'
            }}>
              {showAllScopes 
                ? `Showing data from all ${projectData?.scopes?.length || 0} scopes`
                : `Showing data from ${selectedScopes.size} selected scope${selectedScopes.size !== 1 ? 's' : ''}`
              }
            </div>
          </div>
        </div>

        {/* Project Title */}
        <div style={{
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)'
        }}>
          <h1 style={{
            fontFamily: 'Lexend, sans-serif',
            fontWeight: '700',
            fontSize: '2em',
            color: '#2c3e50',
            margin: '0 0 12px 0'
          }}>
            {projectData.name}
          </h1>
          {projectData.description && (
            <p style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1em',
              color: '#495057',
              margin: 0,
              lineHeight: '1.6'
            }}>
              {projectData.description}
            </p>
          )}
        </div>

        {/* Persona Mapping Overview */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Personae Mapping Overview</h2>
          {Object.keys(personaCardsByScope).length === 0 ? (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '2em',
                marginBottom: '12px',
                color: '#95a5a6'
              }}>
                👥
              </div>
              <p style={{
                margin: 0,
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1em',
                color: '#7f8c8d',
                fontWeight: '500'
              }}>
                No participants found
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(personaCardsByScope).map(([scopeName, participants]) => (
                <div key={scopeName}>
                  <h3 style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1.2em',
                    color: '#2c3e50',
                    marginBottom: '16px',
                    borderBottom: '2px solid #3498db',
                    paddingBottom: '8px'
                  }}>
                    {scopeName}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {participants.map(participant => {
                      const isExpanded = expandedParticipants.has(participant.id);
                      return (
                        <div
                          key={participant.id}
                          style={{
                            background: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #dcdde1',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            overflow: 'hidden',
                            transition: 'all 0.3s ease'
                          }}
                        >
                          {/* Header - Clickable */}
                          <div
                            onClick={() => toggleParticipantExpansion(participant.id)}
                            style={{
                              padding: '16px',
                              cursor: 'pointer',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              backgroundColor: isExpanded ? '#f8f9fa' : '#fff',
                              borderBottom: isExpanded ? '1px solid #e9ecef' : 'none',
                              transition: 'background-color 0.2s ease'
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.backgroundColor = isExpanded ? '#e9ecef' : '#f8f9fa';
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.backgroundColor = isExpanded ? '#f8f9fa' : '#fff';
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <h4 style={{ 
                                margin: 0,
                                fontFamily: 'Lexend, sans-serif',
                                fontSize: '1em',
                                color: '#2c3e50'
                              }}>
                                {participant.name}
                              </h4>
                              <div style={{ 
                                fontSize: '0.85em',
                                color: '#7f8c8d',
                                display: 'flex',
                                gap: '12px'
                              }}>
                                {participant.answers?.Identity?.age && (
                                  <span>Age: {participant.answers.Identity.age}</span>
                                )}
                                {participant.answers?.Identity?.gender && (
                                  <span>Gender: {participant.answers.Identity.gender}</span>
                                )}
                                {/* {participant.answers?.Identity?.['Nationality of the participant(s)'] && (
                                  <span>Nationality: {participant.answers.Identity['Nationality of the participant(s)']}</span>
                                )} */}
                              </div>
                            </div>
                            <div style={{
                              fontSize: '1em',
                              color: '#7f8c8d',
                              transition: 'transform 0.5s ease',
                              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)'
                            }}>
                              ▼
                            </div>
                          </div>
                          
                          {/* Expandable Content */}
                          {isExpanded && (
                            <div style={{
                              padding: '16px',
                              backgroundColor: '#f8f9fa',
                              borderTop: '1px solid #e9ecef'
                            }}>
                              {/* Summary Section - Show First */}
                              {participant.summary && participant.summary.trim() && (
                                <div style={{ marginBottom: '20px' }}>
                                  <h5 style={{
                                    margin: '0 0 12px 0',
                                    fontFamily: 'Lexend, sans-serif',
                                    fontSize: '1em',
                                    color: '#2c3e50',
                                    fontWeight: '600',
                                    borderBottom: '2px solid #27ae60',
                                    paddingBottom: '4px'
                                  }}>
                                    Summary:
                                  </h5>
                                  <div style={{
                                    fontFamily: 'Lexend, sans-serif',
                                    fontSize: '0.9em',
                                    color: '#27ae60',
                                    fontStyle: 'italic',
                                    lineHeight: '1.5'
                                  }}>
                                    {participant.summary}
                                  </div>
                                </div>
                              )}

                              {/* Display answers in specific order: Situation, Identity, Definition of Situation */}
                              {['Situation', 'Identity', 'Definition of Situation'].map((sectionName) => {
                                const sectionAnswers = participant.answers?.[sectionName];
                                if (!sectionAnswers) return null;
                                
                                return (
                                  <div key={sectionName} style={{ marginBottom: '20px' }}>
                                    <h5 style={{
                                      margin: '0 0 12px 0',
                                      fontFamily: 'Lexend, sans-serif',
                                      fontSize: '1em',
                                      color: '#2c3e50',
                                      fontWeight: '600',
                                      borderBottom: '2px solid #3498db',
                                      paddingBottom: '4px'
                                    }}>
                                      {sectionName}:
                                    </h5>
                                    
                                    {Object.entries(sectionAnswers || {}).map(([questionText, answer]) => {
                                      if (!answer || answer.trim() === '') return null;
                                      
                                      // Try to extract factors from the question text
                                      let factorDisplay = questionText;
                                      try {
                                        const factors = parseFactors(questionText);
                                        if (factors && factors.length > 0) {
                                          factorDisplay = factors.join(', ');
                                        }
                                      } catch (error) {
                                        // If parsing fails, use the original question text
                                        factorDisplay = questionText;
                                      }
                                      
                                      return (
                                        <div key={questionText} style={{ marginBottom: '8px' }}>
                                          <span style={{
                                            fontFamily: 'Lexend, sans-serif',
                                            fontSize: '0.9em',
                                            color: '#34495e',
                                            fontWeight: '500'
                                          }}>
                                            {factorDisplay} - 
                                          </span>
                                          <span style={{
                                            fontFamily: 'Lexend, sans-serif',
                                            fontSize: '0.9em',
                                            color: '#495057',
                                            marginLeft: '4px'
                                          }}>
                                            {answer}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}

                              {/* Display any remaining sections (except Rule Selection and the ones already shown) */}
                              {Object.entries(participant.answers || {}).map(([sectionName, sectionAnswers]) => {
                                if (sectionName === 'Rule Selection' || 
                                    ['Situation', 'Identity', 'Definition of Situation'].includes(sectionName)) {
                                  return null; // Skip these sections as they're already handled
                                }
                                
                                return (
                                  <div key={sectionName} style={{ marginBottom: '20px' }}>
                                    <h5 style={{
                                      margin: '0 0 12px 0',
                                      fontFamily: 'Lexend, sans-serif',
                                      fontSize: '1em',
                                      color: '#2c3e50',
                                      fontWeight: '600',
                                      borderBottom: '2px solid #3498db',
                                      paddingBottom: '4px'
                                    }}>
                                      {sectionName}:
                                    </h5>
                                    
                                    {Object.entries(sectionAnswers || {}).map(([questionText, answer]) => {
                                      if (!answer || answer.trim() === '') return null;
                                      
                                      // Try to extract factors from the question text
                                      let factorDisplay = questionText;
                                      try {
                                        const factors = parseFactors(questionText);
                                        if (factors && factors.length > 0) {
                                          factorDisplay = factors.join(', ');
                                        }
                                      } catch (error) {
                                        // If parsing fails, use the original question text
                                        factorDisplay = questionText;
                                      }
                                      
                                      return (
                                        <div key={questionText} style={{ marginBottom: '8px' }}>
                                          <span style={{
                                            fontFamily: 'Lexend, sans-serif',
                                            fontSize: '0.9em',
                                            color: '#34495e',
                                            fontWeight: '500'
                                          }}>
                                            {factorDisplay} - 
                                          </span>
                                          <span style={{
                                            fontFamily: 'Lexend, sans-serif',
                                            fontSize: '0.9em',
                                            color: '#495057',
                                            marginLeft: '4px'
                                          }}>
                                            {answer}
                                          </span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                );
                              })}
                              
                              {/* No data message */}
                              {(!participant.answers || Object.keys(participant.answers).length === 0) && 
                               (!participant.summary || !participant.summary.trim()) && (
                                <div style={{
                                  fontFamily: 'Lexend, sans-serif',
                                  fontSize: '0.9em',
                                  color: '#95a5a6',
                                  fontStyle: 'italic',
                                  textAlign: 'center',
                                  padding: '20px'
                                }}>
                                  No detailed data available for this participant
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Behavioral Diversity Insights */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Behavioral Diversity Insights</h2>
          
          {/* Controls row */}
          <div style={{ 
            display: 'flex', 
            gap: '20px', 
            alignItems: 'center', 
            marginBottom: 20,
            flexWrap: 'wrap'
          }}>
            {/* Sort options */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8,
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#34495e'
              }}>
                Sort participants by:
              </label>
              <select
                value={behavioralSortBy}
                onChange={(e) => setBehavioralSortBy(e.target.value)}
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

            {/* Chart type toggle */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: 8,
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#34495e'
              }}>
                Chart type:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setChartType('bar')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: chartType === 'bar' ? '#27ae60' : '#f8f9fa',
                    color: chartType === 'bar' ? '#fff' : '#2c3e50',
                    border: '1px solid',
                    borderColor: chartType === 'bar' ? '#27ae60' : '#e9ecef',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: chartType === 'bar' ? '600' : '500',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📊 Bar Chart
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: chartType === 'pie' ? '#27ae60' : '#f8f9fa',
                    color: chartType === 'pie' ? '#fff' : '#2c3e50',
                    border: '1px solid',
                    borderColor: chartType === 'pie' ? '#27ae60' : '#e9ecef',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: chartType === 'pie' ? '600' : '500',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🥧 Pie Chart
                </button>
              </div>
            </div>
          </div>

          {/* Charts by Scope */}
          {Object.entries(personaCardsByScope).map(([scopeName, scopeParticipants]) => {
            const scopeIndex = parseInt(scopeName.replace('Scope ', '')) - 1;
            const scopeRuleCounts = getRuleCounts(projectData, scopeIndex);
            
            if (Object.keys(scopeRuleCounts).length === 0) {
              return (
                <div key={scopeName} style={{ marginBottom: 32 }}>
                  <h3 style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1.2em',
                    color: '#2c3e50',
                    marginBottom: '16px',
                    borderBottom: '2px solid #27ae60',
                    paddingBottom: '8px'
                  }}>
                    {scopeName} - Statistics
                  </h3>
                  <div style={{ 
                    color: '#888', 
                    textAlign: 'center', 
                    padding: 24,
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    fontStyle: 'italic'
                  }}>
                    No rule selection data available for this scope
                  </div>
                </div>
              );
            }

            const scopeBarData = {
              labels: Object.keys(scopeRuleCounts),
              datasets: [
                {
                  label: 'Participants',
                  data: Object.values(scopeRuleCounts),
                  backgroundColor: '#27ae60',
                },
              ],
            };

            const scopePieData = {
              labels: Object.keys(scopeRuleCounts),
              datasets: [
                {
                  data: Object.values(scopeRuleCounts),
                  backgroundColor: [
                    '#27ae60',
                    '#e74c3c',
                    '#2ecc71',
                    '#f39c12',
                    '#9b59b6',
                    '#1abc9c',
                    '#34495e',
                    '#e67e22',
                  ],
                },
              ],
            };

            return (
              <div key={scopeName} style={{ marginBottom: 32 }}>
                <h3 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.2em',
                  color: '#2c3e50',
                  marginBottom: '16px',
                  borderBottom: '2px solid #27ae60',
                  paddingBottom: '8px'
                }}>
                  {scopeName} - Statistics
                </h3>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                  <div style={{ maxWidth: 500, minWidth: 400 }}>
                    {chartType === 'bar' ? (
                      <>
                        <h4 style={{ textAlign: 'center', marginBottom: 16, fontSize: '1em' }}>Rule Selection Counts</h4>
                        <Bar data={scopeBarData} />
                      </>
                    ) : (
                      <>
                        <h4 style={{ textAlign: 'center', marginBottom: 16, fontSize: '1em' }}>Rule Selection Distribution</h4>
                        <Pie data={scopePieData} />
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Participant Cards by Scope */}
          {Object.entries(personaCardsByScope).map(([scopeName, scopeParticipants]) => {
            // Apply sorting to scope participants
            let sortedParticipants = scopeParticipants;
            if (behavioralSortBy) {
              if (behavioralSortBy === 'age') {
                const groups = {
                  ...AGE_RANGES.reduce((acc, range) => ({ ...acc, [range]: [] }), {}),
                  'Unspecified Age Range': []
                };
                scopeParticipants.forEach(p => {
                  const ageRange = p.answers?.Identity?.age;
                  if (ageRange && AGE_RANGES.includes(ageRange)) {
                    groups[ageRange].push(p);
                  } else {
                    groups['Unspecified Age Range'].push(p);
                  }
                });
                sortedParticipants = Object.values(groups).flat();
              } else if (behavioralSortBy === 'gender') {
                const groups = {
                  ...GENDER_OPTIONS.reduce((acc, gender) => ({ ...acc, [gender]: [] }), {}),
                  'Unspecified Gender': []
                };
                scopeParticipants.forEach(p => {
                  const gender = p.answers?.Identity?.gender;
                  if (gender && GENDER_OPTIONS.includes(gender)) {
                    groups[gender].push(p);
                  } else {
                    groups['Unspecified Gender'].push(p);
                  }
                });
                sortedParticipants = Object.values(groups).flat();
              }
            }

            return (
              <div key={scopeName} style={{ marginBottom: 32 }}>
                <h3 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.2em',
                  color: '#2c3e50',
                  marginBottom: '16px',
                  borderBottom: '2px solid #27ae60',
                  paddingBottom: '8px'
                }}>
                  {scopeName} - Participants
                </h3>
                
                {sortedParticipants.length === 0 ? (
                  <div style={{
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    padding: '20px',
                    textAlign: 'center',
                    color: '#7f8c8d',
                    fontStyle: 'italic'
                  }}>
                    No participants in this scope
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
                    {sortedParticipants.map((participant) => (
                      <div
                        key={participant.id}
                        style={{
                          width: '280px',
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
                            {getAllRules().map((rule, index) => {
                              const isSelected = participant.answers?.['Rule Selection']?.selectedRules?.includes(rule);
                              
                              // Find which scope this participant belongs to
                              const participantScope = projectData.scopes.find(scope => 
                                scope.participants?.some(p => p.id === participant.id)
                              );
                              
                              // Check if this rule is undesirable for this scope
                              const isUndesirable = participantScope?.id && 
                                undesirableRulesMap[participantScope.id]?.includes(rule);
                              
                              // Determine background color based on selection and desirability
                              let backgroundColor = '#fff';
                              let textColor = '#2c3e50';
                              
                              if (isSelected) {
                                if (isUndesirable) {
                                  backgroundColor = '#e74c3c'; // Red for selected undesirable rules
                                  textColor = '#fff';
                                } else {
                                  backgroundColor = '#3498db'; // Blue for selected desirable rules
                                  textColor = '#fff';
                                }
                              }
                              
                              return (
                                <div
                                  key={index}
                                  style={{
                                    padding: '6px 12px',
                                    background: backgroundColor,
                                    color: textColor,
                                    border: '1px solid #dcdde1',
                                    borderRadius: '4px',
                                    fontSize: '0.9em',
                                    fontFamily: 'Lexend, sans-serif',
                                    transition: 'all 0.2s ease',
                                    fontWeight: isUndesirable ? '600' : '400'
                                  }}
                                >
                                  {rule}
                                </div>
                              );
                            })}
                            {getAllRules().length === 0 && (
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
                )}
              </div>
            );
          })}
        </section>

        {/* Situation Design Recommendations */}
        <section style={sectionStyle}>
          <h2 style={sectionTitleStyle}>Situation Design Recommendations</h2>
          {Object.keys(situationRecommendations).length === 0 ? (
            <p style={{ color: '#888', fontStyle: 'italic' }}>No situation design recommendations available.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {Object.entries(situationRecommendations).map(([scopeName, data]) => (
                <div key={scopeName}>
                  <h3 style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1.2em',
                    color: '#2c3e50',
                    marginBottom: '16px',
                    borderBottom: '2px solid #9b59b6',
                    paddingBottom: '8px'
                  }}>
                    {scopeName}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Generated Rules Section */}
                    {data.generatedRules && data.generatedRules.length > 0 && (
                      <div style={recommendationStyle}>
                        <div style={{ fontWeight: 600, marginBottom: 12 }}>
                          Generated Rules
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                          {data.generatedRules.map((rule, index) => {
                            const isUndesirable = data.undesirableRules.includes(rule);
                            return (
                              <div
                                key={index}
                                style={{
                                  padding: '6px 12px',
                                  backgroundColor: isUndesirable ? '#e74c3c' : '#27ae60',
                                  color: '#fff',
                                  borderRadius: '4px',
                                  fontSize: '0.85em',
                                  fontFamily: 'Lexend, sans-serif',
                                  fontWeight: '500',
                                  position: 'relative',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                {isUndesirable && (
                                  <span style={{ fontSize: '0.9em' }}>⚠️</span>
                                )}
                                {rule}
                                
                              </div>
                            );
                          })}
                        </div>
                        {data.undesirableRules.length > 0 && (
                          <div style={{
                            marginTop: '12px',
                            padding: '8px 12px',
                            backgroundColor: '#fff3cd',
                            border: '1px solid #ffeaa7',
                            borderRadius: '4px',
                            fontSize: '0.85em',
                            color: '#856404'
                          }}>
                            <strong>Note:</strong> Rules marked with ⚠️ have been identified as undesirable based on analysis.
                          </div>
                        )}
                      </div>
                    )}
                    
                    {data.robotChanges && (
                      <div style={recommendationStyle}>
                        <div style={{ fontWeight: 600, color: '#2980b9', marginBottom: 8 }}>
                          Robot Changes
                        </div>
                        <div style={{ 
                          margin: 0, 
                          lineHeight: 1.5, 
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.95em',
                          color: '#2c3e50'
                        }}>
                          {data.robotChanges}
                        </div>
                      </div>
                    )}
                    {data.environmentalChanges && (
                      <div style={recommendationStyle}>
                        <div style={{ fontWeight: 600, color: '#2980b9', marginBottom: 8 }}>
                          Environmental Changes
                        </div>
                        <div style={{ 
                          margin: 0, 
                          lineHeight: 1.5, 
                          whiteSpace: 'pre-wrap',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.95em',
                          color: '#2c3e50'
                        }}>
                          {data.environmentalChanges}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>


      </div>
      </div>
    </>
  );
};

const buttonStyle = {
  padding: '8px 18px',
  background: '#3498db',
  color: '#fff',
  border: 'none',
  borderRadius: 6,
  fontWeight: 500,
  fontSize: '1em',
  cursor: 'pointer',
  transition: 'background 0.2s',
};

const sectionStyle = {
  background: '#fff',
  borderRadius: 12,
  padding: 24,
  marginBottom: 32,
  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
  height: 'auto', // Ensure sections expand with content
  minHeight: 'auto' // Remove any minimum height constraints
};

const sectionTitleStyle = {
  fontWeight: 600,
  fontSize: '1.3em',
  marginBottom: 18,
};

const recommendationStyle = {
  background: '#f8f9fa',
  borderRadius: 8,
  padding: 16,
  border: '1px solid #e9ecef',
};

export default ProjectReport; 