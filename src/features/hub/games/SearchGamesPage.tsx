/**
 * Search Games Page
 * Comprehensive games discovery with clubs/people search
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GamesFilters } from './components/GamesFilters';
import { GamesList } from './components/GamesList';
import { PeopleResults } from './components/PeopleResults';
import { GolfCourse, useCourseSearch } from '@/features/nearby/hooks/useCourseSearch';
import { useGameFilters } from '@/features/nearby/hooks/useGameFilters';
import { useGamesQuery } from '@/features/nearby/hooks/useGamesQuery';
import { useHub } from '@/features/hub/useHub';
import { haptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import '../home/hubTheme.css';
import './gamesTheme.css';

type ViewMode = 'clubs' | 'people';

export function SearchGamesPage() {
  const nav = useNavigate();
  const loc = useLocation();
  const { navigateFromHub } = useHub();
  
  const [viewMode, setViewMode] = useState<ViewMode>('clubs');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClub, setSelectedClub] = useState<GolfCourse | null>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [peopleResults, setPeopleResults] = useState<any[]>([]);
  
  const filters = useGameFilters();
  const { data: games = [], isLoading } = useGamesQuery(selectedClub?.id);

  // Keyboard detection for mobile
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

  const goBack = () => {
    const state = loc.state as any;
    if (state?.backgroundLocation) {
      nav(-1);
    } else {
      nav('/hub', { replace: true });
    }
  };

  const handleCreateGame = () => {
    haptic('light');
    navigateFromHub('/hub/create-game');
  };

  const handleSelectClub = (club: GolfCourse) => {
    haptic('light');
    setSelectedClub(club);
    setSearchQuery('');
  };

  const handleClearClub = () => {
    haptic('light');
    setSelectedClub(null);
  };

  const handleIncreaseDistance = () => {
    haptic('light');
    const current = filters.distanceKm || 10;
    filters.setDistanceKm(current + 10);
  };

  const handleOpenPersonGames = (person: any) => {
    haptic('light');
    // Navigate to person's games view
    // TODO: Implement person games view
  };

  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_0%_0%,rgba(255,255,255,0.05),rgba(0,0,0,0.95))]">
      <div
        className={cn(
          'h-full w-full pt-[calc(1.5rem+env(safe-area-inset-top,0px))] pb-[env(safe-area-inset-bottom,0px)] px-4 transition-[padding-bottom] duration-150',
          isKeyboardOpen && 'pb-[5rem]'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
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
              onClick={handleCreateGame}
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
                const isActive = viewMode === mode;
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      haptic('light');
                      setViewMode(mode as ViewMode);
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

          {/* Search Bar */}
          <div className="mb-3">
            <div className="flex items-center rounded-[14px] bg-[color:var(--hub-glass-bg-subtle)] border border-[color:var(--hub-stroke-subtle)] px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.5)]">
              <span className="mr-2 text-[15px] text-[color:var(--hub-text-muted)]">🔍</span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={viewMode === 'clubs' ? 'Search golf club…' : 'Search players…'}
                className="flex-1 bg-transparent text-[13px] text-[color:var(--hub-text-bright)] placeholder:text-[color:var(--hub-text-soft)] outline-none"
                data-keyboard-aware
              />
            </div>
          </div>

          {viewMode === 'clubs' && (
            <>
              {/* Filters */}
              <GamesFilters
                filters={filters}
                selectedClub={selectedClub}
                onClearClub={handleClearClub}
              />

              {/* Games List */}
              <div className="flex-1 overflow-y-auto">
                <GamesList
                  games={games}
                  isLoading={isLoading}
                  selectedClub={selectedClub}
                  onCreateGame={handleCreateGame}
                  onClearClub={handleClearClub}
                  onIncreaseDistance={handleIncreaseDistance}
                />
              </div>
            </>
          )}

          {viewMode === 'people' && (
            <div className="flex-1 overflow-y-auto">
              <PeopleResults
                searchQuery={searchQuery}
                people={peopleResults}
                onTapPerson={handleOpenPersonGames}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
