import React from 'react';

const FactorDetailsModal = ({ 
  isOpen, 
  onClose, 
  factorDetails 
}) => {
  if (!isOpen || !factorDetails) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '32px',
        borderRadius: '12px',
        width: '600px',
        maxWidth: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        fontFamily: 'Lexend, sans-serif'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          borderBottom: '2px solid #e9ecef',
          paddingBottom: '16px'
        }}>
          <div>
            <h2 style={{ 
              margin: 0, 
              color: '#2c3e50',
              fontSize: '1.4em',
              fontWeight: '600'
            }}>
              {factorDetails.factor}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: '#95a5a6',
              padding: '4px',
              borderRadius: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#e74c3c'}
            onMouseOut={(e) => e.target.style.color = '#95a5a6'}
          >
            ×
          </button>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#34495e',
            fontSize: '1.1em',
            fontWeight: '600'
          }}>
            Question
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#2c3e50',
            fontSize: '1em',
            lineHeight: '1.5',
            padding: '12px',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            border: '1px solid #e9ecef'
          }}>
            {factorDetails.questionText}
          </p>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#34495e',
            fontSize: '1.1em',
            fontWeight: '600'
          }}>
            Factor Description
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#2c3e50',
            fontSize: '1em',
            lineHeight: '1.6'
          }}>
            {factorDetails.description}
          </p>
        </div>

        {/* <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#34495e',
            fontSize: '1.1em',
            fontWeight: '600'
          }}>
            Examples
          </h3>
          <ul style={{ 
            margin: 0, 
            paddingLeft: '20px',
            color: '#2c3e50',
            fontSize: '0.95em',
            lineHeight: '1.6'
          }}>
            {factorDetails.examples.map((example, index) => (
              <li key={index} style={{ marginBottom: '8px' }}>
                {example}
              </li>
            ))}
          </ul>
        </div> */}

        {/* <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#34495e',
            fontSize: '1.1em',
            fontWeight: '600'
          }}>
            Related Factors
          </h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {factorDetails.relatedFactors.map((factor, index) => (
              <span key={index} style={{
                fontSize: '0.85em',
                color: '#000000',
                background: '#cceeff',
                borderRadius: '6px',
                padding: '4px 8px',
                fontWeight: '500'
              }}>
                {factor}
              </span>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ 
            margin: '0 0 12px 0', 
            color: '#34495e',
            fontSize: '1.1em',
            fontWeight: '600'
          }}>
            Research Notes
          </h3>
          <p style={{ 
            margin: 0, 
            color: '#2c3e50',
            fontSize: '0.95em',
            lineHeight: '1.6',
            fontStyle: 'italic'
          }}>
            {factorDetails.researchNotes}
          </p>
        </div> */}

        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          borderTop: '1px solid #e9ecef',
          paddingTop: '16px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95em',
              fontWeight: '500',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = '#2980b9'}
            onMouseOut={(e) => e.target.style.backgroundColor = '#3498db'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default FactorDetailsModal; 