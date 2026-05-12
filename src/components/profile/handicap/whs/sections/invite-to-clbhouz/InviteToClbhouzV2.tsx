import React, { useMemo, useState } from 'react';
import { Check, ChevronRight, ChevronDown } from 'lucide-react';
import {
  useFriendLeaderboard,
  useSentInvites,
} from '@/lib/whs/hooks';
import SectionHeader from '../SectionHeader';
import InviteCard from './InviteCard';
import SentInvitesSheet from './SentInvitesSheet';

interface Props {
  ownerUserId: string;
}

const T = {
  ink: '#0F172A',
  inkSoft: 'rgba(15,23,42,0.78)',
  inkMute: 'rgba(15,23,42,0.55)',
  hairline: 'rgba(15,23,42,0.08)',
  amber: '#F7931E',
  green: '#22C55E',
  greenDeep: '#15803D',
  greenSoft: 'rgba(34,197,94,0.12)',
  cardBg: '#FFFFFF',
};
const FONT = '"Geist", system-ui, sans-serif';

const SentBadge: React.FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    aria-label="View sent invites"
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 10px',
      borderRadius: 999,
      background: T.greenSoft,
      border: `1px solid ${T.greenSoft}`,
      color: T.greenDeep,
      fontFamily: FONT,
      fontSize: 11,
      fontWeight: 800,
      cursor: 'pointer',
      letterSpacing: '0.02em',
    }}
  >
    <Check size={12} strokeWidth={3} />
    Sent ({count})
  </button>
);

const SentLink: React.FC<{ count: number; onClick: () => void }> = ({ count, onClick }) => (
  <button
    onClick={onClick}
    aria-label="View sent invites"
    style={{
      fontSize: 12,
      fontWeight: 700,
      color: T.amber,
      background: 'transparent',
      border: 'none',
      cursor: 'pointer',
      display: 'inline-flex',
      alignItems: 'center',
      gap: 2,
      padding: 0,
      fontFamily: FONT,
    }}
  >
    Sent {count > 0 ? `(${count})` : ''}
    <ChevronRight size={14} />
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
      <section id="invite-to-clbhouz-section" style={{ marginTop: 24 }}>
        <SectionHeader
          eyebrow="MAKE YOUR FEED LOUDER"
          title="Everyone's here"
          sub="All your England Golf friends are already on Clbhouz 🎉"
          right={
            sentCount > 0 ? (
              <SentBadge count={sentCount} onClick={() => setSheetOpen(true)} />
            ) : undefined
          }
        />
        <SentInvitesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
      </section>
    );
  }

  return (
    <section id="invite-to-clbhouz-section" style={{ marginTop: 28 }}>
      <SectionHeader
        eyebrow="MAKE YOUR FEED LOUDER"
        title="Friends on England Golf"
        sub="Not on clbhouz yet — invite them to share rounds."
        right={
          sentCount > 0 ? (
            <SentBadge count={sentCount} onClick={() => setSheetOpen(true)} />
          ) : (
            <SentLink count={sentCount} onClick={() => setSheetOpen(true)} />
          )
        }
      />

      {!friendsLoading && invitable.length > 0 && (
        <div style={{ margin: '0 20px' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
            }}
          >
            {(showAll ? invitable : invitable.slice(0, 4)).map((f) => (
              <InviteCard
                key={String(f.friend_passport_id)}
                friend={f}
              />
            ))}
          </div>
          {invitable.length > 4 && (
            <button
              onClick={() => setShowAll(!showAll)}
              style={{
                width: '100%',
                padding: '10px 14px',
                marginTop: 12,
                background: T.cardBg,
                border: `1px solid ${T.hairline}`,
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: FONT,
                fontSize: 11.5,
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
          )}
        </div>
      )}

      <SentInvitesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  );
};

export default InviteToClbhouzV2;
