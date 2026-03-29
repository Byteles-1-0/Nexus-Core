// src/components/common/Button.jsx
import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = '', 
  full = false,
  disabled = false,
  onClick,
  className = '',
  ...props 
}) => {
  const sizeClass = size ? `btn--${size}` : '';
  const fullClass = full ? 'btn--full' : '';
  
  return (
    <button
      className={`btn btn--${variant} ${sizeClass} ${fullClass} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
