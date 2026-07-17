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
 *   - Handicap cell: useWhsConnection + useHandicapTrend + useHandicapTrend90d
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

import React, { useState, useRef, useLayoutEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { Search, ArrowLeft, TrendingDown, TrendingUp } from 'lucide-react';
import { resolveChrome, type ChromeSpec, type ChromeTone } from './registry';
import { useChromeLeftOverride, useChromeLeftSlot, useChromeSuppressed } from './leftOverride';
import { Z } from '@/config/zIndex';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useActiveActor } from '@/context/ActiveActorContext';
import { useActorUnreadCounts } from '@/hooks/useActorUnreadCounts';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useWhsConnection, useHandicapTrend } from '@/lib/whs/hooks';
import { useHandicapTrend90d } from '@/hooks/useHandicapTrend90d';
import { safeGoBack } from '@/utils/navigation';

const ISLAND_H = 44;
const TOP_GAP = 10;
const HEADER_H = 70; // 10 gap + 44 island + 16 canon islandClearance

const LOGO_SRC = '/lovable-uploads/29e83040-b5c5-48e4-84d7-3f99640e4a80.png';

const HCP_IMPROVING = '#16a34a';
const HCP_DRIFTING = '#dc2626';

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
              fontFamily: 'Geist, system-ui, sans-serif',
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
          // On dark chrome the mark is inverted to white (CompactHeader keeps
          // the amber mark on light and uses the same asset over dark surfaces
          // by force; mirror that behavior here).
          filter: tone === 'dark' ? 'brightness(0) invert(1)' : 'none',
        }}
      />
    </button>
  );
};

// ---------------------------------------------------------------------------
// HCP cell — visibility mirrors HandicapChip:
//   - logged-out user      -> render nothing
//   - !user (business)     -> render nothing (HandicapChip returns null too)
//   - whsLoading           -> fixed-width skeleton
//   - !connection          -> disconnected pill (Connect HCP)
//   - connection & no idx  -> disconnected pill
//   - connected            -> index + optional trend arrow
// ---------------------------------------------------------------------------
const HcpCell: React.FC<{ tone: ChromeTone }> = ({ tone }) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor } = useActiveActor();
  const isBusinessActor = activeActor?.type === 'business';

  const { data: connection, isLoading: whsLoading } = useWhsConnection(user?.id);
  const { data: trendData } = useHandicapTrend(connection?.id);
  const trend = useHandicapTrend90d(connection?.id);

  if (!user) return null;
  if (isBusinessActor) return null;

  if (whsLoading) {
    return (
      <div
        aria-hidden
        style={{
          width: 28,
          height: 14,
          borderRadius: 4,
          background: tone === 'light' ? 'rgba(15,23,42,0.06)' : 'rgba(255,255,255,0.08)',
        }}
      />
    );
  }

  const disconnected =
    !connection || trendData?.current == null;

  if (disconnected) {
    return (
      <button
        type="button"
        onClick={() => navigate('/handicap')}
        aria-label="Connect handicap"
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
          fontFamily: 'Geist, system-ui, sans-serif',
          fontSize: 11.5,
          fontWeight: 700,
          color: '#F7931E',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
      >
        Connect HCP
      </button>
    );
  }

  const indexValue = Number(trendData!.current).toFixed(1);
  const direction = trend.direction;
  const showArrow = direction === 'improving' || direction === 'drifting';
  const arrowColor = direction === 'improving' ? HCP_IMPROVING : HCP_DRIFTING;
  const ArrowIcon = direction === 'improving' ? TrendingDown : TrendingUp;

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
        fontFamily: 'Geist, system-ui, sans-serif',
      }}
    >
      <span
        style={{
          fontWeight: 800,
          fontSize: 12.5,
          color: inkFor(tone),
          fontVariantNumeric: 'tabular-nums',
          letterSpacing: '-0.01em',
        }}
      >
        {indexValue}
      </span>
      {showArrow && (
        <ArrowIcon size={8} color={arrowColor} strokeWidth={3} />
      )}
    </button>
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
  const { otherUnreadTotal, countFor } = useActorUnreadCounts();

  const activeUnread = activeActor
    ? countFor(activeActor.type as 'personal' | 'business', activeActor.id)
    : 0;
  const activeUnreadCount = activeUnread;
  const showOtherDot = activeUnread === 0 && otherUnreadTotal > 0;

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
            top: -6,
            right: -6,
            minWidth: 18,
            height: 18,
            padding: '0 5px',
            borderRadius: 999,
            background: '#F7931E',
            color: '#FFFFFF',
            fontFamily: 'Geist, system-ui, sans-serif',
            fontWeight: 700,
            fontSize: 10,
            lineHeight: '18px',
            textAlign: 'center',
            fontVariantNumeric: 'tabular-nums',
            border: '2px solid #FFFFFF',
            boxSizing: 'content-box',
          }}
        >
          {activeUnreadCount > 99 ? '99+' : activeUnreadCount}
        </span>
      ) : showOtherDot ? (
        <span
          aria-label="Unread on another account"
          style={{
            position: 'absolute',
            top: -6,
            right: -6,
            width: 8,
            height: 8,
            borderRadius: 999,
            background: '#F7931E',
            border: '2px solid #FFFFFF',
            boxSizing: 'content-box',
          }}
        />
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

          {!spec.hideHcp && (
            <>
              <span
                aria-hidden
                style={{
                  width: 1,
                  height: 18,
                  background: dividerColor,
                  flexShrink: 0,
                }}
              />
              <HcpCell tone={tone} />
            </>
          )}


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
