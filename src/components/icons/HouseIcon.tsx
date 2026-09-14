import React from 'react';

/**
 * Home mark — SOLID (Ben, 14 Sep: "every icon in the nav is a filled shape").
 *
 * This is the icon set's OWN fill-weight drawing, not the previous outline
 * hand-filled: a hollow glyph flooded in software comes out heavier than a
 * properly drawn solid, and the five marks have to match each other.
 */
const HouseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 256 256"
      fill="currentColor"
      {...props}
    >
      <path d="M224,120v96a8,8,0,0,1-8,8H160a8,8,0,0,1-8-8V164a4,4,0,0,0-4-4H108a4,4,0,0,0-4,4v52a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V120a16,16,0,0,1,4.69-11.31l80-80a16,16,0,0,1,22.62,0l80,80A16,16,0,0,1,224,120Z" />
    </svg>
  );
};

export default HouseIcon;
