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

import { TabPills } from './TabPills';
import { SearchInput } from './SearchInput';
import { UpcomingTab } from './UpcomingTab';
import { PastTab } from './PastTab';
import { TripsTab } from './TripsTab';
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
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, defaultTab]);

  // Handler for opening game detail - navigate to full page
  const handleOpenGameDetail = useCallback((gameId: string) => {
    haptic('light');
    onClose();
    // Small delay to let sheet close animation start
    setTimeout(() => {
      window.location.href = `/hub/games/${gameId}`;
    }, 100);
  }, [onClose]);

  // Handler for opening trip detail - navigate to full page
  const handleOpenTripDetail = useCallback((tripId: string) => {
    haptic('light');
    onClose();
    setTimeout(() => {
      window.location.href = `/hub/trips/${tripId}`;
    }, 100);
  }, [onClose]);

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

          {/* Sheet - frosted glass container */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10000] flex flex-col rounded-t-[24px] overflow-hidden your-games-trips-sheet-wrapper"
            style={{
              height: '85svh',
              maxHeight: '85svh',
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.12), 0 -2px 10px rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Grabber - thinner, lighter */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div 
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
              />
            </div>

            {/* Header - premium styling */}
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <div>
                <h2 
                  className="text-[18px] font-semibold leading-tight"
                  style={{ color: '#1e293b', letterSpacing: '-0.02em' }}
                >
                  Your Games & Trips
                </h2>
                <p 
                  className="text-[12px] mt-0.5"
                  style={{ color: 'rgba(100, 116, 139, 0.8)' }}
                >
                  Everything you've planned — games, trips and who's joined.
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

            {/* Gradient divider - soft fade */}
            <div 
              className="h-px mx-5 flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.06) 20%, rgba(0, 0, 0, 0.06) 80%, transparent 100%)',
              }}
            />

            {/* Search - premium styling with inner shadow */}
            <div className="px-5 pt-4 pb-3 flex-shrink-0">
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
              />
            </div>

            {/* Tabs - V2 pills with breathing room */}
            <div className="px-5 pb-4 flex-shrink-0">
              <TabPills
                activeTab={activeTab}
                onTabChange={handleTabChange}
              />
            </div>

            {/* Content - scrollable area */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain px-5 pb-10"
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
                  onTripTap={handleOpenTripDetail}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export default YourGamesTripsSheetV2;
