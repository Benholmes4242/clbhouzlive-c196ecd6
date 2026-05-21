import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Trophy,
  Calendar,
  type LucideIcon,
} from 'lucide-react';
import {
  FONT,
  TAB,
  BG_1,
  T100,
  T60,
  T40,
  T80,
  AMBER,
  GREEN,
  RED,
  LINE,
} from './_shared/tokens';
import type { Insight } from './_shared/insights';

interface Props {
  insights: Insight[];
}

const toneColor: Record<Insight['tone'], string> = {
  positive: GREEN,
  negative: RED,
  amber: AMBER,
  neutral: T80,
};

function iconFor(label: string): LucideIcon {
  if (label === 'Your best margin') return TrendingUp;
  if (label === 'You play best at') return Trophy;
  if (label === 'Last meeting') return Calendar;
  if (label.endsWith("'s best margin")) return TrendingDown;
  return Sparkles;
}

export const InsightsGrid: React.FC<Props> = ({ insights }) => {
  if (insights.length === 0) return null;

  return (
    <section style={{ padding: '24px 16px 8px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          color: T60,
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontFamily: FONT,
          marginBottom: 12,
        }}
      >
        <Sparkles size={12} strokeWidth={2.4} />
        Did you know
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 8,
        }}
      >
        {insights.map((insight, i) => {
          const Icon = iconFor(insight.label);
          const color = toneColor[insight.tone];
          return (
            <div
              key={i}
              style={{
                padding: 14,
                background: BG_1,
                border: `1px solid ${LINE}`,
                borderRadius: 12,
                fontFamily: FONT,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: T60,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                <Icon size={12} strokeWidth={2.4} color={color} />
                {insight.label}
              </div>
              <div
                style={{
                  marginTop: 6,
                  color,
                  fontSize: 20,
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
                  color: T40,
                  fontSize: 11,
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
