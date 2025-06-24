
import React from 'react';

export const getTourColor = (tour: string) => {
  switch (tour) {
    case 'PGA': return 'bg-blue-500';
    case 'LIV': return 'bg-green-500';
    case 'DP World': return 'bg-gray-500';
    case 'University': return 'bg-red-900';
    default: return 'bg-gray-400';
  }
};

export const getChangeIndicator = (change: number) => {
  if (change > 0) return <span className="text-green-600 text-sm">+{change}</span>;
  if (change < 0) return <span className="text-red-600 text-sm">{change}</span>;
  return <span className="text-gray-400 text-sm">-</span>;
};

export const getTourLogoSize = (tour: string) => {
  switch (tour) {
    case 'PGA':
      return 'h-12 w-auto sm:h-16 sm:w-auto'; // Responsive sizing for mobile
    case 'DP World':
      return 'h-12 w-auto sm:h-16 sm:w-auto'; // Responsive sizing for mobile
    case 'LIV':
      return 'h-8 w-auto sm:h-12 sm:w-auto'; // Smaller on mobile, medium on desktop
    case 'University':
      return 'h-8 w-auto sm:h-12 sm:w-auto'; // Smaller on mobile, medium on desktop
    default:
      return 'h-12 w-auto sm:h-16 sm:w-auto'; // Default responsive sizing
  }
};

export const getTourButtonText = (tour: string) => {
  switch (tour) {
    case 'PGA': return 'PGA';
    case 'LIV': return 'LIV Golf';
    case 'DP World': return 'DP Tour';
    case 'University': return 'US University';
    default: return tour;
  }
};
