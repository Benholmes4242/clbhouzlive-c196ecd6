import React from 'react';
import { PulseCard } from './PulseCard';
import { PulseEmpty } from './PulseEmpty';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { usePulseFriends } from '@/hooks/gam/usePulseFriends';

const FONT = 'Geist, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';

interface Props {
  userId: string;
  onOpenSearch: () => void;
}

export const PulseRail: React.FC<Props> = ({ userId, onOpenSearch }) => {
  const { data: friends = [], isLoading } = usePulseFriends(userId);

  if (isLoading) {
    return (
      <div style={{ marginTop: 16 }}>
        <SectionHeader surface="dark" role="section" kicker="PULSE" paddingX={16} />
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '0 16px 4px',
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
    <div style={{ marginTop: 16 }}>
      <SectionHeader
        surface="dark"
        role="section"
        kicker="PULSE"
        paddingX={16}
        count={friends.length}
        sub="Friends who've played recently"
      />
      <div
        style={{
          display: 'flex',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '0 16px 4px',
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
