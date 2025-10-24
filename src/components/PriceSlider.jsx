import React, { useState, useEffect, useMemo } from 'react';
import './PriceSlider.css';
import { FiPlus, FiMinus } from 'react-icons/fi';

const PriceSlider = ({ distance, onPriceChange }) => {
  const [pricePerSeat, setPricePerSeat] = useState(0);

  // Calculate recommended price and price range based on distance
  const { recommendedPrice, minPrice, maxPrice } = useMemo(() => {
    if (!distance || distance <= 0) {
      return { recommendedPrice: 50, minPrice: 10, maxPrice: 100 };
    }
    const calculatedPrice = Math.round((distance * 2.5) / 10) * 10;
    const recommended = Math.max(50, calculatedPrice);
    return {
      recommendedPrice: recommended,
      minPrice: Math.round(recommended * 0.5 / 10) * 10,
      maxPrice: Math.round(recommended * 1.5 / 10) * 10,
    };
  }, [distance]);

  // ðŸ”§ FIXED: Avoid infinite re-render loop
  useEffect(() => {
    if (pricePerSeat !== recommendedPrice) {
      setPricePerSeat(recommendedPrice);
      onPriceChange(recommendedPrice);
    }
  }, [recommendedPrice]); // âœ… removed onPriceChange from dependencies

  const handleSliderChange = (e) => {
    const newPrice = parseInt(e.target.value, 10);
    setPricePerSeat(newPrice);
    onPriceChange(newPrice);
  };

  const handleIncrement = () => {
    const newPrice = Math.min(maxPrice, pricePerSeat + 10);
    setPricePerSeat(newPrice);
    onPriceChange(newPrice);
  };

  const handleDecrement = () => {
    const newPrice = Math.max(minPrice, pricePerSeat - 10);
    setPricePerSeat(newPrice);
    onPriceChange(newPrice);
  };

  return (
    <div className="price-slider-container">
      <div className="price-display-box">
        <span className="price-label">Price per seat</span>
        <span className="price-value">â‚¹{pricePerSeat}</span>
        <div className="recommendation-pills">
          <div className="pill low">â‚¹{minPrice}</div>
          <div className="pill recommended">Recommended: â‚¹{recommendedPrice}</div>
          <div className="pill high">â‚¹{maxPrice}</div>
        </div>
      </div>
      <div className="slider-control-group">
        <button type="button" onClick={handleDecrement} className="control-btn">
          <FiMinus />
        </button>
        <input
          type="range"
          min={minPrice}
          max={maxPrice}
          step="10"
          value={pricePerSeat}
          onChange={handleSliderChange}
          className="price-slider"
        />
        <button type="button" onClick={handleIncrement} className="control-btn">
          <FiPlus />
        </button>
      </div>
    </div>
  );
};

export default PriceSlider;