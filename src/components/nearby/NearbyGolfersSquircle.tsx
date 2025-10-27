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
      {/* Proximity pulse ring 1 */}
      <div className="proximity-pulse-ring" aria-hidden="true" />
      
      {/* Proximity pulse ring 2 (staggered) */}
      <div className="proximity-pulse-ring proximity-pulse-ring-delayed" aria-hidden="true" />
      
      {/* Orange glowing pin icon */}
      <svg
        className="icon-pin"
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="#FF9F0A"
        aria-hidden="true"
      >
        <path d="M12 2C8.686 2 6 4.686 6 8c0 4.2 4.8 9.6 5.02 9.84.26.28.7.28.96 0C13.2 17.6 18 12.2 18 8c0-3.314-2.686-6-6-6zm0 8.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z"/>
      </svg>
    </div>
  );
}
