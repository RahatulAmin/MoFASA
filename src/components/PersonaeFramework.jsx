import React, { useRef, useEffect, useState } from 'react';
import { SECTIONS, connectionPairs } from '../constants/frameAnalysis';

const PersonaeFramework = ({ 
  selectedParticipant, 
  currentScope,
  selectedRules = []
}) => {
  const boxRefs = useRef(SECTIONS.map(() => React.createRef()));
  const [connections, setConnections] = useState([]);

  // Manual refresh function for connections
  const refreshConnections = useRef(() => {});

  // Calculate box positions and update connections
  useEffect(() => {
    const calculateConnections = () => {
      const boxes = boxRefs.current.map(ref => ref.current?.getBoundingClientRect());
      if (!boxes.every(box => box)) return [];

      const rightPanel = document.querySelector('.right-panel');
      if (!rightPanel) return [];
      
      const panelRect = rightPanel.getBoundingClientRect();
      
      // Get the scrollable container
      const scrollContainer = rightPanel.querySelector('div[style*="overflowY"]');
      const scrollTop = scrollContainer ? scrollContainer.scrollTop : 0;
      
      // Account for the scope header height (60px)
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
        
        // Calculate start point (adjust for header and scroll)
        const startX = pair.fromSide === 'right' 
          ? fromBox.left - panelRect.left + fromBox.width 
          : fromBox.left - panelRect.left;
        const startY = fromBox.top - adjustedTop + (fromBox.height * 2/3) - scrollTop; 

        // Calculate end point with proper spacing (adjust for header and scroll)
        const toKey = `${pair.to}-${pair.toSide}`;
        const totalConnections = connectionCounts[toKey];
        const connectionIndex = connectionPairs
          .filter((p, i) => i < index && p.to === pair.to && p.toSide === pair.toSide)
          .length;

        let endX = pair.toSide === 'left'
          ? toBox.left - panelRect.left
          : toBox.left - panelRect.left + toBox.width;

        // Calculate vertical offset for multiple connections
        let endY = toBox.top - adjustedTop + toBox.height / 3 - scrollTop;
        if (totalConnections > 1) {
          const spacing = 20; // Gap between lines
          const totalHeight = (totalConnections - 1) * spacing;
          const startOffset = -totalHeight / 2;
          endY += startOffset + (connectionIndex * spacing);
        }

        // Calculate horizontal offset based on vertical distance
        const verticalDistance = Math.abs(startY - endY);
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
    
    // Recalculate on scroll with throttling
    const scrollContainer = document.querySelector('.right-panel > div');
    if (scrollContainer) {
      let scrollTimeout;
      const handleScroll = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(calculateConnections, 16); // ~60fps
      };
      scrollContainer.addEventListener('scroll', handleScroll);
      
      // Cleanup scroll listener
      return () => {
        clearTimeout(scrollTimeout);
        scrollContainer.removeEventListener('scroll', handleScroll);
      };
    }

    // Recalculate on window resize
    const handleResize = () => {
      setTimeout(calculateConnections, 50);
    };
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect content changes
    let resizeObserver;
    if (window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(calculateConnections, 50);
      });
      
      // Observe the right panel and its scrollable content
      const rightPanel = document.querySelector('.right-panel');
      if (rightPanel) {
        resizeObserver.observe(rightPanel);
      }
      
      const scrollContainer = document.querySelector('.right-panel > div');
      if (scrollContainer) {
        resizeObserver.observe(scrollContainer);
      }
    }

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [selectedParticipant, selectedRules, currentScope]);

  // Additional effect to handle content changes that might affect box heights
  useEffect(() => {
    // Refresh connections when answers change
    const timeoutId = setTimeout(() => {
      refreshConnections.current();
    }, 100);
    
    return () => clearTimeout(timeoutId);
  }, [selectedParticipant?.answers, selectedRules]);

  return (
    <div style={{ 
      background: 'linear-gradient(180deg,rgb(55, 70, 83) 0%, #232b32 100%)', 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%',
      position: 'relative'
    }}>
      {/* Current Scope Header */}
      {currentScope && (
        <div style={{
          padding: '16px 24px',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          //borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
          color: 'white',
          fontFamily: 'Lexend, sans-serif',
          fontSize: '1.1em',
          fontWeight: '600',
          textAlign: 'center'
        }}>
          Current Scope: {currentScope.scopeNumber || 'No description'}
        </div>
      )}
      
      {/* SVG Container for Lines */}
      <svg 
        style={{ 
          position: 'absolute',
          top: currentScope ? '60px' : '0',
          left: 0,
          right: '16px', // Leave space for scrollbar
          height: currentScope ? 'calc(100% - 60px)' : '100%',
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
        
        {connections.map((connection, index) => (
          <g key={index}>
            {/* Connection line */}
            <path
              d={connection.path}
              stroke="url(#lineGradient)"
              strokeWidth="1"
              fill="none"
              opacity="2"
              markerEnd="url(#arrowhead)"
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
            />
          </g>
        ))}
      </svg>

      {/* Scrollable Boxes Area */}
      <div style={{ 
        flex: 1,
        overflowY: 'auto', 
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
                selectedParticipant?.answers?.[section.name] && 
                Object.entries(selectedParticipant.answers[section.name]).map(([questionId, answer]) => {
                  // Skip selectedRules as it's handled separately
                  if (questionId === 'selectedRules') return null;
                  return answer ? (
                    <div key={questionId} style={{ marginBottom: 12 }}>
                      {answer}
                    </div>
                  ) : null;
                }) || []
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonaeFramework; 