/**
 * DiscoverGamesBottomSheetV2 - Bottom sheet for discovering games
 * 
 * Matches V2 design language:
 * - Frosted glass sheet container
 * - Premium header with gradient divider
 * - Filter chips + tabs
 * - Opens GameDetailSheetV2 as stacked sheet
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { haptic } from '@/utils/haptics';

import { useDiscoverGames, type DiscoverGamesFilters, type DiscoverWhen, type DiscoverVisibility } from '../../hooks/useDiscoverGames';
import { GameCard } from '../your-games-trips-v2/GameCard';
import { GameDetailSheetV2 } from '../game-detail-v2';
import { DiscoverSearchInput } from './DiscoverSearchInput';
import { DiscoverFilterChips } from './DiscoverFilterChips';
import { DiscoverTabPills, type DiscoverTab } from './DiscoverTabPills';
import { DiscoverEmptyState } from './DiscoverEmptyState';

interface DiscoverGamesBottomSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DiscoverGamesBottomSheetV2({
  isOpen,
  onClose,
}: DiscoverGamesBottomSheetV2Props) {
  // Filter state
  const [search, setSearch] = useState('');
  const [when, setWhen] = useState<DiscoverWhen>('any');
  const [visibility, setVisibility] = useState<DiscoverVisibility>('all');
  const [activeTab, setActiveTab] = useState<DiscoverTab>('upcoming');

  // Game detail sheet state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameSheetOpen, setGameSheetOpen] = useState(false);

  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Build filters
  const filters: DiscoverGamesFilters = {
    search,
    when,
    visibility,
  };

  // Query
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useDiscoverGames(filters);

  // Flatten pages
  const games = data?.pages.flatMap((p) => p.games) ?? [];

  // Sort by tab
  const sortedGames = React.useMemo(() => {
    if (activeTab === 'recommended') {
      // Sort by participant count desc, then by start_time asc
      return [...games].sort((a, b) => {
        const aCount = a.goingCount + a.maybeCount;
        const bCount = b.goingCount + b.maybeCount;
        if (bCount !== aCount) return bCount - aCount;
        return new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime();
      });
    }
    // Upcoming - already sorted by start_time from query
    return games;
  }, [games, activeTab]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      scrollYRef.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollYRef.current);
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.overflow = '';
        window.scrollTo(0, scrollYRef.current);
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  // Reset state when sheet closes
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setSearch('');
        setWhen('any');
        setVisibility('all');
        setActiveTab('upcoming');
        setSelectedGameId(null);
        setGameSheetOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!listRef.current || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleOpenGameDetail = useCallback((gameId: string) => {
    haptic('light');
    setSelectedGameId(gameId);
    setGameSheetOpen(true);
  }, []);

  const handleCloseGameDetail = useCallback(() => {
    setGameSheetOpen(false);
    setTimeout(() => setSelectedGameId(null), 300);
  }, []);

  const handleTabChange = useCallback((tab: DiscoverTab) => {
    haptic('light');
    setActiveTab(tab);
  }, []);

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;
  const hasStackedSheet = gameSheetOpen;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999]"
            style={{
              background: 'rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
            }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-[24px] overflow-hidden discover-games-sheet-wrapper ${hasStackedSheet ? 'stacked-behind' : ''}`}
            style={{
              height: '90svh',
              maxHeight: '90svh',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.12), 0 -2px 10px rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Stacked sheet CSS */}
            <style>{`
              .discover-games-sheet-wrapper {
                transition: transform 0.25s ease-out, opacity 0.25s ease-out;
              }
              .discover-games-sheet-wrapper.stacked-behind {
                transform: scale(0.985);
                opacity: 0.96;
              }
            `}</style>

            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div 
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <div>
                <h2 
                  className="text-[18px] font-semibold leading-tight"
                  style={{ color: '#1e293b', letterSpacing: '-0.02em' }}
                >
                  Discover Games
                </h2>
                <p 
                  className="text-[12px] mt-0.5"
                  style={{ color: 'rgba(100, 116, 139, 0.8)' }}
                >
                  Find games to join near you
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-full transition-all duration-150 hover:bg-black/5 active:scale-95"
              >
                <X 
                  className="w-5 h-5"
                  style={{ color: 'rgba(100, 116, 139, 0.6)' }}
                />
              </button>
            </div>

            {/* Gradient divider */}
            <div 
              className="h-px mx-5 flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.06) 20%, rgba(0, 0, 0, 0.06) 80%, transparent 100%)',
              }}
            />

            {/* Search */}
            <div className="px-5 pt-4 pb-2 flex-shrink-0">
              <DiscoverSearchInput
                value={search}
                onChange={setSearch}
              />
            </div>

            {/* Filter chips */}
            <div className="px-5 pb-2 flex-shrink-0">
              <DiscoverFilterChips
                when={when}
                visibility={visibility}
                onWhenChange={setWhen}
                onVisibilityChange={setVisibility}
              />
            </div>

            {/* Tabs */}
            <div className="px-5 pb-3 flex-shrink-0">
              <DiscoverTabPills
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Content - scrollable */}
            <div 
              ref={listRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-10"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'rgba(100, 116, 139, 0.5)' }} />
                </div>
              ) : isError ? (
                <DiscoverEmptyState 
                  type="error"
                  onRetry={() => refetch()}
                />
              ) : sortedGames.length === 0 ? (
                <DiscoverEmptyState type="empty" />
              ) : (
                <div className="space-y-2">
                  {sortedGames.map((game) => (
                    <GameCard
                      key={game.id}
                      game={game}
                      variant="row"
                      onTap={() => handleOpenGameDetail(game.id)}
                    />
                  ))}

                  {isFetchingNextPage && (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(100, 116, 139, 0.4)' }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Game Detail Sheet (stacked) */}
          {selectedGameId && (
            <GameDetailSheetV2
              isOpen={gameSheetOpen}
              onClose={handleCloseGameDetail}
              gameId={selectedGameId}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
