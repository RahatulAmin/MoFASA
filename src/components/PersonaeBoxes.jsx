import React, { useRef, useEffect } from 'react';
import { SECTIONS, connectionPairs } from '../constants/frameAnalysis';

const PersonaeBoxes = ({ 
  selectedParticipant, 
  onConnectionsCalculated,
  showConnections = false,  // Optional prop to determine if connections should be shown
  project  // Add project prop to access all rules
}) => {
  const boxRefs = useRef(SECTIONS.map(() => React.createRef()));

  useEffect(() => {
    if (selectedParticipant && showConnections) {
      calculateConnections();
      
      // Add resize listener
      const handleResize = () => {
        requestAnimationFrame(calculateConnections);
      };
      window.addEventListener('resize', handleResize);
      
      // Cleanup
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [selectedParticipant, showConnections]);

  const calculateConnections = () => {
    const boxes = boxRefs.current.map(ref => ref.current?.getBoundingClientRect());
    if (!boxes.every(box => box)) return [];

    const rightPanel = document.querySelector('.right-panel');
    if (!rightPanel) return [];
    
    const panelRect = rightPanel.getBoundingClientRect();

    // First, calculate how many connections go to each box side
    const connectionCounts = {};
    connectionPairs.forEach(pair => {
      const toKey = `${pair.to}-${pair.toSide}`;
      connectionCounts[toKey] = (connectionCounts[toKey] || 0) + 1;
    });

    // Calculate paths with proper spacing
    const paths = connectionPairs.map((pair, index) => {
      const fromBox = boxes[pair.from];
      const toBox = boxes[pair.to];
      
      const startX = pair.fromSide === 'right' 
        ? fromBox.left - panelRect.left + fromBox.width 
        : fromBox.left - panelRect.left;
      const startY = fromBox.top - panelRect.top + (fromBox.height * 2/3); 

      const toKey = `${pair.to}-${pair.toSide}`;
      const totalConnections = connectionCounts[toKey];
      const connectionIndex = connectionPairs
        .filter((p, i) => i < index && p.to === pair.to && p.toSide === pair.toSide)
        .length;

      let endX = pair.toSide === 'left'
        ? toBox.left - panelRect.left
        : toBox.left - panelRect.left + toBox.width;

      let endY = toBox.top - panelRect.top + toBox.height / 3;
      if (totalConnections > 1) {
        const spacing = 20;
        const totalHeight = (totalConnections - 1) * spacing;
        const startOffset = -totalHeight / 2;
        endY += startOffset + (connectionIndex * spacing);
      }

      const horizontalOffset = pair.horizontalOffset || 20;

      return {
        path: `
          M ${startX} ${startY}
          ${pair.fromSide === 'right' ? 'h' : 'h -'}${horizontalOffset}
          ${Math.abs(startY - endY) > 20 ? `
          ${pair.fromSide === pair.toSide ? 
            `V ${endY}` : 
            `h ${pair.fromSide === 'right' ? horizontalOffset : -horizontalOffset}
            V ${endY}
            h ${pair.fromSide === 'right' ? -horizontalOffset : horizontalOffset}`
          }` : 
          `V ${endY}`}
          ${pair.toSide === 'right' ? 'h' : 'h -'}${horizontalOffset}
        `,
        arrow: {
          x: endX + (pair.toSide === 'right' ? -1 : 1),
          y: endY,
          direction: pair.toSide === 'right' ? 'left' : 'right'
        }
      };
    });
    
    onConnectionsCalculated(paths);
  };

  return (
    <>
      {/* Frame Analysis Boxes */}
      <div style={{ 
        display: 'flex',
        flexDirection: 'column',
        gap: '32px',
        alignItems: 'center',
        padding: '32px'
      }}>
        {SECTIONS.map((section, i) => (
          <div
            key={section.name}
            ref={boxRefs.current[i]}
            style={{
              width: 420,
              background: section.color,
              borderRadius: 10,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
              border: '1.5px solid #e0e0e0',
              position: 'relative',
              padding: '18px 24px'
            }}
          >
            <div style={{ 
              fontWeight: 700, 
              fontFamily: 'Lexend, sans-serif', 
              fontSize: '1.1em', 
              marginBottom: 10 
            }}>
              {section.name}
            </div>
            <div style={{ 
              fontFamily: 'Lexend, sans-serif', 
              fontSize: '1em', 
              color: '#222', 
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word'
            }}>
              {section.name === 'Rule Selection' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {(project?.rules || []).map((rule, index) => {
                    const isSelected = selectedParticipant.answers?.['Rule Selection']?.selectedRules?.includes(rule);
                    return (
                      <div
                        key={index}
                        style={{
                          padding: '8px 12px',
                          backgroundColor: isSelected ? '#3498db' : '#f8f9fa',
                          color: isSelected ? '#fff' : '#2c3e50',
                          borderRadius: '4px',
                          border: '1px solid #e0e0e0',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {rule}
                      </div>
                    );
                  })}
                </div>
              ) : section.name === 'Decision' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {selectedParticipant.answers?.['Rule Selection']?.selectedRules?.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <strong style={{ 
                        display: 'block',
                        marginBottom: '8px',
                        color: '#2c3e50'
                      }}>
                        Selected Rules for Decision:
                      </strong>
                      {selectedParticipant.answers['Rule Selection'].selectedRules.map((rule, index) => (
                        <div
                          key={index}
                          style={{
                            padding: '8px 12px',
                            marginTop: 4,
                            backgroundColor: '#f8f9fa',
                            borderRadius: '4px',
                            fontSize: '0.95em',
                            color: '#2c3e50',
                            border: '1px solid #e0e0e0'
                          }}
                        >
                          {rule}
                        </div>
                      ))}
                    </div>
                  )}
                  {Object.entries(selectedParticipant.answers?.[section.name] || {}).map(([key, value]) => (
                    value ? <div key={key} style={{ marginBottom: 12 }}>{value}</div> : null
                  ))}
                </div>
              ) : (
                Object.entries(selectedParticipant.answers?.[section.name] || {}).map(([key, value]) => (
                  value ? <div key={key} style={{ marginBottom: 12 }}>{value}</div> : null
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default PersonaeBoxes; 