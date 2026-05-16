import React from 'react';

const COUNTER_GREEN = '#10B981';
const FONT_MONO = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

interface Props {
  gross: number | null | undefined;
  diffStr: string | null;
  isCounter?: boolean;
}

/**
 * Compact frosted GROSS chip pinned to the bottom-right of MiniMedia.
 * Returns null when gross is missing so the photo stands alone.
 */
export const MiniGlass: React.FC<Props> = ({ gross, diffStr: _diffStr, isCounter = false }) => {
  const hasGross = gross !== null && gross !== undefined;
  if (!hasGross) return null;

  return (
    <div
      style={{
        position: 'absolute',
        right: 5,
        bottom: 5,
        padding: '3px 6px',
        borderRadius: 6,
        background: 'rgba(255,255,255,0.10)',
        border: '0.5px solid rgba(255,255,255,0.20)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <span
        style={{
          fontSize: 9,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.65)',
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          marginBottom: 0,
          lineHeight: 1,
        }}
      >
        GROSS
      </span>
      <span aria-label={`Gross score ${gross}${isCounter ? ', counts toward index' : ''}`}>
        {isCounter ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: `1px solid ${COUNTER_GREEN}`,
              fontFamily: FONT_MONO,
              fontSize: 16,
              fontWeight: 400,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {gross as number}
          </span>
        ) : (
          <span
            style={{
              fontFamily: FONT_MONO,
              fontSize: 19,
              fontWeight: 300,
              color: '#FFFFFF',
              letterSpacing: '-0.03em',
              lineHeight: 1,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {gross as number}
          </span>
        )}
      </span>
    </div>
  );
};

export default MiniGlass;
