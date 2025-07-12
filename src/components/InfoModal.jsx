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
          Personae Mapping
        </h3>
        
        <p style={{ marginBottom: '16px' }}>
        The Personae Mapping section offers two complementary views for analyzing participant responses and building a 
        comprehensive understanding of how individuals perceive and act within a given HRI scenario. 
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
          Visualize each participant’s responses through the lens of the MoFASA Framework. This view highlights how participants 
          define the situation based on their identity, and how those interpretations shape the decisions they perceive as appropriate.
          </p>
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
          This view allows you to review concise summaries of all participant responses. It is especially useful for identifying 
          commonalities and differences across participants — helping you spot patterns in how various individuals interpret and 
          engage with the same robot behavior.
          </p>          
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
          Behavioral Diversity
        </h3>
        
        <p style={{ marginBottom: '16px' }}>
          The Behavioral Diversity section lets user analyze the spectrum of behaviors and responses across all participants in the study. 
          It also gives a visual representation of the participant's responses in a statistical view. 
        </p>   
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
          Situation Design
        </h3>
        
        <p style={{ marginBottom: '16px' }}>
        The Situation Design section helps you identify undesirable behavioral rules from the generated list. 
        These rules can then be mapped back to specific participants, allowing you to trace the underlying 
        MoFASA factors that influenced those decisions.  
        </p>
        
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
            <li>Click on a rule to see which participants followed it.</li>
            <li>Use the participant accordion to explore relevant factors across the three MoFASA dimensions: <em>Situation, Identity, and Definition of the Situation.</em></li>
            <li>Based on your analysis of patterns in rule selection, brainstorm ways to either:
              <ul style={{ marginLeft: '20px' }}>
                <li>Redesign robot behavior to better match participants’ expectations.</li>
                <li>Modify the environment to support more socially appropriate engagement.</li>
              </ul>
            </li>            
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