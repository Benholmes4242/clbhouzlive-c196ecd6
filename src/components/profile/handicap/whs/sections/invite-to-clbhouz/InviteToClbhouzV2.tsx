import React, { useMemo, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
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
  greenSoft: 'rgba(5,150,105,0.16)',
  greenText: '#34D399',
  cardBg: 'var(--hcp-bg-1)',
};
const FONT = '"Geist", system-ui, sans-serif';

const SentBadge: React.FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    aria-label="View sent invites"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 10px',
      borderRadius: 999,
      background: T.greenSoft,
      border: '1px solid rgba(5,150,105,0.30)',
      color: T.greenText,
      fontFamily: FONT,
      fontSize: 10.5,
      fontWeight: 800,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      cursor: 'pointer',
    }}
  >
    <Check size={11} strokeWidth={3} />
    {count} Sent
  </button>
);


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
          // Primary: most recently played first.
          // Friends without a known last_round_played_at sink to the bottom.
          const aT = a.last_round_played_at ? new Date(a.last_round_played_at).getTime() : -Infinity;
          const bT = b.last_round_played_at ? new Date(b.last_round_played_at).getTime() : -Infinity;
          if (aT !== bT) return bT - aT;
          // Tiebreaker: handicap ascending (stronger players first).
          return (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99);
        }),
    [friends],
  );

  const sentCount = invites?.length ?? 0;


  // Empty / no-invitable state
  if (!friendsLoading && invitable.length === 0) {
    return (
      <section id="invite-to-clbhouz-section" style={{ marginTop: 32 }}>
        <DarkSectionHeader
          eyebrow="INVITE FRIENDS"
          right={<SentBadge count={sentCount} onClick={() => setSheetOpen(true)} />}
        />
        <SentInvitesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </section>
    );
  }

  return (
    <section id="invite-to-clbhouz-section" style={{ marginTop: 32 }}>
      <DarkSectionHeader
        eyebrow="INVITE FRIENDS"
        right={<SentBadge count={sentCount} onClick={() => setSheetOpen(true)} />}
      />

      <div style={{ padding: '0 16px' }}>
        <InviteQuestCard sentCount={sentCount} />
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
