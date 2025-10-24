import React from 'react';
import Button from './Button';
import './NotificationModal.css';
import { FiCheckCircle, FiXCircle, FiAlertTriangle } from 'react-icons/fi';

const icons = {
  success: <FiCheckCircle size={40} className="notification-icon success" />,
  error: <FiXCircle size={40} className="notification-icon error" />,
  confirm: <FiAlertTriangle size={40} className="notification-icon confirm" />,
};

function NotificationModal({ type, message, onConfirm, onCancel }) {
  if (!message) return null;

  return (
    <div className="modal-overlay">
      <div className="notification-modal-content">
        {icons[type]}
        <p>{message}</p>
        <div className="notification-actions">
          {type === 'confirm' ? (
            <>
              <Button onClick={onCancel} className="secondary">Cancel</Button>
              <Button onClick={onConfirm} className="danger">Yes</Button>
            </>
          ) : (
            <Button onClick={onCancel}>OK</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default NotificationModal;
