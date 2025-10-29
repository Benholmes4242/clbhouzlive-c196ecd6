import React from "react";
import "./NearbyGolfersSquircle.css";
import radarIcon from "@/assets/radar-icon-gold.png";

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
      <img 
        src={radarIcon} 
        alt=""
        className="radar-icon"
        aria-hidden="true"
      />
    </div>
  );
}
