import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import RatingModal from '../components/RatingModal.jsx'; 
import Button from '../components/Button.jsx'; 
import Input from '../components/Input.jsx'; 
import ImageCropperModal from '../components/ImageCropperModal.jsx'; 
import '../App.css'; 
import './ProfilePage.css';
import { useNotification } from '../context/NotificationContext.jsx'; 
import {
  FiStar,
  FiMail,
  FiUser,
  FiClock,
  FiMessageSquare,
  FiArrowRight,
  FiCalendar,
  FiCamera,
  FiTrash2,
  FiPhone,
  FiEdit,
  FiSave,
  FiXCircle,
  FiLoader,
  FiMapPin,
  FiCheckCircle // Added for the "Rated" status
} from 'react-icons/fi';

const RATINGS_PER_PAGE = 5;
const RIDES_PER_PAGE = 3;

function ProfilePage() {
  const [user, setUser] = useState(null); // Changed from currentUser
  const [myRides, setMyRides] = useState([]);
  const [myRatings, setMyRatings] = useState([]);
  const [ratingsGiven, setRatingsGiven] = useState([]);
  const [selectedRideForRating, setSelectedRideForRating] = useState(null);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const { showNotification, showConfirmation } = useNotification();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', phoneNumber: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feedback');

  const [imageToCrop, setImageToCrop] = useState(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);

  const [visibleRatings, setVisibleRatings] = useState(RATINGS_PER_PAGE);
  const [visibleRides, setVisibleRides] = useState(RIDES_PER_PAGE);

  const extractCityName = useCallback((location) => {
    if (!location) return '';
    const parts = location.split(',');
    return parts[0].trim();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    const config = { headers: { 'Authorization': `Bearer ${token}` } };
    try {
      const [userResponse, ridesResponse, receivedRatingsResponse, givenRatingsResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/employees/me', config),
        axios.get('http://localhost:8080/api/rides/my-rides', config),
        axios.get('http://localhost:8080/api/ratings/my-ratings', config),
        axios.get('http://localhost:8080/api/ratings/given', config)
      ]);
      setUser(userResponse.data); // Set the 'user' state
      setMyRides(ridesResponse.data);
      setMyRatings(receivedRatingsResponse.data);
      setRatingsGiven(givenRatingsResponse.data);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
      // Handle error appropriately, e.g., show notification
      showNotification('Failed to load profile data. Please try logging in again.', 'error');
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, showNotification]); // Added showNotification dependency

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEditClick = () => {
    if (!user) return; // Guard against null user
    setFormData({
      name: user.name,
      phoneNumber: user.phoneNumber || '',
    });
    setIsEditing(true);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await axios.put('http://localhost:8080/api/employees/me', formData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setUser(response.data);
      setIsEditing(false);
      showNotification('Profile updated successfully!');
    } catch (error) {
      showNotification('Failed to update profile. Please try again.', 'error');
      console.error("Error updating profile:", error);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageToCrop(reader.result));
      reader.readAsDataURL(event.target.files[0]);
      setIsCropperOpen(true);
      event.target.value = null; // Reset file input
    }
  };

  const handleCropComplete = (imageElement, crop) => {
    const canvas = document.createElement('canvas');
    const scaleX = imageElement.naturalWidth / imageElement.width;
    const scaleY = imageElement.naturalHeight / imageElement.height;
    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;
    const ctx = canvas.getContext('2d');

    ctx.drawImage(
      imageElement,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width * scaleX,
      crop.height * scaleY
    );

    canvas.toBlob(async (blob) => {
      if (!blob) {
        console.error('Canvas is empty');
        showNotification('Failed to process image. Please try again.', 'error');
        setIsCropperOpen(false);
        setImageToCrop(null);
        return;
      }
      const fileFormData = new FormData(); // Renamed to avoid confusion with component state formData
      fileFormData.append('file', blob, 'profile.jpg');
      const token = localStorage.getItem('token');
      try {
        const response = await axios.post('http://localhost:8080/api/employees/me/profile-picture', fileFormData, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
        setUser(response.data);
        showNotification('Profile picture updated successfully!');
      } catch (error) {
        showNotification('Failed to update profile picture. Please try again.', 'error');
        console.error("Error updating profile picture:", error);
      } finally {
        setIsCropperOpen(false);
        setImageToCrop(null);
      }
    }, 'image/jpeg');
  };


  const handleChangePicture = () => {
    fileInputRef.current.click();
  };

  const handleRemovePicture = () => {
    showConfirmation("Are you sure you want to remove your profile picture?", async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await axios.delete('http://localhost:8080/api/employees/me/profile-picture', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        setUser(response.data);
        showNotification('Profile picture removed.');
      } catch (error) {
        showNotification('Failed to remove profile picture.', 'error');
        console.error("Error removing profile picture:", error);
      }
    });
  };

  const handleSubmitRating = async (ratingData) => {
    const token = localStorage.getItem('token');
    try {
      await axios.post('http://localhost:8080/api/ratings', ratingData, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      showNotification('Thank you for your feedback!');
      setSelectedRideForRating(null); // Close modal
      fetchData(); // Refresh data to update given ratings list AND the "Rated" status
    } catch (error) {
      // Handle "already rated" specifically if the backend provides a distinct error
      if (error.response?.status === 409 || error.response?.data?.message?.includes('already submitted')) {
         showNotification('You have already submitted a rating for this user on this ride.', 'error');
         // We might still want to refresh data in case something changed unexpectedly
         fetchData();
      } else {
        showNotification(error.response?.data?.message || 'Failed to submit rating.', 'error');
      }
      console.error("Error submitting rating:", error);
       setSelectedRideForRating(null); // Ensure modal closes even on error
    }
  };


  const averageRating = useMemo(() => {
    if (!myRatings || myRatings.length === 0) return 0;
    const total = myRatings.reduce((acc, rating) => acc + rating.score, 0);
    return (total / myRatings.length);
  }, [myRatings]);

  // Check if a rating was *already given* by the current user for a specific participant in a ride
  const findGivenRating = useCallback((rideId, rateeId) => {
    // Ensure IDs are numbers for comparison if needed, or keep as strings if consistent
    const rideIdNum = parseInt(rideId, 10);
    const rateeIdNum = parseInt(rateeId, 10);

    return ratingsGiven.find(rating =>
      rating.rideRequest?.id === rideIdNum && // Use safe navigation and compare numbers
      rating.ratee?.id === rateeIdNum // Use safe navigation and compare numbers
    );
  }, [ratingsGiven]);


  // --- MODIFICATION: Only show past rides in history ---
  const sortedRides = useMemo(() => {
    if (!user || !myRides) return []; // Ensure user and myRides are loaded
    const now = new Date();
    return [...myRides]
      .filter(ride => {
        const hasDeparted = new Date(ride.travelDateTime) < now;
        // Keep only rides that have departed
        return hasDeparted && (
          // Include rides where I was a participant
          ride.participants?.some(p => p.participant?.id === user?.id) ||
          // Include rides I offered
          ride.requester?.id === user?.id ||
          // Include rides I requested if they had a driver
          (ride.rideType === 'REQUESTED' && ride.driver)
        );
      })
      .sort((a, b) => new Date(b.travelDateTime) - new Date(a.travelDateTime)); // Sort by most recent first
  }, [myRides, user]);
  // --- END MODIFICATION ---

  const sortedRatings = useMemo(() => {
    const ratingsArray = Array.isArray(myRatings) ? myRatings : [];
    // Sort by creation date, most recent first
    return [...ratingsArray]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [myRatings]);

  if (isLoading || !user) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: '16px',
        color: 'var(--text-secondary)',
        background: 'var(--background-color)'
      }}>
        <FiLoader size={24} style={{ animation: 'spin 1s linear infinite', marginRight: '12px' }} />
        Loading profile...
      </div>
    );
  }

  // --- RENDER ---
  return (
    <div style={{
      minHeight: '100vh',
      padding: '30px 16px 80px',
      background: `
        linear-gradient(135deg, var(--background-color) 0%, rgba(59, 130, 246, 0.03) 50%, var(--background-color) 100%),
        radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.06) 0%, transparent 50%),
        var(--background-color)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background SVG Grid */}
      <svg style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
        opacity: 0.05, pointerEvents: 'none'
      }} viewBox="0 0 1200 1200">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--text-primary)" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Embedded Styles */}
      <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes subtleGlow {
            0%, 100% { box-shadow: 0 4px 15px rgba(59, 130, 246, 0.15); }
            50% { box-shadow: 0 4px 25px rgba(59, 130, 246, 0.25); }
          }
          @keyframes slideIn {
            from { opacity: 0; transform: translateY(15px); }
            to { opacity: 1; transform: translateY(0); }
          }

          .styled-input {
            width: 100%;
            padding: 12px 16px;
            background: var(--surface-color);
            border: 1px solid var(--surface-color-light);
            border-radius: 10px;
            color: var(--text-primary);
            font-size: 14px;
            transition: all 0.25s ease;
            outline: none;
            height: 48px;
            box-sizing: border-box;
            font-family: inherit;
          }
          .styled-input:focus {
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
          }

          .tab-button {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            background: transparent;
            border: none;
            color: var(--text-secondary);
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            border-bottom: 3px solid transparent;
            position: relative;
          }
          .tab-button:hover {
            color: var(--text-primary);
          }
          .tab-button.active {
            color: #3b82f6;
            border-bottom-color: #3b82f6;
          }

          .ride-card, .rating-card {
            background: var(--surface-color);
            border: 1px solid var(--surface-color-light);
            border-radius: 14px;
            padding: 20px;
            transition: all 0.25s ease;
            cursor: default;
            animation: slideIn 0.5s ease-out backwards;
          }
          .ride-card:hover, .rating-card:hover {
            border-color: rgba(59, 130, 246, 0.3);
            box-shadow: 0 6px 20px rgba(59, 130, 246, 0.12);
            transform: translateY(-3px);
          }

          .profile-picture {
            animation: subtleGlow 3s ease-in-out infinite;
          }

          .profile-info-grid {
            flex: 1;
            display: grid;
            grid-template-columns: 1fr 1fr;
            grid-template-rows: auto auto;
            gap: 20px 32px;
            text-align: left;
            padding: 10px 0;
          }

          .info-block {
            display: flex;
            align-items: flex-start;
            gap: 12px;
            background: transparent;
            border: none;
            padding: 0;
          }

          .info-icon {
            flex-shrink: 0;
            margin-top: 3px;
            font-size: 18px;
            width: 20px;
            text-align: center;
          }

          .info-text p:first-of-type {
            font-size: 11px;
            color: var(--text-secondary);
            margin: 0 0 6px 0;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.8px;
          }
          .info-text p:last-of-type {
            margin: 0;
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 500;
            line-height: 1.3;
          }
          .rating-value-display {
            margin: 0;
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 500;
            line-height: 1.3;
          }

          .rating-value-display {
            display: flex;
            align-items: center;
            gap: 6px;
            margin: 0;
            color: var(--text-primary);
            font-size: 15px;
            font-weight: 500;
            line-height: 1.3;
          }
          .rating-value-display span {
            font-size: 15px;
            font-weight: 500;
            color: var(--text-primary);
          }
          .rating-value-display svg {
            color: #ffc107;
            font-size: 15px;
            flex-shrink: 0;
          }
          .not-rated-text {
            font-size: 15px;
            color: var(--text-secondary);
            font-style: italic;
          }

          @media (max-width: 550px) {
            .profile-info-grid {
              grid-template-columns: 1fr;
              gap: 20px 0;
            }
            .info-block {
              gap: 10px;
            }
            .info-text p:last-of-type, .rating-value-display {
              font-size: 14px;
            }
            .rating-value-display span, .rating-value-display svg {
              font-size: 14px;
            }
          }
      `}</style>

      {/* Main Content Wrapper */}
      <div style={{ maxWidth: '720px', margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* HEADER */}
        <div style={{
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          marginBottom: '24px', position: 'relative', padding: '0 8px'
        }}>
          <h1 style={{
             fontSize: '32px', fontWeight: '700', color: 'var(--text-primary)',
             margin: 0, lineHeight: '1.2', textAlign: 'center'
          }}>
            {isEditing ? 'Edit Profile' : 'My Profile'}
          </h1>
          {/* Edit Button */}
          {!isEditing && (
            <button
              onClick={handleEditClick}
              style={{
                position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: '44px', height: '44px', background: 'var(--surface-color)',
                border: '1px solid var(--surface-color-light)', borderRadius: '12px',
                color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.25s ease',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
                e.currentTarget.style.color = 'white'; e.currentTarget.style.border = 'none';
                e.currentTarget.style.transform = 'translateY(-50%) translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.background = 'var(--surface-color)';
                e.currentTarget.style.color = 'var(--text-primary)';
                e.currentTarget.style.border = '1px solid var(--surface-color-light)';
                e.currentTarget.style.transform = 'translateY(-50%)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
              title="Edit Profile"
            >
              <FiEdit size={20} />
            </button>
          )}
        </div>

        {/* EDITING VIEW */}
        {isEditing ? (
          <div style={{
              background: 'var(--surface-color)', border: '1px solid var(--surface-color-light)',
              borderRadius: '16px', padding: '32px 28px', marginBottom: '24px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px'
          }}>
            {/* Profile Picture Editing */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              {user.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Profile" style={{
                    width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover',
                    border: '3px solid var(--surface-color-light)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}/>
              ) : (
                <div style={{
                    width: '120px', height: '120px', borderRadius: '50%', background: 'var(--background-color)',
                    border: '3px solid var(--surface-color-light)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <FiUser size={60} style={{ color: 'var(--text-secondary)' }} />
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{ display: 'none' }} accept="image/png, image/jpeg"/>
              <div style={{ display: 'flex', gap: '10px' }}>
                  {/* UPDATE BUTTON with CLASS */}
                  <button
                      type="button"
                      onClick={handleChangePicture}
                      className="profile-action-button update-picture-button" // <-- Added class
                      style={{
                          display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                          background: 'var(--surface-color-light)', border: '1px solid var(--surface-color-light)',
                          borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600',
                          cursor: 'pointer' /* Removed transition, handled by class */
                      }}>
                      <FiCamera size={14} /> {user.profilePictureUrl ? 'Update' : 'Add'}
                  </button>
                  {/* REMOVE BUTTON with CLASS */}
                  {user.profilePictureUrl && (
                      <button
                          type="button"
                          onClick={handleRemovePicture}
                          className="profile-action-button remove-picture-button" // <-- Added class
                          style={{
                              display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px',
                              background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)',
                              borderRadius: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '600',
                              cursor: 'pointer' /* Removed transition, handled by class */
                          }}>
                          <FiTrash2 size={14} /> Remove
                      </button>
                  )}
              </div>
            </div>
            {/* Name and Phone Editing */}
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
               <div>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)',
                  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleFormChange} required className="styled-input"/>
              </div>
              <div>
                <label style={{
                  display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-secondary)',
                  marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px'
                }}>Phone Number</label>
                <input type="tel" name="phoneNumber" placeholder="+1 (234) 567-8900" value={formData.phoneNumber} onChange={handleFormChange} className="styled-input"/>
              </div>
               <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                {/* CANCEL BUTTON with CLASS */}
                <button
                    type="button"
                    onClick={handleCancelClick}
                    className="profile-action-button cancel-edit-button" // <-- Added class
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                        background: 'transparent', border: '1.5px solid var(--surface-color-light)', borderRadius: '8px',
                        color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' /* Removed transition */
                    }}>
                  <FiXCircle size={16} /> Cancel
                </button>
                {/* SAVE BUTTON with CLASS */}
                <button
                    type="submit"
                    onClick={handleFormSubmit}
                    className="profile-action-button save-changes-button" // <-- Added class
                    style={{
                        display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 20px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)', border: 'none', borderRadius: '8px',
                        color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer', /* Removed transition & boxShadow */
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' // Keep initial shadow if desired
                    }}>
                  <FiSave size={16} /> Save Changes
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* PROFILE DISPLAY VIEW (No changes needed here for button hovers) */
          <div style={{
              background: 'var(--surface-color)', border: '1px solid var(--surface-color-light)',
              borderRadius: '16px', padding: '28px', marginBottom: '24px', display: 'flex',
              flexDirection: 'row', alignItems: 'center', gap: '32px', transition: 'all 0.3s ease'
          }}
               onMouseOver={(e) => {
                 e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
                 e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246, 0.12)';
                 e.currentTarget.style.transform = 'translateY(-2px)';
               }}
               onMouseOut={(e) => {
                 e.currentTarget.style.borderColor = 'var(--surface-color-light)';
                 e.currentTarget.style.boxShadow = '0 0 0 rgba(0,0,0,0)';
                 e.currentTarget.style.transform = 'translateY(0)';
               }}>
            {/* Avatar */}
            <div style={{ flexShrink: 0 }}>
              {user.profilePictureUrl ? (
                <img src={user.profilePictureUrl} alt="Profile" className="profile-picture" style={{
                    width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover',
                    border: '3px solid var(--surface-color-light)', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)'
                }}/>
              ) : (
                <div style={{
                    width: '100px', height: '100px', borderRadius: '50%', background: 'var(--background-color)',
                    border: '3px solid var(--surface-color-light)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                }}>
                  <FiUser size={50} style={{ color: 'var(--text-secondary)' }} />
                </div>
              )}
            </div>
            {/* Info Grid */}
            <div className="profile-info-grid">
               {/* Name */}
              <div className="info-block">
                <FiUser className="info-icon" style={{ color: '#8b5cf6' }} />
                <div className="info-text"><p>NAME</p><p>{user.name}</p></div>
              </div>
              {/* Email */}
              <div className="info-block">
                <FiMail className="info-icon" style={{ color: '#ec4899' }} />
                <div className="info-text"><p>EMAIL</p><p>{user.email}</p></div>
              </div>
              {/* Rating */}
              <div className="info-block">
                <FiStar className="info-icon" style={{ color: '#ffc107' }} />
                <div className="info-text">
                  <p>RATING</p>
                  {averageRating > 0 ? (
                    <p style={{ margin: 0, color: 'var(--text-primary)', fontSize: '15px', fontWeight: '500', lineHeight: '1.3', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {averageRating.toFixed(1)}
                      <FiStar style={{ color: '#ffc107', fill: '#ffc107', fontSize: '15px' }} />
                    </p>
                  ) : ( <p className="not-rated-text">Not rated yet</p> )}
                </div>
              </div>
              {/* Phone */}
              <div className="info-block">
                <FiPhone className="info-icon" style={{ color: '#10b981' }} />
                <div className="info-text"><p>PHONE</p><p>{user.phoneNumber || 'Not provided'}</p></div>
              </div>
            </div>
          </div>
        )}

        {/* TABS AND CONTENT (No changes needed here) */}
        <div style={{
            background: 'var(--surface-color)', border: '1px solid var(--surface-color-light)',
            borderRadius: '16px', padding: '24px', marginBottom: '24px'
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--surface-color-light)',
            paddingBottom: '0', justifyContent: 'center'
          }}>
            <button className={`tab-button ${activeTab === 'feedback' ? 'active' : ''}`} onClick={() => setActiveTab('feedback')}>
              <FiMessageSquare size={16} /> Feedback Received ({sortedRatings.length})
            </button>
            <button className={`tab-button ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
              <FiClock size={16} /> My Travel History ({sortedRides.length})
            </button>
          </div>

          {/* Tab Content: Feedback Received */}
          {activeTab === 'feedback' && (
             <div style={{ animation: 'slideIn 0.3s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 {sortedRatings.length > 0 ? (
                    <>
                      {sortedRatings.slice(0, visibleRatings).map((rating, idx) => (
                        <div key={rating.id} className="rating-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid var(--surface-color-light)' }}>
                            {/* Ride Info */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                              <FiMapPin size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                              <p style={{ fontSize: '14px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
                                {rating.rideRequest?.originCity || extractCityName(rating.rideRequest?.origin)}
                                <FiArrowRight size={12} style={{ margin: '0 6px', color: 'var(--text-secondary)' }} />
                                {rating.rideRequest?.destinationCity || extractCityName(rating.rideRequest?.destination)}
                              </p>
                            </div>
                            {/* Rating and Date */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {[...Array(5)].map((_, i) => ( <FiStar key={i} size={14} style={{ color: i < rating.score ? '#ffc107' : 'var(--surface-color-light)' }} /> ))}
                              </div>
                              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <FiCalendar size={12} /> {new Date(rating.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {/* Comment */}
                          <p style={{ fontSize: '14px', fontStyle: 'italic', margin: '12px 0', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                            "{rating.comment || 'No comment provided.'}"
                          </p>
                          {/* Rater Info */}
                          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                            by <strong style={{ color: 'var(--text-primary)' }}>{rating.rater?.name || 'Anonymous'}</strong>
                          </p>
                        </div>
                      ))}
                      {/* Load More Button for Ratings */}
                      {visibleRatings < sortedRatings.length && (
                          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--surface-color-light)' }}>
                              <button onClick={() => setVisibleRatings(prev => prev + RATINGS_PER_PAGE)} style={{
                                  padding: '10px 20px', background: 'transparent', border: '1.5px solid var(--surface-color-light)',
                                  borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600',
                                  cursor: 'pointer', transition: 'all 0.2s ease'
                              }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--surface-color-light)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'transparent'; }}>
                                  Load More Feedback
                              </button>
                          </div>
                      )}
                    </>
                  ) : (
                     <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px', fontSize: '14px' }}>You have not received any feedback yet.</p>
                  )}
              </div>
            </div>
          )}

          {/* Tab Content: History */}
          {activeTab === 'history' && (
            <div style={{ animation: 'slideIn 0.3s ease' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {sortedRides.length > 0 ? (
                  <>
                    {sortedRides.slice(0, visibleRides).map((ride, idx) => {
                      // Find potential ratees (excluding self)
                      const driver = ride.requester;
                      const passengers = ride.participants?.map(p => p.participant) || [];
                      const potentialRatees = [driver, ...passengers].filter(p => p && p.id !== user.id);
                      const uniquePotentialRatees = [...new Map(potentialRatees.map(item => [item?.id, item])).values()].filter(Boolean);

                      // --- NEW CHECK: Determine if all potential ratees have been rated ---
                      let allParticipantsRated = true;
                      if (uniquePotentialRatees.length > 0) {
                        for (const ratee of uniquePotentialRatees) {
                          if (!findGivenRating(ride.id, ratee.id)) {
                            allParticipantsRated = false;
                            break; // Found someone not rated, no need to check further
                          }
                        }
                      } else {
                        // If there's no one else to rate, consider it "all rated" vacuously
                         allParticipantsRated = true;
                      }
                      // --- END NEW CHECK ---

                      return (
                        <div key={ride.id} className="ride-card" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            {/* Ride Info */}
                            <div style={{ flex: 1 }}>
                               <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <FiMapPin size={16} style={{ color: '#ec4899', flexShrink: 0 }} />
                                <p style={{ fontSize: '15px', fontWeight: '600', margin: 0, color: 'var(--text-primary)' }}>
                                  {ride.originCity || extractCityName(ride.origin)} → {ride.destinationCity || extractCityName(ride.destination)}
                                </p>
                              </div>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                <FiCalendar size={13} /> {new Date(ride.travelDateTime).toLocaleString()}
                              </p>
                            </div>

                            {/* --- UPDATED CONDITIONAL RENDERING --- */}
                            {uniquePotentialRatees.length > 0 ? ( // Only show button/status if someone COULD be rated
                              allParticipantsRated ? (
                                <span style={{
                                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                                  padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)',
                                  border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '8px',
                                  color: '#10b981', fontSize: '12px', fontWeight: '600', marginLeft: '12px'
                                }}>
                                  <FiCheckCircle size={14}/> Rated
                                </span>
                              ) : (
                                <button
                                  onClick={() => {
                                    setSelectedRideForRating({ ride, potentialRatees: uniquePotentialRatees });
                                  }}
                                  style={{
                                      padding: '8px 16px', background: 'rgba(0, 0, 0, 0.3)', backdropFilter: 'blur(10px)',
                                      border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '8px', color: 'white',
                                      fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease',
                                      whiteSpace: 'nowrap', marginLeft: '12px'
                                  }}
                                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.5)'; e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.3)'; e.currentTarget.style.border = '1px solid rgba(255, 255, 255, 0.1)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                                  title="Rate participants"
                                >
                                  Rate Your Ride
                                </button>
                              )
                            ) : (
                               <span style={{fontSize: '12px', color: 'var(--text-secondary)', marginLeft: '12px', fontStyle: 'italic'}}>
                                   {/* Optional: Message if no one else was on the ride */}
                                   {/* You were the only one */}
                               </span>
                            )}
                            {/* --- END UPDATED CONDITIONAL RENDERING --- */}

                          </div>
                        </div>
                      );
                    })}
                     {/* Load More Button for Rides */}
                     {visibleRides < sortedRides.length && (
                        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--surface-color-light)' }}>
                          <button onClick={() => setVisibleRides(prev => prev + RIDES_PER_PAGE)} style={{
                              padding: '10px 20px', background: 'transparent', border: '1.5px solid var(--surface-color-light)',
                              borderRadius: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '600',
                              cursor: 'pointer', transition: 'all 0.2s ease'
                          }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.color = '#3b82f6'; e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--surface-color-light)'; e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'transparent'; }}>
                              Load More Rides
                          </button>
                        </div>
                      )}
                  </>
                ) : (
                  <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px', fontSize: '14px' }}>You have no past rides in your history.</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modals */}
        {selectedRideForRating && (
          <RatingModal
            ride={selectedRideForRating.ride}
            potentialRatees={selectedRideForRating.potentialRatees}
            onClose={() => setSelectedRideForRating(null)}
            onSubmitRating={handleSubmitRating}
            findGivenRating={findGivenRating} // Pass the function here
          />
        )}
        {isCropperOpen && (
          <ImageCropperModal
            imageSrc={imageToCrop}
            onClose={() => setIsCropperOpen(false)}
            onCropComplete={handleCropComplete}
          />
        )}
      </div>
    </div>
  );
}

export default ProfilePage;