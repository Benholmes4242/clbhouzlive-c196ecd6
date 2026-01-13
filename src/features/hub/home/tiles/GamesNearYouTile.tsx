/**
 * Games Near You Tile
 * Content tile showing nearby games to join with inline scroll
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';
import { TapButton } from '@/components/ui/TapButton';
import { GameStatusPill } from '@/features/hub/components/GameStatusPill';
import { HubYourGamesSheet } from '@/features/hub/components/HubYourGamesSheet';
import '@/features/nearby/components/your-games/YourGames.css';
import '../hubTileGames.css';

interface Game {
  id: string;
  course_name: string | null;
  start_time: string;
  slots_total: number | null;
  slots_open: number | null;
  host_user_id: string;
  visibility: string;
  status: string;
}

function GameRow({ 
  game, 
  open, 
  onToggle,
  scrollParentRef 
}: { 
  game: Game; 
  open: boolean; 
  onToggle: () => void;
  scrollParentRef: React.RefObject<HTMLDivElement>;
}) {
  const { navigateFromHub } = useHub();
  const availableSlots = game.slots_open || 0;
  const rowRef = React.useRef<HTMLDivElement | null>(null);

  // Smoothly ensure visibility when this row becomes open
  React.useEffect(() => {
    if (!open || !rowRef.current || !scrollParentRef.current) return;

    const parent = scrollParentRef.current;
    const el = rowRef.current;

    // Wait a tick so height transition starts, then scroll just enough
    const id = window.requestAnimationFrame(() => {
      const parentBox = parent.getBoundingClientRect();
      const rowBox = el.getBoundingClientRect();

      const overTop = rowBox.top < parentBox.top + 12;
      const overBottom = rowBox.bottom > parentBox.bottom - 12;

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        if (overTop) parent.scrollTop += rowBox.top - parentBox.top - 12;
        if (overBottom) parent.scrollTop += rowBox.bottom - parentBox.bottom + 12;
        return;
      }

      if (overTop || overBottom) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    });

    return () => window.cancelAnimationFrame(id);
  }, [open, scrollParentRef]);

  return (
    <div ref={rowRef} className={`game-row ${open ? 'open' : ''}`} role="listitem">
      <button 
        className="row-head" 
        onClick={onToggle}
        aria-expanded={open}
      >
        <span className="left">
          <span role="img" aria-label="golf">⛳</span>
          <span className="course" title={game.course_name || 'Golf Course'}>
            {game.course_name || 'Golf Course'}
          </span>
        </span>
        <span className="meta">
          <GameStatusPill
            filled={(game.slots_total || 0) - availableSlots}
            total={game.slots_total || 0}
          />
          <span className="chev">›</span>
        </span>
      </button>

      <div className="row-body">
        <div className="row-grid">
          <div className="label">When</div>
          <div style={{ color: 'var(--hub-text-bright)' }}>
            {game.start_time ? formatDistanceToNow(new Date(game.start_time), { addSuffix: true }) : 'TBD'}
          </div>
          <div className="label">Slots</div>
          <div style={{ color: 'var(--hub-text-bright)' }}>
            {availableSlots}/{game.slots_total || 0}
          </div>
        </div>
        <div className="row-actions">
          <TapButton 
            className="action-btn action-btn-primary"
            onClick={() => navigateFromHub(`/game/${game.id}`)}
          >
            View Game
          </TapButton>
        </div>
      </div>
    </div>
  );
}

interface GamesNearYouTileProps {
  limit?: number;
}

export function GamesNearYouTile({ 
  limit = 25
}: GamesNearYouTileProps) {
  const { navigateFromHub } = useHub();
  const { data: allGames = [], isLoading } = useGamesQuery();
  const [openGameId, setOpenGameId] = React.useState<string | null>(null);
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const [gamesHubOpen, setGamesHubOpen] = useState(false);
  
  const games = allGames.slice(0, limit);
  
  const handleToggle = (id: string) => {
    setOpenGameId(prev => (prev === id ? null : id)); // close others automatically
  };

  return (
    <Tile 
      title="Games"
    >
      <div className="flex flex-col h-full" style={{ position: 'relative', paddingTop: '1.5px', paddingBottom: '29px' }}>
        {/* Game list with inline scroll */}
        <div 
          ref={listRef}
          className="games-list" 
          role="list"
          aria-label="Games near you"
          style={{
            maskImage: 'none',
            WebkitMaskImage: 'none',
          }}
        >
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          ))}
          {!isLoading && games.map(g => (
            <GameRow 
              key={g.id} 
              game={g} 
              open={openGameId === g.id} 
              onToggle={() => handleToggle(g.id)}
              scrollParentRef={listRef}
            />
          ))}
          {!isLoading && games.length === 0 && (
            <div className="text-[13px] py-2" style={{ color: 'var(--hub-text-sub)' }}>
              No active games nearby
            </div>
          )}
        </div>

        <div className="tile-divider" />

        {/* CTAs */}
        <button
          className="tile-link"
          onClick={() => setGamesHubOpen(true)}
          aria-label="Your Games"
        >
          Your Games →
        </button>
      </div>
      
      <HubYourGamesSheet
        isOpen={gamesHubOpen}
        onClose={() => setGamesHubOpen(false)}
      />
    </Tile>
  );
}
