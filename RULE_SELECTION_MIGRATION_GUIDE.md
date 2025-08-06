# Rule Selection Migration Guide

This guide shows how to replace all hardcoded "Rule Selection" strings with the global constant.

## 1. Files Already Updated:
- ✅ `src/constants/labels.js` - Created with the constant
- ✅ `src/constants/frameAnalysis.js` - Updated to use constants
- ✅ `src/components/Tutorial.jsx` - Updated Step 4 title
- ✅ `src/components/ParticipantPage.jsx` - Updated SECTIONS array

## 2. Files That Need Updates:

### High Priority Files (Core functionality):

#### A. `src/components/ParticipantPage.jsx`
Replace these occurrences:
```javascript
// Line 61: 'Rule Selection': [
'Rule Selection': [
// Should become:
[RULE_SELECTION]: [

// Lines with .answers?.['Rule Selection']
participant?.answers?.['Rule Selection']?.selectedRules
// Should become:
participant?.answers?.[RULE_SELECTION]?.selectedRules

// Line 1429: updateParticipantAnswers(idx, participantId, 'Rule Selection', 'selectedRules', updatedRules);
updateParticipantAnswers(idx, participantId, 'Rule Selection', 'selectedRules', updatedRules);
// Should become:
updateParticipantAnswers(idx, participantId, RULE_SELECTION, 'selectedRules', updatedRules);
```

#### B. `src/components/ProjectDetails.jsx`
Replace these patterns:
```javascript
// All instances of p.answers?.['Rule Selection']
p.answers?.['Rule Selection']?.selectedRules
// Should become:
p.answers?.[RULE_SELECTION]?.selectedRules

// Object key: 'Rule Selection': {
'Rule Selection': {
// Should become:
[RULE_SELECTION]: {
```

#### C. `src/components/SituationDesignView.jsx`
Replace all instances:
```javascript
p.answers?.['Rule Selection']?.selectedRules
// Should become:
p.answers?.[RULE_SELECTION]?.selectedRules
```

#### D. `src/components/BehavioralDiversityView.jsx`
Replace all instances:
```javascript
p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
// Should become:
p.answers?.[RULE_SELECTION]?.selectedRules?.includes(rule)
```

#### E. `src/components/ProjectReport.jsx`
Replace all instances:
```javascript
answers?.['Rule Selection']?.selectedRules
// Should become:
answers?.[RULE_SELECTION]?.selectedRules

// Also update chart titles:
'Rule Selection Counts'
// Should become:
`${RULE_SELECTION} Counts`
```

### Medium Priority Files (Configuration):

#### F. `src/components/ProjectQuestionnaireSettings.jsx`
```javascript
{ name: 'Rule Selection', color: '#ededed' }
// Should become:
{ name: RULE_SELECTION, color: '#ededed' }
```

#### G. `src/components/FactorManagement.jsx`
```javascript
{ name: 'Rule Selection', color: '#ededed' }
// Should become:
{ name: RULE_SELECTION, color: '#ededed' }

const sections = ['All', 'Situation', 'Identity', 'Definition of Situation', 'Rule Selection', 'Decision'];
// Should become:
const sections = ['All', SITUATION, IDENTITY, DEFINITION_OF_SITUATION, RULE_SELECTION, 'Decision'];
```

#### H. `src/components/Projects.jsx`
```javascript
const order = ['Situation', 'Identity', 'Definition of Situation', 'Rule Selection', 'Decision'];
// Should become:
const order = [SITUATION, IDENTITY, DEFINITION_OF_SITUATION, RULE_SELECTION, 'Decision'];
```

### Low Priority Files (Database/Backend):

#### I. `utils/database.js` and `src/utils/database.js`
```javascript
// Comments and section assignments
...ruleSelectionQuestions.map(q => ({ ...q, section: 'Rule Selection' }))
// Should become:
...ruleSelectionQuestions.map(q => ({ ...q, section: RULE_SELECTION }))
```

### Display Files:

#### J. `src/components/Home.jsx`
```javascript
// Alt text and framework description
alt="Rule Selection"
// Should become:
alt={RULE_SELECTION}

// Framework explanation text
"What would a person like me (Identity) do (Rule Selection) in a situation like this"
// Should become:
`What would a person like me (Identity) do (${RULE_SELECTION}) in a situation like this`
```

## 3. Implementation Steps:

1. **Add import to each file:**
```javascript
import { RULE_SELECTION } from '../constants/labels';
// or for multiple constants:
import { RULE_SELECTION, SITUATION, IDENTITY, DEFINITION_OF_SITUATION } from '../constants/labels';
```

2. **Replace string literals:**
```javascript
// From:
'Rule Selection'
// To:
RULE_SELECTION

// For object keys:
// From:
{ 'Rule Selection': value }
// To:
{ [RULE_SELECTION]: value }

// For dynamic keys:
// From:
object?.['Rule Selection']
// To:
object?.[RULE_SELECTION]
```

3. **Test the change:**
   - Change `RULE_SELECTION: "Rule Selection"` to `RULE_SELECTION: "Actionable Items"` in `src/constants/labels.js`
   - Verify all instances update correctly across the application

## 4. Benefits:

- ✅ Single point of change for renaming
- ✅ TypeScript-friendly (if you add TypeScript later)
- ✅ Prevents typos and inconsistencies
- ✅ Easy to find all usages through IDE
- ✅ Supports easy A/B testing of different names

## 5. Future Enhancements:

You can extend this pattern for other renameable concepts:
- "Undesirable Rules" → "Problem Areas"
- "Behavioral Diversity" → "Response Patterns"
- "Situation Design" → "Interaction Design"