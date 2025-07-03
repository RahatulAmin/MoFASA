import React from 'react';

const About = () => {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div className="left-panel" style={{ width: '30%', padding: '20px', borderRight: '1px solid #ddd' }}>
        <h2>About MoFASA</h2>
        <p>Learn more about the MoFASA project and its features.</p>
      </div>
      <div className="right-panel" style={{ width: '70%', padding: '20px' }}>
        <h2>Contact Information</h2>
        <p>Get in touch with the MoFASA team.</p>
      </div>
    </div>
  );
};

export default About; 