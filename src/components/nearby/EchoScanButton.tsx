import React from "react";
import "./EchoScanButton.css";

interface EchoScanButtonProps {
  onClick?: () => void;
  ariaLabel?: string;
}

export default function EchoScanButton({ 
  onClick, 
  ariaLabel = "Find nearby golfers and games" 
}: EchoScanButtonProps) {
  return (
    <div 
      className="echo-scan-button"
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
      {/* Scan rings */}
      <div className="scan-ring scan-ring-1" aria-hidden="true" />
      <div className="scan-ring scan-ring-2" aria-hidden="true" />
      <div className="scan-ring scan-ring-3" aria-hidden="true" />
      
      {/* Radar icon */}
      <svg
        className="icon-radar"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Radar dish/antenna */}
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
        {/* Scanning beam */}
        <path d="M12 2 L12 12 L20 8" />
      </svg>
    </div>
  );
}
