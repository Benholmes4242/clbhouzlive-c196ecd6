import React from 'react';
import { PulseCard } from './PulseCard';
import { PulseEmpty } from './PulseEmpty';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { usePulseFriends } from '@/hooks/gam/usePulseFriends';

interface Props {
  userId: string;
  onOpenSearch: () => void;
  /** Rendered between the section header and the rail, in every state. */
  findRow?: React.ReactNode;
}

export const PulseRail: React.FC<Props> = ({ userId, onOpenSearch, findRow }) => {
  const { data: friends = [], isLoading } = usePulseFriends(userId);

  if (isLoading) {
    return (
      <div style={{ marginTop: 16 }}>
        <SectionHeader surface="dark" role="section" kicker="PULSE" paddingX={16} />
        {findRow}
        <div
          style={{
            display: 'flex',
            gap: 10,
            overflowX: 'auto',
            scrollbarWidth: 'none',
            padding: '12px 16px 4px',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 152,
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
    return (
      <div style={{ marginTop: 16 }}>
        <SectionHeader surface="dark" role="section" kicker="PULSE" paddingX={16} />
        {findRow}
        <PulseEmpty onOpenSearch={onOpenSearch} />
      </div>
    );
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
      {findRow}
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          gap: 10,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '12px 16px 4px',
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
