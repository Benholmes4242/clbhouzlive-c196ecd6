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

// Status Pill Component
function StatusPill({ kind }: { kind: 'Hosting' | 'Joined' }) {
  const isHosting = kind === 'Hosting';
  return (
    <span
      className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[13px] leading-none backdrop-blur-md"
      style={{
        background: 'rgba(255,255,255,0.15)',
        border: '1px solid rgba(255,255,255,0.20)',
        color: 'var(--hub-text-body)',
      }}
      aria-label={isHosting ? 'Host' : 'Joined'}
    >
      {isHosting ? 'Host' : 'Joined'}
    </span>
  );
}

function GameRow({ 
  game,
  index,
  onExpandedChange,
}: { 
  game: GameWithDetails;
  index: number;
  onExpandedChange?: (rowEl: HTMLElement | null, expanded: boolean) => void;
}) {
  const rowRef = React.useRef<HTMLButtonElement | null>(null);
  const [expanded, setExpanded] = React.useState(false);
  const totalSlots = game.slots_total || 0;
  const availableSlots = game.slots_open || 0;
  const timerRef = React.useRef<number | null>(null);
  const startRef = React.useRef<{ x: number; y: number } | null>(null);

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

  const comingSoon = () => {
    alert('Coming soon');
  };
  
  const handlePointerDown = (e: React.PointerEvent) => {
    startRef.current = { x: e.clientX, y: e.clientY };
    rowRef.current?.setAttribute('data-pressed', 'true');
    timerRef.current = window.setTimeout(() => {
      comingSoon();
    }, 500);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!startRef.current) return;
    const dy = Math.abs(e.clientY - startRef.current.y);
    // Cancel long-press if user drags vertically (allows scroll to start)
    if (dy > 6 && timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearTimer = () => {
    rowRef.current?.removeAttribute('data-pressed');
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    startRef.current = null;
  };

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  
  // Determine current user ID from participants
  const currentUserId = game.kind === 'Hosting' ? game.host_user_id : null;
  const isHost = game.kind === 'Hosting';
  const hostName = game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.display_name || 'Host';
  
  // Format date/time for collapsed header
  const dt = new Date(game.start_time);
  const formatDate = (d: Date) => d.toLocaleDateString(undefined, { 
    month: 'short', 
    day: 'numeric' 
  });
  const formatTime = (d: Date) => d.toLocaleTimeString(undefined, { 
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false 
  });
  const holeCount = 18; // Default to 18 holes for now
  const currentPlayers = game.participants.length;
  const maxPlayers = game.slots_total || 4;

  return (
    <button 
      ref={rowRef}
      onClick={toggle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      className="game-row w-full py-3 text-left outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0"
      aria-label={`${game.course_name || 'Golf Course'}, ${formatDate(dt)} ${formatTime(dt)}. ${game.kind === 'Hosting' ? 'Hosting' : 'Joined'}`}
      style={{ 
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        WebkitTapHighlightColor: 'transparent',
        transition: prefersReduced ? undefined : 'transform 120ms ease, opacity 180ms ease',
        transformOrigin: 'center',
        lineHeight: 1.2,
      }}
    >
      {/* Line 1: Course name + chevron */}
      <div className="flex items-center gap-2 mb-[2px] sm:mb-[3px]">
        <div className="truncate text-[16px] font-medium" style={{ color: 'var(--hub-text-bright)' }}>
          {game.course_name || 'Golf Course'}
        </div>
        
        {/* Chevron */}
        <span 
          className="shrink-0 ml-auto transition-transform text-[18px]"
          style={{ 
            color: 'var(--hub-text-sub)',
            opacity: 0.6,
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        >
          ›
        </span>
      </div>

      {/* Line 2: meta line with date · time · holes · players */}
      <div className="mt-1 flex items-center justify-between gap-2">
        <p className="text-[11px]" style={{ color: 'var(--hub-text-muted)' }}>
          {formatDate(dt)} · {formatTime(dt)} · {holeCount} holes · {currentPlayers}/{maxPlayers} players
        </p>
        <StatusPill kind={game.kind} />
      </div>

      {/* Expandable detail */}
      <div
        className="gt-expand"
        style={{ 
          maxHeight: expanded ? '400px' : '0px',
          opacity: expanded ? 1 : 0,
          paddingTop: expanded ? '12px' : '0px',
          paddingBottom: expanded ? '10px' : '0px',
        }}
        aria-hidden={!expanded}
      >
        <div 
          className="pt-2"
          style={{ 
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Host & Members two-column grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Host column */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.09em] mb-1" style={{ color: 'var(--hub-text-muted)' }}>
                Host
              </p>
              <div className="flex items-center gap-2">
                <div 
                  className="shrink-0 w-9 h-9 rounded-full bg-cover bg-center"
                  style={{ 
                    backgroundImage: `url(${game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.profile_photo_url || '/placeholder.svg'})`,
                    border: '1px solid rgba(255,255,255,0.2)'
                  }}
                />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold" style={{ color: 'var(--hub-text-body)' }}>
                    {game.kind === 'Hosting' ? 'You' : (
                      game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.display_name || 'Host'
                    )}
                  </p>
                  <p className="truncate text-[11px]" style={{ color: 'var(--hub-text-muted)' }}>
                    {game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.home_club || 'Club'} · HCP {game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.eg_handicap_index?.toFixed(1) || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* Members column */}
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.09em] mb-1" style={{ color: 'var(--hub-text-muted)' }}>
                Members
              </p>

              {game.participants.filter(p => p.user_id !== game.host_user_id).length === 0 && (
                <p className="text-[11px]" style={{ color: 'var(--hub-text-muted)' }}>
                  No members yet.
                </p>
              )}

              <div className="flex flex-col gap-1">
                {game.participants.filter(p => p.user_id !== game.host_user_id).map((m) => (
                  <div key={m.user_id} className="flex items-center gap-2">
                    <div 
                      className="shrink-0 w-7 h-7 rounded-full bg-cover bg-center"
                      style={{ 
                        backgroundImage: `url(${m.user_profiles?.profile_photo_url || '/placeholder.svg'})`,
                        border: '1px solid rgba(255,255,255,0.2)'
                      }}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-[12px]" style={{ color: 'var(--hub-text-body)' }}>
                        {m.user_profiles?.display_name || 'Guest'}
                      </p>
                      <p className="truncate text-[11px]" style={{ color: 'var(--hub-text-muted)' }}>
                        {m.user_profiles?.home_club ?? `HCP ${m.user_profiles?.eg_handicap_index?.toFixed(1) || '-'}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expiry row */}
          <div className="mt-3 flex items-center justify-end">
            <p className="inline-flex items-center gap-1 text-[11px]" style={{ color: 'var(--hub-text-muted)' }}>
              <span>⏱</span>
              <span>Expires in {(() => {
                const expiresAt = new Date(game.expires_at);
                const now = new Date();
                const diffMs = expiresAt.getTime() - now.getTime();
                const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                if (diffHours > 24) return `${Math.floor(diffHours / 24)}d`;
                if (diffHours > 0) return `${diffHours}h`;
                return `${diffMins}m`;
              })()}</span>
            </p>
          </div>
        </div>
      </div>
    </button>
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
      <div className="flex flex-col h-full min-h-0">
        <div
          ref={listRef}
          className="gt-scroll flex-1 min-h-0 -mr-1 pr-1"
          style={{ 
            marginTop: '8px',
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            touchAction: 'pan-y',
            maskImage: 'linear-gradient(180deg, #000 85%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(180deg, #000 85%, transparent 100%)',
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
            <li key={g.id}>
              <GameRow
                key={g.id}
                game={g}
                index={i}
                onExpandedChange={(rowEl, expanded) => {
                  if (!expanded) return;
                  const container = listRef.current;
                  if (container && rowEl) {
                    // Defer to next frame so layout is final before measuring
                    requestAnimationFrame(() => scrollChildToTop(container, rowEl, 12));
                  }
                }}
              />
            </li>
          ))}
        </ul>
      </div>
      </div>
    </Tile>
  );
}
