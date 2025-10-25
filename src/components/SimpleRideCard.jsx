// src/components/SimpleRideCard.jsx - Updated with city names only and status
import React, { useMemo, useCallback } from 'react'; // Added useCallback
import { useNavigate } from 'react-router-dom';
import { FaUserCircle, FaStar } from 'react-icons/fa';
import { FiUsers, FiMapPin, FiNavigation, FiClock, FiCheckCircle } from 'react-icons/fi'; // Added FiClock, FiCheckCircle
import './SimpleRideCard.css'; // Make sure this CSS file is updated as well

function SimpleRideCard({ ride, searchOrigin, searchDestination }) {
    const navigate = useNavigate();
    const driver = ride.requester;
    const availableSeats = ride.vehicleCapacity - ride.participants.length;

    // Helper function to calculate ride completion time (departure + duration)
    const getRideCompletionTime = useCallback((rideData) => {
        try {
            const departTime = new Date(rideData.travelDateTime).getTime();
            const durationMs = (rideData.duration || 0) * 60000;
            return new Date(departTime + durationMs);
        } catch (error) {
            return new Date(); // Fallback
        }
    }, []);

    // --- NEW: Calculate ride status ---
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
    // --- END NEW ---

    // Helper function to extract city name from full address
    const extractCityName = (address) => {
        if (!address) return '';
        const parts = address.split(',');
        return parts[0].trim();
    };

    // Helper function to normalize and extract main city name
    const extractMainCity = (location) => {
        if (!location) return '';
        const normalized = location.toLowerCase().trim();
        const cities = ['mumbai', 'chennai', 'tirupati', 'kerala', 'bangalore',
                       'hyderabad', 'delhi', 'kolkata', 'pune', 'ahmedabad', 'nellore'];
        for (const city of cities) {
            if (normalized.includes(city)) return city;
        }
        const parts = normalized.split(',');
        return parts[0].trim();
    };

    // Helper function to check if two locations match
    const locationsMatch = useCallback((loc1, loc2) => {
        if (!loc1 || !loc2) return false;
        const l1 = loc1.toLowerCase().trim();
        const l2 = loc2.toLowerCase().trim();
        if (l1 === l2) return true;
        if (l1.includes(l2) || l2.includes(l1)) return true;
        const city1 = extractMainCity(loc1);
        const city2 = extractMainCity(loc2);
        return city1 === city2 && city1.length >= 3;
    }, []); // Removed extractMainCity from dependencies as it's stable

    const segmentDetails = useMemo(() => {
        if (!searchOrigin && !searchDestination) {
            return {
                origin: extractCityName(ride.originCity),
                destination: extractCityName(ride.destinationCity),
                price: ride.price,
                isSegment: false,
                specificOrigin: ride.origin,
                specificDestination: ride.destination,
                stopsInRoute: ride.stopovers || []
            };
        }
        const routePoints = [];
        const routeCities = [];
        routePoints.push(ride.origin);
        routeCities.push(ride.originCity);
        if (ride.stopovers && ride.stopovers.length > 0) {
            ride.stopovers.forEach(stop => {
                routePoints.push(stop.point);
                routeCities.push(stop.city);
            });
        }
        routePoints.push(ride.destination);
        routeCities.push(ride.destinationCity);

        let originIndex = -1;
        let destIndex = -1;
        if (searchOrigin) {
            for (let i = 0; i < routePoints.length; i++) {
                if (routePoints[i] === searchOrigin || routeCities[i] === searchOrigin) { originIndex = i; break; }
            }
            if (originIndex === -1) {
                for (let i = 0; i < routePoints.length; i++) {
                    if (locationsMatch(routePoints[i], searchOrigin) || locationsMatch(routeCities[i], searchOrigin)) { originIndex = i; break; }
                }
            }
        }
        if (searchDestination && originIndex !== -1) {
            for (let i = originIndex + 1; i < routePoints.length; i++) {
                if (routePoints[i] === searchDestination || routeCities[i] === searchDestination) { destIndex = i; break; }
            }
            if (destIndex === -1) {
                for (let i = originIndex + 1; i < routePoints.length; i++) {
                    if (locationsMatch(routePoints[i], searchDestination) || locationsMatch(routeCities[i], searchDestination)) { destIndex = i; break; }
                }
            }
        }
        if (originIndex !== -1 && destIndex !== -1 && originIndex < destIndex) {
            let segmentPrice = 0;
            if (originIndex === 0 && destIndex === routePoints.length - 1) {
                segmentPrice = ride.price;
            } else if (ride.stopoverPrices && ride.stopoverPrices.length > 0) {
                const uniqueCities = [];
                const cityFirstIndex = new Map();
                routeCities.forEach((city, idx) => {
                    if (!cityFirstIndex.has(city)) { cityFirstIndex.set(city, uniqueCities.length); uniqueCities.push(city); }
                });
                const uniqueOriginIndex = cityFirstIndex.get(routeCities[originIndex]);
                const uniqueDestIndex = cityFirstIndex.get(routeCities[destIndex]);
                for (let i = uniqueOriginIndex; i < uniqueDestIndex; i++) {
                    if (ride.stopoverPrices[i] !== undefined) { segmentPrice += ride.stopoverPrices[i]; }
                }
                segmentPrice = Math.max(20, segmentPrice);
                if (segmentPrice === 20) {
                    const segmentRatio = (uniqueDestIndex - uniqueOriginIndex) / (uniqueCities.length - 1);
                    segmentPrice = Math.round((ride.price * segmentRatio) / 10) * 10;
                    segmentPrice = Math.max(20, segmentPrice);
                }
            } else if (ride.pricePerKm && ride.distance) {
                const segmentRatio = (destIndex - originIndex) / (routePoints.length - 1);
                segmentPrice = Math.round((ride.price * segmentRatio) / 10) * 10;
                segmentPrice = Math.max(20, segmentPrice);
            } else {
                const segmentRatio = (destIndex - originIndex) / (routePoints.length - 1);
                segmentPrice = Math.round((ride.price * segmentRatio) / 10) * 10;
                segmentPrice = Math.max(20, segmentPrice);
            }
            const stopsInSegment = [];
            for (let i = originIndex + 1; i < destIndex; i++) {
                const stopoverIndex = i - 1;
                if (ride.stopovers && ride.stopovers[stopoverIndex]) { stopsInSegment.push(ride.stopovers[stopoverIndex]); }
            }
            return {
                origin: extractCityName(routeCities[originIndex]),
                destination: extractCityName(routeCities[destIndex]),
                price: segmentPrice,
                isSegment: true,
                specificOrigin: routePoints[originIndex],
                specificDestination: routePoints[destIndex],
                stopsInRoute: stopsInSegment
            };
        }
        return {
            origin: extractCityName(ride.originCity),
            destination: extractCityName(ride.destinationCity),
            price: ride.price,
            isSegment: false,
            specificOrigin: ride.origin,
            specificDestination: ride.destination,
            stopsInRoute: ride.stopovers || []
        };
    }, [ride, searchOrigin, searchDestination, locationsMatch]);

    const formatTime = (dateTimeString) => {
        return new Date(dateTimeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    };

    const formatDate = (dateTimeString) => {
        const date = new Date(dateTimeString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        today.setHours(0, 0, 0, 0);
        tomorrow.setHours(0, 0, 0, 0);
        const compareDate = new Date(date);
        compareDate.setHours(0, 0, 0, 0);
        if (compareDate.getTime() === today.getTime()) { return 'Today'; }
        else if (compareDate.getTime() === tomorrow.getTime()) { return 'Tomorrow'; }
        else { return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }); }
    };

    const calculateArrivalTime = () => {
        const departureTime = new Date(ride.travelDateTime);
        const durationMs = (ride.duration || 0) * 60000;
        return new Date(departureTime.getTime() + durationMs);
    };

    const formatDuration = (minutes) => {
        if (!minutes || minutes < 1) return 'N/A';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) { return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim(); }
        return `${mins}m`;
    };

    const handleCardClick = () => {
        const params = new URLSearchParams();
        if (segmentDetails.specificOrigin) { params.append('searchOrigin', segmentDetails.specificOrigin); }
        if (segmentDetails.specificDestination) { params.append('searchDestination', segmentDetails.specificDestination); }
        navigate(`/ride/${ride.id}?${params.toString()}`, { state: { searchOrigin: segmentDetails.specificOrigin, searchDestination: segmentDetails.specificDestination } });
    };

    if (!driver) {
        return <div className="simple-ride-card-error">Ride data is incomplete.</div>;
    }

    return (
        // --- Added rideStatus class ---
        <div className={`simple-ride-card status-${rideStatus}`} onClick={handleCardClick}>
        {/* --- END Added --- */}
            <div className="card-grid-container">
                {/* Keep existing time, timeline, location, price elements */}
                <div className="time-start">{formatTime(ride.travelDateTime)}</div>
                <div className="timeline-connector">
                    <div className="timeline-line"></div>
                    <div className="duration-text">{formatDuration(ride.duration)}</div>
                </div>
                <div className="time-end">{formatTime(calculateArrivalTime())}</div>

                <div className="location-start" title={segmentDetails.specificOrigin}>
                    <FiMapPin className="location-icon origin" />
                    <span className="location-text">{segmentDetails.origin}</span>
                </div>

                <div className="location-end" title={segmentDetails.specificDestination}>
                    <FiNavigation className="location-icon destination" />
                    <span className="location-text">{segmentDetails.destination}</span>
                </div>

                <div className="price-container">
                    <span className="price-value">₹{segmentDetails.price ? segmentDetails.price.toFixed(0) : '0'}</span>
                    <span className="price-label">Per Seat</span> {/* Added label */}
                </div>

                <div className="card-divider"></div>

                <div className="driver-container">
                     {/* Keep existing driver details */}
                     <div className="driver-left">
                        <div className="driver-avatar-wrapper">
                            {driver.profilePictureUrl ? (
                                <img src={driver.profilePictureUrl} alt={driver.name} className="driver-avatar" />
                            ) : (
                                <FaUserCircle className="driver-avatar-placeholder" />
                            )}
                        </div>
                        <div className="driver-info-text">
                            <span className="driver-name">{driver.name}</span>
                            <div className="driver-rating">
                                <FaStar className="star-icon" />
                                <span className="rating-value">
                                    {driver.averageRating ? driver.averageRating.toFixed(1) : 'New'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="date-badge">{formatDate(ride.travelDateTime)}</div>
                </div>

                {/* --- Conditional Status Tag --- */}
                <div className="status-container">
                  {rideStatus === 'departed' && (
                      <span className="status-tag departed">
                          <FiClock size={14} /> Departed
                      </span>
                  )}
                  {rideStatus === 'completed' && (
                      <span className="status-tag completed">
                          <FiCheckCircle size={14} /> Completed
                      </span>
                  )}
                  {rideStatus === 'upcoming' && (
                      <div className={`seats-container ${availableSeats <= 2 ? 'low-seats' : ''}`}>
                          <FiUsers className="seats-icon" />
                          <span className="seats-text">{availableSeats} seat{availableSeats !== 1 ? 's' : ''} left</span>
                      </div>
                  )}
                </div>
                 {/* --- END Conditional --- */}

            </div>
        </div>
    );
}

export default SimpleRideCard;