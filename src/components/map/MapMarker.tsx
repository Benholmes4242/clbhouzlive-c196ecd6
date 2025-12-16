/**
 * Shared glassy orange map marker SVG
 * Used across all map contexts (Business, Courses, etc.)
 */

import React from 'react';

interface MapMarkerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { width: 22, height: 28 },
  md: { width: 26, height: 33 },
  lg: { width: 32, height: 41 },
};

/**
 * Glassy orange pin - transparent glass style
 * - Teardrop shape
 * - Semi-transparent orange gradient fill
 * - Soft highlight on upper-left (glass effect)
 * - Subtle shadow
 */
export const MapMarkerSVG: React.FC<MapMarkerProps> = ({ 
  size = 'md',
  className = '' 
}) => {
  const { width, height } = SIZES[size];
  
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Subtle drop shadow */}
        <filter id="marker-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.2" />
        </filter>
        
        {/* Semi-transparent orange gradient */}
        <linearGradient id="marker-gradient" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFB347" stopOpacity="0.85" />
          <stop offset="50%" stopColor="#F7931E" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#E67E00" stopOpacity="0.95" />
        </linearGradient>
        
        {/* Glass highlight gradient */}
        <linearGradient id="marker-highlight" x1="8" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* Main teardrop shape */}
      <path
        d="M16 0C7.164 0 0 7.164 0 16c0 8.836 14.4 23.2 15.2 24 0.4 0.4 1.2 0.4 1.6 0 0.8-0.8 15.2-15.164 15.2-24C32 7.164 24.836 0 16 0z"
        fill="url(#marker-gradient)"
        filter="url(#marker-shadow)"
      />
      
      {/* Glass highlight */}
      <ellipse
        cx="11"
        cy="9"
        rx="5"
        ry="4"
        fill="url(#marker-highlight)"
      />
    </svg>
  );
};

/**
 * Create a custom Mapbox marker element using the glassy orange pin
 */
export function createGlassyMarkerElement(size: 'sm' | 'md' | 'lg' = 'md'): HTMLElement {
  const { width, height } = SIZES[size];
  
  const el = document.createElement('div');
  el.innerHTML = `
    <svg
      width="${width}"
      height="${height}"
      viewBox="0 0 32 41"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style="filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2));"
    >
      <defs>
        <linearGradient id="marker-gradient-${size}" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFB347" stop-opacity="0.85" />
          <stop offset="50%" stop-color="#F7931E" stop-opacity="0.9" />
          <stop offset="100%" stop-color="#E67E00" stop-opacity="0.95" />
        </linearGradient>
        <linearGradient id="marker-highlight-${size}" x1="8" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="white" stop-opacity="0.4" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M16 0C7.164 0 0 7.164 0 16c0 8.836 14.4 23.2 15.2 24 0.4 0.4 1.2 0.4 1.6 0 0.8-0.8 15.2-15.164 15.2-24C32 7.164 24.836 0 16 0z"
        fill="url(#marker-gradient-${size})"
      />
      <ellipse cx="11" cy="9" rx="5" ry="4" fill="url(#marker-highlight-${size})" />
    </svg>
  `;
  el.style.cursor = 'pointer';
  
  return el;
}

export default MapMarkerSVG;
