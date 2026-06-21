import React from 'react';
import {
  FONT,
  TAB,
  BG_1,
  T50,
  T100,
  AMBER,
  LINE,
} from './_shared/tokens';
import type { Insight } from './_shared/insights';

interface Props {
  insights: Insight[];
}

const toneColor: Record<Insight['tone'], string> = {
  positive: AMBER,
  negative: 'var(--hcp-t-60)',
  amber: AMBER,
  neutral: 'var(--hcp-t-60)',
};

export const InsightsGrid: React.FC<Props> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <section style={{ padding: '0 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          margin: '26px 2px 10px',
        }}
      >
        <div
          style={{
            color: '#FFFFFF',
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            fontFamily: FONT,
          }}
        >
          Did you know
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          paddingBottom: 4,
          marginRight: -16,
          paddingRight: 16,
          scrollbarWidth: 'none',
        }}
        className="scrollbar-none"
      >
        {insights.map((insight, i) => {
          const color = toneColor[insight.tone];
          const isLongText = insight.value.length > 8;
          return (
            <div
              key={i}
              style={{
                flexShrink: 0,
                minWidth: 138,
                scrollSnapAlign: 'start',
                background: BG_1,
                border: `0.5px solid ${LINE}`,
                borderRadius: 14,
                padding: '12px 14px',
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  color: T50,
                  fontSize: 9,
                  fontWeight: 800,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                }}
              >
                {insight.label}
              </div>
              <div
                style={{
                  marginTop: 6,
                  color,
                  fontSize: isLongText ? 14 : 19,
                  fontWeight: 800,
                  lineHeight: 1.1,
                  ...TAB,
                }}
              >
                {insight.value}
              </div>
              <div
                style={{
                  marginTop: 2,
                  color: T50,
                  fontSize: 10.5,
                  fontWeight: 500,
                }}
              >
                {insight.sub}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
