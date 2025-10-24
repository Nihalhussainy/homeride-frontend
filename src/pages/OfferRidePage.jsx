import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button.jsx';
import AutocompleteInput from '../components/AutocompleteInput.jsx';
import Input from '../components/Input.jsx';
import { useNotification } from '../context/NotificationContext.jsx';
import axios from 'axios';
import { FiPlus, FiMinus, FiArrowRight, FiSend, FiShield, FiMessageSquare, FiMinusCircle, FiX, FiChevronLeft, FiChevronRight, FiChevronDown } from 'react-icons/fi';
import { getTotalPriceRange, getSegmentPriceRange } from '../utils/pricingCalculations.js';
import './OfferRidePage.css';

const TOTAL_STEPS = 9;

// Custom Dropdown Component
const CustomDropdown = ({ 
  value, 
  onChange, 
  options,
  placeholder = "Select an option",
  label,
  icon: Icon
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => opt.value === value);
  const selectedLabel = selectedOption?.label || placeholder;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      {label && (
        <label style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '0.9rem',
          fontWeight: '600',
          color: 'var(--text-secondary)',
          marginBottom: '10px',
          paddingLeft: '4px',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          transition: 'color 0.3s ease',
        }}>
          {Icon && <Icon style={{ color: '#3b82f6' }} size={18} />}
          {label}
        </label>
      )}

      <div ref={dropdownRef} style={{ position: 'relative' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            width: '100%',
            padding: '14px 16px',
            background: 'rgba(34, 34, 34, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            color: 'var(--text-primary)',
            fontSize: '1rem',
            fontFamily: 'inherit',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            textAlign: 'left',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
            e.currentTarget.style.background = 'rgba(34, 34, 34, 0.8)';
          }}
          onMouseLeave={(e) => {
            if (!isOpen) {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.background = 'rgba(34, 34, 34, 0.6)';
            }
          }}
        >
          <span>{selectedLabel}</span>
          <FiChevronDown 
            size={20} 
            style={{
              transition: 'transform 0.3s ease',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              color: '#3b82f6',
              flexShrink: 0
            }}
          />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              marginTop: '8px',
              background: 'rgba(17, 17, 17, 0.95)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '14px',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              zIndex: 1000,
              animation: 'slideDown 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <style>{`
              @keyframes slideDown {
                from {
                  opacity: 0;
                  transform: translateY(-10px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
            {options.map((option, idx) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                type="button"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: value === option.value 
                    ? 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)'
                    : 'transparent',
                  border: 'none',
                  color: value === option.value ? '#fff' : 'var(--text-primary)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s ease',
                  borderBottom: idx < options.length - 1 ? '1px solid rgba(255, 255, 255, 0.08)' : 'none',
                  fontWeight: value === option.value ? '600' : '400',
                }}
                onMouseEnter={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (value !== option.value) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const CustomDatePicker = ({ value, onChange, minDate }) => {
    const [currentDate, setCurrentDate] = useState(() => {
        if (value) {
            const parts = value.split('-');
            return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
        }
        const min = minDate ? new Date(minDate) : new Date();
        return new Date(min.getFullYear(), min.getMonth(), 1);
    });

    useEffect(() => {
        if (value) {
            const parts = value.split('-');
            const valueDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
            if (valueDate.getFullYear() !== currentDate.getFullYear() || valueDate.getMonth() !== currentDate.getMonth()) {
                setCurrentDate(valueDate);
            }
        }
    }, [value]);

    const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const getDaysArray = () => {
        const days = [];
        const firstDay = firstDayOfMonth(currentDate);
        const days_count = daysInMonth(currentDate);
        for (let i = 0; i < firstDay; i++) {
            days.push(null);
        }
        for (let i = 1; i <= days_count; i++) {
            days.push(i);
        }
        return days;
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDayClick = (day) => {
        if (day) {
            const year = currentDate.getFullYear();
            const month = currentDate.getMonth();
            const selectedDate = new Date(year, month, day);
            const minDateTime = minDate ? new Date(minDate) : new Date();
            minDateTime.setHours(0, 0, 0, 0);
            selectedDate.setHours(0, 0, 0, 0);
            if (selectedDate >= minDateTime) {
                const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                onChange(dateString);
            }
        }
    };

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const days = getDaysArray();

    const selectedDate = value ? (() => {
        const parts = value.split('-');
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    })() : null;

    const minDay = minDate ? new Date(minDate) : new Date();
    minDay.setHours(0, 0, 0, 0);

    const isPrevDisabled = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) <= new Date(minDay.getFullYear(), minDay.getMonth(), 1);

    return (
        <div className="custom-date-picker-container">
            <div className="calendar-header">
                <button className="calendar-nav-btn" onClick={handlePrevMonth} type="button" disabled={isPrevDisabled}>
                    <FiChevronLeft />
                </button>
                <div className="calendar-month-year">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </div>
                <button className="calendar-nav-btn" onClick={handleNextMonth} type="button">
                    <FiChevronRight />
                </button>
            </div>
            <div className="calendar-weekdays">
                {weekDays.map((day, index) => <div key={index} className="weekday">{day}</div>)}
            </div>
            <div className="calendar-days">
                {days.map((day, idx) => {
                    if (!day) {
                        return <div key={idx} className="calendar-day empty"></div>;
                    }
                    const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    currentDayDate.setHours(0, 0, 0, 0);
                    const isDisabled = currentDayDate < minDay;
                    const isSelected = selectedDate && currentDayDate.getDate() === selectedDate.getDate() && currentDayDate.getMonth() === selectedDate.getMonth() && currentDayDate.getFullYear() === selectedDate.getFullYear();
                    return (
                        <button
                            key={idx}
                            type="button"
                            className={`calendar-day ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => handleDayClick(day)}
                            disabled={isDisabled}
                        >
                            {day}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const CustomTimePicker = ({ value, onChange }) => {
    const initialHour = value ? parseInt(value.split(':')[0], 10) : 9;
    const initialMinute = value ? parseInt(value.split(':')[1], 10) : 0;
    const [hour, setHour] = useState(initialHour);
    const [minute, setMinute] = useState(initialMinute);

    useEffect(() => {
        if (value) {
            let [h, m] = value.split(':').map(Number);
            if (isNaN(h) || h < 0 || h > 23) h = 9;
            if (isNaN(m) || m < 0 || m > 59) m = 0;
            setHour(h);
            setMinute(m);
        } else {
            setHour(9);
            setMinute(0);
        }
    }, [value]);

    const handleHourUp = () => setHour(prev => (prev + 1) % 24);
    const handleHourDown = () => setHour(prev => (prev - 1 + 24) % 24);
    const handleMinuteUp = () => setMinute(prev => (prev + 1) % 60);
    const handleMinuteDown = () => setMinute(prev => (prev - 1 + 60) % 60);

    useEffect(() => {
        const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        onChange(timeStr);
    }, [hour, minute, onChange]);

    const displayHour = String(hour).padStart(2, '0');
    const displayMinute = String(minute).padStart(2, '0');

    return (
        <div className="custom-time-picker-container">
            <div className="time-picker-display">{displayHour}:{displayMinute}</div>
            <div className="time-picker-inputs">
                <div className="time-input-group">
                    <button className="time-up-btn" onClick={handleHourUp} type="button">
                        <FiPlus />
                    </button>
                    <div className="time-display">{displayHour}</div>
                    <button className="time-down-btn" onClick={handleHourDown} type="button">
                        <FiMinus />
                    </button>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '700', color: 'var(--text-primary)' }}>:</div>
                <div className="time-input-group">
                    <button className="time-up-btn" onClick={handleMinuteUp} type="button">
                        <FiPlus />
                    </button>
                    <div className="time-display">{displayMinute}</div>
                    <button className="time-down-btn" onClick={handleMinuteDown} type="button">
                        <FiMinus />
                    </button>
                </div>
            </div>
        </div>
    );
};

const LocationStep = ({ title, placeholder, value, onChange, onContinue, onBack, searchContext }) => {
    return (
        <div className="step-content">
            <h2>{title}</h2>
            <div className="form-field">
                <label>{placeholder}</label>
                <AutocompleteInput
                    value={value}
                    onInputChange={onChange}
                    onSuggestionSelect={onChange}
                    placeholder={placeholder}
                    searchContext={searchContext}
                />
            </div>
            <div className="form-actions">
                {onBack && <Button onClick={onBack} className="secondary" type="button">Back</Button>}
                <Button onClick={onContinue} disabled={!value || value.trim() === ''} type="button">
                    Continue <FiArrowRight />
                </Button>
            </div>
        </div>
    );
};

function OfferRidePage() {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        originCity: '',
        originPoint: '',
        destinationCity: '',
        destinationPoint: '',
        stops: [],
        travelDate: '',
        travelTime: '09:00',
        vehicleModel: '',
        vehicleCapacity: 2,
        price: 0,
        genderPreference: 'ALL',
        driverNote: '',
        distance: 0,
        duration: 0,
        polyline: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [stopoverPrices, setStopoverPrices] = useState([]);
    const [segmentPriceRanges, setSegmentPriceRanges] = useState([]);
    const [showStopoverModal, setShowStopoverModal] = useState(false);
    const { showNotification } = useNotification();
    const navigate = useNavigate();

    useEffect(() => {
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        setFormData(prev => ({ ...prev, travelDate: dateString }));
    }, []);

    const handleNext = () => setStep(prev => Math.min(TOTAL_STEPS, prev + 1));
    const handleBack = () => setStep(prev => Math.max(1, prev - 1));

    const handleInputChange = (field, value) => {
        if (field === 'price') {
            const { minPrice: totalMin, maxPrice: totalMax } = getTotalPriceRange(formData.distance);
            const newTotalPrice = Math.max(totalMin, Math.min(totalMax, Number(value) || 0));
            setFormData(prev => ({ ...prev, price: newTotalPrice }));
        } else {
            setFormData(prev => ({ ...prev, [field]: value }));
        }
    };

    const fetchRouteInfo = useCallback(async () => {
        if (!formData.originPoint || !formData.destinationPoint) {
            showNotification('Please select both pickup and drop-off locations.', 'error');
            return;
        }
        setIsLoading(true);
        try {
            const params = new URLSearchParams({
                origin: formData.originPoint,
                destination: formData.destinationPoint,
            });
            const validStops = formData.stops.filter(stop => stop.point && stop.point.trim());
            validStops.forEach(stop => params.append('stops', stop.point));

            const response = await axios.get(`http://localhost:8080/api/rides/travel-info?${params.toString()}`);
            const { distanceInKm, durationInMinutes, polyline, segmentDistances } = response.data;

            const numberOfSegments = validStops.length + 1;

            let directDistance = distanceInKm;
            try {
                const directParams = new URLSearchParams({
                    origin: formData.originPoint,
                    destination: formData.destinationPoint,
                });
                const directResponse = await axios.get(
                    `http://localhost:8080/api/rides/travel-info?${directParams.toString()}`
                );
                directDistance = directResponse.data.distanceInKm;
                console.log(`Direct distance (pricing): ${directDistance}km, Actual route: ${distanceInKm}km`);
            } catch (e) {
                console.warn("Could not fetch direct distance, using actual route distance");
                directDistance = distanceInKm;
            }

            const { recommendedPrice: totalRecommended, minPrice: totalMin, maxPrice: totalMax } = getTotalPriceRange(directDistance);

            const calculatedSegmentRanges = [];
            const initialSegmentPrices = [];
            const useSegmentDistances = segmentDistances && segmentDistances.length === numberOfSegments;

            for (let i = 0; i < numberOfSegments; i++) {
                const segmentDist = useSegmentDistances ? segmentDistances[i] : (directDistance / numberOfSegments);
                const range = getSegmentPriceRange(segmentDist);
                calculatedSegmentRanges.push(range);
                initialSegmentPrices.push(range.recommendedPrice);
            }

            setFormData(prev => ({
                ...prev,
                distance: directDistance,
                duration: durationInMinutes,
                polyline: polyline,
                price: totalRecommended
            }));
            setStopoverPrices(initialSegmentPrices);
            setSegmentPriceRanges(calculatedSegmentRanges);

            handleNext();
        } catch (error) {
            console.error('Route info error:', error);
            showNotification(error.response?.data?.message || "Could not calculate route. Please verify locations.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [formData.originPoint, formData.destinationPoint, formData.stops, showNotification]);

    const handleSubmit = async () => {
        const requiredFieldsFilled = formData.originCity && formData.originPoint &&
                                    formData.destinationCity && formData.destinationPoint &&
                                    formData.travelDate && formData.travelTime &&
                                    formData.vehicleModel && formData.vehicleCapacity >= 1;

        if (!requiredFieldsFilled) {
            showNotification('Please go back and ensure all route, date, time, and vehicle details are filled.', 'error');
            if (!formData.originCity) setStep(1);
            else if (!formData.originPoint) setStep(2);
            else if (!formData.destinationCity) setStep(3);
            else if (!formData.destinationPoint) setStep(4);
            else if (!formData.travelDate) setStep(6);
            else if (!formData.travelTime) setStep(7);
            else if (formData.vehicleCapacity < 1 || !formData.vehicleModel) setStep(8);
            else setStep(9);
            return;
        }

        const validStops = formData.stops.filter(stop => stop.point && stop.point.trim() !== '');
        const numberOfSegments = validStops.length + 1;

        const { minPrice: totalMin, maxPrice: totalMax } = getTotalPriceRange(formData.distance);
        if (formData.price < totalMin || formData.price > totalMax) {
            showNotification(`The default total price (₹${formData.price}) is outside the recommended range (₹${totalMin}-₹${totalMax}). Please adjust the slider.`, 'error');
            setStep(9);
            return;
        }

        let segmentPriceError = false;
        let errorSegmentIndex = -1;
        
        if (stopoverPrices.length !== numberOfSegments) {
            showNotification('Stopover price data mismatch. Please re-open and confirm segment prices.', 'error');
            setStep(9);
            setShowStopoverModal(true);
            return;
        }

        for (let i = 0; i < numberOfSegments; i++) {
            const price = Number(stopoverPrices[i]);
            const range = segmentPriceRanges[i];
            if (isNaN(price) || price < range.minPrice || price > range.maxPrice) {
                segmentPriceError = true;
                errorSegmentIndex = i;
                break;
            }
        }

        if (segmentPriceError) {
            const range = segmentPriceRanges[errorSegmentIndex];
            showNotification(`Price for segment ${errorSegmentIndex + 1} (₹${stopoverPrices[errorSegmentIndex]}) is outside its recommended range (₹${range.minPrice}-₹${range.maxPrice}). Please adjust in "Set prices".`, 'error');
            setStep(9);
            setShowStopoverModal(true);
            return;
        }

        const travelDateTime = `${formData.travelDate}T${formData.travelTime}:00`;

        const finalData = {
            originCity: formData.originCity,
            origin: formData.originPoint,
            destinationCity: formData.destinationCity,
            destination: formData.destinationPoint,
            travelDateTime: travelDateTime,
            vehicleModel: formData.vehicleModel.trim(),
            vehicleCapacity: parseInt(formData.vehicleCapacity, 10),
            price: parseFloat(formData.price),
            genderPreference: formData.genderPreference,
            driverNote: formData.driverNote.trim(),
            stops: validStops.map(s => ({ city: s.city, point: s.point })),
            stopoverPrices: stopoverPrices
        };

        setIsLoading(true);
        const token = localStorage.getItem('token');

        try {
            await axios.post('http://localhost:8080/api/rides/offer', finalData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            showNotification('Your ride has been published successfully!', 'success');
            navigate('/dashboard');
        } catch (error) {
            console.error('Submit error:', error);
            const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to publish ride. Please check details and try again.';
            showNotification(errorMessage, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const changeStopPrice = (index, delta) => {
        setStopoverPrices(prev => {
            const copy = [...prev];
            const range = segmentPriceRanges[index];
            if (range && index >= 0 && index < copy.length) {
                const currentPrice = Number(copy[index]) || range.recommendedPrice;
                let newPrice = currentPrice + delta;
                newPrice = Math.max(range.minPrice, Math.min(range.maxPrice, newPrice));
                copy[index] = Math.round(newPrice / 10.0) * 10.0;
            }
            return copy;
        });
    };

    const handleStopPriceChange = (index, value) => {
        const newPriceValue = value === '' ? '' : Number(value);
        setStopoverPrices(prev => {
            const copy = [...prev];
            if (index >= 0 && index < copy.length) {
                copy[index] = newPriceValue;
            }
            return copy;
        });
    };

    const handleStopPriceBlur = (index) => {
        setStopoverPrices(prev => {
            const copy = [...prev];
            const range = segmentPriceRanges[index];
            if (range && index >= 0 && index < copy.length) {
                let currentPrice = Number(copy[index]);
                if (isNaN(currentPrice) || copy[index] === '') {
                    currentPrice = range.recommendedPrice;
                }
                currentPrice = Math.max(range.minPrice, Math.min(range.maxPrice, currentPrice));
                copy[index] = Math.round(currentPrice / 10.0) * 10.0;
            }
            return copy;
        });
    };

    const handlePriceIncrement = () => {
        const { maxPrice } = getTotalPriceRange(formData.distance);
        const currentPrice = Number(formData.price || 0);
        const newPrice = Math.min(maxPrice, currentPrice + 10);
        handleInputChange('price', newPrice);
    };

    const handlePriceDecrement = () => {
        const { minPrice } = getTotalPriceRange(formData.distance);
        const currentPrice = Number(formData.price || 0);
        const newPrice = Math.max(minPrice, currentPrice - 10);
        handleInputChange('price', newPrice);
    };

    const handleSliderChange = (e) => {
        const { minPrice, maxPrice } = getTotalPriceRange(formData.distance);
        let newPrice = parseInt(e.target.value, 10);
        newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));
        handleInputChange('price', newPrice);
    };

    const renderCurrentStep = () => {
        const today = new Date();
        const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

        switch (step) {
            case 1:
            case 3:
                const isOriginCity = step === 1;
                const cityKey = isOriginCity ? 'originCity' : 'destinationCity';
                const cityPlaceholder = isOriginCity ? "Enter origin city" : "Enter destination city";
                const cityTitle = isOriginCity ? "Which city are you leaving from?" : "Which city are you going to?";
                return (
                    <LocationStep
                        title={cityTitle}
                        placeholder={cityPlaceholder}
                        value={formData[cityKey]}
                        onChange={(val) => handleInputChange(cityKey, val)}
                        searchContext={null}
                        onBack={step > 1 ? handleBack : null}
                        onContinue={handleNext}
                    />
                );

            case 2:
            case 4:
                const isOriginPoint = step === 2;
                const pointKey = isOriginPoint ? 'originPoint' : 'destinationPoint';
                const pointTitle = isOriginPoint ? "Where is the exact pickup point?" : "Where is the exact drop-off point?";
                const pointContext = isOriginPoint ? formData.originCity : formData.destinationCity;
                return (
                    <LocationStep
                        title={pointTitle}
                        placeholder="Enter a specific address or landmark"
                        value={formData[pointKey]}
                        onChange={(val) => handleInputChange(pointKey, val)}
                        searchContext={pointContext}
                        onBack={handleBack}
                        onContinue={handleNext}
                    />
                );

            case 5:
                const handleStopChange = (index, field, value) => {
                    const newStops = [...formData.stops];
                    if (!newStops[index]) newStops[index] = { city: '', point: '' };
                    newStops[index][field] = value;
                    handleInputChange('stops', newStops);
                };
                const handleAddStop = () => {
                    handleInputChange('stops', [...formData.stops, { city: '', point: '' }]);
                };
                const handleRemoveStop = (index) => {
                    handleInputChange('stops', formData.stops.filter((_, i) => i !== index));
                };

                return (
                    <div className="step-content">
                        <h2>Add stopovers (Optional)</h2>
                        <p style={{textAlign: 'center', marginTop: '-20px', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                            Add cities or specific points where you can pick up/drop off passengers.
                        </p>
                        {formData.stops.map((stop, index) => (
                            <div key={index} className="stop-input-group" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', border: '1px solid var(--surface-color-light)', padding: '16px', borderRadius: '12px', marginBottom: '16px' }}>
                                <div style={{display: 'flex', alignItems: 'flex-start', gap: '12px'}}>
                                    <div style={{flex: 1}}>
                                        <label style={{display:'block', marginBottom:'8px', fontSize:'0.9rem', color:'var(--text-secondary)'}}>Stop {index + 1} City (Optional)</label>
                                        <AutocompleteInput
                                            placeholder={`e.g., Gudur`}
                                            value={stop.city}
                                            onInputChange={(value) => handleStopChange(index, 'city', value)}
                                            onSuggestionSelect={(value) => handleStopChange(index, 'city', value)}
                                        />
                                        <label style={{display:'block', margin:'12px 0 8px 0', fontSize:'0.9rem', color:'var(--text-secondary)'}}>Specific point in {stop.city || 'this stop'}*</label>
                                        <AutocompleteInput
                                            placeholder={`Address or landmark*`}
                                            value={stop.point}
                                            onInputChange={(value) => handleStopChange(index, 'point', value)}
                                            onSuggestionSelect={(value) => handleStopChange(index, 'point', value)}
                                            searchContext={stop.city}
                                            required
                                        />
                                    </div>
                                    <button type="button" onClick={() => handleRemoveStop(index)} className="remove-stop-btn" style={{marginTop: '28px'}}>
                                        <FiMinusCircle size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={handleAddStop} className="add-stopover-btn">
                            <FiPlus size={16} /> Add another stop
                        </button>
                        <div className="form-actions">
                            <Button onClick={handleBack} className="secondary" type="button">Back</Button>
                            <Button onClick={fetchRouteInfo} disabled={isLoading || !formData.originPoint || !formData.destinationPoint} type="button">
                                {isLoading ? 'Calculating...' : <>Calculate Route & Continue <FiArrowRight /></>}
                            </Button>
                        </div>
                    </div>
                );

            case 6:
                return (
                    <div className="step-content">
                        <h2>When are you going?</h2>
                        <CustomDatePicker
                            value={formData.travelDate}
                            onChange={(date) => handleInputChange('travelDate', date)}
                            minDate={todayString}
                        />
                        <div className="form-actions">
                            <Button onClick={handleBack} className="secondary" type="button">Back</Button>
                            <Button onClick={handleNext} disabled={!formData.travelDate} type="button">
                                Continue <FiArrowRight />
                            </Button>
                        </div>
                    </div>
                );

            case 7:
                return (
                    <div className="step-content">
                        <h2>What time are you leaving?</h2>
                        <CustomTimePicker
                            value={formData.travelTime}
                            onChange={(time) => handleInputChange('travelTime', time)}
                        />
                        <div className="form-actions">
                            <Button onClick={handleBack} className="secondary" type="button">Back</Button>
                            <Button onClick={handleNext} disabled={!formData.travelTime} type="button">
                                Continue <FiArrowRight />
                            </Button>
                        </div>
                    </div>
                );

            case 8:
                return (
                    <div className="step-content">
                        <h2>How many passengers can you take?</h2>
                        <p style={{textAlign: 'center', marginTop: '-20px', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                            Select the number of seats available for passengers (excluding yourself).
                        </p>
                        <div className="passenger-counter-container">
                            <button
                                className="count-btn"
                                onClick={() => handleInputChange('vehicleCapacity', Math.max(1, formData.vehicleCapacity - 1))}
                                disabled={formData.vehicleCapacity <= 1}
                                type="button"
                            >
                                <FiMinus />
                            </button>
                            <div className="count-display">{formData.vehicleCapacity}</div>
                            <button
                                className="count-btn"
                                onClick={() => handleInputChange('vehicleCapacity', Math.min(8, formData.vehicleCapacity + 1))}
                                disabled={formData.vehicleCapacity >= 8}
                                type="button"
                            >
                                <FiPlus />
                            </button>
                        </div>
                        <div className="form-actions">
                            <Button onClick={handleBack} className="secondary" type="button">Back</Button>
                            <Button onClick={handleNext} type="button">Continue <FiArrowRight /></Button>
                        </div>
                    </div>
                );

            case 9:
                const { recommendedPrice: totalRecommended, minPrice: totalMin, maxPrice: totalMax } = getTotalPriceRange(formData.distance);
                const validStopsForModal = formData.stops.filter(s => s.point && s.point.trim());
                const routePointsForModal = [
                    {city: formData.originCity, point: formData.originPoint},
                    ...validStopsForModal,
                    {city: formData.destinationCity, point: formData.destinationPoint}
                ];

                return (
                    <div className="step-content">
                        <h2>Set your price & details</h2>
                        <p style={{textAlign: 'center', marginTop: '-20px', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.9rem'}}>
                            Set a default price for the full journey. You can adjust individual segment prices separately if needed.
                        </p>

                        <div className="price-slider-container">
                            <div className="price-display-box">
                                <span className="price-label">{formData.originCity} → {formData.destinationCity}</span>
                                <span className="price-value">₹{Math.round(Number(formData.price || 0))}</span>
                                <div className="recommendation-pills">
                                    <div className="pill low">Min: ₹{totalMin}</div>
                                    <div className="pill recommended">Recommended: ₹{totalRecommended}</div>
                                    <div className="pill high">Max: ₹{totalMax}</div>
                                </div>
                            </div>
                            <div className="slider-control-group">
                                <button type="button" onClick={handlePriceDecrement} className="control-btn" disabled={Number(formData.price) <= totalMin}>
                                    <FiMinus />
                                </button>
                                <input
                                    type="range"
                                    min={totalMin}
                                    max={totalMax}
                                    step="10"
                                    value={Math.round(Number(formData.price || 0))}
                                    onChange={handleSliderChange}
                                    className="price-slider"
                                />
                                <button type="button" onClick={handlePriceIncrement} className="control-btn" disabled={Number(formData.price) >= totalMax}>
                                    <FiPlus />
                                </button>
                            </div>
                        </div>

                        {validStopsForModal.length > 0 && (
                            <div className="stopover-pricing-row">
                                <button type="button" className="link-button" onClick={() => setShowStopoverModal(true)}>
                                    Add stopover prices ({stopoverPrices.length} segments)
                                </button>
                            </div>
                        )}

                        <div className="form-field">
                            <label>Vehicle Model*</label>
                            <Input
                                type="text"
                                placeholder="e.g., Volkswagen Virtus"
                                value={formData.vehicleModel}
                                onChange={(e) => handleInputChange('vehicleModel', e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-field">
                            <CustomDropdown
                                value={formData.genderPreference}
                                onChange={(val) => handleInputChange('genderPreference', val)}
                                label="PASSENGER PREFERENCE"
                                icon={FiShield}
                                options={[
                                    { value: 'ALL', label: 'All Genders Welcome' },
                                    { value: 'FEMALE_ONLY', label: 'Female Passengers Only' },
                                ]}
                            />
                        </div>

                        <div className="form-field">
                            <label><FiMessageSquare /> Driver's Note (Optional)</label>
                            <textarea
                                className="custom-textarea"
                                placeholder="e.g., Leaving exactly on time. Luggage space for small bags only. Pets not allowed."
                                value={formData.driverNote}
                                onChange={(e) => handleInputChange('driverNote', e.target.value)}
                                rows="3"
                                maxLength={200}
                            />
                            <div style={{textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px'}}>
                                {formData.driverNote.length} / 200
                            </div>
                        </div>

                        <div className="form-actions">
                            <Button onClick={handleBack} className="secondary" type="button">Back</Button>
                            <Button onClick={handleSubmit} disabled={isLoading} type="button">
                                {isLoading ? 'Publishing...' : 'Publish Ride'} <FiSend />
                            </Button>
                        </div>

                        {showStopoverModal && validStopsForModal.length > 0 && (
                            <div className="modal-overlay" onClick={() => setShowStopoverModal(false)}>
                                <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                                    <button className="modal-close" onClick={() => setShowStopoverModal(false)} type="button"><FiX /></button>
                                    <h2>Add stopover prices</h2>
                                    <p style={{fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '-15px', marginBottom: '20px', textAlign: 'center'}}>
                                        Set the price for each segment of your journey.
                                    </p>
                                    <div className="modal-body">
                                        {stopoverPrices.map((price, idx) => {
                                            const startCity = routePointsForModal[idx]?.city || 'Start';
                                            const endCity = routePointsForModal[idx + 1]?.city || 'End';
                                            const range = segmentPriceRanges[idx] || { minPrice: 30, maxPrice: 500, recommendedPrice: 250 };

                                            return (
                                                <div key={idx} className="stop-row">
                                                    <div className="stop-info">
                                                        <div className="stop-names">
                                                            <span>{startCity} <FiArrowRight size={12}/> {endCity}</span>
                                                        </div>
                                                    </div>
                                                    <div className="stop-price-controls">
                                                        <button className="circle-btn" onClick={() => changeStopPrice(idx, -10)} type="button" disabled={Number(price) <= range.minPrice}>
                                                            <FiMinus />
                                                        </button>
                                                        <div className="stop-price-input-wrapper">
                                                            <span>₹</span>
                                                            <input
                                                                type="number"
                                                                className="stop-price-input"
                                                                value={price === '' ? '' : price}
                                                                onChange={(e) => handleStopPriceChange(idx, e.target.value)}
                                                                onBlur={() => handleStopPriceBlur(idx)}
                                                                min={range.minPrice}
                                                                max={range.maxPrice}
                                                                step="10"
                                                            />
                                                        </div>
                                                        <button className="circle-btn" onClick={() => changeStopPrice(idx, 10)} type="button" disabled={Number(price) >= range.maxPrice}>
                                                            <FiPlus />
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <div className="modal-actions">
                                        <Button onClick={() => setShowStopoverModal(false)} type="button">Done</Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="offer-ride-page-container">
            <div className="form-card-container">
                <div className="progress-bar">
                    {[...Array(TOTAL_STEPS)].map((_, i) => (
                        <div key={i} className={`progress-step ${step >= i + 1 ? 'active' : ''}`}></div>
                    ))}
                </div>
                <div className="form-card">
                    {renderCurrentStep()}
                </div>
            </div>
        </div>
    );
}

export default OfferRidePage;