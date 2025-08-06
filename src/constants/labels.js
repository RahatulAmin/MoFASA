// Global label constants for the MoFASA application
// This allows easy renaming of concepts across the entire application

export const LABELS = {
  // Main section names
  RULE_SELECTION: "Rule Selection",
  
  // You can add other labels here as needed
  SITUATION: "Situation",
  IDENTITY: "Identity", 
  DEFINITION_OF_SITUATION: "Definition of Situation",
  
  // Button/Action labels related to rules
  RULE_SELECTION_BUTTON: "Select Rules",
  ADD_RULE_BUTTON: "Add Rule",
  SELECTED_RULES: "Selected Rules",
  AVAILABLE_RULES: "Available Rules",
  
  // Other potential labels that might need changing
  UNDESIRABLE_RULES: "Undesirable Rules",
  GENERATED_RULES: "Generated Rules",
  
  // Alternative names (commented out, ready to switch)
  // RULE_SELECTION: "Actionable Items",
  // SELECTED_RULES: "Selected Items",
  // ADD_RULE_BUTTON: "Add Item",
  // etc.
};

// Export individual constants for convenience
export const {
  RULE_SELECTION,
  SITUATION,
  IDENTITY,
  DEFINITION_OF_SITUATION,
  RULE_SELECTION_BUTTON,
  ADD_RULE_BUTTON,
  SELECTED_RULES,
  AVAILABLE_RULES,
  UNDESIRABLE_RULES,
  GENERATED_RULES
} = LABELS;

// Default export for easy importing
export default LABELS;