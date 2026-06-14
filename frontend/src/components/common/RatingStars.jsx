// src/components/common/RatingStars.jsx
import { FiStar, FiStarHalf } from 'react-icons/fi';

const RatingStars = ({ rating, totalReviews = 0, size = 'md', showCount = false }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const starSizes = {
    sm: 14,
    md: 18,
    lg: 22,
    xl: 28
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center space-x-0.5">
        {/* Full Stars */}
        {[...Array(fullStars)].map((_, i) => (
          <FiStar
            key={`full-${i}`}
            size={starSizes[size]}
            className="text-yellow-400 fill-current"
          />
        ))}
        
        {/* Half Star */}
        {hasHalfStar && (
          <FiStarHalf
            size={starSizes[size]}
            className="text-yellow-400 fill-current"
          />
        )}
        
        {/* Empty Stars */}
        {[...Array(emptyStars)].map((_, i) => (
          <FiStar
            key={`empty-${i}`}
            size={starSizes[size]}
            className="text-gray-300"
          />
        ))}
      </div>
      
      {showCount && totalReviews > 0 && (
        <span className={`text-gray-500 ${sizes[size]} ml-1`}>
          ({totalReviews} review{totalReviews !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
};

export default RatingStars;