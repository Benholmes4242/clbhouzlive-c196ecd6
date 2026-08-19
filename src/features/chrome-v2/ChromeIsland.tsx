/**
 * ChromeIsland — H1 twin-capsule floating header (Bet B).
 *
 * First runtime consumer of the chrome-v2 registry. Behind a dev toggle
 * (see GlobalHeader): CompactHeader remains the default for all users.
 *
 * Rendering contract:
 *   - resolveChrome(pathname, searchParams) drives everything.
 *   - spec.chrome === 'none' -> renders nothing, publishes --header-h: 0.
 *   - spec.chrome === 'island' -> fixed twin-capsule layer at top,
 *     publishes --header-h: 64 (10 top gap + 44 island + 10 breathing).
 *
 * Reuses (not forks):
 *   - Handicap cell: useWhsConnection + useHandicapTrend + useHandicapHistory (last change)
 *     (the exact hooks HandicapChip.tsx uses), so index value AND
 *     improving/drifting logic AND visibility rules mirror the pill.
 *   - Avatar cell: useActiveActor + useActorUnreadCounts (the pattern
 *     PostingAsPill.tsx uses) for image + unified unread badge, and
 *     PostingAsMenu as the controlled host — the island avatar becomes
 *     the anchor+trigger for the exact same sheet CompactHeader opens.
 *   - Search cell: SearchOverlayV2, same import + local state pattern.
 *
 * Home-nation glass rules: every glass surface publishes BOTH
 * backdropFilter and WebkitBackdropFilter. Squircles use 34% radius.
 */

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft } from 'lucide-react';
import { IndexMovementTriangle } from '@/components/explore-tab-new/friendRoundParts';
import { resolveChrome, type ChromeSpec, type ChromeTone } from './registry';
import { useChromeLeftOverride, useChromeLeftSlot, useChromeSuppressed } from './leftOverride';
import { Z } from '@/config/zIndex';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useActorUnreadCounts } from '@/hooks/useActorUnreadCounts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useWhsConnection, useHandicapTrend, useHandicapHistory } from '@/lib/whs/hooks';
import { safeGoBack } from '@/utils/navigation';
import { subscribeIslandEdge, getIslandEdgeScrolled } from './islandEdge';

const ISLAND_H = 44;
const TOP_GAP = 10;
const HEADER_H = 70; // 10 gap + 44 island + 16 canon islandClearance

const LOGO_SRC = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';

const HCP_IMPROVING = '#16a34a';
const HCP_DRIFTING = '#dc2626';

// ---------------------------------------------------------------------------
// Last-change arrow (BRIEF_CHIP_LAST_CHANGE)
// ---------------------------------------------------------------------------
// The chip's arrow describes the member's MOST RECENT index movement — the
// difference between the current value and the distinct value before it — not a
// 90-day verdict. A quarter that drifted up must not contradict an index that
// fell at the weekend.
//
// Source: the existing whsKeys.history query with 'all' (already warm in cache
// from other handicap surfaces), so no new query and no window guesswork on the
// fetch side. Staleness is applied in memory instead: movements land a median
// 4.75 days apart (p75 11d, p90 16d), so a 30-day recency window covers an
// ordinary gap between counting rounds without narrating a dormant season.
const HCP_MOVE_MAX_AGE_DAYS = 30;
const HCP_MOVE_EPSILON = 0.05;

type HcpMove = 'improving' | 'drifting' | 'none';

function lastIndexMove(
  history: { observed_at: string; handicap_index: number }[] | undefined,
): HcpMove {
  if (!history || history.length < 2) return 'none';
  // history is ascending; walk back to the first point that differs from the
  // latest value — that boundary is the last actual change.
  const latest = history[history.length - 1];
  const current = Number(latest.handicap_index);
  if (!Number.isFinite(current)) return 'none';

  for (let i = history.length - 2; i >= 0; i--) {
    const prev = Number(history[i].handicap_index);
    if (!Number.isFinite(prev)) continue;
    if (Math.abs(prev - current) < HCP_MOVE_EPSILON) continue;

    // The movement happened at history[i + 1] — the first point holding the
    // current value after the previous one.
    const movedAt = new Date(history[i + 1].observed_at).getTime();
    const ageDays = (Date.now() - movedAt) / 86_400_000;
    if (!Number.isFinite(ageDays) || ageDays > HCP_MOVE_MAX_AGE_DAYS) return 'none';

    return current < prev ? 'improving' : 'drifting';
  }

  return 'none';
}

function glassStyle(tone: ChromeTone): React.CSSProperties {
  const isLight = tone === 'light';
  return {
    height: ISLAND_H,
    borderRadius: 999,
    background: isLight ? 'rgba(255,255,255,0.72)' : 'rgba(20,22,28,0.72)',
    border: isLight
      ? '1px solid rgba(0,0,0,0.06)'
      : '1px solid rgba(255,255,255,0.12)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    pointerEvents: 'auto',
    display: 'flex',
    alignItems: 'center',
  };
}

function inkFor(tone: ChromeTone): string {
  return tone === 'light' ? '#0F172A' : '#FFFFFF';
}

// ---------------------------------------------------------------------------
// Left capsule
// ---------------------------------------------------------------------------
const LeftCapsule: React.FC<{
  spec: ChromeSpec;
  override: ReturnType<typeof useChromeLeftOverride>;
  slot: ReturnType<typeof useChromeLeftSlot>;
}> = ({ spec, override, slot }) => {
  const navigate = useNavigate();
  const tone = spec.tone;

  // Slot wins over back-override AND the registry rule.
  if (slot) {
    return (
      <div
        style={{
          ...glassStyle(tone),
          padding: '0 14px 0 13px',
        }}
      >
        {slot}
      </div>
    );
  }

  // Override wins over the registry rule (when non-null).
  if (spec.left?.kind === 'back' || override) {
    const registryLeft =
      spec.left?.kind === 'back' ? spec.left : null;
    const title = registryLeft?.title ?? null;
    const backTarget =
      override?.backTarget ?? registryLeft?.backTarget ?? 'history';
    const backFallback =
      override?.backFallback ?? registryLeft?.backFallback;

    const onBack = () => {
      if (backTarget === 'history') {
        if (backFallback) safeGoBack(navigate, backFallback);
        else navigate(-1);
      } else {
        navigate(backTarget);
      }
    };

    return (
      <button
        type="button"
        onClick={onBack}
        aria-label={title ? `Back to ${title}` : 'Go back'}
        style={{
          ...glassStyle(tone),
          padding: '0 16px 0 12px',
          gap: 8,
          border: glassStyle(tone).border,
          cursor: 'pointer',
        }}
      >
        <ArrowLeft size={18} color={inkFor(tone)} strokeWidth={2.4} />
        {title != null && (
          <span
            style={{
              fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
              fontWeight: 700,
              fontSize: 14,
              color: inkFor(tone),
              letterSpacing: '-0.005em',
            }}
          >
            {title}
          </span>
        )}
      </button>
    );
  }


  // Default: logo. Match CompactHeader.handleLogoClick non-back branch:
  // navigate('/clubhouse'). (Brief said '/watch'; the source of truth is
  // CompactHeader — see report.)
  return (
    <button
      type="button"
      onClick={() => navigate('/clubhouse')}
      aria-label="Go to home"
      style={{
        ...glassStyle(tone),
        padding: '0 12px',
        cursor: 'pointer',
      }}
    >
      <img
        src={LOGO_SRC}
        alt="clbhouz"
        style={{
          height: 26,
          width: 26,
          objectFit: 'contain',
          // The amber mark is the brand on EVERY tone — never inverted to white.
        }}

      />
    </button>
  );
};

// ---------------------------------------------------------------------------
// HCP cell — owns BOTH the divider and the chip, because whatever governs the
// chip's visibility must govern the divider (an empty capsule with a stranded
// 1px rule is worse than either state).
//
// Visibility:
//   - logged-out user            -> render nothing
//   - business actor             -> render nothing
//   - not SETTLED                -> render nothing
//   - hide_handicap_chip         -> render nothing
//   - !connection / no index     -> disconnected pill (Connect HCP)
//   - connected                  -> index + optional trend arrow
//
// UNRESOLVED IS NOT ABSENT. Every query here is id-gated (profile and
// connection on the session's user id, trend on the connection id), and a
// DISABLED React Query v5 query is pending with fetchStatus 'idle' — so
// `isLoading` is FALSE before it has ever run. Gating on `!isLoading` therefore
// read `connection === undefined` as "disconnected" and `profile === undefined`
// as "chip not hidden", and painted the amber Connect HCP pill at connected
// members and at members who had hidden the chip. The trend query is CHAINED
// behind the connection, so it must be waited on too — otherwise the pill flips
// back to "Connect HCP" for the length of a second round trip.
//
// Width: nothing is reserved while unsettled — no ghost, no placeholder — so
// the capsule never holds the wide "Connect HCP" label when the index is short.
// The gain is that it resizes ONCE, when the answer is known.
// ---------------------------------------------------------------------------
const HCP_RESERVE_LABEL = 'Connect HCP';
const HCP_LABEL_TYPE: React.CSSProperties = {
  fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontSize: 11.5,
  fontWeight: 700,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

/** Grid wrapper that reserves the widest outcome's width for its child. */
const HcpDivider: React.FC<{ color: string }> = ({ color }) => (
  <span aria-hidden style={{ width: 1, height: 18, background: color, flexShrink: 0 }} />
);

const HcpCell: React.FC<{ tone: ChromeTone; dividerColor: string }> = ({ tone, dividerColor }) => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const isBusinessActor = activeActor?.type === 'business';
  const { data: profile, isFetched: profileFetched, isError: profileError } = useUserProfile(user?.id);

  const { data: connection, isFetched: connFetched, isError: connError } = useWhsConnection(user?.id);
  const { data: trendData, isFetched: trendFetched, isError: trendError } = useHandicapTrend(connection?.id);
  const { data: hcpHistory } = useHandicapHistory(connection?.id, 'all');
  const lastMove = lastIndexMove(hcpHistory as any);

  // An errored query must not hang the cell on nothing forever: treat error as
  // settled and fall through to the disconnected pill (mirrors WhsHandicapTab).
  const anyError = profileError || connError || trendError;
  const settled =
    anyError ||
    // eslint-disable-next-line settled/no-not-loading-empty-check -- the expression already requires profileFetched, connFetched and trendFetched.
    (!sessionLoading && profileFetched && connFetched && (!connection || trendFetched));

  if (!user) return null;
  if (isBusinessActor) return null;
  if (!settled) return null;
  if (profile?.hide_handicap_chip) return null;


  const body = (() => {


    const disconnected = !connection || trendData?.current == null;

    if (disconnected) {
      return (
        <button
          type="button"
          onClick={() => navigate('/manage/handicap')}
          aria-label="Connect handicap"
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            color: '#F7931E',
            ...HCP_LABEL_TYPE,
          }}
        >
          {HCP_RESERVE_LABEL}
        </button>
      );
    }

    const indexValue = Number(trendData!.current).toFixed(1);
    const direction = lastMove;
    const showArrow = direction === 'improving' || direction === 'drifting';
    const arrowColor = direction === 'improving' ? HCP_IMPROVING : HCP_DRIFTING;
    const triangleDir = direction === 'improving' ? 'down' : 'up';

    return (
      <button
        type="button"
        onClick={() => navigate('/handicap')}
        aria-label={`Handicap ${indexValue}`}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 12.5,
            color: inkFor(tone),
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.01em',
          }}
        >
          {indexValue}
        </span>
        {showArrow && (
          <IndexMovementTriangle
            direction={triangleDir}
            color={arrowColor}
            size={7}
          />
        )}
      </button>
    );
  })();

  return (
    <>
      <HcpDivider color={dividerColor} />
      {body}
    </>
  );

};


// ---------------------------------------------------------------------------
// Avatar cell — trigger for PostingAsMenu (identical wiring to CompactHeader)
// ---------------------------------------------------------------------------
const AvatarCell: React.FC<{
  tone: ChromeTone;
  onOpen: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}> = ({ tone, onOpen, triggerRef }) => {
  const { activeActor, isLoading } = useActiveActor();
  const { countFor } = useActorUnreadCounts();

  const activeUnread = activeActor
    ? countFor(activeActor.type as 'personal' | 'business', activeActor.id)
    : 0;
  const activeUnreadCount = activeUnread;

  if (isLoading || !activeActor) {
    return (
      <div
        aria-hidden
        style={{
          width: 34,
          height: 34,
          borderRadius: '34%',
          background: tone === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.08)',
        }}
      />
    );
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={onOpen}
      aria-label="Open profile menu"
      style={{
        position: 'relative',
        width: 34,
        height: 34,
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ display: 'inline-flex', borderRadius: '34%' }}>
        <SquircleAvatar
          size={34}
          src={activeActor.avatarUrl}
          alt={activeActor.name}
          userId={activeActor.id}
          hairlineRing
        />
      </span>
      {activeUnreadCount > 0 ? (
        <span
          aria-label={`${activeUnreadCount} unread`}
          style={{
            position: 'absolute',
            top: -3,
            right: -3,
            minWidth: 12,
            height: 12,
            padding: '0 3px',
            borderRadius: 999,
            background: '#F7931E',
            color: '#FFFFFF',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 700,
            fontSize: 8,
            lineHeight: '12px',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            border: '1px solid #FFFFFF',
            boxSizing: 'content-box',
          }}
        >
          {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
        </span>
      ) : null}
    </button>
  );
};

// ---------------------------------------------------------------------------
// ChromeIsland (root)
// ---------------------------------------------------------------------------
export const ChromeIsland: React.FC<{ hidden?: boolean }> = ({ hidden = false }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseSession();
  const spec = resolveChrome(location.pathname, searchParams);
  const leftOverride = useChromeLeftOverride();
  const leftSlot = useChromeLeftSlot();
  const runtimeSuppressed = useChromeSuppressed();

  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);

  // Cross-surface trigger: allow non-chrome components (e.g. FriendsEmptyState)
  // to open the search overlay via a window event, without lifting state.
  useEffect(() => {
    const openHandler = () => setSearchOpen(true);
    window.addEventListener('clbhouz:open-search', openHandler);
    return () => window.removeEventListener('clbhouz:open-search', openHandler);
  }, []);

  // A1: never let the profile sheet (or search overlay) survive a route change.
  // Any tap that navigates from inside the sheet must close it here even if the
  // caller forgets to invoke onClose before navigate().
  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);


  const edgeScrolled = React.useSyncExternalStore(
    subscribeIslandEdge,
    getIslandEdgeScrolled,
    () => false,
  );

  const suppressed = hidden || runtimeSuppressed || spec.chrome === 'none';
  // bleed island routes let the page own top padding — publish 0 so content
  // flows under the island rather than being pushed down another 64px.
  const headerH =
    suppressed ? 0 : spec.bleed && spec.chrome === 'island' ? 0 : HEADER_H;

  // Publish --header-h just like CompactHeader does.
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--header-h', `${headerH}px`);
  }, [headerH]);

  if (suppressed) return null;

  const tone = spec.tone;
  const dividerColor =
    tone === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)';


  return (
    <>

      <div
        data-chrome="island"
        style={{
          // scrollAway routes render the capsules in document flow (absolute),
          // so they ride away with the page and return on scroll-up. All
          // other routes keep the classic fixed island.
          position: spec.scrollAway ? 'absolute' : 'fixed',
          top: 'calc(var(--sat, 0px) + 10px)',
          left: 12,
          right: 12,
          zIndex: Z.header,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 8,
          pointerEvents: 'none',
        }}
      >
        {/* LEFT capsule */}
        <LeftCapsule spec={spec} override={leftOverride} slot={leftSlot} />


        {/* RIGHT capsule */}
        <div
          style={{
            ...glassStyle(tone),
            padding: '0 5px 0 13px',
            gap: 9,
            position: 'relative',
          }}
        >
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            <Search size={14} color={inkFor(tone)} strokeWidth={2.4} />
          </button>

          {/* HcpCell renders its own leading divider so the rule can never be
              stranded when the chip is hidden. */}
          {!spec.hideHcp && <HcpCell tone={tone} dividerColor={dividerColor} />}



          <AvatarCell
            tone={tone}
            triggerRef={avatarRef}
            onOpen={() => setMenuOpen((v) => !v)}
          />
        </div>
      </div>

      {/* Controlled host — identical to CompactHeader wiring */}
      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          useLightTheme={tone === 'light'}
          anchorRef={avatarRef}
        />
      )}

      <SearchOverlayV2
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
};

export default ChromeIsland;
