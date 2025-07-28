import React, { useState, useRef } from 'react';
import PersonaeFramework from './PersonaeFramework';

const PersonaeMappingView = ({ 
  project, 
  currentScope, 
  participants, 
  selectedParticipant, 
  setSelectedParticipant,
  sortBy,
  setSortBy,
  selectedAgeRanges,
  setSelectedAgeRanges,
  selectedGenders,
  setSelectedGenders,
  personaeView,
  setPersonaeView,
  isPdfGenerating,
  generatePDF
}) => {
  const frameworkRef = useRef(null);
  const summaryRef = useRef(null);

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

  // Function to filter participants for summary view
  const getFilteredParticipants = () => {
    if (selectedAgeRanges.length === 0 && selectedGenders.length === 0) {
      return participants;
    }

    return participants.filter(p => {
      const ageMatch = selectedAgeRanges.length === 0 || 
        (p.answers?.Identity?.age && selectedAgeRanges.includes(p.answers.Identity.age));
      const genderMatch = selectedGenders.length === 0 || 
        (p.answers?.Identity?.gender && selectedGenders.includes(p.answers.Identity.gender));
      return ageMatch && genderMatch;
    });
  };

  const handleAgeRangeToggle = (range) => {
    setSelectedAgeRanges(prev => 
      prev.includes(range) 
        ? prev.filter(r => r !== range)
        : [...prev, range]
    );
  };

  const handleGenderToggle = (gender) => {
    setSelectedGenders(prev => 
      prev.includes(gender) 
        ? prev.filter(g => g !== gender)
        : [...prev, gender]
    );
  };

  return (
    <>
      {/* View selection buttons and PDF download */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <button
          className="framework-view-button"
          key="framework-view"
          onClick={() => setPersonaeView('framework')}
          style={{
            padding: '8px 16px',
            background: personaeView === 'framework' ? '#1a5276' : '#2980b9',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          Framework View
        </button>
        <button
          className="summary-view-button"
          key="summary-view"
          onClick={() => setPersonaeView('summary')}
          style={{
            padding: '8px 16px',
            background: personaeView === 'summary' ? '#1a5276' : '#2980b9',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
        >
          Summary View
        </button>

        {/* PDF Download Button */}
        <button
          className="download-pdf-button"
          key="pdf-download"
          onClick={generatePDF}
          disabled={isPdfGenerating}
          style={{
            padding: '8px 16px',
            backgroundColor: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: isPdfGenerating ? 'wait' : 'pointer',
            marginLeft: 'auto',
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

      {personaeView === 'framework' ? (
        // Framework View Content
        <>
          {/* Sort options */}
          <div style={{ marginBottom: 20 }}>
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
              className="sort-by-selector"
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

          {/* Grouped participants */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {Object.entries(getGroupedParticipants()).map(([group, groupParticipants]) => (
              <div key={group}>
                <h3 style={{ 
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1em',
                  color: '#2c3e50',
                  marginBottom: 10
                }}>
                  {group}
                </h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {groupParticipants.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedParticipant(selectedParticipant?.id === p.id ? null : p)}
                      style={{
                        padding: '6px 12px',
                        background: selectedParticipant?.id === p.id ? '#1a5276' : '#2980b9',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: '.98em',
                        transition: 'all 0.2s ease',
                        opacity: selectedParticipant?.id === p.id ? 1 : 0.85,
                        transform: selectedParticipant?.id === p.id ? 'scale(1.05)' : 'scale(1)'
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        // Summary View Content
        <>
          {/* Filter Options */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ 
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1em',
              color: '#2c3e50',
              marginBottom: 10
            }}>
              Filter by Age Range:
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
              {AGE_RANGES.map(range => (
                <button
                  key={range}
                  onClick={() => handleAgeRangeToggle(range)}
                  style={{
                    padding: '6px 12px',
                    background: selectedAgeRanges.includes(range) ? '#1a5276' : '#2980b9',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '.9em',
                    transition: 'background-color 0.2s',
                    opacity: selectedAgeRanges.includes(range) ? 1 : 0.7
                  }}
                >
                  {range}
                </button>
              ))}
            </div>

            <h3 style={{ 
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1em',
              color: '#2c3e50',
              marginBottom: 10
            }}>
              Filter by Gender:
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {GENDER_OPTIONS.map(gender => (
                <button
                  key={gender}
                  onClick={() => handleGenderToggle(gender)}
                  style={{
                    padding: '6px 12px',
                    background: selectedGenders.includes(gender) ? '#1a5276' : '#2980b9',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: '.9em',
                    transition: 'background-color 0.2s',
                    opacity: selectedGenders.includes(gender) ? 1 : 0.7
                  }}
                >
                  {gender}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PersonaeMappingView; 