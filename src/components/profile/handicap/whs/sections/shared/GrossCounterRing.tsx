import React from 'react';

const COUNTER_GREEN = '#10B981';
const COUNTER_GREEN_GLOW = 'rgba(16,185,129,0.20)';
const FONT_MONO = "Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

interface GlassGrossRingProps {
  value: number | string;
  isCounter: boolean;
  /** Font size of the numeral inside the ring. Default 32 (Cinema card glass). */
  numeralSize?: number;
}

/**
 * Counter ring for ON-PHOTO glass tiles (Cinema cards, sheet hero, Friends Yesterday hero).
 * Pill-shaped ring around a white Geist Mono numeral, sized for the glass triad.
 * When isCounter is false, renders plain numeral with no ring (no padding, no glow).
 */
export const GlassGrossRing: React.FC<GlassGrossRingProps> = ({
  value,
  isCounter,
  numeralSize = 32,
}) => {
  const isDash = value === '\u2014';
  if (!isCounter || isDash) {
    return (
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: numeralSize,
          fontWeight: 300,
          color: '#FFFFFF',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
          display: 'inline-block',
        }}
      >
        {value}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: numeralSize + 18,
        height: numeralSize + 18,
        padding: '0 12px',
        borderRadius: 999,
        border: `1.5px solid ${COUNTER_GREEN}`,
        boxShadow: `0 0 0 4px ${COUNTER_GREEN_GLOW}`,
        fontFamily: FONT_MONO,
        fontSize: numeralSize,
        fontWeight: 300,
        color: '#FFFFFF',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
  );
};

interface InkGrossRingProps {
  value: number | string;
  isCounter: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Counter ring for ink-on-light surfaces (trends rows, scorecards-style lists,
 * friend profile sheet rounds list). Circular ring around ink-coloured Geist
 * Mono numeral.
 */
export const InkGrossRing: React.FC<InkGrossRingProps> = ({
  value,
  isCounter,
  size = 'md',
}) => {
  const fontSize = size === 'lg' ? 24 : size === 'md' ? 18 : 15;
  const dim = size === 'lg' ? 48 : size === 'md' ? 36 : 30;
  const isDash = value === '\u2014';

  if (!isCounter || isDash) {
    return (
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize,
          fontWeight: 600,
          color: 'var(--hcp-t-100)',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
        }}
      >
        {value}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: dim,
        height: dim,
        borderRadius: '50%',
        border: `1.5px solid ${COUNTER_GREEN}`,
        boxShadow: `0 0 0 3px ${COUNTER_GREEN_GLOW}`,
        fontFamily: FONT_MONO,
        fontSize,
        fontWeight: 600,
        color: 'var(--hcp-t-100)',
        letterSpacing: '-0.02em',
        fontVariantNumeric: 'tabular-nums',
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {value}
    </span>
  );
};

interface MiniGrossRingProps {
  value: number | string;
  isCounter: boolean;
}

/**
 * Counter ring for Friends-tab 124px mini-glass tiles. Circular ring around
 * a white Geist Mono numeral, sized tighter than the large/medium variants.
 */
export const MiniGrossRing: React.FC<MiniGrossRingProps> = ({ value, isCounter }) => {
  const isDash = value === '\u2014';
  if (!isCounter || isDash) {
    return (
      <span
        style={{
          fontFamily: FONT_MONO,
          fontSize: 16,
          fontWeight: 300,
          color: '#FFFFFF',
          letterSpacing: '-0.03em',
          lineHeight: 1,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    );
  }

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: `1.25px solid ${COUNTER_GREEN}`,
        boxShadow: `0 0 0 2.5px ${COUNTER_GREEN_GLOW}`,
        fontFamily: FONT_MONO,
        fontSize: 18,
        fontWeight: 400,
        color: '#FFFFFF',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
      }}
    >
      {value}
    </span>
  );
};
