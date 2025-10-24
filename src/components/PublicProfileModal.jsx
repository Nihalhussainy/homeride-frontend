import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Button from './Button.jsx';
import '../App.css';
import './RatingModal.css';

import { 
  FiUser, 
  FiMail, 
  FiStar, 
  FiPhone, 
  FiMessageSquare, 
  FiArrowRight, 
  FiCalendar, 
  FiMapPin,
  FiLoader
} from 'react-icons/fi';
import { useNotification } from '../context/NotificationContext.jsx';

const RATINGS_PER_PAGE = 5;

function PublicProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showNotification } = useNotification();
  const [visibleRatings, setVisibleRatings] = useState(RATINGS_PER_PAGE);

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`http://localhost:8080/api/employees/${userId}`);
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        showNotification('Could not load profile.', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      fetchProfileData();
    }
  }, [userId, showNotification]);

  const extractCityName = (address) => {
    if (!address) return '';
    const parts = address.split(',');
    return parts[0].trim();
  };

  const sortedRatings = useMemo(() => {
    if (!profile || !profile.receivedRatings) {
      return [];
    }
    return [...profile.receivedRatings].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [profile]);

  const averageRating = useMemo(() => {
    if (!sortedRatings || sortedRatings.length === 0) return 0;
    const total = sortedRatings.reduce((acc, rating) => acc + rating.score, 0);
    return (total / sortedRatings.length);
  }, [sortedRatings]);

  if (isLoading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--surface-color-light)',
          borderRadius: '16px',
          padding: '40px',
          maxWidth: '720px',
          width: '90%'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '16px',
            color: 'var(--text-secondary)',
            gap: '12px'
          }}>
            <FiLoader size={24} style={{ animation: 'spin 1s linear infinite' }} />
            Loading profile...
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={e => e.stopPropagation()} style={{
          background: 'var(--surface-color)',
          border: '1px solid var(--surface-color-light)',
          borderRadius: '16px',
          padding: '32px',
          maxWidth: '720px',
          width: '90%'
        }}>
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '20px' }}>
            Profile not found or could not be loaded.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 24px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{
        background: 'var(--surface-color)',
        border: '1px solid var(--surface-color-light)',
        borderRadius: '16px',
        padding: '0',
        maxWidth: '720px',
        width: '90%',
        maxHeight: '85vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Embedded Styles */}
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .public-profile-info-grid {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
            gap: 20px 32px;
            text-align: left;
            padding: 10px 0;
          }

          .public-info-block {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: transparent;
            border: none;
            padding: 0;
          }

          .public-info-icon {
            flex-shrink: 0;
            margin-top: 3px;
            font-size: 18px;
            width: 20px;
            text-align: center;
          }

          .public-info-text p:first-of-type {
            font-size: 11px;
            color: var(--text-secondary);
            margin: 0 0 6px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .public-info-text p:last-of-type {
            margin: 0;
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 500;
            line-height: 1.3;
          }

          .public-rating-card {
            background: var(--background-color);
            border: 1px solid var(--surface-color-light);
            border-radius: 14px;
            padding: 20px;
            transition: all 0.25s ease;
            cursor: default;
            animation: slideIn 0.5s ease-out backwards;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.05) inset, 0 2px 5px rgba(0, 0, 0, 0.2);
          }
          .public-rating-card:hover {
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
            transform: translateY(-3px);
          }

          .not-rated-text {
            font-size: 15px;
            color: var(--text-secondary);
            font-style: italic;
          }

          @media (max-width: 550px) {
            .public-profile-info-grid {
              grid-template-columns: 1fr;
              gap: 20px 0;
            }
            .public-info-block {
              gap: 10px;
            }
            .public-info-text p:last-of-type {
              font-size: 14px;
            }
          }
        `}</style>

        {/* Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--surface-color-light)',
          textAlign: 'center'
        }}>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: 'var(--text-primary)',
            margin: 0,
            lineHeight: '1.2'
          }}>
            User Profile
          </h2>
        </div>

        {/* Scrollable Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '28px'
        }}>
          {/* Profile Summary Card */}
          <div style={{
            background: 'var(--background-color)',
            border: '1px solid var(--surface-color-light)',
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '24px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '32px',
            transition: 'all 0.3s ease'
          }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {profile.profilePictureUrl ? (
                <img 
                  src={profile.profilePictureUrl} 
                  alt="Profile" 
                  style={{
                    width: '100px',
                    height: '100px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid var(--surface-color-light)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                  }}
                />
              ) : (
                <div style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: 'var(--surface-color)',
                  border: '3px solid var(--surface-color-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <FiUser size={50} style={{ color: 'var(--text-secondary)' }} />
                </div>
              )}
            </div>

            {/* Info Grid */}
            <div className="public-profile-info-grid">
              {/* Name */}
              <div className="public-info-block">
                <FiUser className="public-info-icon" style={{ color: '#8b5cf6' }} />
                <div className="public-info-text">
                  <p>NAME</p>
                  <p>{profile.name}</p>
                </div>
              </div>

              {/* Email */}
              <div className="public-info-block">
                <FiMail className="public-info-icon" style={{ color: '#ec4899' }} />
                <div className="public-info-text">
                  <p>EMAIL</p>
                  <p>{profile.email}</p>
                </div>
              </div>

              {/* Rating */}
              <div className="public-info-block">
                <FiStar className="public-info-icon" style={{ color: '#ffc107' }} />
                <div className="public-info-text">
                  <p>RATING</p>
                  {averageRating > 0 ? (
                    <p style={{
                      margin: 0,
                      color: 'var(--text-primary)',
                      fontSize: '15px',
                      fontWeight: '500',
                      lineHeight: '1.3',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      {averageRating.toFixed(1)}
                      <FiStar style={{ color: '#ffc107', fill: '#ffc107', fontSize: '15px' }} />
                    </p>
                  ) : (
                    <p className="not-rated-text">Not rated yet</p>
                  )}
                </div>
              </div>

              {/* Phone */}
              <div className="public-info-block">
                <FiPhone className="public-info-icon" style={{ color: '#10b981' }} />
                <div className="public-info-text">
                  <p>PHONE</p>
                  <p>{profile.phoneNumber || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Section */}
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              marginTop: 0
            }}>
              <FiMessageSquare style={{ color: 'var(--text-secondary)' }} />
              Feedback Received ({sortedRatings.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {sortedRatings.length > 0 ? (
                <>
                  {sortedRatings.slice(0, visibleRatings).map((rating, idx) => (
                    <div key={rating.id} className="public-rating-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                      <div style={{
                        marginBottom: '12px',
                        paddingBottom: '12px',
                        borderBottom: '1px solid var(--surface-color-light)'
                      }}>
                        {/* Ride Info */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '8px'
                        }}>
                          <FiMapPin size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                          <p style={{
                            fontSize: '14px',
                            fontWeight: '600',
                            margin: 0,
                            color: 'var(--text-primary)'
                          }}>
                            {rating.rideRequest?.originCity || extractCityName(rating.rideRequest?.origin)}
                            <FiArrowRight size={12} style={{
                              margin: '0 6px',
                              color: 'var(--text-secondary)',
                              display: 'inline'
                            }} />
                            {rating.rideRequest?.destinationCity || extractCityName(rating.rideRequest?.destination)}
                          </p>
                        </div>

                        {/* Rating and Date */}
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {[...Array(5)].map((_, i) => (
                              <FiStar
                                key={i}
                                size={14}
                                style={{
                                  color: i < rating.score ? '#ffc107' : 'var(--surface-color-light)',
                                  fill: i < rating.score ? '#ffc107' : 'none'
                                }}
                              />
                            ))}
                          </div>
                          <span style={{
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <FiCalendar size={12} />
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Comment */}
                      <p style={{
                        fontSize: '14px',
                        fontStyle: 'italic',
                        margin: '12px 0',
                        color: 'var(--text-primary)',
                        lineHeight: '1.5'
                      }}>
                        "{rating.comment || 'No comment provided.'}"
                      </p>

                      {/* Rater Info */}
                      <p style={{
                        color: 'var(--text-secondary)',
                        fontSize: '13px',
                        margin: 0
                      }}>
                        by <strong style={{ color: 'var(--text-primary)' }}>
                          {rating.rater?.name || 'Anonymous'}
                        </strong>
                      </p>
                    </div>
                  ))}

                  {/* Load More Button */}
                  {visibleRatings < sortedRatings.length && (
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      marginTop: '20px',
                      paddingTop: '16px',
                      borderTop: '1px solid var(--surface-color-light)'
                    }}>
                      <button
                        onClick={() => setVisibleRatings(prev => prev + RATINGS_PER_PAGE)}
                        style={{
                          padding: '10px 20px',
                          background: 'transparent',
                          border: '1.5px solid var(--surface-color-light)',
                          borderRadius: '8px',
                          color: 'var(--text-primary)',
                          fontSize: '14px',
                          fontWeight: '600',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseOver={(e) => {
                          e.currentTarget.style.borderColor = '#3b82f6';
                          e.currentTarget.style.color = '#3b82f6';
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
                        }}
                        onMouseOut={(e) => {
                          e.currentTarget.style.borderColor = 'var(--surface-color-light)';
                          e.currentTarget.style.color = 'var(--text-primary)';
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        Load More Feedback
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <p style={{
                  color: 'var(--text-secondary)',
                  textAlign: 'center',
                  padding: '24px',
                  fontSize: '14px'
                }}>
                  This user has not received any feedback yet.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '20px 28px',
          borderTop: '1px solid var(--surface-color-light)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #4b92f7 0%, #9c6df7 100%)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default PublicProfileModal;