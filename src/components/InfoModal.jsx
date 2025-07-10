import React from 'react';

const INFO_CONTENT = {
  personaeMapping: {
    title: "Personae Mapping Information",
    content: (
      <div style={{
        fontFamily: 'Lexend, sans-serif',
        fontSize: '0.95em',
        color: '#2c3e50',
        lineHeight: '1.6'
      }}>
        <h3 style={{
          fontSize: '1.2em',
          color: '#3498db',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          About Personae Mapping
        </h3>
        
        <p style={{ marginBottom: '16px' }}>
          The Personae Mapping section provides two different views to analyze participant responses and create comprehensive personae for your human-robot interaction study.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '1.1em',
            color: '#27ae60',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            Framework View
          </h4>
          <p style={{ marginBottom: '12px' }}>
            Visualize individual participant responses through the Personae Framework, showing how each participant navigates through:
          </p>
          <ul style={{ 
            marginLeft: '20px', 
            marginBottom: '12px',
            listStyleType: 'disc'
          }}>
            <li>Situation understanding and context</li>
            <li>Identity and personal characteristics</li>
            <li>Definition of the interaction situation</li>
            <li>Rule selection and decision-making</li>
            <li>Final decisions and actions</li>
          </ul>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '1.1em',
            color: '#27ae60',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            Summary View
          </h4>
          <p style={{ marginBottom: '12px' }}>
            Access AI-generated summaries of each participant's responses, providing insights into:
          </p>
          <ul style={{ 
            marginLeft: '20px', 
            marginBottom: '12px',
            listStyleType: 'disc'
          }}>
            <li>Key behavioral patterns and preferences</li>
            <li>Decision-making processes and rationale</li>
            <li>Individual characteristics and traits</li>
            <li>Potential interaction preferences</li>
            <li>Areas for robot adaptation</li>
          </ul>
        </div>
        
        <div style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginTop: '20px'
        }}>
          <h4 style={{
            fontSize: '1.1em',
            color: '#e67e22',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            💡 Tips for Effective Personae Mapping
          </h4>
          <ul style={{ 
            marginLeft: '20px',
            listStyleType: 'disc'
          }}>
            <li>Use the Framework View to understand individual decision-making patterns</li>
            <li>Compare participants using the sorting options (age, gender)</li>
            <li>Review summaries to identify common themes across participants</li>
            <li>Look for patterns that could inform robot behavior design</li>
            <li>Use the PDF export feature to share findings with your team</li>
          </ul>
        </div>
      </div>
    )
  },
  
  behavioralDiversity: {
    title: "Behavioral Diversity Information",
    content: (
      <div style={{
        fontFamily: 'Lexend, sans-serif',
        fontSize: '0.95em',
        color: '#2c3e50',
        lineHeight: '1.6'
      }}>
        <h3 style={{
          fontSize: '1.2em',
          color: '#3498db',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          About Behavioral Diversity Analysis
        </h3>
        
        <p style={{ marginBottom: '16px' }}>
          The Behavioral Diversity section analyzes the variety of behaviors and responses across all participants in your study, helping you understand the range of human reactions to robot interactions.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '1.1em',
            color: '#27ae60',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            Key Features
          </h4>
          <ul style={{ 
            marginLeft: '20px', 
            marginBottom: '12px',
            listStyleType: 'disc'
          }}>
            <li>Diversity metrics across different behavioral dimensions</li>
            <li>Comparison of response patterns between participants</li>
            <li>Identification of common and unique behavioral traits</li>
            <li>Statistical analysis of behavioral variations</li>
            <li>Visual representation of diversity patterns</li>
          </ul>
        </div>
        
        <div style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginTop: '20px'
        }}>
          <h4 style={{
            fontSize: '1.1em',
            color: '#e67e22',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            💡 Tips for Behavioral Diversity Analysis
          </h4>
          <ul style={{ 
            marginLeft: '20px',
            listStyleType: 'disc'
          }}>
            <li>Look for patterns in how different groups respond to robots</li>
            <li>Identify outliers that might represent unique use cases</li>
            <li>Use diversity metrics to inform robot adaptation strategies</li>
            <li>Compare diversity across different interaction contexts</li>
          </ul>
        </div>
      </div>
    )
  },
  
  situationDesign: {
    title: "Situation Design Information",
    content: (
      <div style={{
        fontFamily: 'Lexend, sans-serif',
        fontSize: '0.95em',
        color: '#2c3e50',
        lineHeight: '1.6'
      }}>
        <h3 style={{
          fontSize: '1.2em',
          color: '#3498db',
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          About Situation Design Analysis
        </h3>
        
        <p style={{ marginBottom: '16px' }}>
          The Situation Design section helps you analyze how different participants respond to various rules and situations, providing insights for designing better human-robot interaction scenarios.
        </p>
        
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{
            fontSize: '1.1em',
            color: '#27ae60',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            Key Features
          </h4>
          <ul style={{ 
            marginLeft: '20px', 
            marginBottom: '12px',
            listStyleType: 'disc'
          }}>
            <li>Rule-based analysis of participant responses</li>
            <li>Situation-specific behavior patterns</li>
            <li>Participant grouping by rule selection</li>
            <li>Detailed response analysis for each situation</li>
            <li>Export capabilities for further analysis</li>
          </ul>
        </div>
        
        <div style={{
          background: '#f8f9fa',
          padding: '16px',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginTop: '20px'
        }}>
          <h4 style={{
            fontSize: '1.1em',
            color: '#e67e22',
            marginBottom: '8px',
            fontWeight: '600'
          }}>
            💡 Tips for Situation Design Analysis
          </h4>
          <ul style={{ 
            marginLeft: '20px',
            listStyleType: 'disc'
          }}>
            <li>Click on rules to see which participants selected them</li>
            <li>Analyze participant responses to understand decision-making</li>
            <li>Look for patterns in how rules are applied across situations</li>
            <li>Use insights to design more effective interaction scenarios</li>
          </ul>
        </div>
      </div>
    )
  }
};

const InfoModal = ({ isOpen, onClose, type }) => {
  if (!isOpen || !type || !INFO_CONTENT[type]) {
    return null;
  }

  const { title, content } = INFO_CONTENT[type];

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
        background: '#fff',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontFamily: 'Lexend, sans-serif',
            fontSize: '1.5em',
            color: '#2c3e50',
            margin: 0
          }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5em',
              cursor: 'pointer',
              color: '#7f8c8d',
              padding: '4px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#f8f9fa';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>
        {content}
        
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '24px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#3498db',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Lexend, sans-serif',
              fontWeight: '500',
              fontSize: '0.95em',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = '#2980b9';
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = '#3498db';
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfoModal; 