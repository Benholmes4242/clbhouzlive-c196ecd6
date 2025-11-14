import { useState, useEffect } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { Search, MapPin, Calendar, ArrowUpDown } from 'lucide-react';
import { useCourseSearch, GolfCourse } from '@/features/nearby/hooks/useCourseSearch';
import { useGameFilters } from './hooks/useGameFilters';
import { useGamesQuery } from './hooks/useGamesQuery';
import { useJoinGame } from './hooks/useJoinGame';
import { openWhenSheet, openDistanceSheet, openSortSheet, labelWhen } from './components/FilterSheets';
import { PeopleSearchInput } from './components/PeopleSearchInput';
import './GamesTab.css';

type Game = {
  id: string;
  course_name?: string;
  start_time: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
};

function CreateGameCTA({ onOpen }: { onOpen: () => void }) {
  return (
    <>
      <p className="mt-1 text-[13px] text-white/60 leading-snug text-center px-4">
        Browse games nearby or at your favourite clubs.
      </p>
      <TapButton 
        className="ctaHero" 
        onClick={() => { haptic('light'); onOpen(); }}
      >
        <span>Create a Game</span>
      </TapButton>
    </>
  );
}

function FindAGame({ 
  selectedClub, 
  onSelectClub,
  searchMode,
  onSearchModeChange,
  selectedUser,
  onSelectUser
}: { 
  selectedClub: GolfCourse | null; 
  onSelectClub: (club: GolfCourse | null) => void;
  searchMode: 'clubs' | 'people';
  onSearchModeChange: (mode: 'clubs' | 'people') => void;
  selectedUser: { id: string; display_name: string } | null;
  onSelectUser: (user: { id: string; display_name: string } | null) => void;
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

  const handleClear = () => {
    haptic('light');
    onSelectClub(null);
  };

  return (
    <div className="findBlock">
      {/* Search mode toggle */}
      <div className="mb-3 flex items-center justify-center">
        <div className="inline-flex rounded-full bg-white/4 p-[3px] border border-white/10">
          {(['clubs', 'people'] as const).map((mode) => {
            const isActive = searchMode === mode;
            return (
              <TapButton
                key={mode}
                onClick={() => {
                  haptic('light');
                  onSearchModeChange(mode);
                }}
                className={
                  'min-w-[92px] px-3 py-1.5 text-[12px] font-medium rounded-full transition-all duration-150 ' +
                  (isActive
                    ? 'bg-black/80 text-white shadow-[0_6px_18px_rgba(0,0,0,0.6)]'
                    : 'bg-transparent text-white/55')
                }
              >
                {mode === 'clubs' ? 'Clubs' : 'People'}
              </TapButton>
            );
          })}
        </div>
      </div>

      {searchMode === 'clubs' ? (
        selectedClub ? (
          <div className="selectedClubRow">
            <span className="prefix">Viewing games at</span>
            <div className="clubPill">
              <span className="clubName">{selectedClub.name}</span>
              <TapButton className="x" aria-label="Clear" onClick={handleClear}>✕</TapButton>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center rounded-[14px] bg-black/35 border border-white/10 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              <span className="mr-2 text-[15px] text-white/60">🔍</span>
              <input
                placeholder="Search golf club…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                className="flex-1 bg-transparent outline-none text-[14px] text-white/90 placeholder:text-white/35"
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
                      <MapPin size={18} style={{ color: 'white', flexShrink: 0 }} />
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
          </>
        )
      ) : (
        <PeopleSearchInput
          selectedUser={selectedUser}
          onSelect={onSelectUser}
        />
      )}
    </div>
  );
}

function FiltersRow({ selectedClub }: { selectedClub: GolfCourse | null }) {
  const filters = useGameFilters();
  const showDistance = !selectedClub;
  
  // Apple-style chip labels: emoji + title when unset, value only when set
  const getWhenLabel = () => {
    if (filters.when === null) return 'When';
    return labelWhen(filters.when);
  };
  
  const getDistanceLabel = () => {
    if (filters.distanceKm === null) return 'Distance';
    return `${filters.distanceKm} km`;
  };
  
  const getSortLabel = () => {
    if (filters.sort === null) return 'Sort';
    return filters.sort === 'soonest' ? 'Soonest' : filters.sort === 'distance' ? 'Nearest' : 'Most Available Slots';
  };
  
  const isWhenActive = filters.when !== null;
  const isDistanceActive = filters.distanceKm !== null;
  const isSortActive = filters.sort !== null;

  return (
    <div 
      className="flex gap-3 py-3 w-full"
      role="group" 
      aria-label="Game filters"
    >
      <TapButton 
        className={
          'flex-1 flex items-center justify-center gap-1.5 rounded-[999px] border px-3 py-1.5 text-[12px] ' +
          (isWhenActive
            ? 'border-white/40 bg-white/16 text-white'
            : 'border-white/16 bg-black/28 text-white/70')
        }
        onClick={() => openWhenSheet(filters)}
        aria-label="Filter by date & time"
      >
        <span className="text-[14px]">
          <Calendar size={14} style={{ color: 'white', flexShrink: 0 }} />
        </span>
        <span className="truncate">{getWhenLabel()}</span>
      </TapButton>
      
      {showDistance && (
        <TapButton 
          className={
            'flex-1 flex items-center justify-center gap-1.5 rounded-[999px] border px-3 py-1.5 text-[12px] ' +
            (isDistanceActive
              ? 'border-white/40 bg-white/16 text-white'
              : 'border-white/16 bg-black/28 text-white/70')
          }
          onClick={() => openDistanceSheet(filters)}
          aria-label="Filter by distance"
        >
          <span className="text-[14px]">
            <MapPin size={14} style={{ color: 'white', flexShrink: 0 }} />
          </span>
          <span className="truncate">{getDistanceLabel()}</span>
        </TapButton>
      )}
      
      <TapButton 
        className={
          'flex-1 flex items-center justify-center gap-1.5 rounded-[999px] border px-3 py-1.5 text-[12px] ' +
          (isSortActive
            ? 'border-white/40 bg-white/16 text-white'
            : 'border-white/16 bg-black/28 text-white/70')
        }
        onClick={() => openSortSheet(filters)}
        aria-label="Sort games"
      >
        <span className="text-[14px]">
          <ArrowUpDown size={14} style={{ color: 'white', flexShrink: 0 }} />
        </span>
        <span className="truncate">{getSortLabel()}</span>
      </TapButton>
    </div>
  );
}

function GameCard({ game }: { game: Game }) {
  const { requestJoin, isPending } = useJoinGame(game.id);
  
  const seatsFilled = game.slots_total - game.slots_open;
  const filledLabel = `${seatsFilled}/${game.slots_total} filled`;
  const seatsLeft = game.slots_open;
  
  const formatDistance = (meters?: number) => {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

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
    <li className="mt-2 rounded-[16px] border border-white/10 bg-black/35 px-3.5 py-3.5 shadow-[0_10px_28px_rgba(0,0,0,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-white truncate">
            {game.course_name || 'Golf Game'}
          </p>
          <p className="mt-0.5 text-[12px] text-white/65 flex items-center gap-1.5">
            <span>📅</span>
            <span className="truncate">
              {formatDate(game.start_time)} • {formatTime(game.start_time)}
            </span>
          </p>
        </div>

        <span
          className={`
            shrink-0 rounded-full px-3 py-[4px]
            text-[11px] font-semibold tracking-[0.08em] uppercase
            ${seatsLeft > 0
              ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/50'
              : 'bg-white/8 text-white/55 border border-white/20'}
          `}
        >
          {filledLabel}
        </span>
      </div>

      <TapButton
        className="
          mt-3 w-full rounded-[999px]
          border border-white/18 bg-white/4
          text-[13px] font-medium text-white
          py-2.5 active:scale-[0.98] transition-transform duration-120
          disabled:opacity-50 disabled:cursor-not-allowed
        "
        disabled={isPending || seatsLeft <= 0}
        onClick={handleJoin}
      >
        {seatsLeft <= 0 ? 'Full' : isPending ? 'Requesting…' : 'Request to Join'}
      </TapButton>
    </li>
  );
}

function GamesList({ games, isLoading, selectedClub }: { games: Game[]; isLoading: boolean; selectedClub: GolfCourse | null }) {
  if (isLoading) {
    return (
      <ul className="space-y-2 px-3">
        {[1, 2, 3].map(i => (
          <li key={i} className="rounded-[16px] border border-white/10 bg-black/35 px-3.5 py-3.5 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-2/3 mb-2" />
            <div className="h-3 bg-white/10 rounded w-1/2" />
          </li>
        ))}
      </ul>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center text-center text-white/70 px-4">
        <div className="text-[32px] mb-2">📍</div>
        <p className="text-[14px] font-semibold">
          {selectedClub ? `No games found at ${selectedClub.name}.` : 'No games found.'}
        </p>
        <p className="mt-1 text-[12px] text-white/55 max-w-[260px]">
          Be the first to start one — tap <span className="font-semibold">Create a Game</span> above.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2 px-3">
      {games.map(g => <GameCard key={g.id} game={g} />)}
    </ul>
  );
}

export function GamesTab({ onOpenCreate }: { onOpenCreate: () => void }) {
  const [selectedClub, setSelectedClub] = useState<GolfCourse | null>(null);
  const [searchMode, setSearchMode] = useState<'clubs' | 'people'>('clubs');
  const [selectedUser, setSelectedUser] = useState<{ id: string; display_name: string } | null>(null);
  const { data: games, isLoading } = useGamesQuery(selectedClub?.id);

  // Scroll to top on mount (runs on every visit due to remount key)
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

  return (
    <div className="gamesTab">
      <CreateGameCTA onOpen={onOpenCreate} />
      
      <div id="games-scroll" className="gamesScroll">
        <FindAGame 
          selectedClub={selectedClub} 
          onSelectClub={setSelectedClub}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
        <FiltersRow selectedClub={selectedClub} />
        <h2 className="mt-4 mb-1 px-3 text-[14px] font-semibold text-white">
          {selectedClub ? `Games at ${selectedClub.name}` : 'Games Near You'}
        </h2>
        <GamesList games={games || []} isLoading={isLoading} selectedClub={selectedClub} />
      </div>
    </div>
  );
}
