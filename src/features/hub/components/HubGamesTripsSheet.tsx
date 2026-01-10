/**
 * HubGamesTripsSheet - Polished Hub Sheet
 * 
 * Simple menu for Games & Trips with Requests section
 * Matches Hub design language precisely
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Search, CalendarDays, Plus, ChevronRight, Inbox } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptic } from '@/utils/haptics';
import { useHub } from '../useHub';
import { YourGamesTripsSheetV2 } from './your-games-trips-v2';
import { RequestsSheet } from './requests';
import { useHostPendingRequests } from '../hooks/useHostPendingRequests';
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
      className="w-full flex items-center gap-3 pl-3 pr-3 py-3 rounded-[20px] text-left transition-all duration-150 active:scale-[0.99] active:opacity-90"
      style={{
        background: isPrimary 
          ? 'linear-gradient(135deg, rgba(255, 140, 60, 0.06) 0%, rgba(255, 180, 100, 0.03) 100%)'
          : 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: isPrimary
          ? '0 2px 8px rgba(255, 140, 60, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03)'
          : '0 1px 3px rgba(0, 0, 0, 0.03)',
      }}
    >
      {/* Icon circle */}
      <div 
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: isPrimary 
            ? 'linear-gradient(135deg, rgba(255, 140, 60, 0.14) 0%, rgba(255, 160, 90, 0.08) 100%)'
            : 'rgba(0, 0, 0, 0.03)',
          border: '1px solid rgba(0, 0, 0, 0.04)',
        }}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div 
          className="text-[15px] font-semibold leading-tight"
          style={{ color: 'var(--hub-text)' }}
        >
          {title}
        </div>
        <div 
          className="text-[12.5px] mt-px truncate"
          style={{ color: 'var(--hub-text-dim)', opacity: 0.65 }}
        >
          {subtitle}
        </div>
      </div>

      {/* Chevron - consistent positioning */}
      <ChevronRight 
        className="flex-shrink-0 w-4 h-4 mr-0.5"
        style={{ color: 'var(--hub-text-dim)', opacity: 0.3 }}
      />
    </button>
  );
}

export function HubGamesTripsSheet({ isOpen, onClose, onOpenCreate }: HubGamesTripsSheetProps) {
  const navigate = useNavigate();
  const { close: closeHub } = useHub();
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  
  // State for nested sheets
  const [yourGamesTripsOpen, setYourGamesTripsOpen] = useState(false);
  const [requestsOpen, setRequestsOpen] = useState(false);
  
  // Get pending requests count
  const { count: pendingRequestsCount } = useHostPendingRequests();

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
    navigate('/games/discover');
  };

  const handleYourGamesTrips = () => {
    haptic('light');
    onClose();
    setYourGamesTripsOpen(true);
  };

  const handleRequests = () => {
    haptic('light');
    onClose();
    setRequestsOpen(true);
  };

  const handleCreateGameTrip = () => {
    haptic('medium');
    onClose();
    onOpenCreate();
  };

  if (typeof document === 'undefined') return null;

  const sheetPortal = createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - with blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[10001]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />

          {/* Sheet - anchored to bottom, sits halfway up hero */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-[28px] overflow-hidden"
            style={{
              background: '#F8FAFC',
              boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08), 0 -1px 0 rgba(255, 255, 255, 0.5) inset',
              borderTop: '1px solid rgba(255, 255, 255, 0.8)',
              overscrollBehavior: 'contain',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
            onClick={handleSheetClick}
          >
            {/* Drag handle - shorter and softer */}
            <div className="flex justify-center pt-2.5 pb-1.5">
              <div 
                className="w-8 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.12)' }}
              />
            </div>

            {/* Header - tighter spacing */}
            <div className="px-5 pb-3">
              <h2 
                className="text-[19px] font-bold leading-tight"
                style={{ color: 'var(--hub-text)' }}
              >
                Games & Trips
              </h2>
              <p 
                className="text-[12.5px] mt-0.5 truncate"
                style={{ color: 'var(--hub-text-dim)', opacity: 0.65 }}
              >
                Plan games, organise trips, invite golfers
              </p>
            </div>

            {/* Requests section - only show if there are pending requests */}
            {pendingRequestsCount > 0 && (
              <>
                <div className="px-5 pb-1.5">
                  <span 
                    className="text-[10px] font-medium uppercase tracking-wide"
                    style={{ color: 'var(--hub-text-dim)', opacity: 0.4 }}
                  >
                    Requests
                  </span>
                </div>
                <div className="px-5 pb-3">
                  <button
                    onClick={handleRequests}
                    className="w-full flex items-center gap-3 pl-3 pr-3 py-3 rounded-[20px] text-left transition-all duration-150 active:scale-[0.99] active:opacity-90"
                    style={{
                      background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.06) 0%, rgba(99, 102, 241, 0.03) 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.1)',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.06), 0 1px 2px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center relative"
                      style={{
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.14) 0%, rgba(99, 102, 241, 0.08) 100%)',
                        border: '1px solid rgba(59, 130, 246, 0.15)',
                      }}
                    >
                      <Inbox className="w-[18px] h-[18px]" style={{ color: '#3b82f6' }} />
                      {/* Badge */}
                      <span 
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                          color: 'white',
                          boxShadow: '0 2px 6px rgba(59, 130, 246, 0.4)',
                        }}
                      >
                        {pendingRequestsCount}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-[15px] font-semibold leading-tight"
                        style={{ color: 'var(--hub-text)' }}
                      >
                        Join Requests
                      </div>
                      <div 
                        className="text-[12.5px] mt-px truncate"
                        style={{ color: 'var(--hub-text-dim)', opacity: 0.65 }}
                      >
                        Approve players wanting to join your games
                      </div>
                    </div>
                    <ChevronRight 
                      className="flex-shrink-0 w-4 h-4 mr-0.5"
                      style={{ color: 'var(--hub-text-dim)', opacity: 0.3 }}
                    />
                  </button>
                </div>
              </>
            )}

            {/* Section label - subtle */}
            <div className="px-5 pb-1.5">
              <span 
                className="text-[10px] font-medium uppercase tracking-wide"
                style={{ color: 'var(--hub-text-dim)', opacity: 0.4 }}
              >
                Quick actions
              </span>
            </div>

            {/* Cards - tighter gaps */}
            <div className="px-5 pb-5 flex flex-col gap-2">
              <MenuCard
                icon={<Search className="w-[18px] h-[18px]" style={{ color: 'var(--hub-text-sub)' }} />}
                title="Discover Games"
                subtitle="Find games near you or join one"
                onClick={handleDiscoverGames}
              />

              <MenuCard
                icon={<CalendarDays className="w-[18px] h-[18px]" style={{ color: 'var(--hub-text-sub)' }} />}
                title="Your Games & Trips"
                subtitle="Upcoming games and trips"
                onClick={handleYourGamesTrips}
              />

              <MenuCard
                icon={<Plus className="w-[18px] h-[18px]" style={{ color: 'rgba(180, 90, 30, 0.85)' }} />}
                title="Create Game or Trip"
                subtitle="Set up a game, invite players, or plan a trip"
                onClick={handleCreateGameTrip}
                isPrimary
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );

  return (
    <>
      {sheetPortal}
      
      {/* Nested Your Games & Trips Sheet */}
      <YourGamesTripsSheetV2
        isOpen={yourGamesTripsOpen}
        onClose={() => setYourGamesTripsOpen(false)}
        onOpenCreateGame={onOpenCreate}
        onOpenCreateTrip={onOpenCreate}
      />
      
      {/* Requests Sheet */}
      <RequestsSheet
        isOpen={requestsOpen}
        onClose={() => setRequestsOpen(false)}
      />
    </>
  );
}

export default HubGamesTripsSheet;
