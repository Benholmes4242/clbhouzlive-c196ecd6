import React from 'react';

const PulseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...props}
    >
      <path d="M232,128a8,8,0,0,1-8,8H181.89l-26.79,61.35a12,12,0,0,1-22,0L86,78.63,63.11,131.2A8,8,0,0,1,55.78,136H32a8,8,0,0,1,0-16H50.55L80.89,50.28a12,12,0,0,1,22,0L150,189.37l22.89-52.57a8,8,0,0,1,7.33-4.8H224A8,8,0,0,1,232,128Z" />
    </svg>
  );
};

export default PulseIcon;
