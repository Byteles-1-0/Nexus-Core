// src/components/common/LoadingOverlay.jsx
import React from 'react';

const LoadingOverlay = ({ isVisible, text = 'Elaborazione in corso...' }) => {
  if (!isVisible) return null;

  return (
    <div className="loading-overlay active">
      <div className="loader">
        <div className="loader-spinner"></div>
        <p className="loader-text">{text}</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
