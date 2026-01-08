/**
 * Your Games Tile
 * Full-width tile showing games user is hosting or joined
 */

import React, { useState } from 'react';
import { Tile } from '../components/Tile';
import { useUserGames } from '@/features/hub/hooks/useUserGames';
import { useUserGamesRealtime } from '@/features/hub/hooks/useUserGamesRealtime';
import { useTotalPendingHostRequests } from '../hooks/useTotalPendingHostRequests';
import { supabase } from '@/integrations/supabase/client';
import { devlog } from '@/utils/log';
import { GameRow, type GameData } from '@/features/games/components/GameRow';
import { HubCreateGameSheet } from '@/features/hub/components/HubCreateGameSheet';
import { HubSearchGamesSheet } from '@/features/hub/components/HubSearchGamesSheet';
import { HubYourGamesSheet } from '@/features/hub/components/HubYourGamesSheet';
import '@/features/nearby/components/your-games/YourGames.css';
import './games/gameAnimations.css';
import './games/gamesTile.css';

type GameWithDetails = {
  id: string;
  kind: 'Hosting' | 'Joined';
  course_name: string | null;
  start_time: string;
  expires_at: string;
  slots_total: number | null;
  slots_open: number | null;
  host_user_id: string;
  notes?: string | null;
  participants: Array<{
    user_id: string | null;
    user_profiles?: {
      display_name: string | null;
      profile_photo_url: string | null;
      eg_handicap_index: number | null;
      home_club: string | null;
    };
  }>;
};

export function YourGamesTile() {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const viewAllRef = React.useRef<HTMLButtonElement>(null);
  const [expandedId, setExpandedId] = React.useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = React.useState<string | undefined>();
  const [isCreateGameSheetOpen, setIsCreateGameSheetOpen] = useState(false);
  const [isSearchGamesSheetOpen, setIsSearchGamesSheetOpen] = useState(false);
  const [isYourGamesSheetOpen, setIsYourGamesSheetOpen] = useState(false);
  // Use shared hook for consistency with the sheet
  const { data, isLoading, isError, refetch } = useUserGames();
  useUserGamesRealtime();

  // Get current user for pending request count
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id);
    });
  }, []);

  // Scroll helper: snap expanded row to top of container
  const scrollChildToTop = (container: HTMLDivElement, child: HTMLElement, padding = 12) => {
    const cRect = container.getBoundingClientRect();
    const rRect = child.getBoundingClientRect();

    // Distance from child's top to container's top, plus current scroll
    const targetTop = (rRect.top - cRect.top) + container.scrollTop - padding;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  };

  const comingSoon = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    alert('Coming soon');
  };

  const openCreateGame = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsCreateGameSheetOpen(true);
  };

  const openSearchGames = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsSearchGamesSheetOpen(true);
  };

  const openYourGames = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsYourGamesSheetOpen(true);
  };

  React.useEffect(() => {
    const btn = viewAllRef.current;
    const tile = btn?.closest('section');
    if (!btn || !tile) return;
    const measure = () => {
      const br = btn.getBoundingClientRect();
      const tr = tile.getBoundingClientRect();
      const gap = Math.round(tr.bottom - br.bottom);
      const cs = window.getComputedStyle(tile as Element);
      devlog('[YourGamesTile] gap (tile bottom - button bottom):', gap, 'tile pb:', cs.paddingBottom, 'btn mb:', window.getComputedStyle(btn).marginBottom);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Combine hosting & joined, sort by time (no cap for inline scroll)
  const games = React.useMemo(() => {
    if (!data) return [];
    const combined = [...data.hosting, ...data.joined].map((g) => ({
      id: g.id,
      kind: g.kind,
      course_name: g.course_name,
      course_id: null,
      start_time: g.start_time,
      expires_at: g.expires_at,
      status: g.status,
      slots_total: g.slots_total,
      slots_open: g.slots_open,
      host_user_id: g.host_user_id,
      participants: g.participants.map(p => ({
        user_id: p.user_id,
        username: p.user_profiles?.display_name,
        display_name: p.user_profiles?.display_name,
        profile_photo_url: p.user_profiles?.profile_photo_url,
        home_club: p.user_profiles?.home_club,
        eg_handicap_index: p.user_profiles?.eg_handicap_index,
        role: p.user_id === g.host_user_id ? 'host' as const : 'player' as const,
      })),
    }));
    combined.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return combined;
  }, [data]);

  // Determine the next upcoming game (for subtle highlight)
  const nextGameId = React.useMemo(() => {
    const now = new Date();
    const upcoming = games.find(g => new Date(g.start_time) > now);
    return upcoming?.id ?? null;
  }, [games]);

  const handleExpandedChange = React.useCallback(
    (gameId: string) => {
      setExpandedId(prev => prev === gameId ? null : gameId);
    },
    []
  );

  const handleHideFromHub = React.useCallback((gameId: string) => {
    devlog('[YourGamesTile] Hide from hub:', gameId);
    // TODO: Implement hide functionality
  }, []);

  // Calculate total pending requests across all hosting games
  const totalPendingRequests = useTotalPendingHostRequests(games, currentUserId);

  const hasAny = games.length > 0;

  return (
    <Tile 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h3>Games</h3>
            {totalPendingRequests > 0 && (
              <div className="yourGamesTile__badge">
                Requests · {totalPendingRequests}
              </div>
            )}
          </div>
          <button
            onClick={openCreateGame}
            className="text-[14px] font-normal transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-muted)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text-sub)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-muted)'}
            aria-label="Create a Game"
          >
            Create a Game +
          </button>
        </div>
      }
      footer={
        <div className="mt-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
            <button
              onClick={openSearchGames}
              className="text-[14px] font-normal transition"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--hub-text-muted)',
                padding: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text-sub)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-muted)'}
              aria-label="Search Games"
            >
              ← Search Games
            </button>
            <button
              ref={viewAllRef}
              onClick={openYourGames}
              className="text-[14px] font-normal transition"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--hub-text-muted)',
                padding: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text-sub)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-muted)'}
              aria-label="View all your games"
              disabled={!hasAny && isLoading}
            >
              Your Games →
            </button>
          </div>
        </div>
      }
      >
      <div className="flex flex-col h-full min-h-0" style={{ paddingBottom: '6px' }}>
        <div
          ref={listRef}
          className="gt-scroll flex-1 min-h-0 -mr-1 pr-1"
          data-hub-scroll-container="true"
          style={{
            marginTop: '2px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
          }}
        >
        <ul className="gt-list">
          {isLoading && [0, 1, 2].map(i => (
            <div 
              key={i} 
              className="h-12 animate-pulse" 
              style={{ 
                background: 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.12)',
              }} 
            />
          ))}

          {isError && (
            <div className="text-[13px] space-y-2" style={{ color: 'var(--hub-text-sub)' }}>
              <div>Couldn't load games</div>
              <button 
                onClick={() => refetch()}
                className="text-[13px] underline underline-offset-2"
                style={{ color: 'var(--hub-accent-orange)' }}
              >
                Retry
              </button>
            </div>
          )}
          
          {!isLoading && !isError && games.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8 px-4">
              <h4 
                className="text-[15px] font-semibold"
                style={{ color: 'var(--hub-text)' }}
              >
                No games planned yet
              </h4>
              <p 
                className="text-[13px] leading-relaxed mt-2 max-w-[240px]"
                style={{ color: 'var(--hub-text-sub)' }}
              >
                That's okay — most rounds start with an idea.
              </p>
              
              {/* Subtle text CTAs */}
              <div className="flex flex-col items-center gap-3 mt-5">
                <button
                  onClick={openCreateGame}
                  className="text-[14px] font-medium transition-colors"
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--hub-text-muted)',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-muted)'}
                >
                  Create a game →
                </button>
                <button
                  onClick={openSearchGames}
                  className="text-[14px] font-normal transition-colors"
                  style={{ 
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--hub-text-muted)',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-muted)'}
                >
                  Explore courses →
                </button>
              </div>
            </div>
          )}

          {!isLoading && !isError && games.map((g, i) => (
            <div key={g.id} data-game-id={g.id}>
              <GameRow
                mode="hub"
                game={g as unknown as GameData}
                isHost={g.kind === 'Hosting'}
                isJoined={g.kind === 'Joined'}
                canExpand
                readOnly
                defaultExpanded={expandedId === g.id}
                onToggleExpand={() => handleExpandedChange(g.id)}
                onHideFromHub={() => handleHideFromHub(g.id)}
                index={i}
                isNextGame={g.id === nextGameId}
              />
            </div>
          ))}
        </ul>
      </div>
      </div>
      
      <HubCreateGameSheet 
        isOpen={isCreateGameSheetOpen} 
        onClose={() => setIsCreateGameSheetOpen(false)} 
      />
      
      <HubSearchGamesSheet
        isOpen={isSearchGamesSheetOpen}
        onClose={() => setIsSearchGamesSheetOpen(false)}
      />

      <HubYourGamesSheet
        isOpen={isYourGamesSheetOpen}
        onClose={() => setIsYourGamesSheetOpen(false)}
      />
    </Tile>
  );
}
