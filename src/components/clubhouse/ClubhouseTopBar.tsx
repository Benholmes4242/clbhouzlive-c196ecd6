/**
 * ClubhouseTopBar - Combined top chrome for the Clubhouse feed
 *
 * Layout:
 *   Single rounded-rect pill containing two stacked rows:
 *     Row 1: author identity (avatar + name + HCP + home club + time-ago) | search | profile pill
 *     Row 2: segmented feed filter (Suggested / Friends) with white animated thumb
 *
 * The author identity collapses to empty space when no activeAuthor (loading state, editorial cards).
 * Row 2 + hairline divider are suppressed when hideTabs=true (e.g. CourseMediaViewer, FullscreenFeedOverlay).
 */

import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostingAsPill } from '@/components/header/PostingAsPill';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import type { ClubhouseTab } from '@/components/clubhouse/ClubhouseTabToggle';
import { SegmentedFeedToggle } from '@/components/clubhouse/SegmentedFeedToggle';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { SquircleAvatar } from '@/components/ui/SquircleAvatar';
import { cn } from '@/lib/utils';
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
  /** Active post's author for the merged identity bar */
  activeAuthor?: {
    id: string;
    displayName: string;
    username: string;
    avatarUrl: string;
    handicapIndex: number | null;
    homeClub: string | null;
    timeAgoLabel: string;
  } | null;
  onAuthorTap?: () => void;
  /** Suppress subsections for read-only contexts (e.g. CourseMediaViewer) */
  hideTabs?: boolean;
  hideSearch?: boolean;
  hideProfilePill?: boolean;
  /** Left edge offset in px — lets a close button coexist to the left of the bar */
  leftInset?: number;
}

const BAR_TOP = 'calc(max(env(safe-area-inset-top, 0px), 47px) + 8px)';

export const ClubhouseTopBar: React.FC<ClubhouseTopBarProps> = ({
  activeTab,
  onTabChange,
  isBusinessActor = false,
  user,
  hidden = false,
  activeAuthor = null,
  onAuthorTap,
  hideTabs = false,
  hideSearch = false,
  hideProfilePill = false,
  leftInset = 0,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const { hasUnread, unreadCount } = useUnreadNotifications();

  const showHcp =
    !!activeAuthor &&
    activeAuthor.handicapIndex !== null &&
    activeAuthor.handicapIndex !== undefined &&
    Number.isFinite(activeAuthor.handicapIndex);

  return (
    <>
      {/* ── Stacked pill: identity row + segmented feed toggle ── */}
      <div
        className="fixed z-40"
        style={{
          top: BAR_TOP,
          left: leftInset > 0 ? leftInset : 12,
          right: 12,
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
          borderRadius: 22,
          background: 'rgba(0, 0, 0, 0.50)',
          border: '1px solid rgba(255, 255, 255, 0.10)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          fontFamily: 'Geist, system-ui, sans-serif',
          overflow: 'hidden',
        }}
      >
        {/* ── Row 1: Identity ── */}
        <div
          className="flex items-center min-w-0"
          style={{
            gap: 8,
            padding: '6px 8px 6px 6px',
          }}
        >
          {/* Author avatar */}
          {activeAuthor && (
            <button
              type="button"
              onClick={onAuthorTap}
              aria-label={`View ${activeAuthor.displayName}'s profile`}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                flexShrink: 0,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <SquircleAvatar
                size={32}
                src={activeAuthor.avatarUrl}
                alt={activeAuthor.displayName}
                fallback={activeAuthor.displayName?.[0] ?? '?'}
                thinRing
              />
            </button>
          )}

          {/* Author identity (name + HCP, then home club · time-ago) */}
          {activeAuthor ? (
            <button
              type="button"
              onClick={onAuthorTap}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                flex: 1,
                minWidth: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 1,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  minWidth: 0,
                  maxWidth: '100%',
                }}
              >
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '100%',
                  }}
                >
                  {activeAuthor.displayName}
                </span>
                {showHcp && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      fontVariantNumeric: 'tabular-nums',
                      color: 'rgba(255, 255, 255, 0.6)',
                      flexShrink: 0,
                    }}
                  >
                    HCP {activeAuthor.handicapIndex!.toFixed(1)}
                  </span>
                )}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 400,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 1.2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '100%',
                }}
              >
                {activeAuthor.homeClub
                  ? `${activeAuthor.homeClub} · ${activeAuthor.timeAgoLabel}`
                  : activeAuthor.timeAgoLabel}
              </span>
            </button>
          ) : (
            <div style={{ flex: 1 }} />
          )}

          {/* Vertical separator (only when author present and at least one trailing element) */}
          {activeAuthor && (!hideSearch || (!hideProfilePill && user)) && (
            <div
              style={{
                width: 1,
                height: 24,
                background: 'rgba(255, 255, 255, 0.12)',
                flexShrink: 0,
              }}
            />
          )}

          {/* Search icon */}
          {!hideSearch && (
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                'p-0 flex items-center justify-center rounded-full active:scale-[0.97] transition-all',
                'h-9 w-9 flex-shrink-0',
                'bg-transparent hover:bg-transparent border-0 shadow-none',
                'text-white/70'
              )}
              onClick={() => setSearchOpen(true)}
              aria-label="Search"
            >
              <Search className="h-[18px] w-[18px]" />
            </Button>
          )}

          {/* Profile pill (current user) */}
          {!hideProfilePill && user && (
            <div className="flex-shrink-0">
              <PostingAsPill
                ref={pillRef}
                onClick={() => setMenuOpen((v) => !v)}
                isOpen={menuOpen}
                hasUnreadNotifications={hasUnread}
                notificationCount={unreadCount}
                useGlassTheme={true}
              />
            </div>
          )}
        </div>

        {/* ── Hairline divider ── */}
        {!hideTabs && (
          <div
            aria-hidden
            style={{
              height: 1,
              background: 'rgba(255, 255, 255, 0.08)',
              marginLeft: 12,
              marginRight: 12,
            }}
          />
        )}

        {/* ── Row 2: Segmented feed toggle (half width, centered, ~10% shorter) ── */}
        {!hideTabs && (
          <div style={{ padding: '7px 10px 9px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '50%' }}>
              <SegmentedFeedToggle
                activeTab={activeTab}
                onTabChange={onTabChange}
                isBusinessActor={isBusinessActor}
              />
            </div>
          </div>
        )}
      </div>

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
