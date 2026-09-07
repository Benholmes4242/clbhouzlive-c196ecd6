import React from 'react';

/**
 * Filled Explore mark — a compass DISC, not a pin.
 *
 * It must not read as a sibling of the Courses MapPin at 23px, so the two
 * differ in silhouette AND in axis: the pin is a teardrop that narrows to a
 * point at the bottom and reads vertically; this is a closed circle of even
 * weight with a DIAGONAL needle knocked out of it. Filled like every other
 * nav glyph (House, MapPin, Trophy) — no stroke, no amber.
 */
const CompassRoseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    {/* Disc with the needle cut out — one path, evenodd, so the mark stays
        solid at 23px and the needle reads as negative space. */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 2.2a9.8 9.8 0 1 0 0 19.6 9.8 9.8 0 0 0 0-19.6Zm4.9 4.9-2.36 5.9a1.6 1.6 0 0 1-.9.9l-5.9 2.36a.62.62 0 0 1-.8-.8l2.36-5.9a1.6 1.6 0 0 1 .9-.9l5.9-2.36a.62.62 0 0 1 .8.8Z"
    />
    {/* The needle's head, so the diagonal has a direction rather than reading
        as an empty wedge. */}
    <path d="M13.05 10.95a1.48 1.48 0 1 1-2.1 2.1 1.48 1.48 0 0 1 2.1-2.1Z" />
  </svg>
);

export default CompassRoseIcon;
