const path = require('path');
const Database = require('better-sqlite3');
const fs = require('fs');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir);
}

const dbPath = path.join(dataDir, 'mofasa.sqlite3');
const db = new Database(dbPath);

// Function to check if migration is needed
function needsMigration() {
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
    
    // Check if projects table has the new structure
    const columns = db.prepare("PRAGMA table_info(projects)").all();
    const columnNames = columns.map(col => col.name);
    
    // If projects table doesn't have 'description' column, migration is needed
    if (!columnNames.includes('description')) {
      console.log('Database: projects table missing description column - migration needed');
      return true;
    }
    
    // Check if project_questions table has the section column
    const projectQuestionsColumns = db.prepare("PRAGMA table_info(project_questions)").all();
    const projectQuestionsColumnNames = projectQuestionsColumns.map(col => col.name);
    
    if (!projectQuestionsColumnNames.includes('section')) {
      console.log('Database: project_questions table missing section column - migration needed');
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
    // Drop all existing tables if they exist
    db.exec(`
      DROP TABLE IF EXISTS situation_design;
      DROP TABLE IF EXISTS participant_answers;
      DROP TABLE IF EXISTS participants;
      DROP TABLE IF EXISTS scope_rules;
      DROP TABLE IF EXISTS scopes;
      DROP TABLE IF EXISTS project_questions;
      DROP TABLE IF EXISTS questionnaire;
      DROP TABLE IF EXISTS projects;
    `);
    
    // Create tables without foreign key constraints first
    const createTablesWithoutFK = `
    -- Projects table
    CREATE TABLE projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
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
      isEnabled BOOLEAN DEFAULT 1,
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT,
      updatedAt TEXT,
      UNIQUE(section, questionId)
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
      `);
    } catch (fkError) {
      console.log('Database: Foreign key constraints failed, continuing without them:', fkError.message);
    }
    
    // Populate questionnaire table with default questions
    const insertQuestion = db.prepare(`
      INSERT INTO questionnaire (section, questionId, questionText, questionType, options, orderIndex, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const now = new Date().toISOString();
    
    // Situation questions
    const situationQuestions = [
      { id: 'when', text: 'When did the interaction happen?', type: 'text', order: 0 },
      { id: 'where', text: 'Where did it take place?', type: 'text', order: 1 },
      { id: 'agents_count', text: 'How many interacting agents (Humans and Robots) were there?', type: 'text', order: 2 },
      { id: 'in_group', text: 'Were they in a group?', type: 'text', order: 3 },
      { id: 'roles', text: 'What were the roles of the interacting agents?', type: 'text', order: 4 }
    ];
    
    // Identity questions
    const identityQuestions = [
      { id: 'age', text: 'Age range of the participant(s)', type: 'dropdown', options: JSON.stringify(['18-24', '25-34', '35-44', '45-54', '55-64', '65+']), order: 0 },
      { id: 'gender', text: 'Gender of the participant(s)', type: 'dropdown', options: JSON.stringify(['Male', 'Female', 'Non-Binary', 'Other']), order: 1 },
      { id: 'nationality', text: 'Nationality of the participant(s)', type: 'text', order: 2 },
      { id: 'occupation', text: 'Occupation of the participant(s)', type: 'text', order: 3 },
      { id: 'education', text: 'Education level of the participant(s)', type: 'text', order: 4 },
      { id: 'social_motive', text: 'What was their social motive for interacting with the robot?', type: 'text', order: 5 },
      { id: 'experience', text: 'Do they have previous experience of interacting with robots?', type: 'text', order: 6 },
      { id: 'perception', text: 'What was the participant(s) perception of the robot and their interaction with it? Is the robot disrupting, negative, supportive, positive, or neutral?', type: 'text', order: 7 }
    ];
    
    // Definition of Situation questions
    const definitionQuestions = [
      { id: 'uncertainty', text: 'Were the participants uncertain about the situation?', type: 'text', order: 0 },
      { id: 'consequences', text: 'Were the participants unsure about the consequences of their actions?', type: 'text', order: 1 },
      { id: 'familiarity', text: 'How well does the interacting agents know each other?', type: 'text', order: 2 },
      { id: 'context_perception', text: 'How did the participants perceive the context of the interaction?', type: 'text', order: 3 },
      { id: 'power_dynamics', text: 'What does the power dynamic look like in this interaction?', type: 'text', order: 4 },
      { id: 'group_interaction', text: 'If multiple participants were involved, how did they interact with the robot? Did they communicate with each other?', type: 'text', order: 5 },
      { id: 'social_rules', text: 'Are there any social rules or cultural norms that the participants are following?', type: 'text', order: 6 },
      { id: 'emotional_state', text: 'Did the emotional state of the participant at that very moment influence the interaction in any way?', type: 'text', order: 7 }
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
        question.order,
        now,
        now
      );
    }
    
    console.log('Database: Migration completed successfully');
  } catch (error) {
    console.error('Database: Migration failed:', error);
    throw error;
  }
}

// Initialize database with migration if needed
if (needsMigration()) {
  console.log('Database: Running migration...');
  performMigration();
  console.log('Database: Migration completed');
} else {
  console.log('Database: No migration needed');
}

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
      
      return {
        id: scope.id,
        scopeNumber: scope.scopeNumber,
        scopeText: scope.scopeText,
        isActive: scope.isActive,
        participants: participantsWithAnswers,
        rules: rules,
        situationDesign: situationDesign ? {
          robotChanges: situationDesign.robotChanges,
          environmentalChanges: situationDesign.environmentalChanges
        } : null
      };
    });
    
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      rules: project.rules ? JSON.parse(project.rules) : [],
      summaryPrompt: project.summaryPrompt,
      scopes: scopesWithData,
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
    // Clear all existing data
    db.prepare('DELETE FROM situation_design').run();
    db.prepare('DELETE FROM participant_answers').run();
    db.prepare('DELETE FROM participants').run();
    db.prepare('DELETE FROM scope_rules').run();
    db.prepare('DELETE FROM scopes').run();
    db.prepare('DELETE FROM projects').run();
    
    // Insert projects
    const insertProject = db.prepare(`
      INSERT INTO projects (name, description, rules, summaryPrompt, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
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
        sanitizeValue(JSON.stringify(project.rules)),
        sanitizeValue(project.summaryPrompt),
        sanitizeValue(project.createdAt || new Date().toISOString()),
        sanitizeValue(project.updatedAt || new Date().toISOString())
      );
      
      const projectId = projectInfo.lastInsertRowid;
      
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
      INSERT INTO projects (name, description, rules, summaryPrompt, createdAt, updatedAt) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const projectInfo = insertProject.run(
      project.name,
      project.description,
      JSON.stringify(project.rules || []),
      project.summaryPrompt,
      project.createdAt || new Date().toISOString(),
      project.updatedAt || new Date().toISOString()
    );
    
    return projectInfo.lastInsertRowid;
  });
  
  return transaction(project);
}

// Update a project by id
function updateProject(id, project) {
  console.log('Database: Updating project', id);
  
  const stmt = db.prepare(`
    UPDATE projects 
    SET name = ?, description = ?, rules = ?, summaryPrompt = ?, updatedAt = ? 
    WHERE id = ?
  `);
  
  stmt.run(
    project.name,
    project.description,
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

// Get all questions from questionnaire
function getAllQuestions() {
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

// Add new question
function addQuestion(section, questionId, questionText, questionType = 'text', options = null, orderIndex = 0) {
  console.log('Database: Adding new question', questionId);
  
  const stmt = db.prepare(`
    INSERT INTO questionnaire (section, questionId, questionText, questionType, options, orderIndex, isEnabled, createdAt, updatedAt) 
    VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);
  
  const now = new Date().toISOString();
  stmt.run(section, questionId, questionText, questionType, options ? JSON.stringify(options) : null, orderIndex, now, now);
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

module.exports = {
  getAllProjects,
  saveAllProjects,
  addProject,
  updateProject,
  deleteProject,
  updateParticipantInterview,
  getAllQuestions,
  updateQuestionStatus,
  updateQuestionText,
  addQuestion,
  deleteQuestion,
  getProjectQuestions,
  updateProjectQuestionStatus,
  getEnabledProjectQuestions,
  testProjectQuestionSettings
};
