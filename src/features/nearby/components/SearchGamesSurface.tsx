/**
 * SearchGamesSurface - Reusable Games Search/Browse surface
 * Contains all search logic, filters, and results list
 * Can be rendered in a sheet or standalone page
 */

import React, { useState, useRef, useCallback } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { Search, MapPin, Calendar, ArrowUpDown, Plus, Users } from 'lucide-react';
import { useCourseSearch, GolfCourse } from '@/features/nearby/hooks/useCourseSearch';
import { useGameFilters } from '../hooks/useGameFilters';
import { useGamesQuery } from '../hooks/useGamesQuery';
import { useJoinGame } from '../hooks/useJoinGame';
import { openWhenSheet, openDistanceSheet, openSortSheet, labelWhen } from './FilterSheets';
import { GameRow, type GameData } from '@/features/games/components/GameRow';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import '@/features/games/components/GameRow.css';
import '@/features/nearby/components/your-games/YourGames.css';
import '../GamesTab.css';
import '../SearchGames.css';

type Game = {
  id: string;
  course_name?: string;
  start_time: string;
  slots_total: number;
  slots_open: number;
  host_user_id: string;
};

interface SearchGamesSurfaceProps {
  /** Extra padding at bottom for sticky footer */
  bottomPadding?: number;
  /** Callback to open Create Game sheet */
  onOpenCreate?: () => void;
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

function FiltersRow({ selectedClub }: { selectedClub: GolfCourse | null }) {
  const filters = useGameFilters();
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

function GamesList({ 
  games, 
  isLoading,
  onOpenCreate 
}: { 
  games: Game[]; 
  isLoading: boolean;
  onOpenCreate?: () => void;
}) {
  if (isLoading) {
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

  if (!games || games.length === 0) {
    return (
      <div className="gamesEmptyHub">
        <div className="gamesEmpty__icon">
          <MapPin size={28} style={{ color: 'var(--hub-text-dim)', opacity: 0.6 }} strokeWidth={1.5} />
        </div>
        <h2 className="gamesEmpty__title">No games found</h2>
        <p className="gamesEmpty__body">Be the first to start one nearby.</p>
        {onOpenCreate && (
          <button 
            onClick={() => { haptic('light'); onOpenCreate(); }}
            className="gamesEmpty__cta"
          >
            Create a game
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="list">
      {games.map((g, index) => <GameCard key={g.id} game={g} index={index} />)}
    </div>
  );
}

export function SearchGamesSurface({ bottomPadding = 0, onOpenCreate }: SearchGamesSurfaceProps) {
  const [selectedClub, setSelectedClub] = useState<GolfCourse | null>(null);
  const [searchMode, setSearchMode] = useState<'clubs' | 'people'>('clubs');
  const { data: games, isLoading } = useGamesQuery(selectedClub?.id);

  return (
    <div className="searchGamesSurface" style={{ paddingBottom: `${bottomPadding}px` }}>
      {/* Create Game Hero Card */}
      {onOpenCreate && <CreateGameHero onOpen={onOpenCreate} />}
      
      <FindAGame 
        selectedClub={selectedClub} 
        onSelectClub={setSelectedClub}
        searchMode={searchMode}
        onSearchModeChange={setSearchMode}
      />
      
      <FiltersRow selectedClub={selectedClub} />
      
      <div className="scopedHeadingHub">
        <span>{selectedClub ? `Games at ${selectedClub.name}` : 'Games Near You'}</span>
        {selectedClub?.region && (
          <span className="scopedHeadingSub">{selectedClub.region}</span>
        )}
      </div>
      
      <GamesList 
        games={games || []} 
        isLoading={isLoading} 
        onOpenCreate={onOpenCreate}
      />
    </div>
  );
}
