/**
 * YourGamesTripsSheetV2 - Bottom sheet for viewing user's games & trips
 * 
 * V2 Premium Polish:
 * - Frosted glass sheet container
 * - Premium header with gradient divider
 * - Refined search input with inner shadow
 * - V2 pill tabs with subtle elevation
 * - No bounce animation, no background jump
 * 
 * Opens GameDetailSheetV2 / TripDetailSheetV2 on tap (no route change)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useDebounce } from '@/hooks/useDebounce';

import { TabPills } from './TabPills';
import { SearchInput } from './SearchInput';
import { UpcomingTab } from './UpcomingTab';
import { PastTab } from './PastTab';
import { TripsTab } from './TripsTab';
import { GameDetailSheetV2 } from '../game-detail-v2';
import { TripDetailSheetV2 } from '../trip/TripDetailSheetV2';
import { useUserTripsRealtime } from '../../hooks/useUserTripsRealtime';
import type { SheetTab } from './types';

interface YourGamesTripsSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SheetTab;
  onOpenCreateGame?: () => void;
  onOpenCreateTrip?: () => void;
}

export function YourGamesTripsSheetV2({ 
  isOpen, 
  onClose, 
  defaultTab = 'upcoming',
  onOpenCreateGame,
  onOpenCreateTrip,
}: YourGamesTripsSheetV2Props) {
  const [activeTab, setActiveTab] = useState<SheetTab>(defaultTab);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300); // FIX: Add 300ms debounce
  
  // Enable trip realtime updates
  useUserTripsRealtime();
  
  // Game detail sheet state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameSheetOpen, setGameSheetOpen] = useState(false);
  
  // Trip detail sheet state
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [tripSheetOpen, setTripSheetOpen] = useState(false);
  
  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Lock body scroll when sheet is open - preserve scroll position
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Store current scroll position
      scrollYRef.current = window.scrollY;
      
      // Lock body at current position
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollYRef.current}px`;
      document.body.style.left = '0';
      document.body.style.right = '0';
      document.body.style.overflow = 'hidden';
      
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      // Restore body styles
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      
      // Restore scroll position
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
        setActiveTab(defaultTab);
        setSearchInput('');
        setSelectedGameId(null);
        setGameSheetOpen(false);
        setSelectedTripId(null);
        setTripSheetOpen(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultTab]);

  // Handler for opening game detail sheet (no navigation)
  const handleOpenGameDetail = useCallback((gameId: string) => {
    haptic('light');
    setSelectedGameId(gameId);
    setGameSheetOpen(true);
  }, []);

  const handleCloseGameDetail = useCallback(() => {
    setGameSheetOpen(false);
    // Keep selectedGameId for animation, clear after close
    setTimeout(() => setSelectedGameId(null), 300);
  }, []);

  // Handler for opening trip detail sheet (no navigation)
  const handleOpenTripDetail = useCallback((tripId: string) => {
    haptic('light');
    setSelectedTripId(tripId);
    setTripSheetOpen(true);
  }, []);

  const handleCloseTripDetail = useCallback(() => {
    setTripSheetOpen(false);
    setTimeout(() => setSelectedTripId(null), 300);
  }, []);

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleTabChange = useCallback((tab: SheetTab) => {
    haptic('light');
    setActiveTab(tab);
    setSearchInput(''); // Clear search on tab change
  }, []);

  const handleCreateGame = useCallback(() => {
    onClose();
    onOpenCreateGame?.();
  }, [onClose, onOpenCreateGame]);

  const handleCreateTrip = useCallback(() => {
    onClose();
    onOpenCreateTrip?.();
  }, [onClose, onOpenCreateTrip]);

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;
  
  // Determine if any nested sheet is open for stacking effect
  const hasStackedSheet = gameSheetOpen || tripSheetOpen;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - blur + dim */}
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

          {/* Sheet - green gradient theme matching Your Schedule tile */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className={`fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-[24px] overflow-hidden your-games-trips-sheet-wrapper ${hasStackedSheet ? 'stacked-behind trip-stacked-behind' : ''}`}
            style={{
              height: '90svh',
              maxHeight: '90svh',
              background: '#F8FAFC',
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.12), 0 -2px 10px rgba(0, 0, 0, 0.06)',
              borderTop: '1px solid rgba(255, 255, 255, 0.9)',
            }}
          >
            {/* Themed header bar - matches Your Schedule green gradient */}
            <div 
              className="flex-shrink-0 rounded-t-[24px]"
              style={{
                background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 50%, #a5d6a7 100%)',
              }}
            >
              {/* Grabber */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-white/60" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-5 pb-4">
                <h2 
                  className="text-[20px] font-bold leading-tight"
                  style={{ color: '#1e293b', letterSpacing: '-0.02em' }}
                >
                  Your Games & Trips
                </h2>
                
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 rounded-full transition-all duration-150 hover:bg-white/30 active:scale-95"
                  style={{ background: 'rgba(255, 255, 255, 0.4)' }}
                >
                  <X 
                    className="w-5 h-5"
                    style={{ color: '#2e7d32' }}
                  />
                </button>
              </div>
            </div>

            {/* Search - premium card style */}
            <div className="px-5 pb-4 flex-shrink-0">
              <SearchInput
                value={searchInput}
                onChange={setSearchInput}
              />
            </div>

            {/* Tabs - V2 pills with subtle background container */}
            <div className="px-5 pb-4 flex-shrink-0">
              <div 
                className="p-1 rounded-[14px]"
                style={{ background: '#e2e8f0' }}
              >
                <TabPills
                  activeTab={activeTab}
                  onTabChange={handleTabChange}
                />
              </div>
            </div>

            {/* Content - scrollable area */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-10"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {activeTab === 'upcoming' && (
                <UpcomingTab
                  searchQuery={debouncedSearch}
                  onCreateGame={handleCreateGame}
                  onGameTap={handleOpenGameDetail}
                />
              )}
              {activeTab === 'past' && (
                <PastTab
                  searchQuery={debouncedSearch}
                  onGameTap={handleOpenGameDetail}
                />
              )}
              {activeTab === 'trips' && (
                <TripsTab
                  searchQuery={debouncedSearch}
                  onCreateTrip={handleCreateTrip}
                  onTripTap={handleOpenTripDetail}
                />
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

          {/* Trip Detail Sheet (stacked) */}
          {selectedTripId && (
            <TripDetailSheetV2
              isOpen={tripSheetOpen}
              onClose={handleCloseTripDetail}
              tripId={selectedTripId}
            />
          )}
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export default YourGamesTripsSheetV2;
