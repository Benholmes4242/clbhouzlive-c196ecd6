import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown } from 'lucide-react';
import { useFriendsLeaderboard, whsKeys } from '@/lib/whs/hooks';
import { callCreateInvite } from '@/lib/whs/api';
import { firstName, shareInvite } from '@/lib/whs/share';
import type { WhsFriendMatch } from '@/lib/whs/types';
import SectionHeader from './SectionHeader';
import PodiumSlot from './PodiumSlot';

interface Props {
  ownerUserId: string;
  currentUserHandicap: number | null | undefined;
  currentUserName?: string;
}

type Sort = 'handicap' | 'activity';
type Filter = 'all' | 'clbhouz' | 'invite';

type Row =
  | { kind: 'self'; handicap: number | null }
  | { kind: 'friend'; friend: WhsFriendMatch };

const HAIRLINE = '1px solid rgba(15,23,42,0.10)';
const AMBER = '#F7931E';
const AMBER_INK = '#9A6116';

function initials(name: string): string {
  const fn = firstName(name);
  return fn.slice(0, 2).toUpperCase();
}

const fmtH = (n: number | null | undefined) => {
  if (n === null || n === undefined) return '—';
  return n >= 0 ? n.toFixed(1) : `\u2212${Math.abs(n).toFixed(1)}`;
};

function formatRelativeShort(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

// ── Helper components for the dropdown menu ─────────────────────────────
const MenuLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      padding: '8px 14px 4px',
      fontSize: 9,
      fontWeight: 800,
      color: '#94A3B8',
      letterSpacing: '0.16em',
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const MenuItem: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      display: 'block',
      width: '100%',
      textAlign: 'left',
      padding: '8px 14px',
      background: active ? 'rgba(247,147,30,0.10)' : 'transparent',
      border: 'none',
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: active ? 800 : 600,
      color: active ? AMBER_INK : '#0F172A',
    }}
  >
    {label}
  </button>
);

export const FriendsLeaderboard: React.FC<Props> = ({
  ownerUserId,
  currentUserHandicap,
  currentUserName = 'You',
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: friends, isLoading } = useFriendsLeaderboard(ownerUserId);

  const [sort, setSort] = useState<Sort>('handicap');
  const [filter, setFilter] = useState<Filter>('all');
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Compute rows ──────────────────────────────────────────────────────
  const rows: Row[] = useMemo(() => {
    const list: Row[] = (friends ?? []).map((f) => ({
      kind: 'friend' as const,
      friend: f,
    }));
    list.push({ kind: 'self', handicap: currentUserHandicap ?? null });

    const filtered = list.filter((r) => {
      if (r.kind === 'self') return true;
      if (filter === 'clbhouz') return r.friend.is_clbhouz_user;
      if (filter === 'invite') return !r.friend.is_clbhouz_user;
      return true;
    });

    filtered.sort((a, b) => {
      if (sort === 'handicap') {
        const av =
          a.kind === 'self'
            ? a.handicap ?? 999
            : a.friend.friend_handicap_index ?? 999;
        const bv =
          b.kind === 'self'
            ? b.handicap ?? 999
            : b.friend.friend_handicap_index ?? 999;
        return av - bv;
      }
      const at =
        a.kind === 'self'
          ? 0
          : new Date(a.friend.last_round_played_at ?? 0).getTime();
      const bt =
        b.kind === 'self'
          ? 0
          : new Date(b.friend.last_round_played_at ?? 0).getTime();
      return bt - at;
    });
    return filtered;
  }, [friends, currentUserHandicap, sort, filter]);

  const yourRankIndex = rows.findIndex((r) => r.kind === 'self');
  const totalCount = rows.length;
  const clbhouzCount = (friends ?? []).filter((f) => f.is_clbhouz_user).length;

  // ── Closest rival ─────────────────────────────────────────────────────
  const rivalId = useMemo(() => {
    if (currentUserHandicap === null || currentUserHandicap === undefined)
      return null;
    if (!friends) return null;
    let minGap = Infinity;
    let rid: string | null = null;
    for (const f of friends) {
      if (f.friend_handicap_index === null) continue;
      const gap = Math.abs(f.friend_handicap_index - currentUserHandicap);
      if (gap > 0 && gap < minGap) {
        minGap = gap;
        rid = f.friend_row_id;
      }
    }
    return rid;
  }, [friends, currentUserHandicap]);

  // ── Sub-text for the section header ───────────────────────────────────
  const subText = useMemo(() => {
    if (isLoading) return 'Loading…';
    if (rows.length === 0) return undefined;
    if (currentUserHandicap === null || currentUserHandicap === undefined) {
      return `${friends?.length ?? 0} friends · ${clbhouzCount} on clbhouz`;
    }
    const rank = yourRankIndex + 1;
    if (rank === 1) return `#1 of ${totalCount} · ${totalCount - 1} chasing you`;
    if (rank === totalCount) return `#${rank} of ${totalCount}`;
    if (yourRankIndex < 0) return `${friends?.length ?? 0} friends`;
    const above = rows[yourRankIndex - 1];
    const aboveH =
      above.kind === 'self' ? above.handicap : above.friend.friend_handicap_index;
    if (aboveH === null) return `#${rank} of ${totalCount}`;
    const gap = Math.abs(currentUserHandicap - aboveH);
    if (gap > 5) return `#${rank} of ${totalCount}`;
    const aboveName =
      above.kind === 'self' ? 'You' : firstName(above.friend.friend_name);
    return `#${rank} of ${totalCount} · ${gap.toFixed(1)} behind ${aboveName}`;
  }, [
    isLoading,
    rows,
    totalCount,
    yourRankIndex,
    currentUserHandicap,
    clbhouzCount,
    friends,
  ]);

  const handleInvite = async (f: WhsFriendMatch) => {
    const res = await callCreateInvite(f.friend_passport_id, 'copy_link');
    if (!res.ok || !res.share_url) {
      toast.error(res.message ?? `Couldn't create invite`);
      return;
    }
    queryClient.invalidateQueries({ queryKey: whsKeys.sentInvites() });
    await shareInvite({
      share_url: res.share_url,
      share_message: res.share_message ?? '',
      invitee_name: res.invitee_name ?? f.friend_name,
    });
  };

  const filterLabel =
    filter === 'all' ? 'All' : filter === 'clbhouz' ? 'On clbhouz' : 'Not yet';

  // ── Podium split ──────────────────────────────────────────────────────
  const podium = rows.slice(0, 3);
  const rest = rows.slice(3);
  const userIsTopThree = yourRankIndex >= 0 && yourRankIndex < 3;

  // Build podium slots in display order: 2 · 1 · 3
  const slot1 = podium[0];
  const slot2 = podium[1];
  const slot3 = podium[2];

  const slotProps = (slot: Row | undefined, rank: 1 | 2 | 3) => {
    if (!slot) {
      return {
        rank,
        name: '',
        handicap: null,
        thumbnailUrl: null,
        isCurrentUser: false,
        isEmpty: true,
      };
    }
    if (slot.kind === 'self') {
      return {
        rank,
        name: currentUserName,
        handicap: slot.handicap,
        thumbnailUrl: null,
        isCurrentUser: true,
      };
    }
    return {
      rank,
      name: firstName(slot.friend.friend_name),
      handicap: slot.friend.friend_handicap_index,
      thumbnailUrl: slot.friend.friend_thumbnail_url,
      isCurrentUser: false,
    };
  };

  // ── Position panel data (when user is rank 4+) ────────────────────────
  const positionPanel = useMemo(() => {
    if (
      yourRankIndex < 3 ||
      currentUserHandicap === null ||
      currentUserHandicap === undefined
    )
      return null;
    const above = rows[yourRankIndex - 1];
    const aboveH =
      above.kind === 'self' ? above.handicap : above.friend.friend_handicap_index;
    const aboveName =
      above.kind === 'self' ? 'You' : firstName(above.friend.friend_name);
    const gap =
      aboveH !== null ? Math.abs(currentUserHandicap - aboveH).toFixed(1) : null;
    return {
      rank: yourRankIndex + 1,
      total: totalCount,
      gap,
      aboveName,
      aboveRank: yourRankIndex,
    };
  }, [yourRankIndex, rows, currentUserHandicap, totalCount]);

  // ── Empty state ───────────────────────────────────────────────────────
  if (!isLoading && rows.length <= 1 && (friends?.length ?? 0) === 0) {
    return (
      <section style={{ marginBottom: 24 }}>
        <SectionHeader
          eyebrow="The Leaderboard"
          title="Your circle, ranked"
        />
        <div style={{ padding: '24px 20px', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 14,
              color: '#64748B',
              margin: '0 0 12px',
              lineHeight: 1.5,
            }}
          >
            Connect more England Golf friends to see them here.
          </p>
          <button
            onClick={() => navigate('/golfers-to-follow')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              color: AMBER,
              letterSpacing: '0.18em',
              padding: 0,
            }}
          >
            FIND FRIENDS →
          </button>
        </div>
      </section>
    );
  }

  // ── Filter empty state ────────────────────────────────────────────────
  const filteredFriendsCount = rows.filter((r) => r.kind === 'friend').length;
  const showFilteredEmpty =
    !isLoading && filter !== 'all' && filteredFriendsCount === 0;

  return (
    <section style={{ marginBottom: 24, position: 'relative' }}>
      <SectionHeader
        eyebrow="The Leaderboard"
        title="Your circle, ranked"
        sub={subText}
        right={
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              style={{
                padding: '6px 12px',
                background: 'transparent',
                border: HAIRLINE,
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
                color: '#0F172A',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {filterLabel}
              <ChevronDown size={12} />
            </button>
            {menuOpen && (
              <>
                <div
                  onClick={() => setMenuOpen(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'transparent',
                    zIndex: 30,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    minWidth: 180,
                    background: '#fff',
                    border: HAIRLINE,
                    borderRadius: 10,
                    boxShadow: '0 8px 24px rgba(15,23,42,0.10)',
                    zIndex: 40,
                    paddingBottom: 6,
                  }}
                >
                  <MenuLabel>Sort by</MenuLabel>
                  <MenuItem
                    label="Handicap"
                    active={sort === 'handicap'}
                    onClick={() => {
                      setSort('handicap');
                      setMenuOpen(false);
                    }}
                  />
                  <MenuItem
                    label="Activity"
                    active={sort === 'activity'}
                    onClick={() => {
                      setSort('activity');
                      setMenuOpen(false);
                    }}
                  />
                  <div style={{ height: 1, background: 'rgba(15,23,42,0.08)', margin: '6px 0' }} />
                  <MenuLabel>View</MenuLabel>
                  {(['all', 'clbhouz', 'invite'] as Filter[]).map((f) => (
                    <MenuItem
                      key={f}
                      label={
                        f === 'all'
                          ? 'All friends'
                          : f === 'clbhouz'
                            ? 'On clbhouz'
                            : 'Not yet'
                      }
                      active={filter === f}
                      onClick={() => {
                        setFilter(f);
                        setMenuOpen(false);
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />

      {/* PODIUM */}
      {!isLoading && podium.length > 0 && (
        <div
          style={{
            margin: '0 16px 16px',
            padding: '20px 16px 8px',
            background:
              'linear-gradient(180deg, rgba(247,147,30,0.05) 0%, transparent 100%)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 1fr',
              alignItems: 'end',
              gap: 8,
            }}
          >
            <PodiumSlot {...slotProps(slot2, 2)} />
            <PodiumSlot {...slotProps(slot1, 1)} />
            <PodiumSlot {...slotProps(slot3, 3)} />
          </div>
        </div>
      )}

      {/* PODIUM LOADING SKELETON */}
      {isLoading && (
        <div
          style={{
            margin: '0 16px 16px',
            padding: '20px 16px 8px',
            background: 'rgba(15,23,42,0.03)',
            borderRadius: 12,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.2fr 1fr',
              alignItems: 'end',
              gap: 8,
            }}
          >
            {[64, 88, 48].map((h, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <div
                  className="animate-pulse"
                  style={{
                    width: i === 1 ? 50 : 44,
                    height: i === 1 ? 50 : 44,
                    borderRadius: 13,
                    background: 'rgba(15,23,42,0.08)',
                  }}
                />
                <div
                  className="animate-pulse"
                  style={{
                    width: 50,
                    height: 10,
                    borderRadius: 4,
                    background: 'rgba(15,23,42,0.08)',
                  }}
                />
                <div
                  className="animate-pulse"
                  style={{
                    width: '100%',
                    height: h,
                    borderRadius: '6px 6px 0 0',
                    background: 'rgba(15,23,42,0.08)',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* POSITION PANEL (when user is 4+) */}
      {positionPanel && (
        <div
          style={{
            margin: '0 20px 16px',
            padding: '12px 16px',
            background: '#fff',
            border: HAIRLINE,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 9,
                fontWeight: 800,
                color: '#94A3B8',
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              Your position
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'Georgia, serif',
                  letterSpacing: '-0.02em',
                  color: AMBER_INK,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                #{positionPanel.rank}
              </span>
              <span style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600 }}>
                of {positionPanel.total}
              </span>
            </div>
          </div>
          {positionPanel.gap !== null && (
            <div style={{ textAlign: 'right' }}>
              <div
                style={{ fontSize: 11, color: '#94A3B8', marginBottom: 2 }}
              >
                {positionPanel.gap} behind
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#0F172A',
                }}
              >
                {positionPanel.aboveName} at #{positionPanel.aboveRank} →
              </div>
            </div>
          )}
        </div>
      )}

      {/* FILTERED EMPTY STATE */}
      {showFilteredEmpty && (
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 8px' }}>
            No friends in this view.
          </p>
          <button
            onClick={() => setFilter('all')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 800,
              color: AMBER,
              letterSpacing: '0.12em',
              padding: 0,
            }}
          >
            SHOW ALL FRIENDS →
          </button>
        </div>
      )}

      {/* ROWS */}
      {!showFilteredEmpty && (
        <div style={{ borderTop: rest.length > 0 || isLoading ? HAIRLINE : 'none' }}>
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    padding: '14px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    borderBottom: HAIRLINE,
                  }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 14,
                      borderRadius: 4,
                      background: 'rgba(15,23,42,0.08)',
                    }}
                  />
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 12,
                      background: 'rgba(15,23,42,0.08)',
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div
                      style={{
                        width: 120,
                        height: 12,
                        borderRadius: 4,
                        background: 'rgba(15,23,42,0.08)',
                      }}
                    />
                    <div
                      style={{
                        width: 80,
                        height: 10,
                        borderRadius: 4,
                        background: 'rgba(15,23,42,0.06)',
                      }}
                    />
                  </div>
                  <div
                    style={{
                      width: 36,
                      height: 16,
                      borderRadius: 4,
                      background: 'rgba(15,23,42,0.08)',
                    }}
                  />
                </div>
              ))
            : rest.map((r, i) => {
                const rank = i + 4;
                const isSelf = r.kind === 'self';
                const isRival =
                  r.kind === 'friend' && r.friend.friend_row_id === rivalId;
                const handicap =
                  r.kind === 'self' ? r.handicap : r.friend.friend_handicap_index;
                const fullName =
                  r.kind === 'self' ? currentUserName : r.friend.friend_name;
                const displayName =
                  r.kind === 'self' ? 'You' : firstName(r.friend.friend_name);
                const club = r.kind === 'self' ? null : r.friend.friend_home_club;
                const lastRound =
                  r.kind === 'friend' && r.friend.last_round_played_at
                    ? formatRelativeShort(r.friend.last_round_played_at)
                    : null;

                const onClick = () => {
                  if (isSelf) return;
                  if (r.friend.is_clbhouz_user && r.friend.friend_user_id) {
                    navigate(`/p/${r.friend.friend_user_id}`);
                  } else {
                    handleInvite(r.friend);
                  }
                };

                return (
                  <button
                    key={isSelf ? 'self' : r.friend.friend_row_id}
                    onClick={onClick}
                    disabled={isSelf}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left',
                      border: 'none',
                      borderBottom: HAIRLINE,
                      background: isSelf ? 'rgba(247,147,30,0.05)' : 'transparent',
                      position: 'relative',
                      cursor: isSelf ? 'default' : 'pointer',
                    }}
                  >
                    {isSelf && (
                      <div
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: 3,
                          background: AMBER,
                        }}
                      />
                    )}

                    {/* Rank */}
                    <span
                      style={{
                        width: 22,
                        textAlign: 'center',
                        fontSize: 16,
                        fontWeight: 900,
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '-0.02em',
                        fontVariantNumeric: 'tabular-nums',
                        color: isSelf ? AMBER_INK : 'rgba(15,23,42,0.45)',
                        flexShrink: 0,
                      }}
                    >
                      {rank}
                    </span>

                    {/* Avatar */}
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        overflow: 'hidden',
                        flexShrink: 0,
                        background: isSelf
                          ? 'rgba(247,147,30,0.12)'
                          : 'rgba(15,23,42,0.06)',
                        border: isSelf ? `1.5px solid ${AMBER}` : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {!isSelf && r.friend.friend_thumbnail_url ? (
                        <img
                          src={r.friend.friend_thumbnail_url}
                          alt={fullName}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            color: isSelf ? AMBER : '#64748B',
                            letterSpacing: '0.04em',
                          }}
                        >
                          {isSelf ? 'YOU' : initials(fullName)}
                        </span>
                      )}
                    </div>

                    {/* Name + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          flexWrap: 'wrap',
                        }}
                      >
                        <span
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: '#0F172A',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            maxWidth: '100%',
                          }}
                        >
                          {displayName}
                        </span>
                        {isRival && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 900,
                              color: AMBER_INK,
                              letterSpacing: '0.12em',
                            }}
                          >
                            ◆ RIVAL
                          </span>
                        )}
                        {!isSelf && r.friend.is_clbhouz_user && (
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              color: '#059669',
                              letterSpacing: '0.10em',
                            }}
                          >
                            ● CLBHOUZ
                          </span>
                        )}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: '#64748B',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: 1,
                        }}
                      >
                        {[club, lastRound].filter(Boolean).join(' · ') || '—'}
                      </div>
                    </div>

                    {/* Handicap */}
                    <span
                      style={{
                        fontSize: 17,
                        fontWeight: 900,
                        fontFamily: 'Georgia, serif',
                        letterSpacing: '-0.02em',
                        fontVariantNumeric: 'tabular-nums',
                        color: '#0F172A',
                        textAlign: 'right',
                        flexShrink: 0,
                      }}
                    >
                      {fmtH(handicap)}
                    </span>

                    {/* Invite button */}
                    {!isSelf && !r.friend.is_clbhouz_user && (
                      <span
                        style={{
                          padding: '5px 10px',
                          background: AMBER,
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          borderRadius: 999,
                          flexShrink: 0,
                        }}
                      >
                        INVITE
                      </span>
                    )}
                  </button>
                );
              })}
        </div>
      )}
    </section>
  );
};

export default FriendsLeaderboard;
