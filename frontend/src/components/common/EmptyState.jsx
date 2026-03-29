// src/components/common/EmptyState.jsx
import React from 'react';

const EmptyState = ({ icon = 'ri-inbox-line', message }) => {
  return (
    <div className="empty-state">
      <i className={icon}></i>
      <p>{message}</p>
    </div>
  );
};

export default EmptyState;
