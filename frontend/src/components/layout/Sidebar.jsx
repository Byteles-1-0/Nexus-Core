// src/components/layout/Sidebar.jsx
import React from 'react';

const Sidebar = ({ activeView, onViewChange, tenantName, isOpen, onToggle }) => {
  const navItems = [
    { id: 'overview', icon: 'ri-dashboard-3-line', label: 'Overview' },
    { id: 'costs', icon: 'ri-line-chart-line', label: 'Reparto Costi' },
    { id: 'upload', icon: 'ri-upload-cloud-2-line', label: 'Carica Contratto' },
    { id: 'contracts', icon: 'ri-folder-shield-2-line', label: 'Contratti' },
    { id: 'radar', icon: 'ri-radar-line', label: 'Risk Radar' },
    { id: 'topclients', icon: 'ri-vip-crown-2-line', label: 'Top Clients' },
    { id: 'advisor', icon: 'ri-brain-line', label: 'AI Advisor' },
    { id: 'simulator', icon: 'ri-flask-line', label: 'Simulatore' }
  ];

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <i className="ri-file-shield-2-line"></i>
          </div>
          <span className="logo-text">FOCO</span>
        </div>
        <p className="logo-subtitle">Contract Intelligence</p>
      </div>

      <ul className="nav-links">
        {navItems.map((item) => (
          <li key={item.id}>
            <a
              href="#"
              className={`nav-link ${activeView === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onViewChange(item.id);
              }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </a>
          </li>
        ))}
      </ul>

      <div className="sidebar-footer">
        <div className="tenant-badge">
          <i className="ri-building-2-line"></i>
          <span>{tenantName}</span>
        </div>
      </div>
    </nav>
  );
};

export default Sidebar;
