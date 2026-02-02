/**
 * LiveRightNow - Multi-Tour Live Snapshot
 * Image-backed cards with horizontal scroll
 * Shows "No competitions live" with Up Next preview when no live tournaments
 */

import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronRight } from 'lucide-react';
import { useLiveRightNow, type LiveTournamentWithLeader } from '../../hooks/useOverviewModules';
import { useUpcomingTournaments, TOUR_CONFIG } from '../../hooks/useOverviewData';
import { useVenueImage, getFallbackCourseImage } from '../../hooks/useVenueImage';
import { getTourLogo } from '../../utils/tourLogos';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';

function getStartLabel(date: string): string {
  const startDate = new Date(date);
  if (isToday(startDate)) return 'Today';
  if (isTomorrow(startDate)) return 'Tomorrow';
  const days = differenceInDays(startDate, new Date());
  if (days <= 7) return `In ${days} day${days > 1 ? 's' : ''}`;
  return format(startDate, 'MMM d');
}

/**
 * Individual Live Tournament Card with venue image fetching
 */
function LiveTournamentCard({ 
  tournament, 
  index 
}: { 
  tournament: LiveTournamentWithLeader; 
  index: number;
}) {
  const navigate = useNavigate();
  
  // Use the smart venue image hook for each card
  const { data: venueImage } = useVenueImage(tournament.venueName, tournament.venueCity);
  
  // Use real image or fallback
  const backgroundImage = venueImage?.imageUrl || getFallbackCourseImage(tournament.name);
  const hasRealImage = !!venueImage?.imageUrl;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex-shrink-0 w-[280px] rounded-2xl overflow-hidden relative border border-black/5 shadow-sm"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
    >
      {/* Course Image Background */}
      <div className="absolute inset-0">
        {hasRealImage ? (
          <img
            src={backgroundImage}
            alt={tournament.venueName || tournament.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900" />
        )}
        {/* Gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Content */}
      <div className="relative z-10 p-4 h-[140px] flex flex-col justify-between text-left">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <img
            src={getTourLogo(tournament.tourSlug)}
            alt=""
            className="h-5 w-auto drop-shadow-lg"
          />
          <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            LIVE
          </span>
        </div>

        {/* Tournament Name & Leader */}
        <div>
          <h3 className="text-white font-semibold text-[15px] leading-snug line-clamp-2 mb-1">
            {tournament.name}
          </h3>

          {tournament.leader && (
            <div className="flex items-center justify-between">
              <span className="text-white/80 text-sm truncate mr-2">
                {tournament.leader.name}
              </span>
              <span className="text-emerald-400 font-bold text-lg flex-shrink-0">
                {tournament.leader.scoreDisplay}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.button>
  );
}

/**
 * Up Next Preview Card - shown when no live tournaments
 */
function UpNextCard({ tournament }: { tournament: { id: string; name: string; startDate: string; venueCity: string | null; tourSlug: string } }) {
  const navigate = useNavigate();
  const tourConfig = TOUR_CONFIG[tournament.tourSlug as keyof typeof TOUR_CONFIG] || TOUR_CONFIG.pga;

  return (
    <motion.button
      onClick={() => navigate(`/tourhub/tournament/${tournament.id}`)}
      className="flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200 shadow-sm w-full text-left"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.2 }}
    >
      {/* Tour Logo */}
      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
        <img 
          src={getTourLogo(tournament.tourSlug as any)} 
          alt={tourConfig.name}
          className="h-6 w-auto"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
      </div>

      {/* Tournament Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-slate-900 truncate">
          {tournament.name}
        </h4>
        <div className="flex items-center gap-1.5 mt-0.5">
          <Calendar className="w-3 h-3 text-slate-400" />
          <span className="text-xs text-slate-500">
            {getStartLabel(tournament.startDate)}
            {tournament.venueCity && ` · ${tournament.venueCity}`}
          </span>
        </div>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
    </motion.button>
  );
}

/**
 * Empty State Component
 */
function NoLiveEventsState() {
  const { data: upcomingTournaments, isLoading } = useUpcomingTournaments(14);
  const nextTournament = upcomingTournaments?.[0];

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <span className="w-2 h-2 bg-slate-300 rounded-full" />
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Live Right Now
        </h2>
      </div>

      {/* Empty State Card */}
      <div className="px-4">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4">
          <p className="text-sm text-slate-500 mb-3">
            No competitions live right now
          </p>
          
          {/* Up Next */}
          {isLoading ? (
            <Skeleton className="h-16 w-full rounded-xl" />
          ) : nextTournament ? (
            <div>
              <p className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2">
                Up Next
              </p>
              <UpNextCard 
                tournament={{
                  id: nextTournament.id,
                  name: nextTournament.name,
                  startDate: nextTournament.startDate,
                  venueCity: nextTournament.venueCity,
                  tourSlug: nextTournament.tourSlug,
                }}
              />
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Check back soon for upcoming events
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

export function LiveRightNow() {
  const { data: liveTournaments, isLoading } = useLiveRightNow();

  // Show empty state with "Up Next" when no live tournaments
  if (!isLoading && (!liveTournaments || liveTournaments.length === 0)) {
    return <NoLiveEventsState />;
  }

  if (isLoading) {
    return (
      <section className="py-4">
        <div className="flex items-center gap-2 px-4 mb-3">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <Skeleton className="h-4 w-28" />
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2].map(i => (
            <Skeleton key={i} className="flex-shrink-0 w-[280px] h-[140px] rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="py-4">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 mb-3">
        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Live Right Now
        </h2>
      </div>

      {/* Horizontal Scroll Cards */}
      <div className="flex gap-3 px-4 overflow-x-auto scrollbar-hide pb-2 -webkit-overflow-scrolling-touch">
        {liveTournaments!.map((tournament, idx) => (
          <LiveTournamentCard 
            key={tournament.id} 
            tournament={tournament} 
            index={idx} 
          />
        ))}
      </div>
    </section>
  );
}