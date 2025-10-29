import React from "react";
import "./NearbyGolfersSquircle.css";

interface NearbyGolfersSquircleProps {
  onClick?: () => void;
  ariaLabel?: string;
}

export default function NearbyGolfersSquircle({ 
  onClick, 
  ariaLabel = "View nearby golfers" 
}: NearbyGolfersSquircleProps) {
  return (
    <div 
      className="nearby-golfers-squircle"
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <svg
        viewBox="0 0 100 100"
        className="radar-icon"
        aria-hidden="true"
      >
        <defs>
          {/* Gradient for background */}
          <radialGradient id="radarBg" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#F5F5F5" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#E0E0E0" stopOpacity="0.1" />
          </radialGradient>
          
          {/* Gradient for center dot */}
          <radialGradient id="centerDot" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="50%" stopColor="#F5F5F5" />
            <stop offset="100%" stopColor="#E8E8E8" />
          </radialGradient>
          
          {/* Gradient for sweep */}
          <linearGradient id="sweepGradient" x1="50%" y1="0%" x2="50%" y2="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Background circle */}
        <circle cx="50" cy="50" r="45" fill="url(#radarBg)" />
        
        {/* Concentric circles */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.3" />
        <circle cx="50" cy="50" r="30" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.4" />
        <circle cx="50" cy="50" r="22" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.5" />
        <circle cx="50" cy="50" r="14" fill="none" stroke="#FFFFFF" strokeWidth="0.5" opacity="0.6" />
        
        {/* Radar sweep */}
        <g className="radar-sweep">
          <path
            d="M 50 50 L 50 8 A 42 42 0 0 1 79.7 29.3 Z"
            fill="url(#sweepGradient)"
            opacity="0.5"
          />
        </g>
        
        {/* Center dot with glow */}
        <circle cx="50" cy="50" r="8" fill="url(#centerDot)" filter="url(#glow)" />
        <circle cx="50" cy="50" r="5" fill="#FFFFFF" opacity="0.9" />
        
        {/* Glow filter */}
        <defs>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
    </div>
  );
}
