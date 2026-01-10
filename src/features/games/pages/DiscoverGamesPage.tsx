/**
 * DiscoverGamesPage - Route-driven discover games
 * 
 * Canonical route: /games/discover
 * - Mobile: Renders as bottom sheet over previous page
 * - Desktop: Renders as full page
 * 
 * Now uses Games | Trips tabs with anonymous host blurbs
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { useIsMobile } from '@/hooks/use-mobile';

import { useDiscoverGamesV2, type DiscoverGamesFilters, type DiscoverWhen, type DiscoverVisibility } from '@/features/hub/hooks/useDiscoverGamesV2';
import { useDiscoverTrips, type DiscoverTripsFilters } from '@/features/hub/hooks/useDiscoverTrips';
import { GameDetailSheetV2 } from '@/features/hub/components/game-detail-v2';
import { DiscoverSearchInput } from '@/features/hub/components/discover-games/DiscoverSearchInput';
import { DiscoverFilterChips } from '@/features/hub/components/discover-games/DiscoverFilterChips';
import { DiscoverTabPills, type DiscoverTab } from '@/features/hub/components/discover-games/DiscoverTabPills';
import { DiscoverEmptyState } from '@/features/hub/components/discover-games/DiscoverEmptyState';
import { DiscoverGamesBottomSheetV2 } from '@/features/hub/components/discover-games';
import { GameDiscoverCard } from '@/features/hub/components/discover-games/GameDiscoverCard';
import { TripDiscoverCard } from '@/features/hub/components/discover-games/TripDiscoverCard';
import { useJoinGame } from '@/features/nearby/hooks/useJoinGame';

export function DiscoverGamesPage() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Filter state
  const [search, setSearch] = useState('');
  const [when, setWhen] = useState<DiscoverWhen>('any');
  const [visibility, setVisibility] = useState<DiscoverVisibility>('all');
  const [activeTab, setActiveTab] = useState<DiscoverTab>('games');

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

  // Query games
  const gamesQuery = useDiscoverGamesV2(filters);
  const games = gamesQuery.data?.pages.flatMap((p) => p.games) ?? [];

  // Query trips
  const tripsQuery = useDiscoverTrips(filters);
  const trips = tripsQuery.data?.pages.flatMap((p) => p.trips) ?? [];

  const isLoading = activeTab === 'games' ? gamesQuery.isLoading : tripsQuery.isLoading;
  const isError = activeTab === 'games' ? gamesQuery.isError : tripsQuery.isError;

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    
    if (activeTab === 'games') {
      if (!gamesQuery.hasNextPage || gamesQuery.isFetchingNextPage) return;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        gamesQuery.fetchNextPage();
      }
    } else {
      if (!tripsQuery.hasNextPage || tripsQuery.isFetchingNextPage) return;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        tripsQuery.fetchNextPage();
      }
    }
  }, [activeTab, gamesQuery, tripsQuery]);

  const handleBack = useCallback(() => {
    haptic('light');
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/hub');
    }
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
    if (activeTab === 'games') {
      gamesQuery.refetch();
    } else {
      tripsQuery.refetch();
    }
  }, [activeTab, gamesQuery, tripsQuery]);

  // Mobile: render as bottom sheet
  if (isMobile) {
    return (
      <DiscoverGamesBottomSheetV2
        isOpen={true}
        onClose={handleBack}
      />
    );
  }

  // Desktop: render as full page
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
              Discover
            </h1>
            <p className="text-xs text-muted-foreground">
              Find games and trips to join near you
            </p>
          </div>
        </div>
      </motion.header>

      {/* Tabs */}
      <div className="px-4 pt-4 pb-2">
        <DiscoverTabPills
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
      </div>

      {/* Search */}
      <div className="px-4 pb-2">
        <DiscoverSearchInput
          value={search}
          onChange={setSearch}
        />
      </div>

      {/* Filter chips */}
      <div className="px-4 pb-3">
        <DiscoverFilterChips
          when={when}
          visibility={visibility}
          onWhenChange={setWhen}
          onVisibilityChange={setVisibility}
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
        ) : activeTab === 'games' ? (
          games.length === 0 ? (
            <DiscoverEmptyState type="empty" />
          ) : (
            <div className="space-y-3">
              {games.map((game) => (
                <GameDiscoverCard
                  key={game.id}
                  game={game}
                  onTap={() => handleOpenGameDetail(game.id)}
                />
              ))}

              {gamesQuery.isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
                </div>
              )}
            </div>
          )
        ) : (
          trips.length === 0 ? (
            <DiscoverEmptyState type="empty" />
          ) : (
            <div className="space-y-3">
              {trips.map((trip) => (
                <TripDiscoverCard
                  key={trip.id}
                  trip={trip}
                  onTap={() => {}}
                />
              ))}

              {tripsQuery.isFetchingNextPage && (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground/40" />
                </div>
              )}
            </div>
          )
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
