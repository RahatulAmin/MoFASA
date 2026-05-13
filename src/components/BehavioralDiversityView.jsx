import React, { useState, useEffect } from 'react';
import { parseFactors, getFactorFromStorage } from '../utils/factorUtils';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const FACTOR_ANALYSIS_SECTIONS = ['Situation', 'Identity', 'Definition of Situation'];

const BehavioralDiversityView = ({ 
  currentScope, 
  participants, 
  sortBy, 
  setSortBy,
  statsSort,
  setStatsSort,
  isPdfGenerating,
  generatePDF,
  captureRef,
  questions = {}
}) => {
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'
  const [undesirableRules, setUndesirableRules] = useState([]);
  const [viewMode, setViewMode] = useState('diversity');
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [factorSort, setFactorSort] = useState('');

  const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Other'];

  const getQuestionAnswer = (participant, sectionName, question) => {
    const sectionAnswers = participant.answers?.[sectionName] || {};
    const answer = sectionAnswers[question.id] ?? sectionAnswers[question.text];
    return typeof answer === 'string' ? answer.trim() : answer;
  };

  const getFactorQuestions = () => {
    const factorSetMap = new Map();

    FACTOR_ANALYSIS_SECTIONS.forEach(sectionName => {
      (questions[sectionName] || []).forEach(question => {
        const factors = parseFactors(question.factors);
        if (factors.length === 0) return;

        const name = factors.join(', ');
        const key = `${sectionName}:${name}`;

        if (!factorSetMap.has(key)) {
          factorSetMap.set(key, {
            key,
            name,
            sectionName,
            factors,
            details: factors.map(factor => getFactorFromStorage(factor)).filter(Boolean),
            questions: []
          });
        }

        factorSetMap.get(key).questions.push({
          ...question,
          sectionName
        });
      });
    });

    return Array.from(factorSetMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const factorQuestions = getFactorQuestions();
  const factorQuestionsBySection = FACTOR_ANALYSIS_SECTIONS.map(sectionName => ({
    sectionName,
    factors: factorQuestions.filter(factor => factor.sectionName === sectionName)
  })).filter(group => group.factors.length > 0);
  const selectedFactorData = factorQuestions.find(factor => factor.key === selectedFactor) || factorQuestions[0];

  useEffect(() => {
    if (viewMode === 'factor-analysis' && !selectedFactor && factorQuestions.length > 0) {
      setSelectedFactor(factorQuestions[0].key);
    }
  }, [viewMode, selectedFactor, factorQuestions]);

  const getParticipantLabel = (participant) => {
    const gender = participant.answers?.Identity?.gender || 'Unspecified';
    const age = participant.answers?.Identity?.age || 'Unspecified';
    return `${participant.name} (${gender}, ${age})`;
  };

  const getFactorResponses = () => {
    if (!selectedFactorData) return [];

    const responses = participants
      .map(participant => {
        const answers = selectedFactorData.questions
          .map(question => ({
            question: question.text,
            answer: getQuestionAnswer(participant, question.sectionName, question)
          }))
          .filter(item => item.answer && String(item.answer).trim() !== '');

        if (answers.length === 0) return null;

        return {
          participant,
          answers
        };
      })
      .filter(Boolean);

    if (factorSort === 'age') {
      return responses.sort((a, b) => {
        const aAge = a.participant.answers?.Identity?.age || 'zz';
        const bAge = b.participant.answers?.Identity?.age || 'zz';
        return aAge.localeCompare(bAge) || a.participant.name.localeCompare(b.participant.name);
      });
    }

    if (factorSort === 'gender') {
      return responses.sort((a, b) => {
        const aGender = a.participant.answers?.Identity?.gender || 'zz';
        const bGender = b.participant.answers?.Identity?.gender || 'zz';
        return aGender.localeCompare(bGender) || a.participant.name.localeCompare(b.participant.name);
      });
    }

    return responses.sort((a, b) => a.participant.name.localeCompare(b.participant.name));
  };

  const getFactorResponseGroups = () => {
    const responses = getFactorResponses();

    if (!factorSort) {
      return [{ title: null, responses }];
    }

    const groupOrder = factorSort === 'gender'
      ? [...GENDER_OPTIONS, 'Unspecified']
      : [...AGE_RANGES, 'Unspecified'];
    const getGroupTitle = (participant) => (
      factorSort === 'gender'
        ? participant.answers?.Identity?.gender || 'Unspecified'
        : participant.answers?.Identity?.age || 'Unspecified'
    );

    const groupedResponses = responses.reduce((groups, response) => {
      const title = getGroupTitle(response.participant);
      if (!groups[title]) groups[title] = [];
      groups[title].push(response);
      return groups;
    }, {});

    const orderedTitles = [
      ...groupOrder.filter(title => groupedResponses[title]),
      ...Object.keys(groupedResponses)
        .filter(title => !groupOrder.includes(title))
        .sort((a, b) => a.localeCompare(b))
    ];

    return orderedTitles.map(title => ({
      title,
      responses: groupedResponses[title]
    }));
  };

  // Load undesirable rules from database whenever currentScope changes
  useEffect(() => {
    const loadUndesirableRules = async () => {
      if (currentScope?.id) {
        try {
          console.log('Loading undesirable rules for scopeId:', currentScope.id);
          const rules = await window.electronAPI.getUndesirableRules(currentScope.id);
          console.log('Loaded undesirable rules:', rules);
          setUndesirableRules(rules);
        } catch (error) {
          console.error('Error loading undesirable rules:', error);
          setUndesirableRules([]);
        }
      } else {
        console.log('No currentScope.id available:', currentScope);
        setUndesirableRules([]);
      }
    };

    loadUndesirableRules();
  }, [currentScope?.id]); // Load when scopeId changes

  // Function to group participants by the selected criterion
  const getGroupedParticipants = () => {
    if (!participants) return {};

    if (!sortBy) {
      // Return all participants in a single group when no sorting is selected
      return { 'All Participants': participants };
    }

    if (sortBy === 'age') {
      const groups = {
        ...AGE_RANGES.reduce((acc, range) => ({ ...acc, [range]: [] }), {}),
        'Unspecified Age Range': []
      };

      participants.forEach(p => {
        const ageRange = p.answers?.Identity?.age;
        if (ageRange && AGE_RANGES.includes(ageRange)) {
          groups[ageRange].push(p);
        } else {
          groups['Unspecified Age Range'].push(p);
        }
      });

      // Remove empty groups
      return Object.fromEntries(
        Object.entries(groups).filter(([_, participants]) => participants.length > 0)
      );
    } else {
      const groups = {
        ...GENDER_OPTIONS.reduce((acc, gender) => ({ ...acc, [gender]: [] }), {}),
        'Unspecified Gender': []
      };

      participants.forEach(p => {
        const gender = p.answers?.Identity?.gender;
        if (gender && GENDER_OPTIONS.includes(gender)) {
          groups[gender].push(p);
        } else {
          groups['Unspecified Gender'].push(p);
        }
      });

      // Remove empty groups
      return Object.fromEntries(
        Object.entries(groups).filter(([_, participants]) => participants.length > 0)
      );
    }
  };

  // Updated function to calculate rule usage statistics with detailed breakdowns
  const getRuleUsageStats = (sortType = '') => {
    if (!sortType) {
      // Simple counting for no sort
      const stats = {};
      (currentScope?.rules || []).forEach(rule => {
        stats[rule] = participants.filter(p => 
          p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
        ).length;
      });
      return stats;
    } else if (sortType === 'gender') {
      // Group by gender for each rule
      const stats = {};
      (currentScope?.rules || []).forEach(rule => {
        stats[rule] = {
          Male: participants.filter(p => 
            p.answers?.Identity?.gender === 'Male' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length,
          Female: participants.filter(p => 
            p.answers?.Identity?.gender === 'Female' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length,
          'Non-Binary': participants.filter(p => 
            p.answers?.Identity?.gender === 'Non-Binary' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length,
          Other: participants.filter(p => 
            p.answers?.Identity?.gender === 'Other' && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length
        };
      });
      return stats;
    } else if (sortType === 'age') {
      // Group by age range for each rule
      const stats = {};
      (currentScope?.rules || []).forEach(rule => {
        stats[rule] = {};
        AGE_RANGES.forEach(range => {
          stats[rule][range] = participants.filter(p => 
            p.answers?.Identity?.age === range && 
            p.answers?.['Rule Selection']?.selectedRules?.includes(rule)
          ).length;
        });
      });
      return stats;
    }
    return {};
  };

  // Updated function to get chart data based on sort type
  const getChartData = (sortType = '') => {
    const stats = getRuleUsageStats(sortType);
    
    if (sortType === 'gender') {
      return {
        labels: Object.keys(stats),
        datasets: GENDER_OPTIONS.map((gender, index) => ({
          label: gender,
          data: Object.values(stats).map(genderStats => genderStats[gender]),
          backgroundColor: ['#3498db', '#e74c3c', '#9b59b6', '#f1c40f'][index],
          borderColor: ['#2980b9', '#c0392b', '#8e44ad', '#f39c12'][index],
          borderWidth: 1
        }))
      };
    } else if (sortType === 'age') {
      return {
        labels: AGE_RANGES,
        datasets: Object.entries(stats).map(([rule, ageStats], index) => ({
          label: rule,
          data: AGE_RANGES.map(range => ageStats[range]),
          backgroundColor: `hsla(${index * (360 / Object.keys(stats).length)}, 70%, 50%, 0.7)`,
          borderColor: `hsla(${index * (360 / Object.keys(stats).length)}, 70%, 45%, 1)`,
          borderWidth: 1
        }))
      };
    } else {
      return {
        labels: Object.keys(stats),
        datasets: [{
          label: 'Number of Participants',
          data: Object.values(stats),
          backgroundColor: '#27ae60',
          borderColor: '#219a52',
          borderWidth: 1
        }]
      };
    }
  };

  // Function to get pie chart data - simplified for better pie chart display
  const getPieChartData = (sortType = '') => {
    const stats = getRuleUsageStats(sortType);
    
    if (sortType === 'gender' || sortType === 'age') {
      // For complex sorts, show total rule usage (aggregated)
      const aggregated = {};
      Object.keys(stats).forEach(rule => {
        const ruleStats = stats[rule];
        aggregated[rule] = Object.values(ruleStats).reduce((sum, count) => sum + count, 0);
      });
      
      return {
        labels: Object.keys(aggregated),
        datasets: [{
          data: Object.values(aggregated),
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f39c12',
            '#9b59b6',
            '#1abc9c',
            '#34495e',
            '#e67e22',
            '#95a5a6',
            '#f1c40f'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }]
      };
    } else {
      // Simple case - just show rule distribution
      return {
        labels: Object.keys(stats),
        datasets: [{
          data: Object.values(stats),
          backgroundColor: [
            '#3498db',
            '#e74c3c',
            '#2ecc71',
            '#f39c12',
            '#9b59b6',
            '#1abc9c',
            '#34495e',
            '#e67e22',
            '#95a5a6',
            '#f1c40f'
          ],
          borderColor: '#fff',
          borderWidth: 2
        }]
      };
    }
  };

  // Chart options based on sort type
  const getChartOptions = (sortType = '') => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          labels: {
            font: {
              family: 'Lexend, sans-serif'
            }
          }
        },
        title: {
          display: true,
          text: 'Rule Usage Statistics',
          font: {
            family: 'Lexend, sans-serif',
            size: 16
          }
        }
      },
      scales: {
        x: {
          ticks: {
            stepSize: 1,
            font: {
              family: 'Lexend, sans-serif'
            }
          }
        },
        y: {
          ticks: {
            stepSize: 1,
            font: {
              family: 'Lexend, sans-serif'
            }
          },
        }
      }
    };

    if (sortType === 'age') {
      return {
        ...baseOptions,
        indexAxis: 'y',
        plugins: {
          ...baseOptions.plugins,
          title: {
            ...baseOptions.plugins.title,
            text: 'Rule Usage by Age Range'
          }       
        }
      };
    } else if (sortType === 'gender') {
      return {
        ...baseOptions,
        indexAxis: 'x',
        plugins: {
          ...baseOptions.plugins,
          title: {
            ...baseOptions.plugins.title,
            text: 'Rule Usage by Gender'
          }
        }
      };
    } 
    else if (sortType === '') {
      return {
        ...baseOptions,
        indexAxis: 'x',
        plugins: {
          ...baseOptions.plugins,
          title: {
            ...baseOptions.plugins.title,
            text: 'All Participants'
          }
        }
      };
    }

    return baseOptions;
  };

  return (
    <>
      {/* Sort options and action buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 20 
      }}>
        <div style={{ marginBottom: 0 }}>
          <label style={{ 
            display: 'block', 
            marginBottom: 8,
            fontFamily: 'Lexend, sans-serif',
            fontSize: '0.95em',
            color: '#34495e'
          }}>
            {viewMode === 'factor-analysis' ? 'Sort responses by:' : 'Sort by:'}
          </label>
          <select
            className="sort-by-selector"
            value={viewMode === 'factor-analysis' ? factorSort : sortBy}
            onChange={(e) => {
              if (viewMode === 'factor-analysis') {
                setFactorSort(e.target.value);
              } else {
                setSortBy(e.target.value);
              }
            }}
            style={{
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #dcdde1',
              fontSize: '0.95em',
              fontFamily: 'Lexend, sans-serif',
              color: '#2c3e50',
              background: '#fff',
              width: '200px'
            }}
          >
            {viewMode === 'factor-analysis' ? (
              <>
                <option value="">Participant Name</option>
                <option value="age">Age Range</option>
                <option value="gender">Gender</option>
              </>
            ) : (
              <>
                <option value="">-No Sorting-</option>
                <option value="age">Age Range</option>
                <option value="gender">Gender</option>
              </>
            )}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'diversity' ? 'factor-analysis' : 'diversity')}
            style={{
              padding: '8px 16px',
              backgroundColor: viewMode === 'factor-analysis' ? '#34495e' : '#2980b9',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: 'Lexend, sans-serif',
              fontWeight: 600
            }}
          >
            {viewMode === 'factor-analysis' ? 'Back to Behavioral Diversity' : 'Factor Analysis'}
          </button>

        {/* PDF Download Button */}
        {viewMode === 'diversity' && (
          <button
          onClick={generatePDF}
          disabled={isPdfGenerating}
          style={{
            padding: '8px 16px',
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: isPdfGenerating ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            opacity: isPdfGenerating ? 0.7 : 1,
            transition: 'opacity 0.2s'
          }}
        >
          {isPdfGenerating ? (
            <>
              <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>↻</span>
              Generating PDF...
            </>
          ) : (
            <>
              Download as PDF
            </>
          )}
          </button>
        )}
        </div>
      </div>

      {viewMode === 'factor-analysis' ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(220px, 280px) minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }}>
          <div style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #dcdde1',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            padding: '16px'
          }}>
            <h3 style={{
              margin: '0 0 12px 0',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1em',
              color: '#2c3e50'
            }}>
              Factors
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {factorQuestionsBySection.map(group => (
                <div key={group.sectionName}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    paddingBottom: '6px',
                    borderBottom: '1px solid #e9ecef',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '0.86em',
                    color: '#607080',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}>
                    {group.sectionName}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {group.factors.map(factor => (
                      <button
                        type="button"
                        key={factor.key}
                        onClick={() => setSelectedFactor(factor.key)}
                        style={{
                          padding: '10px 12px',
                          textAlign: 'left',
                          borderRadius: '6px',
                          border: selectedFactorData?.key === factor.key ? '1px solid #2980b9' : '1px solid #dcdde1',
                          backgroundColor: selectedFactorData?.key === factor.key ? '#eaf4fb' : '#fff',
                          color: selectedFactorData?.key === factor.key ? '#1a5276' : '#2c3e50',
                          cursor: 'pointer',
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '0.92em',
                          fontWeight: selectedFactorData?.key === factor.key ? 700 : 500
                        }}
                      >
                        {factor.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {factorQuestions.length === 0 && (
                <div style={{
                  color: '#7f8c8d',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '0.9em',
                  lineHeight: 1.5
                }}>
                  No configured factors were found for Situation, Identity, or Definition of Situation.
                </div>
              )}
            </div>
          </div>

          <div style={{
            background: '#fff',
            borderRadius: '8px',
            border: '1px solid #dcdde1',
            boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
            padding: '20px'
          }}>
            {selectedFactorData ? (
              <>
                <div style={{
                  borderBottom: '1px solid #e9ecef',
                  paddingBottom: '14px',
                  marginBottom: '16px'
                }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1.2em',
                    color: '#2c3e50'
                  }}>
                    {selectedFactorData.name}
                  </h3>
                  {selectedFactorData.details.length > 0 && (
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      {selectedFactorData.details.map(detail => (
                        <p
                          key={detail.factor}
                          style={{
                            margin: 0,
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '0.92em',
                            color: '#607080',
                            lineHeight: 1.5
                          }}
                        >
                          {selectedFactorData.details.length > 1 ? `${detail.factor}: ` : ''}{detail.description}
                        </p>
                      ))}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {getFactorResponseGroups().map(group => (
                    <div key={group.title || 'all-responses'} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {group.title && (
                        <h4 style={{
                          margin: 0,
                          fontFamily: 'Lexend, sans-serif',
                          fontSize: '1em',
                          color: '#2980b9',
                          fontWeight: 700
                        }}>
                          {group.title}
                        </h4>
                      )}
                      {group.responses.map(({ participant, answers }) => (
                        <div
                          key={participant.id}
                          style={{
                            padding: '14px',
                            border: '1px solid #e9ecef',
                            borderRadius: '8px',
                            backgroundColor: '#f8f9fa'
                          }}
                        >
                          <h4 style={{
                            margin: '0 0 10px 0',
                            fontFamily: 'Lexend, sans-serif',
                            fontSize: '1em',
                            color: '#2c3e50'
                          }}>
                            {getParticipantLabel(participant)}
                          </h4>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {answers.map((item, index) => (
                              <div key={`${participant.id}-${index}`}>
                                {answers.length > 1 && (
                                  <div style={{
                                    marginBottom: '4px',
                                    fontFamily: 'Lexend, sans-serif',
                                    fontSize: '0.82em',
                                    color: '#607080',
                                    fontWeight: 600
                                  }}>
                                    {item.question}
                                  </div>
                                )}
                                <p style={{
                                  margin: 0,
                                  fontFamily: 'Lexend, sans-serif',
                                  fontSize: '0.95em',
                                  color: '#34495e',
                                  lineHeight: 1.55
                                }}>
                                  {item.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                  {getFactorResponses().length === 0 && (
                    <div style={{
                      padding: '18px',
                      border: '1px dashed #ccd5df',
                      borderRadius: '8px',
                      color: '#7f8c8d',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.95em',
                      textAlign: 'center'
                    }}>
                      No participants have an answer for this factor.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                color: '#7f8c8d',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em'
              }}>
                Select a factor to see participant responses.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div 
          
          ref={captureRef}
          style={{
            width: '100%'
          }}
        >
        {/* Grouped participants */}
        {Object.entries(getGroupedParticipants()).map(([group, groupParticipants]) => (
          <div key={group} style={{ marginBottom: 20 }}>
            <h3 style={{ 
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1em',
              color: '#2c3e50',
              marginBottom: 10,
              borderBottom: '1px solid #dcdde1',
              paddingBottom: 8
            }}>
              {group}
            </h3>
            <div className="participant-grid" style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
           
              {groupParticipants.map((participant) => (
                <div
                  className="participant-card"
                  key={participant.id}
                  style={{
                    width: '320px',
                    background: '#fff',
                    borderRadius: 8,
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    border: '1px solid #dcdde1',
                    boxSizing: 'border-box'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '10px',
                    flexWrap: 'wrap',
                    margin: '0 0 15px 0',
                    borderBottom: '1px solid #eee',
                    paddingBottom: 10
                  }}>
                    <h3 style={{ 
                      margin: 0,
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '1.1em',
                      color: '#2c3e50'
                    }}>
                      {participant.name}
                    </h3>
                    <span style={{
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.85em',
                      color: '#6c757d',
                      fontWeight: 500
                    }}>
                      Gender: {participant.answers?.Identity?.gender || 'Unspecified'}
                    </span>
                    <span style={{
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.85em',
                      color: '#6c757d',
                      fontWeight: 500
                    }}>
                      Age: {participant.answers?.Identity?.age || 'Unspecified'}
                    </span>
                  </div>
                  
                  <div style={{ marginBottom: 15 }}>
                    <h4 style={{ 
                      margin: '0 0 8px 0',
                      fontFamily: 'Lexend, sans-serif',
                      fontSize: '0.95em',
                      color: '#34495e'
                    }}>
                      Selected Rules:
                    </h4>
                    <div style={{ 
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '8px',
                      padding: '10px',
                      background: '#f8f9fa',
                      borderRadius: 4
                    }}>
                                             {(currentScope?.rules || []).map((rule, index) => {
                         const isSelected = participant.answers?.['Rule Selection']?.selectedRules?.includes(rule);
                         const isUndesirable = undesirableRules.includes(rule);
                        
                        // Determine background color based on selection and desirability
                        let backgroundColor = '#fff';
                        let textColor = '#2c3e50';
                        
                        if (isSelected) {
                          if (isUndesirable) {
                            backgroundColor = '#e74c3c'; // Red for selected undesirable rules
                            textColor = '#fff';
                          } else {
                            backgroundColor = '#3498db'; // Blue for selected desirable rules
                            textColor = '#fff';
                          }
                        }
                        
                        return (
                          <div
                            key={index}
                            style={{
                              padding: '6px 12px',
                              background: backgroundColor,
                              color: textColor,
                              border: '1px solid #dcdde1',
                              borderRadius: '4px',
                              fontSize: '0.95em',
                              fontFamily: 'Lexend, sans-serif',
                              transition: 'all 0.2s ease',
                              fontWeight: isUndesirable ? '600' : '400'
                            }}
                          >
                            {rule}
                          </div>
                        );
                      })}
                      {(currentScope?.rules || []).length === 0 && (
                        <div style={{
                          padding: '10px',
                          color: '#7f8c8d',
                          fontStyle: 'italic',
                          width: '100%',
                          textAlign: 'center'
                        }}>
                          No rules defined for this scope
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Rule Usage Statistics Graph */}
        <h3 style={{ 
          fontFamily: 'Lexend, sans-serif',
          fontSize: '1.1em',
          color: '#2c3e50',
          marginBottom: '20px'
        }}>
          Rule Usage Statistics
        </h3>
        <div 
          className="statistics-panel"
          style={{ 
            marginTop: '40px',
            padding: '20px',
            backgroundColor: 'white',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #dcdde1'
          }}
        >
          {/* Independent Sorting Controls for Stats */}
          <div style={{ 
            display: 'flex',
            gap: '20px',
            alignItems: 'center',
            marginBottom: '20px',
            flexWrap: 'wrap'
          }}>
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#34495e'
              }}>
                View Statistics By:
              </label>
              <select
                value={statsSort}
                onChange={(e) => setStatsSort(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #dcdde1',
                  fontSize: '0.95em',
                  fontFamily: 'Lexend, sans-serif',
                  color: '#2c3e50',
                  background: '#fff',
                  width: '150px'
                }}
              >
                <option value="">All Participants</option>
                <option value="gender">By Gender</option>
                <option value="age">By Age Range</option>
              </select>
            </div>

            {/* Chart type toggle */}
            <div>
              <label style={{ 
                display: 'block', 
                marginBottom: '8px',
                fontFamily: 'Lexend, sans-serif',
                fontSize: '0.95em',
                color: '#34495e'
              }}>
                Chart Type:
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setChartType('bar')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: chartType === 'bar' ? '#27ae60' : '#f8f9fa',
                    color: chartType === 'bar' ? '#fff' : '#2c3e50',
                    border: '1px solid',
                    borderColor: chartType === 'bar' ? '#27ae60' : '#e9ecef',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: chartType === 'bar' ? '600' : '500',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                >
                  📊 Bar Chart
                </button>
                <button
                  onClick={() => setChartType('pie')}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: chartType === 'pie' ? '#27ae60' : '#f8f9fa',
                    color: chartType === 'pie' ? '#fff' : '#2c3e50',
                    border: '1px solid',
                    borderColor: chartType === 'pie' ? '#27ae60' : '#e9ecef',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: chartType === 'pie' ? '600' : '500',
                    fontSize: '0.9em',
                    fontFamily: 'Lexend, sans-serif',
                    transition: 'all 0.2s ease'
                  }}
                >
                  🥧 Pie Chart
                </button>
              </div>
            </div>
          </div>

          {/* Chart Display */}
          <div style={{ 
            marginTop: '20px',
            position: 'relative',
            height: '400px',
            padding: '20px'
          }}>
            {chartType === 'bar' ? (
              <Bar
                data={getChartData(statsSort)}
                options={getChartOptions(statsSort)}
              />
            ) : (
              <Pie
                data={getPieChartData(statsSort)}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                      labels: {
                        font: {
                          family: 'Lexend, sans-serif'
                        },
                        padding: 20,
                        usePointStyle: true
                      }
                    },
                    title: {
                      display: true,
                      text: statsSort === 'gender' ? 'Rule Usage by Gender (Total)' :
                            statsSort === 'age' ? 'Rule Usage by Age Range (Total)' :
                            'Rule Usage Distribution',
                      font: {
                        family: 'Lexend, sans-serif',
                        size: 16
                      },
                      padding: {
                        bottom: 20
                      }
                    }
                  }
                }}
              />
            )}
          </div>
        </div>
        </div>
      )}
    </>
  );
};

export default BehavioralDiversityView; 
