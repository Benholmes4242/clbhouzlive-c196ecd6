/**
 * ScheduleHeroCard - Premium immersive hero card (world-class polish)
 * 
 * Features:
 * - 230px height, 20px radius
 * - Strong gradient overlay for text legibility
 * - Bold typography: 28-32px, weight 700-800, tight line-height
 * - Glass-effect status badge with subtle blur
 * - Micro-icons next to stats
 * - Chevron tap affordance
 * - Ken Burns subtle zoom animation on load
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Zap, Calendar, Clock, ChevronRight, DollarSign, Flag, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
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
      className: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30',
      pulse: true
    },
    upcoming: { 
      text: 'Next up', 
      icon: <Calendar className="w-3.5 h-3.5" />, 
      className: 'bg-white/20 backdrop-blur-md text-white border border-white/20',
      pulse: false
    },
    recent: { 
      text: 'Most recent', 
      icon: <Clock className="w-3.5 h-3.5" />, 
      className: 'bg-black/50 backdrop-blur-md text-white border border-white/10',
      pulse: false
    },
  };

  const label = labelConfig[type];
  const gradientIndex = tournament.name.length % cinematicGradients.length;
  const hasImage = courseImage?.imageUrl && !imageLoading;

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden mx-4 active:scale-[0.99] transition-transform duration-200"
      style={{ borderRadius: '20px' }}
    >
      {/* Premium hero container */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          height: '230px',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(2, 6, 23, 0.15), 0 8px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Course image with Ken Burns animation or cinematic gradient fallback */}
        {hasImage ? (
          <motion.img 
            src={courseImage.imageUrl!} 
            alt={tournament.venue_name || tournament.name}
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: 'easeOut' }}
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
              </svg>
            </div>
          </>
        )}
        
        {/* Strong gradient overlay - darker from bottom for text legibility */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.08) 100%)',
          }}
        />
        
        {/* Left gradient for extra text legibility */}
        <div 
          className="absolute left-0 top-0 bottom-0"
          style={{
            width: '60%',
            background: 'linear-gradient(90deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 100%)',
          }}
        />

        {/* Type Label - top left with glass effect */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide",
            label.className
          )}>
            {label.pulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
              </span>
            )}
            {!label.pulse && label.icon}
            {label.text}
          </div>
        </div>

        {/* Tap affordance - chevron in circle, bottom right */}
        <div 
          className="absolute right-4 bottom-4 w-8 h-8 rounded-full flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <ChevronRight className="w-4 h-4 text-white transition-transform group-hover:translate-x-0.5" />
        </div>

        {/* Content - bottom of image */}
        <div className="absolute bottom-0 left-0 right-12 p-4 sm:p-5">
          {/* Tournament Name - Bold headline */}
          <h2 
            className="font-extrabold text-white group-hover:text-white/95 transition-colors line-clamp-2 mb-2"
            style={{ 
              fontSize: '28px',
              lineHeight: 1.1,
              letterSpacing: '-0.5px',
              textShadow: '0 4px 12px rgba(0,0,0,0.4)',
            }}
          >
            {tournament.name}
          </h2>

          {/* Dates */}
          <p 
            className="text-sm font-medium text-white/90 mb-2"
            style={{ textShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
          >
            {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
          </p>

          {/* Venue */}
          {(tournament.venue_name || tournament.venue_city) && (
            <div className="flex items-center gap-1.5 text-sm text-white/75 mb-3">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">
                {[tournament.venue_name, tournament.venue_city, tournament.venue_country].filter(Boolean).join(' • ')}
              </span>
            </div>
          )}

          {/* Stats row with micro-icons */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {tournament.purse && (
              <div className="flex items-center gap-1 text-white/90">
                <DollarSign className="w-3.5 h-3.5 opacity-70" />
                <span className="font-semibold">
                  {(tournament.purse / 1_000_000).toFixed(1)}M
                </span>
              </div>
            )}
            {tournament.venue_par && (
              <div className="flex items-center gap-1 text-white/75">
                <Flag className="w-3.5 h-3.5 opacity-70" />
                <span>Par {tournament.venue_par}</span>
              </div>
            )}
            {tournament.venue_yardage && (
              <div className="flex items-center gap-1 text-white/75">
                <Ruler className="w-3.5 h-3.5 opacity-70" />
                <span>{tournament.venue_yardage.toLocaleString()} yds</span>
              </div>
            )}
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
