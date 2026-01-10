/**
 * DiscoverGamesPage - Full page for discovering games
 * 
 * Canonical route: /games/discover
 * Uses the same components as DiscoverGamesBottomSheetV2 but as a page
 */

import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';

import { useDiscoverGames, type DiscoverGamesFilters, type DiscoverWhen, type DiscoverVisibility } from '@/features/hub/hooks/useDiscoverGames';
import { GameCard } from '@/features/hub/components/your-games-trips-v2/GameCard';
import { GameDetailSheetV2 } from '@/features/hub/components/game-detail-v2';
import { DiscoverSearchInput } from '@/features/hub/components/discover-games/DiscoverSearchInput';
import { DiscoverFilterChips } from '@/features/hub/components/discover-games/DiscoverFilterChips';
import { DiscoverTabPills, type DiscoverTab } from '@/features/hub/components/discover-games/DiscoverTabPills';
import { DiscoverEmptyState } from '@/features/hub/components/discover-games/DiscoverEmptyState';

export function DiscoverGamesPage() {
  const navigate = useNavigate();

  // Filter state
  const [search, setSearch] = useState('');
  const [when, setWhen] = useState<DiscoverWhen>('any');
  const [visibility, setVisibility] = useState<DiscoverVisibility>('all');
  const [activeTab, setActiveTab] = useState<DiscoverTab>('upcoming');

  // Game detail sheet state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameSheetOpen, setGameSheetOpen] = useState(false);

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

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!listRef.current || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    if (scrollHeight - scrollTop - clientHeight < 200) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleBack = useCallback(() => {
    haptic('light');
    navigate(-1);
  }, [navigate]);

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

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-full transition-all duration-150 hover:bg-muted active:scale-95"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-foreground tracking-tight">
              Discover Games
            </h1>
            <p className="text-xs text-muted-foreground">
              Find games to join near you
            </p>
          </div>
        </div>
      </motion.header>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <DiscoverSearchInput
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Filter chips */}
      <div className="px-4 pb-2">
        <DiscoverFilterChips
          when={when}
          visibility={visibility}
          onWhenChange={setWhen}
          onVisibilityChange={setVisibility}
        />
      </div>

      {/* Tabs */}
      <div className="px-4 pb-3">
        <DiscoverTabPills
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Content - scrollable */}
      <div 
        ref={listRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overscroll-contain px-4 pb-24"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground/50" />
          </div>
        ) : isError ? (
          <DiscoverEmptyState 
            type="error"
            onRetry={handleRetry}
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
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Game Detail Sheet (stacked) */}
      {selectedGameId && (
        <GameDetailSheetV2
          isOpen={gameSheetOpen}
          onClose={handleCloseGameDetail}
          gameId={selectedGameId}
        />
      )}
    </div>
  );
}

export default DiscoverGamesPage;
