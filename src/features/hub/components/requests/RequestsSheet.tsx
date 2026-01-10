/**
 * RequestsSheet - Bottom sheet showing all pending join requests for host's games
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Inbox } from 'lucide-react';
import { haptic } from '@/utils/haptics';
import { useHostPendingRequests } from '../../hooks/useHostPendingRequests';
import { useGameJoinRequests } from '@/features/nearby/hooks/useGameJoinRequests';
import { RequestRow } from './RequestRow';

interface RequestsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RequestsSheet({ isOpen, onClose }: RequestsSheetProps) {
  const { requests, isLoading, refetch } = useHostPendingRequests();
  const { acceptRequest, declineRequest } = useGameJoinRequests();
  const [processingId, setProcessingId] = useState<string | null>(null);
  
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

  const handleAccept = useCallback(async (requestId: string, gameId: string) => {
    haptic('medium');
    setProcessingId(requestId);
    try {
      await acceptRequest(requestId, gameId);
      refetch();
    } finally {
      setProcessingId(null);
    }
  }, [acceptRequest, refetch]);

  const handleDecline = useCallback(async (requestId: string) => {
    haptic('light');
    setProcessingId(requestId);
    try {
      await declineRequest(requestId);
      refetch();
    } finally {
      setProcessingId(null);
    }
  }, [declineRequest, refetch]);

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
            className="fixed inset-x-0 bottom-0 z-[10002] flex flex-col rounded-t-[24px] overflow-hidden"
            style={{
              height: '70svh',
              maxHeight: '70svh',
              background: 'rgba(248, 250, 252, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 -8px 40px rgba(0, 0, 0, 0.12), 0 -2px 10px rgba(0, 0, 0, 0.06)',
            }}
          >
            {/* Grabber */}
            <div className="flex justify-center pt-3 pb-2 flex-shrink-0">
              <div 
                className="w-9 h-[3px] rounded-full"
                style={{ background: 'rgba(0, 0, 0, 0.08)' }}
              />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 flex-shrink-0">
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
              ) : requests.length === 0 ? (
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
                    When golfers request to join your games, they'll appear here.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {requests.map(request => (
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
