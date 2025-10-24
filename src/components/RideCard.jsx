// src/components/RideCard.jsx - Updated with city names only
import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './RideCard.css';
import { FiCalendar, FiMapPin } from 'react-icons/fi';
import { FaUserCircle, FaCheckCircle } from 'react-icons/fa';

function RideCard({ ride, currentUser, onActionSuccess }) {
    const navigate = useNavigate();

    const driver = ride.requester;
    const isMyRide = currentUser?.id === driver?.id;
    const now = new Date();
    const departureTime = new Date(ride.travelDateTime);
    const completionTime = useMemo(() => {
        try {
            const departTime = new Date(ride.travelDateTime).getTime();
            const durationMs = (ride.duration || 0) * 60000;
            return new Date(departTime + durationMs);
        } catch (error) {
            return new Date();
        }
    }, [ride]);

    const hasDeparted = now > departureTime;
    const hasCompleted = now > completionTime;
    const mySegment = ride.participants?.find(p => p.participant.id === currentUser?.id);

    // Helper function to extract city name from full address
    const extractCityName = (address) => {
        if (!address) return '';
        // Split by comma and take the first part (which is usually the city)
        const parts = address.split(',');
        return parts[0].trim();
    };

    // Create arrays of route points and cities
    const routePoints = useMemo(() => {
        if (!ride) return [];
        return [ride.origin, ...(ride.stopovers || []).map(s => s.point), ride.destination];
    }, [ride]);

    const routeCities = useMemo(() => {
        if (!ride) return [];
        return [ride.originCity, ...(ride.stopovers || []).map(s => s.city), ride.destinationCity];
    }, [ride]);

    // Helper function to get city name from point address
    const getCityFromPoint = (point) => {
        if (!point) return '';
        const pointIndex = routePoints.indexOf(point);
        if (pointIndex !== -1 && routeCities[pointIndex]) {
            // Extract only the city name from the city field
            return extractCityName(routeCities[pointIndex]);
        }
        // Fallback: extract from the point itself
        return extractCityName(point);
    };

    // Get display origin and destination with city names only
    const displayOrigin = mySegment?.pickupPoint 
        ? getCityFromPoint(mySegment.pickupPoint) 
        : extractCityName(ride.originCity || ride.origin || 'Origin');
    
    const displayDestination = mySegment?.dropoffPoint 
        ? getCityFromPoint(mySegment.dropoffPoint) 
        : extractCityName(ride.destinationCity || ride.destination || 'Destination');

    const handleCardClick = (e) => {
        navigate(`/ride/${ride.id}`);
    };

    const formatTime = (dateTimeString) => {
        try {
            return new Date(dateTimeString).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        } catch (error) {
            return '--:--';
        }
    };

    const calculateArrivalTime = () => {
        try {
            const departTime = new Date(ride.travelDateTime).getTime();
            const durationMs = (ride.duration || 0) * 60000;
            return new Date(departTime + durationMs);
        } catch (error) {
            return new Date();
        }
    };

    const formatDuration = (minutes) => {
        if (minutes == null || minutes < 1) return '';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours}h${mins > 0 ? ` ${mins}m` : ''}`;
        return `${mins}m`;
    };

    const formatDate = (dateTimeString) => {
        try {
            const rideDate = new Date(dateTimeString);
            const today = new Date();
            
            // Compare only the date parts (year, month, day)
            const isSameDay = (date1, date2) => {
                return date1.getFullYear() === date2.getFullYear() &&
                       date1.getMonth() === date2.getMonth() &&
                       date1.getDate() === date2.getDate();
            };
            
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            if (isSameDay(rideDate, today)) {
                return 'Today';
            } else if (isSameDay(rideDate, tomorrow)) {
                return 'Tomorrow';
            } else {
                return rideDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
            }
        } catch (error) {
            return 'Invalid Date';
        }
    };

    return (
        <div
            className={`ride-card-final ${hasDeparted && !hasCompleted ? 'departed' : ''} ${hasCompleted ? 'completed' : ''}`}
            onClick={handleCardClick}
            role="button"
            tabIndex={0}
        >
            <div className="card-top-section">
                <div className="timeline-container">
                    <span className="time-value start">
                        {formatTime(ride.travelDateTime)}
                    </span>

                    <div className="timeline-graphic">
                        <div className="dot"></div>
                        <div className="line"></div>
                        <span className="duration">
                            {formatDuration(ride.duration)}
                        </span>
                        <div className="line"></div>
                        <div className="dot"></div>
                    </div>

                    <span className="time-value end">
                        {formatTime(calculateArrivalTime())}
                    </span>

                    <span className="location-value start" title={mySegment ? mySegment.pickupPoint : ride.origin}>
                        {displayOrigin}
                        {mySegment && <span style={{
                            fontSize: '0.7rem',
                            color: '#10b981',
                            marginLeft: '6px',
                            fontWeight: '600'
                        }}>●</span>}
                    </span>
                    
                    <span className="location-value end" title={mySegment ? mySegment.dropoffPoint : ride.destination}>
                        {displayDestination}
                        {mySegment && <span style={{
                            fontSize: '0.7rem',
                            color: '#ef4444',
                            marginLeft: '6px',
                            fontWeight: '600'
                        }}>●</span>}
                    </span>
                </div>
            </div>

            <div className="card-footer">
                <div className="driver-details">
                    {driver.profilePictureUrl ? (
                        <img
                            src={driver.profilePictureUrl}
                            alt={`${driver.name}'s profile`}
                            className="driver-avatar-small"
                        />
                    ) : (
                        <FaUserCircle className="driver-avatar-small" />
                    )}
                    <span title={`Driver: ${driver.name}`}>
                        {driver.name}
                    </span>
                </div>

                <div className="date-details">
                    <FiCalendar size={16} />
                    <span>{formatDate(ride.travelDateTime)}</span>
                </div>

                <div className="card-action" onClick={(e) => e.stopPropagation()}>
                    {hasCompleted ? (
                        <span className="status-tag completed">
                            <FaCheckCircle size={14} />
                            Completed
                        </span>
                    ) : hasDeparted ? (
                        <span className="status-tag departed">
                            Departed
                        </span>
                    ) : (
                        <div className="status-placeholder"></div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RideCard;