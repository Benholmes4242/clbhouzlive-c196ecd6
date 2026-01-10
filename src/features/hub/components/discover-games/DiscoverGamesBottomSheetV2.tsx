/**
 * DiscoverGamesBottomSheetV2 - Bottom sheet for discovering games & trips
 * 
 * Updated V2 design:
 * - Games | Trips tabs (removed Recommended/Upcoming)
 * - Anonymous host blurbs (no identity leaks)
 * - Request to join CTA with proper states
 * - Excludes games where user was declined
 * - Custom date picker with preset/single/range modes
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { haptic } from '@/utils/haptics';

import { useDiscoverGamesV2, type DiscoverGamesFilters, type DiscoverWhen, type DiscoverVisibility } from '../../hooks/useDiscoverGamesV2';
import { useDiscoverTrips } from '../../hooks/useDiscoverTrips';
import { useRequestJoinGame } from '../../hooks/useRequestJoinGame';
import { GameDetailSheetV2 } from '../game-detail-v2';
import { DiscoverSearchInput } from './DiscoverSearchInput';
import { DiscoverDatePicker, type DateFilterValue, dateFilterToQueryParams } from './DiscoverDatePicker';
import { DiscoverVisibilityChip } from './DiscoverVisibilityChip';
import { DiscoverTabPills, type DiscoverTab } from './DiscoverTabPills';
import { DiscoverEmptyState } from './DiscoverEmptyState';
import { GameDiscoverCard } from './GameDiscoverCard';
import { TripDiscoverCard } from './TripDiscoverCard';

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
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ mode: 'preset', preset: 'any' });
  const [visibility, setVisibility] = useState<DiscoverVisibility>('all');
  const [activeTab, setActiveTab] = useState<DiscoverTab>('games');

  // Game detail sheet state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameSheetOpen, setGameSheetOpen] = useState(false);
  
  // Join request state
  const [requestingGameId, setRequestingGameId] = useState<string | null>(null);

  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Build filters with custom date support
  const dateParams = dateFilterToQueryParams(dateFilter);
  const filters: DiscoverGamesFilters = {
    search,
    when: dateFilter.mode === 'preset' ? dateFilter.preset : 'any',
    visibility,
    customStartAt: dateParams.startAt,
    customEndAt: dateParams.endAt,
  };

  // Query games
  const gamesQuery = useDiscoverGamesV2(filters);
  const games = gamesQuery.data?.pages.flatMap((p) => p.games) ?? [];

  // Query trips
  const tripsQuery = useDiscoverTrips(filters);
  const trips = tripsQuery.data?.pages.flatMap((p) => p.trips) ?? [];

  const isLoading = activeTab === 'games' ? gamesQuery.isLoading : tripsQuery.isLoading;
  const isError = activeTab === 'games' ? gamesQuery.isError : tripsQuery.isError;

  // Join game mutation (refactored)
  const joinGameMutation = useRequestJoinGame();

  const handleRequestJoin = useCallback((gameId: string) => {
    setRequestingGameId(gameId);
    joinGameMutation.mutate({ gameId }, {
      onSettled: () => {
        setTimeout(() => setRequestingGameId(null), 300);
      },
    });
  }, [joinGameMutation]);

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
        setDateFilter({ mode: 'preset', preset: 'any' });
        setVisibility('all');
        setActiveTab('games');
        setSelectedGameId(null);
        setGameSheetOpen(false);
        setRequestingGameId(null);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

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
                  Discover
                </h2>
                <p 
                  className="text-[12px] mt-0.5"
                  style={{ color: 'rgba(100, 116, 139, 0.8)' }}
                >
                  Find games and trips to join near you
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

            {/* Tabs */}
            <div className="px-5 pt-4 pb-2 flex-shrink-0">
              <DiscoverTabPills
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Search */}
            <div className="px-5 pb-2 flex-shrink-0">
              <DiscoverSearchInput
                value={search}
                onChange={setSearch}
              />
            </div>

            {/* Filter chips */}
            <div className="px-5 pb-3 flex-shrink-0 flex items-center gap-2">
              <DiscoverDatePicker
                value={dateFilter}
                onChange={setDateFilter}
              />
              <DiscoverVisibilityChip
                value={visibility}
                onChange={setVisibility}
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
                  onRetry={() => activeTab === 'games' ? gamesQuery.refetch() : tripsQuery.refetch()}
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
                        onRequestJoin={() => handleRequestJoin(game.id)}
                        isRequesting={requestingGameId === game.id && joinGameMutation.isPending}
                      />
                    ))}

                    {gamesQuery.isFetchingNextPage && (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(100, 116, 139, 0.4)' }} />
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
                        <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'rgba(100, 116, 139, 0.4)' }} />
                      </div>
                    )}
                  </div>
                )
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
