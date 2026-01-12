/**
 * ScheduleHeroCard - Full-width immersive hero (card-free design)
 * 
 * Features:
 * - Edge-to-edge cinematic image (50vh / 300px min)
 * - Strong gradient overlay for text legibility
 * - White text on image
 * - No card container, border, or shadow
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Zap, Calendar, Clock, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';
import { useSingleCourseImage } from '../../hooks/useCourseImageResolver';

interface ScheduleHeroCardProps {
  tournament: TourTournament;
  type: 'live' | 'upcoming' | 'recent';
}

// Cinematic gradient patterns for fallback
const cinematicGradients = [
  'from-emerald-900 via-emerald-800 to-teal-900',
  'from-slate-900 via-slate-800 to-zinc-900',
  'from-amber-900 via-orange-900 to-yellow-900',
];

export function ScheduleHeroCard({ tournament, type }: ScheduleHeroCardProps) {
  // Resolve course image for the tournament venue
  const { courseImage, isLoading: imageLoading } = useSingleCourseImage(
    tournament.venue_name ? {
      venueName: tournament.venue_name,
      city: tournament.venue_city,
      country: tournament.venue_country,
    } : null
  );

  const labelConfig = {
    live: { 
      text: 'Live now', 
      icon: <Zap className="w-3.5 h-3.5" />, 
      className: 'bg-emerald-500 text-white',
      pulse: true
    },
    upcoming: { 
      text: 'Next up', 
      icon: <Calendar className="w-3.5 h-3.5" />, 
      className: 'bg-white/20 backdrop-blur-sm text-white',
      pulse: false
    },
    recent: { 
      text: 'Most recent', 
      icon: <Clock className="w-3.5 h-3.5" />, 
      className: 'bg-black/60 backdrop-blur-sm text-white',
      pulse: false
    },
  };

  const label = labelConfig[type];
  const gradientIndex = tournament.name.length % cinematicGradients.length;
  const hasImage = courseImage?.imageUrl && !imageLoading;

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden"
    >
      {/* Full-width immersive image container */}
      <div className="relative h-[50vh] min-h-[300px] max-h-[400px] overflow-hidden">
        {/* Course image or cinematic gradient fallback */}
        {hasImage ? (
          <img 
            src={courseImage.imageUrl!} 
            alt={tournament.venue_name || tournament.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <>
            {/* Cinematic gradient fallback */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              cinematicGradients[gradientIndex]
            )} />
            
            {/* Course texture overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="schedule-hero-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="400" height="300" fill="url(#schedule-hero-dots)" />
                <path d="M0 180 Q100 150 200 180 T400 180" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
                <path d="M0 220 Q100 190 200 220 T400 220" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </div>
          </>
        )}
        
        {/* Strong gradient overlay from bottom for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

        {/* Type Label - top left */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium",
            label.className,
            label.pulse && "animate-pulse"
          )}>
            {label.icon}
            {label.text}
          </div>
        </div>

        {/* Content - bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          {/* Tournament Name */}
          <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-white/90 transition-colors line-clamp-2 leading-tight mb-2">
            {tournament.name}
          </h2>

          {/* Dates */}
          <p className="text-sm text-white/80 mb-2">
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </p>

          {/* Venue */}
          {(tournament.venue_name || tournament.venue_city) && (
            <div className="flex items-center gap-1.5 text-sm text-white/70 mb-4">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {[tournament.venue_name, tournament.venue_city, tournament.venue_country].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}

          {/* Stats and CTA row */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-white/90">
              {tournament.purse && (
                <span className="font-semibold">
                  ${(tournament.purse / 1_000_000).toFixed(1)}M
                </span>
              )}
              {tournament.venue_par && (
                <span className="text-white/70">Par {tournament.venue_par}</span>
              )}
              {tournament.venue_yardage && (
                <span className="text-white/70">{tournament.venue_yardage.toLocaleString()} yds</span>
              )}
            </div>
            
            {/* View details link */}
            <div className="flex items-center gap-1 text-white/80 text-sm font-medium group-hover:text-white transition-colors">
              <span>View details</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Helper to determine which tournament to feature
export function getFeaturedTournament(
  tournaments: TourTournament[]
): { tournament: TourTournament; type: 'live' | 'upcoming' | 'recent' } | null {
  if (!tournaments || tournaments.length === 0) return null;

  const now = new Date();

  // Priority 1: Live tournament
  const live = tournaments.find(t => t.status === 'inprogress');
  if (live) return { tournament: live, type: 'live' };

  // Priority 2: Next upcoming
  const upcoming = tournaments
    .filter(t => t.status === 'scheduled' || t.status === 'created')
    .filter(t => new Date(t.start_date) >= now)
    .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
  if (upcoming.length > 0) return { tournament: upcoming[0], type: 'upcoming' };

  // Priority 3: Most recent completed
  const completed = tournaments
    .filter(t => t.status === 'closed')
    .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime());
  if (completed.length > 0) return { tournament: completed[0], type: 'recent' };

  // Fallback: first tournament
  return { tournament: tournaments[0], type: 'upcoming' };
}
