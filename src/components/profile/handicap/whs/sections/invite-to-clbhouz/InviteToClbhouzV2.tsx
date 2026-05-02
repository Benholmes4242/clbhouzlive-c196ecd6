import React, { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useFriendsLeaderboard, useSentInvites } from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import Paged8 from '../_shared/Paged8';
import InviteRow from './InviteRow';
import SentInvitesSheet from './SentInvitesSheet';

interface Props {
  ownerUserId: string;
}

const AMBER = '#F7931E';

export const InviteToClbhouzV2: React.FC<Props> = ({ ownerUserId }) => {
  const { data: friends, isLoading: friendsLoading } = useFriendsLeaderboard(ownerUserId);
  const { data: invites } = useSentInvites();
  const [sheetOpen, setSheetOpen] = useState(false);

  const invitable = useMemo(() => {
    return (friends ?? [])
      .filter((f) => !f.is_clbhouz_user)
      .sort((a, b) => (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99));
  }, [friends]);

  // Map to id-having items for Paged8
  const items = useMemo(
    () => invitable.map((f) => ({ ...f, id: f.friend_row_id })),
    [invitable],
  );

  const sentCount = invites?.length ?? 0;

  return (
    <div style={{ marginTop: 24 }}>
      <SectionHeader
        eyebrow="Bring Your Friends"
        title="Invite to clbhouz"
        sub={
          friendsLoading
            ? 'Loading…'
            : invitable.length === 0
              ? "Everyone's already on clbhouz 🎉"
              : `${invitable.length} of your England Golf friends still missing`
        }
        right={
          <button
            onClick={() => setSheetOpen(true)}
            aria-label="View sent invites"
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: AMBER,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              padding: 0,
            }}
          >
            Sent {sentCount > 0 ? `(${sentCount})` : ''}
            <ChevronRight size={14} />
          </button>
        }
      />
      {invitable.length > 0 && (
        <Paged8
          items={items}
          ariaLabel="Friends to invite"
          renderItem={(item) => <InviteRow friend={item} />}
        />
      )}
      <SentInvitesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
};

export default InviteToClbhouzV2;
