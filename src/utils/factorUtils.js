// Single source of truth for all factors
// Edit the factors below and they will be immediately reflected in the app

const FACTORS = {
  'Time': {
    factor: 'Time',
    description: 'Temporal characteristics of the interaction, including time of day, duration, routine timing, and urgency.',
    whenToCode: [
      'Code this when the time of day, duration, timing, or urgency shapes how the participant interprets the interaction.',
      'Use this when the participant mentions being rushed, busy, delayed, relaxed, or affected by the timing of the encounter.',
      'Use this when the interaction timing changes what behavior feels appropriate.'
    ],
    whenNotToCode: [
      'Do not code this only because the study happened at a certain time.',
      'Do not overinterpret time unless it clearly affects the participant’s response.',
      'If time is only background information, keep it as metadata rather than an analytic code.'
    ],
    examples: [
      'The morning hallway context made the robot part of a routine passing-by situation rather than a planned interaction.',
      'A participant rushing to class may be less willing to stop and engage.',
      'A short encounter may feel like something to quickly avoid or move around.'
    ],
    relatedFactors: ['Place', 'Context', 'Expectations', 'Emotional State'],
    section: 'Situation'
  },

  'Place': {
    factor: 'Place',
    description: 'The physical and institutional setting where the interaction occurs.',
    whenToCode: [
      'Code this when the location shapes expectations, social norms, comfort, caution, or interpretation of the robot.',
      'Use this when the participant talks about the robot being in a hallway, lab, classroom, home, public space, private space, or institutional setting.',
      'Use this when the setting affects whether the robot seems legitimate, out of place, disruptive, useful, or confusing.'
    ],
    whenNotToCode: [
      'Do not code this only to name the location.',
      'Do not assume the place matters unless the transcript or study context supports that interpretation.',
      'Do not treat place as meaningful if it does not explain the participant’s response.'
    ],
    examples: [
      'A university engineering hallway may make the robot seem like a research or technical object.',
      'A crowded hallway may make navigation and personal space more important.',
      'A private home may create different expectations about comfort, privacy, and social boundaries.'
    ],
    relatedFactors: ['Time', 'Participants', 'Context', 'Standards of Customary Practices', 'Power Dynamics'],
    section: 'Situation'
  },

  'Participants': {
    factor: 'Participants',
    description: 'Who is present in the interaction and how their presence shapes the situation.',
    whenToCode: [
      'Code this when the people present shape the participant’s interpretation or behavior.',
      'Use this when the participant is alone, with peers, with family, with strangers, with researchers, or with institutional actors.',
      'Use this when observers, companions, or other passersby influence whether the participant approaches, avoids, laughs, greets, or ignores the robot.'
    ],
    whenNotToCode: [
      'Do not simply list people who are present unless their presence matters.',
      'Do not infer social influence from the presence of others unless there is evidence.',
      'If only one person is present and this does not shape the interaction, record it as metadata.'
    ],
    examples: [
      'Being alone may allow the participant to respond without peer influence.',
      'A group of friends may make someone more likely to joke about or approach the robot.',
      'Observers may make a participant more self-conscious about interacting with the robot.'
    ],
    relatedFactors: ['Group Size', 'Role Identities', 'Communication', 'Power Dynamics'],
    section: 'Situation'
  },

  'Group Size': {
    factor: 'Group Size',
    description: 'The number of people involved in or observing the interaction.',
    whenToCode: [
      'Code this when the number of people affects the interaction.',
      'Use this when group size creates peer pressure, shared responsibility, hesitation, confidence, joking, or coordinated response.',
      'Use this when multiple people jointly interpret or respond to the robot.'
    ],
    whenNotToCode: [
      'Do not overinterpret group size when only one participant is present.',
      'Do not code group size analytically if it does not affect behavior or interpretation.',
      'Avoid writing only “Group size: 1” unless the tool requires it as metadata.'
    ],
    examples: [
      'A single passerby responded individually without peer influence.',
      'A group may be more likely to laugh, point, or talk about the robot together.',
      'A crowd may make it unclear who the robot is approaching or addressing.'
    ],
    relatedFactors: ['Participants', 'Communication', 'Power Dynamics', 'Social Motive'],
    section: 'Situation'
  },

  'Role Identities': {
    factor: 'Role Identities',
    description: 'The social, professional, or situational roles that individuals occupy during the interaction.',
    whenToCode: [
      'Code this when the participant’s role shapes what they think they should do.',
      'Use this for roles such as passerby, student, researcher, operator, observer, caregiver, staff member, customer, visitor, or direct user.',
      'Use this when the participant interprets the robot differently because of their role in the situation.'
    ],
    whenNotToCode: [
      'Do not code role identity only as a demographic label.',
      'Do not assume a role matters unless it affects interpretation or behavior.',
      'Do not assign roles that are not supported by the transcript or study context.'
    ],
    examples: [
      'As a passerby, the participant did not treat the robot as something they were expected to use.',
      'A student may interpret a hallway robot as a research or engineering project.',
      'A caregiver may focus on safety, protection, or responsibility.'
    ],
    relatedFactors: ['Participants', 'Occupation', 'Social Motive', 'Standards of Customary Practices'],
    section: 'Situation'
  },

  'Social Motive': {
    factor: 'Social Motive',
    description: 'The participant’s purpose, intention, or goal in relation to the robot or the situation.',
    whenToCode: [
      'Code this when the participant’s reason for engaging, avoiding, observing, or moving around the robot is clear.',
      'Use this when the participant wants to pass by, avoid interfering, protect the robot, test the robot, greet it, seek help, or understand its purpose.',
      'Use this to capture the intention behind the behavior, not just the behavior itself.'
    ],
    whenNotToCode: [
      'Do not code the final action alone as social motive.',
      'Do not write “moved away” here unless you also explain the motive behind moving away.',
      'Do not infer motive if the participant only describes an action without explanation.'
    ],
    examples: [
      'The participant kept distance because they did not want to damage or interfere with the robot.',
      'The participant approached because they were curious about what the robot could do.',
      'The participant ignored the robot because they were focused on getting somewhere.'
    ],
    relatedFactors: ['Role Identities', 'Context', 'Expectations', 'Decision'],
    section: 'Situation'
  },

  'Robot\'s Specifics': {
    factor: 'Robot\'s Specifics',
    description: 'The robot’s type, visible features, capabilities, and perceived use case.',
    whenToCode: [
      'Code this when the robot’s physical design, visible hardware, movement, display, face, eyes, size, speed, or perceived function shapes interpretation.',
      'Use this when the participant notices specific robot features and connects them to comfort, caution, curiosity, trust, confusion, or expectations.',
      'Use this when the participant comments on what the robot can or cannot do.'
    ],
    whenNotToCode: [
      'Do not list technical features that the participant did not notice or that did not shape the interaction.',
      'Do not mention sensors, cameras, autonomy, or capabilities unless supported by the transcript or study context.',
      'Do not code generic robot descriptions unless they explain the participant’s response.'
    ],
    examples: [
      'The blinking eyes made the robot seem cute and more approachable.',
      'The mounted laptop made the robot seem fragile and easy to damage.',
      'Slow movement may make the robot seem safe, awkward, inefficient, or non-threatening.'
    ],
    relatedFactors: ['Media-Based and Performative Mediation', 'Framing', 'Expectations', 'Uncertainty'],
    section: 'Situation'
  },

  'Age-Range': {
    factor: 'Age-Range',
    description: 'The participant’s age group and whether it shapes their interpretation of the robot.',
    whenToCode: [
      'Code this when age appears relevant to comfort, expectations, familiarity, caution, curiosity, or interaction style.',
      'Use this when the participant explicitly connects age or life stage to their response.',
      'Use this as metadata when age is collected but not analytically relevant.'
    ],
    whenNotToCode: [
      'Do not assume younger participants are automatically comfortable with robots.',
      'Do not assume older participants are automatically uncomfortable with robots.',
      'Do not make age-based interpretations without evidence.'
    ],
    examples: [
      'The participant was 18–24, but age did not clearly shape their response.',
      'A younger participant may describe the robot through technology or novelty if supported by the transcript.',
      'An older participant may describe different expectations if they explicitly mention generational comfort or unfamiliarity.'
    ],
    relatedFactors: ['Experience', 'Individual Specifics', 'Expectations'],
    section: 'Identity'
  },

  'Gender': {
    factor: 'Gender',
    description: 'The participant’s gender identity and whether it shapes the interaction or interpretation.',
    whenToCode: [
      'Code this when the participant’s gender is relevant to comfort, safety, expectations, communication, or interpretation.',
      'Use this as metadata when gender is collected but not analytically relevant.',
      'Use this analytically only when the transcript or study design supports the connection.'
    ],
    whenNotToCode: [
      'Do not assume gender explains comfort, fear, curiosity, or avoidance without evidence.',
      'Do not make gender-based claims from a single transcript unless clearly supported.',
      'Do not overinterpret gender when other factors explain the response better.'
    ],
    examples: [
      'The participant identified as male, but the transcript does not show gender shaping the response.',
      'Gender may be relevant if the participant discusses feeling watched, safe, unsafe, addressed, or represented.',
      'Gender may matter when comparing responses to male-face and female-face robot conditions, but only with careful evidence.'
    ],
    relatedFactors: ['Power Dynamics', 'Emotional State', 'Expectations', 'Individual Specifics'],
    section: 'Identity'
  },

  'Nationality': {
    factor: 'Nationality',
    description: 'The participant’s national or cultural background and whether it shapes interaction expectations.',
    whenToCode: [
      'Code this when the participant connects cultural background, national context, language, or social customs to their interpretation.',
      'Use this when cultural norms affect personal space, greetings, authority, technology expectations, or comfort.',
      'Use this as metadata if collected but not directly relevant.'
    ],
    whenNotToCode: [
      'Do not assume nationality explains behavior without evidence.',
      'Do not stereotype cultural responses to robots.',
      'Do not code nationality analytically if the participant does not connect it to the interaction.'
    ],
    examples: [
      'The participant connected their cultural background to expectations about greeting or avoiding strangers.',
      'The participant mentioned that robots are more common in another city or country they know.',
      'Nationality was collected but did not shape the interpretation in this transcript.'
    ],
    relatedFactors: ['Standards of Customary Practices', 'Context', 'Expectations'],
    section: 'Identity'
  },

  'Occupation': {
    factor: 'Occupation',
    description: 'The participant’s professional, academic, or work background and how it shapes their interpretation.',
    whenToCode: [
      'Code this when occupation or academic background affects how the participant understands the robot.',
      'Use this when engineers, computer science students, healthcare workers, teachers, service workers, or other groups interpret the robot through their professional lens.',
      'Use this when the participant’s work or study background connects to robot familiarity, technical judgment, caution, or expectations.'
    ],
    whenNotToCode: [
      'Do not assume occupation matters unless supported by the transcript.',
      'Do not treat “student” as analytically meaningful unless the student role affects the interaction.',
      'Do not use occupation to make unsupported claims about expertise.'
    ],
    examples: [
      'A computer science student who has built robots may interpret the robot as technically interesting rather than frightening.',
      'A healthcare worker may focus on safety and reliability if they connect the robot to care contexts.',
      'A teacher may focus on how the robot communicates with students.'
    ],
    relatedFactors: ['Experience', 'Personal History', 'Expectations', 'Role Identities'],
    section: 'Identity'
  },

  'Background': {
    factor: 'Background',
    description: 'Educational, cultural, technical, and personal background that may shape interpretation.',
    whenToCode: [
      'Code this when the participant’s background provides useful context for how they interpret the robot.',
      'Use this when education, technical knowledge, cultural context, or lived experience affects expectations or comfort.',
      'Use this when background helps explain why the participant notices certain features or risks.'
    ],
    whenNotToCode: [
      'Do not use background as a vague catch-all category.',
      'Do not repeat information already better coded under Occupation, Experience, Personal History, or Nationality.',
      'Do not infer background beyond what the participant provides.'
    ],
    examples: [
      'The participant’s technical background made them attentive to hardware fragility.',
      'A participant with design experience may focus on appearance and interface cues.',
      'A participant with accessibility experience may interpret the robot through assistive-use expectations.'
    ],
    relatedFactors: ['Occupation', 'Experience', 'Personal History', 'Individual Specifics'],
    section: 'Identity'
  },

  'Experience': {
    factor: 'Experience',
    description: 'Previous experience with robots or similar technologies.',
    whenToCode: [
      'Code this when prior experience affects comfort, expectations, trust, caution, curiosity, or interpretation.',
      'Use this when the participant has built robots, used robots, seen demos, interacted with AI systems, or had similar technology encounters.',
      'Use this when the participant compares the current robot to previous technologies.'
    ],
    whenNotToCode: [
      'Do not assume experience from occupation alone.',
      'Do not code experience unless it is stated or strongly supported.',
      'Do not treat all prior experience as positive; note whether it increases trust, caution, skepticism, or expectations.'
    ],
    examples: [
      'The participant had built small robots before, which made the encounter feel familiar and non-threatening.',
      'Prior negative experience with unreliable robots may increase skepticism.',
      'Seeing demo robots before may make the hallway robot seem less surprising.'
    ],
    relatedFactors: ['Occupation', 'Personal History', 'Individual Specifics', 'Expectations'],
    section: 'Identity'
  },

  'Personal History': {
    factor: 'Personal History',
    description: 'Past experiences or memories that influence how the participant interprets the current robot encounter.',
    whenToCode: [
      'Code this when the participant refers to past experiences that shape the current response.',
      'Use this for previous robot encounters, technology experiences, accessibility experiences, safety incidents, institutional experiences, or repeated habits.',
      'Use this when the past experience explains why the participant reacts in a particular way.'
    ],
    whenNotToCode: [
      'Do not code personal history if the participant only gives a demographic fact.',
      'Do not assume past experience shaped the response unless there is a clear connection.',
      'Do not duplicate Experience unless the past experience is specifically being used to explain interpretation.'
    ],
    examples: [
      'The participant previously built small robots and had seen demo robots, which likely reduced surprise.',
      'A previous bad experience with a robot may explain hesitation or distrust.',
      'Familiarity with similar devices may create higher expectations for movement or communication.'
    ],
    relatedFactors: ['Experience', 'Occupation', 'Framing', 'Expectations'],
    section: 'Identity'
  },

  'Individual Specifics': {
    factor: 'Individual Specifics',
    description: 'Personal characteristics, preferences, comfort levels, and interaction tendencies that shape the response.',
    whenToCode: [
      'Code this when personality, preferences, habits, comfort level, accessibility needs, or personal boundaries shape interaction.',
      'Use this when the participant connects introversion, extroversion, curiosity, caution, privacy preferences, or personal space preferences to their behavior.',
      'Use this when individual difference explains variation between participants in the same condition.'
    ],
    whenNotToCode: [
      'Do not overinterpret personality labels unless they explain the response.',
      'Do not write “introverted, so avoided the robot” unless the participant says this or clearly implies it.',
      'Do not use this as a catch-all for anything personal.'
    ],
    examples: [
      'The participant described himself as introverted, but his caution was better explained by concern about damaging the robot.',
      'A participant who prefers personal space may keep distance from the robot.',
      'A participant who enjoys new technology may approach out of curiosity.'
    ],
    relatedFactors: ['Experience', 'Emotional State', 'Social Motive', 'Expectations'],
    section: 'Identity'
  },

  'Standards of Customary Practices': {
    factor: 'Standards of Customary Practices',
    description: 'Social norms, habits, values, and practical rules that guide what the participant sees as appropriate.',
    whenToCode: [
      'Code this when the participant refers to what people normally do, should do, or are expected to do.',
      'Use this for norms around personal space, hallway movement, politeness, safety, privacy, greeting, waiting, turn-taking, or not touching equipment.',
      'Use this when the participant applies a social, cultural, institutional, or practical norm to the robot encounter.'
    ],
    whenNotToCode: [
      'Do not code ordinary behavior as a norm unless the participant frames it as expected, appropriate, polite, safe, or normal.',
      'Do not write “followed social norms” without specifying the norm.',
      'Do not assume cultural norms without evidence.'
    ],
    examples: [
      'The participant applied a practical norm of giving fragile equipment extra space.',
      'A participant may expect people to keep to the right in a hallway.',
      'A participant may expect a robot in a public space to make its purpose visible.'
    ],
    relatedFactors: ['Context', 'Place', 'Expectations', 'Rule Selection'],
    section: 'Definition of Situation'
  },

  'Uncertainty': {
    factor: 'Uncertainty',
    description: 'What the participant is unsure about in the situation, including the robot’s purpose, movement, autonomy, awareness, or future behavior.',
    whenToCode: [
      'Code this when the participant is unsure about what the robot is doing, why it is there, how it works, whether it is autonomous, or what it will do next.',
      'Use this when uncertainty leads to hesitation, caution, curiosity, avoidance, or questioning.',
      'When possible, code uncertainty together with Consequences because uncertainty matters through what the participant thinks might happen.'
    ],
    whenNotToCode: [
      'Do not code this only because the robot is new or interesting.',
      'Do not write “uncertain” without specifying uncertain about what.',
      'Do not assume uncertainty if the participant gives a clear interpretation.'
    ],
    examples: [
      'The participant was unsure whether the robot was autonomous.',
      'The participant was unsure how the robot would move around them.',
      'The robot’s purpose in the hallway was unclear to the participant.'
    ],
    relatedFactors: ['Consequences', 'Framing', 'Expectations', 'Robot\'s Specifics'],
    section: 'Definition of Situation'
  },

  'Consequences': {
    factor: 'Consequences',
    description: 'The participant’s perceived outcomes, risks, or effects of acting in a particular way.',
    whenToCode: [
      'Code this when the participant identifies what might happen if they approach, avoid, touch, block, greet, or ignore the robot.',
      'Use this when perceived consequences include damage, collision, embarrassment, disruption, privacy risk, safety risk, delay, or social awkwardness.',
      'Code this together with Uncertainty when the participant’s uncertainty creates concern about possible outcomes.'
    ],
    whenNotToCode: [
      'Do not code consequences if there is no perceived outcome or risk.',
      'Do not invent consequences that the participant does not state or strongly imply.',
      'Do not treat all discomfort as consequence; specify what consequence the participant was concerned about.'
    ],
    examples: [
      'The participant worried about knocking the robot over because it looked delicate.',
      'A participant may avoid the robot to prevent blocking its path.',
      'A participant may avoid interacting because they worry others will watch or judge them.'
    ],
    relatedFactors: ['Uncertainty', 'Power Dynamics', 'Decision', 'Rule Selection'],
    section: 'Definition of Situation'
  },

  'Context': {
    factor: 'Context',
    description: 'The broader situation that frames how the participant understands the robot encounter.',
    whenToCode: [
      'Code this when the participant identifies or struggles to identify what kind of situation this is.',
      'Use this when the interaction is framed as a research demo, accessibility support, delivery, surveillance, service, class project, public encounter, or unclear event.',
      'Use this when context affects whether the robot seems appropriate, legitimate, confusing, intrusive, or useful.'
    ],
    whenNotToCode: [
      'Do not write only “context not discussed” unless the lack of context is analytically important.',
      'Do not assume the participant understood the study context unless they say so.',
      'Do not use context as a generic label without explaining the frame.'
    ],
    examples: [
      'The participant did not know the robot’s purpose and interpreted it mainly as a curious technical object.',
      'A badge explaining accessibility use may make the robot seem more legitimate.',
      'A hallway context may make the robot’s navigation and right-of-way more salient.'
    ],
    relatedFactors: ['Framing', 'Expectations', 'Place', 'Standards of Customary Practices'],
    section: 'Definition of Situation'
  },

  'Framing': {
    factor: 'Framing',
    description: 'How the participant perceives or constructs the meaning of the situation.',
    whenToCode: [
      'Code this when the participant frames the robot as a tool, person, obstacle, research device, assistant, toy-like object, fragile equipment, accessibility aid, or unknown presence.',
      'Use this when the participant’s interpretation of “what is happening here” shapes their response.',
      'Use this when the same robot could be understood differently depending on cues, setting, explanation, or appearance.'
    ],
    whenNotToCode: [
      'Do not code framing as simply positive or negative emotion.',
      'Do not write “did not talk about framing” if the participant shows uncertainty about purpose or role.',
      'Do not impose a frame that the participant did not indicate.'
    ],
    examples: [
      'The participant framed the robot as an interesting technical object rather than a social actor.',
      'The participant framed the robot as fragile equipment that should not be disturbed.',
      'The participant framed the robot as a legitimate accessibility device after seeing signage.'
    ],
    relatedFactors: ['Context', 'Expectations', 'Media-Based and Performative Mediation', 'Uncertainty'],
    section: 'Definition of Situation'
  },

  'Expectations': {
    factor: 'Expectations',
    description: 'What the participant expects the robot, themselves, or others to do in the interaction.',
    whenToCode: [
      'Code this when the participant expresses what they expected from the robot or the situation.',
      'Use this for expectations about movement, personal space, communication, autonomy, purpose, safety, speed, politeness, or usefulness.',
      'Use this when expectation mismatch explains surprise, discomfort, caution, or acceptance.'
    ],
    whenNotToCode: [
      'Do not infer expectations without evidence.',
      'Do not confuse expectations with preferences unless the participant clearly states what they thought should happen.',
      'Do not code generic opinions about robots unless they shape the specific encounter.'
    ],
    examples: [
      'The participant expected the robot might move unpredictably, so they kept distance.',
      'A participant may expect a hallway robot to signal its purpose clearly.',
      'A participant may expect the robot to understand personal space.'
    ],
    relatedFactors: ['Framing', 'Uncertainty', 'Robot\'s Specifics', 'Standards of Customary Practices'],
    section: 'Definition of Situation'
  },

  'Power Dynamics': {
    factor: 'Power Dynamics',
    description: 'Perceived authority, control, priority, obligation, hierarchy, or right-of-way between agents.',
    whenToCode: [
      'Code this when the participant discusses who has control, who should adapt, who has priority, or who has authority in the situation.',
      'Use this when the robot is treated as having right-of-way, institutional legitimacy, surveillance power, service authority, or social priority.',
      'Use this when the participant feels obligated to move, comply, wait, avoid, or give space because of the robot’s perceived status.'
    ],
    whenNotToCode: [
      'Do not code power dynamics just because the robot is cute, friendly, small, or human-like.',
      'Do not infer power dynamics from movement around the robot unless obligation, priority, or control is evident.',
      'Do not confuse friendliness with power.'
    ],
    examples: [
      'The participant treated the robot as having temporary right-of-way and adjusted their path.',
      'A participant may feel watched or monitored by a robot with a visible camera.',
      'A participant may see an accessibility robot as having legitimate priority in the hallway.'
    ],
    relatedFactors: ['Role Identities', 'Context', 'Standards of Customary Practices', 'Decision'],
    section: 'Definition of Situation'
  },

  'Communication': {
    factor: 'Communication',
    description: 'How people communicate with each other or with the robot during the interaction.',
    whenToCode: [
      'Code this when verbal or nonverbal communication shapes the robot encounter.',
      'Use this when participants talk to peers about the robot, greet the robot, laugh, ask questions, warn others, or coordinate movement.',
      'Use this when communication clarifies or changes interpretation.'
    ],
    whenNotToCode: [
      'Do not code communication when there is no meaningful communication.',
      'Do not use this only because the interview itself contains speech.',
      'Do not confuse internal interpretation with communication unless something is expressed or exchanged.'
    ],
    examples: [
      'Two participants discussed whether the robot was autonomous before deciding to approach.',
      'A participant greeted the robot because the face made it seem socially present.',
      'A participant did not communicate with the robot and only adjusted their path.'
    ],
    relatedFactors: ['Participants', 'Group Size', 'Framing', 'Media-Based and Performative Mediation'],
    section: 'Definition of Situation'
  },

  'Causes': {
    factor: 'Causes',
    description: 'The participant’s explanation for why they or others behaved in a certain way.',
    whenToCode: [
      'Code this when the participant gives a reason for their response.',
      'Use this when they explain behavior through the robot’s appearance, movement, context, peers, emotions, uncertainty, norms, or environment.',
      'Use this as a causal explanation that connects interpretation to response.'
    ],
    whenNotToCode: [
      'Do not use this as a vague catch-all for every factor.',
      'Do not invent causes that the participant does not state or strongly imply.',
      'Do not duplicate other factors unless you are specifically capturing the participant’s own explanation of why something happened.'
    ],
    examples: [
      'The participant moved away because the robot looked delicate and unpredictable.',
      'A participant interacted because the blinking eyes made the robot seem friendly.',
      'A participant avoided the robot because they did not understand its purpose.'
    ],
    relatedFactors: ['Framing', 'Uncertainty', 'Emotional State', 'Media-Based and Performative Mediation', 'Decision'],
    section: 'Definition of Situation'
  },

  'Emotional State': {
    factor: 'Emotional State',
    description: 'The participant’s affective reaction and whether it shapes the interaction.',
    whenToCode: [
      'Code this when the participant expresses emotion, mood, affect, comfort, discomfort, curiosity, amusement, fear, concern, annoyance, excitement, or neutrality.',
      'Use the participant’s own wording where possible.',
      'Use this when emotion influences willingness to approach, avoid, trust, greet, or keep distance.'
    ],
    whenNotToCode: [
      'Do not infer strong emotion without evidence.',
      'Do not exaggerate mild reactions.',
      'Do not write “happy” or “scared” unless the participant clearly says or strongly indicates it.'
    ],
    examples: [
      'The participant had a mild positive reaction, describing the robot as cool and the eyes as cute.',
      'The participant felt physically cautious but not socially uncomfortable.',
      'The participant felt confused because the robot’s purpose was unclear.'
    ],
    relatedFactors: ['Individual Specifics', 'Context', 'Framing', 'Decision'],
    section: 'Definition of Situation'
  },

  'Media-Based and Performative Mediation': {
    factor: 'Media-Based and Performative Mediation',
    description: 'How the robot’s body, display, face, movement, hardware, and performance construct meaning in the interaction.',
    whenToCode: [
      'Code this when the robot’s physical or performative presence shapes interpretation.',
      'Use this for blinking eyes, screen face, voice, movement style, speed, height, exposed hardware, laptop, camera, sensors, or body shape.',
      'Use this when the robot’s appearance or behavior makes it seem cute, fragile, human-like, awkward, legitimate, intrusive, safe, unsafe, or approachable.'
    ],
    whenNotToCode: [
      'Do not simply list robot features without explaining how they shaped meaning.',
      'Do not code general attitudes toward robots unless tied to this robot’s actual appearance or behavior.',
      'Do not say a feature mattered unless the transcript or observation supports it.'
    ],
    examples: [
      'The blinking eyes made the robot seem cute and more socially approachable.',
      'The tall skinny body and laptop made the robot seem fragile and easy to knock over.',
      'A live face may make the robot feel more like a person-mediated presence than an autonomous machine.'
    ],
    relatedFactors: ['Robot\'s Specifics', 'Framing', 'Expectations', 'Emotional State'],
    section: 'Definition of Situation'
  },

  'Response Option': {
    factor: 'Response Option',
    description: 'The possible actions the participant sees as available in the situation.',
    whenToCode: [
      'Code this when the participant describes or implies possible ways they could respond.',
      'Use this for options such as approach, ignore, greet, move away, wait, stop, ask questions, help, avoid, watch, or continue walking.',
      'Use this to capture the perceived choice set before the final decision.'
    ],
    whenNotToCode: [
      'Do not use this only for the action the participant actually took.',
      'Do not confuse response options with the final decision.',
      'Do not invent options that the participant did not perceive or that are not obvious from the situation.'
    ],
    examples: [
      'The participant could continue walking normally, approach the robot, or keep extra distance.',
      'The participant selected distance as the safest response option.',
      'A participant may choose between greeting the robot or treating it as equipment.'
    ],
    relatedFactors: ['Uncertainty', 'Consequences', 'Decision', 'Rule Selection'],
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
