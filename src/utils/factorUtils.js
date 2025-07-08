// Centralized factor handling utilities
export const createFactorDetails = async (question, factor) => {
  try {
    // Try to get factor details from database
    const factorDetails = await window.electronAPI.getFactorDetails(factor);
    
    if (factorDetails) {
      return {
        ...factorDetails,
        questionText: question.text || question.questionText,
        section: question.section || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Error fetching factor details from database:', error);
  }

  // Fallback to dummy data if database fails or factor not found
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