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
  const nav = useNavigate();
  const openSheet = useOpenSheet();
  const [openId, setOpenId] = React.useState<string | null>(null);
  const viewAllRef = React.useRef<HTMLButtonElement>(null);
  
  // Use shared hook for consistency with the sheet
  const { data, isLoading, isError, refetch } = useUserGames();
  useUserGamesRealtime();

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

  // Combine hosting & joined, take top 3 by time
  const games = React.useMemo(() => {
    if (!data) return [];
    const combined = [...data.hosting, ...data.joined]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3);
    return combined as GameWithDetails[];
  }, [data]);

  const toggle = (id: string) => setOpenId(o => (o === id ? null : id));

  const hasAny = games.length > 0;

  return (
    <Tile title="Your Games">
      <div className="flex flex-col h-full" style={{ ['--tile-x' as any]: '16px' }}>
        <div className="space-y-3">
          {isLoading && [0, 1, 2].map(i => (
            <div 
              key={i} 
              className="h-12 rounded-[14px] animate-pulse" 
              style={{ 
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
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
            <div className="text-[14px]" style={{ color: 'var(--hub-text-sub)' }}>
              No games yet.{' '}
              <button 
                onClick={() => openSheet('create-game')}
                className="underline underline-offset-2"
                style={{ color: 'var(--hub-accent-orange)' }}
              >
                Create one
              </button>
            </div>
          )}

          {!isLoading && !isError && games.map(g => (
            <GameRow
              key={g.id}
              game={g}
              expanded={openId === g.id}
              onToggle={() => toggle(g.id)}
              onLongPress={() => nav(`/hub?sheet=your-games&id=${g.id}`)}
            />
          ))}
        </div>

        {/* Bottom region: divider + text-only "View all" */}
        <div className="mt-auto pt-4">
          <div 
            className="h-px"
            style={{
              background: 'rgba(255,255,255,0.18)',
              borderRadius: '1px',
              width: '100%',
            }}
          />
          <button
            onClick={() => openSheet('your-games')}
            className="ml-auto mt-3 sm:mt-4 block text-[15px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
              marginBottom: '-14px', // pull to bottom edge of Tile (pb-3.5)
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
            aria-label="View all your games"
            disabled={!hasAny && isLoading}
          >
            View all →
          </button>
        </div>
      </div>
    </Tile>
  );
}
