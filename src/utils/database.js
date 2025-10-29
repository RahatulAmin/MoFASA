const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');
const { app } = require('electron');

function getDatabasePath() {
  const isDev = !app || !app.isPackaged;

  if (isDev) {
    // Use relative path during development
    const dataDir = path.join(__dirname, '../../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    return path.join(dataDir, 'mofasa.sqlite3');
  } else {
    // When packaged, first try the extraResources path
    let dataDir = path.join(process.resourcesPath, 'data');
    
    // If that doesn't exist, try the app.asar.unpacked path
    if (!fs.existsSync(dataDir)) {
      dataDir = path.join(process.resourcesPath, 'app.asar.unpacked', 'data');
    }
    
    // If still doesn't exist, create in userData
    if (!fs.existsSync(dataDir)) {
      dataDir = path.join(app.getPath('userData'), 'data');
    }
    
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'mofasa.sqlite3');
    
    // If database doesn't exist in the final location, try to copy from resources
    if (!fs.existsSync(dbPath)) {
      const possibleSourcePaths = [
        path.join(process.resourcesPath, 'data', 'mofasa.sqlite3'),
        path.join(process.resourcesPath, 'app.asar.unpacked', 'data', 'mofasa.sqlite3')
      ];
      
      for (const sourcePath of possibleSourcePaths) {
        if (fs.existsSync(sourcePath)) {
          console.log(`Copying database from ${sourcePath} to ${dbPath}`);
          fs.copyFileSync(sourcePath, dbPath);
          break;
        }
      }
    }
    
    return dbPath;
  }
}

const dbPath = getDatabasePath();

// Log the path for debugging
console.log("Resolved DB Path:", dbPath);

let db;

// Initialize database function
async function initializeDatabase() {
  try {
    if (!db) {
      console.log('Creating new database connection to:', dbPath);
      db = new Database(dbPath);
    }
    
    // Ensure database connection is working
    db.exec('SELECT 1');
    console.log('Database connection verified');
    
    // Check if database needs migration
    if (needsMigration()) {
      console.log('Database migration needed, initializing tables...');
      initializeTables();
      console.log('Database migration completed');
    } else {
      console.log('Database is up to date');
    }
    
    return true;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    console.error('Database path:', dbPath);
    console.error('Database exists:', fs.existsSync(dbPath));
    throw error;
  }
}

// Initialize database connection
try {
  db = new Database(dbPath);
} catch (error) {
  console.error('Failed to create database connection:', error);
  db = null;
}

// Function to check if migration is needed
function needsMigration() {
  if (!db) {
    console.log('Database: No database connection, migration needed');
    return true;
  }
  
  try {
    // Check if project_questions table exists
    const projectQuestionsTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='project_questions'
    `).get();
    
    if (!projectQuestionsTableExists) {
      console.log('Database: project_questions table missing - migration needed');
      return true; // Migration needed - project_questions table doesn't exist
    }
    
    // Check if questionnaire table exists
    const questionnaireTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='questionnaire'
    `).get();
    
    if (!questionnaireTableExists) {
      console.log('Database: questionnaire table missing - migration needed');
      return true; // Migration needed - questionnaire table doesn't exist
    }
    
    // Check if scopes table exists
    const scopesTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='scopes'
    `).get();
    
    if (!scopesTableExists) {
      console.log('Database: scopes table missing - migration needed');
      return true; // Migration needed - scopes table doesn't exist
    }
    
    // Check if scope_rules table exists
    const scopeRulesTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='scope_rules'
    `).get();
    
    if (!scopeRulesTableExists) {
      console.log('Database: scope_rules table missing - migration needed');
      return true; // Migration needed - scope_rules table doesn't exist
    }

    // Check if undesirable_rules table exists
    const undesirableRulesTableExists = db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='undesirable_rules'
    `).get();
    
    if (!undesirableRulesTableExists) {
      console.log('Database: undesirable_rules table missing - migration needed');
      return true; // Migration needed - undesirable_rules table doesn't exist
    }
    
    // Check if projects table has the new structure
    const columns = db.prepare("PRAGMA table_info(projects)").all();
    const columnNames = columns.map(col => col.name);
    
    // If projects table doesn't have 'description' column, migration is needed
    if (!columnNames.includes('description')) {
      console.log('Database: projects table missing description column - migration needed');
      return true;
    }
    
    // Check if projects table has robotType and studyType columns
    if (!columnNames.includes('robotType') || !columnNames.includes('studyType')) {
      console.log('Database: projects table missing robotType or studyType columns - migration needed');
      return true;
    }
    
    // Check if project_questions table has the section column
    const projectQuestionsColumns = db.prepare("PRAGMA table_info(project_questions)").all();
    const projectQuestionsColumnNames = projectQuestionsColumns.map(col => col.name);
    
    if (!projectQuestionsColumnNames.includes('section')) {
      console.log('Database: project_questions table missing section column - migration needed');
      return true;
    }
    
    // Check if questionnaire table has the factors column
    const questionnaireColumns = db.prepare("PRAGMA table_info(questionnaire)").all();
    const questionnaireColumnNames = questionnaireColumns.map(col => col.name);
    
    if (!questionnaireColumnNames.includes('factors')) {
      console.log('Database: questionnaire table missing factors column - migration needed');
      return true;
    }

    // Check if factors table exists
    const factorsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='factors'").get();
    if (!factorsTableExists) {
      console.log('Database: factors table missing - migration needed');
      return true;
    }

    // Check if question_factors table exists
    const questionFactorsTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='question_factors'").get();
    if (!questionFactorsTableExists) {
      console.log('Database: question_factors table missing - migration needed');
      return true;
    }
    
    console.log('Database: No migration needed - all tables exist with correct structure');
    return false;
  } catch (error) {
    console.log('Database: Error checking migration status:', error);
    return true; // Migration needed if there's any error
  }
}

// Function to perform migration
function performMigration() {
  console.log('Database: Performing migration to new scope-based structure...');
  
  try {
    // Check what's missing and only add what we need
    const tables = db.prepare(`
      SELECT name FROM sqlite_master WHERE type='table'
    `).all();
    
    const existingTables = new Set(tables.map(t => t.name));
    console.log('Existing tables:', Array.from(existingTables));
    
    // Only create the undesirable_rules table if it doesn't exist
    if (!existingTables.has('undesirable_rules')) {
      console.log('Creating undesirable_rules table...');
      db.exec(`
        CREATE TABLE undesirable_rules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          scopeId INTEGER NOT NULL,
          rule TEXT NOT NULL,
          createdAt TEXT,
          updatedAt TEXT,
          UNIQUE(scopeId, rule)
        );
        
        CREATE INDEX idx_undesirable_rules_fk ON undesirable_rules(scopeId);
      `);
      console.log('undesirable_rules table created successfully');
      return;
    }
    
    // If we need a full migration (no core tables exist), do the full setup
    if (!existingTables.has('scopes') || !existingTables.has('project_questions')) {
      console.log('Performing full migration - missing core scope tables...');
      
      // Disable foreign keys before dropping
      db.exec('PRAGMA foreign_keys = OFF;');
      
      // Drop all existing tables if they exist, but preserve project_questions if it has data
      const projectQuestionsCount = db.prepare('SELECT COUNT(*) as count FROM project_questions').get();
      const hasProjectQuestionsData = projectQuestionsCount && projectQuestionsCount.count > 0;
      
      if (hasProjectQuestionsData) {
        console.log('Database: Preserving existing project_questions data during migration');
        // Create a backup of project_questions data
        const backupData = db.prepare('SELECT * FROM project_questions').all();
        
        // Drop all tables except project_questions
        db.exec(`
          DROP TABLE IF EXISTS situation_design;
          DROP TABLE IF EXISTS participant_answers;
          DROP TABLE IF EXISTS participants;
          DROP TABLE IF EXISTS scope_rules;
          DROP TABLE IF EXISTS scopes;
          DROP TABLE IF EXISTS questionnaire;
          DROP TABLE IF EXISTS projects;
          DROP TABLE IF EXISTS factors;
          DROP TABLE IF EXISTS question_factors;
          DROP TABLE IF EXISTS undesirable_rules;
          DROP TABLE IF EXISTS project_participant_data;
        `);
        
        // Re-enable foreign keys
        db.exec('PRAGMA foreign_keys = ON;');
        
        // Restore project_questions data after tables are recreated
        if (backupData.length > 0) {
          const insertProjectQuestion = db.prepare(`
            INSERT INTO project_questions (projectId, questionId, section, isEnabled, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?)
          `);
          
          for (const row of backupData) {
            insertProjectQuestion.run(
              row.projectId,
              row.questionId,
              row.section,
              row.isEnabled,
              row.createdAt,
              row.updatedAt
            );
          }
          console.log('Database: Restored', backupData.length, 'project_questions entries');
        }
      } else {
        // No project_questions data to preserve, drop everything
        db.exec(`
          DROP TABLE IF EXISTS situation_design;
          DROP TABLE IF EXISTS participant_answers;
          DROP TABLE IF EXISTS participants;
          DROP TABLE IF EXISTS scope_rules;
          DROP TABLE IF EXISTS scopes;
          DROP TABLE IF EXISTS project_questions;
          DROP TABLE IF EXISTS questionnaire;
          DROP TABLE IF EXISTS projects;
          DROP TABLE IF EXISTS factors;
          DROP TABLE IF EXISTS question_factors;
          DROP TABLE IF EXISTS undesirable_rules;
          DROP TABLE IF EXISTS project_participant_data;
        `);
        
        // Re-enable foreign keys
        db.exec('PRAGMA foreign_keys = ON;');
      }
    } else {
      console.log('Core tables exist, migration not needed');
      return;
    }
    
    // Create tables without foreign key constraints first
    const createTablesWithoutFK = `
    -- Projects table
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      robotType TEXT,
      studyType TEXT,
      rules TEXT,
      summaryPrompt TEXT,
      createdAt TEXT,
      updatedAt TEXT
    );

    -- Questionnaire table
    CREATE TABLE questionnaire (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      section TEXT NOT NULL,
      questionId TEXT NOT NULL,
      questionText TEXT NOT NULL,
      questionType TEXT DEFAULT 'text',
      options TEXT,
      factors TEXT,
      isEnabled BOOLEAN DEFAULT 1,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(section, questionId)
    );

    -- Factors table
    CREATE TABLE factors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      factor_name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      examples TEXT,
      related_factors TEXT,
      research_notes TEXT,
      section TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    -- Question-Factor relationship table (without foreign key constraint initially)
    CREATE TABLE question_factors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT NOT NULL,
      factor_name TEXT NOT NULL,
      created_at TEXT,
      UNIQUE(question_id, factor_name)
    );

    -- Project questions table (without foreign key constraints initially)
    CREATE TABLE project_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      questionId TEXT NOT NULL,
      section TEXT NOT NULL,
      isEnabled BOOLEAN DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(projectId, questionId)
    );

    -- Scopes table
    CREATE TABLE scopes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      scopeNumber INTEGER NOT NULL,
      scopeText TEXT NOT NULL,
      isActive BOOLEAN DEFAULT 1,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(projectId, scopeNumber)
    );

    -- Scope rules table
    CREATE TABLE scope_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scopeId INTEGER NOT NULL,
      rule TEXT NOT NULL,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT
    );

    -- Participants table
    CREATE TABLE participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      projectId INTEGER NOT NULL,
      scopeId INTEGER NOT NULL,
      participantId TEXT NOT NULL,
      name TEXT NOT NULL,
      summary TEXT,
      interviewText TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(projectId, scopeId, participantId)
    );

    -- Participant answers table
    CREATE TABLE participant_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      participantId INTEGER NOT NULL,
      section TEXT NOT NULL,
      question TEXT NOT NULL,
      answer TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(participantId, section, question)
    );

    -- Situation design table
    CREATE TABLE situation_design (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scopeId INTEGER NOT NULL,
      robotChanges TEXT,
      environmentalChanges TEXT,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(scopeId)
    );

    -- Undesirable rules table
    CREATE TABLE undesirable_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scopeId INTEGER NOT NULL,
      rule TEXT NOT NULL,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(scopeId, rule)
    );
    `;
    
    db.exec(createTablesWithoutFK);
    
    // Try to add foreign key constraints separately
    try {
      db.exec(`
        -- Add foreign key constraints
        PRAGMA foreign_keys = ON;
        
        -- Add foreign key constraints to project_questions
        CREATE INDEX idx_project_questions_fk ON project_questions(projectId, questionId, section);
        
        -- Add foreign key constraints to scopes
        CREATE INDEX idx_scopes_fk ON scopes(projectId);
        
        -- Add foreign key constraints to scope_rules
        CREATE INDEX idx_scope_rules_fk ON scope_rules(scopeId);
        
        -- Add foreign key constraints to participants
        CREATE INDEX idx_participants_fk ON participants(projectId, scopeId);
        
        -- Add foreign key constraints to participant_answers
        CREATE INDEX idx_participant_answers_fk ON participant_answers(participantId);
        
        -- Add foreign key constraints to situation_design
        CREATE INDEX idx_situation_design_fk ON situation_design(scopeId);
        
        -- Add foreign key constraints to undesirable_rules
        CREATE INDEX idx_undesirable_rules_fk ON undesirable_rules(scopeId);
      `);
    } catch (fkError) {
      console.log('Database: Foreign key constraints failed, continuing without them:', fkError.message);
    }
    
    // Populate questionnaire table with default questions
    const insertQuestion = db.prepare(`
      INSERT INTO questionnaire (section, questionId, questionText, questionType, options, factors, orderIndex, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    
        // Situation questions
    const situationQuestions = [
      { id: 'when', text: 'When and where did the interaction happen?', type: 'text', factors: 'Time,Place', order: 0 },
      { id: 'participant', text: 'Who are the interacting agents in the interaction, and what are their roles?', type: 'text', factors: 'Participants,Role Identities', order: 1 },
      { id: 'in_group', text: 'How many humans were interacting with the robot?', type: 'text', factors: 'Group Size', order: 2 },
      { id: 'social_motive', text: 'What was their social motive or intention for interacting with the robot?', type: 'text', factors: 'Social Motive,Intention', order: 3 },
      { id: 'robot_specifics', text: 'What is the type of the robot? What features does it have and what can it do?', type: 'text', factors: 'Robot Specifics', order: 4 },
    ];
    
    // Identity questions
    const identityQuestions = [
      { id: 'age', text: 'Age range of the participant(s)', type: 'dropdown', options: JSON.stringify(['18-24', '25-34', '35-44', '45-54', '55-64', '65+']), factors: 'Age-Range', order: 0 },
      { id: 'gender', text: 'Gender of the participant(s)', type: 'dropdown', options: JSON.stringify(['Male', 'Female', 'Non-Binary', 'Other']), factors: 'Gender', order: 1 },
      { id: 'nationality', text: 'Nationality of the participant(s)', type: 'text', factors: 'Nationality', order: 2 },
      { id: 'occupation', text: 'Occupation of the participant(s)', type: 'text', factors: 'Occupation', order: 3 },
      { id: 'education', text: 'Education level of the participant(s)', type: 'text', factors: 'Background', order: 4 },
      { id: 'personal_history', text: 'Do they have previous experience of interacting with robots?', type: 'text', factors: 'Personal History', order: 5 },
      { id: 'perception', text: 'Do they have any specific preferences for the interaction? Does their personal characteristics and how they shape their social role influence the interaction?', type: 'text', factors: 'Individual Specifics', order: 6 },
      { id: 'social_rules', text: 'Do they have any habit, follow certain social values, social norms, or regulative norms?', type: 'text', factors: 'Standards of Customary Practices', order: 7 }
    ];
    
    // Definition of Situation questions
    const definitionQuestions = [
      { id: 'uncertainty', text: 'Are the individuals uncertain about how the situation will unfold?', type: 'text', factors: 'Uncertainty', order: 0 },
      { id: 'familiarity', text: 'How well does the interacting agents know each other and what is the nature of their relationship (casual or formal)?', type: 'text', factors: 'Familiarity and Relationship Aspect', order: 1 },
      { id: 'context_perception', text: 'How does the participant perceive the framing or context of the interaction?', type: 'text', factors: 'Context', order: 2 },
      { id: 'power_dynamics', text: 'What is the power dynamics between the interacting agents?', type: 'text', factors: 'Power and Status', order: 3 },
      { id: 'group_interaction', text: 'If multiple humans are present: How is the group dynamics? Did they communicate with each other?', type: 'text', factors: 'Context', order: 4 },
      { id: 'emotional_state', text: 'Did the emotional state of the participant at that very moment influence the interaction in any way?', type: 'text', factors: 'Emotional State', order: 5 },
      { id: 'media', text: 'How does the robot\'s presence and performance—through its body, media, and behavior - constructs meaning in this interaction?', type: 'text', factors: 'Media-Based and Performative Mediation', order: 6 },
    ];
    
    // Rule Selection questions
    const ruleSelectionQuestions = [
      { id: 'options', text: 'What options did the participant(s) have to make their decision?', type: 'text', order: 0 }
    ];
    
    // Decision questions
    const decisionQuestions = [
      { id: 'final_decision', text: 'What was their final decision or course of action?', type: 'text', order: 0 }
    ];
    
    // Insert all questions
    const allQuestions = [
      ...situationQuestions.map(q => ({ ...q, section: 'Situation' })),
      ...identityQuestions.map(q => ({ ...q, section: 'Identity' })),
      ...definitionQuestions.map(q => ({ ...q, section: 'Definition of Situation' })),
      ...ruleSelectionQuestions.map(q => ({ ...q, section: 'Rule Selection' })),
      ...decisionQuestions.map(q => ({ ...q, section: 'Decision' }))
    ];
    
    for (const question of allQuestions) {
      insertQuestion.run(
        question.section,
        question.id,
        question.text,
        question.type,
        question.options || null,
        question.factors || null,
        question.order,
        now,
        now
      );
    }

    // Populate factors table with initial data
    const insertFactor = db.prepare(`
      INSERT INTO factors (factor_name, description, examples, related_factors, research_notes, section, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const initialFactors = [
      {
        name: 'Time',
        category: 'Situation',
        description: 'The temporal characteristics of the interaction, such as time of day or urgency.',
        examples: [
          'Morning interactions may feel more formal',
          'Late evening visits might encourage relaxed behavior',
          'Time pressure affects how quickly decisions are made'
        ],
        relatedFactors: ['Context', 'Schedule'],
        researchNotes: 'Time influences social expectations and behavioral patterns in HRI, including perceived urgency or appropriateness.',
        section: 'Situation'
      },
      {
        name: 'Place',
        category: 'Situation',
        description: 'The physical and social setting of the interaction.',
        examples: [
          'Libraries expect quieter, more respectful behavior',
          'Private spaces may allow more openness',
          'Different environments set different norms'
        ],
        relatedFactors: ['Context', 'Privacy', 'Environment'],
        researchNotes: 'Physical location shapes norms and interpretations of robot behavior.',
        section: 'Situation'
      },
      {
        name: 'Participants',
        category: 'Situation',
        description: 'Who is present in the interaction and how their presence affects behavior.',
        examples: [
          'Being alone with the robot vs in a group',
          'Children may act differently with parents nearby',
          'Observers may affect someone’s behavior'
        ],
        relatedFactors: ['Group Size', 'Social Pressure'],
        researchNotes: 'Social presence influences interaction dynamics and decision-making.',
        section: 'Situation'
      },
      {
        name: 'Group Size',
        category: 'Situation',
        description: 'The number of people involved in the interaction.',
        examples: [
          'One-on-one interactions allow more depth',
          'Larger groups create performance pressure',
          'Anonymity increases in crowds'
        ],
        relatedFactors: ['Participants', 'Social Dynamics'],
        researchNotes: 'Group size influences how visible and socially accountable a person feels.',
        section: 'Situation'
      },
      {
        name: 'Role Identities',
        category: 'Identity',
        description: 'The formal or informal roles individuals perceive themselves as holding.',
        examples: [
          'A teacher may feel responsible for group behavior',
          'A customer may expect service',
          'A researcher may stay analytical'
        ],
        relatedFactors: ['Authority', 'Norms', 'Status'],
        researchNotes: 'Perceived role shapes expectations and perceived obligations in HRI.',
        section: 'Identity'
      },
      {
        name: 'Background',
        category: 'Identity',
        description: 'Demographic and experiential characteristics that shape a participant’s worldview.',
        examples: [
          'Older adults may be more hesitant with robots',
          'Cultural norms influence engagement style',
          'Language fluency affects interpretation of prompts'
        ],
        relatedFactors: ['Culture', 'Personal History', 'Demographics'],
        researchNotes: 'Background shapes trust, familiarity, and engagement in technology contexts.',
        section: 'Identity'
      },
      {
        name: 'Social Motive',
        category: 'Identity',
        description: 'The underlying reason for engaging with the robot or the situation.',
        examples: [
          'Curiosity to try new tech',
          'Desire to help with a study',
          'Need for assistance in a task'
        ],
        relatedFactors: ['Intent', 'Goal', 'Purpose'],
        researchNotes: 'Motives influence engagement depth and perceived outcomes.',
        section: 'Identity'
      },
      {
        name: 'Personal History',
        category: 'Identity',
        description: 'Prior experience with technology, robots, or similar interactions.',
        examples: [
          'Early exposure to assistive robots in school',
          'Negative past interactions may cause avoidance',
          'Frequent users may act with confidence'
        ],
        relatedFactors: ['Familiarity', 'Trust', 'Expectations'],
        researchNotes: 'Past experience often informs expectations and behavior in present situations.',
        section: 'Identity'
      },
      {
        name: 'Individual Specifics',
        category: 'Identity',
        description: 'How individuals see themselves in terms of confidence, competence, and control.',
        examples: [
          'A confident person may challenge the robot’s suggestions',
          'Self-conscious participants may follow quietly',
          'Some may act performatively if being observed'
        ],
        relatedFactors: ['Self-Image', 'Agency', 'Confidence'],
        researchNotes: 'Self-perception shapes the style and tone of engagement.',
        section: 'Identity'
      },
      {
        name: 'Uncertainty',
        category: 'Definition of Situation',
        description: 'Level of ambiguity or confusion participants experience about the interaction.',
        examples: [
          'Not knowing what the robot is doing',
          'Being unsure of the robot’s capabilities',
          'Unclear social norms for interacting with robots'
        ],
        relatedFactors: ['Risk', 'Anxiety', 'Expectations'],
        researchNotes: 'Uncertainty affects willingness to engage and choice of action.',
        section: 'Definition of Situation'
      },
      {
        name: 'Consequences',
        category: 'Definition of Situation',
        description: 'Perceived weight or risk of the outcomes related to their choices.',
        examples: [
          'Choosing to follow the robot might waste time',
          'Engaging may affect how others view them',
          'Perceived stakes influence behavior'
        ],
        relatedFactors: ['Risk', 'Impact', 'Responsibility'],
        researchNotes: 'Consequences help shape behavioral thresholds — what’s worth doing.',
        section: 'Definition of Situation'
      },
      {
        name: 'Context',
        category: 'Definition of Situation',
        description: 'The broader set of conditions and expectations surrounding the interaction.',
        examples: [
          'A study setting vs natural use in a library',
          'HRI demo vs daily-use robot',
          'Personal vs public robot use'
        ],
        relatedFactors: ['Place', 'Time', 'Purpose'],
        researchNotes: 'Context is the lens through which all other factors are interpreted.',
        section: 'Definition of Situation'
      },
      {
        name: 'Power and Status',
        category: 'Definition of Situation',
        description: 'Perceived authority, control, or influence within the interaction.',
        examples: [
          'A staff robot issuing instructions to visitors',
          'Participants feeling observed or tested',
          'Robots treated with obedience or defiance depending on perceived role'
        ],
        relatedFactors: ['Authority', 'Compliance', 'Resistance'],
        researchNotes: 'Power shapes reactions, including resistance, submission, or testing behavior.',
        section: 'Definition of Situation'
      },
      {
        name: 'Standards of Customary Practices',
        category: 'Definition of Situation',
        description: 'Social norms and institutional rules that define “appropriate” behavior.',
        examples: [
          'Library behavior norms (quiet, respectful)',
          'Social etiquette like saying thank you',
          'Expectations based on previous tech usage'
        ],
        relatedFactors: ['Norms', 'Culture', 'Rules'],
        researchNotes: 'These rules help participants decide how to act in ambiguous situations.',
        section: 'Definition of Situation'
      },
      {
        name: 'Emotional State',
        category: 'Identity',
        description: 'The participant’s mood or affective state during the interaction.',
        examples: [
          'Stress reduces patience',
          'Excitement encourages engagement',
          'Fatigue may cause disinterest'
        ],
        relatedFactors: ['Mood', 'Affect', 'Well-being'],
        researchNotes: 'Emotions influence perception, attention, and social decision-making.',
        section: 'Definition of Situation'
      }
    ];

    for (const factor of initialFactors) {
      insertFactor.run(
        factor.name,
        factor.description,
        JSON.stringify(factor.examples),
        JSON.stringify(factor.relatedFactors),
        factor.researchNotes,
        factor.section,
        now,
        now
      );
    }

    // Populate question_factors table with initial relationships
    const insertQuestionFactor = db.prepare(`
      INSERT INTO question_factors (question_id, factor_name, created_at) 
      VALUES (?, ?, ?)
    `);

    // Map questions to their factors (based on the current factors column)
    const questionFactorMappings = [
      { questionId: 'when', factorName: 'Time' },
      { questionId: 'where', factorName: 'Place' },
      { questionId: 'agents_count', factorName: 'Participants' },
      { questionId: 'in_group', factorName: 'Group Size' },
      { questionId: 'roles', factorName: 'Role Identities' },
      { questionId: 'age', factorName: 'Age-Range' },
      { questionId: 'gender', factorName: 'Gender' },
      { questionId: 'nationality', factorName: 'Nationality' },
      { questionId: 'occupation', factorName: 'Occupation' },
      { questionId: 'education', factorName: 'Background' },
      { questionId: 'social_motive', factorName: 'Social Motive' },
      { questionId: 'personal_history', factorName: 'Personal History' },
      { questionId: 'perception', factorName: 'Individual Specifics' },
      { questionId: 'uncertainty', factorName: 'Uncertainty' },
      { questionId: 'consequences', factorName: 'Consequences' },
      { questionId: 'familiarity', factorName: 'Familiarity and Relationship Aspect' },
      { questionId: 'context_perception', factorName: 'Context' },
      { questionId: 'power_dynamics', factorName: 'Power and Status' },
      { questionId: 'group_interaction', factorName: 'Context' },
      { questionId: 'social_rules', factorName: 'Standards of Customary Practices, Causes' },
      { questionId: 'emotional_state', factorName: 'Emotional State' },
      { questionId: 'robot_specifics', factorName: 'Robot Specifics' },
      { questionId: 'media', factorName: 'Media-Based and Performative Mediation' },
      { questionId: 'communication', factorName: 'Communication' },
      { questionId: 'causes', factorName: 'Causes' },
      { questionId: 'expectations', factorName: 'Expectations' },
      { questionId: 'intention', factorName: 'Intention'}
      // { questionId: 'options', factorName: 'Rules' },
      // { questionId: 'final_decision', factorName: 'Decision' }
    ];

    for (const mapping of questionFactorMappings) {
      insertQuestionFactor.run(mapping.questionId, mapping.factorName, now);
    }
    
    // Add foreign key constraint after factors are populated
    try {
      db.exec(`
        -- Add foreign key constraint to question_factors table
        PRAGMA foreign_keys = ON;
        CREATE INDEX idx_question_factors_fk ON question_factors(factor_name);
      `);
      console.log('Database: Foreign key constraint added successfully');
    } catch (fkError) {
      console.log('Database: Foreign key constraint failed, continuing without it:', fkError.message);
    }
    
    console.log('Database: Migration completed successfully');
  } catch (error) {
    console.error('Database: Migration failed:', error);
    throw error;
  }
}

// Function to update existing question-factor mappings
function updateQuestionFactorMappings() {
  try {
    // console.log('Database: Updating question-factor mappings...'); // Commented out verbose logging
    
    // // Check what factor is currently set for social_rules in the database
    // const currentFactor = db.prepare(`
    //   SELECT factors FROM questionnaire WHERE questionId = ?
    // `).get('social_rules');
    
    // // Only update if the factor is not already set correctly
    // if (currentFactor && currentFactor.factors !== 'Place') {
    //   // Update the social_rules question to use "Place" (as per user's preference)
    //   const updateMapping = db.prepare(`
    //     UPDATE question_factors 
    //     SET factor_name = ? 
    //     WHERE question_id = ?
    //   `);
      
    //   updateMapping.run('Place', 'social_rules');
      
    //   // Also update the question itself to have the correct factors field
    //   const updateQuestion = db.prepare(`
    //     UPDATE questionnaire 
    //     SET factors = ? 
    //     WHERE questionId = ?
    //   `);
      
    //   updateQuestion.run('Place', 'social_rules');
    // }
    
    // console.log('Database: Question-factor mappings updated successfully'); // Commented out verbose logging
  } catch (error) {
    console.error('Database: Failed to update question-factor mappings:', error);
  }
}

// Function to update factors table with section information
function updateFactorsWithSections() {
  try {
    // console.log('Database: Updating factors with section information...'); // Commented out verbose logging
    
    // Check if section column exists, if not add it
    const tableInfo = db.prepare("PRAGMA table_info(factors)").all();
    const hasSectionColumn = tableInfo.some(col => col.name === 'section');
    
    if (!hasSectionColumn) {
      // console.log('Database: Adding section column to factors table...'); // Commented out verbose logging
      db.prepare('ALTER TABLE factors ADD COLUMN section TEXT').run();
    }
    
    // Simple factor sections mapping
    const factorSections = {
      'Time': 'Situation',
      'Place': 'Situation',
      'Participants': 'Situation',
      'Group Size': 'Situation',
      'Role Identities': 'Identity',
      'Age-Range': 'Identity',
      'Gender': 'Identity',
      'Nationality': 'Identity',
      'Occupation': 'Identity',
      'Background': 'Identity',
      'Social Motive': 'Situation',
      'Personal History': 'Identity',
      'Individual Specifics': 'Identity',
      'Uncertainty': 'Definition of Situation',
      'Consequences': 'Definition of Situation',
      'Context': 'Definition of Situation',
      'Power and Status': 'Definition of Situation',
      'Standards of Customary Practices': 'Definition of Situation',
      'Emotional State': 'Identity',
      'Robot Specifics': 'Definition of Situation',
      'Media-Based and Performative Mediation': 'Definition of Situation',
      'Communication': 'Definition of Situation',
      'Causes': 'Definition of Situation',
      'Expectations': 'Definition of Situation',
      'Intention': 'Situation',
      'Familiarity and Relationship Aspect': 'Definition of Situation',
    };
    
    const now = new Date().toISOString();
    
    // First, ensure all factors exist with proper data
    const insertOrReplaceFactor = db.prepare(`
      INSERT OR REPLACE INTO factors (factor_name, description, examples, related_factors, research_notes, section, created_at, updated_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // Insert missing factors that might not exist
    const missingFactors = [
      {
        name: 'Age-Range',
        description: 'The age group or demographic range of the participant.',
        examples: ['Younger participants may be more tech-savvy', 'Older adults may prefer traditional interactions'],
        relatedFactors: ['Background', 'Personal History'],
        researchNotes: 'Age influences comfort level and expectations with technology.'
      },
      {
        name: 'Gender',
        description: 'The gender identity of the participant and how it influences interaction style.',
        examples: ['Gender may affect communication preferences', 'Different comfort levels with technology'],
        relatedFactors: ['Background', 'Social Norms'],
        researchNotes: 'Gender can influence interaction patterns and technology acceptance.'
      },
      {
        name: 'Nationality',
        description: 'Cultural background and national origin that shapes interaction expectations.',
        examples: ['Cultural norms vary by country', 'Language influences interaction style'],
        relatedFactors: ['Background', 'Culture'],
        researchNotes: 'National culture affects social norms and technology interactions.'
      },
      {
        name: 'Occupation',
        description: 'Professional background that influences interaction approach and expectations.',
        examples: ['Engineers may be more analytical', 'Teachers may be more patient'],
        relatedFactors: ['Background', 'Personal History'],
        researchNotes: 'Professional experience shapes how people approach new technology.'
      },
      {
        name: 'Background',
        description: 'Demographic and experiential characteristics that shape a participant\'s worldview.',
        examples: ['Older adults may be more hesitant with robots', 'Cultural norms influence engagement style'],
        relatedFactors: ['Culture', 'Personal History'],
        researchNotes: 'Background shapes trust and familiarity in technology contexts.'
      },
      {
        name: 'Social Motive',
        description: 'The underlying reason for engaging with the robot or the situation.',
        examples: ['Curiosity to try new tech', 'Desire to help with a study'],
        relatedFactors: ['Intent', 'Goal'],
        researchNotes: 'Motives influence engagement depth and perceived outcomes.'
      },
      {
        name: 'Personal History',
        description: 'Previous exposure to robots, technology, or similar interactions.',
        examples: ['First-time users may be cautious', 'Experienced users have clear expectations'],
        relatedFactors: ['Personal History', 'Familiarity'],
        researchNotes: 'Prior experience strongly influences behavior and comfort levels.'
      },
      {
        name: 'Individual Specifics',
        description: 'How individuals see themselves in terms of confidence, competence, and control.',
        examples: ['A confident person may challenge suggestions', 'Self-conscious participants may follow quietly'],
        relatedFactors: ['Background', 'Agency', 'Confidence'],
        researchNotes: 'Self-perception shapes the style and tone of engagement.'
      },
      {
        name: 'Standards of Customary Practices',
        description: 'Social norms and institutional rules that define appropriate behavior.',
        examples: ['Library behavior norms', 'Social etiquette like saying thank you'],
        relatedFactors: ['Norms', 'Culture'],
        researchNotes: 'These rules help participants decide how to act in ambiguous situations.'
      }
    ];
    
    for (const factor of missingFactors) {
      // console.log(`Database: Ensuring factor "${factor.name}" exists`); // Commented out verbose logging
      insertOrReplaceFactor.run(
        factor.name,
        factor.description,
        JSON.stringify(factor.examples),
        JSON.stringify(factor.relatedFactors),
        factor.researchNotes,
        factorSections[factor.name],
        now,
        now
      );
    }
    
    // Update all factors with their sections
    const updateFactorSection = db.prepare('UPDATE factors SET section = ? WHERE factor_name = ?');
    
    for (const [factorName, section] of Object.entries(factorSections)) {
      // console.log(`Database: Updating section for "${factorName}" to "${section}"`); // Commented out verbose logging
      updateFactorSection.run(section, factorName);
    }
    
    // Update Self-Perception to Individual Specifics in existing data
    // console.log('Database: Migrating Self-Perception to Individual Specifics'); // Commented out verbose logging
    
    // Update questionnaire table factors
    const updateQuestionnaireFactors = db.prepare('UPDATE questionnaire SET factors = ? WHERE factors = ?');
    updateQuestionnaireFactors.run('Individual Specifics', 'Self-Perception');
    
    // Update question_factors table
    const updateQuestionFactors = db.prepare('UPDATE question_factors SET factor_name = ? WHERE factor_name = ?');
    updateQuestionFactors.run('Individual Specifics', 'Self-Perception');
    
    // Remove old unused factors (including Self-Perception which is now Individual Specifics)
    const oldFactors = ['Rules', 'Decision', 'Self-Perception'];
    const deleteFactor = db.prepare('DELETE FROM factors WHERE factor_name = ?');
    
    for (const oldFactor of oldFactors) {
      // console.log(`Database: Removing old factor "${oldFactor}"`); // Commented out verbose logging
      deleteFactor.run(oldFactor);
    }
    
    // Check final result
    const finalFactors = db.prepare('SELECT factor_name, section FROM factors ORDER BY factor_name').all();
    // console.log('Database: Final factors:', finalFactors); // Commented out verbose logging
    
    // console.log('Database: Factors updated with section information successfully'); // Commented out verbose logging
  } catch (error) {
    console.error('Database: Failed to update factors with sections:', error);
  }
}

// Initialize database with migration if needed
if (needsMigration()) {
  console.log('Database: Running migration...');
  performMigration();
  console.log('Database: Migration completed');
}

// Always update factors and mappings to ensure consistency
// console.log('Database: Updating factors and mappings...'); // Commented out verbose logging
updateQuestionFactorMappings();
updateFactorsWithSections();

// Get all projects with their related data
function getAllProjects() {
  console.log('Database: Getting all projects');
  
  const projects = db.prepare('SELECT * FROM projects ORDER BY createdAt ASC').all();
  
  const projectsWithData = projects.map(project => {
    // Get scopes for this project
    const scopes = db.prepare(`
      SELECT * FROM scopes 
      WHERE projectId = ? 
      ORDER BY scopeNumber
    `).all(project.id);
    
    // Get participants and data for each scope
    const scopesWithData = scopes.map(scope => {
      // Get participants for this scope
      const participants = db.prepare(`
        SELECT * FROM participants 
        WHERE projectId = ? AND scopeId = ? 
        ORDER BY CAST(SUBSTR(participantId, 2) AS INTEGER)
      `).all(project.id, scope.id);
      
      // Get answers for each participant
      const participantsWithAnswers = participants.map(participant => {
        const answers = db.prepare(`
          SELECT section, question, answer 
          FROM participant_answers 
          WHERE participantId = ?
        `).all(participant.id);
        
        // Organize answers by section
        const organizedAnswers = {};
        answers.forEach(row => {
          if (!organizedAnswers[row.section]) {
            organizedAnswers[row.section] = {};
          }
          
          // Try to parse JSON values, especially for selectedRules
          let parsedValue = row.answer;
          if (row.answer && (row.question === 'selectedRules' || row.answer.startsWith('[') || row.answer.startsWith('{'))) {
            try {
              parsedValue = JSON.parse(row.answer);
            } catch (e) {
              // If parsing fails, keep the original value
              parsedValue = row.answer;
            }
          }
          
          organizedAnswers[row.section][row.question] = parsedValue;
        });
        
        return {
          id: participant.participantId,
          name: participant.name,
          summary: participant.summary,
          interviewText: participant.interviewText,
          answers: organizedAnswers
        };
      });
      
      // Get rules for this scope
      const scopeRules = db.prepare(`
        SELECT rule, orderIndex 
        FROM scope_rules 
        WHERE scopeId = ? 
        ORDER BY orderIndex
      `).all(scope.id);
      
      const rules = scopeRules.map(row => row.rule);
      
      // Get situation design for this scope
      const situationDesign = db.prepare(`
        SELECT robotChanges, environmentalChanges 
        FROM situation_design 
        WHERE scopeId = ?
      `).get(scope.id);
      
      // Get undesirable rules for this scope
      const undesirableRules = db.prepare(`
        SELECT rule FROM undesirable_rules 
        WHERE scopeId = ? 
        ORDER BY createdAt ASC
      `).all(scope.id);
      
      return {
        id: scope.id,
        scopeNumber: scope.scopeNumber,
        scopeText: scope.scopeText,
        isActive: scope.isActive,
        participants: participantsWithAnswers,
        rules: rules,
        undesirableRules: undesirableRules.map(row => row.rule),
        situationDesign: situationDesign ? {
          robotChanges: situationDesign.robotChanges,
          environmentalChanges: situationDesign.environmentalChanges
        } : null
      };
    });
    
    // Get project question settings
    const projectQuestionSettings = db.prepare(`
      SELECT questionId, section, isEnabled 
      FROM project_questions 
      WHERE projectId = ?
    `).all(project.id);
    
    // Organize project question settings by section
    const organizedProjectSettings = {};
    projectQuestionSettings.forEach(setting => {
      if (!organizedProjectSettings[setting.section]) {
        organizedProjectSettings[setting.section] = [];
      }
      organizedProjectSettings[setting.section].push({
        questionId: setting.questionId,
        isEnabled: setting.isEnabled
      });
    });
    
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      robotType: project.robotType,
      studyType: project.studyType,
      rules: project.rules ? JSON.parse(project.rules) : [],
      summaryPrompt: project.summaryPrompt,
      scopes: scopesWithData,
      projectQuestionSettings: organizedProjectSettings,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  });
  
  console.log('Database: Found', projectsWithData.length, 'projects');
  return projectsWithData;
}

// Save all projects (replace all data)
function saveAllProjects(projects) {
  console.log('Database: Saving all projects', projects.length);
  
  // Helper function to ensure valid SQLite values
  const sanitizeValue = (value) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };
  
  // Start transaction
  const transaction = db.transaction((projects) => {
    // Clear all existing data including project_questions to ensure clean import
    db.prepare('DELETE FROM situation_design').run();
    db.prepare('DELETE FROM participant_answers').run();
    db.prepare('DELETE FROM participants').run();
    db.prepare('DELETE FROM scope_rules').run();
    db.prepare('DELETE FROM scopes').run();
    db.prepare('DELETE FROM projects').run();
    db.prepare('DELETE FROM project_questions').run();
    db.prepare('DELETE FROM undesirable_rules').run();
    
    // Insert projects
    const insertProject = db.prepare(`
      INSERT INTO projects (name, description, robotType, studyType, rules, summaryPrompt, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertScope = db.prepare(`
      INSERT INTO scopes (projectId, scopeNumber, scopeText, isActive, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertParticipant = db.prepare(`
      INSERT INTO participants (projectId, scopeId, participantId, name, summary, interviewText, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertAnswer = db.prepare(`
      INSERT INTO participant_answers (participantId, section, question, answer, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertSituationDesign = db.prepare(`
      INSERT INTO situation_design (scopeId, robotChanges, environmentalChanges, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const insertScopeRule = db.prepare(`
      INSERT INTO scope_rules (scopeId, rule, orderIndex, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const project of projects) {
      // Insert project with sanitized values
      const projectInfo = insertProject.run(
        sanitizeValue(project.name),
        sanitizeValue(project.description),
        sanitizeValue(project.robotType),
        sanitizeValue(project.studyType),
        sanitizeValue(JSON.stringify(project.rules)),
        sanitizeValue(project.summaryPrompt),
        sanitizeValue(project.createdAt || new Date().toISOString()),
        sanitizeValue(project.updatedAt || new Date().toISOString())
      );
      
      const projectId = projectInfo.lastInsertRowid;
      
      // Preserve project question settings if they exist
      if (project.projectQuestionSettings) {
        const insertProjectQuestion = db.prepare(`
          INSERT INTO project_questions (projectId, questionId, section, isEnabled, updatedAt) 
          VALUES (?, ?, ?, ?, ?)
        `);
        
        for (const [section, questions] of Object.entries(project.projectQuestionSettings)) {
          for (const question of questions) {
            insertProjectQuestion.run(
              projectId,
              question.questionId,
              sanitizeValue(section),
              sanitizeValue(question.isEnabled),
              sanitizeValue(new Date().toISOString())
            );
          }
        }
      }
      
      // Insert scopes
      for (const scope of (project.scopes || [])) {
        const scopeInfo = insertScope.run(
          projectId,
          sanitizeValue(scope.scopeNumber),
          sanitizeValue(scope.scopeText),
          sanitizeValue(scope.isActive),
          sanitizeValue(scope.createdAt || new Date().toISOString()),
          sanitizeValue(scope.updatedAt || new Date().toISOString())
        );
        
        const scopeId = scopeInfo.lastInsertRowid;
        
        // Insert rules for this scope
        for (let i = 0; i < (scope.rules || []).length; i++) {
          insertScopeRule.run(
            scopeId,
            sanitizeValue(scope.rules[i]),
            i,
            sanitizeValue(new Date().toISOString()),
            sanitizeValue(new Date().toISOString())
          );
        }
        
        // Insert participants for this scope
        for (const participant of (scope.participants || [])) {
          const participantInfo = insertParticipant.run(
            projectId,
            scopeId,
            sanitizeValue(participant.id),
            sanitizeValue(participant.name),
            sanitizeValue(participant.summary),
            sanitizeValue(participant.interviewText),
            sanitizeValue(participant.createdAt || new Date().toISOString()),
            sanitizeValue(participant.updatedAt || new Date().toISOString())
          );
          
          const participantDbId = participantInfo.lastInsertRowid;
          
          // Insert answers
          for (const [section, questions] of Object.entries(participant.answers || {})) {
            for (const [question, answer] of Object.entries(questions)) {
              insertAnswer.run(
                participantDbId,
                sanitizeValue(section),
                sanitizeValue(question),
                sanitizeValue(answer),
                sanitizeValue(new Date().toISOString()),
                sanitizeValue(new Date().toISOString())
              );
            }
          }
        }
        
        // Insert situation design for this scope
        if (scope.situationDesign) {
          insertSituationDesign.run(
            scopeId,
            sanitizeValue(scope.situationDesign.robotChanges),
            sanitizeValue(scope.situationDesign.environmentalChanges),
            sanitizeValue(new Date().toISOString()),
            sanitizeValue(new Date().toISOString())
          );
        }
        
        // Insert undesirable rules for this scope
        if (scope.undesirableRules && scope.undesirableRules.length > 0) {
          const insertUndesirableRule = db.prepare(`
            INSERT INTO undesirable_rules (scopeId, rule, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?)
          `);
          
          for (const rule of scope.undesirableRules) {
            insertUndesirableRule.run(
              scopeId,
              sanitizeValue(rule),
              sanitizeValue(new Date().toISOString()),
              sanitizeValue(new Date().toISOString())
            );
          }
        }
      }
    }
  });
  
  transaction(projects);
  console.log('Database: Saved', projects.length, 'projects');
}

// Add a single project
function addProject(project) {
  console.log('Database: Adding project', project.name);
  
  const transaction = db.transaction((project) => {
    const insertProject = db.prepare(`
      INSERT INTO projects (name, description, robotType, studyType, rules, summaryPrompt, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const projectInfo = insertProject.run(
      project.name,
      project.description,
      project.robotType,
      project.studyType,
      JSON.stringify(project.rules || []),
      project.summaryPrompt,
      project.createdAt || new Date().toISOString(),
      project.updatedAt || new Date().toISOString()
    );
    
    return projectInfo.lastInsertRowid;
  });
  
  return transaction(project);
}

// Import a single project with all its data (scopes, participants, question settings, undesirable rules)
function importProject(project) {
  console.log('Database: Importing project', project.name);
  
  // Helper function to ensure valid SQLite values
  const sanitizeValue = (value) => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'boolean') {
      return value ? 1 : 0;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };
  
  const transaction = db.transaction((project) => {
    // Insert the main project
    const insertProject = db.prepare(`
      INSERT INTO projects (name, description, robotType, studyType, rules, summaryPrompt, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const projectInfo = insertProject.run(
      sanitizeValue(project.name),
      sanitizeValue(project.description),
      sanitizeValue(project.robotType),
      sanitizeValue(project.studyType),
      sanitizeValue(JSON.stringify(project.rules || [])),
      sanitizeValue(project.summaryPrompt),
      sanitizeValue(project.createdAt || new Date().toISOString()),
      sanitizeValue(project.updatedAt || new Date().toISOString())
    );
    
    const projectId = projectInfo.lastInsertRowid;
    
    // Insert project question settings if they exist
    if (project.projectQuestionSettings) {
      const insertProjectQuestion = db.prepare(`
        INSERT INTO project_questions (projectId, questionId, section, isEnabled, updatedAt) 
        VALUES (?, ?, ?, ?, ?)
      `);
      
      for (const [section, questions] of Object.entries(project.projectQuestionSettings)) {
        for (const question of questions) {
          insertProjectQuestion.run(
            projectId,
            question.questionId,
            sanitizeValue(section),
            sanitizeValue(question.isEnabled),
            sanitizeValue(new Date().toISOString())
          );
        }
      }
    }
    
    // Insert scopes and their data
    const insertScope = db.prepare(`
      INSERT INTO scopes (projectId, scopeNumber, scopeText, isActive, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertParticipant = db.prepare(`
      INSERT INTO participants (projectId, scopeId, participantId, name, summary, interviewText, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const insertAnswer = db.prepare(`
      INSERT INTO participant_answers (participantId, section, question, answer, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const insertSituationDesign = db.prepare(`
      INSERT INTO situation_design (scopeId, robotChanges, environmentalChanges, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const insertScopeRule = db.prepare(`
      INSERT INTO scope_rules (scopeId, rule, orderIndex, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const insertUndesirableRule = db.prepare(`
      INSERT INTO undesirable_rules (scopeId, rule, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?)
    `);
    
    for (const scope of (project.scopes || [])) {
      const scopeInfo = insertScope.run(
        projectId,
        sanitizeValue(scope.scopeNumber),
        sanitizeValue(scope.scopeText),
        sanitizeValue(scope.isActive),
        sanitizeValue(scope.createdAt || new Date().toISOString()),
        sanitizeValue(scope.updatedAt || new Date().toISOString())
      );
      
      const scopeId = scopeInfo.lastInsertRowid;
      
      // Insert rules for this scope
      for (let i = 0; i < (scope.rules || []).length; i++) {
        insertScopeRule.run(
          scopeId,
          sanitizeValue(scope.rules[i]),
          i,
          sanitizeValue(new Date().toISOString()),
          sanitizeValue(new Date().toISOString())
        );
      }
      
      // Insert participants for this scope
      for (const participant of (scope.participants || [])) {
        const participantInfo = insertParticipant.run(
          projectId,
          scopeId,
          sanitizeValue(participant.id),
          sanitizeValue(participant.name),
          sanitizeValue(participant.summary),
          sanitizeValue(participant.interviewText),
          sanitizeValue(participant.createdAt || new Date().toISOString()),
          sanitizeValue(participant.updatedAt || new Date().toISOString())
        );
        
        const participantDbId = participantInfo.lastInsertRowid;
        
        // Insert answers
        for (const [section, questions] of Object.entries(participant.answers || {})) {
          for (const [question, answer] of Object.entries(questions)) {
            insertAnswer.run(
              participantDbId,
              sanitizeValue(section),
              sanitizeValue(question),
              sanitizeValue(answer),
              sanitizeValue(new Date().toISOString()),
              sanitizeValue(new Date().toISOString())
            );
          }
        }
      }
      
      // Insert situation design for this scope
      if (scope.situationDesign) {
        insertSituationDesign.run(
          scopeId,
          sanitizeValue(scope.situationDesign.robotChanges),
          sanitizeValue(scope.situationDesign.environmentalChanges),
          sanitizeValue(new Date().toISOString()),
          sanitizeValue(new Date().toISOString())
        );
      }
      
      // Insert undesirable rules for this scope
      if (scope.undesirableRules && scope.undesirableRules.length > 0) {
        for (const rule of scope.undesirableRules) {
          insertUndesirableRule.run(
            scopeId,
            sanitizeValue(rule),
            sanitizeValue(new Date().toISOString()),
            sanitizeValue(new Date().toISOString())
          );
        }
      }
    }
    
    return projectId;
  });
  
  return transaction(project);
}

// Update a project by id
function updateProject(id, project) {
  console.log('Database: Updating project', id);
  
  const stmt = db.prepare(`
    UPDATE projects 
    SET name = ?, description = ?, robotType = ?, studyType = ?, rules = ?, summaryPrompt = ?, updatedAt = ? 
    WHERE id = ?
  `);
  
  stmt.run(
    project.name,
    project.description,
    project.robotType,
    project.studyType,
    JSON.stringify(project.rules || []),
    project.summaryPrompt,
    new Date().toISOString(),
    id
  );
}

// Delete a project by id
function deleteProject(id) {
  console.log('Database: Deleting project', id);
  
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
}

// Update participant interview text
function updateParticipantInterview(projectId, participantId, interviewText) {
  console.log('Database: Updating participant interview', projectId, participantId);
  
  const stmt = db.prepare(`
    UPDATE participants 
    SET interviewText = ?, updatedAt = ? 
    WHERE projectId = ? AND participantId = ?
  `);
  
  stmt.run(interviewText, new Date().toISOString(), projectId, participantId);
}

// Update participant answers without affecting project settings
function updateParticipantAnswers(projectId, participantId, answers) {
  console.log('Database: Updating participant answers', projectId, participantId);
  
  const transaction = db.transaction((projectId, participantId, answers) => {
    // Get the participant's database ID
    const participant = db.prepare(`
      SELECT id FROM participants 
      WHERE projectId = ? AND participantId = ?
    `).get(projectId, participantId);
    
    if (!participant) {
      console.error('Participant not found:', projectId, participantId);
      return;
    }
    
    const participantDbId = participant.id;
    
    // Delete existing answers for this participant
    db.prepare('DELETE FROM participant_answers WHERE participantId = ?').run(participantDbId);
    
    // Insert new answers
    const insertAnswer = db.prepare(`
      INSERT INTO participant_answers (participantId, section, question, answer, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    for (const [section, questions] of Object.entries(answers || {})) {
      for (const [question, answer] of Object.entries(questions)) {
        insertAnswer.run(
          participantDbId,
          section,
          question,
          typeof answer === 'object' ? JSON.stringify(answer) : answer,
          now,
          now
        );
      }
    }
  });
  
  transaction(projectId, participantId, answers);
}

// Update participant summary without affecting project settings  
function updateParticipantSummary(projectId, participantId, summary) {
  console.log('Database: Updating participant summary', projectId, participantId);
  
  const stmt = db.prepare(`
    UPDATE participants 
    SET summary = ?, updatedAt = ? 
    WHERE projectId = ? AND participantId = ?
  `);
  
  stmt.run(summary, new Date().toISOString(), projectId, participantId);
}

// Get all questions from questionnaire
function getAllQuestions() {
  if (!db) {
    console.error('Database not initialized when getting all questions');
    return {};
  }
  
  try {
    console.log('Database: Getting all questions');
    
    const questions = db.prepare(`
      SELECT * FROM questionnaire 
      ORDER BY section, orderIndex
    `).all();
    
    // Parse options JSON for dropdown questions
    const questionsWithParsedOptions = questions.map(question => ({
      ...question,
      options: question.options ? JSON.parse(question.options) : null
    }));
    
    // Group questions by section
    const groupedQuestions = {};
    questionsWithParsedOptions.forEach(question => {
      if (!groupedQuestions[question.section]) {
        groupedQuestions[question.section] = [];
      }
      groupedQuestions[question.section].push(question);
    });
    
    console.log('Database: Found questions for', Object.keys(groupedQuestions).length, 'sections');
    return groupedQuestions;
  } catch (error) {
    console.error('Database: Error getting all questions:', error);
    return {};
  }
}

// Update question enabled status
function updateQuestionStatus(questionId, isEnabled) {
  console.log('Database: Updating question status', questionId, isEnabled);
  
  const stmt = db.prepare(`
    UPDATE questionnaire 
    SET isEnabled = ?, updatedAt = ? 
    WHERE questionId = ?
  `);
  
  stmt.run(isEnabled ? 1 : 0, new Date().toISOString(), questionId);
}

// Update question text
function updateQuestionText(questionId, questionText) {
  console.log('Database: Updating question text', questionId);
  
  const stmt = db.prepare(`
    UPDATE questionnaire 
    SET questionText = ?, updatedAt = ? 
    WHERE questionId = ?
  `);
  
  stmt.run(questionText, new Date().toISOString(), questionId);
}

// Update question factors
function updateQuestionFactors(questionId, factors) {
  console.log('Database: Updating question factors', questionId);
  
  const stmt = db.prepare(`
    UPDATE questionnaire 
    SET factors = ?, updatedAt = ? 
    WHERE questionId = ?
  `);
  
  stmt.run(factors, new Date().toISOString(), questionId);
}

// Get factor details by name
function getFactorDetails(factorName) {
  console.log('Database: Getting factor details for', factorName);
  
  const stmt = db.prepare(`
    SELECT factor_name, description, examples, related_factors, research_notes, section 
    FROM factors 
    WHERE factor_name = ?
  `);
  
  const factor = stmt.get(factorName);
  if (factor) {
    return {
      factor: factor.factor_name,
      description: factor.description,
      examples: JSON.parse(factor.examples || '[]'),
      relatedFactors: JSON.parse(factor.related_factors || '[]'),
      researchNotes: factor.research_notes,
      section: factor.section || 'Unknown'
    };
  }
  return null;
}

// Get all factors
function getAllFactors() {
  console.log('Database: Getting all factors');
  
  const stmt = db.prepare(`
    SELECT factor_name, description, examples, related_factors, research_notes, section 
    FROM factors 
    ORDER BY factor_name
  `);
  
  const factors = stmt.all();
  return factors.map(factor => ({
    factor: factor.factor_name,
    description: factor.description,
    examples: JSON.parse(factor.examples || '[]'),
    relatedFactors: JSON.parse(factor.related_factors || '[]'),
    researchNotes: factor.research_notes,
    section: factor.section || 'Unknown'
  }));
}

// Get factors for a specific question
function getQuestionFactors(questionId) {
  console.log('Database: Getting factors for question', questionId);
  
  const stmt = db.prepare(`
    SELECT f.factor_name, f.description, f.examples, f.related_factors, f.research_notes
    FROM factors f
    JOIN question_factors qf ON f.factor_name = qf.factor_name
    WHERE qf.question_id = ?
  `);
  
  const factors = stmt.all(questionId);
  return factors.map(factor => ({
    factor: factor.factor_name,
    description: factor.description,
    examples: JSON.parse(factor.examples || '[]'),
    relatedFactors: JSON.parse(factor.related_factors || '[]'),
    researchNotes: factor.research_notes
  }));
}

// Add new question
function addQuestion(section, questionId, questionText, questionType = 'text', options = null, factors = null, orderIndex = 0) {
  console.log('Database: Adding new question', questionId);
  
  const stmt = db.prepare(`
    INSERT INTO questionnaire (section, questionId, questionText, questionType, options, factors, orderIndex, isEnabled, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  
  const now = new Date().toISOString();
  stmt.run(section, questionId, questionText, questionType, options ? JSON.stringify(options) : null, factors, orderIndex, now, now);
}

// Delete question
function deleteQuestion(questionId) {
  console.log('Database: Deleting question', questionId);
  
  const stmt = db.prepare('DELETE FROM questionnaire WHERE questionId = ?');
  stmt.run(questionId);
}

// Get project-specific questions
function getProjectQuestions(projectId) {
  console.log('Database: Getting project questions for project', projectId);
  
  // Get all questions from questionnaire
  const allQuestions = db.prepare(`
    SELECT * FROM questionnaire 
    ORDER BY section, orderIndex
  `).all();
  
  console.log('Database: Found', allQuestions.length, 'total questions');
  
  // Get project-specific settings
  const projectSettings = db.prepare(`
    SELECT questionId, section, isEnabled FROM project_questions 
    WHERE projectId = ?
  `).all(projectId);
  
  console.log('Database: Found', projectSettings.length, 'project-specific settings for project', projectId);
  console.log('Database: Project settings:', projectSettings);
  
  // Create a map of project settings
  const projectSettingsMap = {};
  projectSettings.forEach(setting => {
    projectSettingsMap[setting.questionId] = setting.isEnabled;
  });
  
  console.log('Database: Project settings map:', projectSettingsMap);
  
  // Merge with all questions
  const questionsWithProjectSettings = allQuestions.map(question => {
    const hasProjectSetting = projectSettingsMap.hasOwnProperty(question.questionId);
    const finalEnabled = hasProjectSetting ? projectSettingsMap[question.questionId] : question.isEnabled;
    
    console.log(`Database: Question ${question.questionId} (${question.questionText.substring(0, 30)}...): hasProjectSetting=${hasProjectSetting}, globalEnabled=${question.isEnabled}, finalEnabled=${finalEnabled}`);
    
    return {
      ...question,
      options: question.options ? JSON.parse(question.options) : null,
      isEnabled: finalEnabled
    };
  });
  
  // Group questions by section
  const groupedQuestions = {};
  questionsWithProjectSettings.forEach(question => {
    if (!groupedQuestions[question.section]) {
      groupedQuestions[question.section] = [];
    }
    groupedQuestions[question.section].push(question);
  });
  
  console.log('Database: Found questions for', Object.keys(groupedQuestions).length, 'sections');
  console.log('Database: Final grouped questions:', groupedQuestions);
  return groupedQuestions;
}

// Update project question status
function updateProjectQuestionStatus(projectId, questionId, isEnabled) {
  console.log('Database: Updating project question status', { projectId, questionId, isEnabled, projectIdType: typeof projectId });
  
  // Ensure projectId is a valid integer
  const numericProjectId = parseInt(projectId, 10);
  if (isNaN(numericProjectId)) {
    throw new Error(`Invalid project ID: ${projectId}. Project ID must be a valid number.`);
  }
  
  // First, check if the question exists in the questionnaire table
  const question = db.prepare('SELECT section FROM questionnaire WHERE questionId = ?').get(questionId);
  if (!question) {
    throw new Error(`Question with ID "${questionId}" does not exist in the questionnaire table.`);
  }
  
  // Check if this would disable the last question in a section
  if (!isEnabled) {
    // Count enabled questions in the section, considering both project-specific and global settings
    const enabledQuestionsInSection = db.prepare(`
      SELECT COUNT(*) as count FROM questionnaire q
      WHERE q.section = ? AND (
        q.questionId IN (
          SELECT pq.questionId FROM project_questions pq 
          WHERE pq.projectId = ? AND pq.isEnabled = 1
        ) OR (
          q.questionId NOT IN (
            SELECT pq.questionId FROM project_questions pq 
            WHERE pq.projectId = ?
          ) AND q.isEnabled = 1
        )
      )
    `).get(question.section, numericProjectId, numericProjectId);
    
    if (enabledQuestionsInSection.count <= 1) {
      throw new Error(`Cannot disable the last question in section "${question.section}". At least one question must remain enabled.`);
    }
  }
  
  // Insert or update project question setting
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO project_questions (projectId, questionId, section, isEnabled, updatedAt) 
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(numericProjectId, questionId, question.section, isEnabled ? 1 : 0, new Date().toISOString());
}

// Get enabled questions for a project (for participant forms)
function getEnabledProjectQuestions(projectId) {
  console.log('Database: Getting enabled questions for project', projectId);
  
  const questions = db.prepare(`
    SELECT q.*, COALESCE(pq.isEnabled, q.isEnabled) as finalEnabled
    FROM questionnaire q
    LEFT JOIN project_questions pq ON q.questionId = pq.questionId AND q.section = pq.section AND pq.projectId = ?
    WHERE COALESCE(pq.isEnabled, q.isEnabled) = 1
    ORDER BY q.section, q.orderIndex
  `).all(projectId);
  
  // Parse options JSON for dropdown questions
  const questionsWithParsedOptions = questions.map(question => ({
    ...question,
    options: question.options ? JSON.parse(question.options) : null
  }));
  
  // Group questions by section
  const groupedQuestions = {};
  questionsWithParsedOptions.forEach(question => {
    if (!groupedQuestions[question.section]) {
      groupedQuestions[question.section] = [];
    }
    groupedQuestions[question.section].push(question);
  });
  
  return groupedQuestions;
}

// Test function to check project question settings
function testProjectQuestionSettings(projectId) {
  console.log('=== TESTING PROJECT QUESTION SETTINGS ===');
  console.log('Project ID:', projectId);
  
  // Check all project_questions entries for this project
  const allProjectSettings = db.prepare(`
    SELECT * FROM project_questions 
    WHERE projectId = ?
  `).all(projectId);
  
  console.log('All project_questions entries for project', projectId, ':', allProjectSettings);
  
  // Check specific questions
  const specificQuestions = db.prepare(`
    SELECT pq.*, q.questionText 
    FROM project_questions pq
    JOIN questionnaire q ON pq.questionId = q.questionId
    WHERE pq.projectId = ?
  `).all(projectId);
  
  console.log('Project questions with text:', specificQuestions);
  console.log('=== END TEST ===');
}

// Undesirable Rules Management Functions
function getUndesirableRules(scopeId) {
  console.log('Database: Getting undesirable rules for scope', scopeId);
  
  const stmt = db.prepare(`
    SELECT rule FROM undesirable_rules WHERE scopeId = ? ORDER BY createdAt ASC
  `);
  
  const results = stmt.all(scopeId);
  return results.map(row => row.rule);
}

function saveUndesirableRules(scopeId, rules) {
  console.log('Database: Saving undesirable rules for scope', scopeId, ':', rules);
  
  const transaction = db.transaction(() => {
    // Delete existing rules for this scope
    const deleteStmt = db.prepare('DELETE FROM undesirable_rules WHERE scopeId = ?');
    deleteStmt.run(scopeId);
    
    // Insert new rules
    if (rules && rules.length > 0) {
      const insertStmt = db.prepare(`
        INSERT INTO undesirable_rules (scopeId, rule, createdAt, updatedAt) 
        VALUES (?, ?, ?, ?)
      `);
      
      const now = new Date().toISOString();
      for (const rule of rules) {
        insertStmt.run(scopeId, rule, now, now);
      }
    }
  });
  
  transaction();
}

function addUndesirableRule(scopeId, rule) {
  console.log('Database: Adding undesirable rule for scope', scopeId, ':', rule);
  
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO undesirable_rules (scopeId, rule, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?)
  `);
  
  const now = new Date().toISOString();
  stmt.run(scopeId, rule, now, now);
}

function removeUndesirableRule(scopeId, rule) {
  console.log('Database: Removing undesirable rule for scope', scopeId, ':', rule);
  
  const stmt = db.prepare('DELETE FROM undesirable_rules WHERE scopeId = ? AND rule = ?');
  stmt.run(scopeId, rule);
}

module.exports = {
  getAllProjects,
  saveAllProjects,
  addProject,
  importProject,
  updateProject,
  deleteProject,
  updateParticipantInterview,
  updateParticipantAnswers,
  updateParticipantSummary,
  getAllQuestions,
  updateQuestionStatus,
  updateQuestionText,
  updateQuestionFactors,
  addQuestion,
  deleteQuestion,
  getProjectQuestions,
  updateProjectQuestionStatus,
  getEnabledProjectQuestions,
  testProjectQuestionSettings,
  getFactorDetails,
  getAllFactors,
  getQuestionFactors,
  updateQuestionFactorMappings,
  updateFactorsWithSections,
  getUndesirableRules,
  saveUndesirableRules,
  addUndesirableRule,
  removeUndesirableRule,
  initializeDatabase
};
