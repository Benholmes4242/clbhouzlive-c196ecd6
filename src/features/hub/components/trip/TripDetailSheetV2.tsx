/**
 * TripDetailSheetV2 - Bottom sheet for viewing trip details
 * Opens from YourGamesTripsSheet without route change
 * 
 * Matches GameDetailSheetV2 design language:
 * - Glass-lite surface with frosted header
 * - Premium stacked sheet depth (blur+scale underlying)
 * - No bounce animation
 * 
 * V2: Added Edit/Remove actions with confirmation dialogs
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, MoreVertical, ExternalLink, LogOut, Trash2, Share2, Loader2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { haptic } from '@/utils/haptics';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useTripTimeline } from '../../hooks/useTripTimeline';
import { useCancelTrip, useLeaveTrip } from '../../hooks/useTripActions';
import { TripHeader } from './TripHeader';
import { TripTimeline } from './TripTimeline';
import { GameDetailSheetV2 } from '../game-detail-v2/GameDetailSheetV2';

interface TripDetailSheetV2Props {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
}

function formatTripDateRange(startDate: Date, endDate: Date): string {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  if (startYear === endYear) {
    return `${format(startDate, 'EEE d MMM')} – ${format(endDate, 'EEE d MMM')} · ${startYear}`;
  }
  return `${format(startDate, 'EEE d MMM yyyy')} – ${format(endDate, 'EEE d MMM yyyy')}`;
}

export function TripDetailSheetV2({
  isOpen,
  onClose,
  tripId,
}: TripDetailSheetV2Props) {
  const navigate = useNavigate();
  
  // Scroll lock refs
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);

  // Data hooks
  const { 
    trip, 
    participants, 
    timeline, 
    isLoading, 
    error, 
    isHost, 
    currentUserId,
    todayDayNumber, 
    hasMultipleDays, 
    hasTodayInTrip 
  } = useTripTimeline(isOpen ? tripId : undefined);

  // Action hooks
  const cancelTrip = useCancelTrip();
  const leaveTrip = useLeaveTrip();

  // Dialog states
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  // Nested game sheet state
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [gameSheetOpen, setGameSheetOpen] = useState(false);

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

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleOpenFullPage = useCallback(() => {
    onClose();
    setTimeout(() => {
      navigate(`/hub/trip/${tripId}?tab=timeline`);
    }, 100);
  }, [onClose, navigate, tripId]);

  const handleGameTap = useCallback((gameId: string) => {
    haptic('light');
    setSelectedGameId(gameId);
    setGameSheetOpen(true);
  }, []);

  const handleCloseGameSheet = useCallback(() => {
    setGameSheetOpen(false);
    setTimeout(() => setSelectedGameId(null), 300);
  }, []);

  const handleAddRound = useCallback(() => {
    haptic('light');
    onClose();
    setTimeout(() => {
      navigate(`/create-game?tripId=${tripId}`);
    }, 150);
  }, [onClose, navigate, tripId]);

  // Remove trip (host only)
  const handleRemoveTrip = useCallback(async () => {
    if (!trip) return;
    
    setIsRemoving(true);
    haptic('heavy');
    
    try {
      // Get participant user IDs (excluding host)
      const participantUserIds = participants
        .filter(p => p.userId !== currentUserId)
        .map(p => p.userId);
      
      await cancelTrip.mutateAsync({
        tripId,
        tripName: trip.name,
        participantUserIds,
      });
      
      toast.success('Trip removed', {
        description: participantUserIds.length > 0 
          ? `${participantUserIds.length} participant(s) notified` 
          : undefined,
      });
      
      setShowRemoveDialog(false);
      onClose();
    } catch (error) {
      console.error('[TripDetailSheetV2] Remove failed:', error);
      toast.error('Failed to remove trip');
    } finally {
      setIsRemoving(false);
    }
  }, [trip, tripId, participants, currentUserId, cancelTrip, onClose]);

  // Leave trip (non-host)
  const handleLeaveTrip = useCallback(async () => {
    if (!currentUserId) return;
    
    setIsRemoving(true);
    haptic('medium');
    
    try {
      await leaveTrip.mutateAsync({
        tripId,
        userId: currentUserId,
      });
      
      toast.success('Left trip');
      setShowLeaveDialog(false);
      onClose();
    } catch (error) {
      console.error('[TripDetailSheetV2] Leave failed:', error);
      toast.error('Failed to leave trip');
    } finally {
      setIsRemoving(false);
    }
  }, [tripId, currentUserId, leaveTrip, onClose]);

  if (!isOpen) return null;

  const portalRoot = document.getElementById('portal-root') || document.body;

  // Only show "Trip not found" if trip query returned null/error AND no loading
  const tripNotFound = !isLoading && !trip && error;

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
            className="fixed inset-0 z-[10100]"
            style={{
              background: 'rgba(0, 0, 0, 0.18)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={handleClose}
          />

          {/* Stacked depth CSS */}
          <style>{`
            .your-games-trips-sheet-wrapper.trip-stacked-behind {
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
            className={`fixed inset-x-0 bottom-0 z-[10200] flex flex-col rounded-t-[28px] overflow-hidden ${gameSheetOpen ? 'trip-sheet-stacked' : ''}`}
            style={{
              height: 'calc(100dvh - 16px)',
              maxHeight: 'calc(100dvh - 16px)',
              backgroundColor: '#F9FAFB',
              boxShadow: '0 -4px 32px rgba(0, 0, 0, 0.15)',
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div 
                className="w-10 h-[4px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.10)' }}
              />
            </div>

            {/* Header - frosted glass chrome */}
            <div 
              className="flex items-center gap-3 px-4 pb-3 flex-shrink-0 min-h-[72px]"
              style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Back button */}
              <button
                onClick={handleClose}
                className="h-10 w-10 -ml-2 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 active:bg-black/10"
              >
                <ChevronLeft className="w-5 h-5" style={{ color: 'rgba(30, 41, 59, 0.7)' }} />
              </button>

              {/* Title + date - fixed height */}
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                {isLoading ? (
                  <div className="space-y-1.5 animate-pulse">
                    <div className="h-5 w-40 bg-black/10 rounded-lg" />
                    <div className="h-3 w-28 bg-black/10 rounded-lg mt-2" />
                  </div>
                ) : trip ? (
                  <>
                    <h2 
                      className="text-[17px] font-semibold leading-tight truncate line-clamp-1"
                      style={{ color: '#1e293b', letterSpacing: '-0.01em' }}
                    >
                      {trip.name}
                    </h2>
                    <p 
                      className="text-[12.5px] leading-tight mt-0.5"
                      style={{ color: 'rgba(100, 116, 139, 0.8)' }}
                    >
                      {formatTripDateRange(trip.startDate, trip.endDate)}
                    </p>
                  </>
                ) : (
                  <h2 
                    className="text-[17px] font-semibold leading-tight"
                    style={{ color: '#1e293b' }}
                  >
                    Trip
                  </h2>
                )}
              </div>

              {/* Overflow menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 -mr-2 rounded-full flex items-center justify-center transition-colors hover:bg-black/5 active:bg-black/10">
                    <MoreVertical className="w-5 h-5" style={{ color: 'rgba(30, 41, 59, 0.6)' }} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleOpenFullPage} className="gap-2">
                    <ExternalLink className="w-4 h-4" />
                    Open full page
                  </DropdownMenuItem>
                  {isHost && (
                    <DropdownMenuItem className="gap-2">
                      <Pencil className="w-4 h-4" />
                      Edit trip
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem className="gap-2">
                    <Share2 className="w-4 h-4" />
                    Share trip
                  </DropdownMenuItem>
                  {!isHost && (
                    <DropdownMenuItem 
                      onClick={() => setShowLeaveDialog(true)}
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      Leave trip
                    </DropdownMenuItem>
                  )}
                  {isHost && (
                    <DropdownMenuItem 
                      onClick={() => setShowRemoveDialog(true)}
                      className="gap-2 text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove trip
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Fading divider */}
            <div 
              className="h-px flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.06) 15%, rgba(0,0,0,0.06) 85%, transparent 100%)',
              }}
            />

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {isLoading ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : tripNotFound ? (
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <h2 className="font-semibold text-foreground mb-1">Trip not found</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    This trip may have been deleted or you don't have access.
                  </p>
                  <Button onClick={handleClose}>Close</Button>
                </div>
              ) : error && trip ? (
                // Trip exists but participants/games failed
                <div className="flex flex-col items-center justify-center h-64 text-center px-6">
                  <h2 className="font-semibold text-foreground mb-1">Couldn't load trip</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Please try again
                  </p>
                  <Button onClick={() => window.location.reload()}>Retry</Button>
                </div>
              ) : trip ? (
                <div className="px-4 py-4 space-y-4">
                  <TripHeader trip={trip} participants={participants} />
                  
                  <div className="pt-2">
                    <h3 
                      className="text-[11px] font-semibold uppercase tracking-wider mb-3"
                      style={{ color: 'rgba(100, 116, 139, 0.5)' }}
                    >
                      Timeline
                    </h3>
                    <TripTimeline 
                      items={timeline} 
                      isLoading={false}
                      onGameTap={handleGameTap}
                      onAddRound={isHost ? handleAddRound : undefined}
                      todayDayNumber={todayDayNumber}
                      hasMultipleDays={hasMultipleDays}
                      hasTodayInTrip={hasTodayInTrip}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>

          {/* Nested Game Detail Sheet */}
          {selectedGameId && (
            <GameDetailSheetV2
              isOpen={gameSheetOpen}
              onClose={handleCloseGameSheet}
              gameId={selectedGameId}
            />
          )}

          {/* Remove Trip Confirmation Dialog */}
          <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete the trip and all rounds. 
                  {participants.length > 1 && ` ${participants.length - 1} participant(s) will be notified.`}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleRemoveTrip}
                  disabled={isRemoving}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Removing...
                    </>
                  ) : (
                    'Remove'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Leave Trip Confirmation Dialog */}
          <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave this trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  You'll be removed from the trip and won't receive updates.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleLeaveTrip}
                  disabled={isRemoving}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Leaving...
                    </>
                  ) : (
                    'Leave'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}

export default TripDetailSheetV2;
