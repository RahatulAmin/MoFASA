import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SECTIONS = [
  {
    name: 'Situation',
    color: '#f9f3f2'
  },
  {
    name: 'Identity',
    color: '#fcfbf2'
  },
  {
    name: 'Definition of Situation',
    color: '#f2f6fc'
  },
  {
    name: 'Rule Selection',
    color: '#ededed'
  },
  {
    name: 'Decision',
    color: '#f2fcf2'
  }
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Other'];

const QUESTIONS = {
  'Situation': [
    'When did the interaction happen?',
    'Where did it take place?',
    'How many interacting agents (Humans and Robots) were there?',
    'Were they in a group?',
    'What were the roles of the interacting agents?',    
  ],
  'Decision': [
    'What was their final decision or course of action?',
  ],
  'Identity': [
    { id: 'age', text: 'Age range of the participant(s)', type: 'dropdown', options: AGE_RANGES },
    { id: 'gender', text: 'Gender of the participant(s)', type: 'dropdown', options: GENDER_OPTIONS },
    'Nationality of the participant(s)',
    'Occupation of the participant(s)',
    'Education level of the participant(s)',
    'What was their social motive for interacting with the robot?', 
    'Do they have previous experience of interacting with robots?',
    'What was the participant(s) perception of the robot and their interaction with it? Is the robot disrupting, negative, supportive, positive, or neutral?'
  ],
  'Definition of Situation': [
    'Were the participants uncertain about the situation?',
    'Were the participants unsure about the consequences of their actions?',
    'How well does the interacting agents know each other?',
    'How did the participants perceive the context of the interaction?',
    'What does the power dynamic look like in this interaction?', 
    'If multiple participants were involved, how did they interact with the robot? Did they communicate with each other?',
    'Are there any social rules or cultural norms that the participants are following?',
    'Did the emotional state of the participant at that very moment influence the interaction in any way?',
  ],
  'Rule Selection': [
    'What options did the participant(s) have to make their decision?', 
  ]
};

const CONNECTIONS = [
  [0, 2], // Situation → Definition of Situation
  [0, 1], // Situation → Identity
  [1, 2], // Identity → Definition of Situation
  [2, 3], // Definition of Situation → Rule Selection
  [1, 3], // Identity → Rule Selection
  [3, 4], // Rule Selection → Decision
];

const ParticipantPage = ({ projects, updateParticipantAnswers, updateParticipantSummary, updateProjectRules }) => {
  const { projectId, participantId } = useParams();
  const navigate = useNavigate();
  const idx = parseInt(projectId, 10);
  const project = projects && projects[idx];
  
  // State for dynamic questions from database
  const [questions, setQuestions] = useState({});
  const [questionsLoading, setQuestionsLoading] = useState(true);
  
  // Get the selected scope from localStorage or default to first scope
  const getSelectedScopeIndex = () => {
    try {
      const stored = localStorage.getItem(`project_${idx}_selected_scope`);
      return stored ? parseInt(stored, 10) : 0;
    } catch (error) {
      return 0;
    }
  };
  
  const selectedScopeIndex = getSelectedScopeIndex();
  const currentScope = project?.scopes?.[selectedScopeIndex];
  const participants = currentScope?.participants || [];
  const participant = participants.find(p => p.id === participantId);
  const currentIndex = participants.findIndex(p => p.id === participantId);
  const [summary, setSummary] = useState(participant?.summary || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);
  const [interviewText, setInterviewText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInterview, setShowInterview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newRule, setNewRule] = useState('');
  const [selectedRules, setSelectedRules] = useState([]);
  const [extractionConfig, setExtractionConfig] = useState({
    confidenceThreshold: 0.7,
    contextWindow: 3,
    requireExactMatch: false
  });
  const [showRuleInput, setShowRuleInput] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);

  // Manual refresh function for connections
  const refreshConnections = useRef(() => {});

  // Load questions from database
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const questionsData = await window.electronAPI.getEnabledProjectQuestions(idx);
        
        // Format them for the component
        const formattedQuestions = {};
        Object.keys(questionsData).forEach(section => {
          formattedQuestions[section] = questionsData[section].map(q => {
            if (q.questionType === 'dropdown') {
              return {
                id: q.questionId,
                text: q.questionText,
                type: 'dropdown',
                options: q.options
              };
            } else {
              return q.questionText;
            }
          });
        });
        
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to hardcoded questions if database fails
        setQuestions(QUESTIONS);
      } finally {
        setQuestionsLoading(false);
      }
    };
    
    loadQuestions();
  }, [idx]);

  // Reset states when participant changes
  useEffect(() => {
    setSummary(participant?.summary || '');
    setError(null);
    setProgress(0);
    setInterviewText(participant?.interviewText || '');
    // Ensure selectedRules is always an array
    const participantSelectedRules = participant?.answers?.['Rule Selection']?.selectedRules;
    setSelectedRules(Array.isArray(participantSelectedRules) ? participantSelectedRules : []);
  }, [participantId, participant?.summary, participant?.interviewText, participant?.answers]);

  // Save interview text immediately when participant changes
  useEffect(() => {
    const saveInterviewText = async () => {
      if (participant && interviewText) {
        try {
          await window.electronAPI.updateParticipantInterview(idx, participantId, interviewText);
        } catch (error) {
          console.error('Error saving interview text:', error);
        }
      }
    };
    saveInterviewText();
  }, [participantId]);

  // Load participant's interview text when switching participants
  useEffect(() => {
    if (participant) {
      const loadedText = participant.interviewText || '';
      setInterviewText(loadedText);
    }
  }, [participant]);

  // Navigation window logic
  let start = Math.max(0, currentIndex - 1);
  let end = start + 3;
  if (end > participants.length) {
    end = participants.length;
    start = Math.max(0, end - 3);
  }
  const visibleParticipants = participants.slice(start, end);

  // Add refs for the boxes
  const boxRefs = useRef(SECTIONS.map(() => React.createRef()));
  const [connections, setConnections] = useState([]);

  // Define the connections structure with side specifications
  const connectionPairs = [
    { from: 0, to: 1, fromSide: 'left', toSide: 'right', horizontalOffset: 20 },
    { from: 0, to: 2, fromSide: 'right', toSide: 'left', horizontalOffset: 20 },     // Situation → Definition of Situation
    { from: 1, to: 2, fromSide: 'left', toSide: 'right', horizontalOffset: 20 },     // Identity → Definition of Situation
    { from: 1, to: 3, fromSide: 'right', toSide: 'left', horizontalOffset: 30 },     // Identity → Rule Selection
    { from: 2, to: 3, fromSide: 'left', toSide: 'right', horizontalOffset: 20 },     // Definition of Situation → Rule Selection
    { from: 3, to: 4, fromSide: 'left', toSide: 'right', horizontalOffset: 20 }      // Rule Selection → Decision
  ];

  // Calculate box positions and update connections
  useEffect(() => {
    const calculateConnections = () => {
      const boxes = boxRefs.current.map(ref => ref.current?.getBoundingClientRect());
      if (!boxes.every(box => box)) return [];

      const rightPanel = document.querySelector('.right-panel');
      if (!rightPanel) return [];
      
      const panelRect = rightPanel.getBoundingClientRect();
      
      // Account for the scope header height (60px)
      const headerHeight = 60;
      const adjustedTop = panelRect.top + headerHeight;

      // First, calculate how many connections go to each box side
      const connectionCounts = {};
      connectionPairs.forEach(pair => {
        // Format: "boxIndex-side" (e.g., "2-left")
        const toKey = `${pair.to}-${pair.toSide}`;
        connectionCounts[toKey] = (connectionCounts[toKey] || 0) + 1;
      });

      // Calculate paths with proper spacing
      const paths = connectionPairs.map((pair, index) => {
        const fromBox = boxes[pair.from];
        const toBox = boxes[pair.to];
        
        // Calculate start point (adjust for header)
        const startX = pair.fromSide === 'right' 
          ? fromBox.left - panelRect.left + fromBox.width 
          : fromBox.left - panelRect.left;
        const startY = fromBox.top - adjustedTop + (fromBox.height * 2/3); 

        // Calculate end point with proper spacing (adjust for header)
        const toKey = `${pair.to}-${pair.toSide}`;
        const totalConnections = connectionCounts[toKey];
        const connectionIndex = connectionPairs
          .filter((p, i) => i < index && p.to === pair.to && p.toSide === pair.toSide)
          .length;

        let endX = pair.toSide === 'left'
          ? toBox.left - panelRect.left
          : toBox.left - panelRect.left + toBox.width;

        // Calculate vertical offset for multiple connections
        let endY = toBox.top - adjustedTop + toBox.height / 3;
        if (totalConnections > 1) {
          const spacing = 20; // Gap between lines
          const totalHeight = (totalConnections - 1) * spacing;
          const startOffset = -totalHeight / 2;
          endY += startOffset + (connectionIndex * spacing);
        }

        // Calculate horizontal offset based on vertical distance
        const verticalDistance = Math.abs(startY - endY);
        const horizontalOffset = pair.horizontalOffset || 20; // Default to 20 if not specified

        // Create path with proper offsets
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
          startPoint: { x: startX, y: startY },
          endPoint: { x: endX, y: endY },
          direction: pair.toSide === 'right' ? 'right' : 'left'
        };
      });
      
      setConnections(paths);
    };

    // Assign the refresh function
    refreshConnections.current = calculateConnections;

    // Initial calculation
    calculateConnections();
    
    // Recalculate after a short delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(calculateConnections, 100);
    
    // Recalculate on scroll
    const scrollContainer = document.querySelector('.right-panel > div');
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', calculateConnections);
    }

    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateConnections, 50);
    };
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect content changes
    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(calculateConnections, 50);
      });
      
      // Observe the right panel and its scrollable content
      const rightPanel = document.querySelector('.right-panel');
      if (rightPanel) {
        resizeObserver.observe(rightPanel);
      }
      
      const scrollContainer = document.querySelector('.right-panel > div');
      if (scrollContainer) {
        resizeObserver.observe(scrollContainer);
      }
    }

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (scrollContainer) {
        scrollContainer.removeEventListener('scroll', calculateConnections);
      }
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [
    projects, 
    participantId, 
    participant?.answers, 
    selectedRules, 
    showInterview, 
    showSummary,
    currentScope
  ]);

  // Additional effect to handle content changes that might affect box heights
  useEffect(() => {
    // Refresh connections when answers change
    const timeoutId = setTimeout(() => {
      refreshConnections.current();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [participant?.answers, selectedRules]);

  const generateSummary = async () => {
    if (!participant) return;
    
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    
    try {
      // Check if there are any answers to summarize
      const hasAnswers = SECTIONS.some(section => 
        questions[section.name]?.some(q => {
          const questionText = typeof q === 'object' ? q.text : q;
          return participant.answers?.[section.name]?.[questionText];
        })
      );

      if (!hasAnswers) {
        setError('Please provide some answers before generating a summary.');
        return;
      }

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // Collect all answers from all sections
      const allAnswers = SECTIONS.map(section => {
        const sectionAnswers = questions[section.name]?.map(q => {
          const questionText = typeof q === 'object' ? q.text : q;
          const answer = participant.answers?.[section.name]?.[questionText];
          return answer ? `${questionText}: ${answer}` : null;
        }).filter(Boolean) || [];
        
        return sectionAnswers.length > 0 
          ? `${section.name}:\n${sectionAnswers.join('\n')}`
          : null;
      }).filter(Boolean);

      const prompt = `You are an expert in analyzing human-robot interaction using the MOFASA (Modified Factors of Social Appropriateness) framework.

Your task is to write a concise, single-paragraph summary of a participant's responses. You must describe how their identity shaped their interpretation and behavior in the interaction, and clearly tag relevant subfactors in [brackets and italics] after each major element.

🔹 Structure:
1. Start with the participant's identity — background, personal history, social motive, and self-perception — and tag with [Background], [Personal History], [Social Motive], or [Self-Perception].
2. Describe their behavioral choice or judgment, and add [Decision].
3. Briefly describe the situation — context, time, environment, and robot type — tagging with [Time], [Place], [Participants], [Role Identities], or [Group Size].
4. Explain how their identity shaped their understanding of the situation — uncertainty, power dynamics, social interaction, emotional state, etc. — tagging with [Uncertainty], [Consequences], [Personal History], [Emotional State], [Power Dynamics], or [Context].
5. Conclude with the social expectations or norms expressed or implied, and tag as [Rules] with relevant subfactors.

🔹 Format Requirements:
- Write ONE single paragraph — no line breaks or bullet points.
- Add [Subfactor] tags in "Italic" after the related phrases.
- Keep it to 4-5 sentences. Be concise, clear, and grounded in the data.

🔹 Example format:
"Participant A, a first-year biology student [Background] with no prior experience with robots [Experience], approached the robot because they were curious and felt it was safe [Self-Perception]. 
They decided to interact with it and ask a question **(Decision)**. The interaction happened in a public university hallway at midday [Context] [Time] [Environment], involving a mobile humanoid robot [Type of Robot]. 
Their lack of experience and positive attitude led them to view the situation as harmless and non-authoritative [Emotional State] [Power Dynamics] [Uncertainty]. 
They kept a respectful distance and maintained a neutral tone throughout [Rules]."

Participant Responses:
${allAnswers.join('\n\n')}
`;

      const generatedSummary = await window.electronAPI.generateWithDeepSeek(prompt);
      clearInterval(progressInterval);
      setProgress(100);
      setSummary(generatedSummary);
      
      // Update the participant's summary using the new function
      updateParticipantSummary(idx, participantId, generatedSummary);
      
      // Refresh connections after summary generation
      setTimeout(() => {
        refreshConnections.current();
      }, 200);
    } catch (error) {
      console.error('Failed to generate summary:', error);
      setError('Failed to generate summary. Please check if LLM is running and try again.');
      setSummary('');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  const processQuestionWithLLM = async (question, interviewText, config) => {
    try {
      const prompt = `You are analyzing an interview about human-robot interaction. Extract a precise answer to the question from the interview text. If you cannot find a clear answer, respond with an empty string.

Question: "${question}"

Interview Text:
${interviewText}

Instructions:
1. Only extract information that is explicitly stated or can be directly inferred from the interview text
2. If the answer is not clear or not present, respond with an empty string ("")
3. Keep the answer very short and precise - one sentence maximum
4. Do not repeat the question in your answer
5. Do not add any explanations or assumptions
6. Do not use phrases like "According to the interview" or "The participant mentioned"

Answer:`;

      const result = await window.electronAPI.generateWithDeepSeek(prompt);
      const answer = result.trim();
      
      return {
        answer: answer || '',  // Convert empty strings to actual empty strings
        confidence: answer.length > 0 ? 1 : 0
      };
    } catch (error) {
      console.error('Error processing question:', error);
      return {
        answer: '',
        confidence: 0,
        error: error.message
      };
    }
  };

  const handleProcessInterview = async () => {
    if (!interviewText.trim()) {
      alert('Please enter interview text first.');
      return;
    }

    setIsProcessing(true);
    setIsUpdating(true);
    const processedAnswers = {};
    const sectionsToProcess = ['Situation', 'Identity', 'Definition of Situation'];
    const totalQuestions = sectionsToProcess.reduce((acc, section) => 
      acc + (questions[section]?.length || 0), 0);
    let processedCount = 0;

    try {
      // Process questions in batches to prevent UI freezing
      for (const section of sectionsToProcess) {
        processedAnswers[section] = {};
        
        // Process questions in groups of 3
        const sectionQuestions = questions[section] || [];
        for (let i = 0; i < sectionQuestions.length; i += 3) {
          const batch = sectionQuestions.slice(i, i + 3);
          const batchPromises = batch.map(async (question) => {
            const questionText = typeof question === 'object' ? question.text : question;
            const questionId = typeof question === 'object' ? question.id : questionText;
            
            // Skip demographic questions that require specific options
            if (typeof question === 'object' && question.type === 'dropdown') {
              processedAnswers[section][questionId] = participant?.answers?.[section]?.[questionId] || '';
              return;
            }

            const result = await processQuestionWithLLM(questionText, interviewText, extractionConfig);
            processedAnswers[section][questionId] = result.answer;
          });

          // Wait for the batch to complete
          await Promise.all(batchPromises);
          processedCount += batch.length;
          setProgress((processedCount / totalQuestions) * 100);
          
          // Small delay to prevent UI freezing
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update all answers at once
      await Promise.all(
        Object.entries(processedAnswers).map(([section, answers]) =>
          Object.entries(answers).map(([question, answer]) =>
            updateParticipantAnswers(idx, participantId, section, question, answer)
          )
        ).flat()
      );

      // Refresh connections after processing
      setTimeout(() => {
        refreshConnections.current();
      }, 200);

      alert('Interview processed successfully!');
    } catch (error) {
      alert('Error processing interview: ' + error.message);
    } finally {
      setIsProcessing(false);
      setIsUpdating(false);
      setProgress(0);
    }
  };

  const handleConfigChange = (key, value) => {
    setExtractionConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleAddRule = () => {
    if (!currentScope || !newRule.trim()) return;
    if (!(currentScope.rules || []).includes(newRule.trim())) {
      // Create a new scopes array with updated rules for the current scope
      const updatedScopes = project.scopes.map((scope, i) =>
        i === selectedScopeIndex
          ? { ...scope, rules: [...(scope.rules || []), newRule.trim()] }
          : scope
      );
      updateProjectRules(idx, updatedScopes);
      setNewRule('');
      setShowRuleInput(false);
    }
  };

  const handleDeleteRule = (rule) => {
    if (!currentScope) return;
    const updatedRules = (currentScope.rules || []).filter(r => r !== rule);
    // Remove this rule from all participants in this scope
    const updatedParticipants = (currentScope.participants || []).map(p => {
      const currentRules = p.answers?.['Rule Selection']?.selectedRules || [];
      if (currentRules.includes(rule)) {
        const newSelectedRules = currentRules.filter(r => r !== rule);
        return {
          ...p,
          answers: {
            ...p.answers,
            'Rule Selection': {
              ...p.answers?.['Rule Selection'],
              selectedRules: newSelectedRules
            }
          }
        };
      }
      return p;
    });
    // Create a new scopes array with updated rules and participants for the current scope
    const updatedScopes = project.scopes.map((scope, i) =>
      i === selectedScopeIndex
        ? { ...scope, rules: updatedRules, participants: updatedParticipants }
        : scope
    );
    updateProjectRules(idx, updatedScopes);
    setSelectedRules(prev => prev.filter(r => r !== rule));
    setRuleToDelete(null);
  };

  const handleRuleSelection = (rule) => {
    const updatedRules = selectedRules.includes(rule)
      ? selectedRules.filter(r => r !== rule)
      : [...selectedRules, rule];
    
    setSelectedRules(updatedRules);
    updateParticipantAnswers(idx, participantId, 'Rule Selection', 'selectedRules', updatedRules);
    
    // Refresh connections after rule selection
    setTimeout(() => {
      refreshConnections.current();
    }, 100);
  };

  if (!participant || !project) {
    return <div className="left-panel"><h2>Participant Not Found</h2></div>;
  }

  if (questionsLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontFamily: 'Lexend, sans-serif',
        fontSize: '1.1em',
        color: '#2c3e50'
      }}>
        Loading questionnaire...
      </div>
    );
  }

  const handleAnswerChange = (section, question, value) => {
    if (!isUpdating) {
      updateParticipantAnswers(idx, participantId, section, question, value);
    }
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left Panel */}
      <div className="left-panel" style={{ 
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden' // Prevent double scrollbars
      }}>
        {/* Navigation Pane - Fixed at top */}
        <div style={{ 
          position: 'absolute', 
          top: 16, 
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex', 
          alignItems: 'center', 
          gap: 8, 
          zIndex: 2,
          backgroundColor: 'white',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <button
              onClick={() => navigate(`/projects/${projectId}`)}
              style={{
                padding: '6px 16px',
                backgroundColor: '#ecf0f1',
                color: '#2c3e50',
                border: '1px solid #bdc3c7',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
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
              &#8592; Back
            </button>
          <button
            onClick={() => {
              if (start > 0) navigate(`/projects/${projectId}/participants/${participants[start - 1].id}`);
            }}
            disabled={start === 0}
            style={{
              background: 'none',
              border: 'none',
              color: start === 0 ? '#ccc' : '#2980b9',
              fontSize: '1.3em',
              cursor: start === 0 ? 'default' : 'pointer',
              padding: '0 6px',
              userSelect: 'none'
            }}
          >
            &#60;
          </button>
          {visibleParticipants.map((p, i) => (
            <span
              key={p.id}
              onClick={() => navigate(`/projects/${projectId}/participants/${p.id}`)}
              style={{
                padding: '4px 10px',
                background: p.id === participantId ? '#2980b9' : '#eaf6ff',
                color: p.id === participantId ? '#fff' : '#222',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: p.id === participantId ? 700 : 400,
                border: p.id === participantId ? '2px solid #2980b9' : '1px solid #dcdde1',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '.98em',
                marginLeft: i === 0 ? 0 : 4
              }}
            >
              {p.name}
            </span>
          ))}
          <button
            onClick={() => {
              if (end < participants.length) navigate(`/projects/${projectId}/participants/${participants[end].id}`);
            }}
            disabled={end >= participants.length}
            style={{
              background: 'none',
              border: 'none',
              color: end >= participants.length ? '#ccc' : '#2980b9',
              fontSize: '1.3em',
              cursor: end >= participants.length ? 'default' : 'pointer',
              padding: '0 6px',
              userSelect: 'none'
            }}
          >
            &#62;
          </button>
        </div>

        {/* Scrollable Content Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          padding: '16px 24px'
        }}>
        {/* Back Button
        <div style={{ marginBottom: '16px' }}>
          <button
            onClick={() => navigate(`/projects/${projectId}`)}
            style={{
              padding: '8px 20px',
              backgroundColor: '#ecf0f1',
              color: '#2c3e50',
              border: '1px solid #bdc3c7',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
              fontFamily: 'Lexend, sans-serif',
              fontSize: '0.95em',
              transition: 'all 0.2s ease',
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
            &#8592; Back
          </button>
        </div> */}

        {/* Participant Title */}
          <div style={{ marginBottom: '24px', marginTop: '36px' }}>
          <h2 style={{ fontFamily: 'Lexend, sans-serif', fontWeight: 700, fontSize: '1.3em', marginBottom: 18 }}>{participant.name}</h2>
          
          {/* Scope Selection */}
          {project.scopes && project.scopes.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ 
                fontFamily: 'Lexend, sans-serif', 
                fontWeight: 600, 
                fontSize: '1.0em', 
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
                    onClick={() => {
                      // Update localStorage and navigate to the same participant in the new scope
                      try {
                        localStorage.setItem(`project_${idx}_selected_scope`, index.toString());
                      } catch (error) {
                        console.error('Error saving selected scope:', error);
                      }
                      // Navigate to the same participant in the new scope
                      navigate(`/projects/${idx}/participants/${participantId}`);
                    }}
                    style={{
                      padding: '6px 12px',
                      backgroundColor: selectedScopeIndex === index ? '#3498db' : '#ecf0f1',
                      color: selectedScopeIndex === index ? '#fff' : '#2c3e50',
                      border: '1px solid',
                      borderColor: selectedScopeIndex === index ? '#3498db' : '#bdc3c7',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: selectedScopeIndex === index ? '600' : '500',
                      fontSize: '0.85em',
                      fontFamily: 'Lexend, sans-serif',
                      transition: 'all 0.2s ease',
                      minWidth: '70px',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      if (selectedScopeIndex !== index) {
                        e.target.style.backgroundColor = '#d5dbdb';
                        e.target.style.borderColor = '#95a5a6';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (selectedScopeIndex !== index) {
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
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '4px',
                  border: '1px solid #e9ecef',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em',
                  color: '#495057'
                }}>
                  {currentScope.scopeText || 'No description provided'}
                </div>
              )}
            </div>
          )}
        </div>

          {/* Toggle Switches */}
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            marginBottom: '24px',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #e9ecef'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ 
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '24px'
              }}>
                <input
                  type="checkbox"
                  checked={showInterview}
                  onChange={() => {
                    setShowInterview(!showInterview);
                    // Refresh connections after toggle
                    setTimeout(() => {
                      refreshConnections.current();
                    }, 100);
                  }}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: showInterview ? '#3498db' : '#ccc',
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
                    transform: showInterview ? 'translateX(26px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
              <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '0.95em' }}>Extract Data from Interview</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ 
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '24px'
              }}>
                <input
                  type="checkbox"
                  checked={showSummary}
                  onChange={() => {
                    setShowSummary(!showSummary);
                    // Refresh connections after toggle
                    setTimeout(() => {
                      refreshConnections.current();
                    }, 100);
                  }}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span style={{
                  position: 'absolute',
                  cursor: 'pointer',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: showSummary ? '#3498db' : '#ccc',
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
                    transform: showSummary ? 'translateX(26px)' : 'translateX(0)'
                  }} />
                </span>
              </label>
              <span style={{ fontFamily: 'Lexend, sans-serif', fontSize: '0.95em' }}>Generate Summary</span>
            </div>
          </div>

          {/* Interview Text Area */}
          {showInterview && (
            <div style={{ 
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  value={interviewText}
                  onChange={(e) => setInterviewText(e.target.value)}
                  placeholder="Paste interview text here..."
                  style={{
                    width: '100%',
                    minHeight: '200px',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #dcdde1',
                    fontSize: '0.95em',
                    fontFamily: 'Lexend, sans-serif',
                    resize: 'vertical',
                    marginBottom: '12px'
                  }}
                />
                <button
                  onClick={handleProcessInterview}
                  disabled={isProcessing || !interviewText.trim()}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isProcessing || !interviewText.trim() ? '#bbb' : '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isProcessing || !interviewText.trim() ? 'default' : 'pointer',
                    fontFamily: 'Lexend, sans-serif'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Process Interview'}
                </button>
                {isProcessing && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      backgroundColor: '#eee',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: '#3498db',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Summary Section */}
          {showSummary && (
            <div style={{ 
              marginBottom: '24px',
              padding: '16px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <textarea
                  value={summary}
                  onChange={(e) => {
                    setSummary(e.target.value);
                    updateParticipantSummary(idx, participantId, e.target.value);
                  }}
                  placeholder="Generated summary will appear here..."
                  style={{
                    width: '100%',
                    minHeight: '150px',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '1px solid #dcdde1',
                    fontSize: '0.95em',
                    fontFamily: 'Lexend, sans-serif',
                    resize: 'vertical',
                    marginBottom: '12px'
                  }}
                />
                <button
                  onClick={generateSummary}
                  disabled={isGenerating}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: isGenerating ? '#bbb' : '#3498db',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: isGenerating ? 'default' : 'pointer',
                    fontFamily: 'Lexend, sans-serif'
                  }}
                >
                  {isGenerating ? 'Generating...' : 'Generate Summary'}
                </button>
                {isGenerating && (
                  <div style={{ marginTop: '8px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '4px', 
                      backgroundColor: '#eee',
                      borderRadius: '2px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${progress}%`,
                        height: '100%',
                        backgroundColor: '#3498db',
                        transition: 'width 0.3s ease'
                      }} />
                    </div>
                  </div>
                )}
                {error && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#fee',
                    color: '#e74c3c',
                    borderRadius: '4px',
                    fontSize: '0.9em'
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Question Sections */}
          <div>
            {SECTIONS.map(section => (
              <div key={section.name} style={{ marginBottom: 32 }}>
                <h3 style={{ 
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.1em',
                  marginBottom: 16,
                  color: '#2c3e50'
                }}>
                  {section.name}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {section.name === 'Rule Selection' ? (
                    <>
                      <div style={{ 
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '8px',
                        marginBottom: '16px'
                      }}>
                        {(currentScope?.rules || []).map((rule, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              padding: '6px 12px',
                              backgroundColor: selectedRules.includes(rule) ? '#3498db' : '#f8f9fa',
                              color: selectedRules.includes(rule) ? '#fff' : '#2c3e50',
                              border: '1px solid #dcdde1',
                              borderRadius: '4px',
                              fontFamily: 'Lexend, sans-serif',
                              fontSize: '0.95em',
                              cursor: 'pointer'
                            }}
                          >
                            <span onClick={() => handleRuleSelection(rule)}>
                              {rule}
                            </span>
                            <span
                              onClick={() => setRuleToDelete(rule)}
                              style={{
                                marginLeft: '8px',
                                cursor: 'pointer',
                                color: selectedRules.includes(rule) ? '#fff' : '#e74c3c',
                                fontWeight: 'bold'
                              }}
                            >
                              ×
                            </span>
                          </div>
                        ))}
                        <button
                          onClick={() => setShowRuleInput(true)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: '#2ecc71',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '0.95em'
                          }}
                        >
                          Add new rule
                        </button>
                      </div>

                      {showRuleInput && (
                        <div style={{ 
                          marginBottom: '16px',
                          display: 'flex',
                          gap: '8px'
                        }}>
                          <input
                            type="text"
                            value={newRule}
                            onChange={(e) => setNewRule(e.target.value)}
                            placeholder="Enter a new rule..."
                            style={{
                              flex: 1,
                              padding: '8px 12px',
                              borderRadius: '4px',
                              border: '1px solid #dcdde1',
                              fontSize: '0.95em',
                              fontFamily: 'Lexend, sans-serif'
                            }}
                            autoFocus
                          />
                          <button
                            onClick={handleAddRule}
                            disabled={!newRule.trim()}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: newRule.trim() ? '#2ecc71' : '#bbb',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: newRule.trim() ? 'pointer' : 'default'
                            }}
                          >
                            Add
                          </button>
                          <button
                            onClick={() => {
                              setShowRuleInput(false);
                              setNewRule('');
                            }}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: '#e74c3c',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer'
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </>
                  ) : section.name === 'Decision' ? (
                    <>
                      {Array.isArray(selectedRules) && selectedRules.length > 0 ? (
                        <div style={{ marginBottom: 16 }}>
                          <div style={{ 
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            {selectedRules.map((rule, index) => (
                              <div
                                key={index}
                                style={{
                                  padding: '8px 12px',
                                  backgroundColor: '#f8f9fa',
                                  borderRadius: '4px',
                                  fontFamily: 'Lexend, sans-serif',
                                  fontSize: '0.95em',
                                  color: '#2c3e50'
                                }}
                              >
                                {rule}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          padding: '16px',
                          backgroundColor: '#f8f9fa',
                          borderRadius: '4px',
                          textAlign: 'center',
                          color: '#7f8c8d',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.95em',
                          border: '1px dashed #bdc3c7'
                        }}>
                          Select a Rule to add Decisions
                        </div>
                      )}
                    </>
                  ) : (
                    questions[section.name]?.map((question, i) => {
                      const isDropdown = typeof question === 'object' && question.type === 'dropdown';
                      const questionText = isDropdown ? question.text : question;
                      const questionId = isDropdown ? question.id : question;

                      return (
                        <div key={questionId} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <label style={{ 
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '0.95em',
                            color: '#34495e'
                          }}>
                            {questionText}
                          </label>
                          {isDropdown ? (
                            <select
                              value={participant?.answers?.[section.name]?.[questionId] || ''}
                              onChange={(e) => handleAnswerChange(section.name, questionId, e.target.value)}
                              style={{
                                padding: '8px 12px',
                                borderRadius: 4,
                                border: '1px solid #dcdde1',
                                fontSize: '0.95em',
                                fontFamily: 'Lexend, sans-serif',
                                color: '#2c3e50',
                                background: '#fff'
                              }}
                            >
                              <option value="">Select an option</option>
                              {question.options.map(option => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <textarea
                              value={participant?.answers?.[section.name]?.[question] || ''}
                              onChange={(e) => handleAnswerChange(section.name, question, e.target.value)}
                              style={{
                                padding: 12,
                                borderRadius: 4,
                                border: '1px solid #dcdde1',
                                minHeight: 80,
                                fontSize: '0.95em',
                                fontFamily: 'Lexend, sans-serif',
                                resize: 'vertical'
                              }}
                              placeholder="Enter your answer here..."
                            />
                          )}
                        </div>
                      );
                    }) || []
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel: Visual Answers */}
      <div className="right-panel" style={{ 
        background: 'linear-gradient(180deg,rgb(55, 70, 83) 0%, #232b32 100%)', 
        display: 'flex', 
        flexDirection: 'column', 
        height: '100%',
        position: 'relative'
      }}>
        {/* Current Scope Header */}
        {currentScope && (
          <div style={{
            padding: '16px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontFamily: 'Lexend, sans-serif',
            fontSize: '1.1em',
            fontWeight: '600',
            textAlign: 'center'
          }}>
            Current Scope: {currentScope.scopeNumber || 'No description'}
          </div>
        )}
        
        {/* SVG Container for Lines */}
        <svg 
          style={{ 
            position: 'absolute',
            top: currentScope ? '60px' : '0',
            left: 0,
            right: '16px', // Leave space for scrollbar
            height: currentScope ? 'calc(100% - 60px)' : '100%',
            pointerEvents: 'none',
            overflow: 'visible',
            zIndex: 100
          }}
        >
          {/* Definitions for gradients and filters */}
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style={{stopColor: 'rgba(255, 255, 255, 0.8)', stopOpacity: 1}} />
              <stop offset="100%" style={{stopColor: 'rgba(255, 255, 255, 0.4)', stopOpacity: 1}} />
            </linearGradient>
            <filter id="dotGlow">
              <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" 
              refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 8 3.5, 0 7" fill="rgba(255, 255, 255, 0.8)" />
            </marker>
          </defs>
          
          {connections.map((connection, index) => (
            <g key={index}>
              {/* Connection line */}
              <path
                d={connection.path}
                stroke="url(#lineGradient)"
                strokeWidth="1"
                fill="none"
                opacity="2"
                markerEnd="url(#arrowhead)"
              />
              
              {/* Start point dot */}
              <circle
                cx={connection.startPoint.x}
                cy={connection.startPoint.y}
                r="4"
                fill="rgba(210, 233, 255, 0.9)"
                stroke="rgba(124, 193, 240, 0.8)"
                strokeWidth="1"
                filter="url(#dotGlow)"
              />
              
              {/* End point dot */}
              {/*<circle
                cx={connection.endPoint.x}
                cy={connection.endPoint.y}
                r="4"
                fill="rgba(52, 152, 219, 0.9)"
                stroke="rgba(255, 255, 255, 0.8)"
                strokeWidth="2"
                filter="url(#dotGlow)"
              />*/}
            </g>
          ))}
        </svg>

        {/* Scrollable Boxes Area */}
        <div style={{ 
          flex: 1,
          overflowY: 'auto', 
          padding: '32px 16px 32px 0', // Add right padding to account for scrollbar
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}>
        {SECTIONS.map((section, i) => (
          <div
            key={section.name}
              ref={boxRefs.current[i]}
            style={{
              width: 420,
              background: section.color,
              borderRadius: 10,
              marginBottom: 32,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
              border: '1.5px solid #e0e0e0',
              position: 'relative',
                padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
                height: 'auto'
              }}
            >
              <div style={{ 
                fontWeight: 700, 
                fontFamily: 'Lexend, sans-serif', 
                fontSize: '1.1em', 
                marginBottom: 10 
              }}>
                {section.name}
              </div>
              <div style={{ 
                fontFamily: 'Lexend, sans-serif', 
                fontSize: '1em', 
                color: '#222', 
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {section.name === 'Rule Selection' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(currentScope?.rules || []).map((rule, index) => (
                      <div
                        key={index}
                        onClick={() => handleRuleSelection(rule)}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: selectedRules.includes(rule) ? '#3498db' : '#f8f9fa',
                          color: selectedRules.includes(rule) ? '#fff' : '#2c3e50',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {rule}
                      </div>
                    ))}
                  </div>
                ) : section.name === 'Decision' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Array.isArray(selectedRules) && selectedRules.length > 0 ? (
                      <div style={{ marginBottom: 12 }}>
                        {selectedRules.map((rule, index) => (
                          <div
                            key={index}
                            style={{
                              padding: '8px 12px',
                              marginTop: 4,
                              backgroundColor: '#f8f9fa',
                              borderRadius: '4px',
                              fontSize: '0.95em',
                              color: '#2c3e50',
                              border: '1px solid #e0e0e0'
                            }}
                          >
                            {rule}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{
                        padding: '12px',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '4px',
                        textAlign: 'center',
                        color: '#7f8c8d',
                        fontSize: '0.95em',
                        border: '1px dashed #bdc3c7'
                      }}>
                        No rules selected for decision
                      </div>
                    )}
                  </div>
                ) : (
                  questions[section.name]?.map((question, i) => {
                    const questionId = typeof question === 'object' ? question.id : question;
                    const answer = participant.answers?.[section.name]?.[questionId];
                    return answer ? (
                      <div key={questionId} style={{ marginBottom: 12 }}>
                        {answer}
                      </div>
                    ) : null;
                  }) || []
                )}
              </div>
            </div>
          ))}
          </div>
      </div>

      {/* Delete Rule Confirmation Modal */}
      {ruleToDelete && (
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
            maxWidth: '90%'
          }}>
            <h3 style={{ marginBottom: '16px' }}>Delete Rule</h3>
            <p style={{ marginBottom: '24px' }}>
              Are you sure you want to remove this rule? It will be removed from all participants.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setRuleToDelete(null)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRule(ruleToDelete)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantPage; 