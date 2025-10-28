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
      {/* Search icon - magnifying glass with outer ring */}
      <svg
        className="icon-search"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {/* Outer ring */}
        <circle cx="11" cy="11" r="8" />
        {/* Inner magnifying glass circle */}
        <circle cx="11" cy="11" r="5" />
        {/* Handle */}
        <path d="m21 21-4.35-4.35" />
      </svg>
    </div>
  );
}
