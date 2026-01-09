/**
 * FeaturedMomentCard - Tournament Spotlight with cinematic image band
 */

import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapPin, Trophy, Zap, Calendar, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TourTournament } from '../../hooks/useTourHubData';

interface FeaturedMomentCardProps {
  tournament: TourTournament;
  type: 'live' | 'recent' | 'upcoming';
  imageUrl?: string;
}

// Cinematic gradient patterns for fallback
const cinematicGradients = [
  'from-emerald-900/90 via-emerald-800/70 to-teal-900/80',
  'from-slate-900/90 via-slate-800/70 to-zinc-900/80',
  'from-amber-900/80 via-orange-900/60 to-yellow-900/70',
];

export function FeaturedMomentCard({ tournament, type, imageUrl }: FeaturedMomentCardProps) {
  const labelConfig = {
    live: { text: 'Live Now', icon: <Zap className="w-4 h-4" />, className: 'bg-emerald-500 text-white animate-pulse' },
    recent: { text: 'Most Recent', icon: <Trophy className="w-4 h-4" />, className: 'bg-amber-500/90 text-white' },
    upcoming: { text: 'Next Up', icon: <Calendar className="w-4 h-4" />, className: 'bg-primary/90 text-primary-foreground' },
  };

  const label = labelConfig[type];
  const gradientIndex = tournament.name.length % cinematicGradients.length;

  return (
    <Link
      to={`/tourhub/tournament/${tournament.id}`}
      className="group block relative overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-primary/40 hover:shadow-xl"
    >
      {/* Image/Gradient Band */}
      <div className="relative h-24 sm:h-28 overflow-hidden">
        {imageUrl ? (
          <>
            <img 
              src={imageUrl} 
              alt={tournament.venue_name || tournament.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
          </>
        ) : (
          <>
            {/* Cinematic gradient fallback */}
            <div className={cn(
              "absolute inset-0 bg-gradient-to-br",
              cinematicGradients[gradientIndex]
            )} />
            
            {/* Course texture overlay */}
            <div className="absolute inset-0 opacity-10">
              <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice">
                <defs>
                  <pattern id="course-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                    <circle cx="10" cy="10" r="1" fill="white" />
                  </pattern>
                </defs>
                <rect width="400" height="120" fill="url(#course-dots)" />
                <path d="M0 80 Q100 60 200 80 T400 80" fill="none" stroke="white" strokeWidth="0.5" opacity="0.5" />
                <path d="M0 100 Q100 80 200 100 T400 100" fill="none" stroke="white" strokeWidth="0.5" opacity="0.3" />
              </svg>
            </div>
            
            {/* Gradient to card */}
            <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          </>
        )}

        {/* Type Label - positioned on image band */}
        <div className="absolute top-4 left-4">
          <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg",
            label.className
          )}>
            {label.icon}
            {label.text}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 sm:p-6">
        {/* Tournament Name */}
        <h2 className="text-xl sm:text-2xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-tight">
          {tournament.name}
        </h2>

        {/* Dates */}
        <p className="text-sm text-muted-foreground mt-2">
          {format(new Date(tournament.start_date), 'MMM d')} – {format(new Date(tournament.end_date), 'd, yyyy')}
        </p>

        {/* Venue */}
        {(tournament.venue_name || tournament.venue_city) && (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
            <MapPin className="w-4 h-4 shrink-0 text-primary/60" />
            <span className="truncate">
              {[tournament.venue_name, tournament.venue_city, tournament.venue_country].filter(Boolean).join(' • ')}
            </span>
          </div>
        )}

        {/* Stats Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          {tournament.purse && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-medium">
              ${(tournament.purse / 1_000_000).toFixed(1)}M Purse
            </span>
          )}
          {tournament.venue_par && (
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              Par {tournament.venue_par}
            </span>
          )}
          {tournament.venue_yardage && (
            <span className="px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
              {tournament.venue_yardage.toLocaleString()} yds
            </span>
          )}
        </div>

        {/* Defending Champion */}
        {tournament.defending_champion && type === 'recent' && (
          <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm">
                <span className="text-muted-foreground">Champion: </span>
                <span className="font-semibold text-foreground">{tournament.defending_champion}</span>
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>
        )}
      </div>
    </Link>
  );
}
