import React, { useState, useEffect } from 'react';
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
  questions = {}
}) => {
  const [selectedRule, setSelectedRule] = useState(null);
  const [expandedParticipants, setExpandedParticipants] = useState(new Set());
  const [undesirableRules, setUndesirableRules] = useState([]); // Store as simple array
  const [isLabelingMode, setIsLabelingMode] = useState(false);
  const [loading, setLoading] = useState(false);

  // Load undesirable rules from database whenever currentScope changes
  useEffect(() => {
    const loadUndesirableRules = async () => {
      if (currentScope?.id) {
        setLoading(true);
        try {
          console.log('Loading undesirable rules for scopeId:', currentScope.id);
          const rules = await window.electronAPI.getUndesirableRules(currentScope.id);
          console.log('Loaded undesirable rules:', rules);
          setUndesirableRules(rules);
        } catch (error) {
          console.error('Error loading undesirable rules:', error);
          setUndesirableRules([]);
        } finally {
          setLoading(false);
        }
      }
    };

    loadUndesirableRules();
  }, [currentScope?.id]); // Load when scopeId changes

  // Reset UI state when component is first rendered (when navigating back to situation design view)
  useEffect(() => {
    setSelectedRule(null);
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
        console.log('Removing undesirable rule:', rule);
        await window.electronAPI.removeUndesirableRule(currentScope.id, rule);
        currentUndesirableRules.delete(rule);
      } else {
        // Add rule
        console.log('Adding undesirable rule:', rule);
        await window.electronAPI.addUndesirableRule(currentScope.id, rule);
        currentUndesirableRules.add(rule);
      }
      
      // Update local state
      setUndesirableRules(Array.from(currentUndesirableRules));
    } catch (error) {
      console.error('Error toggling undesirable rule:', error);
    }
  };

  const getCurrentScopeUndesirableRules = () => {
    return new Set(undesirableRules);
  };

  const getAcceptableRules = () => {
    const currentUndesirableRules = getCurrentScopeUndesirableRules();
    return (currentScope?.rules || []).filter(rule => !currentUndesirableRules.has(rule));
  };

  return (
    <div style={{ padding: '24px' }}>
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
          )}

          {/* Undesirable Rules Section */}
          {getCurrentScopeUndesirableRules().size > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1em',
                color: '#e74c3c',
                marginBottom: '12px',
                borderBottom: '1px solid #e74c3c',
                paddingBottom: '4px'
              }}>
                Undesirable Rules
              </h4>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '8px'
              }}>
                {Array.from(getCurrentScopeUndesirableRules()).map((rule, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedRule(selectedRule === rule ? null : rule)}
                    style={{
                      padding: '8px 16px',
                      background: selectedRule === rule ? '#e74c3c' : '#e74c3c',
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
                        e.target.style.opacity = '0.9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedRule !== rule) {
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



          {/* Participant Cards for Selected Rule */}
          {selectedRule && (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '24px'
            }}>
              {(() => {
                const participantsWithRule = participants
                  .filter(p => p.answers?.['Rule Selection']?.selectedRules?.includes(selectedRule));
                
                if (participantsWithRule.length === 0) {
                  return (
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
                  );
                }
                
                return participantsWithRule.map(participant => {
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
                });
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SituationDesignView; 