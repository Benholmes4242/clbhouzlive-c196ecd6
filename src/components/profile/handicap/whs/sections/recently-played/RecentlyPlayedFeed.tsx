import React, { useState } from 'react';
import { useFriendsActivity } from '@/lib/whs/hooks';

import Paged8 from '../_shared/Paged8';
import FriendRoundCard from './FriendRoundCard';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import type { WhsFriendActivityWithImage } from '@/lib/whs/types';

interface Props {
  ownerUserId: string;
}

const INK_MUTE = 'var(--hcp-t-60)';

export const RecentlyPlayedFeed: React.FC<Props> = ({ ownerUserId }) => {
  const { data, isLoading } = useFriendsActivity(ownerUserId);
  const [sheetActivity, setSheetActivity] =
    useState<WhsFriendActivityWithImage | null>(null);

  // Each item must satisfy { id: string } for Paged8
  const items = (data ?? []).map((d) => ({
    ...d,
    id: d.friend_row_id,
  }));

  return (
    <section style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="Friends' Rounds"
        right={!isLoading && items.length > 0 ? 'Last fortnight' : undefined}
      />

      {isLoading ? (
        <div style={{ padding: '0 20px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 280,
                background: 'var(--hcp-bg-2)',
                borderRadius: 16,
                marginBottom: 12,
              }}
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p
          style={{
            padding: '0 20px',
            fontSize: 13,
            color: INK_MUTE,
            lineHeight: 1.5,
          }}
        >
          When your friends post rounds in MyEG, they'll show up here.
        </p>
      ) : (
        <Paged8
          items={items}
          ariaLabel="Friends' recent rounds"
          renderItem={(item) => (
            <FriendRoundCard
              activity={item}
              onClick={() => setSheetActivity(item)}
              onInviteClick={() => {
                document
                  .getElementById('invite-to-clbhouz-section')
                  ?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}
        />
      )}

      <RoundDetailSheet
        scoreId={sheetActivity?.last_round_score_id ?? null}
        open={!!sheetActivity}
        onClose={() => setSheetActivity(null)}
        handicapDelta={
          sheetActivity?.is_counter &&
          sheetActivity.friend_handicap_index != null &&
          sheetActivity.handicap_index_at_time != null
            ? sheetActivity.friend_handicap_index - sheetActivity.handicap_index_at_time
            : null
        }
      />
    </section>
  );
};

export default RecentlyPlayedFeed;
