import * as React from 'react';

type Props = React.SVGProps<SVGSVGElement>;

const Top100TrophyIcon: React.FC<Props> = ({ className, ...props }) => {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* Cup body */}
        <path d="M8 6h8v3.5a4 4 0 0 1-4 4 4 4 0 0 1-4-4V6Z" />

        {/* Left handle */}
        <path d="M9 6H6.8A1.8 1.8 0 0 0 5 7.8v.4A3.2 3.2 0 0 0 8.2 11" />

        {/* Right handle */}
        <path d="M15 6h2.2A1.8 1.8 0 0 1 19 7.8v.4A3.2 3.2 0 0 1 15.8 11" />

        {/* Neck of the trophy */}
        <path d="M10.5 14.5h3" />

        {/* Base */}
        <path d="M10 17h4v1.4a.6.6 0 0 1-.6.6h-2.8a.6.6 0 0 1-.6-.6V17Z" />
      </g>

      {/* Simple "medal" / star-like shape in the centre */}
      <path
        d="m12 9.2 0.7 1.4 1.6.2-1.2 1.1 0.3 1.6L12 13l-1.4.5 0.3-1.6-1.2-1.1 1.6-.2L12 9.2Z"
        fill="currentColor"
      />
    </svg>
  );
};

export default Top100TrophyIcon;
