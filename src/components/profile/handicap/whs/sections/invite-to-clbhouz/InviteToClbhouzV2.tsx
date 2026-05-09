import React, { useMemo, useState } from 'react';
import { Send, Check, ChevronRight, ChevronDown } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  useFriendLeaderboard,
  useSentInvites,
  whsKeys,
} from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { shareInvitesBulk } from '@/lib/whs/share';
import { initials, firstName } from '@/lib/whs/utils/initials';
import type { FriendLeaderboardEntry } from '@/lib/whs/types';
import SectionHeader from '../SectionHeader';
import Paged8 from '../_shared/Paged8';
import InviteRow from './InviteRow';
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
  amberInk: '#854F0B',
  amberSoftA: 'rgba(247,147,30,0.14)',
  amberSoftB: 'rgba(247,147,30,0.04)',
  green: '#22C55E',
  greenDeep: '#15803D',
  greenSoft: 'rgba(34,197,94,0.12)',
  cardBg: '#FFFFFF',
};
const FONT = '"Geist", system-ui, sans-serif';

type Signal = 'home_club' | 'recent_course' | 'handicap_proximity' | null;

interface RankedFriend extends FriendLeaderboardEntry {
  id: string;
  signal: Signal;
}

function rankRelevance(
  invitable: FriendLeaderboardEntry[],
  userHomeClub: string | null,
  userHandicap: number | null,
): { picks: RankedFriend[]; dominantSignal: Signal } {
  if (invitable.length === 0) return { picks: [], dominantSignal: null };
  const userHomeClubNorm = userHomeClub?.toLowerCase().trim() ?? null;

  const scored = invitable.map((f) => {
    let score = 0;
    let signal: Signal = null;
    if (
      userHomeClubNorm &&
      f.friend_home_club &&
      f.friend_home_club.toLowerCase().trim() === userHomeClubNorm
    ) {
      score += 100;
      signal = 'home_club';
    } else if (
      userHomeClubNorm &&
      f.last_round_course_name &&
      f.last_round_course_name.toLowerCase().includes(userHomeClubNorm)
    ) {
      score += 50;
      signal = 'recent_course';
    }
    if (userHandicap != null && f.friend_handicap_index != null) {
      const distance = Math.abs(f.friend_handicap_index - userHandicap);
      score += 10 / (1 + distance);
      if (signal === null && score > 0) signal = 'handicap_proximity';
    }
    return { friend: f, score, signal };
  });

  scored.sort((a, b) => b.score - a.score);
  const picks: RankedFriend[] = scored.slice(0, 3).map((s) => ({
    ...s.friend,
    id: String(s.friend.friend_passport_id),
    signal: s.signal,
  }));

  const counts: Record<Exclude<Signal, null>, number> = {
    home_club: 0,
    recent_course: 0,
    handicap_proximity: 0,
  };
  for (const p of picks) if (p.signal) counts[p.signal]++;
  let dominant: Signal = null;
  (Object.keys(counts) as Array<Exclude<Signal, null>>).forEach((k) => {
    if (dominant === null && counts[k] >= 2) dominant = k;
  });
  if (dominant === null && picks.length > 0) dominant = picks[0].signal;
  return { picks, dominantSignal: dominant };
}

function reasonCopy(signal: Signal, homeClub: string | null): string {
  if (signal === 'home_club' && homeClub) return `From your home club, ${homeClub}`;
  if (signal === 'recent_course' && homeClub) return `Recently played ${homeClub}`;
  if (signal === 'handicap_proximity') return `Closest to your handicap`;
  return `Worth inviting from your circle`;
}

function joinNamesAnd(names: string[]): string {
  if (names.length === 0) return '';
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

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
  const queryClient = useQueryClient();
  const { data: friends, isLoading: friendsLoading } = useFriendLeaderboard(ownerUserId);
  const { data: invites } = useSentInvites();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);

  const invitable = useMemo(
    () =>
      (friends ?? [])
        .filter((f) => !f.is_clbhouz_user && f.friend_passport_id != null)
        .sort(
          (a, b) =>
            (a.friend_handicap_index ?? 99) - (b.friend_handicap_index ?? 99),
        ),
    [friends],
  );

  const userHomeClub = useMemo(
    () => friends?.find((f) => f.is_self)?.friend_home_club ?? null,
    [friends],
  );
  const userHandicap = useMemo(
    () => friends?.find((f) => f.is_self)?.friend_handicap_index ?? null,
    [friends],
  );

  const { picks, dominantSignal } = useMemo(
    () => rankRelevance(invitable, userHomeClub, userHandicap),
    [invitable, userHomeClub, userHandicap],
  );

  const items = useMemo(
    () => invitable.map((f) => ({ ...f, id: String(f.friend_passport_id) })),
    [invitable],
  );

  const sentCount = invites?.length ?? 0;

  const handleBulkInvite = async () => {
    if (picks.length === 0 || bulkLoading) return;
    setBulkLoading(true);
    try {
      const results = await Promise.all(
        picks.map((p) => callCreateInvite(p.friend_passport_id!, 'copy_link')),
      );
      const successful: Array<{
        share_url: string;
        share_message: string;
        invitee_name: string;
      }> = [];
      results.forEach((r, i) => {
        if (r.ok && r.share_url) {
          successful.push({
            share_url: r.share_url,
            share_message: r.share_message ?? '',
            invitee_name: r.invitee_name ?? picks[i].friend_name,
          });
        }
      });
      if (successful.length === 0) {
        toast.error("Couldn't create invites");
        return;
      }
      queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
      await shareInvitesBulk(successful);
    } finally {
      setBulkLoading(false);
    }
  };

  // Empty / no-invitable state
  if (!friendsLoading && invitable.length === 0) {
    return (
      <section id="invite-to-clbhouz-section" style={{ marginTop: 24 }}>
        <SectionHeader
          eyebrow="BUILD YOUR CIRCLE"
          title="Invite to Clbhouz"
          sub="Everyone's already on clbhouz 🎉"
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

  const firstNames = picks.map((p) => firstName(p.friend_name));
  const headlineNames = joinNamesAnd(firstNames);
  const reason = reasonCopy(dominantSignal, userHomeClub);

  const subCopy = friendsLoading
    ? undefined
    : picks.length > 0
      ? `${picks.length} from your circle ${
          dominantSignal === 'home_club'
            ? 'play your home club'
            : dominantSignal === 'recent_course'
              ? 'recently played your home club'
              : 'are close to your handicap'
        }`
      : `Invite ${invitable.length} more golfers from your network`;

  return (
    <section id="invite-to-clbhouz-section" style={{ marginTop: 28 }}>
      <SectionHeader
        eyebrow="BUILD YOUR CIRCLE"
        title={picks.length > 0 ? 'Top friends to invite' : 'Invite to Clbhouz'}
        sub={subCopy}
        right={
          sentCount > 0 ? (
            <SentBadge count={sentCount} onClick={() => setSheetOpen(true)} />
          ) : (
            <SentLink count={sentCount} onClick={() => setSheetOpen(true)} />
          )
        }
      />

      {!friendsLoading && picks.length > 0 && (
        <div
          style={{
            margin: '0 16px',
            background: `linear-gradient(135deg, ${T.amberSoftA}, ${T.amberSoftB})`,
            border: `1px solid ${T.hairline}`,
            borderRadius: 14,
            overflow: 'hidden',
          }}
        >
          {/* Top — stacked avatars + names + reason + bulk CTA */}
          <div style={{ padding: '16px 16px 14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', flexShrink: 0 }}>
                {picks.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '34%',
                      overflow: 'hidden',
                      background: 'rgba(15,23,42,0.06)',
                      border: '3px solid #fff',
                      marginLeft: i === 0 ? 0 : -12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: picks.length - i,
                      position: 'relative',
                    }}
                  >
                    {p.friend_thumbnail_url ? (
                      <img
                        src={p.friend_thumbnail_url}
                        alt={p.friend_name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', fontFamily: FONT }}>
                        {initials(p.friend_name)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontFamily: FONT,
                    fontSize: 14,
                    fontWeight: 800,
                    color: T.ink,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {headlineNames}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontFamily: FONT,
                    fontSize: 11.5,
                    color: T.amberInk,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {reason}
                </p>
              </div>
            </div>

            <button
              onClick={handleBulkInvite}
              disabled={bulkLoading}
              style={{
                marginTop: 12,
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                background: T.amber,
                color: '#fff',
                border: 'none',
                cursor: bulkLoading ? 'default' : 'pointer',
                opacity: bulkLoading ? 0.6 : 1,
                fontFamily: FONT,
                fontSize: 13,
                fontWeight: 800,
                letterSpacing: '0.02em',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
              }}
            >
              <Send size={13} />
              {bulkLoading ? 'Creating invites…' : `Invite all ${picks.length}`}
            </button>
          </div>

          {/* Individual rows for each pick */}
          {picks.map((p) => (
            <InviteRow key={p.id} friend={p} />
          ))}
        </div>
      )}

      {!friendsLoading && invitable.length > picks.length && (
        <div style={{ margin: '12px 16px 0' }}>
          {!showAll ? (
            <button
              onClick={() => setShowAll(true)}
              style={{
                width: '100%',
                padding: '10px 14px',
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
              See all {invitable.length} invitable
              <ChevronDown size={14} />
            </button>
          ) : (
            <Paged8
              items={items}
              ariaLabel="All invitable friends"
              renderItem={(item) => <InviteRow friend={item} />}
            />
          )}
        </div>
      )}

      <SentInvitesSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </section>
  );
};

export default InviteToClbhouzV2;
