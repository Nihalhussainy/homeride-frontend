import React, { useState } from 'react';
import './RatingModal.css'; // Reuse modal styles
import Button from './Button.jsx';
import Input from './Input.jsx';
import { FiSave } from 'react-icons/fi';

function EditUserModal({ user, onClose, onUserUpdate }) {
  const [role, setRole] = useState(user.role);
  const [travelCredit, setTravelCredit] = useState(user.travelCredit);

  const handleSubmit = () => {
    onUserUpdate(user.id, { role, travelCredit });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h2>Edit User: {user.name}</h2>
        
        <label htmlFor="role-input">Role (e.g., EMPLOYEE, ADMIN)</label>
        <Input
          id="role-input"
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value.toUpperCase())}
        />
        
        <label htmlFor="credit-input">Travel Credit</label>
        <Input
          id="credit-input"
          type="number"
          value={travelCredit}
          onChange={(e) => setTravelCredit(parseFloat(e.target.value))}
        />

        <div className="modal-actions">
          <Button onClick={onClose} className="secondary">Cancel</Button>
          <Button onClick={handleSubmit}>
            <FiSave />
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

export default EditUserModal;
