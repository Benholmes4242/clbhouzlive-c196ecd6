import React, { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  useFriendLeaderboard,
  useSentInvites,
} from '@/lib/whs/hooks';
import { DarkSectionHeader } from '../_shared/darkAtoms';
import InviteCard from './InviteCard';
import InviteQuestCard from './InviteQuestCard';
import SentInvitesSheet from './SentInvitesSheet';

interface Props {
  ownerUserId: string;
}

const T = {
  ink: 'var(--hcp-t-100)',
  inkSoft: 'var(--hcp-t-80)',
  inkMute: 'var(--hcp-t-60)',
  hairline: 'var(--hcp-line-2)',
  amber: '#F7931E',
  cardBg: 'var(--hcp-bg-1)',
};
const FONT = '"Geist", system-ui, sans-serif';

export const InviteToClbhouzV2: React.FC<Props> = ({ ownerUserId }) => {
  const { data: friends, isLoading: friendsLoading } = useFriendLeaderboard(ownerUserId);
  const { data: invites } = useSentInvites();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const invitable = useMemo(
    () =>
      (friends ?? [])
        .filter((f) => !f.is_clbhouz_user && f.friend_passport_id != null)
        .sort((a, b) => {
          const aT = a.last_round_played_at ? new Date(a.last_round_played_at).getTime() : -Infinity;
          const bT = b.last_round_played_at ? new Date(b.last_round_played_at).getTime() : -Infinity;
          if (aT !== bT) return bT - aT;
          return (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99);
        }),
    [friends],
  );

  const sentCount = invites?.length ?? 0;

  // Empty / no-invitable state
  if (!friendsLoading && invitable.length === 0) {
    return (
      <section id="invite-to-clbhouz-section" style={{ marginTop: 32 }}>
        <DarkSectionHeader eyebrow="INVITE FRIENDS" />
        <div style={{ padding: '0 16px' }}>
          <InviteQuestCard sentCount={sentCount} onClick={() => setSheetOpen(true)} />
        </div>
        <SentInvitesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </section>
    );
  }

  return (
    <section id="invite-to-clbhouz-section" style={{ marginTop: 32 }}>
      <DarkSectionHeader eyebrow="INVITE FRIENDS" />

      <div style={{ padding: '0 16px' }}>
        <InviteQuestCard sentCount={sentCount} onClick={() => setSheetOpen(true)} />
      </div>

      {!friendsLoading && invitable.length > 0 && (
        <>
          <div
            style={{
              padding: '18px 16px 10px',
              fontFamily: FONT,
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--hcp-t-60)',
            }}
          >
            Ready to invite · {invitable.length}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0 16px' }}>
            {(showAll ? invitable : invitable.slice(0, 4)).map((f) => (
              <InviteCard key={String(f.friend_passport_id)} friend={f} />
            ))}
          </div>
          {invitable.length > 4 && (
            <div style={{ padding: '0 16px' }}>
              <button
                onClick={() => setShowAll(!showAll)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  marginTop: 12,
                  background: T.cardBg,
                  border: `1px solid ${T.hairline}`,
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontFamily: FONT,
                  fontSize: 11,
                  fontWeight: 700,
                  color: T.inkSoft,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                }}
              >
                {showAll ? (
                  <>
                    Show less
                    <ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} />
                  </>
                ) : (
                  <>
                    See all {invitable.length} invitable
                    <ChevronDown size={14} />
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}

      <SentInvitesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  );
};

export default InviteToClbhouzV2;
