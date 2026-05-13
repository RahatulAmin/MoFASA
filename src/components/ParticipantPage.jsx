import React, { useRef, useLayoutEffect, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import FactorDetailsModal from './FactorDetailsModal';
import { handleFactorClick, parseFactors, getFactorFromStorage } from '../utils/factorUtils';
import {
  ANALYTIC_TAGS_SECTION,
  ANALYTIC_TAGS_FIELD,
  ANALYTIC_TAG_COLORS_FIELD,
  DEFAULT_TAG_COLOR,
  TAG_COLOR_OPTIONS,
  getAcceptedTags,
  getTagColors,
  getTagColorStyle,
  getParticipantSummary,
  normalizeTags,
  suggestTags
} from '../utils/mofasaAnalysis';
import { RULE_SELECTION, SITUATION, IDENTITY, DEFINITION_OF_SITUATION } from '../constants/labels';

const SECTIONS = [
  {
    name: SITUATION,
    color: '#f9f3f2'
  },
  {
    name: IDENTITY,
    color: '#fcfbf2'
  },
  {
    name: DEFINITION_OF_SITUATION,
    color: '#f2f6fc'
  },
  {
    name: RULE_SELECTION,
    color: '#ededed'
  },
  {
    name: 'Decision',
    color: '#f2fcf2'
  }
];

const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Other'];
const DEFAULT_SECTION_ORDER = SECTIONS.map(section => section.name);

const normalizeSectionOrder = (sectionOrder) => {
  const requestedOrder = Array.isArray(sectionOrder) ? sectionOrder : [];
  const validNames = new Set(DEFAULT_SECTION_ORDER);
  const uniqueOrderedNames = requestedOrder.filter((name, index) => (
    validNames.has(name) && requestedOrder.indexOf(name) === index
  ));
  const missingNames = DEFAULT_SECTION_ORDER.filter(name => !uniqueOrderedNames.includes(name));

  return [...uniqueOrderedNames, ...missingNames];
};

const normalizeTextForMatch = (value) => (
  String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
);

const splitInterviewIntoSentences = (text) => {
  const sentenceMatches = String(text || '').match(/[^.!?\n]+(?:[.!?]+|$)|\n+/g) || [];
  return sentenceMatches
    .map(part => part.trim())
    .filter(Boolean);
};

const extractJsonObject = (response) => {
  const cleaned = String(response || '')
    .replace(/```json/gi, '```')
    .replace(/```/g, '')
    .trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('No JSON object found in LLM response');
  }

  return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
};

const tokenizeForSuggestions = (value) => (
  normalizeTextForMatch(value)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2)
);

const getSuggestionTerms = (factorContextItem) => {
  const factorDetails = getFactorFromStorage(factorContextItem.factor);
  const sourceText = [
    factorContextItem.factor,
    factorDetails?.description,
    ...(factorDetails?.examples || []),
    ...(factorDetails?.relatedFactors || []),
    ...(factorContextItem.questions || [])
  ].join(' ');

  return Array.from(new Set(tokenizeForSuggestions(sourceText)));
};

const buildCandidateSuggestions = (interviewText, factorContext) => {
  const sentences = splitInterviewIntoSentences(interviewText);

  return factorContext.flatMap(factorItem => {
    const terms = getSuggestionTerms(factorItem);
    const factorDetails = getFactorFromStorage(factorItem.factor);

    return sentences
      .map((sentence, sentenceIndex) => {
        const sentenceTokens = new Set(tokenizeForSuggestions(sentence));
        const matchedTerms = terms.filter(term => sentenceTokens.has(term));
        const directFactorMatch = normalizeTextForMatch(sentence).includes(normalizeTextForMatch(factorItem.factor));
        const score = matchedTerms.length + (directFactorMatch ? 3 : 0);

        return {
          id: `${factorItem.factor}-${sentenceIndex}`,
          factor: factorItem.factor,
          section: factorItem.sections?.[0] || factorDetails?.section || '',
          question: factorItem.questions?.[0] || '',
          sentence,
          sentenceIndex,
          matchedTerms,
          score,
          factorDescription: factorDetails?.description || '',
          factorExamples: factorDetails?.examples || []
        };
      })
      .filter(candidate => candidate.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);
  })
    .sort((a, b) => b.score - a.score)
    .slice(0, 45);
};

const QUESTIONS = {
  'Situation': [
    'When and where did the interaction happen?',
    'Who are the interacting agents in the interaction, and what are their roles?',
    'How many humans were interacting with the robot?',
    'What was their social motive or intention for interacting with the robot?',
    'What is the type of the robot? What features does it have and what can it do?'
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
    'Do they have previous experience of interacting with robots?',
    'Do they have any specific preferences for the interaction? Does their personal characteristics and how they shape their social role influence the interaction?',
    'Do they have any habit, follow certain social values, social norms, or regulative norms?'
  ],
  'Definition of Situation': [
    'Are the individuals uncertain about how the situation will unfold?',
    'How well does the interacting agents know each other and what is the nature of their relationship (casual or formal)?',
    'How does the participant perceive the framing or context of the interaction?',
    'What is the power dynamics between the interacting agents?',
    'If multiple humans are present: How is the group dynamics? Did they communicate with each other?',
    'Did the emotional state of the participant at that very moment influence the interaction in any way?',
    'How does the robot\'s presence and performance—through its body, media, and behavior - constructs meaning in this interaction?'
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

const CONNECTION_EXPLANATIONS = {
  'A': {
    title: 'Connection A: Situation → Identity',
    explanation: 'The situation is perceived by the individual\'s identity.'
  },
  'B': {
    title: 'Connection B: Situation → Definition of Situation',
    explanation: 'Connection B and C work together to define the situation.'
  },
  'C': {
    title: 'Connection C: Identity → Definition of Situation',
    explanation: 'An individual\'s identity shapes how they define and understand the situation. (Connection B + Connection C)'
  },
  'D': {
    title: 'Connection D: Identity → Rule Selection',
    explanation: 'Connection D and E work together to determine which rules or norms individuals choose to follow.'
  },
  'E': {
    title: 'Connection E: Definition of Situation → Rule Selection',
    explanation: 'How individuals define the situation determines which rules they consider applicable. (Connection D + Connection E)'
  },
  'F': {
    title: 'Connection F: Rule Selection → Decision',
    explanation: 'The selected rules guide the final decision or course of action.'
  }
};

// Custom comparison function for memo
const arePropsEqual = (prevProps, nextProps) => {
  // Only re-render if the project ID changes
  // Note: participantId comes from useParams(), not props, so we don't compare it here
  const prevProjectId = prevProps.projects?.[parseInt(prevProps.projectId, 10)]?.id;
  const nextProjectId = nextProps.projects?.[parseInt(nextProps.projectId, 10)]?.id;
  
  return prevProjectId === nextProjectId;
};

const ParticipantPage = ({ projects, updateParticipantAnswers, updateParticipantSummary, updateProjectRules, saveParticipantData }) => {
  const { projectId, participantId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const idx = parseInt(projectId, 10);
  const project = projects && projects[idx];
  const returnView = location.state?.returnView || 'details';
  const navigateToParticipant = (id) => {
    navigate(`/projects/${projectId}/participants/${id}`, {
      state: { returnView }
    });
  };
  
  // Use the actual project database ID for DB calls
  const actualProjectId = project?.id;
  
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
  
  // Debug logging
  console.log('Navigation Debug:', {
    participantId,
    currentIndex,
    participantsLength: participants.length,
    participantFound: !!participant,
    participantName: participant?.name,
    participantAnswers: participant?.answers,
    participants: participants.map(p => ({ id: p.id, name: p.name }))
  });
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
    requireExactMatch: false,
    useBatchProcessing: true, // New option for batch processing
    batchSize: 5 // Number of questions to process in each batch
  });
  const [showRuleInput, setShowRuleInput] = useState(false);
  const [ruleToDelete, setRuleToDelete] = useState(null);
  const [localAnswers, setLocalAnswers] = useState({});
  const [showFactorDetails, setShowFactorDetails] = useState(false);
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);
  const [sameForAllScopes, setSameForAllScopes] = useState({}); // Track which questions should apply to all scopes per participant
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [isFrameworkPanelCollapsed, setIsFrameworkPanelCollapsed] = useState(false);
  const [sectionOrder, setSectionOrder] = useState(() => {
    try {
      const storedOrder = localStorage.getItem(`participant_section_order_${actualProjectId || idx}`);
      return normalizeSectionOrder(storedOrder ? JSON.parse(storedOrder) : DEFAULT_SECTION_ORDER);
    } catch (error) {
      return DEFAULT_SECTION_ORDER;
    }
  });
  const [showSectionOrderModal, setShowSectionOrderModal] = useState(false);
  const [draftSectionOrder, setDraftSectionOrder] = useState([]);
  const [draggingSectionName, setDraggingSectionName] = useState(null);
  const [dragOverSectionName, setDragOverSectionName] = useState(null);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [suggestionProgress, setSuggestionProgress] = useState(0);
  const [suggestionStatus, setSuggestionStatus] = useState('');
  const [suggestionError, setSuggestionError] = useState(null);
  const [mofasaSuggestions, setMofasaSuggestions] = useState([]);
  const [suggestedAnalyticTags, setSuggestedAnalyticTags] = useState([]);
  const [customAnalyticTag, setCustomAnalyticTag] = useState('');
  const [tagColorModalTag, setTagColorModalTag] = useState(null);
  
  // Persist interview processing state - participant specific
  const [processingStatus, setProcessingStatus] = useState({
    isProcessing: false,
    progress: 0,
    processedCount: 0,
    totalQuestions: 0,
    startTime: null
  });
  
  // Store scroll position to preserve it during re-renders
  const scrollPositionRef = useRef({ top: 0, left: 0 });
  const shouldRestoreScroll = useRef(false);
  const questionsLoadedRef = useRef(false); // Track if questions are already loaded
  const draggedSectionNameRef = useRef(null);
  
  // Persist interview text and processing state - participant specific
  const getInterviewStorageKey = () => `interview_${participantId}_${actualProjectId}`;
  const getProcessingStorageKey = () => `processing_${participantId}_${actualProjectId}`;
  const getSectionOrderStorageKey = () => `participant_section_order_${actualProjectId || idx}`;

  const orderedSections = normalizeSectionOrder(sectionOrder)
    .map(sectionName => SECTIONS.find(section => section.name === sectionName))
    .filter(Boolean);
  
  const saveInterviewState = (text, isProcessing = false) => {
    try {
      // Only save if text is not empty
      if (text && text.trim() !== '') {
        localStorage.setItem(getInterviewStorageKey(), JSON.stringify({
          text,
          timestamp: Date.now()
        }));
      } else {
        // If text is empty, remove from localStorage
        localStorage.removeItem(getInterviewStorageKey());
      }
      
      if (isProcessing) {
        localStorage.setItem(getProcessingStorageKey(), JSON.stringify({
          isProcessing: true,
          timestamp: Date.now(),
          progress: processingStatus.progress,
          processedCount: processingStatus.processedCount,
          totalQuestions: processingStatus.totalQuestions
        }));
      }
    } catch (error) {
      console.error('Error saving interview state:', error);
    }
  };
  
  const loadInterviewState = () => {
    try {
      const interviewData = localStorage.getItem(getInterviewStorageKey());
      const processingData = localStorage.getItem(getProcessingStorageKey());
      
      if (interviewData) {
        const parsed = JSON.parse(interviewData);
        // Only restore if data is less than 1 hour old AND not empty AND not explicitly cleared
        if (Date.now() - parsed.timestamp < 3600000 && 
            parsed.text && 
            parsed.text.trim() !== '' && 
            parsed.text !== 'CLEARED') {
          setInterviewText(parsed.text);
        }
      }
      
      // Don't restore processing status when switching participants
      // Only restore if we're on the same participant and processing was interrupted
      if (processingData) {
        const parsed = JSON.parse(processingData);
        // Only restore if processing started less than 10 minutes ago AND we're on the same participant
        if (Date.now() - parsed.timestamp < 600000) {
          // Only restore if the processing was for this specific participant
          // This prevents cross-participant contamination
          setProcessingStatus(prev => ({ 
            ...prev, 
            isProcessing: true,
            progress: parsed.progress || 0,
            processedCount: parsed.processedCount || 0,
            totalQuestions: parsed.totalQuestions || 0
          }));
        } else {
          // Clear stale processing state
          localStorage.removeItem(getProcessingStorageKey());
        }
      }
    } catch (error) {
      console.error('Error loading interview state:', error);
    }
  };
  
  // Reset processing status when participant changes
  const resetProcessingStatus = () => {
    setProcessingStatus({
      isProcessing: false,
      progress: 0,
      processedCount: 0,
      totalQuestions: 0,
      startTime: null
    });
    
    // Also clear any stale processing data from localStorage for this participant
    try {
      localStorage.removeItem(getProcessingStorageKey());
    } catch (error) {
      console.error('Error clearing processing state:', error);
    }
  };
  
  const clearInterviewState = () => {
    try {
      localStorage.removeItem(getInterviewStorageKey());
      localStorage.removeItem(getProcessingStorageKey());
    } catch (error) {
      console.error('Error clearing interview state for participant:', error);
    }
  };
  
  const clearInterviewText = () => {
    setInterviewText('');
    // Also clear from localStorage
    try {
      localStorage.removeItem(getInterviewStorageKey());
    } catch (error) {
      console.error('Error clearing interview text:', error);
    }
  };

  // Reference for connection calculation function
  const refreshConnections = useRef(() => {});
  
  // Debounce timer for connection refresh
  const connectionRefreshTimer = useRef(null);
  
  // Function to manually trigger connection refresh with debouncing
  const triggerConnectionRefresh = () => {
    if (connectionRefreshTimer.current) {
      clearTimeout(connectionRefreshTimer.current);
    }
    connectionRefreshTimer.current = setTimeout(() => {
      if (refreshConnections.current) {
        refreshConnections.current();
      }
    }, 300); // Increased debounce to 300ms for better performance
  };

  const saveSectionOrder = (nextOrder) => {
    setSectionOrder(nextOrder);
    try {
      localStorage.setItem(getSectionOrderStorageKey(), JSON.stringify(nextOrder));
    } catch (error) {
      console.error('Error saving participant section order:', error);
    }
  };

  const openSectionOrderModal = () => {
    setDraftSectionOrder(normalizeSectionOrder(sectionOrder));
    setDraggingSectionName(null);
    setDragOverSectionName(null);
    setShowSectionOrderModal(true);
  };

  const handleDraftSectionDrop = (targetSectionName) => {
    const draggedSectionName = draggedSectionNameRef.current;
    draggedSectionNameRef.current = null;
    setDraggingSectionName(null);
    setDragOverSectionName(null);

    if (!draggedSectionName || draggedSectionName === targetSectionName) return;

    const nextOrder = Array.from(normalizeSectionOrder(draftSectionOrder));
    const sourceIndex = nextOrder.indexOf(draggedSectionName);
    const destinationIndex = nextOrder.indexOf(targetSectionName);

    if (sourceIndex === -1 || destinationIndex === -1) return;

    const [movedSection] = nextOrder.splice(sourceIndex, 1);
    nextOrder.splice(destinationIndex, 0, movedSection);
    setDraftSectionOrder(nextOrder);
  };

  const saveDraftSectionOrder = () => {
    saveSectionOrder(normalizeSectionOrder(draftSectionOrder));
    setShowSectionOrderModal(false);
  };

  const buildFactorContext = () => {
    const factorMap = new Map();

    Object.entries(questions || {}).forEach(([sectionName, sectionQuestions]) => {
      (sectionQuestions || []).forEach(question => {
        const questionText = typeof question === 'object' ? question.text : question;
        const factors = typeof question === 'object' ? question.factors : null;

        parseFactors(factors).forEach(factor => {
          if (!factorMap.has(factor)) {
            factorMap.set(factor, {
              factor,
              sections: new Set(),
              questions: new Set()
            });
          }

          factorMap.get(factor).sections.add(sectionName);
          factorMap.get(factor).questions.add(questionText);
        });
      });
    });

    return Array.from(factorMap.values()).map(item => ({
      factor: item.factor,
      sections: Array.from(item.sections),
      questions: Array.from(item.questions)
    }));
  };

  const handleGenerateMofasaSuggestions = async () => {
    if (!interviewText.trim()) {
      setSuggestionError('Please enter interview text first.');
      return;
    }

    const factorContext = buildFactorContext();
    if (factorContext.length === 0) {
      setSuggestionError('No associated factors are available for the current questions.');
      return;
    }

    setIsGeneratingSuggestions(true);
    setSuggestionProgress(5);
    setSuggestionStatus('Finding candidate sentences...');
    setSuggestionError(null);
    setMofasaSuggestions([]);

    try {
      const candidateSuggestions = buildCandidateSuggestions(interviewText, factorContext);

      if (candidateSuggestions.length === 0) {
        setSuggestionError('No candidate sentence-factor matches were found. Try adding more interview detail.');
        setIsGeneratingSuggestions(false);
        setSuggestionProgress(0);
        setSuggestionStatus('');
        return;
      }

      setSuggestionProgress(15);
      setSuggestionStatus('Local LLM is validating candidate factors...');

      const promptCandidates = candidateSuggestions.map(candidate => ({
        id: candidate.id,
        factor: candidate.factor,
        section: candidate.section,
        question: candidate.question,
        factorDescription: candidate.factorDescription,
        factorExamples: candidate.factorExamples,
        sentence: candidate.sentence,
        matchedTerms: candidate.matchedTerms
      }));

      const prompt = `You are helping validate MoFASA factor evidence in a human-robot interaction interview.

Task:
You will receive candidate sentence/factor pairs. Decide which candidates are genuinely relevant.

Instructions:
- Use ONLY the provided candidate ids.
- Keep a candidate only when the sentence provides clear evidence for that exact factor.
- Reject generic keyword coincidences.
- Prefer factors whose description and examples match the sentence meaning.
- Return at most 15 accepted candidates.
- Return ONLY valid JSON, with no markdown.

Candidate sentence/factor pairs:
${JSON.stringify(promptCandidates, null, 2)}

JSON format:
{
  "suggestions": [
    {
      "id": "Candidate id",
      "reason": "Brief reason this sentence is relevant"
    }
  ]
}`;

      const candidateMap = new Map(candidateSuggestions.map(candidate => [candidate.id, candidate]));
      const interviewSentences = splitInterviewIntoSentences(interviewText);
      const normalizedSentenceSet = new Set(interviewSentences.map(normalizeTextForMatch));

      const buildLocalFallbackSuggestions = () => (
        candidateSuggestions.slice(0, 10).map(candidate => ({
          factor: candidate.factor,
          section: candidate.section,
          question: candidate.question,
          sentence: candidate.sentence,
          reason: `Candidate match from terms: ${candidate.matchedTerms.slice(0, 5).join(', ')}`
        }))
      );

      let cleanedSuggestions = [];
      const progressHandler = (_event, data) => {
        setSuggestionProgress(Math.max(10, data.progress || 10));
        setSuggestionStatus(data.progress >= 100 ? 'Parsing suggestions...' : 'Local LLM is analyzing the interview...');
      };

      try {
        window.electronAPI.onGenerationProgress(progressHandler);
        setSuggestionStatus('Local LLM is analyzing the interview...');
        const response = await window.electronAPI.generateWithLlamaStream(prompt);

        setSuggestionProgress(95);
        setSuggestionStatus('Matching highlighted sentences...');
        const parsed = extractJsonObject(response);

        cleanedSuggestions = (parsed.suggestions || [])
          .map(item => {
            const candidate = candidateMap.get(String(item?.id || '').trim());
            if (!candidate) return null;

            return {
              factor: candidate.factor,
              section: candidate.section,
              question: candidate.question,
              sentence: candidate.sentence,
              reason: String(item.reason || '').trim() || `Matched ${candidate.matchedTerms.slice(0, 4).join(', ')}`
            };
          })
          .filter(Boolean)
          .filter(item => normalizedSentenceSet.has(normalizeTextForMatch(item.sentence)))
          .slice(0, 15);
      } catch (llmError) {
        console.warn('MoFASA suggestion LLM validation failed, using local candidates:', llmError);
        cleanedSuggestions = buildLocalFallbackSuggestions();
        setSuggestionError('The LLM validation failed, so showing local candidate matches for review.');
      } finally {
        window.electronAPI.removeGenerationProgressListener(progressHandler);
      }

      if (cleanedSuggestions.length === 0) {
        cleanedSuggestions = buildLocalFallbackSuggestions();
        setSuggestionError('The LLM did not validate strong matches, so showing the best local candidate matches for review.');
      }

      setMofasaSuggestions(cleanedSuggestions);
      setSuggestionProgress(100);
      setSuggestionStatus('Suggestions ready.');
    } catch (error) {
      console.error('Error generating MoFASA suggestions:', error);
      setSuggestionError('Failed to generate MoFASA suggestions. Please check if the LLM is running and try again.');
    } finally {
      setIsGeneratingSuggestions(false);
      setTimeout(() => {
        setSuggestionProgress(0);
        setSuggestionStatus('');
      }, 1200);
    }
  };

  const suggestionsBySentence = mofasaSuggestions.reduce((acc, suggestion) => {
    const key = normalizeTextForMatch(suggestion.sentence);
    if (!acc[key]) acc[key] = [];
    acc[key].push(suggestion);
    return acc;
  }, {});

  const participantForAnalysis = {
    ...participant,
    answers: localAnswers,
    summary
  };
  const acceptedAnalyticTags = getAcceptedTags(participantForAnalysis);
  const analyticTagColors = getTagColors(participantForAnalysis);
  const allUsedAnalyticTags = normalizeTags(
    (project?.scopes || []).flatMap(scope => (
      (scope.participants || []).flatMap(scopeParticipant => getAcceptedTags(scopeParticipant))
    ))
  );

  const saveAnalyticTags = (nextTags) => {
    const normalized = normalizeTags(nextTags);
    const currentColors = localAnswers[ANALYTIC_TAGS_SECTION]?.[ANALYTIC_TAG_COLORS_FIELD] || {};
    const nextTagColors = Object.fromEntries(
      normalized.map(tag => [tag, currentColors[tag] || DEFAULT_TAG_COLOR])
    );
    const nextAnswers = {
      ...localAnswers,
      [ANALYTIC_TAGS_SECTION]: {
        ...localAnswers[ANALYTIC_TAGS_SECTION],
        [ANALYTIC_TAGS_FIELD]: normalized,
        [ANALYTIC_TAG_COLORS_FIELD]: nextTagColors
      }
    };

    setLocalAnswers(nextAnswers);
    setSuggestedAnalyticTags(prev => prev.filter(item => !normalized.includes(item.tag)));
    updateParticipantAnswers(idx, participantId, ANALYTIC_TAGS_SECTION, ANALYTIC_TAGS_FIELD, normalized);

    if (window.electronAPI?.updateParticipantAnswers) {
      window.electronAPI.updateParticipantAnswers(actualProjectId, participantId, nextAnswers)
        .catch(error => console.error('Error saving analytic tags:', error));
    }
  };

  const updateAnalyticTagColor = (tag, colorId) => {
    const participantsWithTag = currentScope?.participants?.filter(scopeParticipant => (
      getAcceptedTags(scopeParticipant).includes(tag)
    )) || [];

    const nextTagColors = {
      ...analyticTagColors,
      [tag]: colorId
    };
    const nextAnswers = {
      ...localAnswers,
      [ANALYTIC_TAGS_SECTION]: {
        ...localAnswers[ANALYTIC_TAGS_SECTION],
        [ANALYTIC_TAGS_FIELD]: acceptedAnalyticTags,
        [ANALYTIC_TAG_COLORS_FIELD]: nextTagColors
      }
    };

    setLocalAnswers(nextAnswers);
    setTagColorModalTag(null);

    participantsWithTag.forEach(scopeParticipant => {
      const existingColors = scopeParticipant.id === participantId
        ? analyticTagColors
        : getTagColors(scopeParticipant);

      updateParticipantAnswers(idx, scopeParticipant.id, ANALYTIC_TAGS_SECTION, ANALYTIC_TAG_COLORS_FIELD, {
        ...existingColors,
        [tag]: colorId
      });
    });

    if (window.electronAPI?.updateParticipantAnswers) {
      Promise.all(participantsWithTag.map(scopeParticipant => {
        const existingColors = scopeParticipant.id === participantId
          ? analyticTagColors
          : getTagColors(scopeParticipant);
        const participantAnswers = scopeParticipant.id === participantId
          ? nextAnswers
          : {
              ...scopeParticipant.answers,
              [ANALYTIC_TAGS_SECTION]: {
                ...scopeParticipant.answers?.[ANALYTIC_TAGS_SECTION],
                [ANALYTIC_TAG_COLORS_FIELD]: {
                  ...existingColors,
                  [tag]: colorId
                }
              }
            };

        return window.electronAPI.updateParticipantAnswers(actualProjectId, scopeParticipant.id, participantAnswers);
      })).catch(error => console.error('Error saving shared analytic tag color:', error));
    }
  };

  const handleSuggestAnalyticTags = () => {
    const participantSummary = {
      ...getParticipantSummary(participantForAnalysis, currentScope),
      summary
    };
    setSuggestedAnalyticTags(suggestTags(participantSummary, acceptedAnalyticTags));
  };

  const acceptSuggestedAnalyticTag = (tag) => {
    saveAnalyticTags([...acceptedAnalyticTags, tag]);
  };

  const addCustomAnalyticTag = () => {
    const tag = customAnalyticTag.trim();
    if (!tag) return;
    saveAnalyticTags([...acceptedAnalyticTags, tag]);
    setCustomAnalyticTag('');
  };
  
  // Function to save current scroll position
  const saveScrollPosition = () => {
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      scrollPositionRef.current = {
        top: rightPanel.scrollTop,
        left: rightPanel.scrollLeft
      };
      shouldRestoreScroll.current = true;
    }
  };
  
  // Function to restore scroll position
  const restoreScrollPosition = () => {
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel && scrollPositionRef.current && shouldRestoreScroll.current) {
      // Only restore if the position has actually changed
      if (rightPanel.scrollTop !== scrollPositionRef.current.top || 
          rightPanel.scrollLeft !== scrollPositionRef.current.left) {
        rightPanel.scrollTop = scrollPositionRef.current.top;
        rightPanel.scrollLeft = scrollPositionRef.current.left;
      }
      shouldRestoreScroll.current = false;
    }
  };
  
  // Debounce timer for answer changes
  const answerChangeTimer = useRef(null);
  // Debounce timer for summary changes
  const summaryChangeTimer = useRef(null);

  // Load questions from database
  useEffect(() => {
    // Reset the loaded flag when project changes
    questionsLoadedRef.current = false;
    
    const loadQuestions = async () => {
      try {
        setQuestionsLoading(true);
        const questionsData = await window.electronAPI.getProjectQuestions(actualProjectId);
        
        // Format them for the component and filter out disabled questions
        const formattedQuestions = {};
        Object.keys(questionsData).forEach(section => {
          formattedQuestions[section] = questionsData[section]
            .filter(q => q.isEnabled) // Only include enabled questions
            .map(q => {
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
        questionsLoadedRef.current = true; // Mark as loaded
      } catch (error) {
        console.error('Error loading questions:', error);
        // Fallback to hardcoded questions if database fails
        console.log('Falling back to hardcoded questions:', QUESTIONS);
        setQuestions(QUESTIONS);
        questionsLoadedRef.current = true; // Mark as loaded even with fallback
      } finally {
        setQuestionsLoading(false);
      }
    };
    
    loadQuestions();
  }, [actualProjectId]);

  // Trigger connection refresh when questions are loaded
  useEffect(() => {
    if (!questionsLoading && questionsLoadedRef.current && Object.keys(questions).length > 0) {
      // Use a longer delay to ensure DOM is fully rendered
      setTimeout(() => {
        triggerConnectionRefresh();
      }, 200);
    }
  }, [questionsLoading, questionsLoadedRef.current, Object.keys(questions).length]);

  useEffect(() => {
    try {
      const storedOrder = localStorage.getItem(getSectionOrderStorageKey());
      setSectionOrder(normalizeSectionOrder(storedOrder ? JSON.parse(storedOrder) : DEFAULT_SECTION_ORDER));
    } catch (error) {
      setSectionOrder(DEFAULT_SECTION_ORDER);
    }
  }, [actualProjectId, idx]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      triggerConnectionRefresh();
    }, 350);

    return () => clearTimeout(timeoutId);
  }, [isFrameworkPanelCollapsed, sectionOrder.join('|')]);

  // Add scroll event listener to continuously save scroll position
  useEffect(() => {
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      const handleScroll = () => {
        saveScrollPosition();
      };
      
      rightPanel.addEventListener('scroll', handleScroll);
      
      return () => {
        rightPanel.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  // Restore scroll position after every render using useLayoutEffect
  useLayoutEffect(() => {
    if (shouldRestoreScroll.current) {
      restoreScrollPosition();
    }
  }, []); // Add empty dependency array to prevent infinite re-renders

  // Add focus event listener to reload questions when returning to the page
  useEffect(() => {
    const handleFocus = async () => {
      // Only reload questions if they haven't been loaded yet
      if (!questionsLoadedRef.current && !questionsLoading && Object.keys(questions).length === 0) {
        try {
          setQuestionsLoading(true);
          const questionsData = await window.electronAPI.getProjectQuestions(actualProjectId);
          
          // Format them for the component and filter out disabled questions
          const formattedQuestions = {};
          Object.keys(questionsData).forEach(section => {
            formattedQuestions[section] = questionsData[section]
              .filter(q => q.isEnabled) // Only include enabled questions
              .map(q => {
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
          questionsLoadedRef.current = true; // Mark as loaded
        } catch (error) {
          console.error('Error reloading questions:', error);
        } finally {
          setQuestionsLoading(false);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [actualProjectId, questionsLoading, questions]); // Add proper dependencies

  // Reset states when participant changes
  useEffect(() => {
    console.log('Participant changed - resetting states:', {
      participantId,
      participantName: participant?.name,
      participantAnswers: participant?.answers
    });
    
    setSummary(participant?.summary || '');
    setError(null);
    setProgress(0);
    
    // Completely reset processing status for new participant
    resetProcessingStatus();
    
    // Always start with empty interview text for new participant
    setInterviewText('');
    
    // Load persisted interview text or use participant's interview text
    const participantInterviewText = participant?.interviewText || '';
    if (participantInterviewText) {
      setInterviewText(participantInterviewText);
    } else {
      // Try to load from localStorage for this specific participant
      loadInterviewState();
    }
    
    // Define Robot Specifics variables outside the conditional block
    const robotSpecificsQuestion = 'What is the type of the robot? What features does it have and what can it do?';
    const robotSpecificsId = 'robot_specifics';
    
    // Only initialize local answers if we're not currently processing
    if (!processingStatus.isProcessing) {
      // Initialize local answers with participant's current answers
      let participantAnswers = participant?.answers || {};
      
      // Check if Robot Specifics answer exists in current scope
      let robotSpecificsAnswer = participantAnswers['Situation']?.[robotSpecificsQuestion] || 
                                participantAnswers['Situation']?.[robotSpecificsId];
      
      // If not found in current scope, search in all other scopes
      if (!robotSpecificsAnswer && project?.scopes) {
        for (const scope of project.scopes) {
          const scopeParticipant = scope.participants?.find(p => p.id === participantId);
          if (scopeParticipant?.answers) {
            const scopeRobotAnswer = scopeParticipant.answers['Situation']?.[robotSpecificsQuestion] || 
                                    scopeParticipant.answers['Situation']?.[robotSpecificsId];
            if (scopeRobotAnswer) {
              robotSpecificsAnswer = scopeRobotAnswer;
              break;
            }
          }
        }
      }
      
      // Update the local answers to include Robot Specifics from any scope
      if (robotSpecificsAnswer) {
        participantAnswers = {
          ...participantAnswers,
          'Situation': {
            ...participantAnswers['Situation'],
            [robotSpecificsQuestion]: robotSpecificsAnswer
          }
        };
      }
      
      // Always load participant data when switching participants
      // This ensures the form shows the correct data for each participant
      setLocalAnswers(participantAnswers);
      
      console.log('Loading participant data:', {
        participantId,
        participantAnswers,
        participantName: participant?.name
      });
      
      // Debug: Check if there are any existing answers that might be overriding
      if (participantAnswers['Situation']) {
        console.log('Existing Situation answers from participant:', participantAnswers['Situation']);
      }
    }
    
    // Ensure selectedRules is always an array
    const participantSelectedRules = participant?.answers?.['Rule Selection']?.selectedRules;
    setSelectedRules(Array.isArray(participantSelectedRules) ? participantSelectedRules : []);
    
    // Initialize sameForAllScopes for Robot Specifics question (always enabled)
    setSameForAllScopes(prev => ({
      ...prev,
      [`${participantId}-Situation-${robotSpecificsQuestion}`]: true,
      [`${participantId}-Situation-${robotSpecificsId}`]: true
    }));
  }, [participantId, participant?.summary, participant?.interviewText, project?.scopes, processingStatus.isProcessing]);

  // Save interview text immediately when participant changes
  useEffect(() => {
    const saveInterviewText = async () => {
      if (participant && interviewText) {
        try {
          await window.electronAPI.updateParticipantInterview(actualProjectId, participantId, interviewText);
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
  }, [participantId]);

  // Save participant data when navigating away or component unmounts
  useEffect(() => {
    return () => {
      if (saveParticipantData && idx !== undefined && participantId) {
        console.log('ParticipantPage: Saving participant data on cleanup');
        saveParticipantData(idx, participantId);
      }
    };
  }, [participantId, saveParticipantData, idx]);

  // Cleanup effect for debounce timer
  useEffect(() => {
    return () => {
      if (answerChangeTimer.current) {
        clearTimeout(answerChangeTimer.current);
      }
      if (summaryChangeTimer.current) {
        clearTimeout(summaryChangeTimer.current);
      }
      if (connectionRefreshTimer.current) {
        clearTimeout(connectionRefreshTimer.current);
      }
    };
  }, []);

  // Debug effect to monitor localAnswers changes
  useEffect(() => {
    console.log('localAnswers changed:', localAnswers);
    if (localAnswers['Situation']) {
      console.log('Situation answers:', localAnswers['Situation']);
    }
  }, [localAnswers]);





  // Navigation window logic
  let start = Math.max(0, currentIndex - 1);
  let end = start + 3;
  if (end > participants.length) {
    end = participants.length;
    start = Math.max(0, end - 3);
  }
  
  // Handle case where currentIndex is -1 (participant not found)
  if (currentIndex === -1) {
    start = 0;
    end = Math.min(3, participants.length);
  }
  
  const visibleParticipants = participants.slice(start, end);

  // Add refs for the visual framework boxes
  const boxRefs = useRef({});
  const getBoxRef = (sectionName) => {
    if (!boxRefs.current[sectionName]) {
      boxRefs.current[sectionName] = React.createRef();
    }
    return boxRefs.current[sectionName];
  };
  const scrollContainerRef = useRef(null);
  const [connections, setConnections] = useState([]);

  // Define the connections structure with side specifications
  const semanticConnectionPairs = [
    { from: SITUATION, to: IDENTITY, fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'A' },
    { from: SITUATION, to: DEFINITION_OF_SITUATION, fromSide: 'right', toSide: 'left', horizontalOffset: 20, label: 'B' },
    { from: IDENTITY, to: DEFINITION_OF_SITUATION, fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'C' },
    { from: IDENTITY, to: RULE_SELECTION, fromSide: 'right', toSide: 'left', horizontalOffset: 30, label: 'D' },
    { from: DEFINITION_OF_SITUATION, to: RULE_SELECTION, fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'E' },
    { from: RULE_SELECTION, to: 'Decision', fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'F' }
  ];

  // Calculate box positions and update connections
  useEffect(() => {
    const calculateConnections = () => {
      const boxes = SECTIONS.reduce((acc, section) => {
        acc[section.name] = getBoxRef(section.name).current?.getBoundingClientRect();
        return acc;
      }, {});
      if (!semanticConnectionPairs.every(pair => boxes[pair.from] && boxes[pair.to])) return [];

      const rightPanel = document.querySelector('.right-panel');
      if (!rightPanel) return [];
      
      const panelRect = rightPanel.getBoundingClientRect();
      const scrollTop = rightPanel.scrollTop;
      
      // Account for the scope header height (60px)
      const headerHeight = 60;
      const adjustedTop = panelRect.top + headerHeight;

      // First, calculate how many connections go to each box side
      const connectionCounts = {};
      semanticConnectionPairs.forEach(pair => {
        const toKey = `${pair.to}-${pair.toSide}`;
        connectionCounts[toKey] = (connectionCounts[toKey] || 0) + 1;
      });

      // Calculate paths with proper spacing and scroll adjustment
      const paths = semanticConnectionPairs.map((pair, index) => {
        const fromBox = boxes[pair.from];
        const toBox = boxes[pair.to];
        
        // Calculate start point with scroll adjustment
        const startX = pair.fromSide === 'right' 
          ? fromBox.left - panelRect.left + fromBox.width 
          : fromBox.left - panelRect.left;
        const startY = fromBox.top - adjustedTop + (fromBox.height * 2/3) + scrollTop; 

        // Calculate end point with proper spacing and scroll adjustment
        const toKey = `${pair.to}-${pair.toSide}`;
        const totalConnections = connectionCounts[toKey];
        const connectionIndex = semanticConnectionPairs
          .filter((p, i) => i < index && p.to === pair.to && p.toSide === pair.toSide)
          .length;

        let endX = pair.toSide === 'left'
          ? toBox.left - panelRect.left
          : toBox.left - panelRect.left + toBox.width;

        // Calculate vertical offset for multiple connections with scroll adjustment
        let endY = toBox.top - adjustedTop + toBox.height / 3 + scrollTop;
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

    // Add scroll event listener to recalculate connections
    const rightPanel = document.querySelector('.right-panel');
    if (rightPanel) {
      let scrollTimeout;
      const handleScroll = () => {
        if (scrollTimeout) {
          clearTimeout(scrollTimeout);
        }
        scrollTimeout = setTimeout(calculateConnections, 10);
      };
      rightPanel.addEventListener('scroll', handleScroll);

      // Use ResizeObserver to detect content changes
      let resizeObserver;
      if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
          calculateConnections();
        });
        resizeObserver.observe(rightPanel);
      }

      // Cleanup function
      return () => {
        rightPanel.removeEventListener('scroll', handleScroll);
        clearTimeout(scrollTimeout);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
      };
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [
    // Only re-run when these specific values change
    participantId, 
    selectedRules, 
    showInterview, 
    showSummary,
    currentScope?.scopeNumber, // Only scope number, not entire scope object
    Object.keys(questions).length, // Only when questions structure changes
    isFrameworkPanelCollapsed
  ]);

  const generateSummary = async () => {
    if (!participant) return;
    
    setIsGenerating(true);
    setError(null);
    setProgress(10);
    
    try {
      // Collect available answers only. Summary generation should work even when
      // some sections are intentionally blank or not yet finished.
      const allAnswers = orderedSections.map(section => {
        if (section.name === 'Rule Selection') {
          return selectedRules.length > 0 ? `Rule Selection:\nSelected rules: ${selectedRules.join(', ')}` : null;
        } else if (section.name === 'Decision') {
          return selectedRules.length > 0 ? `Decision:\nRules for decision making: ${selectedRules.join(', ')}` : null;
        } else {
          const sectionAnswers = questions[section.name]?.map(q => {
            if (typeof q === 'object' && q.type === 'dropdown') {
              const answer = localAnswers[section.name]?.[q.id];
              if (answer) {
                return `${q.text}: ${answer}`;
              }
              return null;
            } else {
              const questionText = typeof q === 'object' ? q.text : q;
              const answer = localAnswers[section.name]?.[questionText];
              if (answer) {
                return `${questionText}: ${answer}`;
              }
              return null;
            }
          }).filter(Boolean) || [];
          
          return sectionAnswers.length > 0 
            ? `${section.name}:\n${sectionAnswers.join('\n')}`
            : null;
        }
      }).filter(Boolean);

      if (allAnswers.length === 0) {
        setError('Add at least one participant answer before generating a summary.');
        return;
      }

      const participantResponses = allAnswers.join('\n\n').slice(0, 5000);
      const fallbackSummary = allAnswers
        .slice(0, 3)
        .map(item => item.replace(/^[^:\n]+:\n/, '').replace(/\s+/g, ' ').trim())
        .filter(Boolean)
        .join(' ');

      const prompt = `Write a concise summary of this human-robot interaction using only the provided participant responses.

Rules:
- Maximum 3 sentences.
- Focus on what happened between the human and robot and how the human responded.
- Do not mention MoFASA factors or analysis.
- Do not add information that is not provided.
- Start directly with the summary.

Participant Responses:
${participantResponses}

Summary:`;
      setProgress(35);
      try {
        const generatedSummary = await window.electronAPI.generateWithLlama(prompt, {
          temperature: 0.2,
          num_predict: 120
        });
        const cleanSummary = generatedSummary
          .replace(/^(summary:|here is.*?:)\s*/i, '')
          .trim();

        setSummary(cleanSummary);
        setProgress(100);
        
        // Update the participant's summary using the new function
        updateParticipantSummary(idx, participantId, cleanSummary);
      } catch (llmError) {
        console.warn('LLM summary generation failed, using local fallback:', llmError);
        const localSummary = fallbackSummary || 'Summary could not be generated from the current responses.';
        setSummary(localSummary);
        updateParticipantSummary(idx, participantId, localSummary);
        setError('The LLM did not respond, so a simple local summary was created. You can edit it before saving.');
      }

    } catch (error) {
      console.error('Failed to generate summary:', error);
      setError('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  };

  // Optimized batch processing function
  const processQuestionsBatch = async (questions, interviewText, config, projectDescription = '') => {
    try {
      // Create a single prompt for all questions to reduce API calls
      const questionsList = questions.map((q, index) => `${index + 1}. ${q}`).join('\n');
      
             const prompt = `You are a data extraction specialist. Extract specific, detailed answers from the interview text.

Interview Text:
${interviewText}

Project Description:
${projectDescription}

Questions to extract (answer each one in order):
${questionsList}

CRITICAL INSTRUCTIONS:
- Extract ONLY the actual information mentioned in the interview text
- Do NOT repeat the questions - provide the actual answers
- Do NOT provide question text, labels, or categories
- For dropdown questions (age, gender), provide ONLY the selected option value (e.g., "25-34", "Male")
- For yes/no questions, provide ONLY the explanation/reasoning, NOT the yes/no part
- Include specific details, examples, and context from the interview
- Keep answers concise but informative (1-3 sentences)
- If information is not provided for a question, respond with: "Information not provided"
- Do NOT provide participant quotes as answers
- Do NOT answer questions that weren't asked

IMPORTANT: Look at the interview text and extract the SPECIFIC details mentioned. Do not repeat the questions - provide the actual answers.

Provide your answers in this exact format:
1. [answer for first question]
2. [answer for second question]
3. [answer for third question]
...`

      const response = await window.electronAPI.generateWithLlama(prompt);
      
      console.log('LLM Batch Response:', response);
      
      // Parse the numbered responses
      const lines = response.split('\n').filter(line => line.trim());
      const answers = [];
      
      for (let i = 0; i < questions.length; i++) {
        const expectedLine = `${i + 1}.`;
        const answerLine = lines.find(line => line.trim().startsWith(expectedLine));
        
        if (answerLine) {
          // Extract the answer part (remove the number and dot)
          let answer = answerLine.substring(answerLine.indexOf('.') + 1).trim();
          
          // Clean up common unwanted prefixes
          const unwantedPrefixes = [
            '[Answer for question ',
            '[Answer: ',
            'Answer: ',
            'Answer for question ',
            'Age-Range: ',
            'Gender: ',
            'Nationality: ',
            'Occupation: ',
            'Education: ',
            'Age range of the participant(s): ',
            'Gender of the participant(s): ',
            'Nationality of the participant(s): ',
            'Occupation of the participant(s): ',
            'Education level of the participant(s): '
          ];
          
          for (const prefix of unwantedPrefixes) {
            if (answer.toLowerCase().startsWith(prefix.toLowerCase())) {
              answer = answer.substring(prefix.length).trim();
            }
          }
          
          // Remove any remaining brackets or labels
          answer = answer.replace(/^\[.*?\]\s*/, '').trim();
          
          answers.push(answer);
        } else {
          answers.push('Information not provided');
        }
      }
      
      return answers;
    } catch (error) {
      console.error('Error processing questions batch with LLM:', error);
      // Fallback to individual processing if batch fails
      const answers = [];
      for (const question of questions) {
        try {
          const answer = await processQuestionWithLLM(question, interviewText, config, project?.description || '');
          answers.push(answer);
        } catch (err) {
          console.error(`Error processing question "${question}":`, err);
          answers.push('Error processing this question');
        }
      }
      return answers;
    }
  };

  const processQuestionWithLLM = async (question, interviewText, config, projectDescription = '') => {
    try {
            const prompt = `You are a data extraction specialist. Extract specific, detailed answers from the interview text.

Question: "${question}"

Interview Text:
${interviewText}

Project Description:
${projectDescription}

CRITICAL INSTRUCTIONS:
- Extract ONLY the actual information mentioned in the interview text
- Do NOT repeat the question - provide the actual answer
- Do NOT provide question text, labels, or categories
- For dropdown questions (age, gender), provide ONLY the selected option value (e.g., "25-34", "Male")
- For yes/no questions, provide ONLY the explanation/reasoning, NOT the yes/no part
- Include specific details, examples, and context from the interview
- Keep answers concise but informative (1-3 sentences)
- If information is not provided, respond with: "Information not provided"
- Do NOT provide participant quotes as answers
- Do NOT answer questions that weren't asked

IMPORTANT: Look at the interview text and extract the SPECIFIC details mentioned. Do not repeat the question - provide the actual answer.

Actual answer from interview:`

      const response = await window.electronAPI.generateWithLlama(prompt);
      
      console.log('LLM Individual Response for question:', question, response);
      
      // Clean up the response to remove any "Answer:" prefixes or explanations
      let cleanedResponse = response.trim();
      
      console.log('Original response:', response);
      console.log('Cleaned response before processing:', cleanedResponse);
      
      // Remove common prefixes that LLM might add
      const prefixesToRemove = [
        'Answer:',
        'The answer is:',
        'Based on the interview:',
        'From the interview:',
        'The participant:',
        'The individual:'
      ];
      
      for (const prefix of prefixesToRemove) {
        if (cleanedResponse.toLowerCase().startsWith(prefix.toLowerCase())) {
          cleanedResponse = cleanedResponse.substring(prefix.length).trim();
        }
      }
      
      // If the response contains multiple lines, take only the last line (usually the actual answer)
      const lines = cleanedResponse.split('\n').filter(line => line.trim());
      console.log('Response lines:', lines);
      
      if (lines.length > 1) {
        // Simply take the last non-empty line as the answer
        cleanedResponse = lines[lines.length - 1].trim();
        console.log('Using last line:', cleanedResponse);
      }
      
      console.log('Final cleaned response:', cleanedResponse);
      return cleanedResponse;
    } catch (error) {
      console.error('Error processing question with LLM:', error);
      throw error;
    }
  };

  const handleProcessInterview = async () => {
    if (!interviewText.trim()) {
      alert('Please enter interview text first.');
      return;
    }

    setIsProcessing(true);
    // Calculate total questions for sections that will be processed
    const sectionsToProcess = ['Situation', 'Identity', 'Definition of Situation'];
    const totalQuestions = Object.entries(questions)
      .filter(([section]) => sectionsToProcess.includes(section))
      .reduce((total, [section, questions]) => total + questions.length, 0);
    
    setProcessingStatus({
      isProcessing: true,
      progress: 0,
      processedCount: 0,
      totalQuestions: totalQuestions,
      startTime: Date.now()
    });
    setError(null);
    
    // Save processing state
    saveInterviewState(interviewText, true);

    try {
      // Process each question in the enabled questions
      const processedAnswers = {};
      let processedCount = 0;
      
      // Only process Situation, Identity, and Definition of Situation sections
      const sectionsToProcess = ['Situation', 'Identity', 'Definition of Situation'];
      
      // Only count questions from sections that will be processed
      const totalQuestions = Object.entries(questions)
        .filter(([section]) => sectionsToProcess.includes(section))
        .reduce((total, [section, questions]) => total + questions.length, 0);
      
      // Process questions in batches for better performance
      const batchSize = extractionConfig.batchSize || 5; // Use configurable batch size
      
      for (const [section, sectionQuestions] of Object.entries(questions)) {
        // Skip sections that shouldn't be processed by LLM
        if (!sectionsToProcess.includes(section)) {
          continue;
        }
        
        processedAnswers[section] = {};
        
        // Extract question texts for batch processing
        const questionTexts = sectionQuestions.map(question => 
          typeof question === 'string' ? question : question.text
        );
        
        // Process questions based on configuration
        // Force individual processing for Situation section to avoid issues
        if (extractionConfig.useBatchProcessing && section !== 'Situation') {
          // Process questions in batches
          for (let i = 0; i < questionTexts.length; i += batchSize) {
            const batch = questionTexts.slice(i, i + batchSize);
            
            try {
              const batchAnswers = await processQuestionsBatch(batch, interviewText, extractionConfig, project?.description || '');
              
              // Store answers with the correct question IDs
              batch.forEach((questionText, batchIndex) => {
                const questionIndex = i + batchIndex;
                const question = sectionQuestions[questionIndex];
                const questionId = typeof question === 'object' && question.type === 'dropdown' ? question.id : questionText;
                
                processedAnswers[section][questionId] = batchAnswers[batchIndex];
                processedCount++;
              });
              
              // Update progress
              const newProgress = (processedCount / totalQuestions) * 100;
              setProgress(newProgress);
              setProcessingStatus(prev => ({
                ...prev,
                progress: newProgress,
                processedCount
              }));
              
            } catch (error) {
              console.error(`Error processing batch for section "${section}":`, error);
              
              // Fallback to individual processing for this batch
              for (let j = 0; j < batch.length; j++) {
                const questionText = batch[j];
                const questionIndex = i + j;
                const question = sectionQuestions[questionIndex];
                const questionId = typeof question === 'object' && question.type === 'dropdown' ? question.id : questionText;
                
                try {
                  const answer = await processQuestionWithLLM(questionText, interviewText, extractionConfig, project?.description || '');
                  processedAnswers[section][questionId] = answer;
                } catch (err) {
                  console.error(`Error processing question "${questionText}":`, err);
                  processedAnswers[section][questionId] = 'Error processing this question';
                }
                
                processedCount++;
                const newProgress = (processedCount / totalQuestions) * 100;
                setProgress(newProgress);
                setProcessingStatus(prev => ({
                  ...prev,
                  progress: newProgress,
                  processedCount
                }));
              }
            }
          }
        } else {
          // Process questions individually (original method)
          for (const question of sectionQuestions) {
            console.log('Processing question object:', question, 'Type:', typeof question);
            const questionText = typeof question === 'string' ? question : question.text;
            const questionId = typeof question === 'object' && question.type === 'dropdown' ? question.id : questionText;
            
            try {
              const answer = await processQuestionWithLLM(questionText, interviewText, extractionConfig, project?.description || '');
              console.log(`Processing question: "${questionText}" with ID: "${questionId}" -> Answer: "${answer}"`);
              processedAnswers[section][questionId] = answer;
              processedCount++;
              
              // Update progress
              const newProgress = (processedCount / totalQuestions) * 100;
              setProgress(newProgress);
              setProcessingStatus(prev => ({
                ...prev,
                progress: newProgress,
                processedCount
              }));
              
            } catch (error) {
              console.error(`Error processing question "${questionText}":`, error);
              processedAnswers[section][questionId] = 'Error processing this question';
              processedCount++;
              const newProgress = (processedCount / totalQuestions) * 100;
              setProgress(newProgress);
              setProcessingStatus(prev => ({
                ...prev,
                progress: newProgress,
                processedCount
              }));
            }
          }
        }
      }

      // Update local answers immediately for better UX
      console.log('Processed answers before setting localAnswers:', processedAnswers);
      setLocalAnswers(prev => {
        const updated = { ...prev };
        Object.entries(processedAnswers).forEach(([section, answers]) => {
          updated[section] = { ...updated[section], ...answers };
        });
        console.log('Setting localAnswers after LLM processing:', updated);
        return updated;
      });

      // Force a re-render by updating the state again after a short delay
      setTimeout(() => {
        setLocalAnswers(current => {
          console.log('Forcing re-render of localAnswers:', current);
          return { ...current };
        });
      }, 200);

      // Save all processed answers to database
      try {
        // For processed interview answers, we need to save them across all scopes
        // to ensure they persist when navigating between scopes
        const updatedScopes = project.scopes.map(scope => {
          const scopeParticipants = scope.participants || [];
          const updatedParticipants = scopeParticipants.map(p => {
            if (p.id === participantId) {
              const updatedAnswers = { ...p.answers };
              
              // Add all processed answers to this participant
              Object.entries(processedAnswers).forEach(([section, answers]) => {
                if (!updatedAnswers[section]) {
                  updatedAnswers[section] = {};
                }
                Object.entries(answers).forEach(([question, answer]) => {
                  updatedAnswers[section][question] = answer;
                });
              });
              
              return {
                ...p,
                answers: updatedAnswers
              };
            }
            return p;
          });
          
          return {
            ...scope,
            participants: updatedParticipants
          };
        });
        
        // Update the project with all scopes using updateProjectRules
        updateProjectRules(idx, updatedScopes);
      } catch (error) {
        console.error('Error saving answers to database:', error);
      }



      setCompletionMessage(`Interview processing completed! ${processedCount} questions processed and saved.`);
      setShowCompletionModal(true);
      setShowInterview(false);
      
      // Delay clearing the processing status to show completion feedback
      setTimeout(() => {
        setProgress(0);
        setProcessingStatus({
          isProcessing: false,
          progress: 0,
          processedCount: 0,
          totalQuestions: 0,
          startTime: null
        });
        clearInterviewState(); // Clear processing state on completion
      }, 2000); // Show completion status for 2 seconds
      
      // Force a final state update to ensure the form displays the processed answers
      setTimeout(() => {
        setLocalAnswers(current => ({ ...current }));
      }, 500);
    } catch (error) {
      console.error('Error processing interview:', error);
      setError('Failed to process interview. Please try again.');
      setProcessingStatus({
        isProcessing: false,
        progress: 0,
        processedCount: 0,
        totalQuestions: 0,
        startTime: null
      });
      clearInterviewState(); // Clear processing state on error
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleConfigChange = (key, value) => {
    setExtractionConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleAddRule = () => {
    if (newRule.trim()) {
      const updatedScopes = project.scopes.map((scope, scopeIndex) => {
        if (scopeIndex === selectedScopeIndex) {
          const updatedScope = { 
            ...scope, 
            rules: [...(scope.rules || []), newRule.trim()] 
          };
          return updatedScope;
        }
        return scope;
      });
      
      updateProjectRules(idx, updatedScopes);
      setNewRule('');
      setShowRuleInput(false);
    }
  };

  const handleDeleteRule = (rule) => {
    setRuleToDelete(rule);
  };

  const confirmDeleteRule = () => {
    if (ruleToDelete) {
      const updatedScopes = project.scopes.map((scope, scopeIndex) =>
        scopeIndex === selectedScopeIndex
          ? { ...scope, rules: (scope.rules || []).filter(r => r !== ruleToDelete) }
          : scope
      );
      updateProjectRules(idx, updatedScopes);
      setSelectedRules(prev => prev.filter(r => r !== ruleToDelete));
      setRuleToDelete(null);
    }
  };

  const handleRuleSelection = (rule) => {
    // Save scroll position before making changes
    saveScrollPosition();
    
    const updatedRules = selectedRules.includes(rule)
      ? selectedRules.filter(r => r !== rule)
      : [...selectedRules, rule];
    
    console.log('Saving selected rules:', {
      rule,
      currentSelectedRules: selectedRules,
      updatedRules,
      participantId
    });
    
    setSelectedRules(updatedRules);
    updateParticipantAnswers(idx, participantId, 'Rule Selection', 'selectedRules', updatedRules);
  };

  const handleFactorClickLocal = (question, factor) => {
    handleFactorClick(question, factor, setSelectedFactor, setShowFactorDetails);
  };

  const handleSameForAllScopesToggle = (section, question) => {
    const questionKey = `${participantId}-${section}-${question}`;
    const newValue = !sameForAllScopes[questionKey];
    
    setSameForAllScopes(prev => ({
      ...prev,
      [questionKey]: newValue
    }));
    
    // If turning on the toggle, apply current answer to all scopes
    if (newValue) {
      const currentAnswer = localAnswers[section]?.[question];
      if (currentAnswer && currentAnswer.trim() !== '') {
        // Update all scopes with the current answer
        const updatedScopes = project.scopes.map(scope => {
          const scopeParticipants = scope.participants || [];
          const updatedParticipants = scopeParticipants.map(p => {
            if (p.id === participantId) {
              return {
                ...p,
                answers: {
                  ...p.answers,
                  [section]: {
                    ...p.answers?.[section],
                    [question]: currentAnswer
                  }
                }
              };
            }
            return p;
          });
          
          return {
            ...scope,
            participants: updatedParticipants
          };
        });
        
        // Update the project with all scopes
        updateProjectRules(idx, updatedScopes);
      }
    }
  };

  const handleConnectionClick = (label) => {
    const connectionInfo = CONNECTION_EXPLANATIONS[label];
    if (connectionInfo) {
      setSelectedConnection(connectionInfo);
      setShowConnectionModal(true);
    }
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
    console.log('handleAnswerChange called:', { section, question, value });
    
    // Save scroll position before making changes
    saveScrollPosition();
    
    // Update local state immediately for responsive UI
    setLocalAnswers(prev => {
      const updated = {
        ...prev,
        [section]: {
          ...prev[section],
          [question]: value
        }
      };
      console.log('Updated localAnswers:', updated);
      return updated;
    });
    
    // Clear any existing timer
    if (answerChangeTimer.current) {
      clearTimeout(answerChangeTimer.current);
    }
    
    // Set a new timer to debounce the database update
    answerChangeTimer.current = setTimeout(() => {
      // Check if this question should apply to all scopes
      const questionKey = `${section}-${question}`;
      const shouldApplyToAllScopes = sameForAllScopes[questionKey];
      
      // Check if this is the Robot Specifics question (always applies to all scopes)
      const isRobotSpecifics = question === 'What is the type of the robot? What features does it have and what can it do?' || 
                               question === 'robot_specifics';
      
      if (isRobotSpecifics || shouldApplyToAllScopes) {
        // Update the answer across all scopes for this participant
        const updatedScopes = project.scopes.map(scope => {
          const scopeParticipants = scope.participants || [];
          const updatedParticipants = scopeParticipants.map(p => {
            if (p.id === participantId) {
              return {
                ...p,
                answers: {
                  ...p.answers,
                  [section]: {
                    ...p.answers?.[section],
                    [question]: value
                  }
                }
              };
            }
            return p;
          });
          
          return {
            ...scope,
            participants: updatedParticipants
          };
        });
        
        // Update the project with all scopes
        updateProjectRules(idx, updatedScopes);
      } else {
        // For other questions, update only the current scope
        updateParticipantAnswers(idx, participantId, section, question, value);
      }
    }, 500); // 500ms delay
  };

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {/* Left Panel */}
      <div className="left-panel" style={{ 
        width: isFrameworkPanelCollapsed ? 'calc(100% - 32px)' : '50%',
        flex: 'none',
        position: 'relative', 
        display: 'flex', 
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden', // Prevent double scrollbars
        borderRight: '1px solid #dcdde1',
        transition: 'width 0.3s ease'
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
              key="back-button"
              onClick={() => navigate(`/projects/${projectId}`, { state: { view: returnView } })}
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
            key="prev-button"
            onClick={() => {
              if (start > 0) navigateToParticipant(participants[start - 1].id);
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
              key={`participant-${p.id}-${i}`}
              onClick={() => navigateToParticipant(p.id)}
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
            key="next-button"
            onClick={() => {
              if (end < participants.length) navigateToParticipant(participants[end].id);
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
          padding: '24px 32px'
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

        {/* Project Title and Scopes */}
        <div style={{ 
          marginBottom: '24px', 
          marginTop: '36px',
          background: '#fff',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          border: '1px solid #e9ecef'
        }}>
          {/* Project Title */}
          <div style={{ marginBottom: '20px' }}>
            <h2 style={{ 
              fontFamily: 'Lexend, sans-serif', 
              fontWeight: 700, 
              fontSize: '1.4em', 
              marginBottom: '8px',
              color: '#2c3e50'
            }}>
              {project.name}
            </h2>
            {project.description && (
              <p style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#7f8c8d',
                margin: 0,
                lineHeight: 1.5
              }}>
                {project.description}
              </p>
            )}
          </div>
          
          
          
          {/* Scope Selection */}
          {project.scopes && project.scopes.length > 0 && (
            <div>
              <h4 style={{ 
                fontFamily: 'Lexend, sans-serif', 
                fontWeight: 600, 
                fontSize: '1.0em', 
                marginBottom: '12px',
                color: '#34495e'
              }}>
                Scopes:
              </h4>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                flexWrap: 'wrap',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                {project.scopes.map((scope, index) => (
                  <button
                    key={`scope-${scope.scopeNumber}-${index}`}
                    onClick={() => {
                      // Update localStorage and navigate to the same participant in the new scope
                      try {
                        localStorage.setItem(`project_${idx}_selected_scope`, index.toString());
                      } catch (error) {
                        console.error('Error saving selected scope:', error);
                      }
                      // Navigate to the same participant in the new scope
                      navigateToParticipant(participantId);
                    }}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: selectedScopeIndex === index ? '#3498db' : '#ecf0f1',
                      color: selectedScopeIndex === index ? '#fff' : '#2c3e50',
                      border: '1px solid',
                      borderColor: selectedScopeIndex === index ? '#3498db' : '#bdc3c7',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: selectedScopeIndex === index ? '600' : '500',
                      fontSize: '0.9em',
                      fontFamily: 'Lexend, sans-serif',
                      transition: 'all 0.2s ease',
                      minWidth: '80px',
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
                  padding: '12px 16px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  border: '1px solid #e9ecef',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em',
                  color: '#495057',
                  lineHeight: 1.4
                }}>
                  {currentScope.scopeText || 'No description provided'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Participant Name */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ 
              fontFamily: 'Lexend, sans-serif', 
              fontWeight: 600, 
              fontSize: '1.2em', 
              marginBottom: '12px',
              color: '#34495e'
            }}>
              Participant: {participant.name}
            </h3>
          </div>

          <div style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{ marginBottom: '12px' }}>
              <h3 style={{
                margin: 0,
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1.1em',
                color: '#2c3e50',
                fontWeight: 700
              }}>
                Analytic Tags
              </h3>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {acceptedAnalyticTags.map(tag => {
                  const tagColor = getTagColorStyle(analyticTagColors[tag]);
                  return (
                  <span
                    key={tag}
                    onClick={() => setTagColorModalTag(tag)}
                    title="Edit tag color"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 10px',
                      borderRadius: '999px',
                      backgroundColor: tagColor.background,
                      color: tagColor.color,
                      border: `1px solid ${tagColor.border}`,
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.86em',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        saveAnalyticTags(acceptedAnalyticTags.filter(item => item !== tag));
                      }}
                      aria-label={`Remove ${tag}`}
                      title={`Remove ${tag}`}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: tagColor.color,
                        cursor: 'pointer',
                        fontWeight: 700,
                        padding: 0
                      }}
                    >
                      x
                    </button>
                  </span>
                  );
                })}
                {acceptedAnalyticTags.length === 0 && (
                  <span style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '0.9em',
                    color: '#7f8c8d'
                  }}>
                    No tags yet.
                  </span>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '14px'
            }}>
              <input
                list="analytic-tag-suggestions"
                value={customAnalyticTag}
                onChange={(e) => setCustomAnalyticTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomAnalyticTag();
                  }
                }}
                placeholder="Add a custom tag..."
                style={{
                  flex: '1 1 220px',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: '1px solid #dcdde1',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em'
                }}
              />
              <datalist id="analytic-tag-suggestions">
                {allUsedAnalyticTags.map(tag => (
                  <option key={tag} value={tag} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={addCustomAnalyticTag}
                style={{
                  padding: '9px 14px',
                  backgroundColor: '#2980b9',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: 600
                }}
              >
                Add Tag
              </button>
              <button
                type="button"
                onClick={handleSuggestAnalyticTags}
                style={{
                  padding: '9px 14px',
                  backgroundColor: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: 600
                }}
              >
                Suggest Tags
              </button>
              <button
                type="button"
                onClick={() => saveAnalyticTags([...acceptedAnalyticTags, ...suggestedAnalyticTags.map(item => item.tag)])}
                disabled={suggestedAnalyticTags.length === 0}
                style={{
                  padding: '9px 14px',
                  backgroundColor: suggestedAnalyticTags.length === 0 ? '#bdc3c7' : '#34495e',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: suggestedAnalyticTags.length === 0 ? 'default' : 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: 600
                }}
              >
                Accept All
              </button>
              <button
                type="button"
                onClick={() => setSuggestedAnalyticTags([])}
                style={{
                  padding: '9px 14px',
                  backgroundColor: '#ecf0f1',
                  color: '#2c3e50',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: 600
                }}
              >
                Clear Suggestions
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {suggestedAnalyticTags.map(suggestion => (
                  <div
                    key={suggestion.tag}
                    title={suggestion.sourceFields?.join(', ') || suggestion.reason}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 8px',
                      borderRadius: '999px',
                      border: '1px dashed #b7d8ef',
                      backgroundColor: '#f8fbfd'
                    }}
                  >
                    <span style={{
                      color: '#2980b9',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.86em',
                      fontWeight: 700
                    }}>
                      {suggestion.tag}
                    </span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => acceptSuggestedAnalyticTag(suggestion.tag)}
                        style={{
                          padding: '3px 7px',
                          backgroundColor: '#27ae60',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.78em',
                          fontWeight: 600
                        }}
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setSuggestedAnalyticTags(prev => prev.filter(item => item.tag !== suggestion.tag))}
                        style={{
                          padding: '3px 7px',
                          backgroundColor: '#ecf0f1',
                          color: '#2c3e50',
                          border: '1px solid #d0d7de',
                          borderRadius: '999px',
                          cursor: 'pointer',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.78em',
                          fontWeight: 600
                        }}
                      >
                        x
                      </button>
                    </div>
                  </div>
                ))}
                {suggestedAnalyticTags.length === 0 && (
                  <div style={{
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '0.9em',
                    color: '#7f8c8d',
                    padding: '10px 0'
                  }}>
                    No suggestions yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MoFASA Sentence Suggestions 
          <div style={{
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e9ecef',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              marginBottom: '14px',
              flexWrap: 'wrap'
            }}>
              <h3 style={{
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1.1em',
                color: '#2c3e50',
                margin: 0,
                fontWeight: 700
              }}>
                Interview Analysis and Suggestions
              </h3>
              <button
                type="button"
                onClick={handleGenerateMofasaSuggestions}
                disabled={isGeneratingSuggestions || !interviewText.trim()}
                style={{
                  padding: '9px 16px',
                  backgroundColor: isGeneratingSuggestions || !interviewText.trim() ? '#bbb' : '#3498db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: isGeneratingSuggestions || !interviewText.trim() ? 'default' : 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.92em',
                  fontWeight: 600
                }}
              >
                {isGeneratingSuggestions ? 'Finding suggestions...' : 'MoFASA suggestions'}
              </button>
            </div>
            <textarea
              value={interviewText}
              onChange={(e) => {
                const newText = e.target.value;
                setInterviewText(newText);
                setMofasaSuggestions([]);
                setSuggestionError(null);
                if (newText.trim() !== '') {
                  saveInterviewState(newText);
                } else {
                  try {
                    localStorage.removeItem(getInterviewStorageKey());
                  } catch (error) {
                    console.error('Error clearing empty interview text:', error);
                  }
                }
              }}
              placeholder="Paste the participant interview text here..."
              style={{
                width: '100%',
                minHeight: '160px',
                padding: '14px',
                borderRadius: '6px',
                border: '1px solid #dcdde1',
                fontSize: '0.95em',
                fontFamily: 'Lexend, sans-serif',
                resize: 'vertical',
                lineHeight: 1.5,
                marginBottom: '14px'
              }}
            />
            {isGeneratingSuggestions && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.86em',
                  color: '#607080'
                }}>
                  <span>{suggestionStatus || 'Analyzing interview...'}</span>
                  <span>{Math.round(suggestionProgress)}%</span>
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '999px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${suggestionProgress}%`,
                    height: '100%',
                    backgroundColor: '#3498db',
                    borderRadius: '999px',
                    transition: 'width 0.25s ease'
                  }} />
                </div>
              </div>
            )}
            {suggestionError && (
              <div style={{
                padding: '10px 12px',
                backgroundColor: '#fff3cd',
                color: '#856404',
                border: '1px solid #ffeaa7',
                borderRadius: '6px',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.9em',
                marginBottom: '14px'
              }}>
                {suggestionError}
              </div>
            )}
            {mofasaSuggestions.length > 0 && (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)',
                gap: '16px'
              }}>
                <div style={{
                  padding: '14px',
                  backgroundColor: '#f8f9fa',
                  borderRadius: '8px',
                  border: '1px solid #e9ecef',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.95em',
                  color: '#2c3e50',
                  lineHeight: 1.7
                }}>
                  {splitInterviewIntoSentences(interviewText).map((sentence, index) => {
                    const sentenceSuggestions = suggestionsBySentence[normalizeTextForMatch(sentence)] || [];
                    const isHighlighted = sentenceSuggestions.length > 0;
                    const factors = Array.from(new Set(sentenceSuggestions.map(item => item.factor))).join(', ');

                    return (
                      <span
                        key={`${sentence}-${index}`}
                        title={factors}
                        style={{
                          backgroundColor: isHighlighted ? '#fff2a8' : 'transparent',
                          borderBottom: isHighlighted ? '2px solid #f1c40f' : 'none',
                          borderRadius: isHighlighted ? '4px' : 0,
                          padding: isHighlighted ? '2px 4px' : 0,
                          marginRight: '4px',
                          transition: 'background-color 0.2s ease'
                        }}
                      >
                        {sentence}{' '}
                      </span>
                    );
                  })}
                </div>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  maxHeight: '360px',
                  overflowY: 'auto'
                }}>
                  {mofasaSuggestions.map((suggestion, index) => (
                    <div
                      key={`${suggestion.factor}-${index}`}
                      style={{
                        padding: '12px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #e0e7ef',
                        borderRadius: '8px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                      }}
                    >
                      <div style={{
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '0.92em',
                        fontWeight: 700,
                        color: '#2c3e50',
                        marginBottom: '6px'
                      }}>
                        {suggestion.factor}
                      </div>
                      <div style={{
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '0.82em',
                        color: '#607080',
                        marginBottom: '8px'
                      }}>
                        {suggestion.section}
                      </div>
                      <div style={{
                        fontFamily: 'Lexend, sans-serif',
                        fontSize: '0.88em',
                        color: '#34495e',
                        lineHeight: 1.45
                      }}>
                        {suggestion.reason || suggestion.sentence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          */}

          {/* EXTRACT DATA FROM INTERVIEW Toggle Switches */}
         {/*
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
            </div> */}

            {/* <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
          </div>*/}

          {/* Interview Text Area */}
          {showInterview && (
            <div style={{ 
              marginBottom: '24px',
              padding: '20px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ 
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1.1em',
                  color: '#2c3e50',
                  marginBottom: '12px',
                  fontWeight: '600'
                }}>
                  📝 Interview Data Extraction (Beta Version)
                </h4>
                {/* <p style={{ 
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em',
                  color: '#7f8c8d',
                  marginBottom: '16px',
                  lineHeight: '1.4'
                }}>
                  Paste the participant's interview text below. The AI will automatically extract answers to all questions based on the interview content.
                </p> */}
                <div style={{
                  padding: '12px 16px',
                  backgroundColor: '#fff3cd',
                  border: '1px solid #ffeaa7',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em',
                  color: '#856404',
                  lineHeight: '1.4'
                }}>
                  <strong>⚠️ Important Disclaimer:</strong> The LLM extraction is an AI-assisted tool and may make mistakes. 
                  Please review all extracted answers carefully and verify their accuracy against the original interview text. 
                  Do not blindly trust the AI-generated responses.
                </div>
                <textarea
                  value={interviewText}
                  onChange={(e) => {
                    const newText = e.target.value;
                    setInterviewText(newText);
                    // Only save if text is not empty
                    if (newText.trim() !== '') {
                      saveInterviewState(newText);
                    } else {
                              // Clear from localStorage if text is empty
        try {
          localStorage.removeItem(getInterviewStorageKey());
        } catch (error) {
          console.error('Error clearing empty interview text:', error);
        }
                    }
                  }}
                  placeholder="Paste the participant's interview text here... The AI will analyze this text and extract answers to all the questions automatically."
                  style={{
                    width: '100%',
                    minHeight: '250px',
                    padding: '16px',
                    borderRadius: '6px',
                    border: '1px solid #dcdde1',
                    fontSize: '0.95em',
                    fontFamily: 'Lexend, sans-serif',
                    resize: 'vertical',
                    marginBottom: '16px',
                    lineHeight: '1.5'
                  }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                  <button
                    onClick={handleProcessInterview}
                    disabled={isProcessing || !interviewText.trim()}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: isProcessing || !interviewText.trim() ? '#bbb' : '#3498db',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: isProcessing || !interviewText.trim() ? 'default' : 'pointer',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.95em',
                      fontWeight: '500',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseOver={(e) => {
                      if (!isProcessing && interviewText.trim()) {
                        e.target.style.backgroundColor = '#2980b9';
                      }
                    }}
                    onMouseOut={(e) => {
                      if (!isProcessing && interviewText.trim()) {
                        e.target.style.backgroundColor = '#3498db';
                      }
                    }}
                  >
                    {isProcessing ? '🤖 Processing Interview...' : '🚀 Process Interview with AI'}
                  </button>

                  {/* Processing Configuration */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px',
                    padding: '8px 12px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '4px',
                    border: '1px solid #e9ecef'
                  }}>
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '6px',
                      fontSize: '0.85em',
                      fontFamily: 'Lexend, sans-serif',
                      color: '#495057'
                    }}>
                      <input
                        type="checkbox"
                        checked={extractionConfig.useBatchProcessing}
                        onChange={(e) => handleConfigChange('useBatchProcessing', e.target.checked)}
                        style={{ margin: 0 }}
                      />
                      Quick Processing
                    </label>
                    
                    {extractionConfig.useBatchProcessing && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ marginLeft: '15px', fontSize: '0.8em', color: '#6c757d' }}>Questions to process at once:</span>
                        <select
                          value={extractionConfig.batchSize}
                          onChange={(e) => handleConfigChange('batchSize', parseInt(e.target.value))}
                          style={{
                            padding: '2px 6px',
                            fontSize: '0.8em',
                            border: '1px solid #ced4da',
                            borderRadius: '3px',
                            fontFamily: 'Lexend, sans-serif'
                          }}
                        >
                          <option value={3}>3</option>
                          <option value={5}>5</option>
                          <option value={7}>7</option>
                          <option value={10}>10</option>
                        </select>
                      </div>
                    )}
                  </div>

                  
                  {/* Show progress when processing */}
                  {(isProcessing || processingStatus.isProcessing) && (
                    <span style={{ 
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.9em',
                      color: '#7f8c8d'
                    }}>
                      Processing {Math.round(isProcessing ? progress : processingStatus.progress)}% complete...
                      {processingStatus.processedCount > 0 && processingStatus.totalQuestions > 0 && (
                        <span style={{ marginLeft: '8px', color: '#3498db' }}>
                          ({processingStatus.processedCount}/{processingStatus.totalQuestions} questions)
                        </span>
                      )}
                    </span>
                  )}
                </div>
                {/* Show progress bar when processing */}
                {(isProcessing || processingStatus.isProcessing) && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{ 
                      width: '100%', 
                      height: '6px', 
                      backgroundColor: '#eee',
                      borderRadius: '3px',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        width: `${isProcessing ? progress : processingStatus.progress}%`,
                        height: '100%',
                        backgroundColor: '#3498db',
                        transition: 'width 0.3s ease',
                        borderRadius: '3px'
                      }} />
                    </div>
                    {processingStatus.isProcessing && !isProcessing && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px 12px',
                        backgroundColor: '#fff3cd',
                        border: '1px solid #ffeaa7',
                        borderRadius: '4px',
                        fontSize: '0.85em',
                        color: '#856404',
                        fontFamily: 'Lexend, sans-serif'
                      }}>
                        ⚠️ Processing was interrupted. The backend may still be processing your interview. 
                        You can continue working while it completes in the background.
                      </div>
                    )}
                  </div>
                )}
                {error && (
                  <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    backgroundColor: '#fee',
                    color: '#e74c3c',
                    borderRadius: '4px',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif'
                  }}>
                    {error}
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Question Sections */}
          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '16px'
          }}>
            <button
              type="button"
              onClick={openSectionOrderModal}
              aria-label="Open section order settings"
              title="Open section order settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 12px',
                border: '1px solid #d0d7de',
                borderRadius: '999px',
                backgroundColor: '#ffffff',
                color: '#2c3e50',
                cursor: 'pointer',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.9em',
                fontWeight: 600,
                boxShadow: '0 2px 6px rgba(0,0,0,0.06)'
              }}
            >
              <span style={{
                position: 'relative',
                width: '34px',
                height: '18px',
                borderRadius: '999px',
                backgroundColor: '#3498db',
                display: 'inline-block'
              }}>
                <span style={{
                  position: 'absolute',
                  top: '3px',
                  right: '3px',
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)'
                }} />
              </span>
              Sort sections
            </button>
          </div>
          <div className="questionnaire-section">
            {orderedSections.map(section => (
              <div
                key={section.name}
                style={{ 
                marginBottom: 32,
                padding: '24px',
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                border: '1px solid #e9ecef'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  marginBottom: 20
                }}>
                  <h3 style={{ 
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1.2em',
                    margin: 0,
                    color: '#2c3e50',
                    padding: '8px 16px',
                    backgroundColor: section.color,
                    borderRadius: '8px',
                    display: 'inline-block',
                    fontWeight: '600'
                  }}>
                    {section.name}
                  </h3>
                </div>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 16,
                  paddingTop: '8px'
                }}>
                  {section.name === 'Rule Selection' ? (
                    <>
                      <div className="rule-selection-section" style={{ 
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
                            key="add-rule"
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
                            key="cancel-rule"
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
                      const isDropdown = question.type === 'dropdown';
                      const questionText = question.text;
                      const questionId = isDropdown ? question.id : question.text;
                      const questionKey = `${participantId}-${section.name}-${questionId}`;
                      const isSameForAllScopes = sameForAllScopes[questionKey];
                      
                      // Define questions that should not have the toggle
                      const excludedQuestions = [
                        'Age range of the participant(s)',
                        'Gender of the participant(s)',
                        'Nationality of the participant(s)',
                        'Occupation of the participant(s)',
                        'Education level of the participant(s)',
                        'What is the type of the robot? What features does it have and what can it do?'
                      ];
                      
                      const shouldShowToggle = !excludedQuestions.includes(questionText);
                      
                      return (
                        <div key={`${section.name}-${questionId}`} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div style={{ 
                            display: 'flex', 
                            justifyContent: shouldShowToggle ? 'space-between' : 'flex-start', 
                            alignItems: 'flex-start',
                            gap: '12px'
                          }}>
                            <label style={{ 
                              fontFamily: 'Lexend, sans-serif',
                              fontSize: '0.95em',
                              color: '#34495e',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '8px',
                              flex: shouldShowToggle ? 1 : 'none'
                            }}>
                              <span>{questionText}</span>
                              {question.factors && (
                                <div style={{ 
                                  display: 'flex', 
                                  flexWrap: 'wrap', 
                                  gap: '4px',
                                  marginTop: '4px'
                                }}>
                                  {parseFactors(question.factors).map((factor, index) => (
                                    <span 
                                      key={index}
                                      onClick={() => handleFactorClickLocal(question, factor)}
                                      className="factor-button"
                                      style={{
                                        fontSize: '0.8em',
                                        color: '#000000',
                                        background: '#cceeff',
                                        borderRadius: '8px',
                                        padding: '2px 8px',
                                        fontWeight: 400,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                      }}
                                      onMouseOver={(e) => {
                                        e.target.style.background = '#99ddff';
                                      }}
                                      onMouseOut={(e) => {
                                        e.target.style.background = '#cceeff';
                                      }}
                                    >
                                      {factor}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </label>
                            
                            {/* Same for all scopes toggle - only show for non-excluded questions */}
                            {shouldShowToggle && (
                              <div style={{ 
                                position: 'relative',
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '6px',
                                minWidth: 'fit-content'
                              }}>
                                <label style={{ 
                                  position: 'relative',
                                  display: 'inline-block',
                                  width: '36px',
                                  height: '20px',
                                  cursor: 'pointer'
                                }}
                                // title="Same for all scopes"
                                onMouseEnter={(e) => {
                                  // Create tooltip
                                  const tooltip = document.createElement('div');
                                  tooltip.textContent = 'Same for all scopes';
                                  tooltip.style.cssText = `
                                    position: absolute;
                                    background: rgba(0, 0, 0, 0.8);
                                    color: white;
                                    padding: 6px 10px;
                                    border-radius: 4px;
                                    font-size: 12px;
                                    font-family: 'Lexend, sans-serif';
                                    white-space: nowrap;
                                    z-index: 1000;
                                    pointer-events: none;
                                    top: -30px;
                                    left: 50%;
                                    transform: translateX(-50%);
                                    opacity: 0;
                                    transition: opacity 0.2s ease;
                                  `;
                                  tooltip.id = 'toggle-tooltip';
                                  e.currentTarget.appendChild(tooltip);
                                  setTimeout(() => tooltip.style.opacity = '1', 10);
                                }}
                                onMouseLeave={(e) => {
                                  const tooltip = e.currentTarget.querySelector('#toggle-tooltip');
                                  if (tooltip) {
                                    tooltip.remove();
                                  }
                                }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSameForAllScopes}
                                    onChange={() => handleSameForAllScopesToggle(section.name, questionId)}
                                    style={{ opacity: 0, width: 0, height: 0 }}
                                  />
                                  <span style={{
                                    position: 'absolute',
                                    cursor: 'pointer',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: isSameForAllScopes ? '#3498db' : '#ccc',
                                    transition: '.4s',
                                    borderRadius: '20px'
                                  }}>
                                    <span style={{
                                      position: 'absolute',
                                      content: '""',
                                      height: '14px',
                                      width: '14px',
                                      left: '3px',
                                      bottom: '3px',
                                      backgroundColor: 'white',
                                      transition: '.4s',
                                      borderRadius: '50%',
                                      transform: isSameForAllScopes ? 'translateX(16px)' : 'translateX(0)'
                                    }} />
                                  </span>
                                </label>
                              </div>
                            )}
                          </div>
                          
                          {isDropdown ? (
                            <select
                              value={localAnswers[section.name]?.[questionId] || ''}
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
                              value={localAnswers[section.name]?.[questionId] || ''}
                              onChange={(e) => handleAnswerChange(section.name, questionId, e.target.value)}
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

          {/* Generate Summary Section */}
          <div className="summary-section" style={{ marginBottom: 32 }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              marginBottom: '16px'
            }}>
              <label style={{ 
                position: 'relative',
                display: 'inline-block',
                width: '50px',
                height: '24px'
              }}>
                <input
                  type="checkbox"
                  checked={showSummary}
                  onChange={() => setShowSummary(!showSummary)}
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
              <h3 style={{ 
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1.1em',
                margin: 0,
                color: '#2c3e50'
              }}>
                Write/Generate a Summary
              </h3>
            </div>
            
            {showSummary && (
              <div style={{ 
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ marginBottom: '16px' }}>
                  <textarea
                    value={summary}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setSummary(newValue);
                      
                      // Clear any existing timer
                      if (summaryChangeTimer.current) {
                        clearTimeout(summaryChangeTimer.current);
                      }
                      
                      // Set a new timer to debounce the database update
                      summaryChangeTimer.current = setTimeout(() => {
                        updateParticipantSummary(idx, participantId, newValue);
                      }, 500); // 500ms delay
                    }}
                    placeholder="Participant Summary..."
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
                    className="generate-summary-button"
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
                    {isGenerating ? 'Generating...' : 'Generate Summary using LLM'}
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
          </div>
        </div>
      </div>

      {/* Right Panel: Visual Answers */}
      <div 
        className="right-panel framework-panel" 
        ref={scrollContainerRef}
        style={{ 
          width: isFrameworkPanelCollapsed ? '32px' : '50%',
          flex: 'none',
          background: 'linear-gradient(180deg,rgb(55, 70, 83) 0%, #232b32 100%)', 
          overflowY: isFrameworkPanelCollapsed ? 'hidden' : 'auto',
          overflowX: 'hidden',
          position: 'relative',
          transition: 'width 0.3s ease'
        }}
      >
        <button
          type="button"
          onClick={() => setIsFrameworkPanelCollapsed(prev => !prev)}
          aria-label={isFrameworkPanelCollapsed ? 'Open framework panel' : 'Hide framework panel'}
          title={isFrameworkPanelCollapsed ? 'Open framework panel' : 'Hide framework panel'}
          style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            transform: 'translateY(-50%)',
            zIndex: 500,
            width: '24px',
            height: '48px',
            marginLeft: '4px',
            border: '1px solid rgba(255, 255, 255, 0.28)',
            borderRadius: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.94)',
            color: '#2c3e50',
            cursor: 'pointer',
            fontFamily: 'Lexend, sans-serif',
            fontSize: '1.1em',
            fontWeight: 700,
            lineHeight: 1,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
            transition: 'background-color 0.2s ease, transform 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#ffffff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.94)';
          }}
        >
          {isFrameworkPanelCollapsed ? '\u2039' : '\u203a'}
        </button>
        <div style={{
          minWidth: 'min(50vw, calc(100vw - 294px))',
          transform: isFrameworkPanelCollapsed ? 'translateX(100%)' : 'translateX(0)',
          opacity: isFrameworkPanelCollapsed ? 0 : 1,
          pointerEvents: isFrameworkPanelCollapsed ? 'none' : 'auto',
          transition: 'transform 0.3s ease, opacity 0.2s ease'
        }}>
        {/* Current Scope Header - now scrollable */}
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
        
        {/* SVG Container for Lines - positioned relative to content */}
        <svg 
          style={{ 
            position: 'absolute',
            top: currentScope ? '60px' : '0',
            left: 0,
            right: '16px', // Leave space for scrollbar
            height: 'calc(100% - 60px)',
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
          
          {connections.map((connection, index) => {
            // Calculate the middle point of the actual path
            const pair = semanticConnectionPairs[index];
            const startX = connection.startPoint.x;
            const startY = connection.startPoint.y;
            const endX = connection.endPoint.x;
            const endY = connection.endPoint.y;
            const horizontalOffset = pair?.horizontalOffset || 30;
            
            // Calculate the middle point based on the actual path structure
            let midX, midY;
            
            if (Math.abs(startY - endY) > 20) {
              // For paths with vertical segments
                              if (pair?.fromSide === pair?.toSide) {
                  // Same side connection - label at middle of vertical segment
                  midX = pair?.fromSide === 'right' ? startX + horizontalOffset : startX - horizontalOffset;
                  midY = (startY + endY) / 2;
                              } else {
                  // Different side connection - complex path with multiple segments
                  // Place label at the middle of the horizontal segment in the middle
                  const firstHorizontalX = pair?.fromSide === 'right' ? startX + horizontalOffset : startX - horizontalOffset;
                  const secondHorizontalX = pair?.fromSide === 'right' ? firstHorizontalX + horizontalOffset : firstHorizontalX - horizontalOffset;
                  midX = (firstHorizontalX + secondHorizontalX) / 2;
                  
                  // Adjust label position based on connection direction
                  if (pair?.toSide === 'right') {
                    midX -= 12; // Move right-side labels further right
                  } else {
                    midX += 12; // Move left-side labels further left
                  }
                  
                  midY = (startY + endY) / 2;
                }
            } else {
              // For mostly horizontal paths
              midX = (startX + endX) / 2;
              midY = startY; // Use startY since the path is mostly horizontal
            }
            
            const label = pair?.label || '';
            
            return (
              <g key={index}>
                {/* Connection line */}
                <path
                  d={connection.path}
                  stroke="url(#lineGradient)"
                  strokeWidth="1"
                  fill="none"
                  opacity="2"
                  markerEnd="url(#arrowhead)"
                  style={{ pointerEvents: 'none' }}
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
                  style={{ pointerEvents: 'none' }}
                />
                
                {/* Label in the middle of the line */}
                {label && (
                  <g 
                    style={{ pointerEvents: 'auto' }}
                    onMouseEnter={(e) => {
                      const group = e.currentTarget;
                      const circle = group.querySelector('circle');
                      const text = group.querySelector('text');
                      if (circle) {
                        circle.setAttribute('fill', 'rgba(52, 152, 219, 0.9)');
                        circle.setAttribute('stroke', 'rgba(52, 152, 219, 1)');
                      }
                      if (text) {
                        text.setAttribute('fill', '#fff');
                      }
                    }}
                    onMouseLeave={(e) => {
                      const group = e.currentTarget;
                      const circle = group.querySelector('circle');
                      const text = group.querySelector('text');
                      if (circle) {
                        circle.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
                        circle.setAttribute('stroke', 'rgba(52, 152, 219, 0.8)');
                      }
                      if (text) {
                        text.setAttribute('fill', '#2c3e50');
                      }
                    }}
                  >
                    {/* Background circle for label */}
                    <circle
                      cx={midX}
                      cy={midY}
                      r="12"
                      fill="rgba(255, 255, 255, 0.9)"
                      stroke="rgba(52, 152, 219, 0.8)"
                      strokeWidth="1"
                      filter="url(#dotGlow)"
                      style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.2s ease' }}
                      onClick={() => handleConnectionClick(label)}
                    />
                    {/* Label text */}
                    <text
                      x={midX}
                      y={midY}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="12"
                      fontWeight="600"
                      fontFamily="Lexend, sans-serif"
                      fill="#2c3e50"
                      style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.2s ease' }}
                      onClick={() => handleConnectionClick(label)}
                    >
                      {label}
                    </text>
                  </g>
                )}
                
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
            );
          })}
        </svg>

        {/* Boxes Container */}
        <div style={{ 
          padding: '32px 16px 32px 0', // Add right padding to account for scrollbar
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
          zIndex: 1
        }}
        >
        {SECTIONS.map((section) => (
          <div
            key={section.name}
              ref={getBoxRef(section.name)}
            style={{
              width: 'clamp(420px, calc(17vw + 200px), 720px)',
              maxWidth: '720px',
              minWidth: '420px',
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
                        style={{
                          padding: '8px 12px',
                          backgroundColor: selectedRules.includes(rule) ? '#3498db' : '#f8f9fa',
                          color: selectedRules.includes(rule) ? '#fff' : '#2c3e50',
                          borderRadius: '4px',
                          cursor: 'default',
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
                    const isDropdown = question.type === 'dropdown';
                    const questionId = isDropdown ? question.id : question.text;
                    const answer = localAnswers[section.name]?.[questionId];
                    const factors = question.factors;
                    return answer ? (
                      <div key={questionId} style={{ marginBottom: 12 }}>
                        <span style={{ fontWeight: 400 }}>{answer}</span>
                        {factors && (
                          <div style={{ 
                            display: 'flex', 
                            flexWrap: 'wrap', 
                            gap: '4px', 
                            marginLeft: '6px',
                            marginTop: '8px' // Add space between answer and factors
                          }}>
                            {parseFactors(question.factors).map((factor, index) => (
                              <span 
                                key={index}
                                onClick={() => handleFactorClickLocal(question, factor)}
                                style={{
                                  fontSize: '0.8em',
                                  color: '#000000',
                                  background: '#cceeff',
                                  borderRadius: '8px',
                                  padding: '2px 8px',
                                  fontWeight: 400,
                                  cursor: 'pointer',
                                  transition: 'all 0.2s ease'
                                }}
                                onMouseOver={(e) => {
                                  e.target.style.background = '#99ddff';
                                }}
                                onMouseOut={(e) => {
                                  e.target.style.background = '#cceeff';
                                }}
                              >
                                {factor}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : null;
                  }) || []
                )}
              </div>
            </div>
          ))}
          </div>
      </div>
      </div>

      {/* Section Order Modal */}
      {showSectionOrderModal && (
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
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            width: '460px',
            maxWidth: '92%',
            padding: '24px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.28)'
          }}>
            <h3 style={{
              marginBottom: '8px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.25em',
              color: '#2c3e50',
              fontWeight: 700
            }}>
              Sort Sections
            </h3>
            <p style={{
              marginBottom: '18px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '0.92em',
              color: '#607080',
              lineHeight: 1.5
            }}>
              Drag section names into the order you want, then save.
            </p>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginBottom: '24px'
            }}>
              {normalizeSectionOrder(draftSectionOrder).map((sectionName, index) => {
                const section = SECTIONS.find(item => item.name === sectionName);
                const isDragging = draggingSectionName === sectionName;
                const isDragTarget = dragOverSectionName === sectionName && draggingSectionName !== sectionName;

                return (
                  <div
                    key={sectionName}
                    draggable
                    onDragStart={(e) => {
                      draggedSectionNameRef.current = sectionName;
                      setDraggingSectionName(sectionName);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', sectionName);
                    }}
                    onDragEnter={() => setDragOverSectionName(sectionName)}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={() => handleDraftSectionDrop(sectionName)}
                    onDragEnd={() => {
                      draggedSectionNameRef.current = null;
                      setDraggingSectionName(null);
                      setDragOverSectionName(null);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px 14px',
                      borderRadius: '8px',
                      border: isDragTarget ? '2px solid #3498db' : '1px solid #dce3ea',
                      backgroundColor: section?.color || '#f8f9fa',
                      color: '#2c3e50',
                      cursor: isDragging ? 'grabbing' : 'grab',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.98em',
                      fontWeight: 600,
                      opacity: isDragging ? 0.45 : 1,
                      transform: isDragging ? 'scale(0.98)' : isDragTarget ? 'translateY(2px) scale(1.02)' : 'scale(1)',
                      boxShadow: isDragging
                        ? '0 12px 24px rgba(52, 152, 219, 0.28)'
                        : isDragTarget
                          ? '0 8px 20px rgba(52, 152, 219, 0.18)'
                          : '0 2px 8px rgba(0, 0, 0, 0.05)',
                      transition: 'transform 0.18s ease, opacity 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease'
                    }}
                  >
                    <span style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: 'rgba(255, 255, 255, 0.75)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#617182',
                      fontSize: '0.85em',
                      flex: '0 0 auto'
                    }}>
                      {index + 1}
                    </span>
                    <span style={{ flex: 1 }}>{sectionName}</span>
                    <span style={{
                      color: '#7b8a99',
                      letterSpacing: '1px',
                      fontWeight: 700
                    }}>
                      {'\u2630'}
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px'
            }}>
              <button
                type="button"
                onClick={() => setShowSectionOrderModal(false)}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#ecf0f1',
                  color: '#2c3e50',
                  border: '1px solid #d0d7de',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveDraftSectionOrder}
                style={{
                  padding: '9px 16px',
                  backgroundColor: '#3498db',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontWeight: 600
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

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
                key="cancel-delete"
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
                key="confirm-delete"
                onClick={confirmDeleteRule}
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

      {/* Connection Details Modal */}
      {showConnectionModal && selectedConnection && (
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
            padding: '32px',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ 
              marginBottom: '20px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.3em',
              color: '#2c3e50',
              fontWeight: '600'
            }}>
              {selectedConnection.title}
            </h3>
            <p style={{ 
              marginBottom: '24px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.1em',
              color: '#34495e',
              lineHeight: '1.6'
            }}>
              {selectedConnection.explanation}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConnectionModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1em',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#2980b9';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#3498db';
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Factor Details Modal */}
      {showFactorDetails && selectedFactor && (
        <FactorDetailsModal
          isOpen={showFactorDetails}
          onClose={() => setShowFactorDetails(false)}
          factorDetails={selectedFactor}
        />
      )}

      {/* Completion Modal */}
      {showCompletionModal && (
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
            padding: '32px',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '48px',
              marginBottom: '16px'
            }}>
              ✅
            </div>
            <h3 style={{ 
              marginBottom: '16px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.3em',
              color: '#2c3e50',
              fontWeight: '600'
            }}>
              Processing Complete!
            </h3>
            <p style={{ 
              marginBottom: '24px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.1em',
              color: '#34495e',
              lineHeight: '1.5'
            }}>
              {completionMessage}
            </p>
            <button
              onClick={() => setShowCompletionModal(false)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '1em',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#2980b9';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = '#3498db';
              }}
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {tagColorModalTag && (
        <div
          onClick={() => setTagColorModalTag(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1100
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              width: '360px',
              maxWidth: '90%',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
              fontFamily: 'Lexend, sans-serif'
            }}
          >
            <h3 style={{ margin: '0 0 14px 0', color: '#2c3e50', fontSize: '1.05em' }}>
              Tag Color
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                ...getTagColorStyle(analyticTagColors[tagColorModalTag]),
                display: 'inline-flex',
                padding: '6px 10px',
                borderRadius: '999px',
                border: `1px solid ${getTagColorStyle(analyticTagColors[tagColorModalTag]).border}`,
                fontWeight: 700,
                fontSize: '0.9em'
              }}>
                {tagColorModalTag}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '16px' }}>
              {TAG_COLOR_OPTIONS.map(option => (
                <button
                  type="button"
                  key={option.id}
                  onClick={() => updateAnalyticTagColor(tagColorModalTag, option.id)}
                  style={{
                    padding: '10px 8px',
                    borderRadius: '8px',
                    border: analyticTagColors[tagColorModalTag] === option.id ? `2px solid ${option.color}` : `1px solid ${option.border}`,
                    background: option.background,
                    color: option.color,
                    cursor: 'pointer',
                    fontFamily: 'Lexend, sans-serif',
                    fontWeight: 700
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTagColorModalTag(null)}
              style={{
                width: '100%',
                padding: '9px 12px',
                border: '1px solid #d0d7de',
                borderRadius: '6px',
                background: '#fff',
                color: '#2c3e50',
                cursor: 'pointer',
                fontFamily: 'Lexend, sans-serif',
                fontWeight: 600
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ParticipantPage; 
