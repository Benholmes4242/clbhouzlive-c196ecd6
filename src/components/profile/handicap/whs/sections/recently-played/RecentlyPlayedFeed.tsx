import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useFriendsActivity } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import Paged8 from '../_shared/Paged8';
import FriendRoundCard from './FriendRoundCard';

interface Props {
  ownerUserId: string;
}

const INK_MUTE = 'rgba(15,23,42,0.55)';

export const RecentlyPlayedFeed: React.FC<Props> = ({ ownerUserId }) => {
  const navigate = useNavigate();
  const { data, isLoading } = useFriendsActivity(ownerUserId);

  // Each item must satisfy { id: string } for Paged8
  const items = (data ?? []).map((d) => ({
    ...d,
    id: d.friend_row_id,
  }));

  return (
    <section style={{ padding: '20px 0 24px' }}>
      <SectionHeader
        eyebrow="RECENTLY PLAYED"
        title="Your friends' rounds"
        sub={
          isLoading
            ? 'Loading…'
            : items.length === 0
              ? undefined
              : `${items.length} round${items.length === 1 ? '' : 's'} in the last fortnight`
        }
      />
      {isLoading ? (
        <div style={{ padding: '0 20px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse"
              style={{
                height: 280,
                background: 'rgba(15,23,42,0.04)',
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
              onClick={() => {
                if (item.is_clbhouz_user && item.friend_user_id) {
                  navigate(`/p/${item.friend_user_id}`);
                }
              }}
            />
          )}
        />
      )}
    </section>
  );
};

export default RecentlyPlayedFeed;
