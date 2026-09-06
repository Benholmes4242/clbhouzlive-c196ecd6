import React from 'react';

/** Filled Amateur standings mark, optically matched to the other 23px nav glyphs. */
const LeaderboardMarkIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.8 4.4h12.4a2.6 2.6 0 0 1 2.6 2.6v10a2.6 2.6 0 0 1-2.6 2.6H5.8A2.6 2.6 0 0 1 3.2 17V7a2.6 2.6 0 0 1 2.6-2.6Zm0 1.5h12.4c.61 0 1.1.49 1.1 1.1v10c0 .61-.49 1.1-1.1 1.1H5.8c-.61 0-1.1-.49-1.1-1.1V7c0-.61.49-1.1 1.1-1.1Z"
    />
    <rect x="7" y="8.4" width="6.4" height="1.6" rx="0.8" />
    <rect x="7" y="11.8" width="9" height="1.6" rx="0.8" />
    <rect x="7" y="15.2" width="4.4" height="1.6" rx="0.8" />
  </svg>
);

export default LeaderboardMarkIcon;