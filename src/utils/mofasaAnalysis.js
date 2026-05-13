export const ANALYTIC_TAGS_SECTION = 'Analytic Tags';
export const ANALYTIC_TAGS_FIELD = 'tags';
export const ANALYTIC_TAG_COLORS_FIELD = 'tagColors';
export const CROSS_PARTICIPANT_SECTION = 'Cross-Participant Summary';

export const TAG_COLOR_OPTIONS = [
  { id: 'blue', label: 'Blue', background: '#eaf4fb', color: '#1a5276', border: '#b7d8ef' },
  { id: 'yellow', label: 'Yellow', background: '#f7f1d7', color: '#6b5a24', border: '#e8ddad' },
  { id: 'green', label: 'Green', background: '#e9f7ef', color: '#1e7e34', border: '#b9e4c9' },
  { id: 'pink', label: 'Pink', background: '#fdeef5', color: '#9b2f5f', border: '#f4c4d9' },
  { id: 'purple', label: 'Purple', background: '#f2eef9', color: '#6c3483', border: '#d7c4ea' },
  { id: 'gray', label: 'Gray', background: '#eef1f4', color: '#4d5963', border: '#d0d7de' }
];

export const DEFAULT_TAG_COLOR = 'yellow';

export const SUMMARY_FIELDS = [
  'condition',
  'observedReaction',
  'keyIdentityFactors',
  'situationHighlights',
  'definitionOfSituationHighlights',
  'impliedRule',
  'appropriatenessCondition',
  'responseType',
  'analyticMemo'
];

export const SUMMARY_FIELD_LABELS = {
  condition: 'Condition / Scenario',
  observedReaction: 'Observed Reaction',
  keyIdentityFactors: 'Key Identity Factors',
  situationHighlights: 'Situation Highlights',
  definitionOfSituationHighlights: 'Definition of Situation Highlights',
  impliedRule: 'Implied Rule / Appropriateness Logic',
  appropriatenessCondition: 'Appropriateness Condition',
  responseType: 'Response Type',
  analyticMemo: 'Notes / Analytic Memo'
};

const normalizeTag = (tag) => String(tag || '').trim().replace(/\s+/g, ' ');

export const normalizeTags = (tags) => {
  const parsedTags = Array.isArray(tags)
    ? tags
    : String(tags || '').split(/[;,]/);

  return Array.from(new Set(parsedTags.map(normalizeTag).filter(Boolean)));
};

export const getAcceptedTags = (participant) => (
  normalizeTags(participant?.answers?.[ANALYTIC_TAGS_SECTION]?.[ANALYTIC_TAGS_FIELD])
);

export const getTagColors = (participant) => {
  const colors = participant?.answers?.[ANALYTIC_TAGS_SECTION]?.[ANALYTIC_TAG_COLORS_FIELD];
  return colors && typeof colors === 'object' && !Array.isArray(colors) ? colors : {};
};

export const getTagColorStyle = (colorId) => (
  TAG_COLOR_OPTIONS.find(option => option.id === colorId) ||
  TAG_COLOR_OPTIONS.find(option => option.id === DEFAULT_TAG_COLOR)
);

export const getParticipantSummary = (participant, scope) => {
  const stored = participant?.answers?.[CROSS_PARTICIPANT_SECTION] || {};
  const identity = participant?.answers?.Identity || {};
  const situation = participant?.answers?.Situation || {};
  const definition = participant?.answers?.['Definition of Situation'] || participant?.answers?.['Definition of the Situation'] || {};
  const selectedRules = participant?.answers?.['Rule Selection']?.selectedRules || [];

  return {
    id: `${scope?.id || scope?.scopeNumber || 'scope'}-${participant?.id || participant?.participantId || participant?.name}`,
    studyId: scope?.id,
    participantId: participant?.id || participant?.participantId || participant?.name || '',
    condition: stored.condition || scope?.scopeText || `Scope ${scope?.scopeNumber || ''}`.trim(),
    observedReaction: stored.observedReaction || participant?.summary || '',
    keyIdentityFactors: stored.keyIdentityFactors || Object.values(identity).filter(Boolean).join('; '),
    situationHighlights: stored.situationHighlights || Object.values(situation).filter(Boolean).join('; '),
    definitionOfSituationHighlights: stored.definitionOfSituationHighlights || Object.values(definition).filter(Boolean).join('; '),
    impliedRule: stored.impliedRule || selectedRules.join('; '),
    appropriatenessCondition: stored.appropriatenessCondition || '',
    responseType: stored.responseType || '',
    tags: getAcceptedTags(participant),
    analyticMemo: stored.analyticMemo || '',
    createdAt: participant?.createdAt || '',
    updatedAt: participant?.updatedAt || ''
  };
};

const TAG_RULES = [
  {
    tag: 'friendly interpretation',
    patterns: [/cute/i, /friendly/i, /welcoming/i, /\bnice\b/i, /adorable/i],
    reason: 'Participant framed the robot in friendly, welcoming, or cute terms.'
  },
  {
    tag: 'positive curiosity',
    patterns: [/curious/i, /interested/i, /wanted to (approach|try|see)/i, /positive/i, /excited/i, /cute/i],
    reason: 'Participant expressed interest, curiosity, or positive affect.'
  },
  {
    tag: 'media reference',
    patterns: [/wall-?e/i, /big bang theory/i, /\bmovie\b/i, /\bshow\b/i, /cartoon/i, /animation/i],
    reason: 'Participant connected the encounter to media or fictional robots.'
  },
  {
    tag: 'introversion/social hesitation',
    patterns: [/shy/i, /introvert/i, /wanted to approach but/i, /did not approach/i, /too nervous/i],
    reason: 'Participant wanted to engage or noticed the robot but hesitated socially.'
  },
  {
    tag: 'restrained engagement',
    patterns: [/did not approach/i, /watched/i, /looked/i, /glanced/i, /hesitat/i, /held back/i],
    reason: 'Participant showed interest or awareness without fully engaging.'
  },
  {
    tag: 'fragility/damage concern',
    patterns: [/break/i, /damage/i, /fragile/i, /expensive/i, /afraid to break/i],
    reason: 'Participant worried about damaging the robot.'
  },
  {
    tag: 'slow movement condition',
    patterns: [/\bslow\b/i, /slowly/i, /\bspeed\b/i],
    reason: 'Participant tied appropriateness to the robot moving slowly or at an acceptable speed.'
  },
  {
    tag: 'unclear purpose',
    patterns: [/\bwhy\b/i, /purpose/i, /what is it doing/i, /what it was for/i],
    reason: 'Participant questioned the robot’s purpose or role.'
  },
  {
    tag: 'clear purpose condition',
    patterns: [/purpose/i, /clear/i, /what it was for/i, /explain/i],
    reason: 'Participant suggested the robot is more acceptable when its purpose is clear.'
  },
  {
    tag: 'discomfort',
    patterns: [/uncomfortable/i, /creepy/i, /weird/i, /awkward/i],
    reason: 'Participant described discomfort or unease.'
  },
  {
    tag: 'social awkwardness',
    patterns: [/awkward/i, /embarrass/i, /socially/i],
    reason: 'Participant’s reaction involved social awkwardness or embarrassment.'
  },
  {
    tag: 'surveillance concern',
    patterns: [/watched/i, /camera/i, /recording/i, /surveillance/i],
    reason: 'Participant mentioned being watched, recorded, or surveilled.'
  },
  {
    tag: 'privacy concern',
    patterns: [/privacy/i, /private/i, /camera/i, /recording/i],
    reason: 'Participant raised privacy or recording concerns.'
  },
  {
    tag: 'person-mediated interpretation',
    patterns: [/\bhuman\b/i, /\bperson\b/i, /\bface\b/i, /operator/i, /someone controlling/i],
    reason: 'Participant interpreted the robot through human presence or control.'
  },
  {
    tag: 'autonomous-object interpretation',
    patterns: [/autonomous/i, /itself/i, /\bAI\b/i, /independent/i],
    reason: 'Participant treated the robot as acting independently or autonomously.'
  },
  {
    tag: 'acceptable with conditions',
    patterns: [/acceptable if/i, /as long as/i, /provided that/i, /only if/i],
    reason: 'Participant made acceptance conditional.'
  },
  {
    tag: 'safety concern',
    patterns: [/\bsafe\b/i, /danger/i, /hurt/i, /collision/i, /risk/i],
    reason: 'Participant mentioned safety, danger, or collision risk.'
  },
  {
    tag: 'safety condition',
    patterns: [/\bsafe\b/i, /danger/i, /hurt/i, /collision/i],
    reason: 'Participant tied appropriateness to safety conditions.'
  },
  {
    tag: 'optional interaction condition',
    patterns: [/choice/i, /optional/i, /pressure/i, /does not pressure/i, /decide whether/i],
    reason: 'Participant valued having choice or not being pressured to interact.'
  },
  {
    tag: 'personal space condition',
    patterns: [/personal space/i, /distance/i, /too close/i, /space/i],
    reason: 'Participant tied appropriateness to distance or personal space.'
  },
  {
    tag: 'confusion/uncertainty',
    patterns: [/uncertain/i, /confus/i, /not sure/i, /ambiguous/i],
    reason: 'Participant expressed confusion or uncertainty.'
  },
  {
    tag: 'direct engagement',
    patterns: [/approached/i, /talked/i, /spoke/i, /interacted/i, /asked/i],
    reason: 'Participant directly engaged with the robot.'
  },
  {
    tag: 'greeting/acknowledgment',
    patterns: [/greet/i, /\bhello\b/i, /\bhi\b/i, /acknowledg/i, /wave/i],
    reason: 'Participant greeted or acknowledged the robot.'
  },
  {
    tag: 'ignored/no engagement',
    patterns: [/ignored/i, /no engagement/i, /did not notice/i, /walked past/i],
    reason: 'Participant ignored or did not engage with the robot.'
  }
];

const sourceLabels = {
  observedReaction: 'Observed Reaction',
  keyIdentityFactors: 'Key Identity Factors',
  situationHighlights: 'Situation Highlights',
  definitionOfSituationHighlights: 'Definition of Situation Highlights',
  impliedRule: 'Implied Rule',
  appropriatenessCondition: 'Appropriateness Condition',
  responseType: 'Response Type',
  analyticMemo: 'Analytic Memo',
  participantSummary: 'Participant Summary'
};

export const suggestTags = (participantSummary, acceptedTags = []) => {
  const accepted = new Set(normalizeTags(acceptedTags).map(tag => tag.toLowerCase()));
  const sourceEntries = [
    ...Object.keys(sourceLabels).map(field => [field, participantSummary?.[field] || '']),
    ['participantSummary', participantSummary?.summary || '']
  ].filter(([, value]) => String(value || '').trim());

  const suggestions = [];

  TAG_RULES.forEach(rule => {
    if (accepted.has(rule.tag.toLowerCase())) return;

    const matchedSources = sourceEntries
      .filter(([, value]) => rule.patterns.some(pattern => pattern.test(String(value))))
      .map(([field]) => sourceLabels[field] || field);

    if (matchedSources.length > 0 && !suggestions.some(item => item.tag === rule.tag)) {
      suggestions.push({
        tag: rule.tag,
        reason: rule.reason,
        sourceFields: Array.from(new Set(matchedSources))
      });
    }
  });

  return suggestions;
};
