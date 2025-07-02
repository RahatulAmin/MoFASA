import React, { useState, useEffect, memo } from 'react';

const DeepSeekStatus = memo(() => {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const result = await window.electronAPI.getDeepSeekStatus();
        setStatus(result.status);
      } catch (error) {
        setStatus('disconnected');
      }
    };

    // Check status immediately
    checkStatus();

    // Check status every 30 seconds instead of 5 seconds
    const interval = setInterval(checkStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return '#27ae60'; // Green
      case 'disconnected':
        return '#e74c3c'; // Red
      default:
        return '#f1c40f'; // Yellow for checking
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'LLM Connected';
      case 'disconnected':
        return 'LLM Disconnected';
      default:
        return 'Checking LLM...';
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      marginTop: 'auto',
      marginBottom: '12px',
      borderRadius: '4px',
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      fontSize: '0.9em',
      fontFamily: 'Lexend, sans-serif'
    }}>
      <div style={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: getStatusColor(),
        transition: 'background-color 0.3s ease'
      }} />
      <span style={{ color: '#fff' }}>{getStatusText()}</span>
    </div>
  );
});

DeepSeekStatus.displayName = 'DeepSeekStatus';

export default DeepSeekStatus; 