/**
 * HubYourGamesSheet
 * Hub bottom sheet container for Your Games
 */
import React, { useState, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
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

  // Scroll lock when sheet is open
  useEffect(() => {
    if (!isOpen) return;
    
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      document.body.style.overflow = '';
      window.scrollTo(0, scrollY);
    };
  }, [isOpen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setHasScrolled(e.currentTarget.scrollTop > 8);
  };

  const handleViewGame = (gameId: string) => {
    setJoinRequestsOpen(false);
    setFocusedGameId(gameId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[9998]"
        style={{
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[9999] flex flex-col"
        style={{
          height: '90vh',
          background: 'var(--hub-glass-bg-elevated)',
          backdropFilter: 'blur(80px)',
          WebkitBackdropFilter: 'blur(80px)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          border: '1px solid var(--hub-stroke-subtle)',
          borderBottom: 'none',
        }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div
            className="w-10 h-1 rounded-full"
            style={{ background: 'var(--hub-stroke)' }}
          />
        </div>

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3 shrink-0 transition-shadow duration-200"
          style={{
            borderBottom: hasScrolled ? '1px solid var(--hub-stroke-subtle)' : '1px solid transparent',
            boxShadow: hasScrolled ? '0 2px 12px rgba(0,0,0,0.15)' : 'none',
          }}
        >
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--hub-text-bright)' }}
          >
            Your Games
          </h2>
          
          <div className="flex items-center gap-3">
            {/* Join Requests button */}
            <button
              onClick={() => setJoinRequestsOpen(true)}
              className="flex items-center gap-2 text-[14px] font-medium transition-colors"
              style={{ 
                color: 'var(--hub-text-body)',
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
                    background: 'var(--hub-glass)',
                    border: '1px solid var(--hub-stroke)',
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
              className="p-2 rounded-full transition-colors"
              style={{
                background: 'var(--hub-glass-bg-button)',
                border: '1px solid var(--hub-stroke-subtle)',
              }}
              aria-label="Close"
            >
              <X className="w-5 h-5" style={{ color: 'var(--hub-text-body)' }} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div
          className="flex-1 overflow-y-auto"
          onScroll={handleScroll}
        >
          <div className="pt-4 pb-8">
            <YourGamesSurface
              bottomPadding={40}
              onOpenCreate={() => setCreateGameOpen(true)}
              onOpenJoinRequests={() => setJoinRequestsOpen(true)}
              onOpenSearchGames={() => setSearchGamesOpen(true)}
              focusId={focusedGameId}
            />
          </div>
        </div>
      </div>

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
  );
}
