import { useState, useEffect } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useCourseSearch, GolfCourse } from '@/features/nearby/hooks/useCourseSearch';
import { useGameFilters } from './hooks/useGameFilters';
import { useGamesQuery } from './hooks/useGamesQuery';
import { useJoinGame } from './hooks/useJoinGame';
import { GameResultCard, GameCardData, HostStats, PlayerAvatar } from './components/GameResultCard';
import { CreateGameBanner } from './components/CreateGameBanner';
import { GameSearchBar } from './components/GameSearchBar';
import { SimpleGameFilters } from './components/SimpleGameFilters';
import { GameFilterBottomSheet } from './components/GameFilterBottomSheet';
import { PeopleSearchInput } from './components/PeopleSearchInput';
import './GamesTab.css';

type Game = {
  id: string;
  course_name?: string;
  start_time: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
  visibility?: string;
  note?: string;
};

// Removed - now using CreateGameBanner component

function SearchModeToggle({ 
  searchMode,
  onSearchModeChange,
}: { 
  searchMode: 'clubs' | 'people';
  onSearchModeChange: (mode: 'clubs' | 'people') => void;
}) {
  return (
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
      <SearchModeToggle searchMode={searchMode} onSearchModeChange={onSearchModeChange} />

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
            <GameSearchBar
              value={query}
              onChange={setQuery}
              placeholder="Search golf club..."
            />
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
  const [whenSheetOpen, setWhenSheetOpen] = useState(false);
  const [distanceSheetOpen, setDistanceSheetOpen] = useState(false);
  const [sortSheetOpen, setSortSheetOpen] = useState(false);
  
  const showDistance = !selectedClub;
  
  const getWhenLabel = () => {
    if (!filters.when) return 'When';
    if (filters.when.exactTime) return filters.when.exactTime;
    if (filters.when.date) {
      const date = new Date(filters.when.date);
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      if (date.toDateString() === today.toDateString()) return 'Today';
      if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return filters.when.window === 'morning' ? 'Morning' : filters.when.window === 'afternoon' ? 'Afternoon' : filters.when.window === 'evening' ? 'Evening' : 'When';
  };
  
  const getDistanceLabel = () => {
    if (filters.distanceKm === null) return 'Distance';
    return `${filters.distanceKm} km`;
  };
  
  const getSortLabel = () => {
    if (filters.sort === null) return 'Sort';
    return filters.sort === 'soonest' ? 'Soonest' : filters.sort === 'distance' ? 'Nearest' : 'Most seats';
  };

  const whenOptions = [
    { label: 'Any', value: 'any' },
    { label: 'Today', value: 'today' },
    { label: 'Tomorrow', value: 'tomorrow' },
    { label: 'Morning', value: 'morning' },
    { label: 'Afternoon', value: 'afternoon' },
    { label: 'Evening', value: 'evening' },
  ];

  const distanceOptions = [
    { label: 'Any distance', value: 'any' },
    { label: 'Within 5 km', value: '5' },
    { label: 'Within 10 km', value: '10' },
    { label: 'Within 25 km', value: '25' },
    { label: 'Within 50 km', value: '50' },
  ];

  const sortOptions = [
    { label: 'Soonest first', value: 'soonest' },
    { label: 'Nearest first', value: 'distance' },
    { label: 'Most available seats', value: 'seats' },
  ];

  const handleWhenSelect = (value: string) => {
    if (value === 'any') {
      filters.setWhen(null);
    } else if (value === 'today') {
      filters.setWhen({ date: new Date(), window: 'any', exactTime: null });
    } else if (value === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      filters.setWhen({ date: tomorrow, window: 'any', exactTime: null });
    } else {
      filters.setWhen({ date: null, window: value as any, exactTime: null });
    }
  };

  const handleDistanceSelect = (value: string) => {
    if (value === 'any') {
      filters.setDistanceKm(null);
    } else {
      filters.setDistanceKm(parseInt(value));
    }
  };

  const handleSortSelect = (value: string) => {
    filters.setSort(value as any);
  };
  
  return (
    <>
      <SimpleGameFilters
        whenLabel={getWhenLabel()}
        distanceLabel={getDistanceLabel()}
        sortLabel={getSortLabel()}
        onWhenClick={() => setWhenSheetOpen(true)}
        onDistanceClick={() => setDistanceSheetOpen(true)}
        onSortClick={() => setSortSheetOpen(true)}
        showDistance={showDistance}
        whenActive={filters.when !== null}
        distanceActive={filters.distanceKm !== null}
        sortActive={filters.sort !== null}
      />

      <GameFilterBottomSheet
        open={whenSheetOpen}
        onClose={() => setWhenSheetOpen(false)}
        title="When"
        options={whenOptions}
        onSelect={handleWhenSelect}
      />

      <GameFilterBottomSheet
        open={distanceSheetOpen}
        onClose={() => setDistanceSheetOpen(false)}
        title="Distance"
        options={distanceOptions}
        onSelect={handleDistanceSelect}
      />

      <GameFilterBottomSheet
        open={sortSheetOpen}
        onClose={() => setSortSheetOpen(false)}
        title="Sort by"
        options={sortOptions}
        onSelect={handleSortSelect}
      />
    </>
  );
}

function GameCardWrapper({ game }: { game: Game }) {
  const { requestJoin, isPending } = useJoinGame(game.id);
  
  // Convert old game format to new GameCardData format
  const gameCardData: GameCardData = {
    id: game.id,
    courseName: game.course_name || 'Golf Course',
    courseId: game.id,
    gameType: 'EIGHTEEN_HOLES', // Default - will be updated when backend provides this
    teeTime: game.start_time,
    visibility: (game.visibility?.toUpperCase() as any) || 'PUBLIC',
    hostId: game.host_user_id,
    taggedPlayerIds: [],
    filledSlots: game.slots_total - game.slots_open,
    totalSlots: game.slots_total,
    note: game.note,
  };

  // Mock data for now - will be provided by backend
  const hostStats: HostStats = {
    userId: game.host_user_id,
    gamesHosted: 0,
    gamesCompleted: 0,
    gamesCancelledByHost: 0,
    avgPlayerRating: null,
  };

  const handicapsByUserId: Record<string, number | null> = {};
  const playerAvatars: PlayerAvatar[] = [];

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'PUBLIC': return 'Public game';
      case 'FRIENDS_ONLY': return 'Friends only';
      case 'CLUB_MEMBERS': return 'Club members';
      default: return 'Public game';
    }
  };

  const handleRequestToJoin = () => {
    requestJoin();
  };

  return (
    <GameResultCard
      game={gameCardData}
      hostStats={hostStats}
      handicapsByUserId={handicapsByUserId}
      visibilityLabel={getVisibilityLabel(gameCardData.visibility)}
      onRequestToJoin={handleRequestToJoin}
      playerAvatars={playerAvatars}
      isPending={isPending}
    />
  );
}

function GamesList({ games, isLoading }: { games: Game[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3 py-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-2xl border border-white/6 bg-black/40 backdrop-blur-xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="mt-10 flex flex-col items-center text-center text-white/60">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/6 text-[22px]">
          📍
        </div>
        <p className="text-[15px] font-medium">No games found</p>
        <p className="mt-1 max-w-[260px] text-[13px] text-white/45">
          Be the first to start one — tap <span className="font-semibold">Create a Game</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="py-4">
      {games.map(g => <GameCardWrapper key={g.id} game={g} />)}
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
      <div className="px-4 pt-4">
        <CreateGameBanner onOpen={onOpenCreate} />
      </div>
      
      <div id="games-scroll" className="gamesScroll px-4">
        <FindAGame 
          selectedClub={selectedClub} 
          onSelectClub={setSelectedClub}
          searchMode={searchMode}
          onSearchModeChange={setSearchMode}
          selectedUser={selectedUser}
          onSelectUser={setSelectedUser}
        />
        <div className="mt-4">
          <FiltersRow selectedClub={selectedClub} />
        </div>
        <h2 className="mt-4 text-[17px] font-semibold text-white">
          {selectedClub ? `Games at ${selectedClub.name}` : 'Games Near You'}
        </h2>
        <GamesList games={games || []} isLoading={isLoading} />
      </div>
    </div>
  );
}
