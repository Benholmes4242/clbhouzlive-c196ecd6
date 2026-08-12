import React from 'react';

const COUNTER_GREEN = '#059669';
const FONT_MONO = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

interface GlassGrossRingProps {
  value: number | string;
  isCounter: boolean;
  /** Font size of the numeral inside the ring. Default 32 (Cinema card glass). */
  numeralSize?: number;
}

/**
 * Counter ring for ON-PHOTO glass tiles (Cinema cards, sheet hero, Friends Yesterday hero).
 * Pill-shaped ring around a white SF Pro numeral, sized for the glass triad.
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
          fontVariantNumeric: 'tabular-nums lining-nums',
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
        fontFamily: FONT_MONO,
        fontSize: numeralSize,
        fontWeight: 300,
        color: '#FFFFFF',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums lining-nums',
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
 * a white SF Pro numeral, sized tighter than the large/medium variants.
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
          fontVariantNumeric: 'tabular-nums lining-nums',
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
        width: 24,
        height: 24,
        borderRadius: '50%',
        border: `1px solid ${COUNTER_GREEN}`,
        fontFamily: FONT_MONO,
        fontSize: 13,
        fontWeight: 400,
        color: '#FFFFFF',
        letterSpacing: '-0.03em',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums lining-nums',
      }}
    >
      {value}
    </span>
  );
};
