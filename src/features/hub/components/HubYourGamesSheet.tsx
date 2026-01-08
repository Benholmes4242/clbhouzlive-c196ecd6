/**
 * HubYourGamesSheet
 * Hub bottom sheet container for Your Games
 */
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { YourGamesSurface } from '@/features/nearby/components/YourGamesSurface';
import { JoinRequestsInboxSheet } from '@/features/nearby/components/JoinRequestsInboxSheet';
import { HubCreateGameSheet } from './HubCreateGameSheet';
import { HubSearchGamesSheet } from './HubSearchGamesSheet';
import { useMyJoinRequests } from '@/features/nearby/hooks/useMyJoinRequests';
import '../home/hubThemeLight.css';

interface HubYourGamesSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HubYourGamesSheet({ isOpen, onClose }: HubYourGamesSheetProps) {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [searchGamesOpen, setSearchGamesOpen] = useState(false);
  const [focusedGameId, setFocusedGameId] = useState<string | undefined>();

  const { data: myRequests = [] } = useMyJoinRequests();
  const pendingCount = useMemo(
    () => myRequests.filter((r) => r.status === 'pending').length,
    [myRequests]
  );

  // Standardized scroll-lock: #root approach (matches other Hub sheets)
  useEffect(() => {
    const rootEl = document.getElementById('root');
    if (!rootEl) return;

    if (isOpen && !wasOpenRef.current) {
      rootScrollTopRef.current = rootEl.scrollTop;
      rootEl.style.overflow = 'hidden';
      wasOpenRef.current = true;
      setHasScrolled(false);
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

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setHasScrolled(e.currentTarget.scrollTop > 8);
  }, []);

  const handleSheetClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  }, []);

  const handleViewGame = (gameId: string) => {
    setJoinRequestsOpen(false);
    setFocusedGameId(gameId);
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
            className="fixed inset-0 bg-black/50 z-[10001]"
            style={{ touchAction: 'none' }}
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-x-0 bottom-0 z-[10002] rounded-t-2xl overflow-hidden flex flex-col overscroll-contain"
            style={{
              height: '90vh',
              background: 'var(--hub-bg-start)',
            }}
            onClick={handleSheetClick}
          >
            {/* Header */}
            <div
              className="flex-shrink-0 sticky top-0 z-10 transition-shadow duration-150"
              style={{
                background: 'var(--hub-bg-start)',
                boxShadow: hasScrolled ? '0 2px 12px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-black/10" />
              </div>

              {/* Title bar */}
              <div
                className="flex items-center justify-between px-4 pb-3"
                style={{
                  borderBottom: hasScrolled ? 'none' : '1px solid var(--hub-glass-border)',
                }}
              >
                <h2
                  className="text-[18px] font-semibold"
                  style={{ color: 'var(--hub-text)' }}
                >
                  Your Games
                </h2>

                <div className="flex items-center gap-3">
                  {/* Join Requests button */}
                  <button
                    onClick={() => setJoinRequestsOpen(true)}
                    className="flex items-center gap-2 text-[14px] font-medium transition-colors"
                    style={{
                      color: 'var(--hub-text-sub)',
                      background: 'transparent',
                      border: 'none',
                      padding: 0,
                    }}
                  >
                    Join Requests
                    {pendingCount > 0 && (
                      <span
                        className="inline-flex items-center justify-center text-[11px] font-semibold"
                        style={{
                          minWidth: 18,
                          height: 18,
                          padding: '0 6px',
                          borderRadius: 999,
                          background: 'var(--hub-glass-bg)',
                          border: '1px solid var(--hub-glass-border)',
                          color: 'var(--hub-text)',
                        }}
                      >
                        {pendingCount}
                      </span>
                    )}
                  </button>

                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
                    style={{ background: 'var(--hub-glass-bg)' }}
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" style={{ color: 'var(--hub-text-sub)' }} />
                  </button>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
              onScroll={handleScroll}
            >
              <div className="pt-4 pb-8">
                <YourGamesSurface
                  bottomPadding={40}
                  onOpenCreate={() => setCreateGameOpen(true)}
                  onOpenJoinRequests={(focusGameId) => {
                    setFocusedGameId(focusGameId);
                    setJoinRequestsOpen(true);
                  }}
                  onOpenSearchGames={() => setSearchGamesOpen(true)}
                  focusId={focusedGameId}
                />
              </div>
            </div>
          </motion.div>

          {/* Nested sheets */}
          <JoinRequestsInboxSheet
            open={joinRequestsOpen}
            onOpenChange={setJoinRequestsOpen}
            onViewGame={handleViewGame}
            onFindGame={() => {
              setJoinRequestsOpen(false);
              setSearchGamesOpen(true);
            }}
          />

          <HubCreateGameSheet
            isOpen={createGameOpen}
            onClose={() => setCreateGameOpen(false)}
          />

          <HubSearchGamesSheet
            isOpen={searchGamesOpen}
            onClose={() => setSearchGamesOpen(false)}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
