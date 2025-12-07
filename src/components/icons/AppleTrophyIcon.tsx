import React from 'react';

interface AppleTrophyIconProps {
  className?: string;
}

// Apple SF Symbols style trophy icon
const AppleTrophyIcon: React.FC<AppleTrophyIconProps> = ({ className = "h-6 w-6" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Trophy cup */}
      <path d="M6 3h12v6a6 6 0 01-12 0V3z" />
      {/* Left handle */}
      <path d="M6 5H4a2 2 0 00-2 2v1a3 3 0 003 3h1" />
      {/* Right handle */}
      <path d="M18 5h2a2 2 0 012 2v1a3 3 0 01-3 3h-1" />
      {/* Stem */}
      <path d="M12 15v3" />
      {/* Base */}
      <path d="M8 21h8" />
      <path d="M9 18h6" />
    </svg>
  );
};

export default AppleTrophyIcon;
