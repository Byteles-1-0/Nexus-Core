// src/components/welcome/WelcomeProcessing.jsx
import React from 'react';

const WelcomeProcessing = ({ currentStep, statusText }) => {
  const steps = [
    { id: 1, icon: 'ri-file-search-line', label: 'Estrazione testo' },
    { id: 2, icon: 'ri-robot-2-line', label: 'Analisi AI' },
    { id: 3, icon: 'ri-check-double-line', label: 'Riconoscimento' }
  ];

  return (
    <div className="welcome-phase active">
      <div className="processing-container">
        <div className="processing-icon">
          <div className="processing-ring"></div>
          <i className="ri-brain-line"></i>
        </div>
        <h2 className="processing-title">Stiamo analizzando il contratto...</h2>
        <p className="processing-subtitle">{statusText}</p>
        <div className="processing-steps">
          {steps.map((step) => (
            <div
              key={step.id}
              className={`processing-step ${
                step.id < currentStep ? 'done' : 
                step.id === currentStep ? 'active' : ''
              }`}
            >
              <i className={step.icon}></i>
              <span>{step.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WelcomeProcessing;
