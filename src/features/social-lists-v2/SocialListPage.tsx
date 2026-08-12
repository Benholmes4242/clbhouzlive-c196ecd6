/**
 * SocialListPage (v2) — the Circle.
 *
 * Island-native rebuild of the followers/following list per Brief F2.
 * ZERO legacy imports from src/components/social/UserListPage.tsx,
 * src/hooks/useSocialLists.ts, src/hooks/_followsListShared.ts, or the
 * legacy Followers/Business pages. Reads the get_social_list RPC via
 * useSocialListV2.
 *
 * Sections group whatever rows are LOADED (friends arriving in later
 * pages migrate into the FRIENDS section on arrival). The 'All N friends'
 * expander reveals loaded friend rows only (friends_total is unknown
 * client-side without a dedicated fetch — acceptable for v1).
 */

import { useMemo, useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserPlus } from 'lucide-react';
import { useInviteSheet } from '@/hooks/useInviteSheet';
import { toast } from '@/lib/toast';

import { Skeleton } from '@/components/ui/skeleton';
import { SquircleAvatar, LIGHT_HAIRLINE } from '@/components/ui/SquircleAvatar';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useFriendActions } from '@/hooks/useFriendActions';
import { getActorRouteByType } from '@/types/actor';
import {
  useSocialListV2,
  useSocialListCounts,
  type SocialListRow,
} from './hooks/useSocialListV2';
import { FIGURE } from '@/lib/tokens/type';
import { RowAvatar, RowSubline, FollowButton } from './rowParts';

/* ── design tokens (Circle) ─────────────────────────────────────────── */
const FONT =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const BG = '#F8FAFC';
const SURFACE = '#FFFFFF';
const HAIR = 'rgba(15,23,42,0.08)';
const HAIR_STRONG = 'rgba(15,23,42,0.12)';

const BRAND_AMBER = '#F7931E';

/* ── props ──────────────────────────────────────────────────────────── */
interface Props {
  /** Profile owner — the actor whose Circle we're viewing. */
  profileActorType: 'personal' | 'business';
  profileActorId: string;
  profileUsername: string | null;
  profileDisplayName: string | null;
  /** Which list to open on mount. */
  initialTab?: 'followers' | 'following';
  /** Show the "Invite friends" card above the list. Only true on own
   *  personal-profile route; business route leaves it false. */
  showInviteCard?: boolean;
}

export default function SocialListPage({
  profileActorType,
  profileActorId,
  profileUsername,
  profileDisplayName,
  initialTab = 'followers',
  showInviteCard = false,
}: Props) {
  const { user: viewer } = useSupabaseSession();
  const { openInviteSheet } = useInviteSheet();
  const isOwnProfile =
    profileActorType === 'personal' && !!viewer?.id && viewer.id === profileActorId;

  const [direction, setDirection] = useState<'followers' | 'following'>(initialTab);
  const [search, setSearch] = useState('');
  const [friendsExpanded, setFriendsExpanded] = useState(false);

  // p_viewer_id is ALWAYS the session user — never profileActorId, never
  // an activeActor id (a business actor would produce wildly wrong
  // friend_status / viewer_follows / mutuals from the RPC).
  const viewerId = viewer?.id;
  const list = useSocialListV2({
    actorType: profileActorType,
    actorId: profileActorId,
    direction,
    viewerId,
  });
  const counts = useSocialListCounts(profileActorType, profileActorId, viewerId);


  const rows: SocialListRow[] = useMemo(
    () => list.data?.pages.flatMap((p) => p.rows) ?? [],
    [list.data],
  );

  /* client-side search on display_name/username, matching legacy semantics
     (legacy also matched home_club — we keep name+username per brief). */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.display_name ?? '').toLowerCase().includes(q) ||
        (r.username ?? '').toLowerCase().includes(q),
    );
  }, [rows, search]);

  const showPending = isOwnProfile && direction === 'following';
  const pending = useMemo(
    () => (showPending ? filtered.filter((r) => r.friend_status === 'pending_sent') : []),
    [filtered, showPending],
  );
  const friends = useMemo(
    () => filtered.filter((r) => r.friend_status === 'friend'),
    [filtered],
  );
  const everyone = useMemo(
    () =>
      filtered.filter(
        (r) =>
          r.friend_status !== 'friend' &&
          !(showPending && r.friend_status === 'pending_sent'),
      ),
    [filtered, showPending],
  );

  /* infinite sentinel */
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries.some((e) => e.isIntersecting) &&
          list.hasNextPage &&
          !list.isFetchingNextPage
        ) {
          list.fetchNextPage();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [list]);

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: BG,
        fontFamily: FONT,
        paddingTop: 'calc(var(--chrome-total-h, 0px) + 8px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
      }}
    >
      {/* Identity header */}
      <div style={{ padding: '14px 16px 6px' }}>
        <div
          style={{
            fontSize: 21,
            fontWeight: 700,
            color: INK,
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          {profileDisplayName ?? profileUsername ?? 'Profile'}
        </div>
        {profileUsername && (
          <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 2 }}>
            @{profileUsername}
          </div>
        )}
      </div>

      {/* Segmented tabs */}
      <div style={{ padding: '10px 16px 6px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            padding: 4,
            background: 'rgba(15,23,42,0.05)',
            borderRadius: 12,
          }}
        >
          {(['followers', 'following'] as const).map((d) => {
            const active = direction === d;
            const c = d === 'followers' ? counts.data?.followers : counts.data?.following;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                style={{
                  padding: '9px 10px',
                  borderRadius: 9,
                  border: 'none',
                  background: active ? INK : 'transparent',
                  color: active ? '#FFFFFF' : INK,
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: FONT,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <span style={{ textTransform: 'capitalize' }}>{d}</span>
                {typeof c === 'number' && (
                  <span
                    style={{
                      ...FIGURE,
                      fontSize: 11.5,
                      fontWeight: 600,
                      opacity: 0.6,
                    }}
                  >
                    {c}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Search */}
      <div style={{ padding: '6px 16px 12px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: SURFACE,
            border: `0.5px solid ${HAIR}`,
            borderRadius: 12,
            padding: '9px 12px',
          }}
        >
          <Search size={16} color={INK_FAINT} strokeWidth={2.2} />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${direction}`}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: 14,
              fontWeight: 500,
              color: INK,
              fontFamily: FONT,
            }}
          />
        </div>
      </div>

      {showInviteCard && isOwnProfile && (
        <div style={{ padding: '0 16px 12px' }}>
          <button
            type="button"
            onClick={() => openInviteSheet('social_list')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: SURFACE,
              border: `1px solid ${HAIR}`,
              borderRadius: 12,
              padding: '12px 14px',
              cursor: 'pointer',
              textAlign: 'left',
              fontFamily: FONT,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'rgba(247,147,30,0.10)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <UserPlus size={16} color={BRAND_AMBER} strokeWidth={2.2} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: INK }}>
                Invite friends to Clbhouz
              </div>
              <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 2 }}>
                Bring your regular fourball along
              </div>
            </div>
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                color: BRAND_AMBER,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                flexShrink: 0,
              }}
            >
              {'INVITE \u2192'}
            </span>
          </button>
        </div>
      )}

      {/* Sections */}
      <div style={{ paddingBottom: 24 }}>
        {list.isLoading ? (
          <ListSkeleton />
        ) : (
          <>
            {showPending && pending.length > 0 && (
              <Section eyebrow={`PENDING · ${pending.length}`} eyebrowColor={BRAND_AMBER}>
                {pending.map((r) => (
                  <PendingRow key={rowKey(r)} row={r} viewerUserId={viewer?.id} />
                ))}
              </Section>
            )}

            {friends.length > 0 && (
              <Section eyebrow={`FRIENDS · ${friends.length}`}>
                {(friendsExpanded ? friends : friends.slice(0, 8)).map((r) => (
                  <RichRow key={rowKey(r)} row={r} isOwnProfile={isOwnProfile} />
                ))}
                {friends.length > 8 && !friendsExpanded && (
                  <button
                    type="button"
                    onClick={() => setFriendsExpanded(true)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '10px 16px 4px',
                      color: '#94A3B8',
                      fontSize: 11.5,
                      fontWeight: 600,
                      fontFamily: FONT,
                      cursor: 'pointer',
                    }}
                  >
                    All {friends.length} friends ›
                  </button>
                )}
              </Section>
            )}

            {everyone.length > 0 && (
              <Section eyebrow="EVERYONE" muted>
                {everyone.map((r) => (
                  <RichRow key={rowKey(r)} row={r} isOwnProfile={isOwnProfile} />
                ))}
              </Section>
            )}

            {list.isError && (
              <div
                style={{
                  padding: '48px 24px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 12,
                  color: INK_MUTE,
                  fontSize: 13,
                }}
              >
                Couldn't load this list.
                <button
                  type="button"
                  onClick={() => list.refetch()}
                  style={{
                    background: INK,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 999,
                    padding: '8px 16px',
                    fontSize: 13,
                    fontWeight: 700,
                    fontFamily: FONT,
                    cursor: 'pointer',
                  }}
                >
                  Retry
                </button>
              </div>
            )}

            {filtered.length === 0 && !list.isFetching && !list.isError && (
              <div
                style={{
                  padding: '48px 24px',
                  textAlign: 'center',
                  color: INK_MUTE,
                  fontSize: 13,
                }}
              >
                {search.trim() ? `No matches for "${search.trim()}"` : 'Nobody here yet.'}
              </div>
            )}

            <div ref={sentinelRef} style={{ height: 1 }} />
            {list.isFetchingNextPage && (
              <div style={{ padding: 16 }}>
                <ListSkeleton compact />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ── helpers ────────────────────────────────────────────────────────── */
function rowKey(r: SocialListRow) {
  return `${r.actor_type}:${r.actor_id}`;
}

/* ── section shell ──────────────────────────────────────────────────── */
function Section({
  eyebrow,
  eyebrowColor,
  muted,
  children,
}: {
  eyebrow: string;
  eyebrowColor?: string;
  muted?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: 18 }}>
      <div
        style={{
          padding: '10px 16px 8px',
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '0.16em',
          color: eyebrowColor ?? (muted ? INK_MUTE : INK),
        }}
      >
        {eyebrow}
      </div>
      <div>{children}</div>
    </section>
  );
}

/* ── pending row (owner + following only) ───────────────────────────── */
function PendingRow({
  row,
  viewerUserId,
}: {
  row: SocialListRow;
  viewerUserId: string | undefined;
}) {
  const navigate = useNavigate();
  const { cancelFriendRequest, loading } = useFriendActions({
    currentUserId: viewerUserId ?? '',
  });
  const [cancelled, setCancelled] = useState(false);

  const onCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCancelled(true);
    const ok = await cancelFriendRequest(row.actor_id);
    if (!ok) setCancelled(false);
  };

  const goProfile = () => navigateToActor(navigate, row);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') goProfile();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 16px',
        cursor: 'pointer',
      }}
    >
      <SquircleAvatar
        src={row.avatar_url ?? undefined}
        alt={row.display_name ?? row.username ?? ''}
        size={38}
        fallback={(row.display_name ?? row.username ?? '?').charAt(0)}
        hairlineRing
        ringColor={LIGHT_HAIRLINE}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: INK,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {row.display_name ?? row.username}
        </div>
        <div style={{ fontSize: 11, fontWeight: 500, color: INK_MUTE, marginTop: 1 }}>
          {cancelled ? 'Request cancelled' : 'Friend request sent'}
        </div>
      </div>
      {!cancelled && (
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            height: 30,
            padding: '0 12px',
            borderRadius: 15,
            background: SURFACE,
            border: `1px solid ${HAIR_STRONG}`,
            color: INK,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: FONT,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Cancel
        </button>
      )}
    </div>
  );
}

/* ── friends + everyone row (rich) ──────────────────────────────────── */
function RichRow({
  row,
  isOwnProfile: _isOwnProfile,
}: {
  row: SocialListRow;
  isOwnProfile: boolean;
}) {
  const navigate = useNavigate();
  const goProfile = () => navigateToActor(navigate, row);
  const showHcp = row.handicap_index != null;
  const isBusiness = row.actor_type === 'business';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goProfile}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') goProfile();
      }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '11px 16px',
        cursor: 'pointer',
      }}
    >
      <RowAvatar row={row} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: INK,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {row.display_name ?? row.username}
          </div>
          {!isBusiness && showHcp && (
            <span
              style={{
                ...FIGURE,
                fontSize: 10.5,
                color: INK,
                background: 'rgba(0,0,0,0.05)',
                padding: '2px 6px',
                borderRadius: 6,
              }}
            >
              {formatHcp(row.handicap_index!)}
            </span>
          )}
        </div>
        <RowSubline row={row} />
      </div>
      <FollowButton row={row} />
    </div>
  );
}

/* ── nav helper ─────────────────────────────────────────────────────── */
function navigateToActor(
  navigate: (to: string, opts?: { state?: unknown }) => void,
  row: SocialListRow,
) {
  if (row.actor_type === 'business') {
    const path = getActorRouteByType('business', row.actor_id, row.business_slug);
    navigate(path, { state: { source: 'social-list' } });
    return;
  }
  if (row.username) {
    navigate(`/profile/${row.username}`);
    return;
  }
  navigate(`/profile/${row.actor_id}`);
}

/* ── skeleton ───────────────────────────────────────────────────────── */
export function ListSkeleton({ compact }: { compact?: boolean } = {}) {
  const n = compact ? 3 : 6;
  return (
    <div>
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '11px 16px',
          }}
        >
          <Skeleton style={{ width: 42, height: 42, borderRadius: '34%' }} />
          <div style={{ flex: 1 }}>
            <Skeleton style={{ height: 10, width: '40%', borderRadius: 4 }} />
            <Skeleton
              style={{
                height: 8,
                width: '55%',
                borderRadius: 4,
                marginTop: 6,
              }}
            />
          </div>
          <Skeleton style={{ width: 76, height: 28, borderRadius: 14 }} />
        </div>
      ))}
    </div>
  );
}

/* ── HCP format ─────────────────────────────────────────────────────── */
function formatHcp(v: number) {
  if (v < 0) return `+${(Math.abs(v)).toFixed(1)}`;
  return v.toFixed(1);
}
