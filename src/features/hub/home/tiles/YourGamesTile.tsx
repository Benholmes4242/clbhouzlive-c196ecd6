/**
 * Your Games Tile
 * Full-width tile showing games user is hosting or joined
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Tile } from '../components/Tile';
import { useUserGames } from '@/features/hub/hooks/useUserGames';
import { useUserGamesRealtime } from '@/features/hub/hooks/useUserGamesRealtime';
import { useHub } from '@/features/hub/useHub';
import { devlog } from '@/utils/log';
import { scrollChildIntoView } from '../utils/scroll';
import { GameExpandedPrimary } from './games/GameExpandedPrimary';
import { GameExpandedRoster } from './games/GameExpandedRoster';
import { GameExpandedNotes } from './games/GameExpandedNotes';
import { GameExpandedMeta } from './games/GameExpandedMeta';
import './games/gameAnimations.css';
import './games/gameRow.css';

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
    };
  }>;
};

function GameRow({ 
  game,
  index,
  onExpandedChange,
}: { 
  game: GameWithDetails;
  index: number;
  onExpandedChange?: (rowEl: HTMLElement | null, expanded: boolean) => void;
}) {
  const rowRef = React.useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const totalSlots = game.slots_total || 0;
  const availableSlots = game.slots_open || 0;

  const toggle = () => {
    const next = !expanded;
    setExpanded(next);
    // Defer until layout updates for accurate geometry
    requestAnimationFrame(() => {
      onExpandedChange?.(rowRef.current, next);
      // Keep accessibility solid without jumping
      rowRef.current?.focus({ preventScroll: true });
    });
  };
  
  return (
    <div 
      ref={rowRef}
      role="button"
      tabIndex={0}
      onClick={toggle}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}
      className="hub-game-row w-full rounded-[14px] px-4 py-3 text-left transition-all"
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
          maxHeight: expanded ? '400px' : '0px',
          opacity: expanded ? 1 : 0,
        }}
        aria-hidden={!expanded}
      >
        <div 
          className="mt-3 pt-3"
          style={{ 
            borderTop: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            className="fade-slide-in fade-stagger"
            style={{ '--d': '0ms' } as React.CSSProperties}
          >
            <GameExpandedPrimary
              kind={game.kind}
              courseName={game.course_name}
              startTime={game.start_time}
              slotsTotal={game.slots_total || 4}
              slotsOpen={game.slots_open || 0}
            />
          </div>

          <div
            className="fade-slide-in fade-stagger"
            style={{ '--d': '60ms' } as React.CSSProperties}
          >
            <GameExpandedRoster
              host={{
                id: game.host_user_id,
                name: game.kind === 'Hosting' ? 'You' : (
                  game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.display_name || 'Host'
                ),
                avatarUrl: game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.profile_photo_url || null,
              }}
              members={game.participants.map(p => ({
                id: p.user_id || '',
                name: p.user_profiles?.display_name || 'Player',
                avatarUrl: p.user_profiles?.profile_photo_url || null,
              }))}
            />
          </div>

          {game.notes && (
            <div
              className="fade-slide-in fade-stagger"
              style={{ '--d': '120ms' } as React.CSSProperties}
            >
              <GameExpandedNotes notes={game.notes} />
            </div>
          )}

          <div
            className="fade-slide-in fade-stagger"
            style={{ '--d': '100ms' } as React.CSSProperties}
          >
            <GameExpandedMeta expiresAt={game.expires_at} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function YourGamesTile() {
  const nav = useNavigate();
  const { navigateFromHub } = useHub();
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const viewAllRef = React.useRef<HTMLButtonElement>(null);
  
  // Use shared hook for consistency with the sheet
  const { data, isLoading, isError, refetch } = useUserGames();
  useUserGamesRealtime();

  const comingSoon = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    alert('Coming soon');
  };

  const openCreateGame = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigateFromHub('/hub/create-game');
  };

  const openSearchGames = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigateFromHub('/hub/games');
  };

  const openYourGames = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    navigateFromHub('/hub/your-games');
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
    const combined = [...data.hosting, ...data.joined]
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return combined as GameWithDetails[];
  }, [data]);

  const hasAny = games.length > 0;

  return (
    <Tile 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' }}>
          <h3>Games</h3>
          <button
            onClick={openCreateGame}
            className="text-[15px] font-medium transition"
            style={{ 
              background: 'transparent',
              border: 'none',
              color: 'var(--hub-text-body)',
              padding: 0,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
            aria-label="Create a Game"
          >
            Create a Game +
          </button>
        </div>
      }
      footer={
        <div className="mt-auto">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={openSearchGames}
              className="text-[15px] font-medium transition"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--hub-text-body)',
                padding: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
              aria-label="Search Games"
            >
              ← Search Games
            </button>
            <button
              ref={viewAllRef}
              onClick={openYourGames}
              className="text-[15px] font-medium transition"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--hub-text-body)',
                padding: 0,
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--hub-text)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--hub-text-body)'}
              aria-label="View all your games"
              disabled={!hasAny && isLoading}
            >
              Your Games →
            </button>
          </div>
        </div>
      }
      >
      <div className="flex flex-col">{/* h-full removed to allow flex shrinking */}
        <div
          ref={listRef}
          className="games-scroll"
          style={{ 
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            flex: 1,
            minHeight: 0,
            marginTop: '12px',
            paddingRight: '4px',
            maskImage: 'linear-gradient(180deg, #000 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 85%, transparent 100%)',
          }}
        >
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
                onClick={openCreateGame}
                className="underline underline-offset-2"
                style={{ color: 'var(--hub-accent-orange)' }}
              >
                Create one
              </button>
            </div>
          )}

          {!isLoading && !isError && games.map((g, i) => (
            <GameRow
              key={g.id}
              game={g}
              index={i}
              onExpandedChange={(rowEl, expanded) => {
                if (!expanded) return;
                const container = listRef.current;
                if (container && rowEl) {
                  scrollChildIntoView(container, rowEl, 12);
                }
              }}
            />
          ))}
        </div>
      </div>
      </div>
    </Tile>
  );
}
