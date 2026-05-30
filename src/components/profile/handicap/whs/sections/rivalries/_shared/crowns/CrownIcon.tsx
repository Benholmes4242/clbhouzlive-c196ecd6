import React from 'react';

interface Props {
  size?: number;
  color?: string;
  filled?: boolean;
}

/** Stylized crown mark ♛ used in the dominance strip. */
export const CrownIcon: React.FC<Props> = ({ size = 10, color = '#FBBC2E', filled = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    aria-hidden
    style={{ display: 'inline-block', verticalAlign: 'middle' }}
  >
    <path
      d="M2 5 L4.5 9 L8 4 L11.5 9 L14 5 L13 12 L3 12 Z"
      fill={filled ? color : 'none'}
      stroke={color}
      strokeWidth={filled ? 0 : 1.2}
      strokeLinejoin="round"
    />
  </svg>
);

export default CrownIcon;
