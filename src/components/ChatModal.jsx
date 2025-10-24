import React from 'react';
import ChatBox from './ChatBox.jsx';
import Button from './Button.jsx';
import { FiX, FiUsers, FiArrowRight } from 'react-icons/fi';
import './ChatModal.css';

function ChatModal({ ride, currentUser, participants, onClose }) {
  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="chat-modal-header">
          <div className="chat-modal-title">
            <div className="ride-info-compact">
              <h3>Ride Chat</h3>
              <div className="participant-count">
                <FiUsers />
                <span>{participants.length} participants</span>
              </div>
            </div>
          </div>
          <button className="chat-modal-close" onClick={onClose} aria-label="Close chat">
            <FiX />
          </button>
        </div>

        {/* Chat Content */}
        <div className="chat-modal-body">
          <ChatBox
            rideId={ride.id}
            currentUser={currentUser}
            participants={participants}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatModal;