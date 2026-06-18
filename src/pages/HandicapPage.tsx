/**
 * HandicapPage — Top-level Handicap route.
 *
 * Two modes:
 * - Own handicap (route: /handicap) — full controls, greeting, sync pill.
 * - Friend handicap (route: /handicap/:userId) — read-only. Shows the
 *   friend's name in the title, hides the sync pill / more menu, and
 *   threads `readOnly` into HandicapDashboard.
 *
 * Reached from the ProfileHubSheet 2×2 grid (own) or from a friend's row
 * in the leaderboard / a legacy ?tab=stats redirect (friend).
 */

import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, Navigate, useSearchParams, useParams } from 'react-router-dom';
import { ChevronRight, Trophy, Activity, Bell } from 'lucide-react';
import GamMount from '@/components/profile/handicap/whs/gam/GamMount';
import { openNotifications } from '@/components/profile/handicap/whs/gam/events';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import WhsHandicapTab from '@/components/profile/handicap/whs/WhsHandicapTab';
import HandicapDashboard from '@/components/profile/handicap/whs/HandicapDashboard';
import ShellSlot from '@/components/header/ShellSlot';
import SegmentedControl from '@/components/discover/SegmentedControl';
import { RivalryCTA } from '@/components/profile/handicap/whs/sections/header/RivalryCTA';
import { firstName } from '@/pages/rivalry-page/_shared/helpers';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { isHandicapSubtab, type HandicapSubtab } from '@/components/profile/handicap/whs/types';

const INK = '#0F172A';
const INK_55 = '#64748B';
const BORDER = 'rgba(15,23,42,0.10)';
const BG_SURFACE = '#F8FAFC';
const AMBER = '#F7931E';
const AMBER_INK = '#C97211';
const AMBER_SOFT = 'rgba(247,147,30,0.06)';
const AMBER_BORDER = 'rgba(247,147,30,0.28)';

const FONT_GEIST = 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif';

function getGreeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

interface HeaderProps {
  ownerUserId: string;
  /** First name (own mode) OR full display name (friend mode). */
  displayName: string | null;
  /** When true, hides the sync pill + more menu. */
  readOnly: boolean;
  activeTab: HandicapSubtab;
  onTabChange: (tab: HandicapSubtab) => void;
  /** When false (own mode + no WHS connection), hide tab strip / trophy / subhead. */
  hasConnection: boolean;
  /** Friend mode: avatar URL for the tappable title row. */
  friendAvatarUrl?: string | null;
  /** Friend mode: username for /profile/:username navigation. */
  friendUsername?: string | null;
  /** Friend mode: viewer id for analytics. */
  viewerUserId?: string;
}

// ───────────────────────────────────────────────────────────────────────
// FriendTitleRow — tappable avatar + name + chevron acting as the
// "Visit profile" CTA in friend mode (Option D).
// ───────────────────────────────────────────────────────────────────────
const FriendTitleRow: React.FC<{
  displayName: string | null;
  avatarUrl: string | null | undefined;
  username: string | null | undefined;
  friendId: string;
  viewerUserId: string | undefined;
}> = ({ displayName, avatarUrl, username, friendId, viewerUserId }) => {
  const navigate = useNavigate();
  const profileTarget = username ? `/profile/${username}` : `/profile/${friendId}`;
  const initial = (displayName?.charAt(0) ?? '?').toUpperCase();

  const handleTap = () => {
    analyticsEvents.track?.('friend_handicap_profile_tap', {
      viewer_id: viewerUserId,
      friend_id: friendId,
    });
    navigate(profileTarget);
  };

  return (
    <button
      onClick={handleTap}
      aria-label={`View ${displayName ?? 'player'}'s profile`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt=""
          style={{
            width: 40, height: 40, borderRadius: '34%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 40, height: 40, borderRadius: '34%',
            background: `linear-gradient(135deg, ${AMBER}, ${AMBER_INK})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 16,
            fontFamily: FONT_GEIST,
            flexShrink: 0,
          }}
        >
          {initial}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10.5, fontWeight: 700, color: AMBER,
            letterSpacing: '0.14em', marginBottom: 2,
            fontFamily: FONT_GEIST,
            textTransform: 'uppercase',
          }}
        >
          HANDICAP
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontFamily: FONT_GEIST,
              fontSize: 22,
              fontWeight: 700,
              color: 'var(--hcp-t-100)',
              lineHeight: 1.15,
              letterSpacing: '-0.01em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {displayName ?? 'Player'}
          </span>
          <ChevronRight size={18} strokeWidth={2.2} color="var(--hcp-t-60)" style={{ flexShrink: 0 }} />
        </div>
      </div>
    </button>
  );
};

const HandicapPageHeader: React.FC<HeaderProps> = ({
  ownerUserId,
  displayName,
  readOnly,
  activeTab,
  onTabChange,
  hasConnection,
  friendAvatarUrl,
  friendUsername,
  viewerUserId,
}) => {
  const greeting = useMemo(() => getGreeting(), []);

  const subheadOwn = useMemo(() => {
    const dateStr = new Date().toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short',
    });
    return displayName
      ? `${greeting}, ${displayName} · ${dateStr}`
      : `${greeting} · ${dateStr}`;
  }, [greeting, displayName]);

  const tabs = useMemo(() => {
    const all = [
      { id: 'today', label: 'Today' },
      { id: 'trends', label: 'Form' },
      { id: 'records', label: 'Records' },
      { id: 'friends', label: 'Friends' },
      { id: 'legends', label: 'Compete' },
    ];
    return readOnly ? all.filter(t => t.id !== 'friends') : all;
  }, [readOnly]);

  return (
    <ShellSlot>
      {readOnly ? (
        <div style={{ padding: '12px 16px 12px' }}>
          <FriendTitleRow
            displayName={displayName}
            avatarUrl={friendAvatarUrl}
            username={friendUsername}
            friendId={ownerUserId}
            viewerUserId={viewerUserId}
          />
        </div>
      ) : null}

      {readOnly && ownerUserId && viewerUserId && (
        <RivalryCTA
          rivalUserId={ownerUserId}
          rivalFirstName={firstName(displayName)}
        />
      )}

      {(readOnly || hasConnection) && (
        <div
          style={{
            overflowX: 'auto',
            overflowY: 'hidden',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            fontFamily: FONT_GEIST,
          }}
          className="hcp-tab-row"
        >
          <div
            role="tablist"
            style={{
              display: 'flex',
              justifyContent: 'space-evenly',
              padding: '0 16px',
              minWidth: 'min-content',
            }}
          >
            {tabs.map(tab => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id as HandicapSubtab)}
                  role="tab"
                  aria-selected={active}
                  style={{
                    flex: '0 0 auto',
                    height: 44,
                    padding: '0 4px',
                    borderRadius: 0,
                    border: 'none',
                    background: 'transparent',
                    color: active ? '#0A0E14' : '#64748B',
                    fontFamily: 'inherit',
                    fontSize: 14,
                    fontWeight: active ? 700 : 600,
                    letterSpacing: '-0.005em',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    position: 'relative',
                    transition: 'color 0.15s',
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      paddingBottom: 4,
                      borderBottom: active ? '1.5px solid #0A0E14' : '1.5px solid transparent',
                    }}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}

          </div>
          <style>{`.hcp-tab-row::-webkit-scrollbar { display: none; }`}</style>
        </div>
      )}
    </ShellSlot>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Friend's handicap dashboard wrapper — read-only.
// Pulls the friend's WHS connection and renders HandicapDashboard with
// readOnly=true. If the friend has no connection, shows an empty state.
// ───────────────────────────────────────────────────────────────────────
const FriendHandicapDashboard: React.FC<{ userId: string; ownerFirstName: string | null }> = ({ userId, ownerFirstName }) => {
  const { data: connection, isLoading } = useWhsConnection(userId);

  if (isLoading) {
    return (
      <div className="px-5 pt-10 pb-6 animate-pulse">
        <div className="h-3 w-44 bg-muted/60 rounded mb-5" />
        <div className="h-16 w-28 bg-muted rounded mb-3" />
        <div className="h-4 w-36 bg-muted/60 rounded" />
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="px-6 py-16 text-center">
        <p style={{ fontSize: 14, color: INK_55, fontFamily: FONT_GEIST }}>
          This player hasn't connected their handicap yet.
        </p>
      </div>
    );
  }

  return <HandicapDashboard connection={connection} userId={userId} readOnly ownerFirstName={ownerFirstName} />;
};

const HandicapPage: React.FC = () => {
  const { user, loading } = useSupabaseSession();
  const params = useParams<{ userId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  useLayoutEffect(() => {
    document.body.classList.add('route-handicap');
    return () => { document.body.classList.remove('route-handicap'); };
  }, []);

  // Determine mode + the user whose handicap we're showing.
  const friendId = params.userId ?? null;
  const isFriendView = !!friendId && !!user?.id && friendId !== user.id;
  const ownerUserId = isFriendView ? friendId! : user?.id ?? null;

  const rawSubtab = searchParams.get('subtab');
  // Graceful redirect: legacy ?subtab=overview bookmarks resolve to 'today'.
  const normalisedSubtab = rawSubtab === 'overview' ? 'today' : rawSubtab;
  const candidate: HandicapSubtab = isHandicapSubtab(normalisedSubtab) ? normalisedSubtab : 'today';
  const activeTab: HandicapSubtab = isFriendView && candidate === 'friends' ? 'today' : candidate;

  const handleTabChange = useCallback((next: HandicapSubtab) => {
    const params = new URLSearchParams(searchParams);
    params.set('subtab', next);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Fetch profile for greeting/title.
  // Uses display_name when available (extracts first name), falls back to username.
  const { data: profile } = useQuery<{
    username: string | null;
    display_name: string | null;
    profile_photo_url: string | null;
  } | null>({
    queryKey: ['handicap-page-profile', ownerUserId],
    enabled: !!ownerUserId,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_profiles')
        .select('username, display_name, profile_photo_url')
        .eq('id', ownerUserId!)
        .maybeSingle();
      if (error) throw error;
      return data ?? null;
    },
  });

  const displayName = useMemo(() => {
    if (profile?.display_name) {
      const name = profile.display_name.trim();
      if (name.includes(',')) {
        const afterComma = name.split(',')[1]?.trim();
        if (afterComma) return afterComma.split(' ')[0];
      }
      return name.split(' ')[0];
    }
    return profile?.username ?? null;
  }, [profile]);

  useEffect(() => {
    if (!ownerUserId) return;
    if (isFriendView) {
      analyticsEvents.track?.('friend_handicap_page_viewed', {
        viewer_id: user?.id,
        friend_id: ownerUserId,
        source: 'route',
      });
    } else {
      analyticsEvents.track?.('handicap_page_viewed', {
        source: 'route',
        mode: 'own',
      });
    }
  }, [ownerUserId, isFriendView, user?.id]);

  // Call the WHS connection hook BEFORE any early returns so it's called
  // on every render in the same order (rules of hooks).
  // `useWhsConnection` is guarded internally by `enabled: !!userId`, so
  // passing undefined is safe — it just stays disabled.
  const { data: ownConnection, isLoading: connLoading } = useWhsConnection(
    isFriendView ? undefined : (ownerUserId ?? undefined)
  );
  const hasConnection = isFriendView ? true : !!ownConnection;
  // Connect flow = own view, query settled, no connection. The whole page is
  // light now (matches Clubhouse/Watch/Tours) — connect flow no longer needs
  // a special-case background.
  const isConnectFlow = !isFriendView && !connLoading && !ownConnection;

  if (loading) {
    return <PageRoot dark={false}><div /></PageRoot>;
  }

  if (!user?.id) {
    return <Navigate to="/auth" replace />;
  }

  // Friend route with own id → normalize to /handicap.
  if (friendId && friendId === user.id) {
    return <Navigate to="/handicap" replace />;
  }

  if (!ownerUserId) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageRoot dark={false} style={{ background: 'var(--hcp-bg-0)' }}>
      <HandicapPageHeader
        ownerUserId={ownerUserId}
        displayName={displayName}
        readOnly={isFriendView}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        hasConnection={hasConnection}
        friendAvatarUrl={isFriendView ? profile?.profile_photo_url : null}
        friendUsername={isFriendView ? profile?.username : null}
        viewerUserId={user.id}
      />
      <main style={{ paddingTop: 'var(--chrome-total-h, 0px)' }}>
        {isFriendView ? (
          <FriendHandicapDashboard userId={ownerUserId} ownerFirstName={displayName} />
        ) : (
          <WhsHandicapTab userId={ownerUserId} ownerFirstName={displayName} />
        )}
      </main>
      <GamMount ownerUserId={ownerUserId} viewerUserId={user.id} ownerFirstName={displayName} readOnly={isFriendView} />
    </PageRoot>
  );
};

export default HandicapPage;
