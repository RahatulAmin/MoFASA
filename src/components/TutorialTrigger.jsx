import React from 'react';

const TutorialTrigger = ({ tutorialType, onStartTutorial, className, children, style, ...props }) => {
  const handleClick = (event) => {
    // Prevent default if this is wrapping a button or link
    event.preventDefault();
    event.stopPropagation();
    
    if (onStartTutorial) {
      onStartTutorial(tutorialType);
    }
  };

  return (
    <div 
      className={`tutorial-trigger ${className || ''}`}
      onClick={handleClick}
      style={{ 
        cursor: 'pointer',
        position: 'relative',
        ...style 
      }}
      {...props}
    >
      {children}
      {/* Optional tutorial indicator */}
      <div
        style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '8px',
          height: '8px',
          backgroundColor: '#3498db',
          borderRadius: '50%',
          animation: 'pulse 1.5s infinite',
          pointerEvents: 'none'
        }}
      />
    </div>
  );
};

export default TutorialTrigger; 