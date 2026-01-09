/**
 * HubGamesTripsSheet - Half-height Hub Sheet
 * 
 * Simple 3-card menu for Games & Trips
 * Opens to ~45% height (visually halfway up hero)
 * No internal scroll, matches Hub design language
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, CalendarDays, Plus, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { useHub } from '../useHub';
import '../home/hubThemeLight.css';

interface HubGamesTripsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreate: () => void;
}

interface MenuCardProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  isPrimary?: boolean;
}

function MenuCard({ icon, title, subtitle, onClick, isPrimary }: MenuCardProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.98]"
      style={{
        background: isPrimary 
          ? 'linear-gradient(135deg, rgba(110, 146, 119, 0.06) 0%, rgba(137, 167, 140, 0.03) 100%)'
          : 'var(--hub-glass-bg)',
        border: isPrimary 
          ? '1px solid rgba(110, 146, 119, 0.2)'
          : '1px solid var(--hub-stroke-subtle)',
        boxShadow: 'var(--hub-shadow-tile)',
      }}
    >
      {/* Icon circle - matched to Hub tile sizing */}
      <div 
        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
        style={{
          background: isPrimary 
            ? 'linear-gradient(135deg, #6E9277 0%, #89A78C 100%)'
            : 'var(--hub-glass-bg-input)',
          border: isPrimary ? 'none' : '1px solid var(--hub-stroke-subtle)',
        }}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div 
          className="text-[15px] font-semibold"
          style={{ color: 'var(--hub-text)' }}
        >
          {title}
        </div>
        <div 
          className="text-[13px] mt-0.5 line-clamp-1"
          style={{ color: 'var(--hub-text-sub)' }}
        >
          {subtitle}
        </div>
      </div>

      {/* Chevron - subtle */}
      <ChevronRight 
        className="flex-shrink-0 w-5 h-5 opacity-40"
        style={{ color: 'var(--hub-text-dim)' }}
      />
    </button>
  );
}

export function HubGamesTripsSheet({ isOpen, onClose, onOpenCreate }: HubGamesTripsSheetProps) {
  const navigate = useNavigate();
  const { close: closeHub } = useHub();
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Scroll-lock
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen && !wasOpenRef.current) {
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
      wasOpenRef.current = true;
    } else if (!isOpen && wasOpenRef.current) {
      rootEl.style.overflow = '';
      rootEl.scrollTop = rootScrollTopRef.current;
      wasOpenRef.current = false;
    }

    return () => {
      if (wasOpenRef.current) {
        rootEl.style.overflow = '';
        rootEl.scrollTop = rootScrollTopRef.current;
        wasOpenRef.current = false;
      }
    };
  }, [isOpen]);

  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleDiscoverGames = () => {
    haptic('light');
    onClose();
    closeHub();
    navigate('/nearby');
  };

  const handleYourGamesTrips = () => {
    haptic('light');
    onClose();
    closeHub();
    navigate('/diary');
  };

  const handleCreateGameTrip = () => {
    haptic('medium');
    onClose();
    onOpenCreate();
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/40 z-[10001]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />

          {/* Sheet - ~45% height to sit visually halfway up hero */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-[26px] overflow-hidden flex flex-col"
            style={{
              height: '45vh',
              background: 'var(--hub-bg-start)',
              boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.12)',
              overscrollBehavior: 'contain',
            }}
            onClick={handleSheetClick}
          >
            {/* Header */}
            <div 
              className="flex-shrink-0"
              style={{ background: 'var(--hub-bg-start)' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div 
                  className="w-10 h-1 rounded-full"
                  style={{ background: 'var(--hub-stroke)' }}
                />
              </div>

              {/* Title */}
              <div className="px-5 pb-4">
                <h2 
                  className="text-[20px] font-bold"
                  style={{ color: 'var(--hub-text)' }}
                >
                  Games & Trips
                </h2>
                <p 
                  className="text-[13px] mt-0.5"
                  style={{ color: 'var(--hub-text-sub)' }}
                >
                  Plan games, organise trips, invite golfers
                </p>
              </div>
            </div>

            {/* Cards - no scroll needed */}
            <div className="flex-1 px-5 pb-6 flex flex-col gap-3">
              <MenuCard
                icon={<Search className="w-5 h-5" style={{ color: 'var(--hub-text-sub)' }} />}
                title="Discover Games"
                subtitle="Find games near you or join one"
                onClick={handleDiscoverGames}
              />

              <MenuCard
                icon={<CalendarDays className="w-5 h-5" style={{ color: 'var(--hub-text-sub)' }} />}
                title="Your Games & Trips"
                subtitle="Upcoming games and trips"
                onClick={handleYourGamesTrips}
              />

              <MenuCard
                icon={<Plus className="w-5 h-5 text-white" />}
                title="Create Game or Trip"
                subtitle="Set up a game, invite players, or plan a golf trip"
                onClick={handleCreateGameTrip}
                isPrimary
              />
            </div>

            {/* Safe area padding */}
            <div 
              className="flex-shrink-0"
              style={{ height: 'env(safe-area-inset-bottom, 0px)' }}
            />
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default HubGamesTripsSheet;
