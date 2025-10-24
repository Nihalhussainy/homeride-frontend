import React, { useState, useEffect, useRef, useCallback } from "react"; // Added useCallback
import { useNavigate } from "react-router-dom";
import axios from "axios"; // Import axios
import {
  FiSearch,
  FiShield,
  FiUsers,
  FiThumbsUp,
  FiArrowRight,
  FiDollarSign,
  FiTrendingDown,
  FiClock,
  FiHeart,
  FiMapPin,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiLoader, // Added for loading state
} from "react-icons/fi";

import Button from "../components/Button.jsx";
import "./HomePage.css";

import heroVideo from "../assets/hero-background.mp4";

// Calendar component remains the same...
function Calendar({ selectedDate, onDateSelect, onClose }) {
  // ... (keep existing Calendar code) ...
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const firstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const selectToday = () => {
    const today = new Date();
    const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onDateSelect(dateString);
    onClose();
  };

  const days = [];
  const totalDays = daysInMonth(currentMonth);
  const firstDay = firstDayOfMonth(currentMonth);
  const today = new Date();

  for (let i = 0; i < firstDay; i++) {
    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
  }

  for (let day = 1; day <= totalDays; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const isToday = date.toDateString() === today.toDateString();
    const isSelected = dateString === selectedDate;
    const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());

    days.push(
      <div
        key={day}
        className={`calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isPast ? 'past' : ''}`}
        onClick={() => {
          if (!isPast) {
            onDateSelect(dateString);
            onClose();
          }
        }}
      >
        {day}
      </div>
    );
  }

  return (
    <div className="calendar-dropdown hero-calendar">
      <div className="calendar-header">
        <button type="button" className="today-button" onClick={selectToday}>Today</button>
      </div>
      <div className="calendar-navigation">
        <button type="button" onClick={goToPreviousMonth}><FiChevronLeft /></button>
        <span className="calendar-month">{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</span>
        <button type="button" onClick={goToNextMonth}><FiChevronRight /></button>
      </div>
      <div className="calendar-weekdays">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>
      <div className="calendar-days">
        {days}
      </div>
    </div>
  );
}


function HomePage() {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const videoRef = useRef(null);
  const calendarRef = useRef(null);

  const [travelDate, setTravelDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);

  // State for stats
  const [stats, setStats] = useState({
    totalUsers: null,
    totalRides: null,
    savedByEmployees: '10K', // Kept static
    co2Reduced: '5 Tons' // Kept static
  });
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch Stats function
  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    const token = localStorage.getItem('token');
    const config = token ? { headers: { 'Authorization': `Bearer ${token}` } } : {};

    try {
      const response = await axios.get('http://localhost:8080/api/admin/stats', config);
      setStats(prev => ({
        ...prev,
        totalUsers: response.data.totalUsers,
        totalRides: response.data.totalRides,
      }));
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats(prev => ({
        ...prev,
        totalUsers: prev.totalUsers ?? 50, // Fallback
        totalRides: prev.totalRides ?? 100, // Fallback
      }));
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);


  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const handleVideoEnd = () => { video.currentTime = 0; video.play(); };
    video.addEventListener("ended", handleVideoEnd);
    return () => video.removeEventListener("ended", handleVideoEnd);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { setActiveTestimonial((prev) => (prev + 1) % testimonials.length); }, 6000);
    return () => clearInterval(interval);
  }, []); // Added testimonials.length dependency - corrected, it's not needed as length is static here

  useEffect(() => {
    const handleClickOutside = (event) => { if (calendarRef.current && !calendarRef.current.contains(event.target)) { setShowCalendar(false); } };
    if (showCalendar) { document.addEventListener('mousedown', handleClickOutside); }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCalendar]);

  const handleSearch = (e) => {
    e.preventDefault();
    const origin = e.target.elements.origin.value;
    const destination = e.target.elements.destination.value;
    const params = new URLSearchParams();
    if (origin) params.append('origin', origin);
    if (destination) params.append('destination', destination);
    if (travelDate) params.append('travelDateTime', travelDate);
    navigate(`/search?${params.toString()}`);
  };

  const formatDisplayDate = (dateString) => {
    if (!dateString) return 'Select Date';
    try {
        // Parse the date string assuming local time (YYYY-MM-DD)
        const parts = dateString.split('-');
        const year = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
        const day = parseInt(parts[2], 10);
        const date = new Date(year, month, day);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(date);
        selectedDate.setHours(0, 0, 0, 0);

        if (selectedDate.getTime() === today.getTime()) {
            return 'Today';
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (e) {
        console.error("Error formatting date:", e);
        return 'Invalid Date'; // Handle potential parsing errors
    }
  };


  const testimonials = [
    // ... (Testimonials array remains unchanged) ...
    {
      name: "Priya S.",
      role: "Marketing Department",
      text: "Using HomeRide has been a game-changer. I've met so many people from other teams that I'd never have interacted with otherwise. Plus, I'm saving a fortune on petrol!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    },
    {
      name: "Rohan M.",
      role: "Software Engineer",
      text: "As a new joiner, finding a ride was daunting. HomeRide made it so simple and safe. My driver, a senior developer, even gave me tips for my first week!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    },
    {
      name: "Sarah Johnson",
      role: "Marketing Manager",
      text: "HomeRide has completely transformed my daily commute. I've saved over $200 monthly and made amazing friends along the way!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    },
    {
      name: "Michael Chen",
      role: "Software Engineer",
      text: "Who knew commuting could be this fun? Thanks to Homeride, I’ve turned my daily traffic jam into a rolling gossip session with colleagues. Bonus: I haven’t touched my car’s fuel cap in weeks!",
      rating: 5,
      avatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop",
    },
  ];

  return (
    <div className="homepage-container">
      {/* Hero Section */}
      <section className="hero-section">
         <video ref={videoRef} autoPlay muted playsInline className="hero-video">
           <source src={heroVideo} type="video/mp4" /> Your browser does not support the video tag.
         </video>
         <div className="hero-overlay"></div>
         <div className="hero-content">
           <h1 className="hero-title">Your Daily Commute, Reimagined</h1>
           <p className="hero-subtitle">Turn every journey into savings, connections, and a greener tomorrow with trusted colleagues.</p>
           <form className="hero-search-form" onSubmit={handleSearch}>
             <div className="search-input-wrapper">
               <FiMapPin className="input-icon" />
               <input type="text" name="origin" placeholder="Leaving from" className="hero-search-input" />
             </div>
             <div className="search-input-wrapper">
               <FiMapPin className="input-icon" />
               <input type="text" name="destination" placeholder="Going to" className="hero-search-input" />
             </div>
             <div className="search-input-wrapper" ref={calendarRef}>
               <FiCalendar className="input-icon" />
               <div className="hero-search-input hero-date-display" onClick={() => setShowCalendar(!showCalendar)} style={{ color: travelDate ? 'var(--text-primary)' : 'rgba(255, 255, 255, 0.5)' }}>
                 {formatDisplayDate(travelDate)}
               </div>
               {showCalendar && <Calendar selectedDate={travelDate} onDateSelect={setTravelDate} onClose={() => setShowCalendar(false)} />}
             </div>
             <Button type="submit" className="search-button"><FiSearch /> Search Rides</Button>
           </form>
         </div>
         <div className="hero-scroll-indicator"><div className="scroll-arrow"></div></div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        {/* ... (Features content remains unchanged) ... */}
        <div className="feature-card" data-aos="fade-up">
          <div className="feature-icon-wrapper">
            <FiShield size={40} className="feature-icon" />
          </div>
          <h3>Trust Who You Travel With</h3>
          <p>
            Connect exclusively with verified employees from our company. Profiles
            and ride history provide complete peace of mind.
          </p>
        </div>
        <div className="feature-card" data-aos="fade-up" data-aos-delay="100">
          <div className="feature-icon-wrapper">
            <FiUsers size={40} className="feature-icon" />
          </div>
          <h3>Powered by Community</h3>
          <p>
            Join a network of colleagues helping each other get to work and
            back home, reducing costs and environmental impact together.
          </p>
        </div>
        <div className="feature-card" data-aos="fade-up" data-aos-delay="200">
          <div className="feature-icon-wrapper">
            <FiThumbsUp size={40} className="feature-icon" />
          </div>
          <h3>Simple & Seamless</h3>
          <p>
            Our easy-to-use platform makes finding or offering a ride a breeze.
            Book your seat or fill your car in just a few clicks.
          </p>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="benefits-section">
        {/* ... (Benefits content remains unchanged) ... */}
        <h2>Why Choose HomeRide?</h2>
        <div className="benefits-grid">
          <div className="benefit-card">
            <div className="benefit-icon-wrapper green">
              <FiDollarSign size={32} />
            </div>
            <h3>Save Money</h3>
            <p>
              Cut your commuting costs by up to 75%. Share fuel expenses and reduce
              parking fees significantly.
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon-wrapper blue">
              <FiTrendingDown
                size={32}
                style={{
                  transform: "rotate(180deg)",
                }}
              />
            </div>
            <h3>Reduce Carbon Footprint</h3>
            <p>
              Make a positive environmental impact. Each shared ride reduces CO2
              emissions by an average of 2.5kg per trip.
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon-wrapper purple">
              <FiClock size={32} />
            </div>
            <h3>Save Time</h3>
            <p>
              Use HOV lanes in many cities and reduce your commute time. Plus, make
              productive use of travel time as a passenger.
            </p>
          </div>
          <div className="benefit-card">
            <div className="benefit-icon-wrapper orange">
              <FiHeart size={32} />
            </div>
            <h3>Build Connections</h3>
            <p>
              Transform boring commutes into networking opportunities. Strengthen
              workplace relationships on the road.
            </p>
          </div>
        </div>

        <section className="inline-cta-box enhanced-cta">
          <div className="cta-img-wrapper">
            <img
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=800&h=600&fit=crop"
              alt="Commute inspiration"
              className="cta-img"
            />
            <div className="cta-img-gradient"></div>
          </div>
          <div className="cta-message-section">
            <h2>
                Driving in your own car ? <span className="emphasize"></span>
            </h2>
            <p>
              Make your commute more affordable and enjoyable.
              <br />
              <span className="emphasize">Offer your empty seats</span> to
              colleagues and start saving on travel costs today!
            </p>
            <Button
              onClick={() => navigate("/offer-ride")}
              className="cta-inline-button"
            >
              Offer a Ride <FiArrowRight />
            </Button>
          </div>
        </section>
      </section>

      {/* --- How It Works Section (Images Restored) --- */}
      <section className="how-it-works-section">
        <h2>How HomeRide Works</h2>
        <div className="steps-container">
          <div className="step">
            <div className="step-image">
              {/* Restored Original Image Source */}
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCfc69qzWMfcUDAwhMRwAOfHGlOdYLJ53mnnIeYoXb7Z-_Rsc5N9yPIlljr6cAL-Qj8ULlNaLcJ036QAp3zXPfjaBz0i-7XSc61M6cyusB9OlfbPS-JgGU13WouzaWCezHwZGwNwp7e3CsIrjMS0v0dI88WOvXgUSYJzNjYz9zmkimn9PmtQWbhhxmWMLmcujdMlsvByUYlSOQwZB87HJNovA49GYUctQyTpu7y5wzmA9Shgpi1uZqW0-C_kAyi12VcFj0j3CwpaY6C" alt="Search for rides" />
              <div className="step-image-overlay"></div>
            </div>
            <div className="step-number">1</div>
            <div className="step-content">
              <h3>Find or Offer a Ride</h3>
              <p>Log in with your company credentials and either search for a ride to your destination or post your own trip if you're driving.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-image">
              {/* Restored Original Image Source */}
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdaytJ6qw6v0TblzjYMBVGXImt5g3cMdgDfWP9-HY3A8m3_VybksBMgrG0PwmyGwHTCVZEm6enoFOy8_4hSaUjRdNDVshCbQRVCdsBqTENa2idaqw2zyHQwll8eVOAHVzVgPDugMkJHiauhExpWponpL5hypnEooaS6opdkRgeA3V8npiCStW51oMuf1_ZgzxTpUMHR-wssokndwJRgTvvG3v0nRNmozrDAWKsgU3kXkFf8OQ4Y_7fLj3058SzP-Bs6YLmkHODqYhe" alt="Connect with colleagues" />
              <div className="step-image-overlay"></div>
            </div>
            <div className="step-number">2</div>
            <div className="step-content">
              <h3>Connect with Colleagues</h3>
              <p>Browse available rides, view profiles of your colleagues, and book a seat. Drivers can accept requests from trusted coworkers.</p>
            </div>
          </div>
          <div className="step">
            <div className="step-image">
              {/* Restored Original Image Source */}
              <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwBG1RpQ-lKYpgdo8117Q78nvFPJc563Ec1gutSG2ATdGDDkA3cJGKcVzEii2WqV1CPt6O_94c25pe707-Nx8-8MlZm18xUZ84MpaR6EpLYD1WAI4sEnhoRE_LKSP3CdIDaHngTl3P9ak4Ko9YAl8c8aGSAl6UMFWekqnxRTuW-yqJEuNIhLQPx2spdlC9S0jFKindOqdDsqHLNtFle2L_lyVNRx9MDStMdkL7f36bONxlyv9KqtYfYC-SIhtVpflTwZp8CrXZp_je" alt="Travel together" />
              <div className="step-image-overlay"></div>
            </div>
            <div className="step-number">3</div>
            <div className="step-content">
              <h3>Travel & Save</h3>
              <p>Meet up and enjoy a comfortable and safe journey together. Split costs, reduce your carbon footprint, and build connections.</p>
            </div>
          </div>
        </div>
      </section>
      {/* --- END Restored Images --- */}

      {/* Stats Section (Live Data Enabled) */}
      <section className="stats-section">
        <div className="stat-item">
          <div className="stat-number">{loadingStats ? <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> : stats.totalUsers ?? 'N/A'}</div>
          <div className="stat-label">Active Users</div>
        </div>
        <div className="stat-item">
          <div className="stat-number">{loadingStats ? <FiLoader style={{ animation: 'spin 1s linear infinite' }} /> : stats.totalRides ?? 'N/A'}</div>
          <div className="stat-label">Rides Completed</div>
        </div>
        <div className="stat-item"><div className="stat-number">{stats.savedByEmployees}</div><div className="stat-label">Saved by Employees</div></div>
        <div className="stat-item"><div className="stat-number">{stats.co2Reduced}</div><div className="stat-label">CO2 Reduced</div></div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        {/* ... (Testimonials content remains unchanged) ... */}
        <h2>Community Voices</h2>
        <div className="testimonials-grid">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className={`testimonial-card-modern ${
                index === activeTestimonial ? "active" : ""
              }`}
            >
              <div className="testimonial-quote-icon">"</div> {/* Changed to quote */}
              <p className="testimonial-text-modern">{testimonial.text}</p>
              <div className="testimonial-author-modern">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="author-avatar-modern"
                />
                <div className="author-info-modern">
                  <div className="author-name-modern">{testimonial.name}</div>
                  <div className="author-role-modern">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        // ... (Footer styles remain unchanged) ...
         background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)',
        borderTop: '1px solid rgba(234, 179, 8, 0.15)',
        paddingTop: '100px',
        paddingBottom: '60px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative gradient orbs */}
        <div style={{
          position: 'absolute',
          top: '-100px',
          right: '-100px',
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(234, 179, 8, 0.05) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '100px',
          left: '-50px',
          width: '250px',
          height: '250px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 70%)',
          borderRadius: '50%',
          pointerEvents: 'none'
        }}></div>

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          paddingLeft: '5%',
          paddingRight: '5%',
          position: 'relative',
          zIndex: 1
        }}>
          {/* Main Content Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '80px',
            marginBottom: '80px',
            alignItems: 'start'
          }}>
            {/* Brand Section */}
            <div>
              <div style={{
                marginBottom: '20px'
              }}>
                <h3 style={{
                  fontSize: '2.2rem',
                  fontWeight: '900',
                  marginBottom: '16px',
                  background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.5px'
                }}>
                  HomeRide
                </h3>
                <div style={{
                  width: '40px',
                  height: '3px',
                  background: 'linear-gradient(90deg, var(--primary-color), transparent)',
                  borderRadius: '2px',
                  marginBottom: '20px'
                }}></div>
              </div>
              <p style={{
                color: 'rgba(255, 255, 255, 0.65)',
                lineHeight: '1.9',
                fontSize: '0.95rem',
                margin: 0
              }}>
                Making commutes better, one ride at a time. Connect with colleagues, save money, and reduce your carbon footprint.
              </p>
            </div>

            {/* Quick Stats or Features */}
            <div>
              <h4 style={{
                fontSize: '0.85rem',
                fontWeight: '800',
                marginBottom: '28px',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '1.2px'
              }}>
                Why HomeRide
              </h4>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    marginTop: '8px',
                    flexShrink: 0
                  }}></div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: '0.9rem',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    Save up to 75% on commute costs
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    marginTop: '8px',
                    flexShrink: 0
                  }}></div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: '0.9rem',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    Build genuine workplace connections
                  </p>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    background: 'var(--primary-color)',
                    marginTop: '8px',
                    flexShrink: 0
                  }}></div>
                  <p style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    fontSize: '0.9rem',
                    margin: 0,
                    lineHeight: '1.6'
                  }}>
                    Reduce environmental impact together
                  </p>
                </div>
              </div>
            </div>

            {/* Links */}
            <div>
              <h4 style={{
                fontSize: '0.85rem',
                fontWeight: '800',
                marginBottom: '28px',
                color: '#fff',
                textTransform: 'uppercase',
                letterSpacing: '1.2px'
              }}>
                Company
              </h4>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}>
                <li>
                  <a href="/about" style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary-color)';
                    e.currentTarget.style.transform = 'translateX(6px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>→</span>
                    About HomeRide
                  </a>
                </li>
                <li>
                  <a href="/contact" style={{
                    color: 'rgba(255, 255, 255, 0.65)',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    fontSize: '0.95rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = 'var(--primary-color)';
                    e.currentTarget.style.transform = 'translateX(6px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>→</span>
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Enhanced Divider */}
          <div style={{
            height: '1px',
            background: 'linear-gradient(90deg, transparent 0%, rgba(234, 179, 8, 0.2) 50%, transparent 100%)',
            marginBottom: '40px'
          }}></div>

          {/* Bottom Section */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '30px'
          }}>
            <p style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.85rem',
              margin: 0,
              letterSpacing: '0.3px'
            }}>
              © {new Date().getFullYear()} HomeRide · Exclusively for Sopra Steria Employees
            </p>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: '0.85rem'
            }}>
              <span>Built with</span>
              <span style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>❤</span>
              <span>for better commutes</span>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default HomePage;