import { useState } from 'react';
import { TapButton } from '@/components/ui/TapButton';
import { haptic } from '@/utils/haptics';
import { useCourseSearch, GolfCourse } from '@/features/nearby/hooks/useCourseSearch';
import { useGameFilters } from './hooks/useGameFilters';
import { useGamesQuery } from './hooks/useGamesQuery';
import { useJoinGame } from './hooks/useJoinGame';
import { formatDistanceToNowStrict } from 'date-fns';
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
  onSelectClub 
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

  const handleClear = () => {
    haptic('light');
    onSelectClub(null);
  };

  return (
    <div className="findBlock">
      {selectedClub ? (
        <div className="selectedClub">
          <span>Viewing games at</span>
          <div className="clubPill">
            <span className="clubName">{selectedClub.name}</span>
            <TapButton className="x" aria-label="Clear" onClick={handleClear}>✕</TapButton>
          </div>
        </div>
      ) : (
        <>
          <label className="findLabel">Find a Game</label>
          <div className="searchBox">
            <span className="glass">🔎</span>
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
                    <span className="pin">📍</span>
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
      )}
    </div>
  );
}

function FiltersRow() {
  const { distanceKm, setDistanceKm, sort, setSort } = useGameFilters();
  
  const sortLabel = sort === 'soonest' ? 'Soonest' : sort === 'distance' ? 'Nearest' : 'Seats';
  
  return (
    <div className="chips">
      <TapButton className="chip" onClick={() => { haptic('light'); }}>
        <span className="chipLabel">Distance</span>
        <span className="chipValue">{distanceKm} km</span>
      </TapButton>
      <TapButton className="chip" onClick={() => { haptic('light'); }}>
        <span className="chipLabel">Sort</span>
        <span className="chipValue">{sortLabel}</span>
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
    <div className="gameCard" role="article" aria-label={`${game.course_name || 'Golf game'}, ${formatDate(game.start_time)}, ${filledLabel}`}>
      <div className="gcTop">
        <div className="gcTitle">{game.course_name || 'Golf Game'}</div>
      </div>

      <div className="gcMeta">
        <span className="m">🗓 {formatDate(game.start_time)} • {formatTime(game.start_time)}</span>
        <span className={`badge ${seatsLeft > 0 ? 'ok' : 'full'}`}>{filledLabel}</span>
      </div>

      <div className="gcActions">
        <TapButton
          className="primary"
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
          <div key={i} className="gameCard skeleton">
            <div className="skeletonLine" style={{ width: '60%' }} />
            <div className="skeletonLine" style={{ width: '40%' }} />
          </div>
        ))}
      </div>
    );
  }

  if (!games || games.length === 0) {
    return (
      <div className="empty">
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
  const { data: games, isLoading } = useGamesQuery(selectedClub?.id);

  return (
    <div className="gamesTab">
      <CreateGameCTA onOpen={onOpenCreate} />
      <FindAGame selectedClub={selectedClub} onSelectClub={setSelectedClub} />
      <FiltersRow />
      <div className="scopedHeading">
        {selectedClub ? `Games at ${selectedClub.name}` : 'Games Near You'}
      </div>
      <GamesList games={games || []} isLoading={isLoading} />
    </div>
  );
}
