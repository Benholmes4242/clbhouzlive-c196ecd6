import React from 'react';
import { Sparkles } from 'lucide-react';
import { useHandicapInsights } from '@/lib/whs/insights/useHandicapInsights';
import { renderBoldMarkdown } from '@/lib/whs/insights/renderBoldMarkdown';

const AMBER = '#F7931E';
const AMBER_06 = 'rgba(247,147,30,0.06)';
const AMBER_14 = 'rgba(247,147,30,0.14)';
const INK = '#0F172A';
const INK_55 = 'rgba(15,23,42,0.55)';
const INK_06 = 'rgba(15,23,42,0.06)';
const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  connectionId: string;
}

export const FriendsEchoSection: React.FC<Props> = ({ connectionId }) => {
  const { data: insights, isLoading } = useHandicapInsights(connectionId);

  if (isLoading && !insights) {
    return (
      <div
        className="animate-pulse"
        style={{
          height: 92,
          background: INK_06,
          borderRadius: 14,
          margin: '0 20px 14px',
        }}
      />
    );
  }

  const narrative = insights?.friend_narrative?.trim();
  if (!narrative) return null;

  return (
    <div
      style={{
        background: AMBER_06,
        border: `1px solid ${AMBER_14}`,
        borderRadius: 14,
        padding: 14,
        margin: '0 20px 14px',
        fontFamily: FONT,
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: AMBER,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Sparkles size={16} color="#fff" strokeWidth={2.25} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 800,
              color: INK_55,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              marginBottom: 6,
              fontFamily: FONT,
            }}
          >
            Echo on your circle
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 14,
              lineHeight: 1.5,
              color: INK,
              fontFamily: FONT,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {renderBoldMarkdown(narrative)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FriendsEchoSection;
