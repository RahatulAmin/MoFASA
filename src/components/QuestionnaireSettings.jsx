import React, { useState, useEffect } from 'react';

const SECTIONS = [
  { name: 'Situation', color: '#f9f3f2' },
  { name: 'Identity', color: '#fcfbf2' },
  { name: 'Definition of Situation', color: '#f2f6fc' },
  { name: 'Rule Selection', color: '#ededed' },
  { name: 'Decision', color: '#f2fcf2' }
];

const QuestionnaireSettings = () => {
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const questionsData = await window.electronAPI.getAllQuestions();
      setQuestions(questionsData);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuestion = async (questionId, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await window.electronAPI.updateQuestionStatus(questionId, newStatus);
      
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
    } catch (error) {
      console.error('Error updating question status:', error);
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestion(question);
    setEditText(question.questionText);
  };

  const handleSaveQuestion = async () => {
    try {
      await window.electronAPI.updateQuestionText(editingQuestion.questionId, editText);
      
      // Update local state
      setQuestions(prevQuestions => {
        const updated = { ...prevQuestions };
        Object.keys(updated).forEach(section => {
          updated[section] = updated[section].map(q => 
            q.questionId === editingQuestion.questionId 
              ? { ...q, questionText: editText } 
              : q
          );
        });
        return updated;
      });
      
      setEditingQuestion(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating question text:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingQuestion(null);
    setEditText('');
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Lexend, sans-serif'
      }}>
        Loading questionnaire settings...
      </div>
    );
  }

  return (
    <div style={{ 
      padding: '24px', 
      maxWidth: '1200px', 
      margin: '0 auto',
      fontFamily: 'Lexend, sans-serif'
    }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ 
          fontSize: '2em', 
          color: '#2c3e50', 
          marginBottom: '8px',
          fontWeight: '700'
        }}>
          Questionnaire Settings
        </h1>
        <p style={{ 
          color: '#7f8c8d', 
          fontSize: '1.1em',
          lineHeight: '1.5'
        }}>
          Enable or disable questions and customize question text for your MOFASA framework.
        </p>
      </div>

      {SECTIONS.map(section => (
        <div key={section.name} style={{ marginBottom: '32px' }}>
          <h2 style={{ 
            fontSize: '1.5em', 
            color: '#2c3e50', 
            marginBottom: '16px',
            fontWeight: '600',
            padding: '12px 16px',
            backgroundColor: section.color,
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            {section.name}
          </h2>
          
          <div style={{ 
            backgroundColor: '#fff', 
            borderRadius: '8px', 
            border: '1px solid #e0e0e0',
            overflow: 'hidden'
          }}>
            {questions[section.name]?.map((question, index) => (
              <div key={question.questionId} style={{
                padding: '16px 20px',
                borderBottom: index < questions[section.name].length - 1 ? '1px solid #f0f0f0' : 'none',
                backgroundColor: question.isEnabled ? '#fff' : '#f8f9fa',
                opacity: question.isEnabled ? 1 : 0.7,
                transition: 'all 0.2s ease'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  {/* Toggle Switch */}
                  <label style={{ 
                    position: 'relative',
                    display: 'inline-block',
                    width: '50px',
                    height: '24px',
                    flexShrink: 0,
                    marginTop: '2px'
                  }}>
                    <input
                      type="checkbox"
                      checked={question.isEnabled}
                      onChange={() => handleToggleQuestion(question.questionId, question.isEnabled)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span style={{
                      position: 'absolute',
                      cursor: 'pointer',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: question.isEnabled ? '#27ae60' : '#ccc',
                      transition: '.4s',
                      borderRadius: '24px'
                    }}>
                      <span style={{
                        position: 'absolute',
                        content: '""',
                        height: '18px',
                        width: '18px',
                        left: '3px',
                        bottom: '3px',
                        backgroundColor: 'white',
                        transition: '.4s',
                        borderRadius: '50%',
                        transform: question.isEnabled ? 'translateX(26px)' : 'translateX(0)'
                      }} />
                    </span>
                  </label>

                  {/* Question Content */}
                  <div style={{ flex: 1 }}>
                    {editingQuestion?.questionId === question.questionId ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          style={{
                            width: '100%',
                            minHeight: '80px',
                            padding: '12px',
                            borderRadius: '4px',
                            border: '1px solid #dcdde1',
                            fontSize: '0.95em',
                            fontFamily: 'Lexend, sans-serif',
                            resize: 'vertical'
                          }}
                          autoFocus
                        />
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={handleSaveQuestion}
                            style={{
                              padding: '6px 16px',
                              backgroundColor: '#27ae60',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontFamily: 'Lexend, sans-serif'
                            }}
                          >
                            Save
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              padding: '6px 16px',
                              backgroundColor: '#95a5a6',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.9em',
                              fontFamily: 'Lexend, sans-serif'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p style={{ 
                          fontSize: '0.95em', 
                          color: '#2c3e50', 
                          lineHeight: '1.5',
                          margin: '0 0 8px 0'
                        }}>
                          {question.questionText}
                        </p>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ 
                            fontSize: '0.8em', 
                            color: '#7f8c8d',
                            backgroundColor: '#ecf0f1',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            {question.questionType}
                          </span>
                          
                          {question.options && (
                            <span style={{ 
                              fontSize: '0.8em', 
                              color: '#7f8c8d',
                              backgroundColor: '#e8f5e8',
                              padding: '2px 8px',
                              borderRadius: '12px'
                            }}>
                              {question.options.length} options
                            </span>
                          )}
                          
                          <button
                            onClick={() => handleEditQuestion(question)}
                            style={{
                              padding: '4px 12px',
                              backgroundColor: '#3498db',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '0.8em',
                              fontFamily: 'Lexend, sans-serif',
                              marginLeft: 'auto'
                            }}
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ 
        marginTop: '32px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h3 style={{ 
          fontSize: '1.1em', 
          color: '#2c3e50', 
          marginBottom: '12px',
          fontWeight: '600'
        }}>
          Instructions
        </h3>
        <ul style={{ 
          color: '#495057', 
          fontSize: '0.95em',
          lineHeight: '1.6',
          margin: 0,
          paddingLeft: '20px'
        }}>
          <li>Toggle questions on/off using the switches</li>
          <li>Click "Edit" to modify question text</li>
          <li>Disabled questions will not appear in participant forms</li>
          <li>Changes are saved automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default QuestionnaireSettings; 