import React, { useState } from 'react';
import './Input.css';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // Import eye icons

function Input({ type, placeholder, value, onChange, min, ...props }) { // Add 'min' prop here
  // State to manage password visibility
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Determine the actual type of the input field
  const inputType = type === 'password' && isPasswordVisible ? 'text' : type;

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <div className="input-wrapper">
      <input
        className="custom-input"
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        min={min} // Pass the min prop to the input element
        {...props}
      />
      {/* Only show the icon if the original type was "password" */}
      {type === 'password' && (
        <div className="password-toggle-icon" onClick={togglePasswordVisibility}>
          {isPasswordVisible ? <FiEyeOff size={20} /> : <FiEye size={20} />}
        </div>
      )}
    </div>
  );
}

export default Input;
