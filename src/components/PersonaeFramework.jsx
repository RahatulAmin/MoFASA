import React, { useRef, useEffect, useState } from 'react';
import { SECTIONS, connectionPairs } from '../constants/frameAnalysis';
import { parseFactors } from '../utils/factorUtils';

const CONNECTION_EXPLANATIONS = {
  'A': {
    title: 'Connection A: Situation → Identity',
    explanation: 'The situation is perceived by the individual\'s identity.'
  },
  'B': {
    title: 'Connection B: Situation → Definition of Situation',
    explanation: 'Connection B and C work together to define the situation.'
  },
  'C': {
    title: 'Connection C: Identity → Definition of Situation',
    explanation: 'An individual\'s identity shapes how they define and understand the situation. (Connection B + Connection C)'
  },
  'D': {
    title: 'Connection D: Identity → Rule Selection',
    explanation: 'Connection D and E work together to determine which rules or norms individuals choose to follow.'
  },
  'E': {
    title: 'Connection E: Definition of Situation → Rule Selection',
    explanation: 'How individuals define the situation determines which rules they consider applicable. (Connection D + Connection E)'
  },
  'F': {
    title: 'Connection F: Rule Selection → Decision',
    explanation: 'The selected rules guide the final decision or course of action.'
  }
};

const PersonaeFramework = ({ 
  selectedParticipant, 
  currentScope,
  selectedRules = [],
  questions = {},
  onFactorClick = () => {}
}) => {
  const boxRefs = useRef(SECTIONS.map(() => React.createRef()));
  const [connections, setConnections] = useState([]);
  const [showConnectionModal, setShowConnectionModal] = useState(false);
  const [selectedConnection, setSelectedConnection] = useState(null);

  // Reference for connection calculation function
  const refreshConnections = useRef(() => {});

  const handleConnectionClick = (label) => {
    const connectionInfo = CONNECTION_EXPLANATIONS[label];
    if (connectionInfo) {
      setSelectedConnection(connectionInfo);
      setShowConnectionModal(true);
    }
  };

  // Calculate box positions and update connections
  useEffect(() => {
    const calculateConnections = () => {
      const boxes = boxRefs.current.map(ref => ref.current?.getBoundingClientRect());
      if (!boxes.every(box => box)) return [];

      const rightPanel = document.querySelector('.right-panel');
      if (!rightPanel) return [];
      
      const panelRect = rightPanel.getBoundingClientRect();
      
      // Account for the scope header height (60px) that's now in the parent
      const headerHeight = 60;
      const adjustedTop = panelRect.top + headerHeight;

      // First, calculate how many connections go to each box side
      const connectionCounts = {};
      connectionPairs.forEach(pair => {
        // Format: "boxIndex-side" (e.g., "2-left")
        const toKey = `${pair.to}-${pair.toSide}`;
        connectionCounts[toKey] = (connectionCounts[toKey] || 0) + 1;
      });

      // Calculate paths with proper spacing
      const paths = connectionPairs.map((pair, index) => {
        const fromBox = boxes[pair.from];
        const toBox = boxes[pair.to];
        
        // Calculate start point (no scroll adjustment needed)
        const startX = pair.fromSide === 'right' 
          ? fromBox.left - panelRect.left + fromBox.width 
          : fromBox.left - panelRect.left;
        const startY = fromBox.top - adjustedTop + (fromBox.height * 2/3); 

        // Calculate end point with proper spacing
        const toKey = `${pair.to}-${pair.toSide}`;
        const totalConnections = connectionCounts[toKey];
        const connectionIndex = connectionPairs
          .filter((p, i) => i < index && p.to === pair.to && p.toSide === pair.toSide)
          .length;

        let endX = pair.toSide === 'left'
          ? toBox.left - panelRect.left
          : toBox.left - panelRect.left + toBox.width;

        // Calculate vertical offset for multiple connections
        let endY = toBox.top - adjustedTop + toBox.height / 3;
        if (totalConnections > 1) {
          const spacing = 20; // Gap between lines
          const totalHeight = (totalConnections - 1) * spacing;
          const startOffset = -totalHeight / 2;
          endY += startOffset + (connectionIndex * spacing);
        }

        // Calculate horizontal offset based on vertical distance
        const horizontalOffset = pair.horizontalOffset || 20; // Default to 20 if not specified

        // Create path with proper offsets
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
          startPoint: { x: startX, y: startY },
          endPoint: { x: endX, y: endY },
          direction: pair.toSide === 'right' ? 'right' : 'left'
        };
      });
      
      setConnections(paths);
    };

    // Assign the refresh function
    refreshConnections.current = calculateConnections;

    // Initial calculation
    calculateConnections();
    
    // Recalculate after a short delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(calculateConnections, 100);

    // Debounced resize handler to prevent excessive recalculations
    let resizeTimer;
    const handleResize = () => {
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      resizeTimer = setTimeout(calculateConnections, 200);
    };
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect content changes with debouncing
    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        handleResize(); // Use the same debounced handler
      });
      
      // Observe the right panel
      const rightPanel = document.querySelector('.right-panel');
      if (rightPanel) {
        resizeObserver.observe(rightPanel);
      }
    }

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [currentScope, selectedParticipant]); // Added selectedParticipant back to refresh connections when participant changes



  return (
    <div style={{ 
      background: 'linear-gradient(180deg,rgb(55, 70, 83) 0%, #232b32 100%)', 
      height: '100%',
      position: 'relative'
    }}>
      
      {/* SVG Container for Lines - positioned relative to content */}
      <svg 
        style={{ 
          position: 'absolute',
          top: 0,
          left: 0,
          right: '16px', // Leave space for scrollbar
          height: '100%',
          pointerEvents: 'none',
          overflow: 'visible',
          zIndex: 100
        }}
      >
        {/* Definitions for gradients and filters */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style={{stopColor: 'rgba(255, 255, 255, 0.8)', stopOpacity: 1}} />
            <stop offset="100%" style={{stopColor: 'rgba(255, 255, 255, 0.4)', stopOpacity: 1}} />
          </linearGradient>
          <filter id="dotGlow">
            <feGaussianBlur stdDeviation="1" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" 
            refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 8 3.5, 0 7" fill="rgba(255, 255, 255, 0.8)" />
          </marker>
        </defs>
        
        {connections.map((connection, index) => {
          // Calculate the middle point of the actual path
          const pair = connectionPairs[index];
          const startX = connection.startPoint.x;
          const startY = connection.startPoint.y;
          const endX = connection.endPoint.x;
          const endY = connection.endPoint.y;
          const horizontalOffset = pair?.horizontalOffset || 30;
          
          // Calculate the middle point based on the actual path structure
          let midX, midY;
          
          if (Math.abs(startY - endY) > 20) {
            // For paths with vertical segments
            if (pair?.fromSide === pair?.toSide) {
              // Same side connection - label at middle of vertical segment
              midX = pair?.fromSide === 'right' ? startX + horizontalOffset : startX - horizontalOffset;
              midY = (startY + endY) / 2;
            } else {
              // Different side connection - complex path with multiple segments
              // Place label at the middle of the horizontal segment in the middle
              const firstHorizontalX = pair?.fromSide === 'right' ? startX + horizontalOffset : startX - horizontalOffset;
              const secondHorizontalX = pair?.fromSide === 'right' ? firstHorizontalX + horizontalOffset : firstHorizontalX - horizontalOffset;
              midX = (firstHorizontalX + secondHorizontalX) / 2;
              
              // Adjust label position based on connection direction
              if (pair?.toSide === 'right') {
                midX -= 12; // Move right-side labels further right
              } else {
                midX += 12; // Move left-side labels further left
              }
              
              midY = (startY + endY) / 2;
            }
          } else {
            // For mostly horizontal paths
            midX = (startX + endX) / 2;
            midY = startY; // Use startY since the path is mostly horizontal
          }
          
          const label = pair?.label || '';
          
          return (
          <g key={index}>
            {/* Connection line */}
            <path
              d={connection.path}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              fill="none"
              opacity="2"
              markerEnd="url(#arrowhead)"
                style={{ pointerEvents: 'none' }}
            />
            
            {/* Start point dot */}
            <circle
              cx={connection.startPoint.x}
              cy={connection.startPoint.y}
              r="4"
              fill="rgba(210, 233, 255, 0.9)"
              stroke="rgba(124, 193, 240, 0.8)"
              strokeWidth="1"
              filter="url(#dotGlow)"
                style={{ pointerEvents: 'none' }}
              />
              
              {/* Label in the middle of the line */}
              {label && (
                <g 
                  style={{ pointerEvents: 'auto' }}
                  onMouseEnter={(e) => {
                    const group = e.currentTarget;
                    const circle = group.querySelector('circle');
                    const text = group.querySelector('text');
                    if (circle) {
                      circle.setAttribute('fill', 'rgba(52, 152, 219, 0.9)');
                      circle.setAttribute('stroke', 'rgba(52, 152, 219, 1)');
                    }
                    if (text) {
                      text.setAttribute('fill', '#fff');
                    }
                  }}
                  onMouseLeave={(e) => {
                    const group = e.currentTarget;
                    const circle = group.querySelector('circle');
                    const text = group.querySelector('text');
                    if (circle) {
                      circle.setAttribute('fill', 'rgba(255, 255, 255, 0.9)');
                      circle.setAttribute('stroke', 'rgba(52, 152, 219, 0.8)');
                    }
                    if (text) {
                      text.setAttribute('fill', '#2c3e50');
                    }
                  }}
                >
                  {/* Background circle for label */}
                  <circle
                    cx={midX}
                    cy={midY}
                    r="12"
                    fill="rgba(255, 255, 255, 0.9)"
                    stroke="rgba(52, 152, 219, 0.8)"
                    strokeWidth="1"
                    filter="url(#dotGlow)"
                    style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.2s ease' }}
                    onClick={() => handleConnectionClick(label)}
                  />
                  {/* Label text */}
                  <text
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="12"
                    fontWeight="600"
                    fontFamily="Lexend, sans-serif"
                    fill="#2c3e50"
                    style={{ cursor: 'pointer', pointerEvents: 'auto', transition: 'all 0.2s ease' }}
                    onClick={() => handleConnectionClick(label)}
                  >
                    {label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* Boxes Container */}
      <div style={{ 
        padding: '32px 16px 32px 0', // Add right padding to account for scrollbar
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {SECTIONS.map((section, i) => (
          <div
            key={section.name}
            ref={boxRefs.current[i]}
            style={{
              width: 420,
              background: section.color,
              borderRadius: 10,
              marginBottom: 32,
              boxShadow: '0 2px 8px 0 rgba(0,0,0,0.04)',
              border: '1.5px solid #e0e0e0',
              position: 'relative',
              padding: '18px 24px',
              display: 'flex',
              flexDirection: 'column',
              height: 'auto'
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {(currentScope?.rules || []).map((rule, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: selectedRules.includes(rule) ? '#3498db' : '#f8f9fa',
                        color: selectedRules.includes(rule) ? '#fff' : '#2c3e50',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {rule}
                    </div>
                  ))}
                </div>
              ) : section.name === 'Decision' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Array.isArray(selectedRules) && selectedRules.length > 0 ? (
                    <div style={{ marginBottom: 12 }}>
                      {selectedRules.map((rule, index) => (
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
                  ) : (
                    <div style={{
                      padding: '12px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      textAlign: 'center',
                      color: '#7f8c8d',
                      fontSize: '0.95em',
                      border: '1px dashed #bdc3c7'
                    }}>
                      No rules selected for decision
                    </div>
                  )}
                </div>
              ) : (
                questions[section.name]?.map((question, i) => {
                  const isDropdown = question.type === 'dropdown';
                  const questionId = isDropdown ? question.id : question.text;
                  const answer = selectedParticipant?.answers?.[section.name]?.[questionId];
                  const factors = question.factors;
                  return answer ? (
                    <div key={questionId} style={{ marginBottom: 12 }}>
                      <span style={{ fontWeight: 500 }}>{answer}</span>
                      {factors && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginLeft: '6px' }}>
                          {parseFactors(question.factors).map((factor, index) => (
                            <span 
                              key={index}
                              onClick={() => onFactorClick(question, factor)}
                              style={{
                                fontSize: '0.8em',
                                color: '#000000',
                                background: '#cceeff',
                                borderRadius: '8px',
                                padding: '2px 8px',
                                fontWeight: 400,
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseOver={(e) => {
                                e.target.style.background = '#99ddff';
                              }}
                              onMouseOut={(e) => {
                                e.target.style.background = '#cceeff';
                              }}
                            >
                              {factor}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null;
                }) || []
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Connection Details Modal */}
      {showConnectionModal && selectedConnection && (
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
            width: '500px',
            maxWidth: '90%',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{ 
              marginBottom: '20px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.3em',
              color: '#2c3e50',
              fontWeight: '600'
            }}>
              {selectedConnection.title}
            </h3>
            <p style={{ 
              marginBottom: '24px',
              fontFamily: 'Lexend, sans-serif',
              fontSize: '1.1em',
              color: '#34495e',
              lineHeight: '1.6'
            }}>
              {selectedConnection.explanation}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                onClick={() => setShowConnectionModal(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontFamily: 'Lexend, sans-serif',
                  fontSize: '1em',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#2980b9';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#3498db';
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PersonaeFramework; 