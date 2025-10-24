import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import StarRatingDisplay from '../components/StarRatingDisplay.jsx';
import '../App.css';
import { FaUserCircle, FaEnvelope, FaStar, FaCarSide, FaCommentDots, FaHistory, FaArrowRight, FaCalendarAlt, FaPhone } from 'react-icons/fa';
import Button from '../components/Button.jsx';
import { useNotification } from '../context/NotificationContext.jsx';

function PublicProfilePage() {
    console.log('PublicProfilePage component loaded!');
    const { id } = useParams();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const [profile, setProfile] = useState(null);
    const [ratings, setRatings] = useState([]);
    const [averageRating, setAverageRating] = useState('N/A');
    const [totalRides, setTotalRides] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const extractCityName = (location) => {
        if (!location) return '';
        const parts = location.split(',');
        return parts[0].trim();
    };

    useEffect(() => {
        const fetchProfileData = async () => {
            setIsLoading(true);
            try {
                // Fetch public profile data
                const profileResponse = await axios.get(`http://localhost:8080/api/employees/${id}`);
                console.log('Public Profile Data:', profileResponse.data);
                console.log('Phone Number:', profileResponse.data.phoneNumber);
                setProfile(profileResponse.data);

                // Fetch ratings received by this user
                const ratingsResponse = await axios.get(`http://localhost:8080/api/ratings/my-ratings`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const filteredRatings = ratingsResponse.data.filter(r => r.ratee.id === profileResponse.data.id);
                setRatings(filteredRatings);

                if (filteredRatings.length > 0) {
                    const total = filteredRatings.reduce((acc, r) => acc + r.score, 0);
                    setAverageRating((total / filteredRatings.length).toFixed(1));
                }
                
                // Fetch ride history to get total rides. This endpoint needs to be secured so we use the token.
                const ridesResponse = await axios.get(`http://localhost:8080/api/rides/my-rides`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                const userRides = ridesResponse.data.filter(ride => 
                    ride.requester.id === profileResponse.data.id || 
                    (ride.driver && ride.driver.id === profileResponse.data.id) ||
                    (ride.participants && ride.participants.some(p => p.participant.id === profileResponse.data.id))
                );
                setTotalRides(userRides.length);

            } catch (error) {
                console.error('Failed to fetch profile data:', error);
                showNotification('Could not load profile.', 'error');
                setProfile(null);
            } finally {
                setIsLoading(false);
            }
        };

        if (id) {
            fetchProfileData();
        }
    }, [id, showNotification]);

    if (isLoading) {
        return <div className="main-container"><p>Loading profile...</p></div>;
    }

    if (!profile) {
        return <div className="main-container"><p>Profile not found or could not be loaded.</p></div>;
    }

    return (
        <div className="main-container">
            <header className="page-header">
                <h1>Public Profile</h1>
            </header>

            <div className="profile-details-grid">
                <div className="profile-picture-container">
                    {profile.profilePictureUrl ? (
                        <img src={profile.profilePictureUrl} alt="Profile" className="profile-picture" />
                    ) : (
                        <FaUserCircle size={120} className="profile-picture-placeholder" />
                    )}
                </div>
                <div className="profile-display-info">
                    <div>
                        <p><strong><FaUserCircle /> Name:</strong> {profile.name}</p>
                        <p><strong><FaEnvelope /> Email:</strong> {profile.email}</p>
                        <p><strong><FaPhone /> Phone:</strong> {profile.phoneNumber || profile.phone_number || 'Not provided'}</p>
                        <p><strong><FaStar /> Average Rating:</strong> {averageRating} {averageRating !== 'N/A' && <FaStar size={14} style={{ color: '#ffc107', marginLeft: '4px' }} />}</p>
                        <p><strong><FaCarSide /> Rides Completed:</strong> {totalRides}</p>
                    </div>
                </div>
            </div>

            <div className="profile-content-grid">
                <div className="feedback-column">
                    <h2><FaCommentDots /> Feedback Received</h2>
                    <div className="ratings-list">
                        {ratings.length > 0 ? (
                            ratings.map(rating => (
                                <div key={rating.id} className="rating-card" style={{ backgroundColor: 'var(--surface-color)', padding: '15px', borderRadius: 'var(--border-radius)', marginBottom: '10px', border: '1px solid var(--surface-color-light)' }}>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '8px' }}>
                                        From ride: <strong>{rating.rideRequest.originCity || extractCityName(rating.rideRequest.origin)} <FaArrowRight size={10} /> {rating.rideRequest.destinationCity || extractCityName(rating.rideRequest.destination)}</strong>
                                    </p>
                                    <p><strong>"{rating.comment || 'No comment provided.'}"</strong></p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                        <span>- Rated {rating.score}/5 by {rating.rater.name}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.8rem' }}>
                                            <FaCalendarAlt />
                                            {new Date(rating.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>This user has not received any feedback yet.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PublicProfilePage;