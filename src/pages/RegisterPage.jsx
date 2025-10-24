import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Button from "../components/Button.jsx";
import Input from "../components/Input.jsx";
import { useNotification } from '../context/NotificationContext.jsx';
import "../App.css";
import axios from "axios";
import { FiUserPlus, FiCheck, FiChevronDown, FiUser } from "react-icons/fi";
import { GiMale, GiFemale } from "react-icons/gi";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [gender, setGender] = useState(""); 
  const [isLoading, setIsLoading] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  const passwordsMatch = password && confirmPassword && password === confirmPassword;
  const genderOptions = [
    { value: 'MALE', label: 'Male', icon: GiMale, color: '#3b82f6' },
    { value: 'FEMALE', label: 'Female', icon: GiFemale, color: '#ec4899' },
    { value: 'OTHER', label: 'Other', icon: FiUser, color: '#8b5cf6' }
  ];
  const selectedGender = genderOptions.find(opt => opt.value === gender);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsGenderOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegister = async (event) => {
    event.preventDefault();

    if (!passwordsMatch) {
      showNotification("Passwords do not match.", 'error');
      return;
    }

    if (!gender) {
      showNotification("Please select your gender.", 'error');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post("http://localhost:8080/api/auth/register", {
        name,
        email,
        password,
        gender,
      });

      showNotification("Registration successful! Please log in.");
      navigate("/login");

    } catch (error) {
      const errorMessage = error.response?.data || "Registration failed. Please try again.";
      showNotification(errorMessage, 'error');
      console.error("Registration error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="welcome-panel">
        <h2>Join HomeRide</h2>
        <p>Create your account to start sharing rides with colleagues.</p>
      </div>
      <div className="form-panel">
        <div className="form-box">
          <h1>Create Account</h1>
          <form onSubmit={handleRegister}>
            <Input
              type="text"
              placeholder="Your Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <div className="input-wrapper">
              <Input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              {passwordsMatch && (
                <div style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', marginTop: '5px', fontSize: '0.9rem' }}>
                  <FiCheck />
                  <span style={{ marginLeft: '5px' }}>Passwords match!</span>
                </div>
              )}
            </div>
            
            <div className="input-wrapper">
              <div className="custom-dropdown-wrapper" ref={dropdownRef}>
                <button
                  type="button"
                  className="custom-dropdown-button"
                  onClick={() => setIsGenderOpen(!isGenderOpen)}
                >
                  <span className="dropdown-label">
                    {selectedGender ? (
                      <span className="dropdown-label-content">
                        <selectedGender.icon size={16} style={{ marginRight: '8px', color: selectedGender.color }} />
                        {selectedGender.label}
                      </span>
                    ) : (
                      'Select Gender...'
                    )}
                  </span>
                  <FiChevronDown 
                    size={18} 
                    className={`dropdown-icon ${isGenderOpen ? 'open' : ''}`}
                  />
                </button>

                {isGenderOpen && (
                  <div className="custom-dropdown-menu">
                    {genderOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        className={`dropdown-option ${selectedGender?.value === option.value ? 'selected' : ''}`}
                        onClick={() => {
                          setGender(option.value);
                          setIsGenderOpen(false);
                        }}
                      >
                        <span className="option-text">
                          <option.icon size={16} style={{ marginRight: '10px', color: option.color }} />
                          {option.label}
                        </span>
                        {selectedGender?.value === option.value && (
                          <span className="option-checkmark">✓</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={isLoading || !passwordsMatch}>
              <FiUserPlus />
              {isLoading ? 'Creating Account...' : 'Register'}
            </Button>
          </form>
          <p style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-secondary)' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--primary-color)', fontWeight: '600' }}>Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;