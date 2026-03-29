// src/components/layout/Topbar.jsx
import React from 'react';

const Topbar = ({ title, apiStatus, onMenuToggle }) => {
  const statusClass = apiStatus === 'online' ? 'online' : 'offline';
  const statusText = apiStatus === 'online' ? 'API Online' : 
                     apiStatus === 'offline' ? 'API Offline' : 'Verifico API...';

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="menu-toggle" onClick={onMenuToggle}>
          <i className="ri-menu-line"></i>
        </button>
        <h1 className="page-title">{title}</h1>
      </div>
      <div className="topbar-right">
        <div className={`status-indicator ${statusClass}`}>
          <span className="status-dot"></span>
          <span className="status-text">{statusText}</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
