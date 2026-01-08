/**
 * HubGamesHubSheet - V2 unified Games Hub
 * 
 * Top tabs: Discover / Yours
 * Floating Create Game CTA
 * Join Requests badge in Yours header
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchGamesSurface } from '@/features/nearby/components/SearchGamesSurface';
import { YourGamesSurface } from '@/features/nearby/components/YourGamesSurface';
import { JoinRequestsInboxSheet } from '@/features/nearby/components/JoinRequestsInboxSheet';
import { HubCreateGameSheet } from './HubCreateGameSheet';
import { useMyJoinRequests } from '@/features/nearby/hooks/useMyJoinRequests';
import { haptic } from '@/utils/haptics';
import '../home/hubThemeLight.css';

type TabValue = 'discover' | 'yours';

interface HubGamesHubSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabValue;
}

export function HubGamesHubSheet({ 
  isOpen, 
  onClose, 
  initialTab = 'discover' 
}: HubGamesHubSheetProps) {
  const rootScrollTopRef = useRef(0);
  const wasOpenRef = useRef(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [joinRequestsFocusGameId, setJoinRequestsFocusGameId] = useState<string | undefined>();
  const [createGameOpen, setCreateGameOpen] = useState(false);
  const [focusedGameId, setFocusedGameId] = useState<string | undefined>();

  const { data: myRequests = [] } = useMyJoinRequests();
  const pendingCount = useMemo(
    () => myRequests.filter((r) => r.status === 'pending').length,
    [myRequests]
  );

  // Reset to initial tab when sheet opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setFocusedGameId(undefined);
    }
  }, [isOpen, initialTab]);

  // Standardized scroll-lock: #root approach
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

  const handleTabChange = (tab: TabValue) => {
    haptic('light');
    setActiveTab(tab);
    setHasScrolled(false);
    // Clear focus when switching to discover to avoid unexpected re-highlights
    if (tab === 'discover') {
      setFocusedGameId(undefined);
    }
    // Scroll content to top when switching tabs
    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
  };

  const handleOpenCreate = () => {
    setCreateGameOpen(true);
  };

  const handleOpenJoinRequests = (focusGameId?: string) => {
    setJoinRequestsFocusGameId(focusGameId);
    setJoinRequestsOpen(true);
  };

  const handleViewGame = (gameId: string) => {
    setJoinRequestsOpen(false);
    setFocusedGameId(gameId);
    setActiveTab('yours');
    // Scroll to top so focus animation is visible
    contentRef.current?.scrollTo({ top: 0, behavior: 'auto' });
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
                  Games
                </h2>

                <div className="flex items-center gap-3">
                  {/* Join Requests button (visible when on Yours tab) */}
                  {activeTab === 'yours' && (
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
                      Requests
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
                  )}

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

              {/* Tab bar */}
              <div className="px-4 pb-3">
                <div
                  className="inline-flex rounded-xl p-1 w-full"
                  style={{
                    background: 'var(--hub-glass-bg)',
                    border: '1px solid var(--hub-glass-border)',
                  }}
                >
                  {(['discover', 'yours'] as TabValue[]).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTabChange(tab)}
                      className="flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize"
                      style={{
                        background: activeTab === tab ? 'var(--hub-glass-bg-elevated)' : 'transparent',
                        border: activeTab === tab ? '1px solid var(--hub-glass-border)' : '1px solid transparent',
                        color: activeTab === tab ? 'var(--hub-text)' : 'var(--hub-text-muted)',
                      }}
                    >
                      {tab === 'discover' ? 'Discover' : 'Yours'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div
              ref={contentRef}
              className="flex-1 overflow-y-auto overscroll-contain"
              style={{ paddingBottom: 'calc(80px + env(safe-area-inset-bottom, 0px))' }}
              onScroll={handleScroll}
            >
              {activeTab === 'discover' ? (
                <SearchGamesSurface
                  bottomPadding={24}
                  onOpenCreate={handleOpenCreate}
                />
              ) : (
                <div className="pt-2">
                  <YourGamesSurface
                    bottomPadding={40}
                    onOpenCreate={handleOpenCreate}
                    onOpenJoinRequests={handleOpenJoinRequests}
                    onOpenSearchGames={() => handleTabChange('discover')}
                    focusId={focusedGameId}
                  />
                </div>
              )}
            </div>

            {/* Floating Create Game FAB */}
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
              onClick={handleOpenCreate}
              className="absolute z-20 w-14 h-14 rounded-full flex items-center justify-center shadow-lg"
              style={{
                bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                right: 20,
                background: 'linear-gradient(135deg, #6E9277 0%, #89A78C 100%)',
                boxShadow: '0 4px 16px rgba(110, 146, 119, 0.4)',
              }}
              aria-label="Create a game"
            >
              <Plus className="w-6 h-6 text-white" />
            </motion.button>
          </motion.div>

          {/* Nested sheets */}
          <JoinRequestsInboxSheet
            open={joinRequestsOpen}
            onOpenChange={setJoinRequestsOpen}
            onViewGame={handleViewGame}
            onFindGame={() => {
              setJoinRequestsOpen(false);
              setActiveTab('discover');
            }}
            focusGameId={joinRequestsFocusGameId}
          />

          <HubCreateGameSheet
            isOpen={createGameOpen}
            onClose={() => setCreateGameOpen(false)}
          />
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default HubGamesHubSheet;
