import React from 'react';

interface Props {
  accent: string;
}

/**
 * Seamlessly-tiling animated rain via SVG <pattern>. The pattern translates
 * by exactly one tile height per cycle so the wrap is visually invisible.
 */
export const RainPattern: React.FC<Props> = ({ accent }) => {
  const tileH = 80;
  const tileW = 60;
  const id = `rain-pattern-${accent.replace('#', '')}`;

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
          <line x1="10" y1="0" x2="-4" y2="50" stroke={accent} strokeWidth={1.2} opacity={0.32} strokeLinecap="round" />
          <line x1="28" y1="15" x2="14" y2="65" stroke={accent} strokeWidth={1.2} opacity={0.30} strokeLinecap="round" />
          <line x1="45" y1="30" x2="31" y2="80" stroke={accent} strokeWidth={1.2} opacity={0.34} strokeLinecap="round" />
          <line x1="56" y1="5" x2="42" y2="55" stroke={accent} strokeWidth={1.2} opacity={0.28} strokeLinecap="round" />
          <line x1="18" y1="60" x2="4" y2="110" stroke={accent} strokeWidth={1.2} opacity={0.32} strokeLinecap="round" />
          <line x1="50" y1="-15" x2="36" y2="35" stroke={accent} strokeWidth={1.2} opacity={0.30} strokeLinecap="round" />
          <animateTransform
            attributeName="patternTransform"
            type="translate"
            from="0 0"
            to={`0 ${tileH}`}
            dur="1.2s"
            repeatCount="indefinite"
          />
        </pattern>
      </defs>
      <rect x="0" y="0" width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
};

export default RainPattern;
