import React, { useState, useEffect } from 'react';
import { getAllFactors, getFactorsBySection } from '../utils/factorUtils';

const SECTIONS = [
  { name: 'Situation', color: '#f9f3f2' },
  { name: 'Identity', color: '#fcfbf2' },
  { name: 'Definition of Situation', color: '#f2f6fc' },
  { name: 'Rule Selection', color: '#ededed' },
  { name: 'Decision', color: '#f2fcf2' }
];

const FactorManagement = () => {
  const [factors, setFactors] = useState({});
  const [selectedFactor, setSelectedFactor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');

  // Load factors from the single source of truth
  useEffect(() => {
    const allFactors = getAllFactors();
    setFactors(allFactors);
  }, []);

  const sections = ['All', 'Situation', 'Identity', 'Definition of Situation', 'Rule Selection', 'Decision'];

  const filteredFactors = Object.values(factors).filter(factor => {
    const matchesSearch = factor.factor.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         factor.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSection = selectedSection === 'All' || factor.section === selectedSection;
    return matchesSearch && matchesSection;
  });

  const handleFactorClick = (factor) => {
    setSelectedFactor(factor);
  };

  return (
    <div style={{
      display: 'flex',
      height: '100%',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Lexend, sans-serif'
    }}>
      {/* Left Panel - Factor List */}
      <div style={{
        flex: '1',
        padding: '24px',
        borderRight: '1px solid #e9ecef',
        overflowY: 'auto'
      }}>
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ 
            margin: '0 0 16px 0', 
            color: '#2c3e50',
            fontSize: '1.5em',
            fontWeight: '600'
          }}>
            Factor Management
          </h2>
          <p style={{
            margin: '0 0 16px 0',
            color: '#6c757d',
            fontSize: '0.9em',
            lineHeight: '1.4'
          }}>
            View and explore factors used throughout the application. 
            To modify factors, edit the FACTORS object in <code>src/utils/factorUtils.js</code>.
          </p>
          
          {/* Search and Filter */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Search factors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                fontSize: '0.9em',
                marginBottom: '8px'
              }}
            />
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #e9ecef',
                borderRadius: '4px',
                fontSize: '0.9em',
                backgroundColor: '#fff'
              }}
            >
              {sections.map(section => (
                <option key={section} value={section}>{section}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Factor List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredFactors.map((factor) => (
            <div
              key={factor.factor}
              onClick={() => handleFactorClick(factor)}
              style={{
                padding: '12px',
                backgroundColor: selectedFactor?.factor === factor.factor ? '#3498db' : '#fff',
                color: selectedFactor?.factor === factor.factor ? '#fff' : '#2c3e50',
                border: '1px solid #e9ecef',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                {factor.factor}
              </div>
              <div style={{ 
                fontSize: '0.85em', 
                opacity: 0.8,
                marginBottom: '4px'
              }}>
                {factor.description.substring(0, 80)}...
              </div>
              <div style={{
                fontSize: '0.75em',
                padding: '2px 6px',
                backgroundColor: selectedFactor?.factor === factor.factor ? 'rgba(255,255,255,0.2)' : '#e9ecef',
                borderRadius: '3px',
                display: 'inline-block'
              }}>
                {factor.section}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Factor Details */}
      <div style={{
        flex: '1',
        padding: '24px',
        overflowY: 'auto'
      }}>
        {selectedFactor ? (
          <div>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              color: '#2c3e50',
              fontSize: '1.3em',
              fontWeight: '600'
            }}>
              {selectedFactor.factor}
            </h3>
            
            <div style={{
              padding: '4px 8px',
              backgroundColor: '#3498db',
              color: '#fff',
              borderRadius: '4px',
              fontSize: '0.8em',
              display: 'inline-block',
              marginBottom: '16px'
            }}>
              {selectedFactor.section}
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                color: '#2c3e50',
                fontSize: '1em',
                fontWeight: '600'
              }}>
                Description
              </h4>
              <p style={{ 
                margin: 0, 
                color: '#495057',
                lineHeight: '1.5'
              }}>
                {selectedFactor.description}
              </p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                color: '#2c3e50',
                fontSize: '1em',
                fontWeight: '600'
              }}>
                Examples
              </h4>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px',
                color: '#495057',
                lineHeight: '1.5'
              }}>
                {selectedFactor.examples.map((example, index) => (
                  <li key={index} style={{ marginBottom: '4px' }}>
                    {example}
                  </li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ 
                margin: '0 0 8px 0', 
                color: '#2c3e50',
                fontSize: '1em',
                fontWeight: '600'
              }}>
                Related Factors
              </h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {selectedFactor.relatedFactors.map((relatedFactor, index) => (
                  <span
                    key={index}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#e9ecef',
                      borderRadius: '4px',
                      fontSize: '0.8em',
                      color: '#495057'
                    }}
                  >
                    {relatedFactor}
                  </span>
                ))}
              </div>
            </div>

            {selectedFactor.researchNotes && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ 
                  margin: '0 0 8px 0', 
                  color: '#2c3e50',
                  fontSize: '1em',
                  fontWeight: '600'
                }}>
                  Research Notes
                </h4>
                <p style={{ 
                  margin: 0, 
                  color: '#495057',
                  lineHeight: '1.5',
                  fontStyle: 'italic'
                }}>
                  {selectedFactor.researchNotes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#6c757d',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3em', marginBottom: '16px' }}>📋</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>
              Select a Factor
            </h3>
            <p style={{ margin: 0, fontSize: '0.9em' }}>
              Choose a factor from the list to view its details
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactorManagement; 