// src/components/welcome/WelcomeGreeting.jsx
import React, { useEffect, useState } from 'react';

const WelcomeGreeting = ({ onContinue }) => {
  const [showLang, setShowLang] = useState(false);

  useEffect(() => {
    setTimeout(() => setShowLang(true), 100);
  }, []);

  return (
    <div className="welcome-phase active">
      <div className="greeting-multi-lang-container">
        <h1 className={`greeting-multi-title ${showLang ? 'show-lang' : ''}`}>
          Benvenuti
        </h1>
      </div>
      
      <div className="greeting-container greeting-fade-in" style={{
        position: 'absolute',
        bottom: '10%',
        zIndex: 10,
        width: '100%',
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="greeting-checkmark" style={{
          background: 'rgba(99, 102, 241, 0.1)',
          borderColor: 'rgba(99, 102, 241, 0.3)',
          width: '60px',
          height: '60px',
          fontSize: '1.8rem',
          marginBottom: '1.5rem'
        }}>
          <i className="ri-check-double-line" style={{ color: 'var(--accent)' }}></i>
        </div>
        <p className="greeting-subtitle" style={{
          fontSize: '1.1rem',
          color: 'rgba(255,255,255,0.8)',
          maxWidth: '600px',
          margin: '0 auto 2rem auto',
          lineHeight: 1.6,
          textAlign: 'center'
        }}>
          Il contratto è stato analizzato con successo dall'AI.<br />
          Verifica i dati estratti e procedi all'importazione.
        </p>
        <button
          className="welcome-btn-start"
          onClick={onContinue}
          style={{
            width: 'auto',
            minWidth: '300px',
            padding: '1rem 3rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.3)',
            margin: '0 auto'
          }}
        >
          <i className="ri-file-list-3-line"></i>
          <span>Visualizza Analisi</span>
          <i className="ri-arrow-right-line"></i>
        </button>
      </div>
    </div>
  );
};

export default WelcomeGreeting;
