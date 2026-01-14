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
      className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.99] active:opacity-95"
      style={{
        background: isPrimary 
          ? 'linear-gradient(180deg, #FFFAF5 0%, #FEF7F0 100%)'
          : 'linear-gradient(180deg, #FFFFFF 0%, #FAFBFC 100%)',
        border: '1px solid rgba(0, 0, 0, 0.04)',
        boxShadow: isPrimary
          ? '0 2px 8px rgba(255, 140, 60, 0.08), 0 4px 16px rgba(0, 0, 0, 0.03)'
          : '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* Icon container - gradient circle with subtle shadow */}
      <div 
        className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center"
        style={{
          background: isPrimary 
            ? 'linear-gradient(135deg, #FFF9F5 0%, #FEF3EC 100%)'
            : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        }}
      >
        {icon}
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div 
          className="text-[15px] font-semibold leading-tight"
          style={{ color: '#1e293b' }}
        >
          {title}
        </div>
        <div 
          className="text-[13px] mt-0.5 truncate"
          style={{ color: '#64748b' }}
        >
          {subtitle}
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight 
        className="flex-shrink-0 w-5 h-5"
        style={{ color: 'rgba(148, 163, 184, 0.6)' }}
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
    // Navigate directly without calling closeHub() which would nav(-1) first
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

          {/* Sheet - anchored to bottom, premium warm gradient */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-[28px] overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, #FDFCFB 0%, #F5F3F0 100%)',
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.12), 0 -2px 10px rgba(0, 0, 0, 0.06)',
              borderTop: '1px solid rgba(255, 255, 255, 0.9)',
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
                <div className="px-5 pb-2">
                  <span 
                    className="text-[10px] font-bold uppercase tracking-[0.1em]"
                    style={{ color: 'rgba(100, 116, 139, 0.5)' }}
                  >
                    Requests
                  </span>
                </div>
                <div className="px-5 pb-4">
                  <button
                    onClick={handleRequests}
                    className="w-full flex items-center gap-3.5 p-4 rounded-2xl text-left transition-all duration-150 active:scale-[0.99] active:opacity-95"
                    style={{
                      background: 'linear-gradient(180deg, #F8FAFF 0%, #F0F4FF 100%)',
                      border: '1px solid rgba(59, 130, 246, 0.08)',
                      boxShadow: '0 2px 8px rgba(59, 130, 246, 0.06), 0 4px 16px rgba(0, 0, 0, 0.03)',
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center relative"
                      style={{
                        background: 'linear-gradient(135deg, #EEF4FF 0%, #E0EBFF 100%)',
                        boxShadow: '0 1px 3px rgba(59, 130, 246, 0.08)',
                      }}
                    >
                      <Inbox className="w-5 h-5" style={{ color: '#3b82f6' }} />
                      {/* Badge */}
                      <span 
                        className="absolute -top-1.5 -right-1.5 min-w-[20px] h-[20px] rounded-full flex items-center justify-center text-[11px] font-bold px-1.5"
                        style={{
                          background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                          color: 'white',
                          boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                        }}
                      >
                        {pendingRequestsCount}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div 
                        className="text-[15px] font-semibold leading-tight"
                        style={{ color: '#1e293b' }}
                      >
                        Join Requests
                      </div>
                      <div 
                        className="text-[13px] mt-0.5 truncate"
                        style={{ color: '#64748b' }}
                      >
                        Approve players wanting to join your games
                      </div>
                    </div>
                    <ChevronRight 
                      className="flex-shrink-0 w-5 h-5"
                      style={{ color: 'rgba(148, 163, 184, 0.6)' }}
                    />
                  </button>
                </div>
              </>
            )}

            {/* Section label - refined */}
            <div className="px-5 pb-2">
              <span 
                className="text-[10px] font-bold uppercase tracking-[0.1em]"
                style={{ color: 'rgba(100, 116, 139, 0.5)' }}
              >
                Quick actions
              </span>
            </div>

            {/* Cards - premium spacing */}
            <div className="px-5 pb-6 flex flex-col gap-2.5">
              <MenuCard
                icon={<Search className="w-5 h-5" style={{ color: '#64748b' }} />}
                title="Discover Games"
                subtitle="Find games near you or join one"
                onClick={handleDiscoverGames}
              />

              <MenuCard
                icon={<CalendarDays className="w-5 h-5" style={{ color: '#10b981' }} />}
                title="Your Games & Trips"
                subtitle="Upcoming games and trips"
                onClick={handleYourGamesTrips}
              />

              <MenuCard
                icon={<Plus className="w-5 h-5" style={{ color: '#ea580c' }} />}
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
