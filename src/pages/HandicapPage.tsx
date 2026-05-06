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

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Navigate, useSearchParams, useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageRoot } from '@/components/layout/PageRoot';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection } from '@/lib/whs/hooks';
import WhsHandicapTab from '@/components/profile/handicap/whs/WhsHandicapTab';
import HandicapDashboard from '@/components/profile/handicap/whs/HandicapDashboard';

import { analyticsEvents } from '@/utils/analyticsEvents';
import { isHandicapSubtab, type HandicapSubtab } from '@/components/profile/handicap/whs/types';

const INK = '#0F172A';
const INK_55 = '#64748B';
const BORDER = 'rgba(15,23,42,0.10)';
const BG_SURFACE = '#F8FAFC';
const AMBER = '#F7931E';
const AMBER_INK = '#C97211';

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
            width: 40, height: 40, borderRadius: '50%',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: 40, height: 40, borderRadius: '50%',
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
            fontSize: 11, fontWeight: 800, color: INK_55,
            letterSpacing: '0.22em', marginBottom: 2,
            fontFamily: FONT_GEIST,
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
              color: INK,
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
          <ChevronRight size={18} strokeWidth={2.2} color={INK_55} style={{ flexShrink: 0 }} />
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
  friendAvatarUrl,
  friendUsername,
  viewerUserId,
}) => {
  const navigate = useNavigate();

  const greeting = useMemo(() => getGreeting(), []);

  // Title varies by mode
  const eyebrow = readOnly ? 'HANDICAP' : 'HANDICAP';
  const title = readOnly
    ? (displayName ? `${displayName}'s handicap` : 'Handicap')
    : (displayName ? `${greeting}, ${displayName}` : 'Welcome back');

  // Sentinel-based detection: suppress safe-area padding while CompactHeader
  // is visible at top to avoid doubled inset gap.
  const [isAtTop, setIsAtTop] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsAtTop(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div
        ref={sentinelRef}
        aria-hidden
        style={{ height: 1, width: '100%', pointerEvents: 'none' }}
      />
      <header
        className="sticky top-0 z-30"
        style={{
          background: BG_SURFACE,
          paddingTop: isAtTop ? 0 : 'max(env(safe-area-inset-top, 0px), 47px)',
          transition: 'padding-top 200ms ease',
        }}
      >
      {/* Row 2 — title */}
      {readOnly ? (
        <div style={{ padding: '12px 20px 16px' }}>
          <FriendTitleRow
            displayName={displayName}
            avatarUrl={friendAvatarUrl}
            username={friendUsername}
            friendId={ownerUserId}
            viewerUserId={viewerUserId}
          />
        </div>
      ) : (
        <div style={{ padding: '14px 20px 18px' }}>
          <h1 style={{
            fontFamily: FONT_GEIST,
            fontSize: 28, fontWeight: 700, color: INK,
            lineHeight: 1.1, letterSpacing: '-0.02em',
            margin: 0,
          }}>
            {title}
          </h1>
        </div>
      )}

      {/* Row 3 — segmented control */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
      }}>
        {(['overview', 'trends', 'friends'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            style={{
              padding: '10px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab ? `2px solid ${AMBER}` : '2px solid transparent',
              marginBottom: -1,
              fontSize: 14,
              fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? INK : INK_55,
              cursor: 'pointer',
              fontFamily: FONT_GEIST,
              textTransform: 'capitalize',
            }}
          >
            {tab}
          </button>
        ))}
      </div>
    </header>
    </>
  );
};

// ───────────────────────────────────────────────────────────────────────
// Friend's handicap dashboard wrapper — read-only.
// Pulls the friend's WHS connection and renders HandicapDashboard with
// readOnly=true. If the friend has no connection, shows an empty state.
// ───────────────────────────────────────────────────────────────────────
const FriendHandicapDashboard: React.FC<{ userId: string }> = ({ userId }) => {
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

  return <HandicapDashboard connection={connection} userId={userId} readOnly />;
};

const HandicapPage: React.FC = () => {
  const { user, loading } = useSupabaseSession();
  const params = useParams<{ userId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // Determine mode + the user whose handicap we're showing.
  const friendId = params.userId ?? null;
  const isFriendView = !!friendId && !!user?.id && friendId !== user.id;
  const ownerUserId = isFriendView ? friendId! : user?.id ?? null;

  const rawSubtab = searchParams.get('subtab');
  const activeTab: HandicapSubtab = isHandicapSubtab(rawSubtab) ? rawSubtab : 'overview';

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

  if (loading) {
    return <PageRoot><div /></PageRoot>;
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
    <PageRoot style={{ background: BG_SURFACE }}>
      <HandicapPageHeader
        ownerUserId={ownerUserId}
        displayName={displayName}
        readOnly={isFriendView}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        friendAvatarUrl={isFriendView ? profile?.profile_photo_url : null}
        friendUsername={isFriendView ? profile?.username : null}
        viewerUserId={user.id}
      />
      <main>
        {isFriendView ? (
          <FriendHandicapDashboard userId={ownerUserId} />
        ) : (
          <WhsHandicapTab userId={ownerUserId} />
        )}
      </main>
    </PageRoot>
  );
};

export default HandicapPage;
