import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiSearch, FiCalendar, FiUsers, FiMapPin, FiPlus, FiMinus, FiRefreshCw, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import SimpleRideCard from "../components/SimpleRideCard";

function Input({ type, placeholder, value, onChange, min, ...props }) {
  return (
    <input
      style={{
        width: '100%',
        padding: '14px 16px',
        background: 'var(--surface-color)',
        border: '1px solid var(--surface-color-light)',
        borderRadius: '12px',
        color: 'var(--text-primary)',
        fontSize: '14px',
        transition: 'all 0.2s ease',
        outline: 'none',
        cursor: 'text',
        height: '50px',  // FIXED HEIGHT
        boxSizing: 'border-box'  // IMPORTANT
      }}
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      min={min}
      onFocus={(e) => {
        e.target.style.borderColor = '#3b82f6';
        e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
      }}
      onBlur={(e) => {
        e.target.style.borderColor = 'var(--surface-color-light)';
        e.target.style.boxShadow = 'none';
      }}
      {...props}
    />
  );
}

const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
    return () => { clearTimeout(handler); };
  }, [value, delay]);
  return debouncedValue;
};

function AutocompleteInput({ value, onChange, placeholder, ...props }) {
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const wrapperRef = useRef(null);
  const debouncedValue = useDebounce(value, 300);

  const fetchSuggestions = async (query) => {
    if (query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await axios.get(`http://localhost:8080/api/places/autocomplete?query=${query}`);
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Error fetching autocomplete suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (debouncedValue && isFocused) {
      fetchSuggestions(debouncedValue);
    } else {
      setSuggestions([]);
    }
  }, [debouncedValue, isFocused]);

  const handleSelect = (suggestion) => {
    onChange(suggestion);
    setSuggestions([]);
    setIsFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={wrapperRef}>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        autoComplete="off"
        {...props}
      />
      {isFocused && value.length > 2 && (
        <ul style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'var(--surface-color)',
          border: '1px solid var(--surface-color-light)',
          borderRadius: '12px',
          maxHeight: '240px',
          overflowY: 'auto',
          zIndex: 1000,
          listStyle: 'none',
          padding: '8px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
          margin: 0
        }}>
          {isSearching ? (
            <li style={{
              padding: '12px 16px',
              color: 'var(--text-secondary)',
              fontStyle: 'italic'
            }}>Searching...</li>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => (
              <li 
                key={index} 
                onMouseDown={() => handleSelect(suggestion)}
                style={{
                  padding: '12px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s',
                  color: 'var(--text-primary)',
                  borderRadius: '8px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                  e.currentTarget.style.transform = 'translateX(4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.transform = 'translateX(0)';
                }}
              >
                <FiMapPin size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
                {suggestion}
              </li>
            ))
          ) : null}
        </ul>
      )}
    </div>
  );
}

function CustomDatePicker({ value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => { document.removeEventListener('mousedown', handleClickOutside); };
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const handleDateSelect = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    onChange(`${year}-${month}-${day}`);
    setIsOpen(false);
  };

  const changeMonth = (delta) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1));
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date) => {
    if (!value) return false;
    const selectedDate = new Date(value);
    return date.toDateString() === selectedDate.toDateString();
  };

  const isPastDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  return (
    <div style={{ position: 'relative', width: '100%' }} ref={wrapperRef}>
      <div
  onClick={() => setIsOpen(!isOpen)}
  style={{
    width: '100%',
    padding: '14px 16px',
    background: 'var(--surface-color)',
    border: '1px solid var(--surface-color-light)',
    borderRadius: '12px',
    color: value ? 'var(--text-primary)' : 'var(--text-secondary)',
    fontSize: '14px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease',
    height: '50px',  // FIXED HEIGHT
    boxSizing: 'border-box'  // IMPORTANT
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.5)';
  }}
  onMouseLeave={(e) => {
    if (!isOpen) e.currentTarget.style.borderColor = 'var(--surface-color-light)';
  }}
>
  <span>{value ? formatDate(value) : 'Select travel date...'}</span>
  <FiCalendar size={18} style={{ color: '#ec4899', opacity: 0.8 }} />
</div>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          background: 'var(--surface-color)',
          border: '1px solid var(--surface-color-light)',
          borderRadius: '12px',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          minWidth: '320px'
        }}>
          {/* Month/Year Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--surface-color-light)'
          }}>
            <button
              onClick={() => changeMonth(-1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <FiChevronLeft size={20} />
            </button>
            <div style={{
              fontWeight: '600',
              fontSize: '15px',
              color: 'var(--text-primary)'
            }}>
              {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </div>
            <button
              onClick={() => changeMonth(1)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <FiChevronRight size={20} />
            </button>
          </div>

          {/* Week Days */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px',
            marginBottom: '8px'
          }}>
            {weekDays.map(day => (
              <div key={day} style={{
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--text-secondary)',
                padding: '8px 0'
              }}>
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '4px'
          }}>
            {days.map((date, index) => {
              if (!date) {
                return <div key={index} />;
              }

              const disabled = isPastDate(date);
              const selected = isSelected(date);
              const today = isToday(date);

              return (
                <button
                  key={index}
                  onClick={() => !disabled && handleDateSelect(date)}
                  disabled={disabled}
                  style={{
                    padding: '10px',
                    border: 'none',
                    borderRadius: '8px',
                    background: selected 
                      ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                      : today
                      ? 'rgba(236, 72, 153, 0.1)'
                      : 'transparent',
                    color: selected 
                      ? 'white'
                      : disabled 
                      ? 'var(--text-secondary)'
                      : 'var(--text-primary)',
                    fontSize: '14px',
                    fontWeight: selected || today ? '600' : '400',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.3 : 1,
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    if (!disabled && !selected) {
                      e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!disabled && !selected) {
                      e.currentTarget.style.background = today ? 'rgba(236, 72, 153, 0.1)' : 'transparent';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {date.getDate()}
                </button>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div style={{
            display: 'flex',
            gap: '8px',
            marginTop: '16px',
            paddingTop: '12px',
            borderTop: '1px solid var(--surface-color-light)'
          }}>
            <button
              onClick={() => {
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                onChange(`${year}-${month}-${day}`);
                setIsOpen(false);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '8px',
                color: '#3b82f6',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
              }}
            >
              Today
            </button>
            <button
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              style={{
                flex: 1,
                padding: '8px 12px',
                background: 'transparent',
                border: '1px solid var(--surface-color-light)',
                borderRadius: '8px',
                color: 'var(--text-primary)',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--surface-color-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [origin, setOrigin] = useState(searchParams.get('origin') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [travelDateTime, setTravelDateTime] = useState(searchParams.get('travelDateTime') || '');
  const [passengerCount, setPassengerCount] = useState(parseInt(searchParams.get('passengerCount')) || 1);
  
  const [rides, setRides] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const resultsRef = useRef(null);

  const fetchData = useCallback(async (params) => {
    setIsLoading(true);
    setSearchPerformed(true);
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await axios.get('http://localhost:8080/api/rides', {
        params: params,
        headers: { Authorization: `Bearer ${token}` },
      });
      setRides(response.data);
    } catch (error) {
      console.error('Failed to fetch search results:', error);
      setRides([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const hasSearchParams = searchParams.get('origin') || searchParams.get('destination');
    if (hasSearchParams) {
      const paramsToFetch = {
        origin: searchParams.get('origin'),
        destination: searchParams.get('destination'),
        travelDateTime: searchParams.get('travelDateTime'),
        passengerCount: searchParams.get('passengerCount')
      };
      fetchData(paramsToFetch);
    }
  }, [searchParams, fetchData]);

  const handleSearch = (event) => {
    event.preventDefault();
    const newParams = { origin, destination, travelDateTime, passengerCount };
    setSearchParams(newParams);
    
    // Scroll to results after a brief delay to allow content to load
    setTimeout(() => {
      if (resultsRef.current) {
        resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 300);
  };

  const handleReset = () => {
    setOrigin('');
    setDestination('');
    setTravelDateTime('');
    setPassengerCount(1);
    setSearchParams({});
    setRides([]);
    setSearchPerformed(false);
  };

  const handlePassengerCountChange = (value) => {
    if (value >= 1 && value <= 8) {
      setPassengerCount(value);
    }
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--surface-color-light)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }} />
          <h3 style={{
            fontSize: '22px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '12px'
          }}>Searching for rides...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Finding the best matches for you</p>
        </div>
      );
    }
    
    if (searchPerformed && rides.length === 0) {
      return (
        <div style={{
          textAlign: 'center',
          padding: '80px 20px'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 30px',
            fontSize: '56px'
          }}>
            🚗
          </div>
          <h3 style={{
            fontSize: '26px',
            fontWeight: '600',
            color: 'var(--text-primary)',
            marginBottom: '16px'
          }}>No rides found for this route</h3>
          <p style={{
            fontSize: '16px',
            color: 'var(--text-secondary)',
            marginBottom: '32px',
            maxWidth: '500px',
            margin: '0 auto 32px',
            lineHeight: '1.7'
          }}>Try adjusting your search criteria or be the first to offer a ride on this route!</p>
          <button
            onClick={() => navigate('/offer-ride')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              border: 'none',
              borderRadius: '12px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 130, 246, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
            }}
          >
            Offer a Ride
          </button>
        </div>
      );
    }
    
   if (rides.length > 0) {
      return (
        <div style={{ animation: 'fadeIn 0.4s ease' }}>
          <div style={{
            marginBottom: '32px',
            paddingBottom: '16px',
            borderBottom: '1px solid var(--surface-color-light)'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '600',
              color: 'var(--text-primary)'
            }}>
              {rides.length} ride{rides.length !== 1 ? 's' : ''} found
            </h2>
            {origin && destination && (
              <p style={{
                fontSize: '14px',
                color: 'var(--text-secondary)',
                marginTop: '8px'
              }}>
                Showing rides from {origin} to {destination}
              </p>
            )}
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {rides.map(ride => (
              <SimpleRideCard 
                key={ride.id} 
                ride={ride}
                searchOrigin={origin}
                searchDestination={destination}
              />
            ))}
          </div>
        </div>
      );
    }
    
    return (
      <div style={{
        textAlign: 'center',
        padding: '80px 20px'
      }}>
        <div style={{
          width: '120px',
          height: '120px',
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 30px',
          fontSize: '56px'
        }}>
          🔍
        </div>
        <h2 style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'var(--text-primary)',
          marginBottom: '16px'
        }}>Ready to find your ride?</h2>
        <p style={{
          fontSize: '16px',
          color: 'var(--text-secondary)',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: '1.7'
        }}>Enter your trip details above to discover available rides offered by your colleagues.</p>
      </div>
    );
  };

  return (
    <div style={{
      minHeight: '100vh',
      padding: '40px 20px 80px',
      background: `
        radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.05) 0%, transparent 50%),
        radial-gradient(circle at 40% 20%, rgba(236, 72, 153, 0.03) 0%, transparent 50%),
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
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 1
      }}>
        {!searchPerformed && (
          <header style={{
            textAlign: 'center',
            marginBottom: '50px'
          }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: '700',
              marginBottom: '12px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              Find Your Perfect Ride
            </h1>
            <p style={{
              fontSize: '16px',
              color: 'var(--text-secondary)',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Connect with colleagues going your way
            </p>
          </header>
        )}

        <div style={{
          background: 'linear-gradient(135deg, var(--surface-color) 0%, rgba(255, 255, 255, 0.02) 100%)',
          border: '1px solid var(--surface-color-light)',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          marginBottom: '40px'
        }}>
          <form onSubmit={handleSearch}>
            <div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '20px',
  alignItems: 'end',  // This aligns all fields at the bottom
  marginBottom: '32px'
}}>
  {/* From Field */}
  <div>
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-primary)'
    }}>
      <FiMapPin style={{ color: '#3b82f6' }} size={18} /> From
    </label>
    <AutocompleteInput
      placeholder="Enter departure location..."
      value={origin}
      onChange={setOrigin}
    />
  </div>

  {/* To Field */}
  <div>
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-primary)'
    }}>
      <FiMapPin style={{ color: '#8b5cf6', transform: 'rotate(180deg)' }} size={18} /> To
    </label>
    <AutocompleteInput
      placeholder="Enter destination..."
      value={destination}
      onChange={setDestination}
    />
  </div>

  {/* Travel Date */}
  <div>
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-primary)'
    }}>
      <FiCalendar style={{ color: '#ec4899' }} size={18} /> Travel Date
    </label>
    <CustomDatePicker
      value={travelDateTime}
      onChange={setTravelDateTime}
    />
  </div>

  {/* Passengers */}
  <div>
    <label style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      marginBottom: '10px',
      fontSize: '14px',
      fontWeight: '600',
      color: 'var(--text-primary)'
    }}>
      <FiUsers style={{ color: '#10b981' }} size={18} /> Passengers
    </label>
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      background: 'var(--surface-color)',
      border: '1px solid var(--surface-color-light)',
      borderRadius: '12px',
      gap: '12px',
      height: '50px',  // FIXED HEIGHT
      boxSizing: 'border-box'  // IMPORTANT
    }}>
      <span style={{
        fontWeight: '500',
        color: 'var(--text-primary)',
        fontSize: '14px',
        flex: 1
      }}>
        {passengerCount} Passenger{passengerCount > 1 ? 's' : ''}
      </span>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <button 
          type="button"
          onClick={() => handlePassengerCountChange(passengerCount - 1)}
          disabled={passengerCount <= 1}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: '1px solid var(--surface-color-light)',
            background: 'var(--surface-color)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: passengerCount <= 1 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: passengerCount <= 1 ? 0.3 : 1
          }}
          onMouseEnter={(e) => {
            if (passengerCount > 1) {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (passengerCount > 1) {
              e.currentTarget.style.background = 'var(--surface-color)';
              e.currentTarget.style.borderColor = 'var(--surface-color-light)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <FiMinus size={14} />
        </button>
        <button 
          type="button"
          onClick={() => handlePassengerCountChange(passengerCount + 1)}
          disabled={passengerCount >= 8}
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: '1px solid var(--surface-color-light)',
            background: 'var(--surface-color)',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: passengerCount >= 8 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: passengerCount >= 8 ? 0.3 : 1
          }}
          onMouseEnter={(e) => {
            if (passengerCount < 8) {
              e.currentTarget.style.background = '#3b82f6';
              e.currentTarget.style.borderColor = '#3b82f6';
              e.currentTarget.style.color = 'white';
              e.currentTarget.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (passengerCount < 8) {
              e.currentTarget.style.background = 'var(--surface-color)';
              e.currentTarget.style.borderColor = 'var(--surface-color-light)';
              e.currentTarget.style.color = 'var(--text-primary)';
              e.currentTarget.style.transform = 'scale(1)';
            }
          }}
        >
          <FiPlus size={14} />
        </button>
      </div>
    </div>
  </div>
</div>

            <div style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 40px',
                  background: isLoading ? 'var(--surface-color-light)' : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 24px rgba(59, 130, 246, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(59, 130, 246, 0.3)';
                  }
                }}
              >
                <FiSearch />
                {isLoading ? 'Searching...' : 'Search Rides'}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                disabled={isLoading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '14px 32px',
                  background: 'transparent',
                  border: '2px solid var(--surface-color-light)',
                  borderRadius: '12px',
                  color: 'var(--text-primary)',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'var(--surface-color-light)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }
                }}
              >
                <FiRefreshCw />
                Reset
              </button>
            </div>
          </form>
        </div>

        <div ref={resultsRef}>
          {renderResults()}
        </div>
      </div>
    </div>
  );
}

export default SearchPage;