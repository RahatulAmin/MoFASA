import React, { useRef, useState } from 'react';
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

const BehavioralDiversityView = ({ 
  currentScope, 
  participants, 
  sortBy, 
  setSortBy,
  statsSort,
  setStatsSort,
  isPdfGenerating,
  generatePDF
}) => {
  const behavioralRef = useRef(null);
  const [chartType, setChartType] = useState('bar'); // 'bar' or 'pie'

  const AGE_RANGES = ['18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
  const GENDER_OPTIONS = ['Male', 'Female', 'Non-Binary', 'Other'];

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
      {/* Sort options and Download button */}
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
            Sort by:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
            <option value="">-No Sorting-</option>
            <option value="age">Age Range</option>
            <option value="gender">Gender</option>
          </select>
        </div>

        {/* PDF Download Button */}
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
      </div>

      {/* Wrap the entire behavioral content in a ref with max-width */}
      <div 
        ref={behavioralRef}
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
              {groupParticipants.map((participant) => (
                <div
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
                  <h3 style={{ 
                    margin: '0 0 15px 0',
                    fontFamily: 'Lexend, sans-serif',
                    fontSize: '1.1em',
                    color: '#2c3e50',
                    borderBottom: '1px solid #eee',
                    paddingBottom: 10
                  }}>
                    {participant.name}
                  </h3>
                  
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
                        return (
                          <div
                            key={index}
                            style={{
                              padding: '6px 12px',
                              background: isSelected ? '#3498db' : '#fff',
                              color: isSelected ? '#fff' : '#2c3e50',
                              border: '1px solid #dcdde1',
                              borderRadius: '4px',
                              fontSize: '0.95em',
                              fontFamily: 'Lexend, sans-serif',
                              transition: 'all 0.2s ease'
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
        <div style={{ 
          marginTop: '40px',
          padding: '20px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #dcdde1'
        }}>
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
    </>
  );
};

export default BehavioralDiversityView; 