
import React from 'react';
import { getFlagCode } from '@/utils/countryFlags';

interface CountryFlagProps {
  country: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const CountryFlag: React.FC<CountryFlagProps> = ({ 
  country, 
  size = 'md', 
  className = '' 
}) => {
  const flagCode = getFlagCode(country);
  
  const sizeClasses = {
    sm: 'w-4 h-3',
    md: 'w-6 h-4',
    lg: 'w-9 h-6'
  };

  // Use flag-icons CSS library approach with inline SVG data
  const getFlagImageUrl = (code: string) => {
    // Using flag-icons.css approach - we'll use SVG flags from a CDN
    return `https://flagicons.lipis.dev/flags/4x3/${code.toLowerCase()}.svg`;
  };

  return (
    <img
      src={getFlagImageUrl(flagCode)}
      alt={`${country} flag`}
      className={`inline-block ${sizeClasses[size]} ${className} rounded-sm object-cover`}
      title={country}
      onError={(e) => {
        // Fallback to a default flag if the image fails to load
        const target = e.target as HTMLImageElement;
        target.src = `https://flagicons.lipis.dev/flags/4x3/gb.svg`;
      }}
    />
  );
};

export default CountryFlag;
