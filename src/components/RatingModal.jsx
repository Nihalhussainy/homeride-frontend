import React, { useState, useEffect, useRef } from 'react';
import './RatingModal.css'; // We'll update this file next
import Button from './Button.jsx';
import { FaStar } from 'react-icons/fa';
import { FiSend, FiChevronDown, FiCheck } from 'react-icons/fi'; // Added ChevronDown and Check

// Updated props: added findGivenRating
function RatingModal({ ride, potentialRatees, onClose, onSubmitRating, findGivenRating }) {
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [hover, setHover] = useState(0);
  const [selectedRateeId, setSelectedRateeId] = useState('');
  const [isAlreadyRated, setIsAlreadyRated] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for custom dropdown
  const dropdownRef = useRef(null); // Ref for detecting clicks outside

  // Auto-select if only one person can be rated & check their rating status
  useEffect(() => {
    if (potentialRatees && potentialRatees.length === 1) {
      const singleRateeId = potentialRatees[0].id.toString();
      setSelectedRateeId(singleRateeId);
      const existingRating = findGivenRating(ride.id, singleRateeId);
      setIsAlreadyRated(!!existingRating);
    } else {
      setSelectedRateeId('');
      setIsAlreadyRated(false);
    }
  }, [potentialRatees, ride.id, findGivenRating]);

  // Handle selection from custom dropdown
  const handleSelectRatee = (rateeId) => {
    setSelectedRateeId(rateeId);
    const existingRating = findGivenRating(ride.id, rateeId);
    setIsAlreadyRated(!!existingRating);
    setIsDropdownOpen(false); // Close dropdown on selection
    if (existingRating) {
      setScore(0);
      setComment('');
    }
  };

  // Handle clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = () => {
    if (!selectedRateeId) {
       alert('Please select who you want to rate.');
       return;
    }
    if (isAlreadyRated) {
        alert('You have already submitted a rating for this user on this ride.');
        return;
    }
    if (score === 0) {
      alert('Please select a star rating.');
      return;
    }
    onSubmitRating({
      rideRequestId: ride.id,
      rateeId: parseInt(selectedRateeId, 10),
      score,
      comment
    });
  };

  // Helper to get name from ID
  const getRateeName = (id) => {
    if (!potentialRatees || !id) return '-- Select Participant --';
    const ratee = potentialRatees.find(p => p.id.toString() === id.toString());
    return ratee ? ratee.name : '-- Select Participant --';
  };

  // Determine if rating controls should be disabled
  const controlsDisabled = (!selectedRateeId) || isAlreadyRated;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>
          Rate Your Trip
          {selectedRateeId ? ` with ${getRateeName(selectedRateeId)}` : ''}
        </h2>

        {/* --- Custom Dropdown for Ratee Selection --- */}
        {potentialRatees && potentialRatees.length > 0 && (
          <div className="ratee-selection custom-dropdown-container" ref={dropdownRef}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-secondary)' }}>
              {potentialRatees.length === 1 ? 'Rating:' : 'Who are you rating? *'}
            </label>

            {potentialRatees.length === 1 ? (
              // Display name if only one option
              <div className="custom-dropdown-display single-option">
                 {potentialRatees[0].name}
                 {isAlreadyRated && <span className="rated-indicator"> (Rated <FiCheck/>)</span>}
              </div>
            ) : (
              // Display custom dropdown button if multiple options
              <>
                <button
                  type="button"
                  className={`custom-dropdown-display ${isDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span>{getRateeName(selectedRateeId)}</span>
                  <FiChevronDown className="dropdown-arrow" />
                </button>

                {isDropdownOpen && (
                  <ul className="custom-dropdown-options">
                    {potentialRatees.map(p => {
                      const existingRating = findGivenRating(ride.id, p.id);
                      const isSelected = p.id.toString() === selectedRateeId;
                      return (
                        <li
                          key={p.id}
                          className={`dropdown-option ${isSelected ? 'selected' : ''} ${existingRating ? 'already-rated' : ''}`}
                          onClick={() => handleSelectRatee(p.id.toString())}
                        >
                          {p.name} {p.id === ride.requester?.id ? '(Driver)' : '(Passenger)'}
                          {existingRating && <span className="rated-indicator"> (Rated <FiCheck/>)</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {/* Show message if the selected user is already rated */}
            {isAlreadyRated && selectedRateeId && (
                <p className="already-rated-message">
                    You have already rated {getRateeName(selectedRateeId)} for this ride.
                </p>
            )}
          </div>
        )}

        {/* Star Rating */}
        <div className="star-rating">
          {[...Array(5)].map((star, index) => {
            const currentRating = index + 1;
            return (
              <label key={index}>
                <input
                  type="radio" name="rating" value={currentRating}
                  onClick={() => !controlsDisabled && setScore(currentRating)}
                  disabled={controlsDisabled} style={{ display: 'none' }}
                />
                <FaStar
                  className="star" size={40}
                  color={currentRating <= (hover || score) ? "#ffc107" : "#4b5563"}
                  onMouseEnter={() => !controlsDisabled && setHover(currentRating)}
                  onMouseLeave={() => setHover(0)}
                  style={{ cursor: controlsDisabled ? 'not-allowed' : 'pointer', opacity: controlsDisabled ? 0.5 : 1 }}
                  onClick={() => !controlsDisabled && setScore(currentRating)}
                />
              </label>
            );
          })}
        </div>

        {/* Comment Area */}
        <textarea
          placeholder="Leave a comment (optional)..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={controlsDisabled}
          style={{ opacity: controlsDisabled ? 0.5 : 1 }}
        />

        {/* Modal Actions */}
        <div className="modal-actions">
          <Button onClick={onClose} className="secondary">Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedRateeId || score === 0 || isAlreadyRated} // Check isAlreadyRated
          >
            <FiSend/> Submit Rating
          </Button>
        </div>
      </div>
    </div>
  );
}

export default RatingModal;