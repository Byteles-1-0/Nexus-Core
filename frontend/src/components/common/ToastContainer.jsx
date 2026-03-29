// src/components/common/ToastContainer.jsx
import React from 'react';

const ToastContainer = ({ toasts, onRemove }) => {
  const icons = {
    success: 'ri-checkbox-circle-line',
    error: 'ri-error-warning-line',
    info: 'ri-information-line'
  };

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          onClick={() => onRemove(toast.id)}
        >
          <i className={icons[toast.type] || icons.info}></i>
          {toast.message}
        </div>
      ))}
    </div>
  );
};

export default ToastContainer;
