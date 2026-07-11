/**
 * FloatingPageHeader — canonical floating glass row that sits flush under the
 * notch over a cinematic full-bleed hero image (course detail, profile pages).
 *
 * Mirrors FloatingTourHeader's pill spec exactly:
 *   38px height, borderRadius:999, bg rgba(255,255,255,0.16),
 *   1px solid rgba(255,255,255,0.30), backdrop-filter blur(14px),
 *   white icons size={18}.
 *
 * Left:  back-arrow glass circle.
 * Right: search pill + HandicapChip + PostingAsPill (avatar).
 *
 * Owns its own status-bar transparency lifecycle and signals the global
 * CompactHeader to suppress itself via setFloatingHeaderActive(true).
 */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
// Shield writes owned solely by AppRoutes; no direct applyShieldColor here.
import { setFloatingHeaderActive } from '@/features/tourhub/_shared/floatingHeaderSignal';
import { SearchOverlayV2 } from '@/features/search-v2/SearchOverlayV2';
import { PostingAsPill } from './PostingAsPill';
import { PostingAsMenu } from './PostingAsMenu';
import { HandicapChip } from './HandicapChip';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { safeGoBack } from '@/utils/navigation';
import { haptic } from '@/utils/haptics';

export interface FloatingPageHeaderProps {
  /** Override the back action; defaults to safeGoBack(navigate, '/'). */
  onBack?: () => void;
  /** Hide the handicap chip (e.g. business profile if undesired). Default: show. */
  showHandicap?: boolean;
}

const GLASS_BG = 'rgba(255,255,255,0.16)';
const GLASS_BORDER = '1px solid rgba(255,255,255,0.30)';
const GLASS_BLUR = 'blur(14px)';
const PILL_H = 38;

const pillStyle: React.CSSProperties = {
  height: PILL_H,
  minWidth: PILL_H,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 999,
  background: GLASS_BG,
  border: GLASS_BORDER,
  backdropFilter: GLASS_BLUR,
  WebkitBackdropFilter: GLASS_BLUR,
  color: '#FFFFFF',
  cursor: 'pointer',
  padding: 0,
  fontFamily: 'Geist, system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
  transition: 'transform 120ms ease',
};

export const FloatingPageHeader: React.FC<FloatingPageHeaderProps> = ({
  onBack,
  showHandicap = true,
}) => {
  const navigate = useNavigate();
  const { user } = useSupabaseSession();
  const { hasUnread, unreadCount } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);

  // Suppress the global CompactHeader for this page.
  useEffect(() => {
    setFloatingHeaderActive(true);
    return () => setFloatingHeaderActive(false);
  }, []);

  // Chrome (shield + native status bar) is owned solely by AppRoutes now.
  // FloatingPageHeader must NOT write shield / theme-color / status-bar —
  // last-writer-wins on unmount was painting #F8FAFC over the hero on
  // back-nav to /courses. AppRoutes classifies every immersive route to
  // transparent from location.pathname.


  const handleBack = () => {
    haptic('light');
    if (onBack) onBack();
    else safeGoBack(navigate, '/');
  };

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 60,
          pointerEvents: 'none',
        }}
      >
        {/* Top scrim — legibility for controls + status clock */}
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: `calc(env(safe-area-inset-top, 0px) + ${PILL_H + 8 + 10 + 24}px)`,
            pointerEvents: 'none',
            background:
              'linear-gradient(180deg, rgba(15,23,42,0.50) 0%, rgba(15,23,42,0.18) 55%, rgba(15,23,42,0) 100%)',
          }}
        />

        <div
          style={{
            position: 'relative',
            paddingTop: 'env(safe-area-inset-top, 0px)',
            pointerEvents: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
              paddingTop: 8,
              paddingBottom: 10,
              paddingLeft: 14,
              paddingRight: 14,
            }}
          >
            {/* LEFT: back glass circle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <button
                type="button"
                aria-label="Go back"
                onClick={handleBack}
                style={pillStyle}
                className="active:scale-[0.94]"
              >
                <ArrowLeft size={18} color="#FFFFFF" strokeWidth={2.2} />
              </button>
            </div>

            {/* RIGHT: search + handicap + avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button
                type="button"
                aria-label="Search"
                onClick={() => setSearchOpen(true)}
                style={pillStyle}
                className="active:scale-[0.94]"
              >
                <Search size={18} color="#FFFFFF" strokeWidth={2.2} />
              </button>

              {showHandicap && (
                <div className="[&>button]:!rounded-full">
                  <HandicapChip light={false} pill />
                </div>
              )}

              {user && (
                <div className="[&_button]:!rounded-full">
                  <PostingAsPill
                    ref={pillRef}
                    onClick={() => setMenuOpen((v) => !v)}
                    isOpen={menuOpen}
                    hasUnreadNotifications={hasUnread}
                    notificationCount={unreadCount}
                    useLightTheme={false}
                    compact
                    size="lg"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SearchOverlayV2 isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      <PostingAsMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        anchorRef={pillRef as React.RefObject<HTMLElement>}
      />
    </>
  );
};

export default FloatingPageHeader;
