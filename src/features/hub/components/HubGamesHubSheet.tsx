/**
 * HubGamesHubSheet - V2 unified Games Hub
 * 
 * Top tabs: Discover / Yours
 * Floating Create Game CTA
 * Join Requests badge in Yours header
 */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Search, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SearchGamesSurface } from '@/features/nearby/components/SearchGamesSurface';
import { YourGamesSurface } from '@/features/nearby/components/YourGamesSurface';
import { JoinRequestsInboxSheet } from '@/features/nearby/components/JoinRequestsInboxSheet';
import { CreateGameTripSheetV2 } from './create-game-trip-v2';
import { useMyJoinRequests } from '@/features/nearby/hooks/useMyJoinRequests';
import { haptic } from '@/utils/haptics';
import { track } from '@/utils/analytics';
import '../home/hubThemeLight.css';

type TabValue = 'discover' | 'yours';

export interface PrefillCourse {
  id: string;
  name: string;
  region?: string;
  country?: string;
}

interface HubGamesHubSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TabValue;
  initialFocusGameId?: string;
  /** Pre-select a course in Discover (for deep-links from leaderboard) */
  prefillCourse?: PrefillCourse;
  /** Auto-open the Create Game sheet after mounting */
  autoOpenCreate?: boolean;
}

export function HubGamesHubSheet({ 
  isOpen, 
  onClose, 
  initialTab = 'discover',
  initialFocusGameId,
  prefillCourse,
  autoOpenCreate = false,
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
  // V2.4: Discover meta for hub header hint
  const [discoverMeta, setDiscoverMeta] = useState<{ resultsCount: number; startingSoonCount: number } | null>(null);
  // V2.4: FAB long-press menu state
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const fabTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // V3: Track if we've handled auto-open for this open cycle
  const didAutoOpenRef = useRef(false);

  const { data: myRequests = [] } = useMyJoinRequests();
  const pendingCount = useMemo(
    () => myRequests.filter((r) => r.status === 'pending').length,
    [myRequests]
  );

  // Reset state when sheet opens, apply initial focus only for 'yours' tab
  useEffect(() => {
    if (isOpen) {
      track('gameshub_open', { tab: initialTab, hasPrefillCourse: !!prefillCourse });
      setActiveTab(initialTab);
      // Only set focus when opening to 'yours' tab to avoid mystery focus
      setFocusedGameId(initialTab === 'yours' ? initialFocusGameId : undefined);
      didAutoOpenRef.current = false;
    }
  }, [isOpen, initialTab, initialFocusGameId, prefillCourse]);

  // V3: Auto-open create sheet after mount if requested
  useEffect(() => {
    if (isOpen && autoOpenCreate && !didAutoOpenRef.current && !createGameOpen) {
      didAutoOpenRef.current = true;
      const timer = setTimeout(() => setCreateGameOpen(true), 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, autoOpenCreate, createGameOpen]);

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
    setFabMenuOpen(false);
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

  // V2.4: FAB long-press handlers
  const handleFabPointerDown = () => {
    fabTimerRef.current = setTimeout(() => {
      haptic('medium');
      setFabMenuOpen(true);
    }, 420);
  };

  const handleFabPointerUp = () => {
    if (fabTimerRef.current) {
      clearTimeout(fabTimerRef.current);
      fabTimerRef.current = null;
    }
  };

  const handleFabClick = () => {
    if (!fabMenuOpen) {
      handleOpenCreate();
    }
  };

  const handleFabMenuAction = (action: 'create' | 'discover' | 'yours') => {
    haptic('light');
    setFabMenuOpen(false);
    switch (action) {
      case 'create':
        setCreateGameOpen(true);
        break;
      case 'discover':
        handleTabChange('discover');
        break;
      case 'yours':
        handleTabChange('yours');
        break;
    }
  };

  // V2.4: Compute hub header hint text
  const hubHintText = useMemo(() => {
    if (activeTab !== 'discover' || !discoverMeta) return null;
    if (discoverMeta.startingSoonCount > 0) return 'Starting soon near you';
    if (discoverMeta.resultsCount > 0) return 'New games available';
    return null;
  }, [activeTab, discoverMeta]);

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
                <div className="flex flex-col gap-0.5">
                  <h2
                    className="text-[18px] font-semibold"
                    style={{ color: 'var(--hub-text)' }}
                  >
                    Games
                  </h2>
                  {/* V2.4: Hub header hint */}
                  {hubHintText && (
                    <span 
                      className="text-[12px] font-medium"
                      style={{ color: 'var(--hub-text-dim)', opacity: 0.8 }}
                    >
                      {hubHintText}
                    </span>
                  )}
                </div>

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
                  onMeta={setDiscoverMeta}
                  prefillCourse={prefillCourse}
                />
              ) : (
                <div className="pt-2">
                  <YourGamesSurface
                    bottomPadding={40}
                    onOpenCreate={handleOpenCreate}
                    onOpenJoinRequests={handleOpenJoinRequests}
                    onOpenSearchGames={() => handleTabChange('discover')}
                    focusId={focusedGameId}
                    onFocusConsumed={() => setFocusedGameId(undefined)}
                  />
                </div>
              )}
            </div>

            {/* Floating Create Game FAB + V2.4 long-press menu */}
            <div
              className="absolute z-20"
              style={{
                bottom: 'calc(24px + env(safe-area-inset-bottom, 0px))',
                right: 20,
              }}
            >
              {/* FAB Menu (V2.4) */}
              <AnimatePresence>
                {fabMenuOpen && (
                  <>
                    {/* Click outside to close */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0"
                      onClick={() => setFabMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-16 right-0 rounded-xl overflow-hidden"
                      style={{
                        background: 'var(--hub-glass-bg)',
                        border: '1px solid var(--hub-glass-border)',
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                        minWidth: 160,
                      }}
                    >
                      <button
                        onClick={() => handleFabMenuAction('create')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors"
                        style={{ color: 'var(--hub-text)', borderBottom: '1px solid var(--hub-stroke-subtle)' }}
                      >
                        <Plus size={16} />
                        Create a game
                      </button>
                      <button
                        onClick={() => handleFabMenuAction('discover')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors"
                        style={{ color: 'var(--hub-text-sub)', borderBottom: '1px solid var(--hub-stroke-subtle)' }}
                      >
                        <Search size={16} />
                        Find a game
                      </button>
                      <button
                        onClick={() => handleFabMenuAction('yours')}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors"
                        style={{ color: 'var(--hub-text-sub)' }}
                      >
                        <Calendar size={16} />
                        Your games
                      </button>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>

              {/* FAB Button */}
              <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 25 }}
                onClick={handleFabClick}
                onPointerDown={handleFabPointerDown}
                onPointerUp={handleFabPointerUp}
                onPointerLeave={handleFabPointerUp}
                onContextMenu={(e) => {
                  e.preventDefault();
                  haptic('medium');
                  setFabMenuOpen(true);
                }}
                className="flex items-center justify-center shadow-lg rounded-full h-14 min-w-14 px-4 gap-2 md:px-5"
                style={{
                  background: 'linear-gradient(135deg, #6E9277 0%, #89A78C 100%)',
                  boxShadow: '0 4px 16px rgba(110, 146, 119, 0.4)',
                }}
                aria-label="Create a game"
              >
                <Plus className="w-6 h-6 text-white" />
                <span className="hidden md:inline text-white font-semibold text-sm">Create</span>
              </motion.button>
            </div>
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

          <CreateGameTripSheetV2
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
