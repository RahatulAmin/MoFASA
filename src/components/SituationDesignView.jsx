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
          
          // If we have existing rules and the new rules are empty, keep the existing ones
          // This prevents losing selections when the scope ID changes due to project updates
          if (undesirableRules.length > 0 && rules.length === 0) {
            console.log('Keeping existing undesirable rules to prevent loss of selections');
            setUndesirableRules(undesirableRules);
          } else {
            setUndesirableRules(rules);
          }
          
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

    // Only load if we haven't loaded for this scope yet
    if (currentScope?.id && lastLoadedScopeId.current !== currentScope.id) {
      loadUndesirableRules();
    }
  }, [currentScope?.id]); // Load when scopeId changes

  // Reset UI state when component is first rendered (when navigating back to situation design view)
  useEffect(() => {
    setSelectedRules(new Set());
    setIsLabelingMode(false);
  }, []); // Only run once when component mounts

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

      const prompt = `You are a design analyst tasked with improving a human-robot interaction scenario. Below are participant summaries along with the undesirable interaction rules they selected (with definitions). Your job is to analyze this input and suggest design improvements.

Instructions:
- Provide suggestions in two categories: (1) Robot Changes and (2) Environmental Changes.
- Each suggestion must be specific, concrete, and grounded in the participant feedback and rule selection.
- Provide maximum 3 suggestions for each category.
- After each suggestion, include a brief reference to the relevant participant quote and rule number.
- Do not provide vague advice. Be detailed and practical.
- Do not include any extra explanation outside the suggestions.

Undesirable Rules (with definitions):
${formattedRuleDefinitions}

Participant Summaries:
${formattedSummaries}

Format your answer like:

Robot Changes:
- [Concrete change]. (Based on Participant X")

Environmental Changes:
- [Concrete change]. (Based on Participant X")`;

      const response = await window.electronAPI.generateWithDeepSeek(prompt);
      
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

      setAiSuggestions({
        robotChanges,
        environmentalChanges
      });

    } catch (error) {
      console.error('Failed to generate AI suggestions:', error);
      alert('Failed to generate suggestions. Please try again.');
    } finally {
      setIsGeneratingSuggestions(false);
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
          
          @keyframes fillProgress {
            0% { width: 0%; }
            50% { width: 100%; }
            100% { width: 0%; }
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
                    background: isGeneratingSuggestions ? '#95a5a6' : '#e74c3c',
                    color: '#fff',
                    border: 'none',
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
                    {isGeneratingSuggestions ? 'Generating...' : 'Check AI Suggestions'}
                  </span>
                  {isGeneratingSuggestions && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      background: 'linear-gradient(90deg, #27ae60 0%, #2ecc71 100%)',
                      animation: 'fillProgress 2s ease-in-out infinite',
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
                                  {/* Display all answers organized by section */}
                                  {Object.entries(participant.answers || {}).map(([sectionName, sectionAnswers]) => {
                                    if (sectionName === 'Rule Selection') return null; // Skip Rule Selection section
                                    
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
                                          
                                          // Find the question to get its factors
                                          const sectionQuestions = questions[sectionName] || [];
                                          // For dropdown questions, match by id; for text questions, match by text
                                          const question = sectionQuestions.find(q => 
                                            q.id === questionText || q.text === questionText
                                          );
                                          const factors = question?.factors;
                                          
                                          // Handle factors - parse into array and join for display
                                          let factorDisplay = 'Question';
                                          if (factors) {
                                            const factorArray = parseFactors(factors);
                                            if (factorArray.length > 0) {
                                              factorDisplay = factorArray.join(', ');
                                            }
                                          }
                                          
                                          console.log('Final factorDisplay for render:', factorDisplay);
                                          
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
                                  
                                  {/* Summary section */}
                                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid #e9ecef' }}>
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