import { useState, useEffect } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { Search } from 'lucide-react';
import { useCourseSearch, GolfCourse } from '@/features/nearby/hooks/useCourseSearch';
import { useGameFilters } from './hooks/useGameFilters';
import { useGamesQuery } from './hooks/useGamesQuery';
import { useJoinGame } from './hooks/useJoinGame';
import { openWhenSheet, openDistanceSheet, openSortSheet, labelWhen } from './components/FilterSheets';
import { PeopleSearchInput } from './components/PeopleSearchInput';
import { cn } from '@/lib/utils';
import './GamesTab.css';

type Game = {
  id: string;
  course_name?: string;
  start_time: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
};

function ClubSearch({ 
  selectedClub, 
  onSelectClub,
}: { 
  selectedClub: GolfCourse | null; 
  onSelectClub: (club: GolfCourse | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setOpen] = useState(false);
  const { courses, isLoading } = useCourseSearch(query);

  const handleSelect = (club: GolfCourse) => {
    haptic('light');
    onSelectClub(club);
    setQuery('');
    setOpen(false);
  };

  if (selectedClub) return null;

  return (
    <div className="relative">
      <div className="searchBox">
        <Search size={18} style={{ color: 'white', flexShrink: 0 }} />
        <input
          placeholder="Search golf club..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
        />
      </div>
      {isOpen && query.length >= 2 && (
        <div className="resultsSheet">
          {isLoading ? (
            <div className="hint">Searching...</div>
          ) : courses.length === 0 ? (
            <div className="hint">No clubs found</div>
          ) : (
            courses.map(c => (
              <TapButton key={c.id} className="resultRow" onClick={() => handleSelect(c)}>
                <div className="rMid">
                  <div className="rTitle">{c.name}</div>
                  <div className="rSub">{c.region || c.country}</div>
                </div>
              </TapButton>
            ))
          )}
        </div>
      )}
      {isOpen && query.length > 0 && query.length < 2 && (
        <div className="resultsSheet">
          <div className="hint">Type at least 2 characters</div>
        </div>
      )}
    </div>
  );
}

function FiltersRow({ selectedClub, onIncreaseDistance }: { selectedClub: GolfCourse | null; onIncreaseDistance: () => void }) {
  const filters = useGameFilters();
  const showDistance = !selectedClub;
  
  const getWhenLabel = () => {
    if (filters.when === null) return 'When';
    return labelWhen(filters.when);
  };
  
  const getDistanceLabel = () => {
    if (filters.distanceKm === null) return 'Distance';
    return `${filters.distanceKm} km`;
  };
  
  const getSortLabel = () => {
    return filters.sortLabel;
  };
  
  const pillBase = "inline-flex items-center gap-1 rounded-[999px] border border-[color:var(--hub-stroke-subtle)] bg-[color:var(--hub-glass-bg-subtle)] px-3 py-1.5 text-[12px] text-[color:var(--hub-text-muted)] active:scale-[0.97] transition-transform duration-[120ms]";
  
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <button 
        type="button" 
        onClick={() => openWhenSheet(filters)} 
        className={pillBase}
      >
        <span className="text-[14px]">📅</span>
        <span>{getWhenLabel()}</span>
      </button>

      {showDistance && (
        <button 
          type="button" 
          onClick={() => openDistanceSheet(filters)} 
          className={pillBase}
        >
          <span className="text-[14px]">📍</span>
          <span>{getDistanceLabel()}</span>
        </button>
      )}

      <button 
        type="button" 
        onClick={() => openSortSheet(filters)} 
        className={pillBase}
      >
        <span className="text-[14px]">⇅</span>
        <span>{getSortLabel()}</span>
      </button>
    </div>
  );
}

function GameRow({ game }: { game: Game }) {
  const { requestJoin, isPending } = useJoinGame(game.id);
  
  const seatsFilled = game.slots_total - game.slots_open;
  const seatsLeft = game.slots_open;
  const isFull = seatsLeft <= 0;
  const statusLabel = isFull ? 'Full' : `${seatsFilled}/${game.slots_total} filled`;

  const formatTime = (isoTime: string) => {
    const date = new Date(isoTime);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const formatDate = (isoTime: string) => {
    const date = new Date(isoTime);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const handleJoin = () => {
    haptic('medium');
    requestJoin();
  };

  return (
    <li>
      <button
        type="button"
        onClick={handleJoin}
        disabled={isPending || isFull}
        className="flex w-full items-center justify-between gap-3 py-2.5 active:scale-[0.99] transition-transform duration-100 disabled:opacity-50"
      >
        <div className="min-w-0 text-left">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[13px] font-semibold text-[color:var(--hub-text-body)]">
              {game.course_name || 'Golf Game'}
            </span>
          </div>
          <p className="mt-0.5 text-[11px] text-[color:var(--hub-text-muted)]">
            {formatDate(game.start_time)} • {formatTime(game.start_time)}
          </p>
        </div>

        <span
          className={cn(
            'shrink-0 rounded-full border px-2.5 py-[3px] text-[10px] font-medium uppercase tracking-[0.1em]',
            isFull
              ? 'bg-red-500/15 border-red-400/40 text-red-200'
              : 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
          )}
        >
          {statusLabel}
        </span>
      </button>
    </li>
  );
}

function GamesList({ 
  games, 
  isLoading, 
  selectedClub, 
  onCreateGame,
  onClearClub,
  onIncreaseDistance 
}: { 
  games: Game[]; 
  isLoading: boolean;
  selectedClub: GolfCourse | null;
  onCreateGame: () => void;
  onClearClub: () => void;
  onIncreaseDistance: () => void;
}) {
  if (isLoading) {
    return (
      <ul className="mt-1 divide-y divide-[color:var(--hub-divider-soft)] border-t border-[color:var(--hub-divider-soft)]">
        {[1, 2, 3].map(i => (
          <li key={i} className="py-2.5">
            <div className="h-4 w-3/5 bg-white/5 rounded animate-pulse mb-2" />
            <div className="h-3 w-2/5 bg-white/5 rounded animate-pulse" />
          </li>
        ))}
      </ul>
    );
  }

  if (selectedClub && games.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center px-8">
        <div className="mb-3 text-[32px]">📍</div>
        <p className="text-[14px] font-semibold text-[color:var(--hub-text-bright)]">
          No games found at {selectedClub.name}
        </p>
        <p className="mt-1 text-[12px] text-[color:var(--hub-text-muted)]">
          Be the first to start one — tap <span className="font-medium">Create a Game</span>.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCreateGame}
            className="rounded-[999px] bg-[color:var(--hub-accent)] px-4 py-1.5 text-[12px] font-semibold text-black hub-tile-pressable"
          >
            Create a Game
          </button>
          <button
            type="button"
            onClick={onClearClub}
            className="rounded-[999px] border border-[color:var(--hub-stroke-subtle)] bg-white/5 px-4 py-1.5 text-[12px] text-[color:var(--hub-text-muted)] hub-tile-pressable"
          >
            Search another course
          </button>
        </div>
      </div>
    );
  }

  if (!selectedClub && games.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center justify-center text-center px-8">
        <div className="mb-3 text-[32px]">⛳️</div>
        <p className="text-[14px] font-semibold text-[color:var(--hub-text-bright)]">
          No games nearby yet
        </p>
        <p className="mt-1 text-[12px] text-[color:var(--hub-text-muted)]">
          Try widening your distance or starting a new game for others to join.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onIncreaseDistance}
            className="rounded-[999px] border border-[color:var(--hub-stroke-subtle)] bg-white/5 px-4 py-1.5 text-[12px] text-[color:var(--hub-text-muted)] hub-tile-pressable"
          >
            Increase distance
          </button>
          <button
            type="button"
            onClick={onCreateGame}
            className="rounded-[999px] bg-[color:var(--hub-accent)] px-4 py-1.5 text-[12px] font-semibold text-black hub-tile-pressable"
          >
            Create a Game
          </button>
        </div>
      </div>
    );
  }

  return (
    <ul className="mt-1 divide-y divide-[color:var(--hub-divider-soft)] border-t border-[color:var(--hub-divider-soft)]">
      {games.map(g => <GameRow key={g.id} game={g} />)}
    </ul>
  );
}

export function GamesTab({ onOpenCreate }: { onOpenCreate: () => void }) {
  const [selectedClub, setSelectedClub] = useState<GolfCourse | null>(null);
  const [searchMode, setSearchMode] = useState<'clubs' | 'people'>('clubs');
  const [selectedUser, setSelectedUser] = useState<{ id: string; display_name: string } | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const filters = useGameFilters();
  const { data: games, isLoading } = useGamesQuery(selectedClub?.id);

  // Keyboard-aware scroll behavior
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handler = () => {
      const viewportHeight = window.innerHeight;
      const visualHeight = (window.visualViewport && window.visualViewport.height) || viewportHeight;
      const keyboardLikelyOpen = visualHeight / viewportHeight < 0.8;
      setIsKeyboardOpen(keyboardLikelyOpen);
    };

    window.visualViewport?.addEventListener('resize', handler);
    return () => window.visualViewport?.removeEventListener('resize', handler);
  }, []);

  // Scroll to top on mount
  useEffect(() => {
    const el = document.getElementById('games-scroll');
    const t = requestAnimationFrame(() => {
      if (el && 'scrollTo' in el) {
        el.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } else {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      }
    });
    return () => cancelAnimationFrame(t);
  }, []);

  const handleIncreaseDistance = () => {
    haptic('light');
    const currentDist = filters.distanceKm || 10;
    const newDist = currentDist === 10 ? 25 : currentDist === 25 ? 50 : 100;
    filters.setDistanceKm(newDist);
  };

  return (
    <div 
      className={cn(
        "h-full w-full transition-[padding-bottom] duration-150",
        isKeyboardOpen && "pb-[5rem]"
      )}
    >
      <div className="flex h-full flex-col px-4 pb-4">
        {/* Header with Create Button */}
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-[17px] font-semibold tracking-[-0.01em] text-[color:var(--hub-text-bright)]">
              Games
            </h1>
            <p className="mt-1 text-[13px] leading-snug text-[color:var(--hub-text-muted)]">
              Find games near you or at your favourite clubs.
            </p>
          </div>

          <button
            type="button"
            onClick={() => { haptic('light'); onOpenCreate(); }}
            className="hub-tile-pressable inline-flex flex-col items-center justify-center gap-0.5 rounded-[16px] bg-[color:var(--hub-glass-bg-strong)] border border-[color:var(--hub-stroke-subtle)] px-2 py-1.5 shadow-[0_8px_20px_rgba(0,0,0,0.55)]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-white/10 text-[18px] text-[color:var(--hub-text-bright)]">
              +
            </div>
            <span className="text-[10px] font-medium tracking-[0.12em] uppercase text-[color:var(--hub-text-muted)]">
              Create
            </span>
          </button>
        </header>

        {/* Segmented Control */}
        <div className="mb-3 flex items-center justify-center">
          <div className="inline-flex rounded-full bg-white/4 p-[3px] border border-[color:var(--hub-stroke-subtle)]">
            {['clubs', 'people'].map((mode) => {
              const isActive = searchMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    haptic('light');
                    setSearchMode(mode as 'clubs' | 'people');
                  }}
                  className={cn(
                    'min-w-[86px] px-3 py-1.5 text-[12px] font-medium rounded-full transition-all duration-150',
                    isActive
                      ? 'bg-black/70 text-[color:var(--hub-text-bright)] shadow-[0_6px_18px_rgba(0,0,0,0.65)]'
                      : 'bg-transparent text-[color:var(--hub-text-muted)]'
                  )}
                >
                  {mode === 'clubs' ? 'Clubs' : 'People'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Area */}
        <div id="games-scroll" className="flex-1 overflow-y-auto -mx-4 px-4">
          {searchMode === 'clubs' ? (
            <>
              <ClubSearch 
                selectedClub={selectedClub} 
                onSelectClub={setSelectedClub}
              />

              {/* Viewing games at [Club] pill */}
              {selectedClub && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <div className="inline-flex items-center gap-2 rounded-[999px] bg-black/65 border border-[color:var(--hub-stroke-subtle)] px-3 py-1.5 text-[12px] text-[color:var(--hub-text-bright)] shadow-[0_8px_20px_rgba(0,0,0,0.6)]">
                    <span className="truncate">
                      Viewing games at <span className="font-semibold">{selectedClub.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        haptic('light');
                        setSelectedClub(null);
                      }}
                      className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/6 active:scale-95 transition-transform"
                    >
                      <span className="absolute inset-0 flex items-center justify-center text-[13px] leading-none">
                        ×
                      </span>
                    </button>
                  </div>
                </div>
              )}

              <FiltersRow selectedClub={selectedClub} onIncreaseDistance={handleIncreaseDistance} />
              
              <GamesList 
                games={games || []} 
                isLoading={isLoading}
                selectedClub={selectedClub}
                onCreateGame={onOpenCreate}
                onClearClub={() => setSelectedClub(null)}
                onIncreaseDistance={handleIncreaseDistance}
              />
            </>
          ) : (
            <PeopleSearchInput
              selectedUser={selectedUser}
              onSelect={setSelectedUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}
