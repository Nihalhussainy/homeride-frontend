import React from 'react';
import './Button.css';

// Added a 'type' prop that defaults to "button"
function Button({ children, onClick, disabled, type = 'button', className }) {
  // Combine the default class with any additional classes passed in
  const buttonClassName = `custom-button ${className || ''}`;

  return (
    <button 
      className={buttonClassName} 
      onClick={onClick} 
      disabled={disabled}
      type={type} // This is the crucial fix
    >
      {children}
    </button>
  );
}

export default Button;