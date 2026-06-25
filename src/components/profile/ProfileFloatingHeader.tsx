/**
 * ProfileFloatingHeader — transparent floating control row over a full-bleed
 * profile hero. Mirrors the ClubhouseTopBar pattern: bare white glyphs, no
 * frosted circles, no bar background. A subtle top scrim handles legibility.
 *
 * Layout:
 *   LEFT  : back arrow (or settings gear when nothing to pop)
 *   RIGHT : search
 *
 * Anchored at top:0 with paddingTop = safe-area-inset-top so glyphs land
 * exactly where ClubhouseTopBar / CompactHeader sit — directly under the notch.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Search, Settings } from 'lucide-react';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { PostingAsPill } from '@/components/header/PostingAsPill';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { useSupabaseSession } from '@/hooks/useSupabaseSession';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { safeGoBack } from '@/utils/navigation';

const FLOAT_STROKE = 2;
const GLYPH_COLOR = '#FFFFFF';

export interface ProfileFloatingHeaderProps {
  /** When true, left glyph is a settings gear (own-profile reached via tab). */
  isSelf?: boolean;
  /** Fallback path for safeGoBack when there's no history to pop. */
  backFallback?: string;
  /** Optional override for the settings tap target (defaults to /settings). */
  onSettingsClick?: () => void;
}

export const ProfileFloatingHeader: React.FC<ProfileFloatingHeaderProps> = ({
  isSelf = false,
  backFallback = '/clubhouse',
  onSettingsClick,
}) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useSupabaseSession();
  const { hasUnread, unreadCount } = useUnreadNotifications();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);

  // Close transient overlays on route change.
  useEffect(() => {
    setSearchOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // When viewing own profile via the bottom-nav tab there's no history to pop —
  // show a settings gear instead. Otherwise show a back arrow.
  const showSettingsAsLeft = isSelf && (typeof window === 'undefined' || window.history.length <= 1);

  const handleLeft = () => {
    if (showSettingsAsLeft) {
      if (onSettingsClick) onSettingsClick();
      else navigate('/settings');
    } else {
      safeGoBack(navigate, backFallback);
    }
  };

  return (
    <>
      {/* Top scrim — legibility only, never blocks taps */}
      <div
        aria-hidden="true"
        className="absolute top-0 left-0 right-0 pointer-events-none z-[39]"
        style={{
          height: 'calc(env(safe-area-inset-top, 0px) + 96px)',
          background:
            'linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0) 100%)',
        }}
      />

      {/* Floating control row — anchored directly under the notch */}
      <div
        className="absolute left-0 right-0 z-40 pointer-events-none"
        style={{
          top: 0,
          paddingTop: 'env(safe-area-inset-top, 0px)',
        }}
      >
        <div
          className="flex items-center justify-between pointer-events-auto"
          style={{ height: 44, padding: '0 12px' }}
        >
          {/* LEFT */}
          <button
            type="button"
            onClick={handleLeft}
            aria-label={showSettingsAsLeft ? 'Settings' : 'Back'}
            className="flex items-center justify-center active:scale-95 transition-transform"
            style={{
              width: 44,
              height: 44,
              background: 'transparent',
              border: 'none',
              padding: 0,
              color: GLYPH_COLOR,
              cursor: 'pointer',
            }}
          >
            {showSettingsAsLeft ? (
              <Settings size={24} strokeWidth={FLOAT_STROKE} />
            ) : (
              <ArrowLeft size={24} strokeWidth={FLOAT_STROKE} />
            )}
          </button>

          {/* RIGHT cluster */}
          <div className="flex items-center" style={{ gap: 12 }}>
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              className="flex items-center justify-center active:scale-95 transition-transform"
              style={{
                width: 44,
                height: 44,
                background: 'transparent',
                border: 'none',
                padding: 0,
                color: GLYPH_COLOR,
                cursor: 'pointer',
              }}
            >
              <Search size={21} strokeWidth={FLOAT_STROKE} />
            </button>

            {user && (
              <PostingAsPill
                ref={pillRef}
                onClick={() => setMenuOpen((v) => !v)}
                isOpen={menuOpen}
                hasUnreadNotifications={hasUnread}
                notificationCount={unreadCount}
                useBareTheme={true}
              />
            )}
          </div>
        </div>
      </div>

      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          useLightTheme={true}
          anchorRef={pillRef}
        />
      )}

      <GlobalSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
};

export default ProfileFloatingHeader;
