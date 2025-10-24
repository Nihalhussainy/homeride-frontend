import React, { useState } from 'react';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import './ReportRideModal.css';

const REPORT_REASONS = [
    { id: 'unsafe_driving', label: 'Unsafe Driving' },
    { id: 'vehicle_issue', label: 'Vehicle Issue' },
    { id: 'behavior', label: 'Driver/Passenger Behavior' },
    { id: 'harassment', label: 'Harassment or Misconduct' },
    { id: 'fraud', label: 'Fraud or Scam' },
    { id: 'other', label: 'Other' }
];

function ReportRideModal({ isOpen, onClose, onSubmit, isLoading, rideInfo }) {
    const [selectedReason, setSelectedReason] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!selectedReason) {
            setError('Please select a reason for reporting.');
            return;
        }

        if (!description.trim()) {
            setError('Please provide details about your report.');
            return;
        }

        setError('');
        onSubmit({
            reason: selectedReason,
            description: description.trim(),
            rideInfo: rideInfo
        });
    };

    const handleClose = () => {
        setSelectedReason('');
        setDescription('');
        setError('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="report-modal-overlay" onClick={handleClose}>
            <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="report-modal-header">
                    <h3><FiAlertTriangle /> Report Ride</h3>
                    <button 
                        className="close-report-btn" 
                        onClick={handleClose}
                        disabled={isLoading}
                    >
                        <FiX />
                    </button>
                </div>

                <div className="report-modal-body">
                    <div className="ride-info-summary">
                        <p><strong>{rideInfo.from}</strong> → <strong>{rideInfo.to}</strong></p>
                        <span className="ride-date">{rideInfo.date}</span>
                    </div>

                    <form onSubmit={handleSubmit} className="report-form">
                        <div className="form-group">
                            <label className="form-label">Reason for Reporting</label>
                            <div className="reason-options">
                                {REPORT_REASONS.map((reason) => (
                                    <label key={reason.id} className="reason-option">
                                        <input
                                            type="radio"
                                            name="reason"
                                            value={reason.id}
                                            checked={selectedReason === reason.id}
                                            onChange={(e) => setSelectedReason(e.target.value)}
                                            disabled={isLoading}
                                        />
                                        <span className="reason-label">{reason.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="description" className="form-label">
                                Describe the Issue
                            </label>
                            <textarea
                                id="description"
                                className="report-textarea"
                                placeholder="Please provide details about what happened. The more information you provide, the better we can assist you."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows="6"
                                disabled={isLoading}
                                maxLength="1000"
                            />
                            <div className="char-count">
                                {description.length} / 1000
                            </div>
                        </div>

                        {error && (
                            <div className="report-error">
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="report-modal-footer">
                            <button
                                type="button"
                                className="btn-cancel"
                                onClick={handleClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-submit"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Submitting...' : 'Submit Report'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default ReportRideModal;