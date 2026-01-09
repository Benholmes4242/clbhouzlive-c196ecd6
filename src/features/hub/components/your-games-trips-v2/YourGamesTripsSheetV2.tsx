/**
 * YourGamesTripsSheetV2 - Bottom sheet for viewing user's games & trips
 * 
 * Matches CreateGameTripSheetV2 design language:
 * - Glass-lite surface
 * - Premium spacing
 * - No bounce animation
 * - No background scroll jump
 * 
 * Opens GameDetailSheetV2 on game tap (no route change)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { haptic } from '@/utils/haptics';

import { TabPills } from './TabPills';
import { SearchInput } from './SearchInput';
import { UpcomingTab } from './UpcomingTab';
import { PastTab } from './PastTab';
import { TripsTab } from './TripsTab';
import { GameDetailSheetV2 } from '../game-detail-v2';
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
  const [searchQuery, setSearchQuery] = useState('');
  
  // Game detail sheet state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameSheetOpen, setGameSheetOpen] = useState(false);
  
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
        setSearchQuery('');
        setSelectedGameId(null);
        setGameSheetOpen(false);
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

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleTabChange = useCallback((tab: SheetTab) => {
    haptic('light');
    setActiveTab(tab);
    setSearchQuery(''); // Clear search on tab change
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
              background: 'rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-[24px] overflow-hidden"
            style={{
              height: '85svh',
              maxHeight: '85svh',
              backgroundColor: '#F9FAFB',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.12)',
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div 
                className="w-10 h-1 rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.12)' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-2 flex-shrink-0">
              <div>
                <h2 
                  className="text-[19px] font-semibold leading-tight"
                  style={{ color: '#1e293b', letterSpacing: '-0.01em' }}
                >
                  Your Games & Trips
                </h2>
                <p 
                  className="text-[12px] mt-0.5"
                  style={{ color: 'rgba(30, 41, 59, 0.5)' }}
                >
                  Pick up where you left off
                </p>
              </div>
              
              <button
                onClick={handleClose}
                className="p-2 -mr-2 rounded-full transition-colors hover:bg-black/5"
              >
                <X 
                  className="w-5 h-5"
                  style={{ color: 'rgba(30, 41, 59, 0.5)' }}
                />
              </button>
            </div>

            {/* Search */}
            <div className="px-5 pb-3 flex-shrink-0">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {/* Tabs */}
            <div className="px-5 pb-3 flex-shrink-0">
              <TabPills
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-8"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {activeTab === 'upcoming' && (
                <UpcomingTab
                  searchQuery={searchQuery}
                  onCreateGame={handleCreateGame}
                  onGameTap={handleOpenGameDetail}
                />
              )}
              {activeTab === 'past' && (
                <PastTab
                  searchQuery={searchQuery}
                  onGameTap={handleOpenGameDetail}
                />
              )}
              {activeTab === 'trips' && (
                <TripsTab
                  searchQuery={searchQuery}
                  onCreateTrip={handleCreateTrip}
                  onClose={onClose}
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
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export default YourGamesTripsSheetV2;
