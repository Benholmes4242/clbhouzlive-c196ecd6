/**
 * MediaPlayerTopBar — matches ClubhouseTopBar layout exactly.
 * [Tab Toggle] [Search] [Profile Pill]
 * Transparent background, fixed position below safe area.
 */
import React, { useState, useRef } from 'react';
import { Search } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PostingAsPill } from '@/components/header/PostingAsPill';
import { PostingAsMenu } from '@/components/header/PostingAsMenu';
import { SearchOverlay } from '@/components/header/SearchOverlay';
import { FeedTabToggle } from './FeedTabToggle';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { cn } from '@/lib/utils';
import type { FeedTab } from './types/media';
import type { User } from '@supabase/supabase-js';

interface MediaPlayerTopBarProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
  user: User | null;
}

export function MediaPlayerTopBar({ activeTab, onTabChange, user }: MediaPlayerTopBarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pillRef = useRef<HTMLButtonElement>(null);
  const { hasUnread } = useUnreadNotifications();

  return (
    <>
      {/* Floating bar — fixed below notch/safe area */}
      <div
        className="fixed left-4 right-4 z-40 pointer-events-auto flex items-center justify-between gap-2 min-w-0"
        style={{
          top: 'calc(max(env(safe-area-inset-top, 0px), 47px) + 12px)',
        }}
      >
        {/* Left: Tab Toggle */}
        <div className="flex-shrink-1 min-w-0">
          <FeedTabToggle
            activeTab={activeTab}
            onTabChange={onTabChange}
          />
        </div>

        {/* Right: Search + Profile Pill */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'p-0 flex items-center justify-center rounded-full active:scale-[0.97] transition-all',
              'h-11 w-11 flex-shrink-0',
              'bg-transparent hover:bg-transparent border-0 shadow-none',
              'text-white/70'
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
      <AnimatePresence>
        {searchOpen && (
          <SearchOverlay
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            useLightTheme={true}
          />
        )}
      </AnimatePresence>
    </>
  );
}
