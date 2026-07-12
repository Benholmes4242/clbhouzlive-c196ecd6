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
import { Search } from 'lucide-react';
import { toast } from 'sonner';

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

/* ── design tokens (Circle) ─────────────────────────────────────────── */
const FONT =
  '"Geist", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const INK = '#0F172A';
const INK_MUTE = '#64748B';
const INK_FAINT = '#94A3B8';
const BG = '#F8FAFC';
const SURFACE = '#FFFFFF';
const HAIR = 'rgba(15,23,42,0.08)';
const HAIR_STRONG = 'rgba(15,23,42,0.12)';
const AMBER = '#F7931E';
const AMBER_DEEP = '#C97A10';

/* ── props ──────────────────────────────────────────────────────────── */
interface Props {
  /** Profile owner — the actor whose Circle we're viewing. */
  profileActorType: 'personal' | 'business';
  profileActorId: string;
  profileUsername: string | null;
  profileDisplayName: string | null;
  /** Which list to open on mount. */
  initialTab?: 'followers' | 'following';
}

export default function SocialListPage({
  profileActorType,
  profileActorId,
  profileUsername,
  profileDisplayName,
  initialTab = 'followers',
}: Props) {
  const { user: viewer } = useSupabaseSession();
  const isOwnProfile =
    profileActorType === 'personal' && !!viewer?.id && viewer.id === profileActorId;

  const [direction, setDirection] = useState<'followers' | 'following'>(initialTab);
  const [search, setSearch] = useState('');
  const [friendsExpanded, setFriendsExpanded] = useState(false);

  const list = useSocialListV2({
    actorType: profileActorType,
    actorId: profileActorId,
    direction,
    viewerId: viewer?.id,
  });
  const counts = useSocialListCounts(profileActorType, profileActorId, viewer?.id);

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
        paddingTop: 'var(--header-h, 0px)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 96px)',
      }}
    >
      {/* Identity header */}
      <div style={{ padding: '14px 16px 6px' }}>
        <div
          style={{
            fontSize: 21,
            fontWeight: 800,
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

      {/* Sections */}
      <div style={{ paddingBottom: 24 }}>
        {list.isLoading ? (
          <ListSkeleton />
        ) : (
          <>
            {showPending && pending.length > 0 && (
              <Section eyebrow={`PENDING · ${pending.length}`} eyebrowColor={AMBER_DEEP}>
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
                      color: AMBER,
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

            {filtered.length === 0 && !list.isFetching && (
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
      {isBusiness ? (
        <BusinessMark row={row} />
      ) : (
        <SquircleAvatar
          src={row.avatar_url ?? undefined}
          alt={row.display_name ?? row.username ?? ''}
          size={42}
          fallback={(row.display_name ?? row.username ?? '?').charAt(0)}
          hairlineRing
          ringColor={LIGHT_HAIRLINE}
        />
      )}
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
                fontSize: 10.5,
                fontWeight: 800,
                color: INK,
                background: 'rgba(0,0,0,0.05)',
                padding: '2px 6px',
                borderRadius: 6,
                fontVariantNumeric: 'tabular-nums',
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

function BusinessMark({ row }: { row: SocialListRow }) {
  const initial = (row.display_name ?? '?').charAt(0);
  if (row.avatar_url) {
    return (
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '34%',
          overflow: 'hidden',
          background: SURFACE,
          border: `0.5px solid ${LIGHT_HAIRLINE}`,
          flexShrink: 0,
        }}
      >
        <img
          src={row.avatar_url}
          alt={row.display_name ?? ''}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    );
  }
  return (
    <div
      style={{
        width: 42,
        height: 42,
        borderRadius: '34%',
        background: 'rgba(15,23,42,0.06)',
        border: `0.5px solid ${LIGHT_HAIRLINE}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 15,
        fontWeight: 700,
        color: INK_MUTE,
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}

function RowSubline({ row }: { row: SocialListRow }) {
  if (row.actor_type === 'business') {
    const loc = row.business_location ?? row.business_category ?? '';
    return (
      <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 1 }}>
        Business{loc ? ` · ${loc}` : ''}
      </div>
    );
  }
  const mutuals = row.mutual_usernames ?? [];
  if (row.mutual_count > 0 && mutuals.length > 0) {
    const extra = row.mutual_count - 1;
    return (
      <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 1 }}>
        Followed by @{mutuals[0]}
        {extra > 0 ? ` + ${extra} ${extra === 1 ? 'other' : 'others'}` : ''}
      </div>
    );
  }
  const home = row.home_club;
  if (!home) return null;
  return (
    <div style={{ fontSize: 11.5, fontWeight: 500, color: INK_MUTE, marginTop: 1 }}>{home}</div>
  );
}

/* ── follow button ──────────────────────────────────────────────────── */
function FollowButton({ row }: { row: SocialListRow }) {
  const { user: viewer } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const toggle = useToggleFollow();
  const [pending, setPending] = useState(false);
  const [optimistic, setOptimistic] = useState<boolean | null>(null);

  const isSelf =
    viewer?.id &&
    row.actor_type === 'personal' &&
    row.actor_id === viewer.id;
  if (isSelf) return null;

  const following = optimistic ?? !!row.viewer_follows;
  const viewerActorType: 'personal' | 'business' = activeActor?.type ?? 'personal';
  const viewerActorId = activeActor?.id ?? viewer?.id ?? '';

  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!viewer?.id) {
      toast.error('Please sign in');
      return;
    }
    const prev = following;
    setOptimistic(!prev);
    setPending(true);
    try {
      await toggle.mutateAsync({
        targetActorType: row.actor_type,
        targetActorId: row.actor_id,
        targetUserId: row.actor_type === 'personal' ? row.actor_id : undefined,
        viewerActorType,
        viewerActorId,
        viewerUserId: viewer.id,
        isFollowing: prev,
      });
    } catch {
      setOptimistic(prev);
      toast.error(prev ? 'Could not unfollow' : 'Could not follow');
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      style={{
        height: 30,
        padding: '0 14px',
        borderRadius: 15,
        background: following ? SURFACE : INK,
        color: following ? INK : '#FFFFFF',
        border: following ? `1px solid ${HAIR_STRONG}` : 'none',
        fontSize: 12,
        fontWeight: 700,
        fontFamily: FONT,
        cursor: pending ? 'default' : 'pointer',
        opacity: pending ? 0.7 : 1,
        flexShrink: 0,
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
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
function ListSkeleton({ compact }: { compact?: boolean } = {}) {
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
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: '34%',
              background: HAIR,
            }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ height: 10, width: '40%', background: HAIR, borderRadius: 4 }} />
            <div
              style={{
                height: 8,
                width: '55%',
                background: 'rgba(15,23,42,0.06)',
                borderRadius: 4,
                marginTop: 6,
              }}
            />
          </div>
          <div style={{ width: 76, height: 28, background: HAIR, borderRadius: 14 }} />
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
