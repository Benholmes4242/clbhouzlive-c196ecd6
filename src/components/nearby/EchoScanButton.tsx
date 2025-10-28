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
      {/* EchoScan icon - unified ring that flows into handle */}
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
        {/* Inner circle (lens) */}
        <circle cx="11" cy="11" r="5" />
        {/* Outer arc that flows into handle - sweeps from bottom-left, around top, to bottom-right */}
        <path d="M 6 16.5 A 8 8 0 1 1 16.5 16" />
        {/* Handle extending from where the arc ends */}
        <line x1="16.5" y1="16" x2="21" y2="20.5" />
      </svg>
    </div>
  );
}
