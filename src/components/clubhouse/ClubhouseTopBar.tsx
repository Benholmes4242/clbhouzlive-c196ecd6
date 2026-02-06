/**
 * ClubhouseTopBar - Floating top bar for Clubhouse page
 * Contains: Tab Toggle (Suggested | Friends) + Search + Profile Pill
 * Replaces the CompactHeader on the Clubhouse page
 */

import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PostingAsPill } from '@/components/header/PostingAsPill';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { SearchOverlay } from '@/components/header/SearchOverlay';
import { ClubhouseTabToggle, type ClubhouseTab } from '@/components/clubhouse/ClubhouseTabToggle';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';
import type { User } from '@supabase/supabase-js';

interface ClubhouseTopBarProps {
  activeTab: ClubhouseTab;
  onTabChange: (tab: ClubhouseTab) => void;
  isBusinessActor?: boolean;
  user: User | null;
}

export const ClubhouseTopBar: React.FC<ClubhouseTopBarProps> = ({
  activeTab,
  onTabChange,
  isBusinessActor = false,
  user,
}) => {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const { hasUnread } = useUnreadNotifications();

  return (
    <>
      {/* Floating bar - fixed position below the notch/safe area */}
      <div
        className="fixed left-4 right-4 z-40 pointer-events-auto flex items-center justify-between lg:hidden"
        style={{
          top: 'calc(var(--sat, 0px) + 12px)',
        }}
      >
        {/* Left: Tab Toggle */}
        <ClubhouseTabToggle
          activeTab={activeTab}
          onTabChange={onTabChange}
          isBusinessActor={isBusinessActor}
        />

        {/* Right: Search + Profile Pill */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "p-0 flex items-center justify-center rounded-full active:scale-[0.94] transition-all",
              "h-9 w-9",
              "bg-transparent hover:bg-transparent border-0 shadow-none"
            )}
            style={{
              color: 'rgba(255, 255, 255, 0.7)',
            }}
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </Button>

          {user && (
            <PostingAsPill
              ref={pillRef}
              onClick={() => setMenuOpen((v) => !v)}
              isOpen={menuOpen}
              hasUnreadNotifications={hasUnread}
              useLightTheme={false}
              isDimmed={false}
            />
          )}
        </div>
      </div>

      {/* PostingAs Menu */}
      {user && (
        <PostingAsMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          useLightTheme={false}
          anchorRef={pillRef}
        />
      )}

      {/* Search Overlay */}
      <SearchOverlay
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        useLightTheme={false}
      />
    </>
  );
};

export default ClubhouseTopBar;
