/**
 * ScheduleTab - Cinematic Schedule Experience (Apple-grade)
 * 
 * Features:
 * - Full-bleed immersive hero card with leader/winner data
 * - Premium glassmorphic search bar with debounce
 * - Animated segmented control filters (URL-persisted)
 * - Monthly groupings with elegant dividers
 * - Completed filter: most recent first
 * - Scroll-to-current-month on load
 * - Semantic token compliance
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { useTournamentLeadersWinners } from '../../hooks/useTournamentLeadersWinners';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Import schedule components
import {
  ScheduleFilterPills,
  type ScheduleFilterType,
  ScheduleTournamentCard,
  ScheduleMonthHeader,
  ScheduleEmptyMessage,
  ScheduleHeroCard,
  getFeaturedTournament,
} from '../schedule';

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: TourTournament[];
}

// Debounce hook
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function ScheduleTab() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [hasScrolledToNow, setHasScrolledToNow] = useState(false);
  
  // Filter from URL params
  const filter = (searchParams.get('filter') as ScheduleFilterType) || 'all';
  const setFilter = useCallback((f: ScheduleFilterType) => {
    const params = new URLSearchParams(searchParams);
    if (f === 'all') {
      params.delete('filter');
    } else {
      params.set('filter', f);
    }
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  // Debounce search
  const search = useDebouncedValue(searchInput, 200);
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);

  // Collect live + completed tournament IDs for leader/winner fetch
  const { liveIds, completedIds } = useMemo(() => {
    if (!tournaments) return { liveIds: [] as string[], completedIds: [] as string[] };
    return {
      liveIds: tournaments.filter(t => t.status === 'inprogress').map(t => t.id),
      completedIds: tournaments.filter(t => t.status === 'closed').map(t => t.id),
    };
  }, [tournaments]);

  const { data: leadersWinnersMap } = useTournamentLeadersWinners([...liveIds, ...completedIds]);

  // Get featured tournament for hero card
  const featured = useMemo(() => {
    if (!tournaments) return null;
    return getFeaturedTournament(tournaments);
  }, [tournaments]);

  // Filter stats for pills
  const filterStats = useMemo(() => {
    if (!tournaments) return { all: 0, live: 0, upcoming: 0, completed: 0 };
    
    const now = new Date();
    return {
      all: tournaments.length,
      live: tournaments.filter(t => t.status === 'inprogress').length,
      upcoming: tournaments.filter(t => 
        t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)
      ).length,
      completed: tournaments.filter(t => t.status === 'closed').length,
    };
  }, [tournaments]);

  // Get next upcoming tournament for empty state
  const nextUpcoming = useMemo(() => {
    if (!tournaments) return undefined;
    const upcoming = tournaments
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return upcoming[0];
  }, [tournaments]);

  // Filter tournaments (exclude featured from list if showing hero)
  const filteredResults = useMemo(() => {
    if (!tournaments) return [];
    
    let filtered = [...tournaments];
    
    const now = new Date();
    switch (filter) {
      case 'upcoming':
        filtered = filtered.filter(t => 
          t.status === 'scheduled' || t.status === 'created' || isAfter(new Date(t.start_date), now)
        );
        break;
      case 'completed':
        filtered = filtered.filter(t => t.status === 'closed');
        break;
      case 'live':
        filtered = filtered.filter(t => t.status === 'inprogress');
        break;
    }
    
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(searchLower) ||
        t.venue_name?.toLowerCase().includes(searchLower) ||
        t.venue_city?.toLowerCase().includes(searchLower) ||
        t.venue_country?.toLowerCase().includes(searchLower)
      );
    }

    // Exclude featured tournament from the list when on 'all' filter and no search
    if (filter === 'all' && !search && featured) {
      filtered = filtered.filter(t => t.id !== featured.tournament.id);
    }
    
    return filtered;
  }, [tournaments, filter, search, featured]);

  // Group by month with sort order based on filter
  const monthGroups = useMemo((): MonthGroup[] => {
    if (!filteredResults.length) return [];

    const groups = new Map<string, TourTournament[]>();
    
    filteredResults.forEach(tournament => {
      const date = new Date(tournament.start_date);
      const monthKey = format(date, 'yyyy-MM');
      const existing = groups.get(monthKey) || [];
      groups.set(monthKey, [...existing, tournament]);
    });

    const entries = Array.from(groups.entries());
    
    // Completed: most recent first (reverse chronological)
    if (filter === 'completed') {
      entries.sort(([a], [b]) => b.localeCompare(a));
      // Also reverse tournaments within each month
      entries.forEach(([, tournaments]) => {
        tournaments.sort((a, b) => 
          new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
        );
      });
    } else {
      entries.sort(([a], [b]) => a.localeCompare(b));
    }

    return entries.map(([monthKey, tournaments]) => ({
      monthKey,
      monthLabel: format(new Date(tournaments[0].start_date), 'MMMM yyyy').toUpperCase(),
      tournaments,
    }));
  }, [filteredResults, filter]);

  // Scroll to current month on load (only for 'all' or 'upcoming' with no search)
  useEffect(() => {
    if (hasScrolledToNow || isLoading || !monthGroups.length) return;
    if (filter !== 'all' && filter !== 'upcoming') return;
    if (search) return;

    const currentMonthKey = format(new Date(), 'yyyy-MM');
    const targetEl = document.getElementById(`month-${currentMonthKey}`);
    
    if (targetEl) {
      const timer = setTimeout(() => {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setHasScrolledToNow(true);
      }, 300);
      return () => clearTimeout(timer);
    }
    setHasScrolledToNow(true);
  }, [hasScrolledToNow, isLoading, monthGroups, filter, search]);

  // Loading state with cinematic shimmer
  if (isLoading) {
    return (
      <div className="space-y-6 -mx-4">
        {/* Hero skeleton */}
        <div 
          className="animate-pulse"
          style={{ 
            height: '280px', 
            background: 'linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        
        {/* Search skeleton */}
        <div className="px-4">
          <div className="h-12 bg-muted rounded-xl w-full max-w-md animate-pulse" />
        </div>
        
        {/* Filters skeleton */}
        <div className="px-4">
          <div className="h-12 bg-muted rounded-xl animate-pulse" />
        </div>
        
        {/* Cards skeleton */}
        <div className="space-y-4 mt-4 px-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div 
              key={i} 
              className="animate-pulse rounded-2xl bg-muted"
              style={{ height: '220px' }}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state - no tournaments at all
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div className="min-h-screen pb-24 -mx-4">
      
      {/* Hero Card - Featured Tournament (full bleed) */}
      {filter === 'all' && !search && featured && (
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <ScheduleHeroCard 
            tournament={featured.tournament} 
            type={featured.type}
            leaderWinner={leadersWinnersMap?.get(featured.tournament.id)}
          />
        </motion.div>
      )}

      {/* Content container with padding */}
      <div className="px-4">
        {/* Premium Glassmorphic Search Bar */}
        <motion.div 
          className="relative max-w-md mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <Search 
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-200",
              isSearchFocused ? "text-foreground" : "text-muted-foreground"
            )} 
          />
          <input
            type="text"
            placeholder="Search tournaments, venues..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "w-full h-12 pl-11 pr-10 rounded-xl text-[14px] transition-all duration-200",
              "bg-card/80 backdrop-blur-sm border text-foreground placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:bg-card",
              isSearchFocused 
                ? "border-border ring-border/50 shadow-lg" 
                : "border-border/60 ring-transparent shadow-sm"
            )}
          />
          <AnimatePresence>
            {searchInput && (
              <motion.button
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors active:scale-90"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Filter Tabs - Animated segmented control */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.3 }}
        >
          <ScheduleFilterPills
            activeFilter={filter}
            onFilterChange={setFilter}
            counts={filterStats}
          />
        </motion.div>
      </div>

      {/* No Live Message */}
      {filter === 'live' && filterStats.live === 0 && (
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ScheduleEmptyMessage 
            variant="no-live" 
            nextTournamentName={nextUpcoming?.name}
          />
        </motion.div>
      )}
      
      {/* Event Cards - Grouped by Month */}
      <AnimatePresence mode="wait">
        {monthGroups.length > 0 ? (
          <motion.div 
            className="space-y-6 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {monthGroups.map((group, groupIndex) => (
              <motion.div 
                key={group.monthKey}
                id={`month-${group.monthKey}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05, duration: 0.3 }}
              >
                {/* Month Header */}
                <ScheduleMonthHeader 
                  monthLabel={group.monthLabel}
                  eventCount={group.tournaments.length}
                />

                {/* Tournament Cards - Full width with spacing */}
                <div className="space-y-3 mt-3 -mx-4">
                  {group.tournaments.map((tournament, i) => (
                    <motion.div
                      key={tournament.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03, duration: 0.2 }}
                    >
                      <ScheduleTournamentCard 
                        tournament={tournament}
                        leaderWinner={leadersWinnersMap?.get(tournament.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <ScheduleEmptyMessage variant="no-results" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Season Complete Message */}
      {filterStats.upcoming === 0 && filterStats.live === 0 && filterStats.completed > 0 && filter === 'all' && !search && (
        <div className="pt-8 border-t border-border mt-8">
          <ScheduleEmptyMessage variant="season-complete" />
        </div>
      )}
    </div>
  );
}
