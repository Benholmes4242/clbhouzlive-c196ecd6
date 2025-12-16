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
  sm: { width: 28, height: 36 },
  md: { width: 32, height: 41 },
  lg: { width: 38, height: 49 },
};

/**
 * Glassy orange pin with white center
 * - Teardrop shape
 * - Orange gradient fill
 * - White inner circle (slightly translucent)
 * - Soft highlight on upper-left (glass effect)
 * - Faint shadow/glow
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
      {/* Drop shadow filter */}
      <defs>
        <filter id="marker-shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.25" />
        </filter>
        
        {/* Orange gradient */}
        <linearGradient id="marker-gradient" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFB347" />
          <stop offset="50%" stopColor="#F7931E" />
          <stop offset="100%" stopColor="#E67E00" />
        </linearGradient>
        
        {/* Glass highlight gradient */}
        <linearGradient id="marker-highlight" x1="8" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.5" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        
        {/* Inner circle gradient */}
        <radialGradient id="inner-circle-gradient" cx="16" cy="13" r="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="100%" stopColor="white" stopOpacity="0.9" />
        </radialGradient>
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
        rx="6"
        ry="5"
        fill="url(#marker-highlight)"
      />
      
      {/* White inner circle */}
      <circle
        cx="16"
        cy="13"
        r="6"
        fill="url(#inner-circle-gradient)"
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
      style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25));"
    >
      <defs>
        <linearGradient id="marker-gradient-${size}" x1="16" y1="0" x2="16" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="#FFB347" />
          <stop offset="50%" stop-color="#F7931E" />
          <stop offset="100%" stop-color="#E67E00" />
        </linearGradient>
        <linearGradient id="marker-highlight-${size}" x1="8" y1="4" x2="20" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="white" stop-opacity="0.5" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="inner-circle-${size}" cx="16" cy="13" r="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0.9" />
        </radialGradient>
      </defs>
      <path
        d="M16 0C7.164 0 0 7.164 0 16c0 8.836 14.4 23.2 15.2 24 0.4 0.4 1.2 0.4 1.6 0 0.8-0.8 15.2-15.164 15.2-24C32 7.164 24.836 0 16 0z"
        fill="url(#marker-gradient-${size})"
      />
      <ellipse cx="11" cy="9" rx="6" ry="5" fill="url(#marker-highlight-${size})" />
      <circle cx="16" cy="13" r="6" fill="url(#inner-circle-${size})" />
    </svg>
  `;
  el.style.cursor = 'pointer';
  
  return el;
}

export default MapMarkerSVG;
