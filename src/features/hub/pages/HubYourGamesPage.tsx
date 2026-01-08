/**
 * Hub Your Games Page
 * Full-screen page with standard Hub light theme styling
 */
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { JoinRequestsInboxSheet } from '@/features/nearby/components/JoinRequestsInboxSheet';
import { useMyJoinRequests } from '@/features/nearby/hooks/useMyJoinRequests';
import { useHub } from '@/features/hub/useHub';
import { HubHeader } from '@/features/hub/components/HubHeader';
import { HubCreateGameSheet } from '@/features/hub/components/HubCreateGameSheet';
import { HubSearchGamesSheet } from '@/features/hub/components/HubSearchGamesSheet';
import '../home/hubThemeLight.css';

export function HubYourGamesPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { navigateFromHub } = useHub();
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [focusedGameId, setFocusedGameId] = useState<string | undefined>();
  const [isCreateGameSheetOpen, setIsCreateGameSheetOpen] = useState(false);
  const [isSearchGamesSheetOpen, setIsSearchGamesSheetOpen] = useState(false);

  const { data: myRequests = [] } = useMyJoinRequests();

  const pendingCount = useMemo(
    () => myRequests.filter((r) => r.status === 'pending').length,
    [myRequests]
  );

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/hub', { replace: true });
    }
  };

  const handleCreateGame = () => {
    setIsCreateGameSheetOpen(true);
  };

  const handleFindGame = () => {
    setIsSearchGamesSheetOpen(true);
  };

  const handleViewGame = (gameId: string) => {
    setJoinRequestsOpen(false);
    setFocusedGameId(gameId);
  };

  return (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0" 
        style={{ 
          background: 'var(--hub-backdrop)',
          backdropFilter: `blur(var(--hub-backdrop-blur))`,
          WebkitBackdropFilter: `blur(var(--hub-backdrop-blur))`,
        }} 
      />
      
      {/* Glass Sheet */}
      <div
        className="hub-glass-page fixed inset-0"
        style={{
          background: 'var(--hub-bg-start)',
          border: '1px solid var(--hub-stroke-subtle)',
          boxShadow: 'var(--hub-shadow-main)',
        }}
      >
        <HubHeader 
          title="Your Games" 
          onBack={goBack}
          rightAction={
            <button
              type="button"
              onClick={() => setJoinRequestsOpen(true)}
              className="flex items-center gap-2 text-[15px] font-medium transition"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--hub-text-body)',
                padding: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
              aria-label="View join requests"
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
          }
        />

        {/* Content area - YourGamesList content */}
        <div 
          id="your-games-scroll"
          className="yourGames__scroll overflow-y-auto h-screen pt-[calc(3.5rem+env(safe-area-inset-top,0px))]"
        >
          <div style={{ paddingTop: '28px' }}>
            <YourGamesList
              onCreateGame={handleCreateGame}
              onFindGame={handleFindGame}
              focusId={focusedGameId}
            />
          </div>
        </div>

        {/* Join Requests Inbox Sheet */}
        <JoinRequestsInboxSheet
          open={joinRequestsOpen}
          onOpenChange={setJoinRequestsOpen}
          onViewGame={handleViewGame}
          onFindGame={handleFindGame}
        />
      </div>
      
      <HubCreateGameSheet 
        isOpen={isCreateGameSheetOpen} 
        onClose={() => setIsCreateGameSheetOpen(false)} 
      />
      
      <HubSearchGamesSheet
        isOpen={isSearchGamesSheetOpen}
        onClose={() => setIsSearchGamesSheetOpen(false)}
      />
    </div>
  );
}
