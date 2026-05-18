import React, { useState, useMemo } from 'react';
import { Pencil } from 'lucide-react';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import RivalryCard from './RivalryCard';
import RivalryAddCard from './RivalryAddCard';
import RivalryEditSheet from './RivalryEditSheet';
import { useFriendRivalries, useFriendLeaderboard } from '@/lib/whs/hooks';
import type { FriendRivalryHydrated } from '@/lib/whs/types';
import {
  useRivalryDimension,
  type RivalryDimension,
} from '@/lib/whs/utils/useRivalryDimension';

interface Props {
  userId: string;
}

export const RivalriesSection: React.FC<Props> = ({ userId }) => {
  const { data, isLoading } = useFriendRivalries(userId);
  const { data: leaderboard } = useFriendLeaderboard(userId);
  const selfRow = useMemo(
    () => leaderboard?.find((e) => e.is_self) ?? null,
    [leaderboard],
  );

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
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
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
                border: '1px solid var(--hcp-line-2)',
                borderRadius: 999,
                cursor: 'pointer',
                color: 'var(--hcp-t-80)',
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
                background: 'var(--hcp-bg-3)',
              }}
            />
          ))
        ) : !hasAnyH2HData ? (
          <RivalryAddCard
            slotIndex={0}
            label="Add a rival"
            onClick={() => setEditTarget({ rivalry: null, slotIndex: 0 })}
          />
        ) : (
          <>
            {filledRivalries.map((rivalry) => (
              <RivalryCard
                key={`slot-${rivalry.slot_index}`}
                rivalry={rivalry}
                userName={selfRow?.friend_name ?? null}
                userThumbnailUrl={selfRow?.friend_thumbnail_url ?? null}
                userHandicap={selfRow?.friend_handicap_index ?? null}
                onInfo={() => { /* deprecated: card-tap routes to /handicap/rivalry/:rivalUserId */ }}
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

