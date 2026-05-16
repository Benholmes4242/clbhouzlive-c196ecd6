import React, { useState } from 'react';
import { useFriendsActivity } from '@/lib/whs/hooks';

import Paged8 from '../_shared/Paged8';
import FriendRoundCard from './FriendRoundCard';
import RoundDetailSheet from '../round-detail/RoundDetailSheet';
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px 8px',
          fontFamily: '"Geist", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            color: 'var(--hcp-t-100)',
            textTransform: 'uppercase',
          }}
        >
          Friends' Rounds
        </div>
        {!isLoading && items.length > 0 && (
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              color: 'var(--hcp-t-60)',
              textTransform: 'uppercase',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            Last fortnight · {items.length} {items.length === 1 ? 'round' : 'rounds'}
          </span>
        )}
      </div>
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
        variant="friend"
        activity={sheetActivity}
        open={!!sheetActivity}
        onClose={() => setSheetActivity(null)}
      />
    </section>
  );
};

export default RecentlyPlayedFeed;
