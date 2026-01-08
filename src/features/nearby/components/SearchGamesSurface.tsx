/**
 * SearchGamesSurface - Reusable Games Search/Browse surface
 * Contains all search logic, filters, and results list
 * Can be rendered in a sheet or standalone page
 */

import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { Search, MapPin, Calendar, ArrowUpDown, Plus, Clock } from 'lucide-react';
import { useCourseSearch, GolfCourse } from '@/features/nearby/hooks/useCourseSearch';
import { useGameFilters } from '../hooks/useGameFilters';
import { useGamesQuery } from '../hooks/useGamesQuery';
import { useJoinGame } from '../hooks/useJoinGame';
import { openWhenSheet, openDistanceSheet, openSortSheet, labelWhen } from './FilterSheets';
import { GameRow, type GameData } from '@/features/games/components/GameRow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { addDays, formatDistanceToNowStrict } from 'date-fns';
import '@/features/games/components/GameRow.css';
import '@/features/nearby/components/your-games/YourGames.css';
import '../GamesTab.css';
import '../SearchGames.css';

// V2.4: Constant for "starting soon" window
const STARTING_SOON_HOURS = 6;

type Game = {
  id: string;
  course_name?: string;
  start_time: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
};

interface PrefillCourse {
  id: string;
  name: string;
  region?: string;
  country?: string;
}

interface SearchGamesSurfaceProps {
  /** Extra padding at bottom for sticky footer */
  bottomPadding?: number;
  /** Callback to open Create Game sheet */
  onOpenCreate?: () => void;
  /** V2.4: Callback to report discover metadata for hub header */
  onMeta?: (meta: { resultsCount: number; startingSoonCount: number }) => void;
  /** V3: Pre-select a course (from leaderboard deep-link) */
  prefillCourse?: PrefillCourse;
}

function CreateGameHero({ onOpen }: { onOpen: () => void }) {
  return (
    <button 
      className="createGameHero" 
      onClick={() => { haptic('light'); onOpen(); }}
    >
      <div className="createGameHero__content">
        <div className="createGameHero__icon">
          <Plus className="w-5 h-5 text-white" />
        </div>
        <div className="createGameHero__text">
          <span className="createGameHero__title">Start a game</span>
          <span className="createGameHero__subtitle">Find a fourth, set a tee time, invite players</span>
        </div>
      </div>
      <svg className="createGameHero__chevron" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M7.5 5L12.5 10L7.5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function FindAGame({ 
  selectedClub, 
  onSelectClub,
  searchMode,
  onSearchModeChange,
}: { 
  selectedClub: GolfCourse | null; 
  onSelectClub: (club: GolfCourse | null) => void;
  searchMode: 'clubs' | 'people';
  onSearchModeChange: (mode: 'clubs' | 'people') => void;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { courses, isLoading } = useCourseSearch(query);

  const handleSelect = useCallback((club: GolfCourse) => {
    haptic('light');
    onSelectClub(club);
    setQuery('');
    setOpen(false);
  }, [onSelectClub]);

  const handleClear = () => {
    haptic('light');
    onSelectClub(null);
  };

  const handlePeopleClick = () => {
    haptic('light');
    toast('Player search coming soon', {
      description: 'For now, search by club.',
      duration: 2000,
    });
  };

  return (
    <div className="findBlock">
      {/* Search mode toggle - Hub style */}
      <div className="searchModeToggleHub">
        <button
          className={cn(
            "modeChipHub",
            searchMode === 'clubs' && "modeChipHub--active"
          )}
          onClick={() => {
            haptic('light');
            onSearchModeChange('clubs');
          }}
        >
          Clubs
        </button>
        <button
          className="modeChipHub modeChipHub--disabled"
          onClick={handlePeopleClick}
        >
          People
          <span className="comingSoonPill">Soon</span>
        </button>
      </div>

      {selectedClub ? (
        <div className="selectedClubRowHub">
          <MapPin className="w-4 h-4" style={{ color: 'var(--hub-text-dim)' }} />
          <span className="flex-1 font-medium text-sm" style={{ color: 'var(--hub-text)' }}>
            {selectedClub.name}
          </span>
          <TapButton className="changeBtn" onClick={handleClear}>
            Clear
          </TapButton>
        </div>
      ) : (
        <>
          <label className="sectionLabel">Find a game</label>
          <div 
            className="searchBoxHub" 
            role="search"
          >
            <Search size={16} style={{ color: 'var(--hub-text-dim)', flexShrink: 0 }} />
            <input
              placeholder="Search golf club..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              aria-label="Search golf clubs"
              className="searchInputHub"
            />
          </div>
          {isOpen && query.length >= 2 && (
            <div 
              ref={dropdownRef}
              className="resultsSheetHub"
            >
              {isLoading ? (
                <div className="hint">Searching...</div>
              ) : courses.length === 0 ? (
                <div className="hint">No clubs found</div>
              ) : (
                courses.map(c => (
                  <button 
                    key={c.id} 
                    className="resultRowHub" 
                    onPointerDown={(e) => {
                      e.preventDefault(); // Prevent blur before click
                      handleSelect(c);
                    }}
                  >
                    <MapPin size={16} style={{ color: 'var(--hub-text-dim)', flexShrink: 0 }} />
                    <div className="rMid">
                      <div className="rTitle">{c.name}</div>
                      <div className="rSub">{c.region || c.country}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {isOpen && query.length > 0 && query.length < 2 && (
            <div className="resultsSheetHub">
              <div className="hint">Type at least 2 characters</div>
            </div>
          )}
          
          {/* Click outside to close */}
          {isOpen && (
            <div 
              className="fixed inset-0 z-[1]" 
              onClick={() => setOpen(false)}
              style={{ background: 'transparent' }}
            />
          )}
        </>
      )}
    </div>
  );
}

// FiltersRow now receives filters as prop to avoid duplicate hook instances
function FiltersRow({ 
  selectedClub, 
  filters 
}: { 
  selectedClub: GolfCourse | null; 
  filters: ReturnType<typeof useGameFilters>;
}) {
  const isDistanceDisabled = !!selectedClub;
  
  const getWhenLabel = () => {
    if (filters.when === null) return 'When';
    return labelWhen(filters.when);
  };
  
  const getDistanceLabel = () => {
    if (selectedClub) return 'At club';
    if (filters.distanceKm === null) return 'Distance';
    return `${filters.distanceKm} km`;
  };
  
  const getSortLabel = () => {
    if (filters.sort === null) return 'Sort';
    return filters.sort === 'soonest' ? 'Soonest' : filters.sort === 'distance' ? 'Nearest' : 'Most Slots';
  };
  
  return (
    <div 
      className="filtersRowHub"
      role="group" 
      aria-label="Game filters"
    >
      <button 
        className={cn("filterChipHub", filters.when !== null && "filterChipHub--active")}
        onClick={() => openWhenSheet(filters)}
      >
        {filters.when === null && <Calendar size={14} />}
        <span>{getWhenLabel()}</span>
      </button>
      
      <button 
        className={cn(
          "filterChipHub", 
          filters.distanceKm !== null && !isDistanceDisabled && "filterChipHub--active",
          isDistanceDisabled && "filterChipHub--disabled"
        )}
        onClick={() => !isDistanceDisabled && openDistanceSheet(filters)}
        disabled={isDistanceDisabled}
      >
        {!isDistanceDisabled && filters.distanceKm === null && <MapPin size={14} />}
        <span>{getDistanceLabel()}</span>
      </button>
      
      <button 
        className={cn("filterChipHub", filters.sort !== null && "filterChipHub--active")}
        onClick={() => openSortSheet(filters)}
      >
        {filters.sort === null && <ArrowUpDown size={14} />}
        <span>{getSortLabel()}</span>
      </button>
    </div>
  );
}

// V2.3: Status strip with results count + clear when action
// V2.4: Added count pill pulse animation
function StatusStrip({ 
  selectedClub, 
  distanceKm, 
  resultsCount,
  hasWhen,
  onOpenWhen,
  onClearWhen,
}: { 
  selectedClub: GolfCourse | null; 
  distanceKm: number | null;
  resultsCount: number;
  hasWhen: boolean;
  onOpenWhen: () => void;
  onClearWhen: () => void;
}) {
  const [pulse, setPulse] = useState(false);
  const prevCountRef = useRef(resultsCount);
  
  // V2.4: Pulse animation when results count changes
  useEffect(() => {
    if (prevCountRef.current !== resultsCount) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 180);
      prevCountRef.current = resultsCount;
      return () => clearTimeout(t);
    }
  }, [resultsCount]);

  const scopeText = selectedClub 
    ? `At ${selectedClub.name}`
    : distanceKm 
    ? `Within ${distanceKm}km`
    : 'Near you';
  
  const subText = selectedClub?.region || selectedClub?.country;
  const countLabel = resultsCount === 0 ? '0 games' : resultsCount === 1 ? '1 game' : `${resultsCount} games`;

  return (
    <div className="statusStrip">
      <div className="statusStrip__left">
        <div className="statusStrip__scope">
          <span className="statusStrip__main">{scopeText}</span>
          {subText && <span className="statusStrip__sub">{subText}</span>}
        </div>
        <span className={cn("statusStrip__countPill", pulse && "statusStrip__countPill--pulse")}>{countLabel}</span>
      </div>
      <div className="statusStrip__right">
        {hasWhen && (
          <button className="statusStrip__clearWhen" onClick={onClearWhen}>
            Clear When
          </button>
        )}
        <button className="statusStrip__filterBtn" onClick={onOpenWhen}>
          <Calendar size={14} />
          When
        </button>
      </div>
    </div>
  );
}

// V2.4: Starting Soon horizontal carousel strip
function StartingSoonStrip({ 
  games, 
  onFocusGame 
}: { 
  games: Game[]; 
  onFocusGame: (gameId: string) => void;
}) {
  if (games.length === 0) return null;
  
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className="startingSoonStrip">
      <div className="startingSoonStrip__header">
        <Clock size={14} />
        <span>Starting soon</span>
      </div>
      <div className="startingSoonStrip__carousel">
        {games.map((game) => {
          const startDate = new Date(game.start_time);
          const timeLabel = formatDistanceToNowStrict(startDate, { addSuffix: false });
          const spotsLeft = game.slots_open;
          
          return (
            <button
              key={game.id}
              className="startingSoonCard"
              onClick={() => {
                haptic('light');
                onFocusGame(game.id);
              }}
            >
              <span className="startingSoonCard__course">
                {game.course_name || 'Golf game'}
              </span>
              <div className="startingSoonCard__meta">
                <span className="startingSoonCard__time">in {timeLabel}</span>
                {spotsLeft > 0 && (
                  <span className="startingSoonCard__spots">
                    {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// V2.3: Smart empty state that adapts to filters
function DiscoverEmptyState({
  selectedClub,
  distanceKm,
  hasTimeFilter,
  hasQuickTime,
  onCreate,
  onClearWhen,
}: {
  selectedClub: GolfCourse | null;
  distanceKm: number | null;
  hasTimeFilter: boolean;
  hasQuickTime: boolean;
  onCreate: () => void;
  onClearWhen: () => void;
}) {
  // Title based on scope
  const title = selectedClub 
    ? `No games at ${selectedClub.name}`
    : distanceKm 
    ? `No games within ${distanceKm}km`
    : 'No games nearby';
  
  // Subtitle based on time filter status
  const subtitle = hasQuickTime
    ? 'Try removing the time filter or create one.'
    : hasTimeFilter
    ? 'Try a different time window or clear the filter.'
    : 'Be the first to start one nearby.';
  
  const showClearWhen = hasTimeFilter || hasQuickTime;

  return (
    <div className="discoverEmpty">
      <div className="discoverEmpty__icon">
        <MapPin size={32} strokeWidth={1.5} />
      </div>
      <h2 className="discoverEmpty__title">{title}</h2>
      <p className="discoverEmpty__subtitle">{subtitle}</p>
      <div className="discoverEmpty__actions">
        <button 
          onClick={() => { haptic('light'); onCreate(); }}
          className="discoverEmpty__primary"
        >
          Create a game
        </button>
        {showClearWhen && (
          <button 
            onClick={() => { haptic('light'); onClearWhen(); }}
            className="discoverEmpty__secondary"
          >
            Clear When
          </button>
        )}
      </div>
    </div>
  );
}

// V2.2: Suggested time quick chips (removed "Next 7 days" as it requires range support)
type QuickTimeOption = 'today' | 'tomorrow' | 'weekend';

function SuggestedTimesChips({ 
  activeOption, 
  onSelect 
}: { 
  activeOption: QuickTimeOption | null;
  onSelect: (option: QuickTimeOption | null) => void;
}) {
  const options: { key: QuickTimeOption; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'tomorrow', label: 'Tomorrow' },
    { key: 'weekend', label: 'This weekend' },
  ];

  const handleClick = (key: QuickTimeOption) => {
    haptic('light');
    onSelect(activeOption === key ? null : key);
  };

  return (
    <div className="suggestedTimesChips">
      {options.map(({ key, label }) => (
        <button
          key={key}
          className={cn("timeChip", activeOption === key && "timeChip--active")}
          onClick={() => handleClick(key)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// PopularClubsChips removed - requires course_id support for proper filtering

function GameCard({ game, index }: { game: Game; index: number }) {
  const { requestJoin, isPending, state } = useJoinGame(game.id);

  const gameData: GameData = {
    id: game.id,
    course_name: game.course_name || null,
    start_time: game.start_time,
    expires_at: game.start_time,
    slots_total: game.slots_total,
    slots_open: game.slots_open,
    host_user_id: game.host_user_id,
  };

  return (
    <GameRow
      mode="search"
      game={gameData}
      isHost={false}
      isJoined={false}
      anonymous
      canExpand={false}
      onRequestToJoin={requestJoin}
      index={index}
      isRequesting={isPending}
      requestState={state}
    />
  );
}

function GamesListSkeleton() {
  return (
    <div className="list">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="gameRowSkeleton">
          <div className="skeletonLine skeletonLine--wide" />
          <div className="skeletonLine skeletonLine--narrow" />
        </div>
      ))}
    </div>
  );
}

function GamesList({ games }: { games: Game[] }) {
  return (
    <div className="list">
      {games.map((g, index) => <GameCard key={g.id} game={g} index={index} />)}
    </div>
  );
}

// V2.3: Results count header
function ResultsHeader({ count }: { count: number }) {
  if (count === 0) return null;
  return (
    <div className="resultsHeader">
      <span>Showing {count} {count === 1 ? 'game' : 'games'}</span>
    </div>
  );
}

export function SearchGamesSurface({ bottomPadding = 0, onOpenCreate, onMeta, prefillCourse }: SearchGamesSurfaceProps) {
  // V3: Initialize selectedClub from prefillCourse if provided
  const [selectedClub, setSelectedClub] = useState<GolfCourse | null>(() => {
    if (prefillCourse) {
      return {
        id: prefillCourse.id,
        name: prefillCourse.name,
        region: prefillCourse.region || null,
        country: prefillCourse.country || null,
      } as GolfCourse;
    }
    return null;
  });
  const [searchMode, setSearchMode] = useState<'clubs' | 'people'>('clubs');
  const [quickTime, setQuickTime] = useState<QuickTimeOption | null>(null);
  const [focusGameId, setFocusGameId] = useState<string | undefined>();
  const resultsRef = useRef<HTMLDivElement>(null);
  const filters = useGameFilters();
  const { data: games, isLoading } = useGamesQuery(selectedClub?.id);

  // V2.4: Compute "starting soon" games (within next 6 hours)
  const startingSoonGames = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() + STARTING_SOON_HOURS * 60 * 60 * 1000);
    
    return (games || [])
      .filter(g => {
        const t = new Date(g.start_time);
        return t > now && t <= cutoff;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 8);
  }, [games]);

  // Handle quick time selection - maps to existing when filter
  const handleQuickTimeSelect = (option: QuickTimeOption | null) => {
    setQuickTime(option);
    if (!option) {
      filters.setWhen(null);
      return;
    }
    const today = new Date();
    switch (option) {
      case 'today':
        filters.setWhen({ date: today, window: 'any', exactTime: null });
        break;
      case 'tomorrow':
        filters.setWhen({ date: addDays(today, 1), window: 'any', exactTime: null });
        break;
      case 'weekend':
        // Set to next Saturday
        const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
        filters.setWhen({ date: addDays(today, daysUntilSat), window: 'any', exactTime: null });
        break;
    }
  };

  // Clear quickTime if user manually sets a different filter via When sheet
  // Hardened: handles Date as object or string, plus quickTime in deps
  React.useEffect(() => {
    if (!filters.when) {
      setQuickTime(null);
      return;
    }
    
    // Type-safe date parsing (handles Date object or string)
    const raw = filters.when?.date;
    const filterDate = raw ? new Date(raw as any) : null;
    if (!filterDate || Number.isNaN(filterDate.getTime())) {
      setQuickTime(null);
      return;
    }
    
    // Check if current filter matches any quick option
    const today = new Date();
    const tomorrow = addDays(today, 1);
    const daysUntilSat = (6 - today.getDay() + 7) % 7 || 7;
    const weekend = addDays(today, daysUntilSat);
    
    const isToday = filterDate.toDateString() === today.toDateString();
    const isTomorrow = filterDate.toDateString() === tomorrow.toDateString();
    const isWeekend = filterDate.toDateString() === weekend.toDateString();
    
    if (isToday && quickTime !== 'today') setQuickTime('today');
    else if (isTomorrow && quickTime !== 'tomorrow') setQuickTime('tomorrow');
    else if (isWeekend && quickTime !== 'weekend') setQuickTime('weekend');
    else if (!isToday && !isTomorrow && !isWeekend) setQuickTime(null);
  }, [filters.when, quickTime]);

  const resultsCount = games?.length ?? 0;
  const hasWhen = !!filters.when;

  // V2.4: Report meta to parent for hub header hint
  useEffect(() => {
    onMeta?.({ resultsCount, startingSoonCount: startingSoonGames.length });
  }, [resultsCount, startingSoonGames.length, onMeta]);

  const handleClearWhen = () => {
    haptic('light');
    setQuickTime(null);
    filters.setWhen(null);
  };

  // V2.4: Focus to game row in list
  const handleFocusGame = (gameId: string) => {
    setFocusGameId(gameId);
    // Scroll to row and highlight
    setTimeout(() => {
      const el = resultsRef.current?.querySelector<HTMLElement>(`[data-game-id="${gameId}"]`);
      if (el) {
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ block: 'center', behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        el.classList.add('sheet-focus-highlight');
        setTimeout(() => {
          el.classList.remove('sheet-focus-highlight');
          setFocusGameId(undefined);
        }, 1400);
      } else {
        setFocusGameId(undefined);
      }
    }, 100);
  };

  return (
    <div className="searchGamesSurface" style={{ paddingBottom: `${bottomPadding}px` }}>
      {/* Create Game Hero Card */}
      {onOpenCreate && <CreateGameHero onOpen={onOpenCreate} />}
      
      {/* V2.3: Status strip with results count */}
      <StatusStrip 
        selectedClub={selectedClub} 
        distanceKm={filters.distanceKm}
        resultsCount={resultsCount}
        hasWhen={hasWhen}
        onOpenWhen={() => openWhenSheet(filters)}
        onClearWhen={handleClearWhen}
      />
      
      {/* V2.2: Suggested times chips */}
      <SuggestedTimesChips 
        activeOption={quickTime} 
        onSelect={handleQuickTimeSelect} 
      />
      
      {/* V2.4: Starting soon strip */}
      <StartingSoonStrip 
        games={startingSoonGames} 
        onFocusGame={handleFocusGame} 
      />
      
      <FindAGame 
        selectedClub={selectedClub} 
        onSelectClub={setSelectedClub}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
      />
      
      <FiltersRow selectedClub={selectedClub} filters={filters} />
      
      {/* V2.3: Results section with smart empty state */}
      {isLoading ? (
        <GamesListSkeleton />
      ) : resultsCount === 0 && onOpenCreate ? (
        <DiscoverEmptyState
          selectedClub={selectedClub}
          distanceKm={filters.distanceKm}
          hasTimeFilter={hasWhen}
          hasQuickTime={!!quickTime}
          onCreate={onOpenCreate}
          onClearWhen={handleClearWhen}
        />
      ) : (
        <div ref={resultsRef}>
          <ResultsHeader count={resultsCount} />
          <GamesList games={games || []} />
        </div>
      )}
    </div>
  );
}
