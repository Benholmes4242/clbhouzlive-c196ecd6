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
      <div className="heartbeat-pulse" aria-hidden="true" />
      <div className="heartbeat-pulse" aria-hidden="true" style={{ animationDelay: '1s' }} />
      <svg
        className="icon-pin"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 2C8.1 2 5 5.1 5 9c0 5.3 7 13 7 13s7-7.7 7-13c0-3.9-3.1-7-7-7zm0 9.5c-1.4 0-2.5-1.1-2.5-2.5S10.6 6.5 12 6.5 14.5 7.6 14.5 9 13.4 11.5 12 11.5z" />
      </svg>
    </div>
  );
}
