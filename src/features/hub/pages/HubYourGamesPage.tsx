/**
 * Hub Your Games Page
 * Full-screen glass page overlaying the origin page.
 */
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { YourGamesList } from '@/features/nearby/components/YourGamesList';
import { JoinRequestsInboxSheet } from '@/features/nearby/components/JoinRequestsInboxSheet';
import { useMyJoinRequests } from '@/features/nearby/hooks/useMyJoinRequests';
import { useHub } from '@/features/hub/useHub';
import { HubHeader } from '@/features/hub/components/HubHeader';
import '../home/hubTheme.css';

export function HubYourGamesPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { navigateFromHub } = useHub();
  const [joinRequestsOpen, setJoinRequestsOpen] = useState(false);
  const [focusedGameId, setFocusedGameId] = useState<string | undefined>();

  const { data: myRequests = [] } = useMyJoinRequests();

  const pendingCount = useMemo(
    () => myRequests.filter((r) => r.status === 'pending').length,
    [myRequests]
  );

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      // Navigate back to close this overlay
      nav(-1);
    } else {
      // Deep link fallback - return to Hub
      nav('/hub', { replace: true });
    }
  };

  const handleCreateGame = () => {
    navigateFromHub('/hub/create-game');
  };

  const handleFindGame = () => {
    navigateFromHub('/hub/games');
  };

  const handleViewGame = (gameId: string) => {
    setJoinRequestsOpen(false);
    setFocusedGameId(gameId);
    // The YourGamesList will automatically switch to Joined tab and focus on this game
  };

  return (
    <div
      className="hub-glass-page fixed inset-0 z-[9999]"
      style={{
        background: 'rgba(0, 0, 0, 0.25)',
        backdropFilter: 'blur(120px)',
        WebkitBackdropFilter: 'blur(120px)',
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
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.18)',
                  color: 'var(--hub-text-bright)',
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
  );
}
