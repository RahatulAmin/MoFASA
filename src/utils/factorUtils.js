// Single source of truth for all factors
// Edit the factors below and they will be immediately reflected in the app

const FACTORS = {
  'Time': {
    factor: 'Time',
    description: 'Temporal characteristics of the interaction, including time of day, duration, and urgency.',
    examples: [
      'Interacting during a busy afternoon may lead to rushed decisions.',
      'Late evening users may expect less social interaction.',
      'Short interactions might feel transactional rather than relational.'
    ],
    relatedFactors: ['Context', 'Emotional State'],
    //researchNotes: 'Time influences social expectations and behavioral patterns in HRI, including perceived urgency or appropriateness.',
    section: 'Situation'
  },
  'Place': {
    factor: 'Place',
    description: 'The physical and institutional setting where the interaction occurs.',
    examples: [
      'A library imposes norms around quietness and focus.',
      'Interactions in public spaces may heighten social visibility.',
      'Private spaces may allow more relaxed or candid interactions.'
    ],
    relatedFactors: ['Standards of Customary Practices', 'Participants', 'Power and Status'],
    //researchNotes: 'Physical location shapes norms and interpretations of robot behavior.',
    section: 'Situation'
  },
  'Participants': {
    factor: 'Participants',
    description: 'Who is present and how their presence shapes social dynamics.',
    examples: [
      'A parent with children may be distracted or protective.',
      'Being alone may lead to more relaxed or exploratory interaction.',
      'Observers may affect someone\'s behavior.'
    ],
    relatedFactors: ['Group Size', 'Role Identities', 'Social Motive'],
    //researchNotes: 'Social presence influences interaction dynamics and decision-making.',
    section: 'Situation'
  },
  'Group Size': {
    factor: 'Group Size',
    description: 'Number of people involved or observing the interaction.',
    examples: [
      'Individual interactions may allow for more personal responses',
      'Groups may lead to conformity or peer pressure',
      'Crowds can create ambiguity in target recognition or shared responsibility.'
    ],
    relatedFactors: ['Participants', 'Power and Status'],
    //researchNotes: 'Group size affects individual behavior and willingness to engage with robots.',
    section: 'Situation'
  },
  'Role Identities': {
    factor: 'Role Identities',
    description: 'The social or professional roles individuals perceive themselves to occupy during the interaction.',
    examples: [
      'Professional roles feel responsible for modeling formal behavior',
      'Caregiver roles may emphasize protective responses',
      'Student roles may encourage learning behavior'
    ],
    relatedFactors: ['Occupation', 'Social Motive', 'Standards of Customary Practices'],
    //researchNotes: 'Role identities shape expectations and appropriate behavior patterns.',
    section: 'Identity'
  },
  'Age-Range': {
    factor: 'Age-Range',
    description: 'The age group of the participant.',
    examples: [
      'Younger participants may be more tech-savvy.',
      'Older adults may prefer traditional interactions.',
      'Age may affect comfort level with new technology.'
    ],
    relatedFactors: ['Personal History', 'Social Motive', 'Standards of Customary Practices'],
    //researchNotes: 'Age influences comfort level and expectations with technology.',
    section: 'Identity'
  },
  'Gender': {
    factor: 'Gender',
    description: 'The gender identity of the participant and how it influences interaction style.',
    examples: [
      'Gender may affect communication preferences',
      'Different comfort levels with technology',
      'Varying expectations for robot behavior'
    ],
    relatedFactors: ['Age-Range', 'Social Motive', 'Standards of Customary Practices'],
    //researchNotes: 'Gender can influence interaction patterns and technology acceptance.',
    section: 'Identity'
  },
  'Nationality': {
    factor: 'Nationality',
    description: 'Cultural background and national origin that shapes interaction expectations.',
    examples: [
      'Cultural norms vary by country',
      'Language influences interaction style',
      'Different attitudes toward technology and authority'
    ],
    relatedFactors: ['Social Motive', 'Standards of Customary Practices'],
    //researchNotes: 'National culture affects social norms and technology interactions.',
    section: 'Identity'
  },
  'Occupation': {
    factor: 'Occupation',
    description: 'Professional background that influences interaction approach and expectations.',
    examples: [
      'Engineers may be more analytical.',
      'Teachers may be more patient.',
      'Healthcare workers may focus on safety.'
    ],
    relatedFactors: ['Personal History', 'Social Motive', 'Standards of Customary Practices'],
    //researchNotes: 'Professional experience shapes how people approach new technology.',
    section: 'Identity'
  },
  'Background': {
    factor: 'Background',
    description: 'Educational, cultural, and personal background that influences behavior.',
    examples: [
      'Higher education may increase technology acceptance.',
      'Cultural background affects interaction norms.',
      'Previous experiences shape expectations.'
    ],
    relatedFactors: ['Personal History', 'Social Motive', 'Standards of Customary Practices'],
    //researchNotes: 'Personal background significantly influences technology adoption and interaction patterns.',
    section: 'Identity'
  },
  'Social Motive': {
    factor: 'Social Motive',
    description: 'The participant\'s underlying reason or goal for engaging (or not engaging) with the robot.',
    examples: [
      'Seeking help vs. exploring out of curiosity.',
      'Avoiding interaction to stay on task.',
      'Engaging to test or challenge the robot\'s capabilities.'
    ],
    relatedFactors: ['Role Identities', 'Context'],
    //researchNotes: 'Understanding social motives helps predict interaction outcomes and satisfaction.',
    section: 'Identity'
  },
  'Intention': {
    factor: 'Intention',
    description: 'The purpose or goal that the interacting agents aim to achieve.',
    examples: [
      'The robot intends to provide assistance.',
      'The participant intends to learn about the robot.',
      'Both parties intend to complete a task efficiently.'
    ],
    relatedFactors: ['Social Motive', 'Context', 'Role Identities'],
    //researchNotes: 'Understanding intentions helps predict behavior and interaction outcomes.',
    section: 'Situation'
  },
  'Personal History': {
    factor: 'Personal History',
    description: 'Previous experience with robots or similar technology.',
    examples: [
      'First-time users may be more cautious.',
      'Experienced users may have higher expectations.',
      'Negative past experiences may create resistance.'
    ],
    relatedFactors: ['Individual Specifics', 'Social Motive'],
    //researchNotes: 'Prior experience significantly affects comfort level and interaction patterns.',
    section: 'Identity'
  },
  'Individual Specifics': {
    factor: 'Individual Specifics',
    description: 'Personal characteristics and preferences that affect interaction.',
    examples: [
      'Personality traits influence openness to robots.',
      'Personal preferences affect interaction style.',
      'Individual needs shape expectations.'
    ],
    relatedFactors: ['Personal History', 'Social Motive', 'Standards of Customary Practices', 'Expectations'],
    //researchNotes: 'Individual differences are crucial for personalizing robot interactions.',
    section: 'Identity'
  },
  'Uncertainty': {
    factor: 'Uncertainty',
    description: 'The level of uncertainty about the situation or robot capabilities.',
    examples: [
      'Unclear robot capabilities may create hesitation.',
      'Ambiguous situations may require more guidance.',
      'Uncertainty may affect trust and engagement.'
    ],
    relatedFactors: ['Context', 'Personal History', 'Framing', 'Causes', 'Expectations'],
    //researchNotes: 'Reducing uncertainty improves interaction quality and user satisfaction.',
    section: 'Definition of Situation'
  },
  'Consequences': {
    factor: 'Consequences',
    description: 'Perceived or actual consequences of actions in the interaction.',
    examples: [
      'High-stakes situations may increase caution.',
      'Low-risk environments may encourage exploration.',
      'Understanding consequences may affect decision-making.'
    ],
    relatedFactors: ['Context', 'Power and Status'],
    //researchNotes: 'Consequence awareness shapes risk-taking behavior and interaction depth.',
    section: 'Definition of Situation'
  },

  'Context': {
    factor: 'Context',
    description: 'The broader situational context that frames the interaction.',
    examples: [
      'This is a formal help interaction.',
      'This is part of a tech demo.',
      'This is a social interaction.',
    ],
    relatedFactors: ['Place', 'Time', 'Participants', 'Framing', 'Causes'],
    //researchNotes: 'Context provides the framework for interpreting and responding to robot behavior.',
    section: 'Definition of Situation'
  },
  'Power and Status': {
    factor: 'Power and Status',
    description: 'Perceived authority or control in the interaction.',
    examples: [
      'Authority figures may expect compliance.',
      'Equal relationships encourage collaboration.',
      'Power imbalances may affect communication patterns.'
    ],
    relatedFactors: ['Role Identities', 'Context'],
    //researchNotes: 'Power dynamics significantly influence interaction patterns and outcomes.',
    section: 'Definition of Situation'
  },
  'Standards of Customary Practices': {
    factor: 'Standards of Customary Practices',
    description: 'Social norms and cultural practices that guide behavior.',
    examples: [
      'Talking loudly in a library.',
      'Waiting for your turn to ask for help.',
      'Walking off mid-interaction.',
    ],
    relatedFactors: ['Nationality', 'Context', 'Individual Specifics'],
    //researchNotes: 'Understanding cultural practices is essential for appropriate robot behavior.',
    section: 'Definition of Situation'
  },
  'Group Dynamics': {
    factor: 'Group Dynamics',
    description: 'The social interactions and relationships between participants in a group setting.',
    examples: [
      'Peer pressure may influence individual behavior.',
      'Group cohesion affects how members interact with the robot.',
      'Social hierarchies may determine who speaks first.'
    ],
    relatedFactors: ['Participants', 'Power and Status', 'Social Motive'],
    //researchNotes: 'Group dynamics significantly influence individual behavior and decision-making in social contexts.',
    section: 'Definition of Situation'
  },
  'Emotional State': {
    factor: 'Emotional State',
    description: 'The current emotional condition of the participant.',
    examples: [
      'Stress may reduce patience with technology.',
      'Positive emotions may increase openness.',
      'Emotional state may affect decision-making.'
    ],
    relatedFactors: ['Individual Specifics', 'Context'],
    //researchNotes: 'Emotional state significantly influences interaction quality and outcomes.',
    section: 'Definition of Situation'
  },
  'Framing': {
    factor: 'Framing',
    description: 'The way the situation is presented or perceived by the participant.',
    examples: [
      'A positive framing may encourage engagement.',
      'A negative framing may discourage interaction.',
      'Framing can influence how participants perceive the robot.'
    ],
    relatedFactors: ['Individual Specifics', 'Context', 'Emotional State', 'Standards of Customary Practices'],
    
    section: 'Definition of Situation'
  },
  'Communication': {
    factor: 'Communication',
    description: 'The way the participant communicates with their peers when interacting with the robot.',
    examples: [
      'Communicating with their peers may influence their behavior towards the robot.',
    ],
    relatedFactors: ['Individual Specifics', 'Context', 'Framing'],
   
    section: 'Definition of Situation'
  },
  'Causes': {
    factor: 'Causes',
    description: 'Why the participant is behaving the way they are.',
    examples: [
      'The participant may be influenced by their peers.',
      'The participant may be influenced by the robot.',
      'The participant may be influenced by the environment.',
    ],
    relatedFactors: ['Individual Specifics', 'Context', 'Framing', 'Communication', 'Emotional State'],
    
    section: 'Definition of Situation'
  },
  'Expectations': {
    factor: 'Expectations',
    description: 'What the participant expects from the interaction.',
    examples: [
      'The participant may expect the robot to be all knowledgeable.',
      'The participant may expect the robot will understand the concept of personal space',
    ],
    relatedFactors: ['Individual Specifics', 'Context', 'Framing', 'Communication', 'Emotional State'],        
    section: 'Definition of Situation'
  },
  'Media-Based and Performative Mediation': {
    factor: 'Media-Based and Performative Mediation',
    description: 'How does the robot\'s presence and performance constructs meaning in the interaction?',
    examples: [
      'The robot\'s screen may be used to display information or media to the participant, does this influence the participant\'s behavior?',
      'Does the robot\'s appearance or structure influence the participant\'s behavior?',          
    ],
    relatedFactors: ['Framing', 'Causes', 'Expectations'],
    section: 'Definition of Situation'
  },
  'Robot Specifics': {
    factor: 'Robot Specifics',
    description: 'The technical and physical aspects of the robot.',
    examples: [
      'What type of robot is it?',
      'What can the robot do?',
      'What features does the robot have?',
    ],
    relatedFactors: ['Framing', 'Causes', 'Expectations'],
    section: 'Situation'
  },
  'Familiarity and Relationship Aspect': {
    factor: 'Familiarity and Relationship Aspect',
    description: 'How well does the interacting agents know each other?',
    examples: [
      'Is this the first time the participant is meeting the robot?',
    ],
    relatedFactors: ['Personal History', 'Expectations'],
    section: 'Definition of Situation'
  }
};

// Helper function to parse factors string into array
export const parseFactors = (factors) => {
  if (!factors) return [];
  if (Array.isArray(factors)) return factors;
  if (typeof factors === 'string') {
    // Get all available factor names for matching
    const availableFactors = Object.keys(FACTORS);
    
    // Find all factor matches with their positions
    const matches = [];
    for (const factorName of availableFactors) {
      const regex = new RegExp(`\\b${factorName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
      let match;
      while ((match = regex.exec(factors)) !== null) {
        matches.push({
          factorName: factorName,
          start: match.index,
          end: match.index + match[0].length
        });
      }
    }
    
    // Sort matches by start position
    matches.sort((a, b) => a.start - b.start);
    
    // Remove overlapping matches (keep the first one found)
    const nonOverlappingMatches = [];
    for (const match of matches) {
      const overlaps = nonOverlappingMatches.some(existing => 
        (match.start >= existing.start && match.start < existing.end) ||
        (match.end > existing.start && match.end <= existing.end) ||
        (match.start <= existing.start && match.end >= existing.end)
      );
      
      if (!overlaps) {
        nonOverlappingMatches.push(match);
      }
    }
    
    // Extract factor names from non-overlapping matches
    const foundFactors = nonOverlappingMatches.map(match => match.factorName);
    
    // If we found factors, return them
    if (foundFactors.length > 0) {
      return foundFactors;
    }
    
    // Fallback to simple comma splitting if no exact matches found
    return factors.split(',').map(f => f.trim()).filter(f => f.length > 0);
  }
  return [];
};

// Simple functions to access factors
export const getFactorFromStorage = (factorName) => {
  return FACTORS[factorName] || null;
};

export const getAllFactors = () => {
  return FACTORS;
};

export const getFactorsBySection = (section) => {
  return Object.values(FACTORS).filter(factor => factor.section === section);
};

export const createFactorDetails = async (question, factor) => {
  const factorData = getFactorFromStorage(factor);
    
  if (factorData) {
      return {
      ...factorData,
        questionText: question.text || question.questionText,
      section: factorData.section || question.section || 'Unknown'
      };
  }

  // Fallback to basic data if not found
  return {
    questionText: question.text || question.questionText,
    factor: factor,
    description: `This factor "${factor}" relates to how participants understand and respond to ${(question.text || question.questionText).toLowerCase()}.`,
    examples: [
      `Example 1: When participants consider ${factor} in their decision-making process`,
      `Example 2: How ${factor} influences their perception of the situation`,
      `Example 3: The role of ${factor} in social appropriateness judgments`
    ],
    relatedFactors: ['Context', 'Emotional State', 'Social Norms'],
    researchNotes: `Research suggests that ${factor} plays a significant role in human-robot interaction scenarios, particularly in situations involving social decision-making.`,
    section: question.section || 'Unknown'
  };
};

// Common factor click handler that can be used across components
export const handleFactorClick = async (question, factor, setSelectedFactor, setShowFactorDetails) => {
  const factorDetails = await createFactorDetails(question, factor);
  setSelectedFactor(factorDetails);
  setShowFactorDetails(true);
};

// Initialize factors - now just returns the static data
export const initializeFactors = () => {
  return FACTORS;
}; 