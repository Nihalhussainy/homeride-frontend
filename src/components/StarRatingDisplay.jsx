import React from 'react';
import { FaStar, FaStarHalfAlt } from 'react-icons/fa';

function StarRatingDisplay({ score }) {
  const numericScore = typeof score === 'number' ? score : 0;

  if (!score || numericScore === 0) {
    return null;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
      {[...Array(5)].map((_, index) => {
        const starValue = index + 1;
        
        if (numericScore >= starValue) {
          // Full star
          return <FaStar key={index} color="#ffc107" />;
        } else if (numericScore >= starValue - 0.5) {
          // Half star
          return <FaStarHalfAlt key={index} color="#ffc107" />;
        } else {
          // Empty star
          return <FaStar key={index} color="#6b7280" />;
        }
      })}
    </div>
  );
}

export default StarRatingDisplay;