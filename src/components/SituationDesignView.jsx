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

  return (
    <div style={{ padding: '24px' }}>
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
            {(currentScope?.rules || []).map((rule, index) => (
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
                            {participant.answers?.Identity?.['Nationality of the participant(s)'] && (
                              <span>Nationality: {participant.answers.Identity['Nationality of the participant(s)']}</span>
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