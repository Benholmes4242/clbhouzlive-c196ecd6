import React, { useState, useMemo } from 'react';
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

const SLOT_COUNT = 4;

export const RivalriesSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendRivalries(userId);

  const [infoTarget, setInfoTarget] = useState<FriendRivalryHydrated | null>(null);
  const [editTarget, setEditTarget] = useState<{ rivalry: FriendRivalryHydrated | null; slotIndex: number } | null>(null);

  // Build slot-indexed array of size SLOT_COUNT (auto slots) + 1 add card for pinned overflow
  const slots = useMemo(() => {
    const arr: Array<FriendRivalryHydrated | null> = Array(SLOT_COUNT).fill(null);
    (data ?? []).forEach((r) => {
      if (r.slot_index >= 0 && r.slot_index < SLOT_COUNT) {
        arr[r.slot_index] = r;
      }
    });
    return arr;
  }, [data]);

  return (
    <section style={{ padding: '20px 0 24px' }}>
      <SectionHeader
        eyebrow="RIVALRIES"
        title="Your friendly enemies"
        sub={isLoading ? 'Loading…' : 'Auto-picked from your circle. Pin to lock a slot.'}
      />

      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: '4px 20px 8px',
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          willChange: 'transform',
          scrollbarWidth: 'none',
        }}
      >
        {isLoading
          ? Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse"
                style={{
                  flex: '0 0 auto',
                  width: 264,
                  height: 290,
                  borderRadius: 18,
                  background: 'rgba(15,23,42,0.06)',
                }}
              />
            ))
          : slots.map((rivalry, i) =>
              rivalry ? (
                <RivalryCard
                  key={`slot-${i}`}
                  rivalry={rivalry}
                  onInfo={() => setInfoTarget(rivalry)}
                  onEdit={() => setEditTarget({ rivalry, slotIndex: i })}
                  onTap={() => setInfoTarget(rivalry)}
                />
              ) : (
                <RivalryAddCard
                  key={`slot-${i}`}
                  slotIndex={i}
                  label="Pin a rival"
                  onClick={() => setEditTarget({ rivalry: null, slotIndex: i })}
                />
              ),
            )}
        {!isLoading && (
          <RivalryAddCard
            slotIndex={SLOT_COUNT}
            label="Add a pinned rival"
            onClick={() => setEditTarget({ rivalry: null, slotIndex: SLOT_COUNT })}
          />
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
