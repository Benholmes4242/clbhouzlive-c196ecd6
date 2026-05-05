import React from 'react';
import { Pin, PinOff } from 'lucide-react';
import { toast } from 'sonner';
import type { FriendLeaderboardEntry, FriendRivalry } from '@/lib/whs/types';
import type { SharedRoundsResult } from '@/lib/whs/api';
import { fmtHcp } from '@/lib/whs/format';
import { fmtRelative, reformatFriendName } from '@/lib/whs/utils/nameFormat';
import { initials } from '@/lib/whs/utils/initials';
import { useUpsertRivalOverride, useDeleteRivalOverride } from '@/lib/whs/hooks';

const T = {
  ink: '#0F172A',
  inkMute: 'rgba(15,23,42,0.55)',
  inkSoft: 'rgba(15,23,42,0.40)',
  hairline: 'rgba(15,23,42,0.08)',
  amber: '#F7931E',
  amberDeep: '#C97211',
  amberTint: 'rgba(247,147,30,0.10)',
  green: '#059669',
  red: '#DC2626',
};

// ─── Block 1: Header ────────────────────────────────────────────────────

export const ProfileHeader: React.FC<{ friend: FriendLeaderboardEntry }> = ({ friend }) => {
  const displayName = reformatFriendName(friend.friend_name);
  return (
    <div style={{ padding: '8px 20px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '34%',
        overflow: 'hidden',
        background: 'rgba(15,23,42,0.06)',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {friend.friend_thumbnail_url ? (
          <img
            src={friend.friend_thumbnail_url}
            alt={displayName}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <span style={{ fontSize: 22, fontWeight: 800, color: T.inkMute }}>
            {initials(friend.friend_name)}
          </span>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <h2 style={{
          margin: 0,
          fontSize: 20,
          fontWeight: 800,
          color: T.ink,
          letterSpacing: '-0.02em',
        }}>
          {displayName}
        </h2>
        <p style={{
          margin: '2px 0 0',
          fontSize: 12,
          color: T.inkMute,
          fontWeight: 500,
        }}>
          {friend.friend_home_club ?? 'No home club'}
          {friend.last_round_played_at && (
            <> · {fmtRelative(friend.last_round_played_at, { compact: true })}</>
          )}
        </p>
      </div>
    </div>
  );
};

// ─── Block 2: Hero stats row ────────────────────────────────────────────

const StatTile: React.FC<{
  label: string;
  value: string;
  color: string;
  divider?: 'left';
}> = ({ label, value, color, divider }) => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    borderLeft: divider === 'left' ? `1px solid ${T.hairline}` : 'none',
  }}>
    <span style={{
      fontSize: 9,
      fontWeight: 800,
      letterSpacing: '0.18em',
      color: T.inkMute,
    }}>
      {label}
    </span>
    <span style={{
      fontSize: 20,
      fontWeight: 800,
      color,
      fontVariantNumeric: 'tabular-nums',
      letterSpacing: '-0.03em',
    }}>
      {value}
    </span>
  </div>
);

export const HeroStatsRow: React.FC<{ friend: FriendLeaderboardEntry }> = ({ friend }) => {
  const delta = friend.handicap_30d_delta;
  const deltaColor =
    delta == null ? T.inkSoft
    : Math.abs(delta) < 0.05 ? T.inkSoft
    : delta < 0 ? T.green
    : T.red;
  const deltaPrefix = delta == null || Math.abs(delta) < 0.05 ? '' : delta < 0 ? '↓' : '↑';
  const deltaValue =
    delta == null ? '—'
    : Math.abs(delta) < 0.05 ? '—'
    : Math.abs(delta).toFixed(1);

  return (
    <div style={{
      margin: '0 20px 20px',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      background: '#F8FAFC',
      borderRadius: 14,
      border: `1px solid ${T.hairline}`,
      padding: '14px 0',
    }}>
      <StatTile label="HCP" value={fmtHcp(friend.friend_handicap_index)} color={T.ink} />
      <StatTile
        label="30D"
        value={`${deltaPrefix} ${deltaValue}`.trim()}
        color={deltaColor}
        divider="left"
      />
      <StatTile
        label="LAST"
        value={'—'}
        color={T.ink}
        divider="left"
      />
    </div>
  );
};

// ─── Section wrapper ────────────────────────────────────────────────────

const SectionWrapper: React.FC<{ eyebrow: string; children: React.ReactNode }> = ({ eyebrow, children }) => (
  <div style={{ padding: '12px 20px 16px', borderTop: `1px solid ${T.hairline}` }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <span aria-hidden style={{ width: 3, height: 8, borderRadius: 1, background: T.amber }} />
      <span style={{
        fontSize: 9,
        fontWeight: 900,
        color: T.amber,
        letterSpacing: '0.16em',
      }}>
        {eyebrow}
      </span>
    </div>
    {children}
  </div>
);

// ─── Block 4: H2H ───────────────────────────────────────────────────────

const EmptyH2H: React.FC<{ friend: FriendLeaderboardEntry }> = ({ friend }) => {
  let copy = 'No shared rounds yet';
  if (!friend.is_clbhouz_user) copy = 'Invite to Clbhouz to track shared rounds';
  else if (!friend.friend_connection_id) copy = 'They need to sync England Golf to track H2H';
  return (
    <p style={{ margin: 0, fontSize: 13, color: T.inkMute, lineHeight: 1.5 }}>
      {copy}
    </p>
  );
};

const FilledH2H: React.FC<{ sharedRounds: SharedRoundsResult }> = ({ sharedRounds }) => {
  const { stableford_record: sf, gross_record: gross, shared_round_results: results } = sharedRounds;
  const verdict = sf.wins > sf.losses ? 'AHEAD' : sf.losses > sf.wins ? 'BEHIND' : 'EVEN';
  const verdictColor = verdict === 'AHEAD' ? T.green : verdict === 'BEHIND' ? T.red : T.inkSoft;
  const lastEight = results.slice(0, 8);

  return (
    <>
      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.ink }}>
        You {sf.wins}{'\u2013'}{sf.losses} them ·{' '}
        <span style={{ color: verdictColor, fontWeight: 800, letterSpacing: '0.04em' }}>
          {verdict}
        </span>
      </p>
      <p style={{
        margin: '4px 0 12px',
        fontSize: 11,
        fontWeight: 700,
        color: T.inkSoft,
        letterSpacing: '0.04em',
      }}>
        GROSS {gross.wins}{'\u2013'}{gross.losses}
      </p>
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: 8 }).map((_, i) => {
          const r = lastEight[i];
          let bg = 'rgba(15,23,42,0.08)';
          if (r) {
            if (r.stableford_outcome === 'W') bg = T.green;
            else if (r.stableford_outcome === 'L') bg = T.red;
            else bg = T.inkSoft;
          }
          return (
            <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: bg }} />
          );
        })}
      </div>
    </>
  );
};

export const H2HBlock: React.FC<{
  friend: FriendLeaderboardEntry;
  sharedRounds: SharedRoundsResult | undefined;
  loading: boolean;
}> = ({ friend, sharedRounds, loading }) => {
  const hasH2H = (sharedRounds?.shared_rounds_count ?? 0) > 0;
  return (
    <SectionWrapper eyebrow="HEAD-TO-HEAD">
      {loading ? (
        <p style={{ fontSize: 12, color: T.inkMute, margin: 0 }}>Loading…</p>
      ) : !hasH2H ? (
        <EmptyH2H friend={friend} />
      ) : (
        <FilledH2H sharedRounds={sharedRounds!} />
      )}
    </SectionWrapper>
  );
};

// ─── Block 5: Recent rounds ─────────────────────────────────────────────

export const RecentRoundsBlock: React.FC<{
  friend: FriendLeaderboardEntry;
  ownerUserId: string;
}> = ({ friend }) => {
  if (!friend.last_round_played_at) return null;
  return (
    <SectionWrapper eyebrow="RECENT ROUNDS">
      <div style={{ fontSize: 13, color: T.ink, lineHeight: 1.6 }}>
        <strong style={{ fontVariantNumeric: 'tabular-nums' }}>—</strong>
        <span style={{ marginLeft: 8 }}>
          {friend.last_round_course_name ?? 'Unknown course'}
        </span>
        <span style={{ marginLeft: 8, color: T.inkMute }}>
          · {fmtRelative(friend.last_round_played_at, { compact: true })}
        </span>
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 11, color: T.inkSoft, fontStyle: 'italic' }}>
        Round history coming soon
      </p>
    </SectionWrapper>
  );
};

// ─── Block 6: Course bests ──────────────────────────────────────────────

export const CourseBestsBlock: React.FC<{
  friend: FriendLeaderboardEntry;
  ownerUserId: string;
}> = () => (
  <SectionWrapper eyebrow="COURSE BESTS">
    <p style={{ margin: 0, fontSize: 13, color: T.inkMute, fontStyle: 'italic' }}>
      Course bests coming soon
    </p>
  </SectionWrapper>
);

// ─── Footer: Pin/Unpin ──────────────────────────────────────────────────

export const PinFooter: React.FC<{
  friend: FriendLeaderboardEntry;
  pinnedSlot: FriendRivalry | undefined;
  ownerUserId: string;
}> = ({ friend, pinnedSlot, ownerUserId }) => {
  const upsert = useUpsertRivalOverride();
  const remove = useDeleteRivalOverride();
  const isPinned = !!pinnedSlot;

  const handleToggle = async () => {
    try {
      if (isPinned && pinnedSlot) {
        await remove.mutateAsync({ userId: ownerUserId, slotIndex: pinnedSlot.slot_index });
        toast.success('Unpinned');
      } else {
        await upsert.mutateAsync({
          userId: ownerUserId,
          slotIndex: 4,
          rival_user_id: friend.friend_user_id ?? undefined,
          rival_friend_row_id: (friend as any).friend_row_id ?? undefined,
        });
        toast.success('Pinned as rival');
      }
    } catch (e: any) {
      toast.error(e?.message ?? 'Could not update pin');
    }
  };

  const busy = upsert.isPending || remove.isPending;

  return (
    <div style={{
      position: 'sticky',
      bottom: 0,
      left: 0,
      right: 0,
      padding: '12px 20px max(12px, env(safe-area-inset-bottom))',
      background: '#FFFFFF',
      borderTop: `1px solid ${T.hairline}`,
      zIndex: 2,
    }}>
      <button
        onClick={handleToggle}
        disabled={busy}
        style={{
          width: '100%',
          padding: '14px',
          background: isPinned ? 'rgba(15,23,42,0.06)' : T.amber,
          color: isPinned ? T.ink : '#fff',
          fontSize: 14,
          fontWeight: 800,
          border: 'none',
          borderRadius: 12,
          cursor: busy ? 'wait' : 'pointer',
          opacity: busy ? 0.6 : 1,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {isPinned ? <PinOff size={16} /> : <Pin size={16} />}
        {isPinned ? 'Unpin rival' : 'Pin as rival'}
      </button>
    </div>
  );
};
