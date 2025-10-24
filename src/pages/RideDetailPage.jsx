// src/pages/RideDetailPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/Button.jsx';
import PublicProfileModal from '../components/PublicProfileModal.jsx';
import ChatModal from '../components/ChatModal.jsx';
import BookingConfirmationModal from '../components/BookingConfirmationModal.jsx';
import CancelRideModal from '../components/CancelRideModal.jsx';
import ReportRideModal from '../components/ReportRideModal.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import { FaUserCircle, FaWhatsapp, FaCheckCircle, FaCar } from 'react-icons/fa';
import { FiClock, FiUsers, FiMapPin, FiArrowRight, FiCheckCircle, FiShield, FiMessageSquare, FiInfo, FiNavigation, FiUser, FiX, FiAlertTriangle } from 'react-icons/fi';
import './RideDetailPage.css';
import { GoogleMap, useJsApiLoader, DirectionsRenderer, MarkerF } from '@react-google-maps/api';

const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px',
};

function RideDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const { showNotification } = useNotification();

    const [ride, setRide] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [isActionLoading, setIsActionLoading] = useState(false);
    const [selectedProfileId, setSelectedProfileId] = useState(null);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [isCancelLoading, setIsCancelLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [isReportLoading, setIsReportLoading] = useState(false);
    const [directions, setDirections] = useState(null);

    // Segment selection state
    const [pickupPoint, setPickupPoint] = useState(null);
    const [dropoffPoint, setDropoffPoint] = useState(null);
    const [segmentPrice, setSegmentPrice] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script-detail',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    });

    // Get search context from URL params or location.state
    const searchContext = useMemo(() => {
        const fromUrl = {
            searchOrigin: searchParams.get('searchOrigin'),
            searchDestination: searchParams.get('searchDestination')
        };
        
        const fromState = location.state || {};
        
        return {
            searchOrigin: fromUrl.searchOrigin || fromState.searchOrigin,
            searchDestination: fromUrl.searchDestination || fromState.searchDestination
        };
    }, [searchParams, location.state]);

    // Helper function to calculate ride completion time
    const getRideCompletionTime = useCallback((rideData) => {
        try {
            const departTime = new Date(rideData.travelDateTime).getTime();
            const durationMs = (rideData.duration || 0) * 60000;
            return new Date(departTime + durationMs);
        } catch (error) {
            return new Date();
        }
    }, []);

    // Calculate ride status
    const rideStatus = useMemo(() => {
        if (!ride) return null;
        const now = new Date();
        const departureTime = new Date(ride.travelDateTime);
        const completionTime = getRideCompletionTime(ride);

        if (now > completionTime) {
            return 'completed';
        } else if (now > departureTime) {
            return 'departed';
        }
        return 'upcoming';
    }, [ride, getRideCompletionTime]);

    const fetchData = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        setIsLoading(true);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [rideResponse, userResponse] = await Promise.all([
                axios.get(`http://localhost:8080/api/rides/${id}`, config),
                axios.get(`http://localhost:8080/api/employees/me`, config),
            ]);
            const rideData = rideResponse.data;
            setRide(rideData);
            setCurrentUser(userResponse.data);

            const userSegment = rideData.participants.find(p => p.participant.id === userResponse.data.id);
            
            if (searchContext.searchOrigin && searchContext.searchDestination) {
                setPickupPoint(searchContext.searchOrigin);
                setDropoffPoint(searchContext.searchDestination);
            } else if (userSegment && userSegment.pickupPoint && userSegment.dropoffPoint) {
                setPickupPoint(userSegment.pickupPoint);
                setDropoffPoint(userSegment.dropoffPoint);
                setSegmentPrice(userSegment.price);
            } else {
                setPickupPoint(rideData.origin);
                setDropoffPoint(rideData.destination);
                setSegmentPrice(rideData.price);
            }

            setError('');
        } catch (err) {
            console.error('fetchData error:', err);
            setError('Failed to load ride details.');
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate, searchContext.searchOrigin, searchContext.searchDestination]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const driver = useMemo(() => (ride ? ride.requester : null), [ride]);

    const allParticipants = useMemo(() => {
        if (!ride || !driver) return [];
        const participants = ride.participants.map(p => p.participant);
        participants.unshift(driver);
        return [...new Map(participants.map(item => [item.id, item])).values()];
    }, [ride, driver]);

    const isUserDriver = useMemo(() => {
        return currentUser && driver && currentUser.id === driver.id;
    }, [currentUser, driver]);

    const isUserInvolved = useMemo(() => {
        if (!currentUser || !ride) return false;
        return ride.participants.some(p => p.participant.id === currentUser.id);
    }, [currentUser, ride]);

    const routePoints = useMemo(() => {
        if (!ride) return [];
        return [ride.origin, ...(ride.stopovers || []).map(s => s.point), ride.destination];
    }, [ride]);

    const routeCities = useMemo(() => {
        if (!ride) return [];
        return [ride.originCity, ...(ride.stopovers || []).map(s => s.city), ride.destinationCity];
    }, [ride]);

    const extractMainCity = useCallback((location) => {
        if (!location) return '';
        const normalized = location.toLowerCase().trim();
        
        const cities = ['mumbai', 'chennai', 'tirupati', 'kerala', 'bangalore', 
                       'hyderabad', 'delhi', 'kolkata', 'pune', 'ahmedabad'];
        
        for (const city of cities) {
            if (normalized.includes(city)) return city;
        }
        
        const parts = normalized.split(',');
        return parts[0].trim();
    }, []);

   const locationsMatch = useCallback((loc1, loc2) => {
    if (!loc1 || !loc2) return false;
    
    const l1 = loc1.toLowerCase().trim();
    const l2 = loc2.toLowerCase().trim();
    
    // Exact match
    if (l1 === l2) return true;
    
    // Normalize by removing common suffixes and standardizing
    const normalize = (str) => {
        return str
            .replace(/,\s*india$/i, '')
            .replace(/,\s*andhra pradesh$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
    };
    
    const normalized1 = normalize(l1);
    const normalized2 = normalize(l2);
    
    if (normalized1 === normalized2) return true;
    
    // Only match if one is a proper substring at the beginning (for abbreviated addresses)
    if (normalized1.startsWith(normalized2) || normalized2.startsWith(normalized1)) {
        const longer = normalized1.length > normalized2.length ? normalized1 : normalized2;
        const shorter = normalized1.length > normalized2.length ? normalized2 : normalized1;
        
        // If the longer string just adds more detail after a comma, it's a match
        if (longer.startsWith(shorter) && (longer.charAt(shorter.length) === ',' || longer.charAt(shorter.length) === ' ')) {
            return true;
        }
    }
    
    return false;
}, []);
    const getCityFromPoint = useCallback((point) => {
        if (!ride || !point) return '';
        
        const pointIndex = routePoints.indexOf(point);
        if (pointIndex !== -1 && routeCities[pointIndex]) {
            return routeCities[pointIndex];
        }
        
        for (let i = 0; i < routePoints.length; i++) {
            if (locationsMatch(routePoints[i], point)) {
                return routeCities[i];
            }
        }
        
        return point.split(',')[0];
    }, [ride, routePoints, routeCities, locationsMatch]);

    const formatDuration = (minutes) => {
        if (!minutes) return 'N/A';
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return h > 0 ? `${h}h ${m}m` : `${m}m`;
    };

    const calculateSegmentPrice = useCallback(() => {
        if (!ride || !pickupPoint || !dropoffPoint) return;

        let pickupIndex = -1;
        let dropoffIndex = -1;

        for (let i = 0; i < routePoints.length; i++) {
            if (pickupIndex === -1 && locationsMatch(routePoints[i], pickupPoint)) {
                pickupIndex = i;
            }
            if (pickupIndex !== -1 && locationsMatch(routePoints[i], dropoffPoint)) {
                dropoffIndex = i;
                break;
            }
        }

        if (pickupIndex === -1 || dropoffIndex === -1 || pickupIndex >= dropoffIndex) {
            setSegmentPrice(ride.price);
            return;
        }

        if (pickupIndex === 0 && dropoffIndex === routePoints.length - 1) {
            setSegmentPrice(ride.price);
            return;
        }

        if (ride.stopoverPrices && ride.stopoverPrices.length > 0) {
            let totalPrice = 0;
            for (let i = pickupIndex; i < dropoffIndex; i++) {
                totalPrice += (ride.stopoverPrices[i] || 0);
            }
            setSegmentPrice(Math.max(20, totalPrice));
        } else if (ride.pricePerKm && ride.distance) {
            const segmentRatio = (dropoffIndex - pickupIndex) / (routePoints.length - 1);
            const calculatedPrice = Math.round((ride.price * segmentRatio) / 10) * 10;
            setSegmentPrice(Math.max(20, calculatedPrice));
        } else {
            setSegmentPrice(ride.price);
        }
    }, [pickupPoint, dropoffPoint, ride, routePoints, locationsMatch]);

    useEffect(() => {
        calculateSegmentPrice();
    }, [calculateSegmentPrice]);

    useEffect(() => {
        if (isLoaded && ride) {
            const directionsService = new window.google.maps.DirectionsService();
            const waypoints = (ride.stopovers || []).map(stop => ({ location: stop.point, stopover: true }));
            
            directionsService.route(
                {
                    origin: ride.origin,
                    destination: ride.destination,
                    waypoints: waypoints,
                    travelMode: 'DRIVING'
                },
                (result, status) => {
                    if (status === 'OK') {
                        setDirections(result);
                    } else {
                        console.error(`Error fetching directions: ${status}`);
                    }
                }
            );
        }
    }, [isLoaded, ride]);

    const handleContactDriver = () => {
        if (driver && driver.phoneNumber) {
            const phoneNumber = driver.phoneNumber.replace(/\D/g, '');
            const whatsappUrl = `https://wa.me/91${phoneNumber}`;
            window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
        } else {
            showNotification("Driver's phone number is not available.", 'error');
        }
    };

    const handleBookOrJoin = async (passengerCount) => {
       let pickupIndex = -1;
let dropoffIndex = -1;
for (let i = 0; i < routePoints.length; i++) {
    if (pickupIndex === -1 && locationsMatch(routePoints[i], pickupPoint)) {
        pickupIndex = i;
    }
    if (pickupIndex !== -1 && i > pickupIndex && locationsMatch(routePoints[i], dropoffPoint)) {
        dropoffIndex = i;
        break;
    }
}

        if (pickupIndex === -1 || dropoffIndex === -1 || pickupIndex >= dropoffIndex) {
            showNotification('Please select valid pickup and drop-off points.', 'error');
            return;
        }

        setIsActionLoading(true);
        const token = localStorage.getItem('token');
        try {
            const body = {
                pickupPoint: routePoints[pickupIndex],
                dropoffPoint: routePoints[dropoffIndex],
                price: segmentPrice * passengerCount,
                numberOfSeats: passengerCount
            };
            await axios.post(`http://localhost:8080/api/rides/${id}/join`, body, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const seatText = passengerCount > 1 ? `${passengerCount} seats` : 'your seat';
            showNotification(`Successfully booked ${seatText}!`, 'success');
            setShowBookingModal(false);
            await fetchData();
        } catch (error) {
            console.error('join error:', error);
            showNotification(error.response?.data?.message || 'Failed to book ride.', 'error');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleCancelRide = async (reason) => {
        setIsCancelLoading(true);
        const token = localStorage.getItem('token');
        
        try {
            if (isUserDriver) {
                await axios.post(`http://localhost:8080/api/rides/${id}/cancel-driver`, null, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                showNotification('Ride has been cancelled. All passengers have been notified.', 'success');
            } else {
                await axios.post(`http://localhost:8080/api/rides/${id}/cancel-passenger`, {
                    reason: reason
                }, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                showNotification('You have successfully left this ride.', 'success');
            }
            
            setShowCancelModal(false);
            setTimeout(() => navigate('/dashboard'), 1500);
        } catch (error) {
            console.error('Cancel error:', error);
            showNotification(error.response?.data?.error || 'Failed to cancel ride.', 'error');
        } finally {
            setIsCancelLoading(false);
        }
    };

    const handleReportRide = async (reportData) => {
        setIsReportLoading(true);

        try {
            const emailContent = {
                name: currentUser.name,
                email: currentUser.email,
                message: `RIDE REPORT\n\nRide: ${reportData.rideInfo.from} → ${reportData.rideInfo.to}\nDate: ${reportData.rideInfo.date}\nReason: ${reportData.reason}\n\nDetails:\n${reportData.description}`
            };

            await axios.post('http://localhost:8080/api/contact/send', emailContent);

            showNotification('Thank you for reporting this ride. Our team will review it shortly.', 'success');
            setShowReportModal(false);
        } catch (error) {
            console.error('Error submitting report:', error);
            showNotification(
                error.response?.data?.message || 'Failed to submit report. Please try again later.',
                'error'
            );
        } finally {
            setIsReportLoading(false);
        }
    };

    const totalSeatsBooked = useMemo(() => {
        if (!ride) return 0;
        return ride.participants.reduce((total, p) => {
            return total + (p.numberOfSeats || 1);
        }, 0);
    }, [ride]);

    const userBookingDetails = useMemo(() => {
        if (!currentUser || !ride) return null;
        const userParticipant = ride.participants.find(p => p.participant.id === currentUser.id);
        return userParticipant || null;
    }, [currentUser, ride]);

    const renderActionButton = () => {
        if (isUserDriver) {
            return null;
        }

        if (isUserInvolved) {
            return <div className="status-tag joined"><FiCheckCircle/> You are in this ride</div>;
        }
        
        let pickupIndex = -1;
        let dropoffIndex = -1;
        for (let i = 0; i < routePoints.length; i++) {
    if (pickupIndex === -1 && locationsMatch(routePoints[i], pickupPoint)) {
        pickupIndex = i;
    }
    if (pickupIndex !== -1 && i > pickupIndex && locationsMatch(routePoints[i], dropoffPoint)) {
        dropoffIndex = i;
        break;
    }
}
        
        const validSelection = pickupIndex !== -1 && dropoffIndex !== -1 && pickupIndex < dropoffIndex;
        
        if (ride.vehicleCapacity != null && totalSeatsBooked >= ride.vehicleCapacity) {
            return <div className="status-tag full">Ride is full</div>;
        }

        if (rideStatus === 'departed') {
            return <div className="status-tag departed">Departed</div>;
        }

        if (rideStatus === 'completed') {
            return <div className="status-tag completed"><FaCheckCircle /> Completed</div>;
        }

        return (
            <Button onClick={() => setShowBookingModal(true)} disabled={!validSelection}>
                Book Seat
            </Button>
        );
    };

    const formatTime = (dateTime) => new Date(dateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const formatDate = (dateTime) => new Date(dateTime).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

    if (isLoading) return <div className="main-container"><p>Loading ride details...</p></div>;
    if (error) return <div className="main-container"><p className="error-message">{error}</p></div>;
    if (!ride || !currentUser || !driver) return <div className="main-container"><p>Could not load ride data.</p></div>;

    return (
        <div className="main-container ride-detail-page">
            <header className="page-header">
                <h1>{getCityFromPoint(pickupPoint)} <FiArrowRight/> {getCityFromPoint(dropoffPoint)}</h1>
                <p className="page-description">{formatDate(ride.travelDateTime)}</p>
                {rideStatus === 'departed' && (
                    <div style={{marginTop: '12px', display: 'inline-block'}}>
                        <span className="status-tag departed">Departed</span>
                    </div>
                )}
                {rideStatus === 'completed' && (
                    <div style={{marginTop: '12px', display: 'inline-block'}}>
                        <span className="status-tag completed"><FaCheckCircle /> Completed</span>
                    </div>
                )}
            </header>

            <div className="detail-grid">
                <div className="detail-main-content">
                    <div className="detail-card">
                        <h3><FiMapPin /> Route Map</h3>
                        <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '-10px', marginBottom: '15px'}}>
                            Showing route with all stops marked
                        </p>
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={{ lat: 20.5937, lng: 78.9629 }}
                                zoom={5}
                            >
                                {directions && <DirectionsRenderer directions={directions} />}
                                {ride.stopovers && ride.stopovers.map((stop, index) => (
                                    stop.lat && stop.lng && <MarkerF key={index} position={{ lat: stop.lat, lng: stop.lng }} />
                                ))}
                            </GoogleMap>
                        ) : <div>Loading map...</div>}
                    </div>

                    <div className="detail-card">
                        <h3><FiInfo /> Trip Overview</h3>
                        <div className="trip-timeline">
                            {routePoints.map((point, index) => {
                                const cityName = routeCities[index];
                                const isPickup = locationsMatch(point, pickupPoint);
                                const isDropoff = locationsMatch(point, dropoffPoint);
                                
                                const calculateStopTime = () => {
                                    const baseTime = new Date(ride.travelDateTime);
                                    if (index === 0) return baseTime;
                                    
                                    const totalDuration = ride.duration || 0;
                                    const segmentRatio = index / (routePoints.length - 1);
                                    const minutesToAdd = Math.round(totalDuration * segmentRatio);
                                    
                                    return new Date(baseTime.getTime() + (minutesToAdd * 60000));
                                };
                                
                                const stopTime = calculateStopTime();
                                const formattedTime = stopTime.toLocaleTimeString('en-US', { 
                                    hour: '2-digit', 
                                    minute: '2-digit', 
                                    hour12: false 
                                });
                                
                                return (
                                    <div key={index} className="timeline-item">
                                        <div className={`timeline-icon ${index === 0 ? 'origin' : index === routePoints.length - 1 ? 'destination' : 'stop'}`}>
                                            {index === 0 ? <FiMapPin/> : index === routePoints.length - 1 ? <FiNavigation/> : <div className="stop-circle"></div>}
                                        </div>
                                        <div className="timeline-content">
                                            <div className="timeline-location-header">
                                                <h4>{cityName}</h4>
                                                <span className="timeline-time">{formattedTime}</span>
                                            </div>
                                            <p className="address">{point}</p>
                                            {isPickup && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    marginTop: '8px',
                                                    padding: '4px 12px',
                                                    background: 'rgba(16, 185, 129, 0.1)',
                                                    color: '#10b981',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}>
                                                    Your Pickup
                                                </span>
                                            )}
                                            {isDropoff && (
                                                <span style={{
                                                    display: 'inline-block',
                                                    marginTop: '8px',
                                                    padding: '4px 12px',
                                                    background: 'rgba(239, 68, 68, 0.1)',
                                                    color: '#ef4444',
                                                    borderRadius: '6px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '600'
                                                }}>
                                                    Your Dropoff
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="info-grid">
                            <div className="info-block">
                                <span><FiUsers />Seats</span>
                                <p>{totalSeatsBooked} / {ride.vehicleCapacity || 'N/A'}</p>
                            </div>
                            <div className="info-block">
                                <span><FaCar />Vehicle</span>
                                <p>{ride.vehicleModel || 'Not specified'}</p>
                            </div>
                            <div className="info-block">
                                <span><FiClock />Duration</span>
                                <p>{formatDuration(ride.duration)}</p>
                            </div>
                            <div className="info-block">
                                <span><FiShield />Gender Preference</span>
                                <p>{ride.genderPreference === 'FEMALE_ONLY' ? 'Female only' : 'Both'}</p>
                            </div>
                        </div>

                        {ride.driverNote && (
                            <div className="driver-note-section">
                                <h4><FiMessageSquare /> Driver's Note</h4>
                                <p>{ride.driverNote}</p>
                            </div>
                        )}
                    </div>

                    <div className="detail-card">
                        <h3><FiUsers /> Passengers ({allParticipants.length})</h3>
                        <div className="participants-grid">
                            {allParticipants.map(p => {
                                const participantData = ride.participants.find(part => part.participant.id === p.id);
                                const isCurrentUser = currentUser && p.id === currentUser.id;
                                const numberOfSeats = participantData?.numberOfSeats || (p.id === driver.id ? 0 : 1);
                                
                                return (
                                    <div key={p.id} className={`participant-item ${p.id === driver.id ? 'driver-item' : ''}`} onClick={() => setSelectedProfileId(p.id)}>
                                        <div className="participant-avatar-wrapper">
                                            {p.profilePictureUrl ? <img src={p.profilePictureUrl} alt={p.name} /> : <FaUserCircle/>}
                                        </div>
                                        <div className="participant-info">
                                            <span className="name">
                                                {isCurrentUser ? 'You' : p.name}
                                                {p.id !== driver.id && numberOfSeats > 1 && (
                                                    <span style={{
                                                        marginLeft: '8px',
                                                        fontSize: '0.85rem',
                                                        color: 'var(--text-secondary)',
                                                        fontWeight: '500'
                                                    }}>
                                                        ({numberOfSeats} seats)
                                                    </span>
                                                )}
                                            </span>
                                            {p.id === driver.id ? (
                                                <span className="badge"><FiUser /> Driver</span>
                                            ) : participantData && (
                                                <span className="badge" style={{fontSize: '0.75rem', color: 'var(--text-secondary)'}}>
                                                    {getCityFromPoint(participantData.pickupPoint)} → {getCityFromPoint(participantData.dropoffPoint)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="detail-sidebar">
                    <div className="price-card detail-card">
                        <h3>Pricing</h3>
                        {isUserInvolved && userBookingDetails ? (
                            <div className="booking-details-display">
                                <div className="booking-status-badge">
                                    <FiCheckCircle /> Booking Confirmed
                                </div>
                                <div className="price-display">
                                    <span className="price-label">Your Booking</span>
                                    <div className="booking-info-grid">
                                        <div className="booking-info-item">
                                            <span className="info-label">Seats Booked</span>
                                            <span className="info-value">{userBookingDetails.numberOfSeats || 1}</span>
                                        </div>
                                        <div className="booking-info-item">
                                            <span className="info-label">Total</span>
                                            <span className="info-value">₹{userBookingDetails.price?.toFixed(0) || '0'}</span>
                                        </div>
                                    </div>
                                    <span className="segment-info">
                                        {getCityFromPoint(userBookingDetails.pickupPoint)} → {getCityFromPoint(userBookingDetails.dropoffPoint)}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="price-display">
                                <span className="price-label">{isUserDriver ? 'Total Fare' : 'Your Fare'}</span>
                                <span className="price-value">₹{segmentPrice != null ? segmentPrice.toFixed(0) : '...'}</span>
                                <span className="segment-info">
                                    {getCityFromPoint(pickupPoint)} → {getCityFromPoint(dropoffPoint)}
                                </span>
                            </div>
                        )}
                        {!isUserDriver && !isUserInvolved && rideStatus !== 'departed' && rideStatus !== 'completed' && (
                            <div className="action-button-container">
                                {renderActionButton()}
                            </div>
                        )}
                        {!isUserDriver && rideStatus && (rideStatus === 'departed' || rideStatus === 'completed') && (
                            <div className="action-button-container">
                                {renderActionButton()}
                            </div>
                        )}

                        {!isUserDriver && isUserInvolved && rideStatus === 'upcoming' && (
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px'
                            }}>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '10px',
                                        color: '#ef4444',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <FiX size={18} /> Leave Ride
                                </button>
                            </div>
                        )}

                        {isUserDriver && rideStatus === 'upcoming' && (
                            <div style={{
                                marginTop: '16px',
                                padding: '16px',
                                background: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px'
                            }}>
                                <button
                                    onClick={() => setShowCancelModal(true)}
                                    style={{
                                        width: '100%',
                                        padding: '12px 16px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: '10px',
                                        color: '#ef4444',
                                        fontWeight: '600',
                                        fontSize: '1rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <FiX size={18} /> Cancel Ride
                                </button>
                            </div>
                        )}
                    </div>

                    {(isUserInvolved || isUserDriver) && (
                        <div className="detail-card chat-card">
                            <h3><FiMessageSquare/> Ride Chat</h3>
                            <Button onClick={() => setIsChatOpen(true)} className="open-chat-btn" style={{width: '100%'}}>
                                <FiMessageSquare /> Open Chat
                            </Button>
                        </div>
                    )}

                    {driver && !isUserDriver && (
                        <div className="detail-card">
                            <h3><FaWhatsapp /> Contact Driver</h3>
                            <Button onClick={handleContactDriver} className="phone-btn" style={{width: '100%'}}>
                                <FaWhatsapp /> Contact {driver.name}
                            </Button>
                        </div>
                    )}

                    {!isUserDriver && (
                        <div className="detail-card report-card">
                            <h3><FiAlertTriangle /> Report Issue</h3>
                            <p style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)',
                                margin: '0 0 16px 0',
                                lineHeight: '1.5'
                            }}>
                                If you experienced any issues with this ride, please let us know.
                            </p>
                            <button
                                onClick={() => setShowReportModal(true)}
                                style={{
                                    width: '100%',
                                    padding: '14px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.3)',
                                    borderRadius: '10px',
                                    color: '#ef4444',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '8px',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <FiAlertTriangle size={18} /> Report Ride
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedProfileId && <PublicProfileModal userId={selectedProfileId} onClose={() => setSelectedProfileId(null)} />}
            
            {isChatOpen && (
                <ChatModal
                    ride={ride}
                    currentUser={currentUser}
                    participants={allParticipants}
                    onClose={() => setIsChatOpen(false)}
                />
            )}

            {showBookingModal && (
                <BookingConfirmationModal
                    ride={ride}
                    pickupPoint={pickupPoint}
                    dropoffPoint={dropoffPoint}
                    pickupCity={getCityFromPoint(pickupPoint)}
                    dropoffCity={getCityFromPoint(dropoffPoint)}
                    segmentPrice={segmentPrice}
                    driver={driver}
                    onConfirm={handleBookOrJoin}
                    onClose={() => setShowBookingModal(false)}
                    isLoading={isActionLoading}
                />
            )}

            <CancelRideModal 
                isOpen={showCancelModal}
                onClose={() => setShowCancelModal(false)}
                onConfirm={handleCancelRide}
                isLoading={isCancelLoading}
                rideInfo={{
                    from: getCityFromPoint(pickupPoint),
                    to: getCityFromPoint(dropoffPoint),
                    date: formatDate(ride.travelDateTime)
                }}
                isDriver={isUserDriver}
            />

            <ReportRideModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onSubmit={handleReportRide}
                isLoading={isReportLoading}
                rideInfo={{
                    from: getCityFromPoint(pickupPoint),
                    to: getCityFromPoint(dropoffPoint),
                    date: formatDate(ride.travelDateTime)
                }}
            />
        </div>
    );
}

export default RideDetailPage;