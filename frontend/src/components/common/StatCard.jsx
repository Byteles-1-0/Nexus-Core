// src/components/common/StatCard.jsx
import React from 'react';

const StatCard = ({ icon, value, label, color = 'blue' }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon stat-icon--${color}`}>
        <i className={icon}></i>
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );
};

export default StatCard;
