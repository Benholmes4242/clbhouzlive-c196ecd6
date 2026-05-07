import React, { useState, useMemo } from 'react';
import { Pencil, Swords } from 'lucide-react';
import SectionHeader from '../SectionHeader';
import RivalryCard from './RivalryCard';
import RivalryAddCard from './RivalryAddCard';
import RivalryInfoSheet from './RivalryInfoSheet';
import RivalryEditSheet from './RivalryEditSheet';
import { useFriendRivalries } from '@/lib/whs/hooks';
import type { FriendRivalryHydrated } from '@/lib/whs/types';

interface Props {
  userId: string;
}

export const RivalriesSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendRivalries(userId);

  const [infoTarget, setInfoTarget] = useState<FriendRivalryHydrated | null>(null);
  const [editTarget, setEditTarget] = useState<{ rivalry: FriendRivalryHydrated | null; slotIndex: number } | null>(null);

  const filledRivalries = useMemo(() => {
    return (data ?? []).slice().sort((a, b) => a.slot_index - b.slot_index);
  }, [data]);

  const nextAvailableSlot = useMemo(() => {
    const used = new Set(filledRivalries.map((r) => r.slot_index));
    for (let i = 0; i < 10; i++) {
      if (!used.has(i)) return i;
    }
    return null;
  }, [filledRivalries]);

  const hasFilled = filledRivalries.length > 0;

  const hasAnyH2HData = useMemo(() => {
    return filledRivalries.some((r) => {
      const sf = r.stableford_record ?? { wins: 0, losses: 0, ties: 0 };
      const gross = r.gross_record ?? { wins: 0, losses: 0, ties: 0 };
      return sf.wins + sf.losses + sf.ties + gross.wins + gross.losses + gross.ties > 0;
    });
  }, [filledRivalries]);

  return (
    <section style={{ padding: '20px 0 24px' }}>
      <SectionHeader
        eyebrow="RIVALRIES"
        title="Your rivals"
        sub={
          isLoading
            ? 'Loading…'
            : !hasAnyH2HData
              ? 'Pick golfers to track head-to-head.'
              : 'Auto-picked from your circle. Pin to lock a slot.'
        }
        right={
          hasFilled && hasAnyH2HData ? (
            <button
              onClick={() => {
                const first = filledRivalries[0];
                setEditTarget({ rivalry: first, slotIndex: first.slot_index });
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid rgba(15,23,42,0.12)',
                borderRadius: 999,
                cursor: 'pointer',
                color: 'rgba(15,23,42,0.78)',
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: '0.14em',
              }}
            >
              <Pencil size={11} strokeWidth={2.4} />
              EDIT
            </button>
          ) : null
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 12,
          paddingTop: 4,
          paddingBottom: 8,
          paddingLeft: 16,
          paddingRight: 16,
          scrollPaddingLeft: 16,
          scrollPaddingRight: 16,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
          scrollbarWidth: 'none',
          boxSizing: 'border-box',
        }}
      >
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                flex: '0 0 auto',
                width: 264,
                height: 220,
                borderRadius: 18,
                background: 'rgba(15,23,42,0.06)',
              }}
            />
          ))
        ) : !hasAnyH2HData ? (
          <RivalryEmptyCard
            onPickRival={() => setEditTarget({ rivalry: null, slotIndex: 0 })}
          />
        ) : (
          <>
            {filledRivalries.map((rivalry) => (
              <RivalryCard
                key={`slot-${rivalry.slot_index}`}
                rivalry={rivalry}
                onInfo={() => setInfoTarget(rivalry)}
              />
            ))}
            {nextAvailableSlot !== null && (
              <RivalryAddCard
                slotIndex={nextAvailableSlot}
                label="Add a rival"
                onClick={() => setEditTarget({ rivalry: null, slotIndex: nextAvailableSlot })}
              />
            )}
          </>
        )}
      </div>

      <RivalryInfoSheet
        rivalry={infoTarget}
        open={!!infoTarget}
        onClose={() => setInfoTarget(null)}
      />
      <RivalryEditSheet
        userId={userId}
        rivalry={editTarget?.rivalry ?? null}
        slotIndex={editTarget?.slotIndex ?? null}
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
      />
    </section>
  );
};

export default RivalriesSection;
