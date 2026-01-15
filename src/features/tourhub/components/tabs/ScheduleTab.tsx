/**
 * ScheduleTab - World-Class Editorial Schedule Experience
 * 
 * Features:
 * - Premium immersive hero card
 * - Polished search bar with focus states
 * - Clean filter pills with clear active states
 * - Monthly sections with refined typography
 * - Smooth animations and transitions
 */

import { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import { useTourSeason, useTourTournaments, type TourTournament } from '../../hooks/useTourHubData';
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

export function ScheduleTab() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ScheduleFilterType>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const { data: season } = useTourSeason();
  const { data: tournaments, isLoading } = useTourTournaments(season?.id);

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

  // Get next upcoming tournament name for empty state
  const nextUpcomingName = useMemo(() => {
    if (!tournaments) return undefined;
    const upcoming = tournaments
      .filter(t => t.status === 'scheduled' || t.status === 'created')
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    return upcoming[0]?.name;
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
        t.venue_city?.toLowerCase().includes(searchLower)
      );
    }

    // Exclude featured tournament from the list when on 'all' filter and no search
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

  // Loading state with shimmer
  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Hero skeleton */}
        <div 
          className="mx-4 animate-pulse"
          style={{ 
            height: '230px', 
            borderRadius: '20px',
            background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
        
        {/* Search skeleton */}
        <div className="h-12 bg-slate-100 rounded-xl w-full max-w-md animate-pulse" />
        
        {/* Filters skeleton */}
        <div className="flex gap-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-11 w-24 bg-slate-100 rounded-lg animate-pulse" />
          ))}
        </div>
        
        {/* Cards skeleton */}
        <div className="space-y-4 mt-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div 
              key={i} 
              className="mx-4 animate-pulse"
              style={{ 
                height: '200px', 
                borderRadius: '16px',
                background: '#e2e8f0',
              }}
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
    <div className="min-h-screen pb-24">
      
      {/* Hero Card - Featured Tournament (above search) */}
      {filter === 'all' && !search && featured && (
        <motion.div 
          className="-mx-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <ScheduleHeroCard 
            tournament={featured.tournament} 
            type={featured.type}
          />
        </motion.div>
      )}

      {/* Premium Search Bar */}
      <div className="relative max-w-md mb-4">
        <Search 
          className={cn(
            "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors",
            isSearchFocused ? "text-[#1e293b]" : "text-[#94a3b8]"
          )} 
        />
        <input
          type="text"
          placeholder="Search tournaments, venues, or cities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setIsSearchFocused(true)}
          onBlur={() => setIsSearchFocused(false)}
          className={cn(
            "w-full h-11 pl-11 pr-10 rounded-xl text-[14px] transition-all duration-200",
            "bg-white border text-[#1e293b] placeholder:text-[#94a3b8]",
            "focus:outline-none focus:ring-2",
            isSearchFocused 
              ? "border-[#e2e8f0] ring-[#e2e8f0] shadow-sm" 
              : "border-[#e2e8f0] ring-transparent"
          )}
          style={{
            boxShadow: isSearchFocused 
              ? '0 4px 12px rgba(0,0,0,0.05)' 
              : '0 2px 4px rgba(0,0,0,0.02)',
          }}
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-[#f1f5f9] transition-colors"
          >
            <X className="w-4 h-4 text-[#94a3b8]" />
          </button>
        )}
      </div>

      {/* Filter Tabs - Premium pill style */}
      <ScheduleFilterPills
        activeFilter={filter}
        onFilterChange={setFilter}
        counts={filterStats}
      />

      {/* No Live Message */}
      {filter === 'live' && filterStats.live === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <ScheduleEmptyMessage 
            variant="no-live" 
            nextTournamentName={nextUpcomingName}
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
                      <ScheduleTournamentCard tournament={tournament} />
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
        <div className="pt-8 border-t border-slate-200 mt-8">
          <ScheduleEmptyMessage variant="season-complete" />
        </div>
      )}
    </div>
  );
}
