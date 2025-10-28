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
        {/* Magnifying glass lens */}
        <circle cx="11" cy="11" r="6" />
        {/* Outer ring wrapping around magnifying glass (arc with gap for handle) */}
        <path d="M 4.5 15.5 A 10 10 0 1 1 15.5 4.5" />
        {/* Handle extending from the gap */}
        <line x1="15.5" y1="15.5" x2="21" y2="21" />
      </svg>
    </div>
  );
}
