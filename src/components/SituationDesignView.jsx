import React, { useState, useEffect, useRef } from 'react';
import { parseFactors } from '../utils/factorUtils';

const SituationDesignView = ({ 
  currentScope, 
  participants, 
  robotDraft, 
  setRobotDraft, 
  environmentDraft, 
  setEnvironmentDraft,
  project,
  selectedScope,
  editProject,
  idx,
  questions = {},
  aiSuggestions,
  setAiSuggestions,
  onAcceptRobotSuggestions,
  onAcceptEnvironmentalSuggestions
}) => {
  const [selectedRules, setSelectedRules] = useState(new Set());
  const [expandedParticipants, setExpandedParticipants] = useState(new Set());
  const [undesirableRules, setUndesirableRules] = useState([]); // Store as simple array
  const [isLabelingMode, setIsLabelingMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const lastLoadedScopeId = useRef(null);

  // Load undesirable rules from database whenever currentScope changes
  useEffect(() => {
    const loadUndesirableRules = async () => {
      if (currentScope?.id) {
        setLoading(true);
        try {
          console.log('Loading undesirable rules for scopeId:', currentScope.id, 'currentScope:', currentScope);
          const rules = await window.electronAPI.getUndesirableRules(currentScope.id);
          console.log('Loaded undesirable rules:', rules);
          setUndesirableRules(rules);
          
          lastLoadedScopeId.current = currentScope.id;
        } catch (error) {
          console.error('Error loading undesirable rules:', error);
          setUndesirableRules([]);
        } finally {
          setLoading(false);
        }
      } else {
        console.log('No currentScope.id available:', currentScope);
      }
    };

    // Load rules whenever the scope changes
    if (currentScope?.id) {
      loadUndesirableRules();
    }
  }, [currentScope?.id]); // Load when scopeId changes

  // Persist selected rules in localStorage to survive re-renders
  useEffect(() => {
    if (currentScope?.id && selectedRules.size > 0) {
      const storageKey = `selectedRules_${currentScope.id}`;
      const rulesArray = Array.from(selectedRules);
      localStorage.setItem(storageKey, JSON.stringify(rulesArray));
      console.log('SituationDesignView: Saved selected rules to localStorage', {
        scopeId: currentScope.id,
        rules: rulesArray,
        storageKey
      });
    }
  }, [selectedRules, currentScope?.id]);

  // Load selected rules from localStorage when component mounts or scope changes
  useEffect(() => {
    if (currentScope?.id) {
      const storageKey = `selectedRules_${currentScope.id}`;
      const savedRules = localStorage.getItem(storageKey);
      if (savedRules) {
        try {
          const parsedRules = JSON.parse(savedRules);
          setSelectedRules(new Set(parsedRules));
          console.log('Loaded saved selected rules:', parsedRules);
        } catch (error) {
          console.error('Error parsing saved rules:', error);
        }
      } else {
        // If no saved rules found, clear the selection
        setSelectedRules(new Set());
      }
    }
  }, [currentScope?.id]);

  // Debug: Log when currentScope changes
  useEffect(() => {
    console.log('SituationDesignView: currentScope changed', {
      scopeId: currentScope?.id,
      scopeNumber: currentScope?.scopeNumber,
      selectedRulesSize: selectedRules.size
    });
  }, [currentScope?.id, currentScope?.scopeNumber]);

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

  const handleUndesirableRuleToggle = async (rule) => {
    if (!currentScope?.id) {
      console.error('No scope ID available');
      return;
    }

    try {
      const currentUndesirableRules = new Set(undesirableRules);
      
      if (currentUndesirableRules.has(rule)) {
        // Remove rule
        console.log('Removing undesirable rule:', rule, 'for scopeId:', currentScope.id);
        await window.electronAPI.removeUndesirableRule(currentScope.id, rule);
        currentUndesirableRules.delete(rule);
      } else {
        // Add rule
        console.log('Adding undesirable rule:', rule, 'for scopeId:', currentScope.id);
        await window.electronAPI.addUndesirableRule(currentScope.id, rule);
        currentUndesirableRules.add(rule);
      }
      
      // Update local state
      setUndesirableRules(Array.from(currentUndesirableRules));
      
      // Verify the save by reloading the rules
      setTimeout(async () => {
        try {
          const reloadedRules = await window.electronAPI.getUndesirableRules(currentScope.id);
          console.log('Reloaded undesirable rules after toggle:', reloadedRules);
        } catch (error) {
          console.error('Error reloading rules after toggle:', error);
        }
      }, 100);
    } catch (error) {
      console.error('Error toggling undesirable rule:', error);
    }
  };

  const getCurrentScopeUndesirableRules = () => {
    return new Set(undesirableRules);
  };

  const getAcceptableRules = () => {
    const currentUndesirableRules = getCurrentScopeUndesirableRules();
    const acceptableRules = (currentScope?.rules || []).filter(rule => !currentUndesirableRules.has(rule));
    return acceptableRules;
  };

  const handleRuleSelection = (rule) => {
    setSelectedRules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(rule)) {
        newSet.delete(rule);
      } else {
        newSet.add(rule);
      }
      return newSet;
    });
  };

  const getParticipantsForRule = (rule) => {
    return participants.filter(p => p.answers?.['Rule Selection']?.selectedRules?.includes(rule));
  };

  const generateAISuggestions = async () => {
    if (getCurrentScopeUndesirableRules().size === 0) {
      alert('No undesirable rules selected. Please select some undesirable rules first.');
      return;
    }

    setIsGeneratingSuggestions(true);
    setGenerationProgress(10); // Start progress
    
    try {
      // Get all participants who selected undesirable rules
      const participantsWithUndesirableRules = participants.filter(p => {
        const selectedRules = p.answers?.['Rule Selection']?.selectedRules || [];
        const undesirableRules = Array.from(getCurrentScopeUndesirableRules());
        return selectedRules.some(rule => undesirableRules.includes(rule));
      });

      if (participantsWithUndesirableRules.length === 0) {
        alert('No participants have selected the undesirable rules. Please ensure participants have selected some rules first.');
        return;
      }
      
      // Add a small delay to make progress visible
      await new Promise(resolve => setTimeout(resolve, 300));
      setGenerationProgress(30); // Data collected

      // Get rule definitions (you may need to define these based on your rules)
      const ruleDefinitions = {
        'Accept navigation help': 'User accepts the robot\'s offer to help with navigation',
        'Decline navigation help': 'User declines the robot\'s offer to help with navigation',
        'Ignore navigation help': 'User ignores or doesn\'t respond to the robot\'s navigation offer',
        'Explore book suggestions': 'User engages with the robot\'s book recommendations',
        'Dismiss book suggestions': 'User rejects or dismisses the robot\'s book suggestions',
        'Ignore book suggestions': 'User ignores the robot\'s book recommendations',
        'Wave off robot': 'User gestures or signals for the robot to leave or stop interaction'
      };

      // Format rule definitions for the prompt
      const formattedRuleDefinitions = Array.from(getCurrentScopeUndesirableRules())
        .map((rule, index) => `${index + 1}. ${rule}: ${ruleDefinitions[rule] || 'No definition available'}`)
        .join('\n');

      // Format participant summaries with rule selections
      const formattedSummaries = participantsWithUndesirableRules
        .map(p => {
          const selectedRules = p.answers?.['Rule Selection']?.selectedRules || [];
          const undesirableSelectedRules = selectedRules.filter(rule => 
            Array.from(getCurrentScopeUndesirableRules()).includes(rule)
          );
          const ruleNumbers = undesirableSelectedRules.map(rule => {
            const ruleIndex = Array.from(getCurrentScopeUndesirableRules()).indexOf(rule);
            return ruleIndex + 1;
          });
          
          return `${p.name} (Rules: ${ruleNumbers.join(', ')}):\n${p.summary || 'No summary available'}`;
        })
        .join('\n\n');

      const prompt = `You are a human-robot interaction design analyst. Your task is to improve the interaction scenario by analyzing participant feedback and the specific undesirable rules they selected. Each rule reflects a social or interactional breakdown that must be addressed through thoughtful design.

Instructions:
- For each suggestion, clearly state which undesirable rule it addresses and which participant it is based on.
- Provide two types of design suggestions: (1) Robot Changes and (2) Environmental Changes.
- Each suggestion must be specific, practical, and clearly tied to both a participant quote and an undesirable rule.
- Include up to 3 suggestions per category.
- Explain briefly *why* each change is needed — referencing the *participant's quote* and the *rule definition*.
- Do NOT include vague or generic suggestions.
- Do NOT add any introductory or concluding text beyond the suggestions.

Undesirable Rules (with definitions):
${formattedRuleDefinitions}

Participant Summaries:
${formattedSummaries}

Format your output like this:

Robot Changes:
- [Suggestion]. (Addresses Rule #X: [Rule Title]. Based on Participant X: "[quote or summary snippet]")

Environmental Changes:
- [Suggestion]. (Addresses Rule #Y: [Rule Title]. Based on Participant Y: "[quote or summary snippet]")`;

      setGenerationProgress(50); // Prompt prepared, starting AI generation
      
      // Add a small delay to show the AI generation is starting
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Start AI generation with progress simulation
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          if (prev >= 75) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 5;
        });
      }, 200);
      
      const response = await window.electronAPI.generateWithLlama(prompt);
      
      clearInterval(progressInterval);
      setGenerationProgress(80); // AI response received
      
      // Clean up the response by removing asterisks and formatting
      const cleanResponse = response
        .replace(/\*\*\*/g, '') // Remove triple asterisks
        .replace(/\*\*/g, '') // Remove double asterisks
        .replace(/\*/g, '') // Remove single asterisks
        .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points at start of lines
        .replace(/^\s*\d+\.\s*/gm, '') // Remove numbered lists
        .replace(/###/g, '') // Remove ###
        .replace(/##/g, '') // Remove ##
        .replace(/#/g, '') // Remove #
        .trim();
      
      // Parse the response into two sections
      const sections = cleanResponse.split('\n\n');
      const robotChanges = sections.find(s => s.toLowerCase().includes('robot changes'))?.replace(/robot changes:?/i, '').trim() || '';
      const environmentalChanges = sections.find(s => s.toLowerCase().includes('environmental changes'))?.replace(/environmental changes:?/i, '').trim() || '';

      setGenerationProgress(90); // Processing response
      
      // Add a small delay to show processing
      await new Promise(resolve => setTimeout(resolve, 200));
      
      setAiSuggestions({
        robotChanges,
        environmentalChanges
      });
      
      setGenerationProgress(100); // Complete
      
      // Add a final delay before resetting
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGeneratingSuggestions(false);
      setGenerationProgress(0);
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Generated Rules Section */}
        <div className="generated-rules" style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '16px'
          }}>
            <h3 style={{
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.2em',
              color: '#2c3e50',
              margin: 0
            }}>
              Generated Rules
            </h3>
            {(currentScope?.rules && currentScope.rules.length > 0) && (
              <button
                className="label-undesirable-rules"
                onClick={() => setIsLabelingMode(!isLabelingMode)}
                style={{
                  padding: '6px 12px',
                  background: isLabelingMode ? '#e74c3c' : '#3498db',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.85em',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                {isLabelingMode ? 'Done Labeling' : 'Label Undesirable Rules'}
              </button>
            )}
          </div>

          {/* Labeling Mode - All Rules for Selection */}
          {isLabelingMode && (
            <div style={{ 
              background: '#fff3cd',
              borderRadius: '6px',
              padding: '16px',
              border: '1px solid #ffeaa7',
              marginBottom: '20px'
            }}>
              <h4 style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1em',
                color: '#856404',
                margin: '0 0 12px 0'
              }}>
                Select rules to mark as undesirable:
                {loading && (
                  <span style={{ marginLeft: '8px', fontSize: '0.9em', fontStyle: 'italic' }}>
                    Loading...
                  </span>
                )}
              </h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {(currentScope?.rules || []).map((rule, index) => (
                  <button
                    key={index}
                    onClick={() => handleUndesirableRuleToggle(rule)}
                    disabled={loading}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: getCurrentScopeUndesirableRules().has(rule) ? '#e74c3c' : '#fff',
                      color: getCurrentScopeUndesirableRules().has(rule) ? '#fff' : '#2c3e50',
                      border: '1px solid',
                      borderColor: getCurrentScopeUndesirableRules().has(rule) ? '#e74c3c' : '#ffeaa7',
                      borderRadius: '4px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontWeight: getCurrentScopeUndesirableRules().has(rule) ? '600' : '500',
                      fontSize: '0.85em',
                      fontFamily: 'Lexend, sans-serif',
                      transition: 'all 0.2s ease',
                      opacity: loading ? 0.6 : 1
                    }}
                  >
                    {rule}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Acceptable Rules */}
          {getAcceptableRules().length > 0 && (
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '8px',
              marginBottom: '20px'
            }}>
              {getAcceptableRules().map((rule, index) => (
                <button
                  key={index}
                  onClick={() => handleRuleSelection(rule)}
                  style={{
                    padding: '8px 16px',
                    background: selectedRules.has(rule) ? '#8e44ad' : '#95a5a6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    transition: 'all 0.2s ease',
                    opacity: selectedRules.has(rule) ? 1 : 0.7
                  }}
                  onMouseOver={(e) => {
                    if (!selectedRules.has(rule)) {
                      e.target.style.background = '#8e44ad';
                      e.target.style.opacity = '0.9';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (!selectedRules.has(rule)) {
                      e.target.style.background = '#95a5a6';
                      e.target.style.opacity = '0.7';
                    }
                  }}
                >
                  {rule}
                </button>
              ))}
            </div>
          )}

          {/* Undesirable Rules Section */}
          {getCurrentScopeUndesirableRules().size > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h4 style={{
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1em',
                  color: '#e74c3c',
                  margin: 0,
                  borderBottom: '1px solid #e74c3c',
                  paddingBottom: '4px'
                }}>
                  Undesirable Rules
                </h4>
                <button
                  onClick={generateAISuggestions}
                  disabled={isGeneratingSuggestions}
                  style={{
                    padding: '6px 12px',
                    background: isGeneratingSuggestions ? '#95a5a6' : '#f5f5f5',
                    color: isGeneratingSuggestions ? '#fff' : '#999',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    cursor: isGeneratingSuggestions ? 'not-allowed' : 'pointer',
                    fontSize: '0.85em',
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: '500',
                    transition: 'all 0.2s ease',
                    opacity: isGeneratingSuggestions ? 0.6 : 1,
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    if (!isGeneratingSuggestions) {
                      e.target.style.background = '#e8e8e8';
                      e.target.style.color = '#666';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isGeneratingSuggestions) {
                      e.target.style.background = '#f5f5f5';
                      e.target.style.color = '#999';
                    }
                  }}
                >
                  <span style={{
                    position: 'relative',
                    zIndex: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {isGeneratingSuggestions && (
                      <div style={{
                        width: '12px',
                        height: '12px',
                        border: '2px solid #fff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }} />
                    )}
                    {isGeneratingSuggestions ? `Generating... ${generationProgress}%` : 'Check AI Suggestions'}
                  </span>
                  {isGeneratingSuggestions && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: `${generationProgress}%`,
                      background: 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)',
                      transition: 'width 0.3s ease',
                      zIndex: 1
                    }} />
                  )}
                </button>
              </div>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {Array.from(getCurrentScopeUndesirableRules()).map((rule, index) => (
                  <button
                    key={index}
                    onClick={() => handleRuleSelection(rule)}
                    style={{
                      padding: '8px 16px',
                      background: selectedRules.has(rule) ? '#e74c3c' : '#e74c3c',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '0.9em',
                      transition: 'all 0.2s ease',
                      opacity: selectedRules.has(rule) ? 1 : 0.7
                    }}
                    onMouseOver={(e) => {
                      if (!selectedRules.has(rule)) {
                        e.target.style.opacity = '0.9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!selectedRules.has(rule)) {
                        e.target.style.opacity = '0.7';
                      }
                    }}
                  >
                    {rule}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* No rules message */}
          {(!currentScope?.rules || currentScope.rules.length === 0) && (
            <div style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
              padding: '24px',
              textAlign: 'center',
              marginBottom: '20px'
            }}>
              <div style={{
                fontSize: '2em',
                marginBottom: '12px',
                color: '#95a5a6'
              }}>
                📋
              </div>
              <p style={{
                margin: 0,
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1em',
                color: '#7f8c8d',
                fontWeight: '500'
              }}>
                No rules generated yet
              </p>
            </div>
          )}



          {/* Participant Cards for Selected Rules */}
          {selectedRules.size > 0 && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '24px',
              marginBottom: '24px'
            }}>
              
              {/* Multi-rule selection summary */}
              {(() => {
                const participantsWithMultipleRules = participants.filter(p => {
                  const selectedRules = p.answers?.['Rule Selection']?.selectedRules || [];
                  const undesirableRules = Array.from(getCurrentScopeUndesirableRules());
                  const selectedUndesirableRules = selectedRules.filter(rule => undesirableRules.includes(rule));
                  return selectedUndesirableRules.length > 1;
                });
                
                if (participantsWithMultipleRules.length > 0) {
                  return (
                    <div style={{
                      background: '#fff3cd',
                      border: '1px solid #ffeaa7',
                      borderRadius: '6px',
                      padding: '12px',
                      marginBottom: '16px'
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '0.9em',
                        color: '#856404',
                        fontWeight: '500'
                      }}>
                        📊 <span>{participantsWithMultipleRules.length} participant{participantsWithMultipleRules.length !== 1 ? 's' : ''} selected multiple undesirable rules</span>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Display participants for each selected rule */}
              {Array.from(selectedRules).map((rule) => {
                const participantsWithRule = getParticipantsForRule(rule);
                const isUndesirable = getCurrentScopeUndesirableRules().has(rule);
                
                return (
                  <div key={rule} style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    <h4 style={{
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '1.1em',
                      color: isUndesirable ? '#e74c3c' : '#2c3e50',
                      margin: '0 0 12px 0',
                      borderBottom: `2px solid ${isUndesirable ? '#e74c3c' : '#3498db'}`,
                      paddingBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      {isUndesirable && <span>⚠️</span>}
                      {rule}
                      <span style={{
                        fontSize: '0.8em',
                        color: '#7f8c8d',
                        fontWeight: '400'
                      }}>
                        ({participantsWithRule.length} participant{participantsWithRule.length !== 1 ? 's' : ''})
                      </span>
                    </h4>

                    {participantsWithRule.length === 0 ? (
                      <div style={{
                        background: '#fff',
                        borderRadius: '8px',
                        border: '1px solid #dcdde1',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        padding: '32px',
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '2em',
                          marginBottom: '16px',
                          color: '#95a5a6'
                        }}>
                          👥
                        </div>
                        <h4 style={{
                          margin: '0 0 8px 0',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '1.1em',
                          color: '#2c3e50',
                          fontWeight: '600'
                        }}>
                          No participants to display
                        </h4>
                        <p style={{
                          margin: 0,
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.95em',
                          color: '#7f8c8d',
                          lineHeight: 1.5
                        }}>
                          No participants have selected this rule in their responses.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {participantsWithRule.map(participant => {
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
                                    color: '#2c3e50',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                  }}>
                                    {participant.name}
                                    
                                    {/* Multi-rule indicator badge */}
                                    {(() => {
                                      const otherUndesirableRules = Array.from(getCurrentScopeUndesirableRules()).filter(
                                        r => r !== rule && participant.answers?.['Rule Selection']?.selectedRules?.includes(r)
                                      );
                                      if (otherUndesirableRules.length > 0) {
                                        return (
                                          <span
                                            style={{
                                              backgroundColor: '#f39c12',
                                              color: '#fff',
                                              borderRadius: '12px',
                                              padding: '2px 8px',
                                              fontSize: '0.75em',
                                              fontWeight: '500',
                                              cursor: 'pointer',
                                              display: 'flex',
                                              alignItems: 'center',
                                              gap: '4px',
                                              transition: 'all 0.2s ease'
                                            }}
                                            title={`Also selected: ${otherUndesirableRules.join(', ')}`}
                                            onMouseOver={(e) => {
                                              e.target.style.backgroundColor = '#e67e22';
                                              e.target.style.transform = 'scale(1.05)';
                                            }}
                                            onMouseOut={(e) => {
                                              e.target.style.backgroundColor = '#f39c12';
                                              e.target.style.transform = 'scale(1)';
                                            }}
                                          >
                                            📌 +{otherUndesirableRules.length} rule{otherUndesirableRules.length > 1 ? 's' : ''}
                                          </span>
                                        );
                                      }
                                      return null;
                                    })()}
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
                                    {(participant.answers?.Identity?.['Nationality of the participant(s)'] || 
                                      participant.answers?.Identity?.nationality ||
                                      participant.answers?.Identity?.Nationality) && (
                                      <span>Nationality: {
                                        participant.answers?.Identity?.['Nationality of the participant(s)'] ||
                                        participant.answers?.Identity?.nationality ||
                                        participant.answers?.Identity?.Nationality
                                      }</span>
                                    )}
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
                                  {/* Summary section - moved to top */}
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
                                    <p style={{
                                      margin: 0,
                                      fontFamily: 'Lexend, sans-serif',
                                      fontSize: '0.9em',
                                      color: '#495057',
                                      lineHeight: 1.6,
                                      whiteSpace: 'pre-wrap',
                                      fontStyle: !participant.summary || participant.summary.trim() === '' ? 'italic' : 'normal'
                                    }}>
                                        {participant.summary && participant.summary.trim() !== '' 
                                          ? participant.summary 
                                          : 'No summary available for this participant.'}
                                    </p>
                                  </div>

                                  {/* Display answers organized by section in specific order */}
                                  {['Situation', 'Identity', 'Definition of Situation'].map(sectionName => {
                                    const sectionAnswers = participant.answers?.[sectionName];
                                    if (!sectionAnswers) return null;
                                    
                                    console.log('Section:', sectionName, 'Answers:', sectionAnswers);
                                    
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
                                          
                                          // Handle cases where questionText might be an object
                                          const actualQuestionText = typeof questionText === 'object' ? JSON.stringify(questionText) : questionText;
                                          
                                          // Skip malformed entries that show as [object Object]
                                          if (actualQuestionText === '[object Object]') {
                                            console.log('Skipping malformed question entry:', questionText);
                                            return null;
                                          }
                                          
                                          // Find the question to get its factors and check if it's enabled
                                          const sectionQuestions = questions[sectionName] || [];
                                          const question = sectionQuestions.find(q => {
                                            // Try exact matches first
                                            if (q.id === actualQuestionText || q.text === actualQuestionText) {
                                              return true;
                                            }
                                            // Try partial matches for text questions
                                            if (q.text && actualQuestionText.includes(q.text)) {
                                              return true;
                                            }
                                            if (actualQuestionText && q.text && q.text.includes(actualQuestionText)) {
                                              return true;
                                            }
                                            return false;
                                          });
                                          
                                          // Only show answers for enabled questions
                                          if (!question || question.isEnabled === false) {
                                            return null;
                                          }
                                          
                                                                                      console.log('Looking for question:', actualQuestionText, 'in section:', sectionName);
                                            console.log('Available questions in section:', sectionQuestions.map(q => ({ id: q.id, text: q.text, factors: q.factors, isEnabled: q.isEnabled })));
                                            console.log('Questions object for this section:', questions[sectionName]);
                                            
                                            if (!question) {
                                              console.log('No question found for:', actualQuestionText);
                                            }
                                          
                                          const factors = question?.factors;
                                          console.log('Found factors:', factors, 'for question:', actualQuestionText);
                                          
                                          // Handle factors - parse into array and join for display
                                          let factorDisplay = 'Question';
                                          if (factors) {
                                            const factorArray = parseFactors(factors);
                                            if (factorArray.length > 0) {
                                              factorDisplay = factorArray.join(', ');
                                            }
                                          }
                                          
                                          // If no factors found, show the question text as fallback
                                          if (factorDisplay === 'Question') {
                                            if (question?.text) {
                                              factorDisplay = question.text.substring(0, 30) + (question.text.length > 30 ? '...' : '');
                                            } else {
                                              // For unmatched questions, try to extract a meaningful label from the answer
                                              const answerText = answer.toString();
                                              if (answerText.includes('robot') || answerText.includes('Robot')) {
                                                factorDisplay = 'Robot Behavior';
                                              } else if (answerText.includes('interaction') || answerText.includes('Interaction')) {
                                                factorDisplay = 'Interaction Details';
                                              } else if (answerText.includes('social') || answerText.includes('Social')) {
                                                factorDisplay = 'Social Norms';
                                              } else if (answerText.includes('uncertainty') || answerText.includes('Uncertainty')) {
                                                factorDisplay = 'Uncertainty';
                                              } else {
                                                factorDisplay = 'Additional Information';
                                              }
                                            }
                                          }
                                          
                                          console.log('Final factorDisplay for render:', factorDisplay);
                                          
                                          return (
                                            <div key={actualQuestionText} style={{ marginBottom: '8px' }}>
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
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Remaining Rules Section - Show rules that haven't been selected yet */}
          {/* {selectedRules.size > 0 && (
            <div style={{ 
              marginTop: '24px',
              padding: '20px',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1em',
                color: '#2c3e50',
                margin: '0 0 16px 0',
                fontWeight: '600'
              }}>
                Remaining Rules
              </h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {(currentScope?.rules || []).map((rule, index) => {
                  if (selectedRules.has(rule)) return null; // Skip already selected rules
                  
                  const isUndesirable = getCurrentScopeUndesirableRules().has(rule);
                  return (
                    <button
                      key={index}
                      onClick={() => handleRuleSelection(rule)}
                      style={{
                        padding: '8px 16px',
                        background: isUndesirable ? '#e74c3c' : '#95a5a6',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.9em',
                        transition: 'all 0.2s ease',
                        opacity: 0.7
                      }}
                      onMouseOver={(e) => {
                        e.target.style.opacity = '0.9';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.opacity = '0.7';
                      }}
                    >
                      {rule}
                    </button>
                  );
                })}
              </div>
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};

export default SituationDesignView; 