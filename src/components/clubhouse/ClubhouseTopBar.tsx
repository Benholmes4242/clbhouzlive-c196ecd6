/**
 * ClubhouseTopBar - Floating top bar for Clubhouse page
 * Contains: Tab Toggle (Suggested | Friends) + Search + Profile Pill + Carousel Dots
 */

import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PostingAsPill } from '@/components/header/PostingAsPill';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import GlobalSearchOverlay from '@/components/search/GlobalSearchOverlay';
import { ClubhouseTabToggle, type ClubhouseTab } from '@/components/clubhouse/ClubhouseTabToggle';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
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
}

export const ClubhouseTopBar: React.FC<ClubhouseTopBarProps> = ({
  activeTab,
  onTabChange,
  isBusinessActor = false,
  user,
  carouselCount,
  carouselIndex,
  hidden = false,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const { hasUnread } = useUnreadNotifications();

  return (
    <>
      {/* Floating bar - fixed position below the notch/safe area */}
      <div
        className="fixed left-3 right-3 z-40 pointer-events-auto flex items-center justify-between gap-1 min-w-0"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
          opacity: hidden ? 0 : 1,
          pointerEvents: hidden ? 'none' : 'auto',
          transition: 'opacity 0.2s ease',
        }}
      >
        {/* Left: Tab Toggle */}
        <div className="flex-1 min-w-0">
          <ClubhouseTabToggle
            activeTab={activeTab}
            onTabChange={onTabChange}
            isBusinessActor={isBusinessActor}
          />
        </div>

        {/* Right: Search + Profile Pill */}
        <div className="flex items-center gap-1 flex-shrink-0 ml-1">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "p-0 flex items-center justify-center rounded-full active:scale-[0.97] transition-all",
              "h-11 w-11 flex-shrink-0",
              "bg-transparent hover:bg-transparent border-0 shadow-none",
              "text-white/70"
            )}
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {user && (
            <div className="flex-shrink-1 min-w-0">
              <PostingAsPill
                ref={pillRef}
                onClick={() => setMenuOpen((v) => !v)}
                isOpen={menuOpen}
                hasUnreadNotifications={hasUnread}
                useGlassTheme={true}
                
              />
            </div>
          )}
        </div>
      </div>


      {/* PostingAs Menu */}
      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          useLightTheme={true}
          anchorRef={pillRef}
        />
      )}

      {/* Search Overlay */}
      <GlobalSearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
};

export default ClubhouseTopBar;
