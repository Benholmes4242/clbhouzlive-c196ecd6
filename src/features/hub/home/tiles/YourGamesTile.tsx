/**
 * Your Games Tile
 * Full-width tile showing games user is hosting or joined
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useOpenSheet } from '@/features/hub/sheets/useOpenSheet';
import { useUserGames } from '@/features/hub/hooks/useUserGames';
import { useUserGamesRealtime } from '@/features/hub/hooks/useUserGamesRealtime';
import { devlog } from '@/utils/log';

type GameWithDetails = {
  id: string;
  kind: 'Hosting' | 'Joined';
  course_name: string | null;
  start_time: string;
  slots_total: number | null;
  slots_open: number | null;
  host_user_id: string;
  host_profile?: Array<{
    display_name: string | null;
    profile_photo_url: string | null;
  }>;
  participants: Array<{
    user_id: string | null;
    user_profiles?: {
      display_name: string | null;
      profile_photo_url: string | null;
      eg_handicap_index: number | null;
    };
  }>;
};

function GameRow({ 
  game,
  expanded,
  onToggle,
  onLongPress,
}: { 
  game: GameWithDetails;
  expanded: boolean;
  onToggle: () => void;
  onLongPress: () => void;
}) {
  const totalSlots = game.slots_total || 0;
  const availableSlots = game.slots_open || 0;
  const hostName = React.useMemo(() => {
    if (game.kind === 'Hosting') return 'You';
    const hostP = game.participants.find(p => p.user_id === game.host_user_id);
    return hostP?.user_profiles?.display_name || null;
  }, [game]);
  const timerRef = React.useRef<number | null>(null);
  
  const handlePointerDown = (e: React.PointerEvent) => {
    timerRef.current = window.setTimeout(() => {
      onLongPress();
    }, 420);
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerCancel = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };
  
  return (
    <button 
      onClick={onToggle}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      className="w-full rounded-[14px] px-4 py-3 text-left transition-all"
      style={{ 
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      {/* Top line */}
      <div className="flex items-center gap-2">
        {/* Status pill */}
        <span 
          className="rounded-full px-2.5 py-1 text-[12px] leading-none shrink-0"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${game.kind === 'Hosting' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
            color: 'var(--hub-text-body)',
          }}
        >
          {game.kind}
        </span>

        {/* Flag — always in same place */}
        <span role="img" aria-label="flag">⛳</span>

        {/* Course name */}
        <div className="truncate flex-1 font-medium text-[15px]" style={{ color: 'var(--hub-text-bright)' }}>
          {game.course_name || 'Golf Course'}
        </div>

        {/* Slots */}
        <div className="text-[12px] shrink-0 ml-2" style={{ color: 'var(--hub-text-sub)' }}>
          {availableSlots}/{totalSlots}
        </div>

        {/* Chevron */}
        <span 
          className="ml-2 transition-transform text-[18px]"
          style={{ 
            color: 'var(--hub-text-sub)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ›
        </span>
      </div>

      {/* Expandable detail */}
      <div
        className="overflow-hidden transition-all duration-300 ease-out"
        style={{ 
          maxHeight: expanded ? '200px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
      >
        <div 
          className="mt-3 pt-3 grid gap-4"
          style={{ 
            borderTop: '1px solid rgba(255,255,255,0.08)',
            gridTemplateColumns: '1fr auto',
          }}
        >
          {/* Left: Date, time, host */}
          <div className="space-y-1 min-w-0">
            <div className="text-[13px]" style={{ color: 'var(--hub-text-body)' }}>
              {new Date(game.start_time).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </div>
            {(() => {
              const hostP = game.participants.find(p => p.user_id === game.host_user_id);
              const name = game.kind === 'Hosting' ? 'You' : (hostP?.user_profiles?.display_name || 'Host');
              return (
                <div className="text-[13px]" style={{ color: 'var(--hub-text-sub)' }}>
                  Host: <span style={{ color: 'var(--hub-text-body)' }}>{name}</span>
                </div>
              );
            })()}
          </div>

          {/* Right: Mini roster */}
          <div className="flex -space-x-2 items-start">
            {game.participants.slice(0, 4).map((p, i) => (
              p.user_profiles?.profile_photo_url ? (
                <img 
                  key={i}
                  src={p.user_profiles.profile_photo_url} 
                  alt={p.user_profiles.display_name || 'Player'}
                  className="w-8 h-8 rounded-full border-2"
                  style={{ borderColor: 'rgba(255,255,255,0.18)' }}
                />
              ) : (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 flex items-center justify-center text-[11px] font-medium"
                  style={{ 
                    borderColor: 'rgba(255,255,255,0.18)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'var(--hub-text-body)',
                  }}
                >
                  {p.user_profiles?.display_name?.charAt(0) || '?'}
                </div>
              )
            ))}
          </div>
        </div>
      </div>
    </button>
  );
}

export function YourGamesTile() {
  const openSheet = useOpenSheet();
  
  // Use shared hook for consistency with the sheet
  const { data, isLoading, isError, refetch } = useUserGames();
  useUserGamesRealtime();

  // Take top 6 games for horizontal carousel
  const games = React.useMemo(() => {
    if (!data) return [];
    const combined = [...data.hosting, ...data.joined]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 6);
    return combined as GameWithDetails[];
  }, [data]);

  return (
    <Tile 
      title="Your Games"
      subtitle="Hosting & Joined"
      onViewAll={() => openSheet('your-games')}
    >
      <div className="flex flex-col flex-1 min-h-0">
        {isLoading && (
          <div className="tile-x-scroll">
            {[0, 1, 2].map(i => (
              <div 
                key={i} 
                className="min-w-[240px] h-20 rounded-xl animate-pulse" 
                style={{ 
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                }} 
              />
            ))}
          </div>
        )}

        {isError && (
          <div className="text-[12px] space-y-2" style={{ color: 'var(--hub-text-sub)' }}>
            <div>Couldn't load games</div>
            <button 
              onClick={() => refetch()}
              className="text-[12px] underline"
              style={{ color: 'var(--hub-accent-orange)' }}
            >
              Retry
            </button>
          </div>
        )}
        
        {!isLoading && !isError && games.length === 0 && (
          <div className="text-[12px]" style={{ color: 'var(--hub-text-sub)' }}>
            No games yet.{' '}
            <button 
              onClick={() => openSheet('create-game')}
              className="underline"
              style={{ color: 'var(--hub-accent-orange)' }}
            >
              Create one
            </button>
          </div>
        )}

        {!isLoading && !isError && games.length > 0 && (
          <div className="tile-x-scroll">
            {games.map(g => (
              <GameChip
                key={g.id}
                game={g}
                onClick={() => openSheet('your-games', { id: g.id })}
              />
            ))}
          </div>
        )}
      </div>
    </Tile>
  );
}

function GameChip({ game, onClick }: { game: GameWithDetails; onClick: () => void }) {
  const totalSlots = game.slots_total || 0;
  const availableSlots = game.slots_open || 0;

  return (
    <button
      onClick={onClick}
      className="min-w-[240px] rounded-xl p-3 text-left transition"
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span 
          className="rounded-full px-2 py-0.5 text-[10px] leading-tight shrink-0"
          style={{
            background: 'rgba(255,255,255,0.08)',
            border: `1px solid ${game.kind === 'Hosting' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
            color: 'var(--hub-text-body)',
          }}
        >
          {game.kind}
        </span>
        <span className="text-[11px]" style={{ color: 'var(--hub-text-sub)' }}>
          {availableSlots}/{totalSlots}
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        <span>⛳</span>
        <div className="truncate font-medium text-[13px]" style={{ color: 'var(--hub-text-bright)' }}>
          {game.course_name || 'Golf Course'}
        </div>
      </div>
      
      <div className="mt-2 text-[11px]" style={{ color: 'var(--hub-text-sub)' }}>
        {new Date(game.start_time).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })}
      </div>
    </button>
  );
}
