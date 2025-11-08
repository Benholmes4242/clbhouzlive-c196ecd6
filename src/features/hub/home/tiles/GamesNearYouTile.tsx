/**
 * Games Near You Tile
 * Content tile showing nearby games to join with inline scroll
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { formatDistanceToNow } from 'date-fns';
import { Tile } from '../components/Tile';
import { useHub } from '@/features/hub/useHub';
import { TapButton } from '@/components/ui/TapButton';
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

function GameRow({ game, open, onToggle }: { game: Game; open: boolean; onToggle: () => void }) {
  const { navigateFromHub } = useHub();
  const availableSlots = game.slots_open || 0;

  return (
    <div className={`game-row ${open ? 'open' : ''}`} role="listitem">
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
          {availableSlots} {availableSlots === 1 ? 'spot' : 'spots'}
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
  
  const games = allGames.slice(0, limit);
  
  const handleToggle = (id: string) => {
    setOpenGameId(prev => (prev === id ? null : id)); // close others automatically
  };

  return (
    <Tile 
      title="Games"
    >
      <div className="flex flex-col h-full">
        {/* Game list with inline scroll */}
        <div className="games-list" role="list">
          {isLoading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'var(--hub-glass-bg-subtle)' }} />
          ))}
          {!isLoading && games.map(g => (
            <GameRow key={g.id} game={g} open={openGameId === g.id} onToggle={() => handleToggle(g.id)} />
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
          onClick={() => navigateFromHub('/hub/your-games')}
          aria-label="Your Games"
        >
          Your Games →
        </button>
      </div>
    </Tile>
  );
}
