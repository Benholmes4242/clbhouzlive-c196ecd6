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
    <TapButton 
      className="ctaHero" 
      onClick={() => { haptic('light'); onOpen(); }}
    >
      Create a Game
    </TapButton>
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
      <div className="searchModeToggle">
        <TapButton
          className={`modeChip ${searchMode === 'clubs' ? 'modeChip--active' : ''}`}
          onClick={() => {
            haptic('light');
            onSearchModeChange('clubs');
          }}
        >
          Clubs
        </TapButton>
        <TapButton
          className={`modeChip ${searchMode === 'people' ? 'modeChip--active' : ''}`}
          onClick={() => {
            haptic('light');
            onSearchModeChange('people');
          }}
        >
          People
        </TapButton>
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
            <label className="findLabel">Find a Game</label>
            <div className="searchBox" role="search">
              <Search size={18} className="searchBox__icon" />
              <input
                placeholder="Search golf club..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => setOpen(true)}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                aria-label="Search golf clubs"
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
  
  return (
    <div 
      className={`chipsRow ${showDistance ? 'cols-3' : 'cols-2'}`} 
      role="group" 
      aria-label="Game filters"
    >
      <TapButton 
        className={`chip ${filters.when === null ? 'chip--placeholder' : 'chip--active'}`}
        onClick={() => openWhenSheet(filters)}
        aria-label="Filter by date & time"
      >
        {filters.when === null && <Calendar size={16} className="chip__icon" />}
        <span className="chip__text">{getWhenLabel()}</span>
      </TapButton>
      
      {showDistance && (
        <TapButton 
          className={`chip ${filters.distanceKm === null ? 'chip--placeholder' : 'chip--active'}`}
          onClick={() => openDistanceSheet(filters)}
          aria-label="Filter by distance"
        >
          {filters.distanceKm === null && <MapPin size={16} className="chip__icon" />}
          <span className="chip__text">{getDistanceLabel()}</span>
        </TapButton>
      )}
      
      <TapButton 
        className={`chip ${filters.sort === null ? 'chip--placeholder' : 'chip--active'}`}
        onClick={() => openSortSheet(filters)}
        aria-label="Sort games"
      >
        {filters.sort === null && <ArrowUpDown size={16} className="chip__icon" />}
        <span className="chip__text">{getSortLabel()}</span>
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
    <div className="gameRow" role="article" aria-label={`${game.course_name || 'Golf game'}, ${formatDate(game.start_time)}, ${filledLabel}`}>
      <div className="gameRow__top">
        <div className="gameRow__title">{game.course_name || 'Golf Game'}</div>
      </div>

      <div className="gameRow__meta">
        <span className="gameRow__time">🗓 {formatDate(game.start_time)} • {formatTime(game.start_time)}</span>
        <span className={`gameRow__badge ${seatsLeft > 0 ? 'gameRow__badge--ok' : 'gameRow__badge--full'}`}>{filledLabel}</span>
      </div>

      <div className="gameRow__actions">
        <TapButton
          className="gameRow__btn"
          disabled={isPending || seatsLeft <= 0}
          onClick={handleJoin}
        >
          {seatsLeft <= 0 ? 'Full' : isPending ? 'Requesting…' : 'Request to Join'}
        </TapButton>
      </div>
    </div>
  );
}

function GamesList({ games, isLoading }: { games: Game[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="list">
        {[1, 2, 3].map(i => (
          <div key={i} className="gameRow gameRow--skeleton">
            <div className="skeletonLine skeletonLine--wide" />
            <div className="skeletonLine skeletonLine--narrow" />
          </div>
        ))}
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="empty" role="status">
        <div className="emoji">📍</div>
        <div className="title">No games found</div>
        <div className="sub">Be the first to start one — tap <strong>Create a Game</strong>.</div>
      </div>
    );
  }

  return (
    <div className="list">
      {games.map(g => <GameCard key={g.id} game={g} />)}
    </div>
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
        <div className="scopedHeading">
          {selectedClub ? `Games at ${selectedClub.name}` : 'Games Near You'}
        </div>
        <GamesList games={games || []} isLoading={isLoading} />
      </div>
    </div>
  );
}
