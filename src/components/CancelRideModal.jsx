import React, { useState } from 'react';
import Button from './Button.jsx';
import { FiX, FiAlertTriangle } from 'react-icons/fi';

const PASSENGER_CANCELLATION_REASONS = [
  { id: 'found_another_ride', label: 'I found another ride' },
  { id: 'date_changed', label: 'The car owner changed the date/schedule' },
  { id: 'owner_asked', label: 'The car owner asked me to cancel' },
  { id: 'date_unsuitable', label: 'The date is no longer suitable' },
  { id: 'mistake', label: 'I made a mistake and shouldn\'t have booked' },
  { id: 'other_transport', label: 'I found another means of transportation' },
  { id: 'owner_unreachable', label: 'The car owner is unreachable' },
  { id: 'not_travelling', label: 'Something came up, I\'m no longer travelling at all' }
];

const DRIVER_CANCELLATION_REASONS = [
  { id: 'vehicle_issue', label: 'Vehicle breakdown or maintenance issue' },
  { id: 'emergency', label: 'Personal emergency' },
  { id: 'schedule_conflict', label: 'Schedule conflict or change of plans' },
  { id: 'weather', label: 'Weather or road conditions' },
  { id: 'no_passengers', label: 'Not enough passengers joined' },
  { id: 'health_issue', label: 'Health issue or illness' },
  { id: 'route_unsuitable', label: 'Route is no longer suitable' },
  { id: 'other', label: 'Other reason' }
];

function CancelRideModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading, 
  rideInfo, 
  isDriver = false 
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleReasonSelect = (reasonId) => {
    setSelectedReason(reasonId);
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    onConfirm(selectedReason);
    setSelectedReason('');
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setSelectedReason('');
    setShowConfirmation(false);
    onClose();
  };

  if (showConfirmation) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        backdrop: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1001,
        padding: '20px'
      }}>
        <div style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--surface-color-light)',
          borderRadius: '16px',
          padding: '32px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
          animation: 'scaleIn 0.3s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '24px'
          }}>
            <FiAlertTriangle size={32} style={{
              color: '#f59e0b',
              flexShrink: 0,
              marginTop: '4px'
            }} />
            <div>
              <h2 style={{
                margin: '0 0 12px 0',
                fontSize: '1.5rem',
                fontWeight: '700',
                color: 'var(--text-primary)'
              }}>
                {isDriver ? 'Cancel This Ride?' : 'Leave This Ride?'}
              </h2>
              <p style={{
                margin: '0',
                color: 'var(--text-secondary)',
                lineHeight: '1.6'
              }}>
                {isDriver ? (
                  <>Your passengers cannot travel without you. Are you sure you want to cancel this ride?</>
                ) : (
                  <>You are about to leave this ride. This action cannot be undone.</>
                )}
              </p>
            </div>
          </div>

          {rideInfo && (
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--surface-color-light)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px'
            }}>
              <p style={{
                margin: '0 0 8px 0',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)',
                fontWeight: '500'
              }}>Ride Details:</p>
              <p style={{
                margin: '0',
                fontSize: '1.1rem',
                fontWeight: '600',
                color: 'var(--text-primary)'
              }}>
                {rideInfo.from} → {rideInfo.to}
              </p>
              <p style={{
                margin: '6px 0 0 0',
                fontSize: '0.9rem',
                color: 'var(--text-secondary)'
              }}>
                {rideInfo.date}
              </p>
            </div>
          )}

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end'
          }}>
            <Button 
              onClick={() => setShowConfirmation(false)} 
              className="secondary"
              disabled={isLoading}
            >
              Go Back
            </Button>
            <Button 
              onClick={handleConfirm}
              disabled={isLoading}
              style={{
                background: '#ef4444',
                borderColor: '#ef4444'
              }}
            >
              {isLoading ? 'Cancelling...' : 'Yes, Cancel Ride'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const reasonsList = isDriver ? DRIVER_CANCELLATION_REASONS : PASSENGER_CANCELLATION_REASONS;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      backdrop: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1001,
      padding: '20px'
    }}>
      <div style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--surface-color-light)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        animation: 'slideUp 0.3s ease'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '24px',
          borderBottom: '1px solid var(--surface-color-light)',
          position: 'sticky',
          top: 0,
          background: 'var(--surface-color)',
          zIndex: 10
        }}>
          <h2 style={{
            margin: '0',
            fontSize: '1.4rem',
            fontWeight: '700',
            color: 'var(--text-primary)'
          }}>
            {isDriver ? 'Why are you cancelling?' : 'Why are you leaving?'}
          </h2>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-secondary)',
              fontSize: '1.5rem',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              transition: 'all 0.2s',
              hover: { background: 'rgba(255, 0, 0, 0.1)' }
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 0, 0, 0.1)';
              e.target.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'none';
              e.target.style.color = 'var(--text-secondary)';
            }}
          >
            <FiX />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          <p style={{
            margin: '0 0 24px 0',
            color: 'var(--text-secondary)',
            fontSize: '0.95rem',
            lineHeight: '1.6'
          }}>
            {isDriver 
              ? 'Please let us know the reason for cancelling this ride. Your passengers will be notified.'
              : 'Please let us know why you\'re cancelling so we can improve our service.'
            }
          </p>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {reasonsList.map(reason => (
              <button
                key={reason.id}
                onClick={() => handleReasonSelect(reason.id)}
                disabled={isLoading}
                style={{
                  padding: '16px 20px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--surface-color-light)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '1rem',
                  fontWeight: '500',
                  textAlign: 'left',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: isLoading ? 0.6 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
                    e.currentTarget.style.borderColor = 'var(--surface-color-light)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                {reason.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CancelRideModal;