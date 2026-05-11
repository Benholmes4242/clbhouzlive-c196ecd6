import React from 'react';

interface Props {
  accent: string;
}

/**
 * Seamlessly-tiling animated wind. Wavy line whose Y at x=0 equals its Y at
 * x=tileW, so when the pattern wraps the line is continuous.
 */
export const WindPattern: React.FC<Props> = ({ accent }) => {
  const tileH = 35;
  const tileW = 200;
  const id = `wind-pattern-${accent.replace('#', '')}`;

  return (
    <svg
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 1,
      }}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden
    >
      <defs>
        <pattern
          id={id}
          x="0"
          y="0"
          width={tileW}
          height={tileH}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M 0 ${tileH / 2} Q ${tileW / 4} ${tileH / 2 - 4} ${tileW / 2} ${tileH / 2} T ${tileW} ${tileH / 2}`}
            stroke={accent}
            strokeWidth={1.5}
            opacity={0.24}
            fill="none"
            strokeLinecap="round"
          />
          <animateTransform
            attributeName="patternTransform"
            type="translate"
            from="0 0"
            to={`${tileW} 0`}
            dur="5s"
            repeatCount="indefinite"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

export default WindPattern;
