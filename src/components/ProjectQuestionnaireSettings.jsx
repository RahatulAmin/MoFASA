import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { name: 'Situation', color: '#f9f3f2' },
  { name: 'Identity', color: '#fcfbf2' },
  { name: 'Definition of Situation', color: '#f2f6fc' }
];

const ProjectQuestionnaireSettings = ({ projectId, projectName }) => {
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingQuestions, setTogglingQuestions] = useState(new Set());

  useEffect(() => {
    loadQuestions();
  }, [projectId]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      setError(null);
      const questionsData = await window.electronAPI.getProjectQuestions(projectId);
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
      setError('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuestion = async (questionId, currentStatus) => {
    // Prevent multiple rapid clicks
    if (togglingQuestions.has(questionId)) {
      return;
    }

    try {
      setTogglingQuestions(prev => new Set(prev).add(questionId));
      setError(null);
      const newStatus = !currentStatus;
      console.log('Toggling question', questionId, 'from', currentStatus, 'to', newStatus);
      
      const result = await window.electronAPI.updateProjectQuestionStatus(projectId, questionId, newStatus);
      console.log('Toggle result:', result);
      
      if (result.success) {
        // Update local state
        setQuestions(prevQuestions => {
          const updated = { ...prevQuestions };
          Object.keys(updated).forEach(section => {
            updated[section] = updated[section].map(q => 
              q.questionId === questionId ? { ...q, isEnabled: newStatus } : q
            );
          });
          return updated;
        });
        console.log('Successfully updated question status to', newStatus);
      } else {
        console.error('Failed to update question status:', result.error);
        setError(result.error || 'Failed to update question status');
        // Revert the toggle if there was an error
        setTimeout(() => {
          setQuestions(prevQuestions => {
            const updated = { ...prevQuestions };
            Object.keys(updated).forEach(section => {
              updated[section] = updated[section].map(q => 
                q.questionId === questionId ? { ...q, isEnabled: currentStatus } : q
              );
            });
            return updated;
          });
        }, 100);
      }
    } catch (error) {
      console.error('Error updating question status:', error);
      setError('Failed to update question status: ' + error.message);
      // Revert the toggle if there was an error
      setTimeout(() => {
        setQuestions(prevQuestions => {
          const updated = { ...prevQuestions };
          Object.keys(updated).forEach(section => {
            updated[section] = updated[section].map(q => 
              q.questionId === questionId ? { ...q, isEnabled: currentStatus } : q
            );
          });
          return updated;
        });
      }, 100);
    } finally {
      setTogglingQuestions(prev => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '200px',
        fontFamily: 'Lexend, sans-serif'
      }}>
        Loading questionnaire settings...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      fontFamily: 'Lexend, sans-serif'
    }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '1.5em', 
          color: '#2c3e50', 
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Questionnaire Settings
        </h2>
        <p style={{ 
          color: '#7f8c8d', 
          fontSize: '1em',
          lineHeight: '1.5'
        }}>
          Enable or disable questions for <strong>{projectName}</strong>. At least one question per section must remain enabled.
        </p>
      </div>

      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px 16px',
          backgroundColor: '#fee',
          color: '#e74c3c',
          borderRadius: '6px',
          border: '1px solid #fcc',
          fontSize: '0.9em'
        }}>
          {error}
        </div>
      )}

      {SECTIONS.map(section => (
        <div key={section.name} style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            fontSize: '1.2em', 
            color: '#2c3e50', 
            marginBottom: '12px',
            fontWeight: '600',
            padding: '8px 12px',
            backgroundColor: section.color,
            borderRadius: '6px',
            border: '1px solid #e0e0e0'
          }}>
            {section.name}
          </h3>
          
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '6px', 
            border: '1px solid #e0e0e0',
            overflow: 'hidden'
          }}>
            {questions[section.name]?.map((question, index) => (
              <div key={question.questionId} style={{
                padding: '12px 16px',
                borderBottom: index < questions[section.name].length - 1 ? '1px solid #f0f0f0' : 'none',
                backgroundColor: question.isEnabled ? '#fff' : '#f8f9fa',
                opacity: question.isEnabled ? 1 : 0.7,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  {/* Toggle Switch */}
                  <label style={{ 
                    position: 'relative',
                    display: 'inline-block',
                    width: '44px',
                    height: '20px',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <input
                      type="checkbox"
                      checked={question.isEnabled}
                      onChange={() => handleToggleQuestion(question.questionId, question.isEnabled)}
                      disabled={togglingQuestions.has(question.questionId)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span 
                      onClick={() => !togglingQuestions.has(question.questionId) && handleToggleQuestion(question.questionId, question.isEnabled)}
                      style={{
                        position: 'absolute',
                        cursor: togglingQuestions.has(question.questionId) ? 'not-allowed' : 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: question.isEnabled ? '#27ae60' : '#ccc',
                        transition: '.3s',
                        borderRadius: '20px',
                        opacity: togglingQuestions.has(question.questionId) ? 0.6 : 1
                      }}
                    >
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '16px',
                        width: '16px',
                        left: '2px',
                        bottom: '2px',
                        backgroundColor: 'white',
                        transition: '.3s',
                        borderRadius: '50%',
                        transform: question.isEnabled ? 'translateX(24px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>

                  {/* Question Content */}
                  <div style={{ flex: 1 }}>
                    <p style={{ 
                      fontSize: '0.9em', 
                      color: '#2c3e50', 
                      lineHeight: '1.4',
                      margin: '0 0 6px 0'
                    }}>
                      {question.questionText}
                    </p>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        fontSize: '0.75em', 
                        color: '#7f8c8d',
                        backgroundColor: '#ecf0f1',
                        padding: '2px 6px',
                        borderRadius: '10px'
                      }}>
                        {question.questionType}
                      </span>
                      
                      {question.options && (
                        <span style={{ 
                          fontSize: '0.75em', 
                          color: '#7f8c8d',
                          backgroundColor: '#e8f5e8',
                          padding: '2px 6px',
                          borderRadius: '10px'
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
      ))}

      <div style={{ 
        marginTop: '24px', 
        padding: '16px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '6px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ 
          fontSize: '1em', 
          color: '#2c3e50', 
          marginBottom: '8px',
          fontWeight: '600'
        }}>
          Instructions
        </h4>
        <ul style={{ 
          color: '#495057', 
          fontSize: '0.85em',
          lineHeight: '1.5',
          margin: 0,
          paddingLeft: '16px'
        }}>
          <li>Toggle questions on/off using the switches</li>
          <li>At least one question per section must remain enabled</li>
          <li>Disabled questions will not appear in participant forms for this project</li>
          <li>Changes are saved automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default ProjectQuestionnaireSettings; 