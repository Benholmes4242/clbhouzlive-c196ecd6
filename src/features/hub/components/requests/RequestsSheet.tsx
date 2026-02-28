/**
 * RequestsSheet - Bottom sheet showing all pending join requests for host's games & trips
 * Uses game_participants and trip_participants as single source of truth
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQueryClient } from '@tanstack/react-query';
import { haptic } from '@/utils/haptics';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useHostPendingRequests, type PendingRequest } from '../../hooks/useHostPendingRequests';
import { RequestRow } from './RequestRow';

interface RequestsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'games' | 'trips';

export function RequestsSheet({ isOpen, onClose }: RequestsSheetProps) {
  const { gameRequests, tripRequests, requests, isLoading, refetch, gameCount, tripCount } = useHostPendingRequests();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [optimisticallyRemovedIds, setOptimisticallyRemovedIds] = useState<Set<string>>(new Set());
  
  const scrollYRef = useRef(0);
  const wasOpenRef = useRef(false);

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

  const handleClose = useCallback(() => {
    haptic('light');
    onClose();
  }, [onClose]);

  const handleAccept = useCallback(async (request: PendingRequest) => {
    haptic('medium');
    setProcessingId(request.id);
    
    // Optimistically remove from list immediately
    setOptimisticallyRemovedIds(prev => new Set(prev).add(request.id));
    
    try {
      if (request.type === 'game') {
        // Update game_participants rsvp_status to 'going'
        const { error } = await supabase
          .from('game_participants')
          .update({ 
            rsvp_status: 'going',
            rsvp_updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (error) throw error;

        // Update slots_open on the game
        const { data: game } = await supabase
          .from('games')
          .select('slots_open')
          .eq('id', request.game_id)
          .single();

        if (game && game.slots_open > 0) {
          await supabase
            .from('games')
            .update({ slots_open: game.slots_open - 1 })
            .eq('id', request.game_id);
        }

        toast.success("Added to your game 👍");
      } else {
        // Update trip_participants rsvp_status to 'going'
        const { error } = await supabase
          .from('trip_participants')
          .update({ 
            rsvp_status: 'going',
            rsvp_updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (error) throw error;

        toast.success("Added to your trip 👍");
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['discover-games-v2'] });
      queryClient.invalidateQueries({ queryKey: ['discover-trips'] });
      queryClient.invalidateQueries({ queryKey: ['userGames'] });
      refetch();
    } catch (error) {
      console.error('Error accepting request:', error);
      // Revert optimistic removal on error
      setOptimisticallyRemovedIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
      toast.error("Failed to accept request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }, [queryClient, refetch]);

  const handleDecline = useCallback(async (request: PendingRequest) => {
    haptic('light');
    setProcessingId(request.id);
    
    // Optimistically remove from list immediately
    setOptimisticallyRemovedIds(prev => new Set(prev).add(request.id));
    
    try {
      if (request.type === 'game') {
        // Update game_participants rsvp_status to 'rejected'
        const { error } = await supabase
          .from('game_participants')
          .update({ 
            rsvp_status: 'rejected',
            rsvp_updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (error) throw error;
      } else {
        // Update trip_participants rsvp_status to 'rejected'
        const { error } = await supabase
          .from('trip_participants')
          .update({ 
            rsvp_status: 'rejected',
            rsvp_updated_at: new Date().toISOString()
          })
          .eq('id', request.id);

        if (error) throw error;
      }

      // Generic message (anonymity-preserving)
      toast("Let them know it's full");

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['hostPendingRequests'] });
      queryClient.invalidateQueries({ queryKey: ['discover-games-v2'] });
      queryClient.invalidateQueries({ queryKey: ['discover-trips'] });
      refetch();
    } catch (error) {
      console.error('Error declining request:', error);
      // Revert optimistic removal on error
      setOptimisticallyRemovedIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
      toast.error("Failed to decline request. Please try again.");
    } finally {
      setProcessingId(null);
    }
  }, [queryClient, refetch]);

  // Filter requests based on active tab and optimistic removals
  const baseRequests = activeTab === 'all' 
    ? requests 
    : activeTab === 'games' 
      ? gameRequests 
      : tripRequests;
  
  const displayedRequests = baseRequests.filter(r => !optimisticallyRemovedIds.has(r.id));

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
            className="fixed inset-0 z-[10001]"
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
            className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-3xl overflow-hidden"
            style={{
              height: '90svh',
              maxHeight: '90svh',
              background: '#F8FAFC',
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.12), 0 -2px 10px rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div className="w-10 h-1 rounded-full bg-[#e2e8f0]" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-3 flex-shrink-0">
              <div>
                <h2 
                  className="text-[18px] font-semibold leading-tight"
                  style={{ color: '#1e293b', letterSpacing: '-0.02em' }}
                >
                  Join Requests
                </h2>
                <p 
                  className="text-[12px] mt-0.5"
                  style={{ color: 'rgba(100, 116, 139, 0.8)' }}
                >
                  {requests.length === 0 
                    ? 'No pending requests' 
                    : `${requests.length} pending request${requests.length !== 1 ? 's' : ''}`
                  }
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

            {/* Tabs */}
            {(gameCount > 0 || tripCount > 0) && (
              <div className="px-5 pb-3 flex-shrink-0">
                <div className="flex p-1 rounded-xl bg-[#e2e8f0]">
                  {[
                    { key: 'all', label: 'All', count: requests.length },
                    { key: 'games', label: 'Games', count: gameCount },
                    { key: 'trips', label: 'Trips', count: tripCount },
                  ].map(({ key, label, count }) => {
                    const isActive = activeTab === key;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          haptic('light');
                          setActiveTab(key as TabType);
                        }}
                        className={cn(
                          "flex-1 py-2 px-4 text-[13px] font-semibold rounded-lg transition-all duration-150",
                          isActive
                            ? "m-1 bg-white text-[#1e293b] shadow-sm border border-[#e2e8f0]"
                            : "text-[#64748b] hover:text-[#1e293b] hover:bg-white/50"
                        )}
                      >
                        {label} {count > 0 && `(${count})`}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Divider */}
            <div 
              className="h-px mx-5 flex-shrink-0"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.06) 20%, rgba(0, 0, 0, 0.06) 80%, transparent 100%)',
              }}
            />

            {/* Content */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain px-5 pt-4 pb-10"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[1, 2, 3].map(i => (
                    <div 
                      key={i}
                      className="h-20 rounded-2xl animate-pulse"
                      style={{ background: 'rgba(0, 0, 0, 0.04)' }}
                    />
                  ))}
                </div>
              ) : displayedRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{ background: 'rgba(0, 0, 0, 0.03)' }}
                  >
                    <Inbox className="w-7 h-7" style={{ color: '#94a3b8' }} />
                  </div>
                  <p 
                    className="text-[15px] font-medium"
                    style={{ color: '#64748b' }}
                  >
                    No pending requests
                  </p>
                  <p 
                    className="text-[13px] mt-1 max-w-[240px]"
                    style={{ color: '#94a3b8' }}
                  >
                    When golfers request to join your games or trips, they'll appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {displayedRequests.map(request => (
                    <RequestRow
                      key={request.id}
                      request={request}
                      onAccept={handleAccept}
                      onDecline={handleDecline}
                      isProcessing={processingId === request.id}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    portalRoot
  );
}
