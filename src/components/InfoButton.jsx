import React from 'react';

const InfoButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="info-button"
    >
      <span className="info-button-icon">
        i
      </span>
    </button>
  );
};

export default InfoButton; 