import React from 'react';

/** Amateur standings mark. Its 2.6 SVG corner is intrinsic icon geometry. */
const LeaderboardMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.9"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <rect x="3.2" y="4.4" width="17.6" height="15.2" rx="2.6" />
    <path d="M7 9.2h6.4M7 12.6h9M7 16h4.4" />
  </svg>
);

export default LeaderboardMarkIcon;