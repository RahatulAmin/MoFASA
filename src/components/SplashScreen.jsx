import React from 'react';
import './SplashScreen.css';

const SplashScreen = () => (
  <div className="splash-root">
    <div className="splash-center">
      <h1 className="splash-title">MoFASA Tools</h1>
      <div className="splash-loader"></div>
    </div>
    <div className="splash-footer">
      &copy; 2025 MoFASA Tools. Open-Source Project.
    </div>
  </div>
);

export default SplashScreen; 