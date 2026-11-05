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
 *     publishes --header-h: 72 (10 top gap + 46 island + 16 breathing).
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
 * HEADER_B1: route registry owns opt-in soft fade/glass; both islands consume
 * useIslandsCondensed; divider stays owned by HcpCell to preserve visibility.
 * Home-nation glass rules: every glass surface publishes BOTH
 * backdropFilter and WebkitBackdropFilter. Squircles use 34% radius.
 */

import React, { useState, useRef, useLayoutEffect, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { resolveChrome, type ChromeSpec, type ChromeTone } from './registry';
import { useChromeLeftOverride, useChromeLeftSlot, useChromeSuppressed } from './leftOverride';
import { Z } from '@/config/zIndex';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useActorUnreadCounts } from '@/hooks/useActorUnreadCounts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useHandicapHistory } from '@/lib/whs/hooks';
import { useOwnHandicapState } from '@/lib/whs/useOwnHandicapState';
import { ProLabel } from '@/features/pro-verification/ProLabel';
import { proIslandCaption } from '@/features/pro-verification/proRules';
import '@/features/pro-verification/pro-status-controls.css';
import { useIslandsCondensed } from './useIslandsCondensed';
import { IslandBackCapsule } from './IslandBackCapsule';
import { IndexGlance } from './IndexGlance';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { ConnectGlance } from './ConnectGlance';
import { ISLAND_GLASS } from '@/lib/tokens/glass';
import { Button } from '@/components/ui/button';
import { A } from '@/features/courses/components/holes/analytical/tokens';
import { useIsGuest } from '@/features/guest/useIsGuest';
import { openGuestCard, surfaceForPath } from '@/features/guest/guestGateStore';
import { GUEST_ISLAND_COPY } from '@/features/guest/guestCopy';
import { trackGuestGateShown } from '@/features/guest/guestAnalytics';
export { ISLAND_GLASS } from '@/lib/tokens/glass';

import { safeGoBack } from '@/utils/navigation';
import { subscribeIslandEdge, getIslandEdgeScrolled } from './islandEdge';
import {
  CHROME_BREATHING,
  CHROME_CLEARANCE_VAR,
  CHROME_ISLAND_H_FALLBACK,
  CHROME_ISLAND_H_VAR,
  CHROME_TOP_GAP,
} from '@/lib/chromeClearance';

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const ISLAND_H = 46;
const TOP_GAP = 10;
const HEADER_H = 72; // 10 gap + 46 island + 16 canon islandClearance

/** Shared dark glass material for controls that visually belong to the chrome islands. */
export const DARK_CHROME_GLASS_MATERIAL: React.CSSProperties = {
  background: 'rgba(20,22,28,0.72)',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
};

export const CHROME_LOGO_SRC = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';

// Move colours (BRIEF_ISLANDS_NAV §1): improving is the existing LIVE_INK token.
const HCP_IMPROVING = '#34D77F';
const HCP_DRIFTING = '#FF5A4E';

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

export type HcpMove = 'improving' | 'drifting' | 'none';

export interface HcpMoveDetail {
  direction: HcpMove;
  /** |current − the previous distinct value|, null when direction is 'none'. */
  size: number | null;
  /** When the last move landed (ms epoch), null when direction is 'none'. */
  movedAt: number | null;
}

const NO_MOVE: HcpMoveDetail = { direction: 'none', size: null, movedAt: null };

export function lastIndexMove(
  history: { observed_at: string; handicap_index: number }[] | undefined,
): HcpMoveDetail {
  if (!history || history.length < 2) return NO_MOVE;
  // history is ascending; walk back to the first point that differs from the
  // latest value — that boundary is the last actual change.
  const latest = history[history.length - 1];
  const current = Number(latest.handicap_index);
  if (!Number.isFinite(current)) return NO_MOVE;

  for (let i = history.length - 2; i >= 0; i--) {
    const prev = Number(history[i].handicap_index);
    if (!Number.isFinite(prev)) continue;
    if (Math.abs(prev - current) < HCP_MOVE_EPSILON) continue;

    // The movement happened at history[i + 1] — the first point holding the
    // current value after the previous one.
    const movedAt = new Date(history[i + 1].observed_at).getTime();
    const ageDays = (Date.now() - movedAt) / 86_400_000;
    if (!Number.isFinite(ageDays) || ageDays > HCP_MOVE_MAX_AGE_DAYS) return NO_MOVE;

    return {
      direction: current < prev ? 'improving' : 'drifting',
      size: Math.abs(current - prev),
      movedAt,
    };
  }

  return NO_MOVE;
}

function glassStyle(tone: ChromeTone, squircle = false): React.CSSProperties {
  const isLight = tone === 'light';
  return {
    height: ISLAND_H,
    // ISLAND_SQUIRCLE_1: condense routes ('/', '/clubhouse', '/tourhub') take the
    // 34% squircle (16px of 46) at rest AND folded; every other route stays round.
    borderRadius: squircle ? 16 : 23,
    // Light-tone routes keep their current colours and take only the new
    // geometry (BRIEF_ISLANDS_NAV §SHARED GLASS); dark uses ISLAND_GLASS.
    ...(isLight ? {
      background: 'rgba(255,255,255,0.72)',
      border: '1px solid rgba(0,0,0,0.06)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      boxShadow: '0 4px 20px rgba(0,0,0,0.10)',
    } : ISLAND_GLASS),
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
  const location = useLocation();
  const condensed = useIslandsCondensed();
  const tone = spec.tone;

  // Slot wins over back-override AND the registry rule.
  if (slot) {
    // A slot element may ask the capsule to fill the row by carrying
    // data-island-grow. Content-sized slots (Tour Hub's burger + picker) must
    // NOT grow, or the glass would run empty to the right; a slot holding a
    // text field (college hub) must, so the field can span to the right
    // capsule. The marker keeps that a per-slot decision, not a global flip.
    const grow =
      React.isValidElement(slot) && (slot.props as Record<string, unknown>)['data-island-grow'] === true;
    // data-island-flush: the slot owns the capsule's padding entirely
    // (BRIEF_TOUR_ISLAND — the Tour island's signed-off padding is the whole
    // control, so the capsule adds none of its own).
    const flush =
      React.isValidElement(slot) && (slot.props as Record<string, unknown>)['data-island-flush'] === true;
    return (
      <div
        data-island-left
        style={{
          ...glassStyle(tone, spec.condense === true),
          ...(spec.condense ? { background: condensed ? ISLAND_GLASS.background : 'rgba(14,14,16,0.55)', transition: REDUCED_MOTION ? 'none' : 'var(--island-glass-transition)' } : {}),
          padding: flush ? 0 : grow ? '0 8px 0 10px' : '0 14px 0 13px',
          ...(grow ? { flex: '1 1 auto', minWidth: 0 } : null),
          ...(location.pathname === '/tourhub' ? { minWidth: 0, overflow: 'hidden' } : {}),
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

    if (spec.condense) return <IslandBackCapsule onBack={onBack} label={title ? `Back to ${title}` : 'Go back'} staticTitle={title} />;

    return (
      <button
        type="button"
        onClick={onBack}
        aria-label={title ? `Back to ${title}` : 'Go back'}
        style={{
          ...glassStyle(tone, spec.condense === true),
          padding: '0 16px 0 12px',
          gap: 8,
          border: glassStyle(tone, spec.condense === true).border,
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


  // Default: logo. On '/' and '/clubhouse' the tap scrolls the feed to the
  // top via the SAME clbhouz-active-tab-retap event the Home tab sends;
  // everywhere else it keeps the CompactHeader non-back branch:
  // navigate('/clubhouse'). (Brief said '/watch'; the source of truth is
  // CompactHeader — see report.)
  const showWordmark = spec.condense === true && spec.left?.kind === 'logo';
  const showWordmarkNow = showWordmark && !condensed;
  const onLogoTap = () => {
    if (location.pathname === '/' || location.pathname === '/clubhouse') {
      window.dispatchEvent(new CustomEvent('clbhouz-active-tab-retap', { detail: { tabId: 'clubhouse' } }));
      return;
    }
    navigate('/clubhouse');
  };
  return (
    <button
      type="button"
      onClick={onLogoTap}
      aria-label="Go to home"
      style={{
        ...glassStyle(tone, spec.condense === true),
        ...(spec.condense ? { background: condensed ? ISLAND_GLASS.background : 'rgba(14,14,16,0.55)', transition: REDUCED_MOTION ? 'none' : 'var(--island-glass-transition), var(--island-fold-transition)' } : {}),
        padding: showWordmarkNow ? '0 15px 0 11px' : '0 7px',
        gap: showWordmarkNow ? 9 : 0,
        cursor: 'pointer',
      }}
    >
      <img
        src={CHROME_LOGO_SRC}
        alt="clbhouz"
        style={{ height: 30, width: 30, objectFit: 'contain', flexShrink: 0 }}
      />
      {showWordmark && (
        <img
          src="/brand/clbhouz-wordmark-white@3x.png"
          alt="clbhouz"
          style={{
            display: 'block',
            height: 20,
            width: 'auto',
            opacity: showWordmarkNow ? 1 : 0,
            // Snap under reduced motion; otherwise the wordmark fades in over 180ms.
            transition: REDUCED_MOTION ? 'none' : 'var(--island-fold-transition)',
            // Keep the island logo-sized until the wordmark appears.
            maxWidth: showWordmarkNow ? 64 : 0,
          }}
        />
      )}
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
/** The 1px rule between the search glyph and the index cell. */
const HcpDivider: React.FC<{ color: string; fold?: boolean; condensed?: boolean }> = ({ color, fold, condensed }) => (
  <span aria-hidden data-island-divider style={{ width: 1, height: 20, background: color, flexShrink: 0, ...(fold ? { maxWidth: condensed ? 0 : 1, opacity: condensed ? 0 : 1, marginRight: condensed ? -10 : 0, transition: REDUCED_MOTION ? 'none' : 'var(--island-fold-transition)' } : {}) }} />
);

export const HcpCell: React.FC<{ tone: ChromeTone; dividerColor: string; fold?: boolean; condensed?: boolean }> = ({ tone, dividerColor, fold, condensed }) => {
  const navigate = useNavigate();
  const { user, loading: sessionLoading } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const isBusinessActor = activeActor?.type === 'business';
  const { data: profile, isFetched: profileFetched, isError: profileError } = useUserProfile(user?.id);
  const [glanceOpen, setGlanceOpen] = useState(false);
  const indexButtonRef = useRef<HTMLButtonElement>(null);

  // Shared connection authority; only this island opts into profile-owned pro
  // readiness because it never displays request pending/declined/review details.
  const hcp = useOwnHandicapState(user?.id, { island: true });
  const connection = hcp.connection;
  const trendData = hcp.trend;
  const { data: hcpHistory } = useHandicapHistory(connection?.id, 'all');
  const lastMove = lastIndexMove(hcpHistory as any);

  // An errored query must not hang the cell on nothing forever: treat error as
  // settled and fall through to the disconnected pill (mirrors WhsHandicapTab).
  const anyError = profileError || hcp.anyError;
  const settled =
    (anyError && hcp.settled) ||
    // eslint-disable-next-line settled/no-not-loading-empty-check -- the expression already requires profileFetched and the shared hook's own settled flag.
    (!sessionLoading && profileFetched && hcp.settled);

  if (!user) return null;
  if (isBusinessActor) return null;
  if (!settled) return null;
  if (hcp.pro) return <><HcpDivider color={dividerColor} fold={fold} condensed={condensed} /><Button variant="ghost" className="pro-island-cell" aria-label="Your profile" onClick={() => navigate('/profile')}><ProLabel size="small" /><span className="pro-island-detail">{proIslandCaption(hcp.proKind, hcp.proTour)}</span></Button></>;
  if (hcp.proPending) return null;
  if (profile?.hide_handicap_chip) return null;


  const body = (() => {


    const disconnected = !hcp.linked;


    if (disconnected) {
      return <>
        <button ref={indexButtonRef} type="button" onClick={() => setGlanceOpen(true)} aria-label="Connect your handicap"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#F7931E', fontSize: 14, fontWeight: 700 }}>
            <svg aria-hidden width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round"><path d="M12 5v14 M5 12h14" /></svg>
            Connect
          </span>
          <span style={{ marginTop: 4, fontSize: 8.5, fontWeight: 700, letterSpacing: '0.12em', color: 'rgba(248,250,252,0.42)' }}>HANDICAP</span>
        </button>
        {glanceOpen && <ConnectGlance onClose={() => setGlanceOpen(false)} anchorRef={indexButtonRef} userId={user.id} />}
      </>;
    }

    if (hcp.linked && !hcp.connected) {
      return <Button variant="ghost" className="h-auto rounded-none p-0" onClick={() => navigate('/manage/handicap')} aria-label="Manage your handicap"
        style={{ background: 'none', border: 'none', padding: 0, display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1, gap: 0 }}>
        <span style={{ fontWeight: 700, fontSize: 16, color: A.MUTE, fontVariantNumeric: 'tabular-nums' }}>—</span>
        <span style={{ fontWeight: 700, fontSize: 8.5, letterSpacing: '0.12em', color: tone === 'light' ? 'rgba(15,23,42,0.42)' : 'rgba(248,250,252,0.42)', marginTop: 3 }}>INDEX</span>
      </Button>;
    }

    if (!trendData) return null;
    const indexValue = Number(trendData.current).toFixed(1);
    const showMove = lastMove.direction !== 'none' && lastMove.size != null;
    const moveColor = lastMove.direction === 'improving' ? HCP_IMPROVING : HCP_DRIFTING;

    // Two-line index cell (BRIEF_ISLANDS_NAV §1): index + last move on line 1,
    // the INDEX caption 3px below. Tapping opens the IndexGlance — it no
    // longer navigates. ("Connect HCP" above still navigates.)
    return (
      <>
        <button
          ref={indexButtonRef}
          type="button"
          onClick={() => setGlanceOpen(true)}
          aria-label={`Handicap index ${indexValue}`}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            lineHeight: 1,
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
            <span
              style={{
                fontWeight: 700,
                fontSize: 16,
                color: inkFor(tone),
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {indexValue}
            </span>
            {showMove && (
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 11,
                  color: moveColor,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {lastMove.direction === 'improving' ? '▾' : '▴'}{lastMove.size?.toFixed(1)}
              </span>
            )}
          </span>
          <span
            style={{
              fontWeight: 700,
              fontSize: 8.5,
              letterSpacing: '0.12em',
              color: tone === 'light' ? 'rgba(15,23,42,0.42)' : 'rgba(248,250,252,0.42)',
              marginTop: 3,
            }}
          >
            INDEX
          </span>
        </button>
        {glanceOpen && connection && (
          <IndexGlance
            onClose={() => setGlanceOpen(false)}
            anchorRef={indexButtonRef}
            connectionId={connection.id}
            currentIndex={Number(trendData.current)}
            move={lastMove}
          />
        )}
      </>
    );
  })();

  return (
    <>
      <HcpDivider color={dividerColor} fold={fold} condensed={condensed} />
      {body}
    </>
  );

};


// ---------------------------------------------------------------------------
// Avatar cell — trigger for PostingAsMenu (identical wiring to CompactHeader)
// ---------------------------------------------------------------------------
export const AvatarCell: React.FC<{
  tone: ChromeTone;
  onOpen: () => void;
  isOpen?: boolean;
  triggerRef: React.RefObject<HTMLButtonElement>;
}> = ({ tone, onOpen, isOpen = false, triggerRef }) => {
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
          width: 36,
          height: 36,
          borderRadius: '34%',
          background: tone === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.08)',
        }}
      />
    );
  }

  // Explicit island amber-ring exception; SquircleAvatar owns image/fallback.
  // Its border is inside the CSS width. Override the slight height overhang
  // locally so the outer box remains exactly 36 × 36 without clipping.
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={onOpen}
      aria-label="Open profile menu"
      aria-expanded={isOpen}
      style={{
        position: 'relative',
        width: 36,
        height: 36,
        borderRadius: '34%',
        boxShadow: isOpen ? 'var(--account-open-ring)' : undefined,
        padding: 0,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SquircleAvatar src={activeActor.avatarUrl} alt={activeActor.name} userId={activeActor.id}
        size={36} ringWidth={1} ringColor="rgba(255,255,255,0.10)" className="[&>div:first-child]:!aspect-square" />
      {activeUnreadCount > 0 ? (
        <span
          aria-label={`${activeUnreadCount} unread`}
          style={{
            position: 'absolute',
            top: -2,
            right: -3,
            minWidth: 17,
            height: 17,
            padding: '0 3px',
            borderRadius: 9,
            background: '#F8FAFC',
            color: '#0A0A0C',
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            fontWeight: 800,
            fontSize: 9.5,
            lineHeight: '13px',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            border: '2px solid #0E0E10',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
        </span>
      ) : null}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Guest right capsule (GUEST BROWSING §2, signed-off mock frame 1): the
// member content (search, index, avatar) is replaced by "Log in" and a white
// "Join free" pill. GI1 opts only condense routes into member glass/folding;
// legacy routes retain their exact markup/styles and both actions stay owned here.
// ---------------------------------------------------------------------------
const GuestRightCapsule: React.FC<{ tone: ChromeTone; fold?: boolean; compact?: boolean }> = ({ tone, fold, compact = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const scrollCondensed = useIslandsCondensed();
  const condensed = compact || scrollCondensed;
  const folded = fold && condensed;
  const surface = surfaceForPath(location.pathname);
  return (
    <div
      data-island-right
      data-guest-island=""
      style={{
        ...glassStyle(tone),
        ...(location.pathname === '/tourhub' ? { flexShrink: 0 } : {}),
        padding: '0 6px 0 16px',
        gap: 12,
        position: 'relative',
        ...(fold ? {
          ...ISLAND_GLASS,
          borderRadius: 16,
          background: condensed ? ISLAND_GLASS.background : 'rgba(14,14,16,0.55)',
          padding: condensed ? '0 6px' : '0 6px 0 16px',
          gap: condensed ? 0 : 12,
          transition: REDUCED_MOTION ? 'none' : 'var(--island-glass-transition), var(--island-fold-transition)',
        } : {}),
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/auth')}
        aria-hidden={folded ? true : undefined}
        tabIndex={folded ? -1 : undefined}
        disabled={folded ? true : undefined}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 700,
          color: 'rgba(248,250,252,0.62)',
          ...(fold ? {
            maxWidth: condensed ? 0 : 80,
            opacity: condensed ? 0 : 1,
            flexShrink: 0,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            pointerEvents: condensed ? 'none' : 'auto',
            transition: REDUCED_MOTION ? 'none' : 'var(--island-fold-transition)',
          } : {}),
        }}
      >
        {GUEST_ISLAND_COPY.login}
      </button>
      <button
        type="button"
        onClick={() => {
          trackGuestGateShown({ surface, trigger: 'join_button' });
          openGuestCard({ kind: 'join_button', surface: surface ?? 'clubhouse' });
        }}
        style={{
          height: 34,
          padding: '0 16px',
          borderRadius: fold ? 12 : 17,
          background: '#F3F5F7',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          fontSize: 14,
          fontWeight: 700,
          color: '#0A0A0C',
        }}
      >
        {GUEST_ISLAND_COPY.join}
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// ChromeIsland (root)
// ---------------------------------------------------------------------------
export const ChromeIsland: React.FC<{ hidden?: boolean }> = ({ hidden = false }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useSupabaseSession();
  const isGuest = useIsGuest();
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
  // HEADER_B1 shares the bottom nav's direction signal, without a listener.
  const condensed = useIslandsCondensed();

  // FIX_OVERFLOW_1: only the right island opts into the existing fold at
  // narrow widths. Its media subscription never changes left/scroll state.
  const [compactRight, setCompactRight] = useState(() => window.matchMedia('(max-width: 340px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 340px)');
    const update = () => setCompactRight(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const rightFold = spec.condense === true || compactRight;
  const rightCondensed = compactRight || condensed;

  const suppressed = hidden || runtimeSuppressed || spec.chrome === 'none';
  // bleed island routes let the page own top padding — publish 0 so content
  // flows under the island rather than being pushed down another 64px.
  const headerH =
    suppressed ? 0 : spec.bleed && spec.chrome === 'island' ? 0 : HEADER_H;

  // Publish --header-h just like CompactHeader does.
  // SINGLE SAFE-AREA OWNER: the island pays env(safe-area-inset-top) (it sits
  // at calc(var(--sat) + 10px)) and publishes ONE sat-inclusive clearance
  // token. Pages under the island pad with --island-clearance and must never
  // add env(safe-area-inset-top) themselves. (--header-h stays sat-EXCLUSIVE
  // because ShellSlot/--chrome-total-h add --sat on top of it.)
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--header-h', `${headerH}px`);
    document.documentElement.style.setProperty(
      '--island-clearance',
      headerH === 0 ? '0px' : `calc(var(--sat, 0px) + ${headerH}px)`,
    );
  }, [headerH]);

  // THE ONE TOP CLEARANCE (src/lib/chromeClearance.ts). --header-h is 0 on
  // bleed routes by design (content flows under the island once scrolling), so
  // it cannot tell a page where its FIRST row belongs. This token can: the live
  // island row measures itself here, so every immersive surface that consumes
  // CHROME_CLEARANCE starts below the islands and moves on its own when they
  // grow or the notch changes. Nobody types a number into a page.
  const islandRowRef = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (suppressed || spec.chrome === 'none') {
      root.style.setProperty(CHROME_CLEARANCE_VAR, '0px');
      return;
    }
    const publish = (h: number) => {
      const measured = h > 0 ? h : CHROME_ISLAND_H_FALLBACK;
      root.style.setProperty(CHROME_ISLAND_H_VAR, `${measured}px`);
      root.style.setProperty(
        CHROME_CLEARANCE_VAR,
        `calc(var(--sat, 0px) + ${measured + CHROME_TOP_GAP + CHROME_BREATHING}px)`,
      );
    };
    const el = islandRowRef.current;
    publish(el?.getBoundingClientRect().height ?? 0);
    if (!el) return;
    // Observer writes are deferred a frame (FIX_RO_NOISE_1).
    let frame = 0;
    const ro = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect?.height ?? 0;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = 0; publish(h); });
    });
    ro.observe(el);
    return () => { ro.disconnect(); if (frame) cancelAnimationFrame(frame); };
  }, [suppressed, spec.chrome, spec.left?.kind, leftSlot]);


  if (suppressed) return null;

  const tone = spec.tone;
  const dividerColor =
    tone === 'light' ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.14)';

  return (
    <>
      {spec.scrim === 'soft' && (
        <div aria-hidden data-chrome="island-scrim-soft" style={{
          zIndex: Z.header - 1,
        }} />
      )}

      <div
        data-chrome="island"
        ref={islandRowRef}
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


        {/* RIGHT capsule — guests get Log in / Join free instead of the
            member content (search, index, avatar). */}
        {isGuest ? (
          <GuestRightCapsule tone={tone} fold={rightFold} compact={compactRight} />
        ) : (
        <div
          data-island-right
          style={{
            ...glassStyle(tone, rightFold),
            ...(location.pathname === '/tourhub' ? { flexShrink: 0 } : {}),
            ...(rightFold ? { background: rightCondensed ? ISLAND_GLASS.background : 'rgba(14,14,16,0.55)', transition: REDUCED_MOTION ? 'none' : 'var(--island-glass-transition)' } : {}),
            padding: '0 5px 0 12px',
            gap: 10,
            position: 'relative',
          }}
        >
          {/* Search cell — hidden on routes whose page owns a search field in
              the left capsule (spec.hideSearch). No divider belongs to it, so
              nothing is stranded when it goes. */}
          {!spec.hideSearch && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              aria-hidden={rightFold && rightCondensed ? true : undefined}
              tabIndex={rightFold && rightCondensed ? -1 : undefined}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                ...(rightFold ? { width: 19, flexShrink: 0, maxWidth: rightCondensed ? 0 : 19, opacity: rightCondensed ? 0 : 1, overflow: 'hidden', marginRight: rightCondensed ? -10 : 0, pointerEvents: rightCondensed ? 'none' : 'auto', transition: REDUCED_MOTION ? 'none' : 'var(--island-fold-transition)' } : {}),
              }}
            >
              {/* The signed-off magnifier: 19px, stroke 1.9 (mock's exact glyph,
                  not the lucide Search path). */}
              <svg
                width={19}
                height={19}
                viewBox="0 0 24 24"
                fill="none"
                stroke={inkFor(tone)}
                strokeWidth={1.9}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                style={{ display: 'block' }}
              >
                <circle cx={11} cy={11} r={7} />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>
          )}

          {/* HcpCell renders its own leading divider so the rule can never be
              stranded when the chip is hidden. */}
          {!spec.hideHcp && <HcpCell tone={tone} dividerColor={dividerColor} fold={rightFold} condensed={rightCondensed} />}



          <AvatarCell
            tone={tone}
            isOpen={menuOpen}
            triggerRef={avatarRef}
            onOpen={() => setMenuOpen((v) => !v)}
          />
        </div>
        )}
      </div>

      {/* Controlled host — identical to CompactHeader wiring. Guests never
          see the member menu; their capsule has no avatar trigger. */}
      {user && !isGuest && (
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
