/**
 * DiscoverGamesBottomSheetV2 - Bottom sheet for discovering games & trips
 * 
 * Phase 2B Updates:
 * - RequestNoteModal wired for games & trips
 * - TripDetailSheetV2 for trip details
 * - Time-of-day filter chips
 * - Search debounce (300ms)
 * - Real-time updates
 * - Premium warm styling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useDebounce } from '@/hooks/useDebounce';

import { useDiscoverGamesV2, type DiscoverGamesFilters, type DiscoverWhen, type DiscoverVisibility } from '../../hooks/useDiscoverGamesV2';
import { useDiscoverTrips } from '../../hooks/useDiscoverTrips';
import { useDiscoverRealtime } from '../../hooks/useDiscoverRealtime';
import { useRequestJoinGame } from '../../hooks/useRequestJoinGame';
import { useRequestJoinTrip } from '../../hooks/useRequestJoinTrip';
import { GameDetailSheetV2 } from '../game-detail-v2';
import { TripDetailSheetV2 } from '../trip/TripDetailSheetV2';
import { DiscoverSearchInput } from './DiscoverSearchInput';
import { DiscoverDatePicker, type DateFilterValue, dateFilterToQueryParams } from './DiscoverDatePicker';
import { DiscoverVisibilityChip } from './DiscoverVisibilityChip';
import { DiscoverTabPills, type DiscoverTab } from './DiscoverTabPills';
import { DiscoverEmptyState } from './DiscoverEmptyState';
import { GameDiscoverCard } from './GameDiscoverCard';
import { TripDiscoverCard } from './TripDiscoverCard';
import { RequestNoteModal } from './RequestNoteModal';
import { TimeOfDayChips, type TimeOfDay, getTimeOfDayRange } from './TimeOfDayChips';
import { setHours, setMinutes, startOfDay, endOfDay } from 'date-fns';

interface DiscoverGamesBottomSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
}

export function DiscoverGamesBottomSheetV2({
  isOpen,
  onClose,
}: DiscoverGamesBottomSheetV2Props) {
  // Filter state
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [dateFilter, setDateFilter] = useState<DateFilterValue>({ mode: 'preset', preset: 'any' });
  const [visibility, setVisibility] = useState<DiscoverVisibility>('all');
  const [activeTab, setActiveTab] = useState<DiscoverTab>('games');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('any');

  // Game detail sheet state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameSheetOpen, setGameSheetOpen] = useState(false);
  
  // Trip detail sheet state
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [tripSheetOpen, setTripSheetOpen] = useState(false);

  // Enable real-time updates
  useDiscoverRealtime();
  
  // Request note modal state
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestModalType, setRequestModalType] = useState<'game' | 'trip'>('game');
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);

  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Build filters with custom date + time-of-day support
  const dateParams = dateFilterToQueryParams(dateFilter);
  
  // Apply time-of-day filter on top of date filter
  let finalStartAt = dateParams.startAt;
  let finalEndAt = dateParams.endAt;
  
  if (timeOfDay !== 'any' && dateFilter.mode === 'single' && dateFilter.singleDate && !dateFilter.singleTime) {
    const todRange = getTimeOfDayRange(timeOfDay);
    if (todRange) {
      const baseDate = dateFilter.singleDate;
      finalStartAt = setMinutes(setHours(baseDate, todRange.startHour), 0).toISOString();
      finalEndAt = setMinutes(setHours(baseDate, todRange.endHour), 59).toISOString();
    }
  }
  
  const filters: DiscoverGamesFilters = {
    search: debouncedSearch,
    when: dateFilter.mode === 'preset' ? dateFilter.preset : 'any',
    visibility,
    customStartAt: finalStartAt,
    customEndAt: finalEndAt,
  };

  // Query games
  const gamesQuery = useDiscoverGamesV2(filters);
  const games = gamesQuery.data?.pages.flatMap((p) => p.games) ?? [];

  // Query trips
  const tripsQuery = useDiscoverTrips(filters);
  const trips = tripsQuery.data?.pages.flatMap((p) => p.trips) ?? [];

  const isLoading = activeTab === 'games' ? gamesQuery.isLoading : tripsQuery.isLoading;
  const isError = activeTab === 'games' ? gamesQuery.isError : tripsQuery.isError;

  // Join mutations
  const joinGameMutation = useRequestJoinGame();
  const joinTripMutation = useRequestJoinTrip();

  // Open request modal for games
  const handleOpenGameRequestModal = useCallback((gameId: string) => {
    haptic('light');
    setPendingRequestId(gameId);
    setRequestModalType('game');
    setRequestModalOpen(true);
  }, []);

  // Open request modal for trips
  const handleOpenTripRequestModal = useCallback((tripId: string) => {
    haptic('light');
    setPendingRequestId(tripId);
    setRequestModalType('trip');
    setRequestModalOpen(true);
  }, []);

  // Submit request with optional message
  const handleSubmitRequest = useCallback((message: string | null) => {
    if (!pendingRequestId) return;
    
    if (requestModalType === 'game') {
      joinGameMutation.mutate({ gameId: pendingRequestId, message }, {
        onSettled: () => {
          setRequestModalOpen(false);
          setPendingRequestId(null);
        },
      });
    } else {
      joinTripMutation.mutate({ tripId: pendingRequestId, message }, {
        onSettled: () => {
          setRequestModalOpen(false);
          setPendingRequestId(null);
          setTripSheetOpen(false);
        },
      });
    }
  }, [pendingRequestId, requestModalType, joinGameMutation, joinTripMutation]);

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
        setSearchInput('');
        setDateFilter({ mode: 'preset', preset: 'any' });
        setVisibility('all');
        setActiveTab('games');
        setTimeOfDay('any');
        setSelectedGameId(null);
        setGameSheetOpen(false);
        setSelectedTripId(null);
        setTripSheetOpen(false);
        setRequestModalOpen(false);
        setPendingRequestId(null);
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

  const handleOpenTripDetail = useCallback((tripId: string) => {
    haptic('light');
    setSelectedTripId(tripId);
    setTripSheetOpen(true);
  }, []);

  const handleCloseTripDetail = useCallback(() => {
    setTripSheetOpen(false);
    setTimeout(() => setSelectedTripId(null), 300);
  }, []);

  const handleTabChange = useCallback((tab: DiscoverTab) => {
    haptic('light');
    setActiveTab(tab);
  }, []);

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;
  const hasStackedSheet = gameSheetOpen || tripSheetOpen;
  
  // Check if time-of-day chips should be disabled (only works with single date, no specific time)
  const timeChipsDisabled = dateFilter.mode !== 'single' || !!dateFilter.singleTime;

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

          {/* Sheet - blue gradient theme matching Discover Games tile */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-[24px] overflow-hidden discover-games-sheet-wrapper ${hasStackedSheet ? 'stacked-behind' : ''}`}
            style={{
              height: '90svh',
              maxHeight: '90svh',
              background: '#F8FAFC',
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

            {/* Header bar */}
            <div className="flex-shrink-0">
              {/* Grabber */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>

              {/* Header with subtitle */}
              <div className="flex items-start justify-between px-5 pb-4">
                <div>
                  <h2 
                    className="text-[20px] font-bold leading-tight"
                    style={{ color: '#1e293b', letterSpacing: '-0.02em' }}
                  >
                    Discover
                  </h2>
                  <p className="text-[13px] mt-0.5 text-slate-500">
                    Find games and trips to join
                  </p>
                </div>
                
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-full transition-all duration-150 hover:bg-slate-100 active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="px-5 pb-3 flex-shrink-0">
              <DiscoverTabPills
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Search - premium card style */}
            <div className="px-5 pb-3 flex-shrink-0">
              <DiscoverSearchInput
                value={searchInput}
                onChange={setSearchInput}
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

            {/* Time-of-day chips */}
            {dateFilter.mode === 'single' && !dateFilter.singleTime && (
              <div className="px-5 pb-3 flex-shrink-0">
                <TimeOfDayChips
                  value={timeOfDay}
                  onChange={setTimeOfDay}
                  disabled={timeChipsDisabled}
                />
              </div>
            )}

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
                  entityType={activeTab}
                  onRetry={() => activeTab === 'games' ? gamesQuery.refetch() : tripsQuery.refetch()}
                />
              ) : activeTab === 'games' ? (
                games.length === 0 ? (
                  <DiscoverEmptyState type="empty" entityType="games" />
                ) : (
                  <div className="space-y-3">
                    {games.map((game) => (
                      <GameDiscoverCard
                        key={game.id}
                        game={game}
                        onTap={() => handleOpenGameDetail(game.id)}
                        onRequestJoin={() => handleOpenGameRequestModal(game.id)}
                        isRequesting={pendingRequestId === game.id && joinGameMutation.isPending}
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
                  <DiscoverEmptyState type="empty" entityType="trips" />
                ) : (
                  <div className="space-y-3">
                    {trips.map((trip) => (
                      <TripDiscoverCard
                        key={trip.id}
                        trip={trip}
                        onTap={() => handleOpenTripDetail(trip.id)}
                        onRequestJoin={() => handleOpenTripRequestModal(trip.id)}
                        isRequesting={pendingRequestId === trip.id && joinTripMutation.isPending}
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

          {/* Trip Detail Sheet (stacked) - uses full trip detail with tabs */}
          {selectedTripId && (
            <TripDetailSheetV2
              isOpen={tripSheetOpen}
              onClose={handleCloseTripDetail}
              tripId={selectedTripId}
            />
          )}

          {/* Request Note Modal */}
          <RequestNoteModal
            isOpen={requestModalOpen}
            onClose={() => {
              setRequestModalOpen(false);
              setPendingRequestId(null);
            }}
            onSubmit={handleSubmitRequest}
            isSubmitting={joinGameMutation.isPending || joinTripMutation.isPending}
            entityType={requestModalType}
          />
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
