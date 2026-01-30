/**
 * HeroCarousel - Auto-rotating cinematic carousel for live/upcoming tournaments
 * Full-bleed with Ken Burns animation, crossfade transitions
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { LiveIndicator } from '../premium/LiveIndicator';
import { 
  useLiveTournaments, 
  useUpcomingTournaments, 
  useTournamentLeader,
  TOUR_CONFIG,
  type TourTournament 
} from '../../hooks/useOverviewData';
import { format, differenceInDays, isToday, isTomorrow } from 'date-fns';

interface CarouselSlide {
  tournament: TourTournament;
  type: 'live' | 'upcoming';
}

function formatPurse(purse: number | null): string {
  if (!purse) return '';
  if (purse >= 1000000) {
    return `$${(purse / 1000000).toFixed(purse % 1000000 === 0 ? 0 : 1)}M`;
  }
  return `$${(purse / 1000).toFixed(0)}K`;
}

function getStartLabel(date: string): string {
  const startDate = new Date(date);
  if (isToday(startDate)) return 'Starts Today';
  if (isTomorrow(startDate)) return 'Starts Tomorrow';
  const days = differenceInDays(startDate, new Date());
  if (days <= 7) return `Starts in ${days} days`;
  return format(startDate, 'MMM d');
}

// Individual slide component
function HeroSlide({ slide, isActive }: { slide: CarouselSlide; isActive: boolean }) {
  const { tournament, type } = slide;
  const tourConfig = TOUR_CONFIG[tournament.tourSlug] || TOUR_CONFIG.pga;
  
  // Fetch leader for live tournaments
  const { data: leader } = useTournamentLeader(type === 'live' ? tournament.id : undefined);

  // Random gradient for background when no image
  const gradients = [
    'from-emerald-900 via-emerald-800 to-slate-900',
    'from-blue-900 via-indigo-800 to-slate-900',
    'from-amber-900 via-orange-800 to-slate-900',
    'from-purple-900 via-violet-800 to-slate-900',
  ];
  const bgGradient = gradients[tournament.name.length % gradients.length];

  return (
    <motion.div
      className="absolute inset-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Background with Ken Burns */}
      <motion.div
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          bgGradient
        )}
        initial={{ scale: 1 }}
        animate={{ scale: isActive ? 1.08 : 1 }}
        transition={{ duration: 12, ease: 'linear' }}
      >
        {/* Course pattern overlay */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
          }}
        />
      </motion.div>

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 via-transparent to-black/50" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-6 pb-16">
        {/* Tour Badge + Status */}
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="px-3 py-1.5 rounded-full text-xs font-bold text-white flex items-center gap-1.5"
            style={{ backgroundColor: tourConfig.color }}
          >
            <span>{tourConfig.emoji}</span>
            <span>{tourConfig.name.toUpperCase()}</span>
          </div>
          
          {type === 'live' ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 backdrop-blur-sm border border-red-500/30">
              <LiveIndicator size="sm" />
              <span className="text-xs font-bold text-red-400">LIVE</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-xs font-medium text-white/80">
              {getStartLabel(tournament.startDate)}
            </div>
          )}
        </div>

        {/* Glass Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-5 max-w-md">
          {/* Tournament Name */}
          <h2 className="text-2xl font-bold text-white mb-2 leading-tight">
            {tournament.name}
          </h2>
          
          {/* Venue */}
          <div className="flex items-center gap-2 text-white/70 text-sm mb-4">
            <MapPin className="h-4 w-4" />
            <span>{tournament.venueName}</span>
            {tournament.venueCity && (
              <>
                <span className="text-white/40">•</span>
                <span>{tournament.venueCity}</span>
              </>
            )}
          </div>

          {/* Leader (if live) */}
          {type === 'live' && leader && (
            <div className="bg-emerald-500/20 rounded-xl p-3 mb-4 border border-emerald-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🥇</span>
                  <span className="font-semibold text-white">{leader.player.firstName[0]}. {leader.player.lastName}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-emerald-400">{leader.scoreDisplay}</span>
                  {leader.thru && (
                    <>
                      <span className="text-white/40">|</span>
                      <span className="text-white/70">Thru {leader.thru}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-3 text-sm text-white/60 mb-4">
            {tournament.purse && (
              <span>{formatPurse(tournament.purse)} Purse</span>
            )}
            {tournament.venuePar && (
              <>
                <span className="text-white/30">•</span>
                <span>Par {tournament.venuePar}</span>
              </>
            )}
            {tournament.venueYardage && (
              <>
                <span className="text-white/30">•</span>
                <span>{tournament.venueYardage.toLocaleString()} yds</span>
              </>
            )}
          </div>

          {/* CTA */}
          <Link to={`/tourhub/tournament/${tournament.id}`}>
            <motion.button
              className="flex items-center gap-2 px-4 py-2.5 bg-white text-slate-900 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              View Tournament
              <ChevronRight className="h-4 w-4" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function HeroCarousel() {
  const { data: liveTournaments, isLoading: liveLoading } = useLiveTournaments();
  const { data: upcomingTournaments, isLoading: upcomingLoading } = useUpcomingTournaments(7);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Build slides array (live first, then upcoming)
  const slides: CarouselSlide[] = [
    ...(liveTournaments || []).map(t => ({ tournament: t, type: 'live' as const })),
    ...(upcomingTournaments || []).slice(0, 3).map(t => ({ tournament: t, type: 'upcoming' as const })),
  ].slice(0, 5); // Max 5 slides

  // Auto-advance
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;
    
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length, isPaused]);

  // Reset index when slides change
  useEffect(() => {
    if (currentIndex >= slides.length) {
      setCurrentIndex(0);
    }
  }, [slides.length, currentIndex]);

  const isLoading = liveLoading || upcomingLoading;

  if (isLoading) {
    return (
      <div className="relative h-[85vh] min-h-[500px] bg-slate-900 animate-pulse">
        <div className="absolute bottom-6 left-6 right-6">
          <div className="h-8 w-32 bg-white/10 rounded-full mb-4" />
          <div className="bg-white/10 rounded-2xl h-64 max-w-md" />
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className="relative h-[60vh] min-h-[400px] bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center text-white/60">
          <p className="text-lg mb-2">No active tournaments</p>
          <p className="text-sm">Check back soon for upcoming events</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="relative h-[85vh] min-h-[500px] max-h-[700px] overflow-hidden"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      <AnimatePresence mode="sync">
        {slides.map((slide, index) => (
          <HeroSlide
            key={slide.tournament.id}
            slide={slide}
            isActive={index === currentIndex}
          />
        ))}
      </AnimatePresence>

      {/* Pagination Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex 
                  ? "w-6 bg-white" 
                  : "bg-white/40 hover:bg-white/60"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
