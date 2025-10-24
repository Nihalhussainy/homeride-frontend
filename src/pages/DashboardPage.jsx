import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import RideCard from '../components/RideCard.jsx';
import '../App.css';
import axios from 'axios';
import { FiCalendar, FiPlusSquare, FiMapPin } from 'react-icons/fi';

function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(null);
  const [upcomingRides, setUpcomingRides] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Helper function to calculate ride completion time (departure + duration)
  const getRideCompletionTime = (ride) => {
    try {
      const departureTime = new Date(ride.travelDateTime).getTime();
      const durationMs = (ride.duration || 0) * 60000;
      return new Date(departureTime + durationMs);
    } catch (error) {
      return new Date();
    }
  };

  // Helper function to check if ride should still be visible
  const shouldShowRide = (ride) => {
    const now = new Date();
    const departureTime = new Date(ride.travelDateTime);
    const completionTime = getRideCompletionTime(ride);
    
    // Show all rides before departure
    if (now < departureTime) return true;
    
    // After completion, show for 24 hours
    const twentyFourHoursAfterCompletion = new Date(completionTime.getTime() + 24 * 60 * 60 * 1000);
    
    // Show if before 24 hours after completion
    return now < twentyFourHoursAfterCompletion;
  };

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    setIsLoading(true);

    try {
      const config = { headers: { 'Authorization': `Bearer ${token}` } };
      
      const [userResponse, myRidesResponse] = await Promise.all([
        axios.get('http://localhost:8080/api/employees/me', config),
        axios.get('http://localhost:8080/api/rides/my-rides', config)
      ]);
      
      setCurrentUser(userResponse.data);

      // Include rides that are upcoming or should still be shown
      const visibleRides = myRidesResponse.data.filter(ride => shouldShowRide(ride));
      
      const now = new Date();
      
      // Separate upcoming and departed/completed rides
      const upcomingRidesList = [];
      const departedRidesList = [];
      
      visibleRides.forEach(ride => {
        const departureTime = new Date(ride.travelDateTime);
        if (now < departureTime) {
          upcomingRidesList.push(ride);
        } else {
          departedRidesList.push(ride);
        }
      });
      
      // Sort upcoming rides in ascending order (soonest first)
      upcomingRidesList.sort((a, b) => new Date(a.travelDateTime) - new Date(b.travelDateTime));
      
      // Sort departed/completed rides in descending order (most recent first)
      departedRidesList.sort((a, b) => new Date(b.travelDateTime) - new Date(a.travelDateTime));
      
      // Combine: upcoming rides first, then departed rides
      const sortedRides = [...upcomingRidesList, ...departedRidesList];

      setUpcomingRides(sortedRides);

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      localStorage.removeItem('token');
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: 'var(--text-secondary)',
        background: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 50%), var(--background-color)'
      }}>
        Loading your dashboard...
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      padding: '60px 20px',
      background: `
        radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.03) 0%, transparent 50%),
        repeating-linear-gradient(
          45deg,
          transparent,
          transparent 60px,
          rgba(255, 255, 255, 0.01) 60px,
          rgba(255, 255, 255, 0.01) 120px
        ),
        var(--background-color)
      `,
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '5%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(40px)',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.06) 0%, transparent 70%)',
        borderRadius: '50%',
        filter: 'blur(50px)',
        animation: 'float 25s ease-in-out infinite reverse',
        pointerEvents: 'none'
      }} />

      <style>
        {`
          @keyframes float {
            0%, 100% {
              transform: translate(0, 0) scale(1);
            }
            33% {
              transform: translate(30px, -30px) scale(1.1);
            }
            66% {
              transform: translate(-20px, 20px) scale(0.9);
            }
          }
        `}
      </style>

      <div style={{
        width: '100%',
        maxWidth: '900px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        <h2 style={{ 
          marginBottom: '40px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          fontSize: '28px',
          fontWeight: '600',
          color: 'var(--text-primary)',
          textShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
          <FiCalendar size={28} /> Your Upcoming Rides
        </h2>
        
        {upcomingRides.length > 0 ? (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '24px',
            alignItems: 'center'
          }}>
            {upcomingRides.map((ride) => (
              <RideCard 
                key={ride.id} 
                ride={ride} 
                currentUser={currentUser} 
                onActionSuccess={fetchData} 
              />
            ))}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--surface-color)',
            padding: '80px 40px',
            borderRadius: '16px',
            textAlign: 'center',
            border: '1px solid var(--surface-color-light)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.02)'
          }}>
            <div style={{
              width: '120px',
              height: '120px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 30px',
              boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)'
            }}>
              <FiCalendar size={50} color="white" />
            </div>
            
            <h3 style={{ 
              fontSize: '26px', 
              fontWeight: '600',
              marginBottom: '16px',
              color: 'var(--text-primary)'
            }}>
              No upcoming rides scheduled
            </h3>
            
            <p style={{ 
              fontSize: '16px',
              color: 'var(--text-secondary)',
              marginBottom: '40px',
              maxWidth: '500px',
              margin: '0 auto 40px',
              lineHeight: '1.7'
            }}>
              Ready for your next trip? You can find a ride offered by a colleague or offer one yourself.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <Link 
                to="/search" 
                className="custom-button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                <FiMapPin size={20} /> Find a Ride
              </Link>
              
              <Link 
                to="/offer-ride" 
                className="custom-button secondary"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  textDecoration: 'none',
                  padding: '12px 28px',
                  fontSize: '15px',
                  fontWeight: '600'
                }}
              >
                <FiPlusSquare size={20} /> Offer a Ride
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DashboardPage;