import React from 'react';
import { PulseCard } from './PulseCard';
import { PulseEmpty } from './PulseEmpty';
import { usePulseFriends } from '@/hooks/gam/usePulseFriends';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  userId: string;
  onOpenSearch: () => void;
}

const SectionHeader: React.FC<{ count: number | null }> = ({ count }) => (
  <div
    style={{
      padding: '0 20px',
      display: 'flex',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      fontFamily: FONT,
      marginBottom: 10,
    }}
  >
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
      <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--hcp-t-100)' }}>Pulse</span>
      {count != null && (
        <span style={{ fontSize: 12, color: 'var(--hcp-t-60)', fontVariantNumeric: 'tabular-nums' }}>
          ({count})
        </span>
      )}
    </div>
  </div>
);

export const PulseRail: React.FC<Props> = ({ userId, onOpenSearch }) => {
  const { data: friends = [], isLoading } = usePulseFriends(userId);

  if (isLoading) {
    return (
      <div style={{ marginTop: 18 }}>
        <SectionHeader count={null} />
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '0 20px 4px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 132,
                height: 205,
                flexShrink: 0,
                background: 'var(--hcp-bg-1)',
                border: '1px solid var(--hcp-line)',
                borderRadius: 13,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (friends.length === 0) {
    return <PulseEmpty onOpenSearch={onOpenSearch} />;
  }

  return (
    <div style={{ marginTop: 18 }}>
      <SectionHeader count={friends.length} />
      <div
        style={{
          fontFamily: FONT,
          fontSize: 11,
          color: 'var(--hcp-t-60)',
          padding: '0 20px',
          marginBottom: 10,
        }}
      >
        Friends who've played recently
      </div>
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '0 20px 4px',
        }}
      >
        {friends.map((f) => (
          <PulseCard key={f.user_id} friend={f} />
        ))}
      </div>
    </div>
  );
};

export default PulseRail;
