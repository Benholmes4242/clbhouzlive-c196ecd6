/**
 * ScheduleTab - Apple-grade Schedule Experience
 * 
 * Features:
 * - Cinematic featured event hero
 * - Premium tournament cards with course images
 * - Dark theme consistent with Overview
 * - Smooth animations and transitions
 */

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
import { TourHubEmptyState } from '../TourHubEmptyState';
import { format, isAfter } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// Import premium schedule components
import { FeaturedEventHero, PremiumTournamentCard, ScheduleMonthSection } from '../schedule-premium';
import { getFeaturedTournament } from '../schedule';

type ScheduleFilterType = 'all' | 'live' | 'upcoming' | 'completed';

interface MonthGroup {
  monthKey: string;
  monthLabel: string;
  tournaments: TourTournament[];
}

// Filter pill component
function FilterPill({ 
  label, 
  count, 
  active, 
  onClick 
}: { 
  label: string; 
  count: number; 
  active: boolean; 
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
        active 
          ? "bg-white text-black" 
          : "bg-white/10 text-white/70 hover:bg-white/15 hover:text-white/90"
      )}
    >
      {label}
      {count > 0 && (
        <span className={cn(
          "ml-1.5 text-xs",
          active ? "text-black/60" : "text-white/50"
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

export function ScheduleTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ScheduleFilterType>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);

  // Get featured tournament for hero
  const featured = useMemo(() => {
    if (!tournaments) return null;
    return getFeaturedTournament(tournaments);
  }, [tournaments]);

  // Filter stats
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

  // Filter tournaments
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
        t.venue_city?.toLowerCase().includes(searchLower)
      );
    }

    // Exclude featured from list when on 'all' filter and no search
    if (filter === 'all' && !search && featured) {
      filtered = filtered.filter(t => t.id !== featured.tournament.id);
    }
    
    return filtered;
  }, [tournaments, filter, search, featured]);

  // Group by month
  const monthGroups = useMemo((): MonthGroup[] => {
    if (!filteredResults.length) return [];

    const groups = new Map<string, TourTournament[]>();
    
    filteredResults.forEach(tournament => {
      const date = new Date(tournament.start_date);
      const monthKey = format(date, 'yyyy-MM');
      const existing = groups.get(monthKey) || [];
      groups.set(monthKey, [...existing, tournament]);
    });

    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, tournaments]) => ({
        monthKey,
        monthLabel: format(new Date(tournaments[0].start_date), 'MMMM yyyy').toUpperCase(),
        tournaments,
      }));
  }, [filteredResults]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[hsl(var(--th-bg-canvas))] -mx-4 px-4 py-6">
        {/* Hero skeleton */}
        <div 
          className="-mx-4 mb-6 animate-pulse bg-slate-800/50"
          style={{ height: '50vh', maxHeight: '450px' }}
        />
        
        {/* Search skeleton */}
        <div className="h-11 bg-slate-800/50 rounded-xl w-full max-w-md mb-4 animate-pulse" />
        
        {/* Filter pills skeleton */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-10 w-24 bg-slate-800/50 rounded-full animate-pulse" />
          ))}
        </div>
        
        {/* Cards skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div 
              key={i} 
              className="h-[220px] bg-slate-800/50 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Empty state
  if (!tournaments || tournaments.length === 0) {
    return <TourHubEmptyState variant="schedule" />;
  }
  
  return (
    <div className="min-h-screen bg-[hsl(var(--th-bg-canvas))] -mx-4 pb-24">
      
      {/* Featured Event Hero */}
      {filter === 'all' && !search && featured && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          <FeaturedEventHero 
            tournament={featured.tournament} 
            type={featured.type}
          />
        </motion.div>
      )}

      {/* Controls Section */}
      <div className="px-4 pt-6">
        {/* Search Bar */}
        <div className="relative max-w-md mb-4">
          <Search 
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
              isSearchFocused ? "text-white" : "text-white/40"
            )} 
          />
          <input
            type="text"
            placeholder="Search tournaments, venues..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className={cn(
              "w-full h-11 pl-11 pr-10 rounded-xl text-sm transition-all duration-200",
              "bg-white/8 border border-white/10 text-white placeholder:text-white/40",
              "focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20"
            )}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4 text-white/60" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
          <FilterPill
            label="All"
            count={filterStats.all}
            active={filter === 'all'}
            onClick={() => setFilter('all')}
          />
          {filterStats.live > 0 && (
            <FilterPill
              label="Live"
              count={filterStats.live}
              active={filter === 'live'}
              onClick={() => setFilter('live')}
            />
          )}
          <FilterPill
            label="Upcoming"
            count={filterStats.upcoming}
            active={filter === 'upcoming'}
            onClick={() => setFilter('upcoming')}
          />
          <FilterPill
            label="Completed"
            count={filterStats.completed}
            active={filter === 'completed'}
            onClick={() => setFilter('completed')}
          />
        </div>
      </div>

      {/* No Live Message */}
      {filter === 'live' && filterStats.live === 0 && (
        <motion.div 
          className="px-4 py-12 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <p className="text-white/60 text-sm">No live tournaments right now</p>
          <p className="text-white/40 text-xs mt-1">Check back during event days</p>
        </motion.div>
      )}
      
      {/* Tournament Cards - Grouped by Month */}
      <AnimatePresence mode="wait">
        {monthGroups.length > 0 ? (
          <motion.div 
            className="px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {monthGroups.map((group, groupIndex) => (
              <motion.div 
                key={group.monthKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIndex * 0.05, duration: 0.3 }}
              >
                {/* Month Header */}
                <ScheduleMonthSection 
                  monthLabel={group.monthLabel}
                  eventCount={group.tournaments.length}
                />

                {/* Tournament Cards */}
                <div className="space-y-4 py-4 -mx-4">
                  {group.tournaments.map((tournament, i) => (
                    <PremiumTournamentCard
                      key={tournament.id}
                      tournament={tournament}
                      index={i}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            className="px-4 py-12 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <p className="text-white/60 text-sm">No tournaments found</p>
            <p className="text-white/40 text-xs mt-1">Try adjusting your search</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
