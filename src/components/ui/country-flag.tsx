
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
    lg: 'w-8 h-6'
  };

  // Using flag emoji as fallback if react-flag-kit doesn't work
  const flagEmojis: Record<string, string> = {
    'US': '🇺🇸',
    'GB': '🇬🇧',
    'IE': '🇮🇪',
    'FR': '🇫🇷',
    'DE': '🇩🇪',
    'ES': '🇪🇸',
    'IT': '🇮🇹',
    'PT': '🇵🇹',
    'NL': '🇳🇱',
    'BE': '🇧🇪',
    'CH': '🇨🇭',
    'AT': '🇦🇹',
    'DK': '🇩🇰',
    'SE': '🇸🇪',
    'NO': '🇳🇴',
    'FI': '🇫🇮',
    'AU': '🇦🇺',
    'NZ': '🇳🇿',
    'ZA': '🇿🇦',
    'JP': '🇯🇵',
    'CA': '🇨🇦',
    'MX': '🇲🇽',
    'BR': '🇧🇷',
    'AR': '🇦🇷',
    'CL': '🇨🇱',
    'EU': '🇪🇺'
  };

  return (
    <span 
      className={`inline-block ${sizeClasses[size]} ${className}`}
      title={country}
    >
      {flagEmojis[flagCode] || '🏳️'}
    </span>
  );
};

export default CountryFlag;
