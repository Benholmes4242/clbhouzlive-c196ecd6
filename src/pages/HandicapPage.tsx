import { Skeleton } from '@/components/ui/skeleton';
/**
 * HandicapPage — Top-level Handicap route.
 *
 * Two modes:
 * - Own handicap (route: /handicap) — full controls, greeting, sync pill.
 * - Friend handicap (route: /handicap/:userId) — RETIRED SURFACE. The route
 *   survives only to redirect stored notification links to compare; the
 *   friend-view branches below are reachable only from the owner's own page.
 *   Historically it was read-only and showed the
 *   friend's name in the title, hides the sync pill / more menu, and
 *   threads `readOnly` into HandicapDashboard.
 *
 * Reached from the profile sheet (own) or from a friend's row
 * in the leaderboard / a legacy ?tab=stats redirect (friend).
 */

import React, { useCallback, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { useNavigate, Navigate, useSearchParams, useParams } from 'react-router-dom';
import { ChevronRight, Trophy, Activity } from 'lucide-react';
import GamMount from '@/components/profile/handicap/whs/gam/GamMount';
import { RoundDetailSheet } from '@/components/profile/handicap/whs/sections/round-detail/RoundDetailSheet';
import { openGamAchievements } from '@/components/profile/handicap/whs/gam/events';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import WhsHandicapTab from '@/components/profile/handicap/whs/WhsHandicapTab';
import HandicapDashboard from '@/components/profile/handicap/whs/HandicapDashboard';

// FloatingPageHeader removed (H3) — chrome now driven by ChromeIsland registry.
import { ManagePageShell } from '@/components/manage/ManagePageShell';
import { safeGoBack } from '@/utils/navigation';
import SegmentedControl from '@/components/discover/SegmentedControl';
import { CompareOwnerCTA } from '@/components/profile/handicap/whs/sections/header/CompareOwnerCTA';
import CompareMount from '@/components/profile/handicap/whs/sections/compare/CompareMount';
import { firstName as canonicalFirstName } from '@/lib/whs/utils/initials';

/** Local wrapper: the canonical helper returns '' for empty input. */
const firstName = (n: string | null | undefined): string =>
  canonicalFirstName((n ?? '').trim()) || 'Player';
import { formatWeekdayDayMonthShortGB } from '@/i18n/format';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { resolveHandicapSubtab, type HandicapSubtab } from '@/components/profile/handicap/whs/types';
import { useTranslation } from 'react-i18next';


const INK = '#0F172A';
const INK_55 = '#64748B';
const BORDER = 'rgba(15,23,42,0.10)';
const BG_SURFACE = '#F8FAFC';
const AMBER = '#F7931E';
const AMBER_INK = '#C97211';
const AMBER_SOFT = 'rgba(247,147,30,0.06)';
const AMBER_BORDER = 'rgba(247,147,30,0.28)';

const FONT_SF = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

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
    analyticsEvents.track('friend_handicap_profile_tap', {
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
            fontFamily: FONT_SF,
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
            fontFamily: FONT_SF,
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
              fontFamily: FONT_SF,
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
  const { t } = useTranslation('common');

  const subheadOwn = useMemo(() => {
    const dateStr = formatWeekdayDayMonthShortGB(new Date());
    return displayName
      ? `${greeting}, ${displayName} · ${dateStr}`
      : `${greeting} · ${dateStr}`;
  }, [greeting, displayName]);

  // Three tabs. Circle remains available in friend view; its owner-only
  // sections (invite, personal leaderboard affordances) are suppressed by
  // `readOnly` inside the sections themselves.
  const tabs = useMemo(
    () => [
      { id: 'today', label: t('handicap.tab.today', 'Today') },
      { id: 'form', label: t('handicap.tab.form', 'Form') },
      { id: 'circle', label: t('handicap.tab.circle', 'Circle') },
    ],
    [t]
  );


  return (
    <>
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
        <CompareOwnerCTA
          ownerUserId={ownerUserId}
          ownerFirstName={firstName(displayName)}
        />
      )}

      {(readOnly || hasConnection) && (
        <div
          style={{
            fontFamily: FONT_SF,
            background: 'var(--hcp-bg-0)',
          }}
        >
          <div
            role="tablist"
            style={{
              display: 'flex',
              justifyContent: 'space-evenly',
              padding: '0 16px',
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
                    height: 48,
                    padding: '0 4px',
                    borderRadius: 0,
                    border: 'none',
                    background: 'transparent',
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.40)',
                    fontFamily: 'inherit',
                    fontSize: 17,
                    fontWeight: active ? 800 : 600,
                    letterSpacing: '-0.01em',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    position: 'relative',
                    transition: 'color 0.15s',
                  }}
                >
                  <span style={{ display: 'inline-block' }}>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

      )}
    </>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Friend's handicap dashboard wrapper — read-only.
// Pulls the friend's WHS connection and renders HandicapDashboard with
// readOnly=true. If the friend has no connection, shows an empty state.
// ───────────────────────────────────────────────────────────────────────
const FriendHandicapDashboard: React.FC<{ userId: string; ownerFirstName: string | null }> = ({ userId, ownerFirstName }) => {
  const { data: connection, isLoading, isError, refetch } = useWhsConnection(userId);

  if (isLoading) {
    return (
      <div className="px-4 pt-10 pb-6">
        <Skeleton variant="dark" className="h-3 w-44 rounded mb-5" />
        <Skeleton variant="dark" className="h-16 w-28 rounded mb-3" />
        <Skeleton variant="dark" className="h-4 w-36 rounded" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="px-6 py-16 text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <p style={{ fontSize: 14, color: INK_55, fontFamily: FONT_SF, margin: 0 }}>
          Couldn't load this player's handicap.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          style={{ background: INK, color: '#fff', border: 'none', borderRadius: 999, padding: '8px 16px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_SF }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="px-6 py-16 text-center">
        <p style={{ fontSize: 14, color: INK_55, fontFamily: FONT_SF }}>
          This player hasn't connected their handicap yet.
        </p>
      </div>
    );
  }

  return <HandicapDashboard connection={connection} userId={userId} readOnly ownerFirstName={ownerFirstName} />;
};

const HandicapPage: React.FC = () => {
  const { user, loading } = useSupabaseSession();
  const navigate = useNavigate();
  const params = useParams<{ userId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Body class is applied conditionally below (skipped during connect flow
  // so the dark theming does not bleed into the light Direction A header).


  // Determine mode + the user whose handicap we're showing.
  const friendId = params.userId ?? null;
  const isFriendView = !!friendId && !!user?.id && friendId !== user.id;
  const ownerUserId = isFriendView ? friendId! : user?.id ?? null;

  const rawSubtab = searchParams.get('subtab');
  // Legacy five-tab deep links (overview / trends / records / friends /
  // legends) are aliased to the three live tabs before validation, then the
  // URL is REPLACED so the address bar shows the new value.
  const { subtab: activeTab, migrated } = resolveHandicapSubtab(rawSubtab);

  useEffect(() => {
    if (!migrated) return;
    const next = new URLSearchParams(searchParams);
    next.set('subtab', activeTab);
    setSearchParams(next, { replace: true });
  }, [migrated, activeTab, searchParams, setSearchParams]);

  const handleTabChange = useCallback((next: HandicapSubtab) => {
    const params = new URLSearchParams(searchParams);
    params.set('subtab', next);
    setSearchParams(params, { replace: true });
    analyticsEvents.track('handicap_tab_changed', { from: activeTab, to: next });
  }, [searchParams, setSearchParams, activeTab]);


  // Deep-link: ?score=<whs score id> opens the canonical scorecard sheet over
  // the page (reaction notifications on a round land here). The param is
  // stripped immediately so a back/forward does not re-open the sheet, and
  // closing just drops the local state — no navigation.
  const [deepLinkScoreId, setDeepLinkScoreId] = useState<string | null>(null);
  useEffect(() => {
    const scoreId = searchParams.get('score');
    if (!scoreId) return;
    setDeepLinkScoreId(scoreId);
    const next = new URLSearchParams(searchParams);
    next.delete('score');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  // Deep-link: ?gam=trophies opens the Trophy Room sheet once on arrival.
  // Defer the emit until after GamMount has mounted and subscribed. The
  // early-return `loading` / `!ownerUserId` branches above unmount the
  // subscriber, and a synchronous emit here would fire into the void on
  // first render. Gate on `ownerUserId` (mount precondition) AND use a
  // microtask so subscription effects run first in the same commit.
  useEffect(() => {
    if (searchParams.get('gam') !== 'trophies') return;
    if (!ownerUserId) return;
    const section = searchParams.get('section') === 'crowns' ? 'crowns' : undefined;
    // ?badge=<id> preserves the retired NotificationsSheet behaviour: a badge
    // row in the Activity ledger opens the career record ON THAT BADGE.
    const badgeId = searchParams.get('badge') || undefined;
    const id = setTimeout(() => {
      openGamAchievements(badgeId || section ? { badgeId, section } : undefined);
      const next = new URLSearchParams(searchParams);
      next.delete('gam');
      next.delete('section');
      next.delete('badge');
      setSearchParams(next, { replace: true });
    }, 0);
    return () => clearTimeout(id);
  }, [searchParams, setSearchParams, ownerUserId]);



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
      const { data, error } = await supabase
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
      analyticsEvents.track('friend_handicap_page_viewed', {
        viewer_id: user?.id,
        friend_id: ownerUserId,
        source: 'route',
      });
    } else {
      analyticsEvents.track('handicap_page_viewed', {
        source: 'route',
        mode: 'own',
      });
    }
  }, [ownerUserId, isFriendView, user?.id]);

  // Call the WHS connection hook BEFORE any early returns so it's called
  // on every render in the same order (rules of hooks).
  // `useWhsConnection` is guarded internally by `enabled: !!userId`, so
  // passing undefined is safe — it just stays disabled.
  const { data: ownConnection, isFetched: connFetched, isError: connError, refetch: refetchConn } = useWhsConnection(
    isFriendView ? undefined : (ownerUserId ?? undefined)
  );
  const hasConnection = isFriendView ? true : !!ownConnection;
  // Connect flow = own view, query SETTLED, no error, no connection.
  // Settled means isFetched, NOT !isLoading: a disabled React Query v5 query is
  // pending with fetchStatus 'idle', so isLoading is false before it has ever
  // run. This page currently early-returns while the session is loading, so the
  // old !connLoading read happened to be safe - gating on isFetched removes the
  // dependency on that early return continuing to exist.
  const isConnectFlow = !isFriendView && connFetched && !connError && !ownConnection;

  // Apply the dark route theming only when NOT in the connect flow.
  // The connect flow uses Direction A (light) and the dark theming would
  // bleed through child surfaces.
  useLayoutEffect(() => {
    if (isConnectFlow) return;
    document.body.classList.add('route-handicap');
    return () => { document.body.classList.remove('route-handicap'); };
  }, [isConnectFlow]);

  if (loading) {
    return <PageRoot dark={true}><div /></PageRoot>;
  }

  if (!user?.id) {
    return <Navigate to="/auth" replace />;
  }

  // Friend route with own id → normalize to /handicap.
  if (friendId && friendId === user.id) {
    return <Navigate to="/handicap" replace />;
  }

  /**
   * A MEMBER'S HANDICAP PAGE IS PRIVATE TO THEM.
   * The route survives because delivered pushes and gam_notification_outbox
   * rows carry stored /handicap/{userId} destinations that cannot be
   * rewritten retrospectively - the same reason /handicap/rivalry/:id was
   * kept. So it redirects instead of 404ing. "Is this me" is the signed-in
   * session id from useSupabaseSession, compared above; anything else is
   * another member and lands on compare against them, sheet already open.
   * `replace` keeps the member off a back-button bounce.
   */
  if (friendId) {
    return (
      <Navigate
        to={`/handicap?subtab=circle&compare=${encodeURIComponent(friendId)}`}
        replace
      />
    );
  }

  if (!ownerUserId) {
    return <Navigate to="/auth" replace />;
  }

  // Own-mode error branch — a failed useWhsConnection must not fall through
  // to the connect flow (would prompt an already-connected user to reconnect).
  if (!isFriendView && connError) {
    return (
      <PageRoot dark={true}>
        <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24, textAlign: 'center', fontFamily: FONT_SF }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC' }}>
            Couldn't load your handicap
          </div>
          <div style={{ fontSize: 13, color: 'rgba(248,250,252,0.65)', maxWidth: 280 }}>
            Check your connection and try again.
          </div>
          <button
            type="button"
            onClick={() => refetchConn()}
            style={{ background: AMBER, color: '#0F172A', border: 'none', borderRadius: 999, padding: '10px 20px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: FONT_SF }}
          >
            Retry
          </button>
        </div>
      </PageRoot>
    );
  }

  // Connect flow: Direction A header (matches /manage/handicap exactly).
  if (isConnectFlow) {
    return (
      <ManagePageShell
        title="Connect your official WHS handicap"
        onBack={() => safeGoBack(navigate, '/profile')}
      >
        <WhsHandicapTab userId={ownerUserId} ownerFirstName={displayName} />
        <GamMount ownerUserId={ownerUserId} viewerUserId={user.id} ownerFirstName={displayName} readOnly={false} />
        <CompareMount viewerUserId={user.id} />
      </ManagePageShell>
    );
  }

  return (
    <PageRoot dark={true} style={{ background: 'var(--hcp-bg-0)' }}>
      {/* H3: header rendered globally by ChromeIsland (dark, hideHcp, /profile fallback). */}
      <main style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 56px)' }}>
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
        {isFriendView ? (
          <FriendHandicapDashboard userId={ownerUserId} ownerFirstName={displayName} />
        ) : (
          <WhsHandicapTab userId={ownerUserId} ownerFirstName={displayName} />
        )}
      </main>
      <GamMount ownerUserId={ownerUserId} viewerUserId={user.id} ownerFirstName={displayName} readOnly={isFriendView} />
      <CompareMount viewerUserId={user.id} />
      <RoundDetailSheet
        open={!!deepLinkScoreId}
        onClose={() => setDeepLinkScoreId(null)}
        scoreId={deepLinkScoreId}
        profileUserId={ownerUserId}
      />
    </PageRoot>
  );
};

export default HandicapPage;
