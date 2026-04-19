/**
 * ClubhouseTopBar - Top chrome for the Clubhouse feed (Option A — TikTok-style)
 *
 * Layout:
 *  Row 1: small centred Suggested · Friends tabs at the very top, no background
 *  Row 2: top-right floating icon cluster — search + profile avatar (no pill, drop shadows)
 *
 * Author identity has moved into BreathingRoomBottomBar.
 */

import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { PostingAsPill } from '@/components/header/PostingAsPill';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { ClubhouseTabToggle, type ClubhouseTab } from '@/components/clubhouse/ClubhouseTabToggle';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import type { User } from '@supabase/supabase-js';

interface ClubhouseTopBarProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  isBusinessActor?: boolean;
  user: User | null;
  carouselCount?: number;
  carouselIndex?: number;
  /** When true, hides the entire top bar (PGA card active) */
  hidden?: boolean;
  /** @deprecated Author identity has moved to BreathingRoomBottomBar. Prop kept for backward-compat. */
  activeAuthor?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    handicapIndex: number | null;
    homeClub: string | null;
    timeAgoLabel: string;
  } | null;
  /** @deprecated Author tap handled inside BreathingRoomBottomBar now. */
  onAuthorTap?: () => void;
  /** Suppress subsections for read-only contexts (e.g. CourseMediaViewer) */
  hideTabs?: boolean;
  hideSearch?: boolean;
  hideProfilePill?: boolean;
  /** @deprecated No longer used — there is no horizontal bar to inset. */
  leftInset?: number;
}

const TABS_TOP = 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)';
const ICONS_TOP = 'calc(max(env(safe-area-inset-top, 0px), 47px) + 6px)';

export const ClubhouseTopBar: React.FC<ClubhouseTopBarProps> = ({
  activeTab,
  onTabChange,
  isBusinessActor = false,
  user,
  hidden = false,
  hideTabs = false,
  hideSearch = false,
  hideProfilePill = false,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const { hasUnread, unreadCount } = useUnreadNotifications();

  return (
    <>
      {/* ── ROW 1: Tabs (centred, no background) ── */}
      {!hideTabs && (
        <div
          className="fixed left-0 right-0 z-40 flex items-center justify-center"
          style={{
            top: TABS_TOP,
            opacity: hidden ? 0 : 1,
            pointerEvents: hidden ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
          }}
        >
          <ClubhouseTabToggle
            activeTab={activeTab}
            onTabChange={onTabChange}
            isBusinessActor={isBusinessActor}
          />
        </div>
      )}

      {/* ── ROW 2: Floating icon cluster, top-right, no background pill ── */}
      {(!hideSearch || (!hideProfilePill && user)) && (
        <div
          className="fixed z-40 flex items-center"
          style={{
            top: ICONS_TOP,
            right: 12,
            gap: 6,
            opacity: hidden ? 0 : 1,
            pointerEvents: hidden ? 'none' : 'auto',
            transition: 'opacity 0.2s ease',
          }}
        >
          {!hideSearch && (
            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
              style={{
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: '#fff',
                filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.6))',
              }}
            >
              <Search size={22} strokeWidth={2} />
            </button>
          )}

          {!hideProfilePill && user && (
            <PostingAsPill
              ref={pillRef}
              onClick={() => setMenuOpen((v) => !v)}
              isOpen={menuOpen}
              hasUnreadNotifications={hasUnread}
              notificationCount={unreadCount}
              useGlassTheme={false}
              useBareTheme={true}
            />
          )}
        </div>
      )}

      {/* PostingAs Menu */}
      {!hideProfilePill && user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          useLightTheme={true}
          anchorRef={pillRef}
        />
      )}

      {/* Search Overlay */}
      {!hideSearch && (
        <GlobalSearchOverlay isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
      )}
    </>
  );
};

export default ClubhouseTopBar;
