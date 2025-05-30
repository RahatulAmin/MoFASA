import React, { useState } from 'react';
import PersonaeBoxes from './PersonaeBoxes';

const PersonaeMapping = ({ project, participants }) => {
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [connections, setConnections] = useState([]);

  return (
    <>
      {/* Left Panel - Participant List */}
      <div className="left-panel" style={{ 
        padding: '24px',
        overflowY: 'auto'
      }}>
        <h3 style={{ marginBottom: '20px', fontFamily: 'Lexend, sans-serif' }}>Participants</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {participants.map((participant) => (
            <button
              key={participant.id}
              onClick={() => setSelectedParticipant(participant)}
              style={{
                padding: '10px',
                backgroundColor: selectedParticipant?.id === participant.id ? '#2980b9' : '#f8f9fa',
                color: selectedParticipant?.id === participant.id ? 'white' : '#2c3e50',
                border: '1px solid #dcdde1',
                borderRadius: '6px',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'Lexend, sans-serif',
                transition: 'all 0.2s'
              }}
            >
              {participant.name}
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel - Frame Analysis Boxes */}
      <div className="right-panel" style={{ 
        background: 'linear-gradient(180deg,rgb(55, 70, 83) 0%, #232b32 100%)',
        position: 'relative',
        overflowY: 'auto'
      }}>
        {selectedParticipant ? (
          <>
            <PersonaeBoxes 
              selectedParticipant={selectedParticipant}
              onConnectionsCalculated={setConnections}
              showConnections={true}
            />

            {/* SVG Container for Lines */}
            <svg 
              style={{ 
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
                zIndex: 1
              }}
            >
              {connections.map((connection, index) => (
                <g key={index}>
                  <path
                    d={connection.path}
                    stroke="rgba(255, 255, 255, 0.6)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d={`M ${connection.arrow.x} ${connection.arrow.y} 
                       l ${connection.arrow.direction === 'right' ? '8' : '-8'} -4 
                       l 0 8 z`}
                    fill="rgba(255, 255, 255, 0.6)"
                  />
                </g>
              ))}
            </svg>
          </>
        ) : (
          <div style={{ 
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#fff',
            fontFamily: 'Lexend, sans-serif',
            fontSize: '1.1em'
          }}>
            Select a participant to view their frame analysis
          </div>
        )}
      </div>
    </>
  );
};

export default PersonaeMapping; 