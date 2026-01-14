/**
 * GameDetailSheetV2 - Bottom sheet for viewing game details
 * Opens from YourGamesTripsSheet without route change
 * 
 * Matches V2 design language:
 * - Glass-lite surface with frosted header
 * - Premium stacked sheet depth (blur+scale underlying)
 * - No bounce animation
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';

import { useGameDetail } from '@/features/game/hooks/useGameDetail';
import { useGameRsvp } from '@/features/hub/hooks/useGameRsvp';
import { useGameDetailRealtime } from '@/features/hub/hooks/useDetailRealtime';
import { GameDetailContent } from './GameDetailContent';
import { GameDetailSkeleton } from './GameDetailSkeleton';

interface GameDetailSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  initialTab?: 'details' | 'messages' | 'participants';
}

export function GameDetailSheetV2({
  isOpen,
  onClose,
  gameId,
  initialTab = 'details',
}: GameDetailSheetV2Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'messages' | 'participants'>(initialTab);
  
  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Data hooks
  const { game, participants, isLoading, currentUserId, refetch } = useGameDetail(isOpen ? gameId : null);
  const { data: rsvpData, isLoading: rsvpLoading, setRsvp, isUpdating: rsvpUpdating } = useGameRsvp(isOpen ? gameId : undefined);
  
  // Real-time updates
  useGameDetailRealtime(isOpen ? gameId : null);

  // Lock body scroll when sheet is open
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

  // Reset tab when sheet opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleOpenFullPage = useCallback(() => {
    onClose();
    navigate(`/game/${gameId}`);
  }, [onClose, navigate, gameId]);

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - blur + dim for premium stacked feel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[10001]"
            style={{
              background: 'rgba(0, 0, 0, 0.18)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={handleClose}
          />

          {/* Underlying sheet scale effect - applied via CSS on YourGamesTripsSheet */}
          <style>{`
            .your-games-trips-sheet-wrapper {
              transition: transform 0.25s ease-out, opacity 0.25s ease-out;
            }
            .your-games-trips-sheet-wrapper.stacked-behind {
              transform: scale(0.985);
              opacity: 0.96;
            }
          `}</style>

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[24px] overflow-hidden"
            style={{
              height: '95svh',
              maxHeight: '95svh',
              background: '#F8FAFC',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Grabber - thinner, lighter */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div 
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
              />
            </div>

            {/* Header - frosted glass chrome */}
            <div 
              className="flex items-center gap-3 px-4 pt-1 pb-3 flex-shrink-0"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <button
                onClick={handleClose}
                className="p-2 -ml-2 rounded-full transition-colors hover:bg-black/5"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: 'rgba(30, 41, 59, 0.7)' }} />
              </button>

              {/* Fixed height header to prevent layout jump */}
              <div className="flex-1 min-w-0 min-h-[44px] flex flex-col justify-center">
                {isLoading || !game ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-5 w-36 bg-black/5 rounded-lg" />
                    <div className="h-3 w-24 bg-black/5 rounded-lg" />
                  </div>
                ) : (
                  <>
                    <h2 
                      className="text-[17px] font-semibold leading-tight truncate"
                      style={{ color: '#1e293b', letterSpacing: '-0.01em' }}
                    >
                      {game.course_name || 'Golf Game'}
                    </h2>
                    <p 
                      className="text-[12px]"
                      style={{ color: 'rgba(30, 41, 59, 0.5)' }}
                    >
                      {format(new Date(game.start_time), 'EEE d MMM · HH:mm')}
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Fading divider - not hard line */}
            <div 
              className="h-px flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 15%, rgba(0,0,0,0.06) 85%, transparent 100%)',
              }}
            />

            {/* Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {isLoading || !game ? (
                <GameDetailSkeleton />
              ) : (
                <GameDetailContent
                  game={game}
                  participants={participants}
                  currentUserId={currentUserId}
                  rsvpData={rsvpData}
                  rsvpLoading={rsvpLoading}
                  rsvpUpdating={rsvpUpdating}
                  setRsvp={setRsvp}
                  refetch={refetch}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onOpenFullPage={handleOpenFullPage}
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
