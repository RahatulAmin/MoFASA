import React, { useEffect, useState } from 'react';

const SplashScreen = () => {
  const [dots, setDots] = useState('');
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Fade in effect
    setTimeout(() => setFadeIn(true), 100);

    // // Animated dots
    // const interval = setInterval(() => {
    //   setDots(prev => prev.length >= 3 ? '' : prev + '.');
    // }, 500);

    // No cleanup needed since interval is commented out
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      background: 'linear-gradient(135deg, #667eea 0%,rgb(63, 51, 129) 100%)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontFamily: 'Lexend, sans-serif',
      overflow: 'hidden'
    }}>
      {/* Animated background particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        opacity: 0.3
      }}>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: '4px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.8)',
              borderRadius: '50%',
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animation: `float ${3 + Math.random() * 4}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 2}s`
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={{
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeIn ? 1 : 0,
        transform: fadeIn ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s ease-out',
        zIndex: 1
      }}>
        {/* Logo/Icon */}
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '20px',
          background: 'linear-gradient(45deg, #ff6b6b, #4ecdc4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          animation: 'pulse 2s ease-in-out infinite',
          fontSize: '2em',
          fontWeight: 'bold'
        }}>
          M
        </div>

        {/* Title with gradient text */}
        <h1 style={{
          fontSize: '3em',
          marginBottom: '10px',
          fontWeight: '700',
          margin: 0,
          background: 'linear-gradient(45deg, #fff, #f0f0f0)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textShadow: '0 2px 10px rgba(0,0,0,0.3)',
          animation: 'glow 2s ease-in-out infinite alternate'
        }}>
          MoFASA Tools
        </h1>

        {/* Subtitle */}
        <p style={{
          fontSize: '1.1em',
          marginBottom: '30px',
          opacity: 0.9,
          fontWeight: '300',
          letterSpacing: '1px'
        }}>
          Social Appropriateness-Based Analysis Framework
        </p>

        {/* Enhanced loading spinner */}
        <div style={{
          position: 'relative',
          width: '60px',
          height: '60px',
          marginBottom: '20px'
        }}>
          {/* Outer ring */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            border: '3px solid rgba(255, 255, 255, 0.2)',
            borderTop: '3px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1.5s linear infinite'
          }}></div>
          
          {/* Inner ring */}
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            width: '40px',
            height: '40px',
            border: '2px solid rgba(255, 255, 255, 0.1)',
            borderTop: '2px solid rgba(255, 255, 255, 0.6)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite reverse'
          }}></div>
        </div>

        {/* Loading text with animated dots */}
        {/* <div style={{
          fontSize: '1em',
          opacity: 0.8,
          fontWeight: '400'
        }}>
          Loading{dots}
        </div> */}
      </div>

      {/* Footer */}
      <div style={{
        padding: '20px',
        fontSize: '0.9em',
        opacity: 0.7,
        textAlign: 'center',
        zIndex: 1
      }}>
        <div style={{ marginBottom: '5px' }}>
          &copy; 2025 MoFASA Tools
        </div>
        <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
          Open-Source Project
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes glow {
          from { filter: drop-shadow(0 0 5px rgba(255,255,255,0.5)); }
          to { filter: drop-shadow(0 0 20px rgba(255,255,255,0.8)); }
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
      `}</style>
    </div>
  );
};

export default SplashScreen; 