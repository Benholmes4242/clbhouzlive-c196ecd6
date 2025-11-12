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
      className="inline-flex items-center px-2.5 py-[3px] rounded-full text-[13px] leading-none"
      style={{
        background: isHosting ? 'var(--token-success-bg)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${isHosting ? 'var(--token-success-border)' : 'rgba(255,255,255,0.10)'}`,
        color: isHosting ? 'var(--token-success-ink)' : 'var(--hub-text-body)',
      }}
      aria-label={isHosting ? 'Hosting' : 'Joined'}
    >
      {isHosting ? 'Hosting' : 'Joined'}
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
  const when = dt.toLocaleString(undefined, {
    weekday: 'short', 
    day: 'numeric', 
    month: 'short',
    hour: '2-digit', 
    minute: '2-digit', 
    hour12: false
  });

  return (
    <button 
      ref={rowRef}
      onClick={toggle}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={clearTimer}
      onPointerCancel={clearTimer}
      className="game-row w-full py-3 text-left outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0"
      aria-label={`${game.course_name || 'Golf Course'}, ${when}. ${game.kind === 'Hosting' ? 'Hosting' : 'Joined'}`}
      style={{ 
        background: 'transparent',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
        WebkitTapHighlightColor: 'transparent',
        transition: prefersReduced ? undefined : 'transform 120ms ease, opacity 180ms ease',
        transformOrigin: 'center',
        lineHeight: 1.2,
      }}
    >
      {/* Line 1: flag + Course name */}
      <div className="flex items-center gap-2 mb-[2px] sm:mb-[3px]">
        <span aria-hidden="true" style={{ fontSize: '14px' }}>⛳️</span>
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

      {/* Line 2: Hosting / Joined badge + time */}
      <div className="mt-1 flex items-center gap-2">
        <StatusPill kind={game.kind} />
        <time className="text-[13px]" style={{ color: 'var(--hub-text-sub)' }}>{when}</time>
      </div>

      {/* Expandable detail */}
      <div
        className="gt-expand"
        style={{ 
          maxHeight: expanded ? '360px' : '0px',
          opacity: expanded ? 1 : 0,
          paddingTop: expanded ? '8px' : '0px',
          paddingBottom: expanded ? '10px' : '0px',
        }}
        aria-hidden={!expanded}
      >
        <div 
          className="pt-2"
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
                homeClub: game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.home_club || null,
                handicap: game.participants.find(p => p.user_id === game.host_user_id)?.user_profiles?.eg_handicap_index || null,
              }}
              members={game.participants.map(p => {
                const hasProfile = !!p.user_profiles;
                const isGuest = !p.user_id || !hasProfile;
                const name = isGuest 
                  ? 'Guest' 
                  : (p.user_profiles?.display_name || 'Player');
                
                return {
                  id: p.user_id || `guest_${Math.random().toString(36).slice(2)}`,
                  name,
                  avatarUrl: isGuest ? null : (p.user_profiles?.profile_photo_url || null),
                  homeClub: isGuest ? null : (p.user_profiles?.home_club || null),
                  handicap: isGuest ? null : (p.user_profiles?.eg_handicap_index || null),
                };
              })}
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
