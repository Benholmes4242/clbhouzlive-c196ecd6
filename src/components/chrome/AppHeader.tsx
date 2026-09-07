import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { GLASS_CHROME } from '@/components/media/GlassDurationBadge';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { useActiveActor } from '@/context/ActiveActorContext';
import { AvatarCell, CHROME_LOGO_SRC, HcpCell } from '@/features/chrome-v2/ChromeIsland';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { A, SANS } from '@/features/courses/components/holes/analytical/tokens';
import { DISCOVER_HEADER_Z } from '@/lib/zLayers';

/**
 * AppHeader — THE header band. ONE component, ONE substitution.
 *
 * BRIEF_TOUR_HEADER_CORRECTION, Correction 1. Discover and Tour do not each
 * own "a header that looks like the other one": they mount THIS component and
 * differ only in what they pass to `left`. On Discover that slot holds the
 * clbhouz mark (the default); on Tour it holds the glass burger. Everything
 * else — the 42px control row, the search / handicap / avatar cluster in that
 * order, the optional tab strip on the foot, the 1px A.BORDER — is shared
 * code and cannot drift.
 *
 * WHO PAYS THE SAFE AREA. `inset: 'self'` (Discover) means the header is fixed
 * and pays env(safe-area-inset-top) itself, because Discover's route is
 * immersive and `.app-shell` pays nothing. `inset: 'shell'` (Tour) means the
 * route is NOT in IMMERSIVE_ROUTE_PREFIXES, `.app-shell` already paid var(--sat)
 * once, and this header must NOT pay it again — it sticks in normal flow. The
 * band itself is pixel-identical in both modes; only who paid the notch differs.
 *
 * NO TITLE in the control row, ever. Identity is the left slot.
 */

export interface AppHeaderTab {
  id: string;
  label: string;
}

export interface AppHeaderProps {
  /** THE ONE SUBSTITUTION. Defaults to the clbhouz mark (Discover). */
  left?: ReactNode;
  /** Foot tab strip. Omit entirely when the surfaces are not tabbed siblings. */
  tabs?: ReadonlyArray<AppHeaderTab>;
  active?: string;
  onTabChange?: (id: string) => void;
  tabsAriaLabel?: string;
  /** Who paid the notch — see the header comment. */
  inset?: 'self' | 'shell';
  /** CSS custom property published with the measured band height. */
  heightVar?: string;
  /**
   * OVER-HERO MODE (opt-in, Amateur page). The band starts transparent so a
   * full-bleed hero runs under it, and cross-fades to the solid canvas as the
   * hero leaves. Omitted = the solid band every other surface already has.
   */
  overHero?: boolean;
  /** Scroll distance the cross-fade completes over. Default 180px. */
  overHeroRange?: number;
}



/** The Tour burger — glass values taken from GlassDurationBadge, not re-derived. */
export function AppHeaderBurger({ onTap, label }: { onTap: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onTap}
      style={{
        width: 32,
        height: 32,
        borderRadius: 999,
        display: 'grid',
        placeItems: 'center',
        padding: 0,
        border: 0,
        ...GLASS_CHROME,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Filled rects, equal widths — the nav icon set is filled throughout. */}
      <svg width="16" height="15" viewBox="0 0 16 15" aria-hidden focusable="false">
        <rect x="0" y="0.5" width="16" height="2" rx="2" fill="#fff" />
        <rect x="0" y="7" width="16" height="2" rx="2" fill="#fff" />
        <rect x="0" y="13.5" width="16" height="2" rx="2" fill="#fff" />
      </svg>
    </button>
  );
}

export function AppHeader({
  left,
  tabs,
  active,
  onTabChange,
  tabsAriaLabel = 'Sections',
  inset = 'self',
  heightVar = '--discover-header-h',
  overHero = false,
  overHeroRange = 180,

}: AppHeaderProps) {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { activeActor, isLoading } = useActiveActor();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const avatarRef = useRef<HTMLButtonElement>(null);
  const bandRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const el = bandRef.current;
    if (!el) return;
    const publish = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      document.documentElement.style.setProperty(heightVar, `${h}px`);
    };
    publish();
    const ro = new ResizeObserver(publish);
    ro.observe(el);
    const t = window.setTimeout(publish, 300);
    return () => {
      ro.disconnect();
      window.clearTimeout(t);
      document.documentElement.style.removeProperty(heightVar);
    };
  }, [heightVar, tabs]);

  const isSelf = inset === 'self';

  return (
    <>
      <header
        ref={bandRef}
        data-discover-header
        data-app-header
        style={{
          position: isSelf ? 'fixed' : 'sticky',
          top: isSelf ? 0 : 'var(--sat, env(safe-area-inset-top, 0px))',
          left: 0,
          right: 0,
          zIndex: DISCOVER_HEADER_Z,
          // 'self' pays the notch; 'shell' must not — .app-shell already did.
          paddingTop: isSelf ? 'env(safe-area-inset-top, 0px)' : 0,
          background: A.CANVAS,
          borderBottom: `1px solid ${A.BORDER}`,
          fontFamily: SANS,
        }}
      >
        <div style={{ position: 'relative', height: 42, display: 'flex', alignItems: 'center', padding: '0 12px' }}>
          {left ?? (
            <button
              type="button"
              aria-label="Go to Clubhouse"
              onClick={() => navigate('/clubhouse')}
              style={{ width: 36, height: 36, padding: 4, border: 0, background: 'transparent', cursor: 'pointer' }}
            >
              <img src={CHROME_LOGO_SRC} alt="clbhouz" style={{ width: 28, height: 28, borderRadius: 9, objectFit: 'contain' }} />
            </button>
          )}
          <div style={{ marginLeft: 'auto', height: 36, display: 'flex', alignItems: 'center', gap: 9 }}>
            <button
              type="button"
              aria-label="Search"
              onClick={() => setSearchOpen(true)}
              style={{ width: 30, height: 34, display: 'grid', placeItems: 'center', padding: 0, border: 0, background: 'transparent', color: A.INK, cursor: 'pointer' }}
            >
              <Search size={16} strokeWidth={2.3} />
            </button>
            <HcpCell tone="dark" dividerColor={A.BORDER} />
            {isLoading || !activeActor ? (
              <SquircleAvatar size={34} alt="" hideRing />
            ) : (
              <AvatarCell tone="dark" triggerRef={avatarRef} onOpen={() => setMenuOpen((value) => !value)} />
            )}
          </div>
        </div>

        {tabs && tabs.length > 0 && (
          <nav
            aria-label={tabsAriaLabel}
            style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 22, padding: '8px 0 10px' }}
          >
            {tabs.map((tab) => {
              const selected = active === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-current={selected ? 'page' : undefined}
                  onClick={() => onTabChange?.(tab.id)}
                  style={{
                    position: 'relative',
                    padding: 0,
                    border: 0,
                    background: 'transparent',
                    color: selected ? A.INK : A.MUTE,
                    fontSize: 15,
                    lineHeight: '18px',
                    fontWeight: 700,
                    letterSpacing: 0,
                    cursor: 'pointer',
                  }}
                >
                  {tab.label}
                  {/* Underlines the WORD, not the slot. Never amber. */}
                  {selected && <span aria-hidden style={{ position: 'absolute', left: 0, right: 0, bottom: -11, height: 2.5, background: A.INK }} />}
                </button>
              );
            })}
          </nav>
        )}
      </header>

      {user && <PostingAsMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} anchorRef={avatarRef} />}
      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}

export default AppHeader;
