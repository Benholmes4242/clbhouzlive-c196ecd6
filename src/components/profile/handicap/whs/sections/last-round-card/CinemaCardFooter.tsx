import React from 'react';
import type { FooterCopy } from './lastRoundFooter';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';
const AMBER = '#F7931E';

interface Props {
  copy: FooterCopy | null;
}

export const CinemaCardFooter: React.FC<Props> = ({ copy }) => {
  return (
    <div
      style={{
        padding: '14px 20px 16px',
        background: '#0F172A',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        fontFamily: FONT_GEIST,
      }}
    >
      <div style={{ minWidth: 0, flex: 1 }}>
        {copy && (
          <>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: 'rgba(255,255,255,0.50)',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              {copy.eyebrow}
            </div>
            <div
              style={{
                marginTop: 4,
                fontSize: 13,
                fontWeight: 500,
                color: '#FFFFFF',
                letterSpacing: '-0.005em',
                lineHeight: 1.3,
              }}
            >
              {copy.primary && <>{copy.primary}{copy.accent || copy.beforeAccent ? ' · ' : ''}</>}
              {copy.beforeAccent}
              {copy.accent && <span style={{ color: AMBER }}>{copy.accent}</span>}
            </div>
          </>
        )}
      </div>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 999,
          background: 'rgba(255,255,255,0.08)',
          border: '0.5px solid rgba(255,255,255,0.15)',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.10em',
          color: '#FFFFFF',
          textTransform: 'uppercase',
          pointerEvents: 'none',
          flexShrink: 0,
        }}
      >
        SCORECARD <span style={{ fontSize: 11, opacity: 0.7 }}>{'\u203A'}</span>
      </div>
    </div>
  );
};

export default CinemaCardFooter;
