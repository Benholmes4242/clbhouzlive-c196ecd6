import React from 'react';

/**
 * Editorial section header for the stratified My Ratings list.
 * Inset within the page's 16px side padding (not full-bleed).
 */

const FONT_SANS =
  '"Geist", -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif';

const AMBER = '#F7931E';
const AMBER_DEEP = '#C97211';
const INK_TERTIARY = '#94A3B8';
const HAIRLINE = '#E2E8F0';

interface MyRatingsTierDividerProps {
  tierName: string;
  count: number;
  isFirst: boolean;
}

const MyRatingsTierDivider: React.FC<MyRatingsTierDividerProps> = ({
  tierName,
  count,
  isFirst,
}) => {
  return (
    <div
      style={{
        margin: isFirst ? '6px 16px 12px' : '24px 16px 12px',
        fontFamily: FONT_SANS,
      }}
    >
      <div style={{ padding: '0 2px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                width: 3,
                height: 13,
                background: AMBER,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                color: AMBER_DEEP,
                letterSpacing: '0.18em',
              }}
            >
              {tierName}
            </span>
          </div>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              color: INK_TERTIARY,
              letterSpacing: '0.12em',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {count}
          </span>
        </div>
        <div
          style={{
            height: 1,
            background: HAIRLINE,
            marginTop: 10,
          }}
        />
      </div>
    </div>
  );
};

export default MyRatingsTierDivider;
