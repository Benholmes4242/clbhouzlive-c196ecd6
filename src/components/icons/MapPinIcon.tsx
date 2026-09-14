import React from 'react';

/**
 * Courses mark — SOLID (Ben, 14 Sep: every nav icon is a filled shape).
 *
 * The icon set's own fill-weight drawing: a solid teardrop with the ring hole
 * knocked out, not the outline glyph flooded. Silhouette still reads vertically
 * and narrows to a point, so it cannot be confused with the Explore disc.
 */
export default function MapPinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      viewBox="0 0 256 256"
      {...props}
    >
      <path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Zm0,56a32,32,0,1,1-32,32A32,32,0,0,1,128,72Z" />
    </svg>
  );
}
